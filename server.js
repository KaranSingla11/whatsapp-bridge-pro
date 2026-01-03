
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

const app = express();
app.use(cors());
app.use(bodyParser.json());

const SESSIONS_DIR = './sessions';
if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR);

const sessions = new Map();
const messageLogs = new Map(); // Store recent messages for each instanceId
const apiKeys = new Set(['wa_live_demo_key_123']); // Mock DB for internal API keys

// --- HELPER FOR LOGGING MESSAGES ---
function logMessage(instanceId, direction, to, content) {
    if (!messageLogs.has(instanceId)) {
        messageLogs.set(instanceId, []);
    }
    const logs = messageLogs.get(instanceId);
    logs.unshift({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        direction, // 'sent' | 'received'
        to,
        content,
        timestamp: new Date().toISOString()
    });
    // Keep only last 50 messages
    if (logs.length > 50) logs.pop();
}

// --- WHATSAPP BRIDGE LOGIC ---

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

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) sessions.get(sessionId).qr = qr;

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) createWhatsAppSession(sessionId);
            else {
                sessions.delete(sessionId);
                if(fs.existsSync(sessionPath)) fs.rmSync(sessionPath, { recursive: true, force: true });
            }
        } else if (connection === 'open') {
            sessions.get(sessionId).status = 'connected';
            sessions.get(sessionId).qr = null;
        }
    });

    // Handle incoming messages for logging
    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if (!msg.key.fromMe && m.type === 'notify') {
            const content = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "Media Message";
            const from = msg.key.remoteJid;
            logMessage(sessionId, 'received', from, content);
        }
    });

    sock.ev.on('creds.update', saveCreds);
    return sock;
}

// --- UNIFIED API ENDPOINTS ---

// 1. Bridge QR Pairing
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

// 2. Fetch Recent Messages for an Instance
app.get('/instances/:id/messages', (req, res) => {
    const { id } = req.params;
    const logs = messageLogs.get(id) || [];
    res.json(logs);
});

// 3. Official Cloud API Verification Proxy
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

// 4. Unified Message Sending Endpoint
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

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 BridgePro Backend: http://localhost:${PORT}`));
