
import React, { useState } from 'react';
import { Key, Plus, Copy, Trash2, Shield, Eye, EyeOff, Check, Terminal } from 'lucide-react';
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
          id: `key_${Date.now()}`,
          name: 'Integration Key ' + (apiKeys.length + 1),
          key: data.key,
          createdAt: new Date().toISOString().split('T')[0],
          lastUsed: null,
          status: 'active',
          requestCount: 0
        };
        setApiKeys(prev => [...prev, newKey]);
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

  const removeKey = (id: string) => {
    setApiKeys(prev => prev.filter(k => k.id !== id));
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

        <div className="mt-8 flex items-center space-x-2 text-[10px] relative">
          <Shield size={14} className="text-green-400" />
          <span className="text-slate-500 font-bold uppercase tracking-wider">Token-Based Authentication • SSL/TLS Encryption</span>
        </div>
      </div>
    </div>
  );
};

export default ApiKeys;
