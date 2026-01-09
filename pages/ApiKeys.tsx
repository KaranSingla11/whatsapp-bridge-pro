
import React, { useState } from 'react';
import { Key, Plus, Copy, Trash2, Shield, Eye, EyeOff, Check, Terminal, MessageCircle, Code } from 'lucide-react';
import { ApiKey } from '../types';
import { API_BASE } from '../config';

interface ApiKeysProps {
  apiKeys: ApiKey[];
  setApiKeys: React.Dispatch<React.SetStateAction<ApiKey[]>>;
}

const ApiKeys: React.FC<ApiKeysProps> = ({ apiKeys, setApiKeys }) => {
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showEmbedCode, setShowEmbedCode] = useState<string | null>(null);
  const [selectedInstance, setSelectedInstance] = useState<string>('');

  const toggleShow = (id: string) => {
    setShowKey(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const createKey = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch(`${API_BASE}/api/keys/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Integration Key ' + (apiKeys.length + 1) })
      });
      
      if (res.ok) {
        const data = await res.json();
        const newKey: ApiKey = {
          id: `key_${data.key.replace(/[^a-zA-Z0-9]/g, '_')}`, // Use the actual key to create a stable ID
          name: 'Integration Key ' + (apiKeys.length + 1),
          key: data.key,
          createdAt: new Date().toISOString().split('T')[0],
          lastUsed: null,
          status: 'active',
          requestCount: 0
        };
        setApiKeys(prev => [...prev, newKey]);
        // The parent component will handle localStorage persistence
      } else {
        alert('Failed to generate API key');
      }
    } catch (err) {
      console.error('Error generating API key:', err);
      alert('Error generating API key');
    } finally {
      setIsGenerating(false);
    }
  };

  const removeKey = async (id: string) => {
    const keyToRemove = apiKeys.find(k => k.id === id);
    if (!keyToRemove) return;

    try {
      // Call backend to delete the API key
      const res = await fetch(`${API_BASE}/api/keys/${encodeURIComponent(keyToRemove.key)}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        // Remove from local state only after successful backend deletion
        setApiKeys(prev => prev.filter(k => k.id !== id));
        console.log(`API key ${keyToRemove.key} deleted successfully`);
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('Failed to delete API key from backend:', res.status, errorData);
        alert(`Failed to delete API key: ${errorData.error || res.statusText}`);
      }
    } catch (err) {
      console.error('Error deleting API key:', err);
      alert(`Error deleting API key: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900">API Access</h1>
          <p className="text-sm text-slate-500 font-medium">Secure external integrations.</p>
        </div>
        <button 
          onClick={createKey}
          disabled={isGenerating}
          className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all shadow-xl shadow-slate-200 self-start sm:self-auto"
        >
          <Plus size={18} className="text-[#25D366]" />
          <span>{isGenerating ? 'Generating...' : 'Generate Key'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {apiKeys.map((key) => (
          <div key={key.id} className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-slate-100 flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                  <Key size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-800 text-sm lg:text-base truncate">{key.name}</h3>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-0.5">Created {key.createdAt}</p>
                </div>
              </div>
              <button 
                onClick={() => removeKey(key.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 relative overflow-hidden">
                <span className="font-mono text-xs text-slate-600 block truncate flex-1">
                  {showKey[key.id] ? key.key : '••••••••••••••••••••••••'}
                </span>
                <div className="flex items-center space-x-1 ml-2">
                  <button onClick={() => toggleShow(key.id)} className="p-1.5 text-slate-400 hover:text-slate-600">
                    {showKey[key.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button onClick={() => copyToClipboard(key.key, key.id)} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors">
                    {copied === key.id ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
              <div className="text-right sm:min-w-[100px] shrink-0">
                <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Last Activity</p>
                <p className="text-xs font-bold text-slate-700">{key.lastUsed || 'Inactive'}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chat Widget Embed Section */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl lg:rounded-[2.5rem] p-6 lg:p-8 border border-green-200 shadow-sm">
        <div className="flex items-start space-x-4 mb-6">
          <div className="p-3 bg-green-100 text-green-600 rounded-xl shrink-0">
            <MessageCircle size={24} />
          </div>
          <div>
            <h3 className="text-lg lg:text-xl font-black text-slate-900">WhatsApp Chat Widget</h3>
            <p className="text-sm text-slate-600 font-medium mt-1">Embed a chatbot on your website - Similar to Tawk.to</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black text-slate-600 uppercase tracking-wider block mb-2">Select API Key</label>
              <select 
                value={showEmbedCode || ''}
                onChange={(e) => {
                  setShowEmbedCode(e.target.value);
                  setSelectedInstance('');
                }}
                className="w-full px-4 py-2.5 border border-green-200 rounded-xl font-semibold text-sm focus:ring-4 focus:ring-green-200 outline-none"
              >
                <option value="">Choose an API Key...</option>
                {apiKeys.map(key => (
                  <option key={key.id} value={key.key}>{key.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-black text-slate-600 uppercase tracking-wider block mb-2">Instance ID</label>
              <input 
                type="text"
                placeholder="e.g., inst_abc123def456"
                value={selectedInstance}
                onChange={(e) => setSelectedInstance(e.target.value)}
                className="w-full px-4 py-2.5 border border-green-200 rounded-xl font-semibold text-sm focus:ring-4 focus:ring-green-200 outline-none"
              />
            </div>
          </div>

          {showEmbedCode && selectedInstance && (
            <div className="space-y-4 p-6 bg-white rounded-2xl border border-green-100">
              <div className="flex items-center space-x-2 mb-4">
                <Code size={18} className="text-green-600" />
                <h4 className="font-bold text-slate-900">Embed Code</h4>
              </div>

              <p className="text-xs text-slate-600 font-medium mb-3">Copy this code to your website's &lt;body&gt; tag:</p>

              <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto">
                <pre className="font-mono text-[10px] lg:text-xs text-emerald-300 whitespace-pre-wrap break-words">
<code>{`<!-- Start of WhatsApp Chat Widget -->
<script type="text/javascript">
(function() {
  var script = document.createElement('script');
  script.src = '${API_BASE}/embed/chat-widget.js?apiKey=${showEmbedCode}&instanceId=${selectedInstance}&apiUrl=${API_BASE}';
  script.async = true;
  script.charset = 'UTF-8';
  script.setAttribute('crossorigin', '*');
  document.body.appendChild(script);
})();
</script>
<!-- End of WhatsApp Chat Widget -->`}</code>
                </pre>
              </div>

              <button 
                onClick={() => {
                  const code = `<!-- Start of WhatsApp Chat Widget -->
<script type="text/javascript">
(function() {
  var script = document.createElement('script');
  script.src = '${API_BASE}/embed/chat-widget.js?apiKey=${showEmbedCode}&instanceId=${selectedInstance}&apiUrl=${API_BASE}';
  script.async = true;
  script.charset = 'UTF-8';
  script.setAttribute('crossorigin', '*');
  document.body.appendChild(script);
})();
</script>
<!-- End of WhatsApp Chat Widget -->`;
                  navigator.clipboard.writeText(code);
                  setCopied('widget-' + showEmbedCode);
                  setTimeout(() => setCopied(null), 2000);
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all"
              >
                {copied === 'widget-' + showEmbedCode ? (
                  <><Check size={18} /> <span>Copied!</span></>
                ) : (
                  <><Copy size={18} /> <span>Copy Embed Code</span></>
                )}
              </button>

              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-xs text-blue-800 space-y-2">
                <p className="font-bold">✨ How it works:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>This creates a floating WhatsApp chat bubble on your website</li>
                  <li>Visitors can send messages that appear in your WhatsApp instance</li>
                  <li>Messages are sent to the selected WhatsApp instance</li>
                  <li>Works on any website - paste the code before closing &lt;/body&gt; tag</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Integration Docs Preview */}
      <div className="bg-slate-900 rounded-2xl lg:rounded-[2.5rem] p-6 lg:p-8 text-white overflow-hidden shadow-2xl relative space-y-6">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 blur-3xl pointer-events-none"></div>
        
        {/* Send Message Endpoint */}
        <div className="relative">
          <div className="flex items-center space-x-3 mb-6">
            <Terminal size={22} className="text-green-400" />
            <div>
              <h3 className="text-lg lg:text-xl font-bold">Send WhatsApp Message</h3>
              <p className="text-xs text-slate-400 font-medium">Public API Endpoint</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <p className="text-xs font-mono text-blue-300 mb-2">GET /send/text</p>
              <p className="text-sm text-slate-400 font-medium">Send a text message via WhatsApp</p>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-300 uppercase mb-2">Parameters:</p>
              <div className="space-y-2 text-xs">
                <div className="flex items-start space-x-3 text-slate-400">
                  <span className="text-green-400 font-bold min-w-[120px]">access_token</span>
                  <span>Your API key for authentication</span>
                </div>
                <div className="flex items-start space-x-3 text-slate-400">
                  <span className="text-green-400 font-bold min-w-[120px]">instance_id</span>
                  <span>WhatsApp instance ID (from instances list)</span>
                </div>
                <div className="flex items-start space-x-3 text-slate-400">
                  <span className="text-green-400 font-bold min-w-[120px]">to</span>
                  <span>Recipient phone number (with country code, e.g., 919999999999)</span>
                </div>
                <div className="flex items-start space-x-3 text-slate-400">
                  <span className="text-green-400 font-bold min-w-[120px]">message</span>
                  <span>Message text to send</span>
                </div>
                <div className="flex items-start space-x-3 text-slate-400">
                  <span className="text-green-400 font-bold min-w-[120px]">reply_message_id</span>
                  <span className="text-slate-500">(Optional) Message ID to reply to</span>
                </div>
              </div>
            </div>

            <p className="text-xs font-bold text-slate-300 uppercase mb-2">Example Request:</p>
            <div className="bg-black/40 p-4 lg:p-6 rounded-xl border border-white/5 overflow-x-auto">
              <pre className="font-mono text-[9px] lg:text-xs text-green-300 leading-relaxed whitespace-pre-wrap break-all">
<code>{`curl --location 'http://localhost:3000/send/text?access_token=${apiKeys[0]?.key || '12345678-1234-1234-1234-123456789012'}&instance_id=123abc123abc&to=919999999999&message=Hello%20World' \\
  --data ''`}</code>
              </pre>
            </div>

            <p className="text-xs font-bold text-slate-300 uppercase mb-2">Success Response:</p>
            <div className="bg-black/40 p-4 lg:p-6 rounded-xl border border-white/5 overflow-x-auto">
              <pre className="font-mono text-[9px] lg:text-xs text-blue-300 leading-relaxed">
<code>{`{
  "success": true,
  "message": "Message sent successfully",
  "message_id": "BAA00AA0000A00A0",
  "timestamp": "2026-01-02T10:30:00.000Z"
}`}</code>
              </pre>
            </div>
          </div>
        </div>

        <hr className="border-white/10" />

        {/* Internal API Documentation */}
        <div className="relative">
          <div className="flex items-center space-x-3 mb-6">
            <Terminal size={22} className="text-blue-400" />
            <div>
              <h3 className="text-lg lg:text-xl font-bold">Internal API (Legacy)</h3>
              <p className="text-xs text-slate-400 font-medium">For internal service use</p>
            </div>
          </div>
          
          <div className="bg-black/40 p-4 lg:p-6 rounded-xl border border-white/5 overflow-x-auto">
            <pre className="font-mono text-[10px] lg:text-xs text-blue-300 leading-relaxed">
<code>{`curl -X POST http://localhost:3000/api/v1/messages/send \\
  -H "Authorization: Bearer ${apiKeys[0]?.key || 'wa_live_demo_key_123'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "instanceId": "inst_123abc",
    "to": "+919999999999",
    "message": "Hello World",
    "type": "web_bridge"
  }'`}</code>
            </pre>
          </div>
        </div>

        <hr className="border-white/10" />

        {/* Chat Widget Embed Section in Docs */}
        <div className="relative">
          <div className="flex items-center space-x-3 mb-6">
            <MessageCircle size={22} className="text-emerald-400" />
            <div>
              <h3 className="text-lg lg:text-xl font-bold">Chat Widget Embed Script</h3>
              <p className="text-xs text-slate-400 font-medium">Add a WhatsApp chatbot to any website (like Tawk.to)</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <p className="text-xs font-mono text-emerald-300 mb-2">GET /embed/chat-widget.js</p>
              <p className="text-sm text-slate-400 font-medium">Embed a floating WhatsApp chat bubble on any website</p>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-300 uppercase mb-2">Parameters:</p>
              <div className="space-y-2 text-xs">
                <div className="flex items-start space-x-3 text-slate-400">
                  <span className="text-emerald-400 font-bold min-w-[120px]">apiKey</span>
                  <span>Your API key for authentication (required)</span>
                </div>
                <div className="flex items-start space-x-3 text-slate-400">
                  <span className="text-emerald-400 font-bold min-w-[120px]">instanceId</span>
                  <span>WhatsApp instance ID where messages will be sent (required)</span>
                </div>
                <div className="flex items-start space-x-3 text-slate-400">
                  <span className="text-emerald-400 font-bold min-w-[120px]">apiUrl</span>
                  <span className="text-slate-500">(Optional) Your API server URL, defaults to http://localhost:3000</span>
                </div>
              </div>
            </div>

            <p className="text-xs font-bold text-slate-300 uppercase mb-2">Basic Installation:</p>
            <div className="bg-black/40 p-4 lg:p-6 rounded-xl border border-white/5 overflow-x-auto">
              <pre className="font-mono text-[9px] lg:text-xs text-emerald-300 leading-relaxed whitespace-pre-wrap break-all">
<code>{`<!-- Add this code before closing </body> tag -->
<script src="${API_BASE}/embed/chat-widget.js?apiKey=YOUR_API_KEY&instanceId=YOUR_INSTANCE_ID&apiUrl=${API_BASE}"></script>`}</code>
              </pre>
            </div>

            <p className="text-xs font-bold text-slate-300 uppercase mb-2">Dynamic Installation (Recommended):</p>
            <div className="bg-black/40 p-4 lg:p-6 rounded-xl border border-white/5 overflow-x-auto">
              <pre className="font-mono text-[9px] lg:text-xs text-emerald-300 leading-relaxed">
<code>{`<!-- Add this code before closing </body> tag -->
<script type="text/javascript">
(function() {
  var script = document.createElement('script');
  script.src = '${API_BASE}/embed/chat-widget.js?apiKey=YOUR_API_KEY&instanceId=YOUR_INSTANCE_ID';
  script.async = true;
  script.charset = 'UTF-8';
  script.setAttribute('crossorigin', '*');
  document.body.appendChild(script);
})();
</script>`}</code>
              </pre>
            </div>

            <p className="text-xs font-bold text-slate-300 uppercase mb-2">HTML Integration Example:</p>
            <div className="bg-black/40 p-4 lg:p-6 rounded-xl border border-white/5 overflow-x-auto">
              <pre className="font-mono text-[9px] lg:text-xs text-blue-300 leading-relaxed">
<code>{`<!DOCTYPE html>
<html>
<head>
  <title>My Website</title>
</head>
<body>
  <!-- Your website content here -->
  
  <!-- WhatsApp Chat Widget -->
  <script src="${API_BASE}/embed/chat-widget.js?apiKey=wa_live_xxxxx&instanceId=inst_123abc"></script>
</body>
</html>`}</code>
              </pre>
            </div>

            <div className="bg-emerald-900/30 p-4 rounded-xl border border-emerald-500/20 text-xs text-emerald-200 space-y-2">
              <p className="font-bold">✨ Features:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-300">
                <li>Floating green WhatsApp chat bubble</li>
                <li>One-click to open/close conversation</li>
                <li>Visitor enters phone number & types message</li>
                <li>Messages sent directly to your WhatsApp instance</li>
                <li>Mobile responsive design</li>
                <li>Works on any website - no dependencies</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center space-x-2 text-[10px] relative">
          <Shield size={14} className="text-green-400" />
          <span className="text-slate-500 font-bold uppercase tracking-wider">Token-Based Authentication • SSL/TLS Encryption</span>
        </div>
      </div>
    </div>
  );
};

export default ApiKeys;
