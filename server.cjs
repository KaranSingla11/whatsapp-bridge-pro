/**
 * WHATSAPP BRIDGE PRO - UNIFIED BACKEND SERVER (Node.js)
 * Dependencies: npm install @whiskeysockets/baileys express axios cors body-parser
 */

const { 
    makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion 
} = require('@whiskeysockets/baileys');
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

// Import auto-reply manager (with fallback if missing)
let autoReplyManager;
try {
  autoReplyManager = require('./auto-reply-manager.cjs');
} catch (err) {
  console.warn('Warning: auto-reply-manager.cjs not found, creating minimal version...');
  // Fallback implementation
  autoReplyManager = {
    rules: [],
    load: () => {},
    save: () => {},
    addRule: (rule) => { rule.id = 'ar_' + Date.now(); return rule; },
    updateRule: (id, updates) => null,
    deleteRule: (id) => true,
    getByInstance: (instanceId) => [],
    getAll: () => [],
    checkMatch: (rule, message) => false
  };
}

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const SESSIONS_DIR = './sessions';
if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR);

const sessions = new Map();
const messageLogs = new Map(); // Store recent messages for each instanceId
// SSE clients per instanceId
const sseClients = new Map();

// API Keys persistence
const KEYS_FILE = './api_keys.json';
const apiKeys = new Set();

function loadApiKeys() {
    if (fs.existsSync(KEYS_FILE)) {
        try {
            const data = JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
            data.forEach(k => apiKeys.add(k));
            console.log(`Loaded ${data.length} API keys from disk`);
        } catch (e) {
            console.error('Error loading API keys:', e.message);
        }
    }
    // Always include demo keys
    apiKeys.add('wa_live_demo_key_123');
    apiKeys.add('12345678-1234-1234-1234-123456789012');
}

function saveApiKeys() {
    try {
        const keys = Array.from(apiKeys).filter(k => !k.startsWith('wa_live_demo') && !k.includes('1234'));
        fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2));
    } catch (e) {
        console.error('Error saving API keys:', e.message);
    }
}

function addApiKey(key) {
    apiKeys.add(key);
    saveApiKeys();
}

loadApiKeys();

// Instances persistence
const INSTANCES_FILE = './instances.json';
const instances = new Map();

function loadInstances() {
    if (fs.existsSync(INSTANCES_FILE)) {
        try {
            const data = JSON.parse(fs.readFileSync(INSTANCES_FILE, 'utf8'));
            for (const inst of data) {
                instances.set(inst.id, inst);
            }
            console.log(`Loaded ${data.length} instances from disk`);
        } catch (e) {
            console.error('Error loading instances:', e.message);
        }
    }
}

function saveInstances() {
    try {
        fs.writeFileSync(INSTANCES_FILE, JSON.stringify([...instances.values()], null, 2));
    } catch (e) {
        console.error('Error saving instances:', e.message);
    }
}

function updateInstanceStatus(sessionId, status, data = {}) {
    let inst = instances.get(sessionId);
    if (!inst) {
        inst = {
            id: sessionId,
            name: `Instance ${sessionId.slice(0, 8)}`,
            type: 'web_bridge',
            phoneNumber: null,
            status,
            createdAt: new Date().toISOString(),
            lastActive: new Date().toISOString(),
            messagesSent: 0,
            ...data
        };
    } else {
        inst.status = status;
        inst.lastActive = new Date().toISOString();
    }
    instances.set(sessionId, inst);
    saveInstances();
}

loadInstances();

// Helper to extract and format phone number from JID
function formatPhoneNumber(jid) {
    if (!jid) return jid;
    // Extract phone number from "177773058519141@lid" format
    const phoneOnly = jid.split('@')[0];
    // If it's a long number like India format, try to format it as +91-XXXXXXXXXX
    if (phoneOnly.length >= 10) {
        // For now, just return with + prefix if it doesn't have it
        return phoneOnly.startsWith('+') ? phoneOnly : `+${phoneOnly}`;
    }
    return phoneOnly;
}

function logMessage(instanceId, direction, to, content) {
    if (!messageLogs.has(instanceId)) {
        messageLogs.set(instanceId, []);
    }
    const logs = messageLogs.get(instanceId);
    const formattedPhone = formatPhoneNumber(to);
    const newLog = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        direction,
        to: formattedPhone,  // Store formatted phone number
        content,
        timestamp: new Date().toISOString()
    };
    logs.unshift(newLog);
    if (logs.length > 50) logs.pop();

    // Broadcast to SSE clients for this instance
    if (sseClients.has(instanceId)) {
        const clients = sseClients.get(instanceId);
        for (const res of clients) {
            try {
                res.write(`data: ${JSON.stringify(newLog)}\n\n`);
            } catch (e) {
                // ignore
            }
        }
    }

    // Update instance activity
    if (direction === 'sent') {
        const inst = instances.get(instanceId);
        if (inst) {
            inst.messagesSent = (inst.messagesSent || 0) + 1;
            inst.lastActive = new Date().toISOString();
            saveInstances();
        }
    }
}

async function createWhatsAppSession(sessionId) {
    const sessionPath = path.join(SESSIONS_DIR, sessionId);
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true,
        browser: ["BridgePro", "Chrome", "1.0.0"]
    });

    sessions.set(sessionId, { sock, status: 'connecting', qr: null, type: 'web_bridge' });
    updateInstanceStatus(sessionId, 'connecting');

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) sessions.get(sessionId).qr = qr;

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) createWhatsAppSession(sessionId);
            else {
                updateInstanceStatus(sessionId, 'disconnected');
                sessions.delete(sessionId);
            }
        } else if (connection === 'open') {
            sessions.get(sessionId).status = 'connected';
            sessions.get(sessionId).qr = null;
            updateInstanceStatus(sessionId, 'connected');
        }
    });

    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if (!msg.key.fromMe && m.type === 'notify') {
            const content = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "Media Message";
            const from = msg.key.remoteJid;
            logMessage(sessionId, 'received', from, content);

            // Check for auto-reply rules
            try {
                const rules = autoReplyManager.getByInstance(sessionId);
                for (const rule of rules) {
                    // Check if from number matches (if specified)
                    if (rule.fromNumber && !from.includes(rule.fromNumber)) {
                        continue;
                    }

                    // Check if message matches trigger
                    if (autoReplyManager.checkMatch(rule, content)) {
                        // Send auto-reply
                        await sock.sendMessage(from, { text: rule.replyMessage });
                        console.log(`✅ Auto-reply sent to ${from}`);
                        break; // Only send one auto-reply per message
                    }
                }
            } catch (err) {
                console.error('Error processing auto-reply:', err);
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);
    return sock;
}

// List all instances with live status
app.get('/instances', (req, res) => {
    const instList = [...instances.values()].map(inst => ({
        ...inst,
        session: sessions.has(inst.id) ? { status: sessions.get(inst.id).status, hasQr: !!sessions.get(inst.id).qr } : null
    }));
    res.json(instList);
});

// API Keys endpoint - get all keys
app.get('/api/keys', (req, res) => {
    res.json({ keys: Array.from(apiKeys) });
});

// API Keys endpoint - generate new key
app.post('/api/keys/generate', async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    
    const newKey = `wa_live_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 12)}`;
    addApiKey(newKey);
    
    res.json({ 
        success: true, 
        key: newKey,
        message: 'API key generated successfully. Use this key with the /send/text endpoint.' 
    });
});

// Create a new instance and start session
app.post('/instances', async (req, res) => {
    const { name, type = 'web_bridge' } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const id = 'inst_' + Date.now().toString(36) + Math.random().toString(36).slice(2);
    updateInstanceStatus(id, 'connecting', { name, type });
    await createWhatsAppSession(id);
    await new Promise(r => setTimeout(r, 1500));
    const session = sessions.get(id);
    res.json({ id, status: session?.status, qr: session?.qr });
});

// Delete instance endpoint
app.delete('/instances/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        // Remove from instances map
        instances.delete(id);
        
        // Save instances to file
        saveInstances();
        
        // Close WhatsApp session if exists
        const sock = sessions.get(id);
        if (sock && sock.ws) {
            try {
                await sock.ws.close();
            } catch (e) {
                console.error(`Error closing socket for ${id}:`, e.message);
            }
        }
        sessions.delete(id);
        
        // Clean up message logs
        messageLogs.delete(id);
        
        // Clean up SSE clients
        const clients = sseClients.get(id);
        if (clients) {
            clients.forEach(client => {
                try { client.end(); } catch (e) {}
            });
        }
        sseClients.delete(id);
        
        // Clean up auto-reply rules for this instance
        try {
            const rules = autoReplyManager.getByInstance(id);
            for (const rule of rules) {
                autoReplyManager.deleteRule(rule.id);
            }
        } catch (e) {
            console.error(`Error cleaning up auto-replies for ${id}:`, e.message);
        }
        
        res.json({ success: true, message: `Instance ${id} deleted` });
    } catch (error) {
        console.error(`Error deleting instance ${id}:`, error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/instances/:id/qr', async (req, res) => {
    const { id } = req.params;
    let session = sessions.get(id);
    if (!session) {
        await createWhatsAppSession(id);
        await new Promise(r => setTimeout(r, 1500));
        session = sessions.get(id);
    }
    res.json({ qr: session?.qr, status: session?.status });
});

app.get('/instances/:id/messages', (req, res) => {
    const { id } = req.params;
    const logs = messageLogs.get(id) || [];
    res.json(logs);
});

// Server-Sent Events stream for realtime messages
app.get('/instances/:id/messages/stream', (req, res) => {
    const { id } = req.params;

    // Headers for SSE
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*'
    });

    // ensure set exists
    if (!sseClients.has(id)) sseClients.set(id, new Set());
    const clients = sseClients.get(id);
    clients.add(res);

    // send existing logs (oldest first)
    const existing = (messageLogs.get(id) || []).slice().reverse();
    for (const m of existing) {
        try { res.write(`data: ${JSON.stringify(m)}\n\n`); } catch (e) {}
    }

    // heartbeat
    const ping = setInterval(() => {
        try { res.write(':ping\n\n'); } catch (e) {}
    }, 20000);

    req.on('close', () => {
        clearInterval(ping);
        clients.delete(res);
    });
});

// Chat Widget Embed Script 
app.get('/embed/chat-widget.js', (req, res) => {
    const apiKey = req.query.apiKey;
    const instanceId = req.query.instanceId;
    const apiUrl = req.query.apiUrl || 'http://localhost:3000';

    if (!apiKey || !instanceId) {
        return res.status(400).json({ error: 'Missing apiKey or instanceId' });
    }

    // Validate API key
    if (!apiKeys.has(apiKey)) {
        return res.status(401).json({ error: 'Invalid API key' });
    }

    // Verify instance exists
    let instances = [];
    try {
        if (fs.existsSync('./instances.json')) {
            instances = JSON.parse(fs.readFileSync('./instances.json', 'utf8'));
        }
    } catch (e) {
        console.error('Error loading instances:', e.message);
    }

    const instanceExists = instances.some(i => i.id === instanceId);
    if (!instanceExists) {
        return res.status(404).json({ error: 'Instance not found' });
    }

    // Serve the chat widget script
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Read the chat widget file
    const widgetPath = path.join(__dirname, 'public', 'chat-widget.js');
    let widgetCode = fs.readFileSync(widgetPath, 'utf8');

    // Inject parameters into the script
    widgetCode = widgetCode.replace(
        `const apiBaseUrl = params.get('apiUrl') || 'http://localhost:3000';`,
        `const apiBaseUrl = '${apiUrl}';`
    );

    res.send(widgetCode);
});

app.post('/instances/cloud/verify', async (req, res) => {
    const { phoneNumberId, accessToken } = req.body;
    try {
        const response = await axios.get(`https://graph.facebook.com/v17.0/${phoneNumberId}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        res.json({ success: true, data: response.data });
    } catch (err) {
        res.status(400).json({ success: false, error: err.response?.data || err.message });
    }
});

app.post('/api/v1/messages/send', async (req, res) => {
    const apiKey = req.headers['authorization']?.split(' ')[1];
    const { instanceId, to, message, type, config } = req.body; 

    if (!apiKeys.has(apiKey)) return res.status(401).json({ error: 'Invalid Internal API Key' });

    if (type === 'web_bridge') {
        const session = sessions.get(instanceId);
        if (!session || session.status !== 'connected') return res.status(400).json({ error: 'Bridge instance not connected' });
        
        try {
            const jid = `${to.replace(/\D/g, '')}@s.whatsapp.net`;
            await session.sock.sendMessage(jid, { text: message });
            logMessage(instanceId, 'sent', to, message);
            return res.json({ success: true, method: 'bridge' });
        } catch (err) {
            return res.status(500).json({ error: 'Bridge sending failed', details: err.message });
        }
    } else if (type === 'cloud_api') {
        const { phoneNumberId, accessToken } = config;
        try {
            const response = await axios.post(`https://graph.facebook.com/v17.0/${phoneNumberId}/messages`, {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: to.replace(/\D/g, ''),
                type: "text",
                text: { body: message }
            }, {
                headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
            });
            logMessage(instanceId, 'sent', to, message);
            return res.json({ success: true, method: 'cloud_api', response: response.data });
        } catch (err) {
            return res.status(500).json({ error: 'Cloud API sending failed', details: err.response?.data || err.message });
        }
    }

    res.status(400).json({ error: 'Unsupported instance type' });
});

// New API endpoint matching the curl format: /send/text?access_token=...&instance_id=...&to=...&message=...
app.get('/send/text', async (req, res) => {
    const { access_token, instance_id, to, message, reply_message_id } = req.query;

    // Validate required parameters
    if (!access_token || !instance_id || !to || !message) {
        return res.status(400).json({ 
            success: false, 
            error: 'Missing required parameters: access_token, instance_id, to, message' 
        });
    }

    // Validate access token
    if (!apiKeys.has(access_token)) {
        return res.status(401).json({ 
            success: false, 
            error: 'Invalid access_token' 
        });
    }

    try {
        const session = sessions.get(instance_id);
        
        // Check if instance exists and is connected
        if (!session || session.status !== 'connected') {
            return res.status(400).json({ 
                success: false, 
                error: 'Instance not connected or does not exist',
                instance_status: session?.status || 'not_found'
            });
        }

        // Format phone number for WhatsApp JID
        const phoneOnly = to.replace(/\D/g, '');
        const jid = `${phoneOnly}@s.whatsapp.net`;

        // Send message
        const messageResult = await session.sock.sendMessage(jid, { text: message });
        
        // Log the message
        logMessage(instance_id, 'sent', to, message);

        // Return success response
        return res.json({ 
            success: true,
            message: 'Message sent successfully',
            message_id: messageResult?.key?.id,
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        console.error('Error sending message:', err);
        return res.status(500).json({ 
            success: false,
            error: 'Failed to send message',
            details: err.message 
        });
    }
});

// Debug endpoint: emit a test message for an instance (useful for testing SSE)
app.post('/debug/instances/:id/messages', (req, res) => {
    const { id } = req.params;
    const { content, direction = 'received', to = 'debug' } = req.body || {};
    if (!content) return res.status(400).json({ error: 'content required' });
    logMessage(id, direction, to, content);
    res.json({ ok: true });
});

// ============ AUTO-REPLY ENDPOINTS ============

// Get all auto-reply rules
app.get('/auto-reply', (req, res) => {
    const rules = autoReplyManager.getAll();
    res.json({ rules });
});

// Create new auto-reply rule
app.post('/auto-reply', (req, res) => {
    try {
        const rule = autoReplyManager.addRule(req.body);
        res.json({ success: true, rule });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Update auto-reply rule
app.put('/auto-reply/:id', (req, res) => {
    try {
        const rule = autoReplyManager.updateRule(req.params.id, req.body);
        if (!rule) return res.status(404).json({ error: 'Rule not found' });
        res.json({ success: true, rule });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete auto-reply rule
app.delete('/auto-reply/:id', (req, res) => {
    try {
        autoReplyManager.deleteRule(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;

// Serve frontend SPA with fallback to index.html
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
    // Serve static assets (CSS, JS, images, etc) - but NOT index.html for all routes
    app.use('/assets', express.static(path.join(distPath, 'assets')));
    app.use('/favicon', express.static(path.join(distPath, 'favicon')));
    
    // Serve specific static files
    app.get(/\.(js|css|json|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/, (req, res) => {
        res.sendFile(path.join(distPath, req.path));
    });
    
    // SPA fallback: serve index.html for all non-API routes
    app.get(/^\/(?!api|instances|send|health|auto-reply|debug).*$/, (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'), (err) => {
            if (err) res.status(404).send('Not found');
        });
    });
}

app.listen(PORT, () => console.log(`🚀 BridgePro Backend: http://localhost:${PORT}`));
