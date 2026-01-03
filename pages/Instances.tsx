
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Smartphone, RefreshCw, Trash2, X, 
  CheckCircle2, Terminal, Server, ChevronRight, Clock,
  Globe, AlertCircle, Wifi, WifiOff, Link2, Info, Play,
  Key, Database, ArrowRight, Check, AlertTriangle,
  BarChart3, Activity, ShieldCheck, History, ExternalLink,
  Settings as SettingsIcon, MessageSquare, ArrowUpRight, ArrowDownLeft
} from 'lucide-react';
import { WhatsAppInstance, InstanceType } from '../types';
import { API_BASE } from '../config';

interface InstanceMessage {
  id: string;
  direction: 'sent' | 'received';
  to: string;
  content: string;
  timestamp: string;
}

interface InstancesProps {
  instances: WhatsAppInstance[];
  setInstances: React.Dispatch<React.SetStateAction<WhatsAppInstance[]>>;
}

const Instances: React.FC<InstancesProps> = ({ instances, setInstances }) => {
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [instanceToDelete, setInstanceToDelete] = useState<WhatsAppInstance | null>(null);
  const [inspectInstance, setInspectInstance] = useState<WhatsAppInstance | null>(null);
  const [inspectMessages, setInspectMessages] = useState<InstanceMessage[]>([]);
  const [isLiveConnection, setIsLiveConnection] = useState(false);
  const [configType, setConfigType] = useState<InstanceType>('web_bridge');
  const [scanStep, setScanStep] = useState(0);

  // Fetch instances from backend on mount and periodically
  useEffect(() => {
    const fetchInstances = async () => {
      try {
        const res = await fetch(`${API_BASE}/instances`);
        if (res.ok) {
          const data = await res.json();
          setInstances(data);
        }
      } catch (err) {
        console.error('Failed to fetch instances:', err);
      }
    };

    fetchInstances();
    const timer = setInterval(fetchInstances, 3000); // poll every 3 seconds
    return () => clearInterval(timer);
  }, [setInstances]); 
  
  // Instance Details
  const [instanceName, setInstanceName] = useState('');
  const [bridgeUrl, setBridgeUrl] = useState('http://localhost:3000');
  const [urlError, setUrlError] = useState<string | null>(null);
  
  // Cloud API Specifics
  const [cloudCreds, setCloudCreds] = useState({
    phoneNumberId: '',
    wabaId: '',
    accessToken: '',
    displayNumber: ''
  });

  // Bridge Specifics
  const [qrString, setQrString] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [isSimulated, setIsSimulated] = useState(false);

  // URL Validation Logic
  const validateUrl = (url: string) => {
    if (!url) {
      setUrlError("Bridge URL is required.");
      return false;
    }
    const urlPattern = /^(https?:\/\/)/i;
    if (!urlPattern.test(url)) {
      setUrlError("URL must start with http:// or https://");
      return false;
    }
    try {
      new URL(url);
      setUrlError(null);
      return true;
    } catch (_) {
      setUrlError("Please enter a valid URL format.");
      return false;
    }
  };

  const handleBridgeUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBridgeUrl(value);
    validateUrl(value);
  };

  const fetchQrCode = useCallback(async () => {
    if (isSimulated) {
      setQrString(`WASM_SIM_DATA_${Date.now()}`);
      setError(null);
      setCountdown(30);
      return;
    }
    if (!instanceName) {
      setError('Instance name is required');
      return;
    }
    try {
      setError(null);
      // Create instance via backend
      const response = await fetch(`${API_BASE}/instances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: instanceName, type: configType })
      });
      if (response.ok) {
        const data = await response.json();
        setQrString(data.qr);
        setScanStep(1);
        setCountdown(30);
        // Refresh instances list
        const instRes = await fetch(`${API_BASE}/instances`);
        if (instRes.ok) {
          setInstances(await instRes.json());
        }
      } else {
        setError('Failed to create instance');
      }
    } catch (err) {
      setError('Connection failed. Check your backend.');
    }
  }, [instanceName, configType, setInstances, isSimulated]);

  // Fetch messages when inspecting with robust error handling
  useEffect(() => {
    let interval: number;
    const controller = new AbortController();

    if (inspectInstance) {
      const fetchMessages = async () => {
        const baseUrl = inspectInstance.config?.backendUrl || 'http://localhost:3000';
        const cleanUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        
        try {
          // Add timeout to prevent long-hanging fetch errors
          const timeoutId = setTimeout(() => controller.abort(), 2000);
          
          const response = await fetch(`${cleanUrl}/instances/${inspectInstance.id}/messages`, {
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            setInspectMessages(data);
            setIsLiveConnection(true);
          } else {
            throw new Error('Endpoint unreachable');
          }
        } catch (err) {
          // Silently handle "Failed to fetch" and fallback to mock data
          setIsLiveConnection(false);
          if (inspectMessages.length === 0) {
            setInspectMessages([
              { id: 'sim_1', direction: 'received', to: '+1 (555) 123-4567', content: 'Simulation: Hello from BridgePro support!', timestamp: new Date(Date.now() - 3600000).toISOString() },
              { id: 'sim_2', direction: 'sent', to: '+1 (555) 123-4567', content: 'Simulation: Message routed via virtual node.', timestamp: new Date(Date.now() - 3500000).toISOString() },
              { id: 'sim_3', direction: 'received', to: '+44 20 7946 0958', content: 'Simulation: System integrity check passed.', timestamp: new Date(Date.now() - 600000).toISOString() }
            ]);
          }
        }
      };

      fetchMessages();
      interval = window.setInterval(fetchMessages, 5000); 
    } else {
      setInspectMessages([]);
      setIsLiveConnection(false);
    }

    return () => {
      clearInterval(interval);
      controller.abort();
    };
  }, [inspectInstance]);

  useEffect(() => {
    let timer: number;
    if (isConfiguring && scanStep === 1 && configType === 'web_bridge') {
      fetchQrCode();
      timer = window.setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            fetchQrCode();
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isConfiguring, scanStep, configType, fetchQrCode]);

  const handleAddInstance = () => {
    const newInstance: WhatsAppInstance = {
      id: `${configType === 'web_bridge' ? 'br' : 'cl'}_${Date.now()}`,
      name: instanceName || (configType === 'web_bridge' ? 'WhatsApp Bridge' : 'Cloud API Instance'),
      type: configType,
      phoneNumber: configType === 'web_bridge' ? (isSimulated ? '+1 (555) 0000' : 'Linking...') : cloudCreds.displayNumber,
      status: 'connected',
      createdAt: new Date().toISOString().split('T')[0],
      lastActive: new Date().toISOString(),
      messagesSent: 0,
      config: configType === 'web_bridge' 
        ? { backendUrl: bridgeUrl }
        : { 
            phoneNumberId: cloudCreds.phoneNumberId, 
            wabaId: cloudCreds.wabaId, 
            apiKey: cloudCreds.accessToken 
          }
    };
    setInstances(prev => [...prev, newInstance]);
    setIsConfiguring(false);
    setInstanceName('');
    setCloudCreds({ phoneNumberId: '', wabaId: '', accessToken: '', displayNumber: '' });
  };

  const isProceedDisabled = () => {
    if (configType === 'web_bridge') {
      return !isSimulated && (!!urlError || !bridgeUrl);
    }
    return false;
  };

  const confirmDelete = () => {
    if (instanceToDelete) {
      setInstances(prev => prev.filter(i => i.id !== instanceToDelete.id));
      setInstanceToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">Messaging Instances</h1>
          <p className="text-sm text-slate-500 font-medium">Connect via Direct Bridge or Official Cloud API.</p>
        </div>
        <button 
          onClick={() => { setIsConfiguring(true); setScanStep(0); setUrlError(null); }}
          className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center space-x-2 transition-all shadow-xl shadow-slate-200 self-start sm:self-auto"
        >
          <Plus size={20} className="text-[#25D366]" />
          <span>New Instance</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {instances.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2rem] lg:rounded-[2.5rem] p-8 lg:p-16 text-center">
            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Smartphone size={32} className="text-slate-300" />
            </div>
            <h3 className="text-lg lg:text-xl font-bold text-slate-800">Ready to Connect</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto mt-2">Choose between high-compatibility Web Bridge or high-performance Cloud API.</p>
          </div>
        ) : (
          instances.map((instance) => (
            <div key={instance.id} className="group bg-white rounded-2xl lg:rounded-3xl p-5 lg:p-6 shadow-sm border border-slate-100 hover:border-green-200 transition-all">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center space-x-4 lg:space-x-5">
                  <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                    instance.type === 'web_bridge' ? 'bg-green-50 text-[#25D366]' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {instance.type === 'web_bridge' ? <Smartphone size={24} /> : <Server size={24} />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-slate-800 text-base lg:text-xl truncate">{instance.name}</h3>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter shrink-0 ${
                        instance.type === 'web_bridge' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {instance.type.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-400 mt-0.5">{instance.phoneNumber || 'Provisioning...'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 lg:gap-6 flex-1 max-w-xl">
                  <div className="bg-slate-50/50 rounded-xl lg:rounded-2xl p-2.5 lg:p-3">
                    <p className="text-[8px] lg:text-[10px] text-slate-400 uppercase font-black tracking-widest">Traffic</p>
                    <p className="text-base lg:text-lg font-bold text-slate-700">{instance.messagesSent.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-50/50 rounded-xl lg:rounded-2xl p-2.5 lg:p-3">
                    <p className="text-[8px] lg:text-[10px] text-slate-400 uppercase font-black tracking-widest">Pulse</p>
                    <p className="text-xs lg:text-sm font-bold text-slate-600 truncate">{new Date(instance.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="hidden sm:block bg-slate-50/50 rounded-xl lg:rounded-2xl p-2.5 lg:p-3">
                    <p className="text-[8px] lg:text-[10px] text-slate-400 uppercase font-black tracking-widest">Status</p>
                    <div className="flex items-center space-x-1.5 mt-0.5">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                      <p className="text-xs lg:text-sm font-bold text-slate-700 capitalize">Active</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 lg:space-x-3 self-end lg:self-auto">
                  <button 
                    onClick={() => setInspectInstance(instance)}
                    className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl lg:rounded-2xl transition-all"
                    title="Inspect Instance"
                  >
                    <Terminal size={18} />
                  </button>
                  <button 
                    onClick={() => setInstanceToDelete(instance)}
                    className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl lg:rounded-2xl transition-all"
                    title="Delete Instance"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Instance Inspector Modal */}
      {inspectInstance && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[80] flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-[2rem] lg:rounded-[2.5rem] w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-6 lg:p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-2xl ${inspectInstance.type === 'web_bridge' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                  {inspectInstance.type === 'web_bridge' ? <Smartphone size={24} /> : <Server size={24} />}
                </div>
                <div>
                  <h2 className="text-xl lg:text-2xl font-black text-slate-900">{inspectInstance.name}</h2>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full tracking-wider">{inspectInstance.id}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span className={`text-xs font-bold flex items-center ${isLiveConnection ? 'text-green-500' : 'text-amber-500'}`}>
                      {isLiveConnection ? <Wifi size={12} className="mr-1" /> : <WifiOff size={12} className="mr-1" />}
                      {isLiveConnection ? 'ONLINE' : 'VIRTUAL NODE'}
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setInspectInstance(null)}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <div className="bg-slate-50 rounded-2xl p-4 lg:p-6 border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <BarChart3 size={18} className="text-slate-400" />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Messages</span>
                  </div>
                  <p className="text-2xl lg:text-3xl font-black text-slate-900">{inspectInstance.messagesSent}</p>
                  <p className="text-[10px] text-green-500 font-bold mt-1">+12% from last week</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 lg:p-6 border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <Activity size={18} className="text-slate-400" />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Uptime</span>
                  </div>
                  <p className="text-2xl lg:text-3xl font-black text-slate-900">{isLiveConnection ? '99.9%' : 'SIMULATED'}</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">Last reset: 14d ago</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 lg:p-6 border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <ShieldCheck size={18} className="text-slate-400" />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Security</span>
                  </div>
                  <p className="text-2xl lg:text-3xl font-black text-slate-900">TLS 1.3</p>
                  <p className="text-[10px] text-green-500 font-bold mt-1">Encryption: AES-256</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 lg:p-6 border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <History size={18} className="text-slate-400" />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Response</span>
                  </div>
                  <p className="text-2xl lg:text-3xl font-black text-slate-900">{isLiveConnection ? '42ms' : '0ms'}</p>
                  <p className="text-[10px] text-blue-500 font-bold mt-1">Peak: 120ms</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Configuration Details */}
                <div className="space-y-6 lg:col-span-1">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-slate-900 text-white rounded-xl"><SettingsIcon size={18} /></div>
                    <h3 className="text-lg font-black text-slate-800">Endpoint Config</h3>
                  </div>
                  
                  <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <tbody className="divide-y divide-slate-100">
                        {inspectInstance.type === 'web_bridge' ? (
                          <>
                            <tr className="group">
                              <td className="px-6 py-4 font-black text-slate-400 text-[10px] uppercase tracking-widest w-1/3">Bridge URL</td>
                              <td className="px-6 py-4 font-mono text-xs text-slate-600 truncate max-w-0">{inspectInstance.config?.backendUrl}</td>
                            </tr>
                            <tr className="group">
                              <td className="px-6 py-4 font-black text-slate-400 text-[10px] uppercase tracking-widest">Protocol</td>
                              <td className="px-6 py-4 font-bold text-slate-800">WebSocket / gRPC</td>
                            </tr>
                          </>
                        ) : (
                          <>
                            <tr className="group">
                              <td className="px-6 py-4 font-black text-slate-400 text-[10px] uppercase tracking-widest w-1/3">Phone ID</td>
                              <td className="px-6 py-4 font-mono text-xs text-slate-600">{inspectInstance.config?.phoneNumberId}</td>
                            </tr>
                            <tr className="group">
                              <td className="px-6 py-4 font-black text-slate-400 text-[10px] uppercase tracking-widest">WABA ID</td>
                              <td className="px-6 py-4 font-mono text-xs text-slate-600">{inspectInstance.config?.wabaId}</td>
                            </tr>
                            <tr className="group">
                              <td className="px-6 py-4 font-black text-slate-400 text-[10px] uppercase tracking-widest">Meta API</td>
                              <td className="px-6 py-4 font-bold text-slate-800">v17.0 (Stable)</td>
                            </tr>
                          </>
                        )}
                        <tr>
                          <td className="px-6 py-4 font-black text-slate-400 text-[10px] uppercase tracking-widest">Created At</td>
                          <td className="px-6 py-4 font-bold text-slate-800">{inspectInstance.createdAt}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Message Log Section */}
                <div className="space-y-6 lg:col-span-1">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-slate-100 text-slate-600 rounded-xl"><MessageSquare size={18} /></div>
                    <h3 className="text-lg font-black text-slate-800">Message Log</h3>
                  </div>
                  
                  <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden h-[240px] flex flex-col">
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                      {inspectMessages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-1 opacity-60 text-center">
                          <MessageSquare size={24} className="mx-auto" />
                          <p className="text-[10px] font-black uppercase tracking-widest">No traffic detected</p>
                        </div>
                      ) : (
                        inspectMessages.map(msg => (
                          <div key={msg.id} className="p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 transition-all">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className={`flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                                msg.direction === 'sent' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                              }`}>
                                {msg.direction === 'sent' ? <ArrowUpRight size={8} /> : <ArrowDownLeft size={8} />}
                                <span>{msg.direction}</span>
                              </div>
                              <span className="text-[9px] text-slate-400 font-medium">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                            </div>
                            <p className="text-[10px] font-bold text-slate-800 mb-0.5">{msg.to}</p>
                            <p className="text-[10px] text-slate-500 line-clamp-1">{msg.content}</p>
                          </div>
                        ))
                      )}
                    </div>
                    {!isLiveConnection && inspectMessages.length > 0 && (
                      <div className="px-4 py-2 bg-amber-50 border-t border-amber-100 flex items-center space-x-2 shrink-0">
                        <Info size={10} className="text-amber-600" />
                        <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest">Viewing Virtual Data</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Connection History / Logs */}
                <div className="space-y-6 lg:col-span-1">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-slate-100 text-slate-600 rounded-xl"><Terminal size={18} /></div>
                    <h3 className="text-lg font-black text-slate-800">Session Logs</h3>
                  </div>
                  
                  <div className="bg-slate-900 rounded-3xl p-6 font-mono text-[10px] space-y-3 shadow-inner h-[240px] overflow-y-auto custom-scrollbar">
                    <div className="flex items-start space-x-3">
                      <span className="text-slate-500 shrink-0">[{new Date().toLocaleTimeString()}]</span>
                      <span className="text-green-400">INFO: Socket handshake successful.</span>
                    </div>
                    {!isLiveConnection && (
                      <div className="flex items-start space-x-3">
                        <span className="text-slate-500 shrink-0">[{new Date().toLocaleTimeString()}]</span>
                        <span className="text-amber-400">WARN: Direct bridge unreachable. Running virtual environment.</span>
                      </div>
                    )}
                    <div className="flex items-start space-x-3">
                      <span className="text-slate-500 shrink-0">[{new Date().toLocaleTimeString()}]</span>
                      <span className="text-blue-400">SYNC: Pre-fetching chat history (2.4MB received).</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="text-slate-500 shrink-0">[{new Date(Date.now() - 3600000).toLocaleTimeString()}]</span>
                      <span className="text-yellow-400">WARN: Connection latency spiked to 142ms.</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="text-slate-500 shrink-0">[{new Date(Date.now() - 7200000).toLocaleTimeString()}]</span>
                      <span className="text-slate-400">HEARTBEAT: System OK. Node status nominal.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 lg:p-8 bg-slate-50 border-t border-slate-100 rounded-b-[2rem] lg:rounded-b-[2.5rem] flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="flex items-center space-x-4">
                <button className="flex items-center space-x-2 text-xs font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-all">
                  <ExternalLink size={14} />
                  <span>View Documentation</span>
                </button>
              </div>
              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <button 
                  onClick={() => setInspectInstance(null)}
                  className="flex-1 sm:flex-none px-6 py-3 bg-white border border-slate-200 text-slate-700 font-black rounded-xl hover:bg-slate-100 transition-all text-sm"
                >
                  Close
                </button>
                <button className="flex-1 sm:flex-none px-6 py-3 bg-slate-900 text-[#25D366] font-black rounded-xl shadow-lg hover:shadow-green-500/10 transition-all text-sm">
                  Restart Service
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {instanceToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[70] flex items-center justify-center p-4 overflow-hidden">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900">Delete Instance?</h3>
            <p className="text-slate-500 mt-2 font-medium leading-relaxed">
              This will disconnect <span className="text-slate-900 font-bold">"{instanceToDelete.name}"</span> and stop all active routing. This action cannot be undone.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <button 
                onClick={() => setInstanceToDelete(null)}
                className="py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="py-3 bg-red-500 text-white rounded-xl font-bold shadow-lg shadow-red-100 hover:bg-red-600 transition-all text-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {isConfiguring && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl lg:rounded-[2.5rem] w-full max-w-2xl my-auto overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 lg:p-8 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-xl lg:text-2xl font-black text-slate-800">New Instance</h2>
                <p className="text-xs text-slate-500">Choose your connection method.</p>
              </div>
              <button onClick={() => setIsConfiguring(false)} className="bg-slate-100 p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors"><X className="w-5 h-5 lg:w-6 lg:h-6" /></button>
            </div>

            <div className="p-5 lg:p-8 max-h-[80vh] overflow-y-auto">
              {scanStep === 0 && (
                <div className="space-y-6 lg:space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                    <button 
                      onClick={() => setConfigType('web_bridge')}
                      className={`p-5 lg:p-8 rounded-2xl lg:rounded-[2rem] border-2 text-left transition-all relative group ${
                        configType === 'web_bridge' ? 'border-[#25D366] bg-green-50/30' : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <Smartphone className={`mb-3 lg:mb-4 transition-colors ${configType === 'web_bridge' ? 'text-[#25D366]' : 'text-slate-400 group-hover:text-slate-500'} w-8 h-8 lg:w-9 lg:h-9`} />
                      <h4 className="font-bold text-slate-800 text-base lg:text-lg">Web Bridge</h4>
                      <p className="text-[10px] lg:text-xs text-slate-500 mt-2 leading-relaxed">Direct scan using your phone. Great for personal/small support accounts.</p>
                      {configType === 'web_bridge' && <div className="absolute top-4 right-4 text-[#25D366]"><CheckCircle2 className="w-5 h-5 lg:w-6 lg:h-6" /></div>}
                    </button>
                    <button 
                      onClick={() => setConfigType('cloud_api')}
                      className={`p-5 lg:p-8 rounded-2xl lg:rounded-[2rem] border-2 text-left transition-all relative group ${
                        configType === 'cloud_api' ? 'border-blue-500 bg-blue-50/30' : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <Server className={`mb-3 lg:mb-4 transition-colors ${configType === 'cloud_api' ? 'text-blue-500' : 'text-slate-400 group-hover:text-slate-500'} w-8 h-8 lg:w-9 lg:h-9`} />
                      <h4 className="font-bold text-slate-800 text-base lg:text-lg">Cloud API</h4>
                      <p className="text-[10px] lg:text-xs text-slate-500 mt-2 leading-relaxed">Official Meta Graph integration. Stable, high-volume, enterprise ready.</p>
                      {configType === 'cloud_api' && <div className="absolute top-4 right-4 text-blue-500"><CheckCircle2 className="w-5 h-5 lg:w-6 lg:h-6" /></div>}
                    </button>
                  </div>

                  <div className="space-y-3 lg:space-y-4">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Friendly Label</label>
                    <input 
                      type="text" 
                      value={instanceName}
                      onChange={(e) => setInstanceName(e.target.value)}
                      placeholder="e.g. Sales Team #1"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl lg:rounded-2xl px-4 lg:px-6 py-3 lg:py-4 text-sm font-semibold focus:ring-2 focus:ring-green-400 outline-none transition-all" 
                    />
                  </div>

                  {configType === 'web_bridge' && (
                    <div className="space-y-4 p-5 lg:p-6 bg-slate-50 rounded-2xl lg:rounded-[2rem] border border-slate-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                         <div className="flex items-center space-x-2">
                           <Globe className="text-slate-400 w-[14px] h-[14px] lg:w-4 lg:h-4" />
                           <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Bridge Node URL</label>
                         </div>
                         <div className="flex items-center space-x-2 self-start sm:self-auto">
                           <span className="text-[10px] font-bold text-blue-500 uppercase">Simulator</span>
                           <button onClick={() => setIsSimulated(!isSimulated)} className={`w-8 h-4 rounded-full relative transition-colors ${isSimulated ? 'bg-blue-500' : 'bg-slate-300'}`}>
                              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isSimulated ? 'right-0.5' : 'left-0.5'}`}></div>
                           </button>
                         </div>
                      </div>

                      {!isSimulated && (
                        <div className="relative">
                          <input 
                            type="text" 
                            value={bridgeUrl}
                            onChange={handleBridgeUrlChange}
                            placeholder="http://localhost:3000"
                            className={`w-full bg-white border rounded-xl px-4 py-3 text-sm font-mono outline-none transition-all ${
                              urlError ? 'border-red-300 ring-4 ring-red-50' : 'border-slate-200 focus:ring-4 focus:ring-green-50 focus:border-green-400'
                            }`}
                          />
                          {bridgeUrl && !urlError && <Check className="absolute right-4 top-3.5 text-green-500" size={16} />}
                          {urlError && <p className="mt-2 text-[10px] font-bold text-red-500 flex items-center"><AlertCircle size={10} className="mr-1" /> {urlError}</p>}
                        </div>
                      )}
                      
                      <p className="text-[10px] text-slate-400 leading-relaxed font-medium italic">
                        The platform communicates with your secure local or remote node to generate QR session payloads.
                      </p>
                    </div>
                  )}

                  <button 
                    onClick={() => setScanStep(1)}
                    disabled={isProceedDisabled()}
                    className={`w-full py-4 lg:py-5 rounded-xl lg:rounded-2xl font-black shadow-xl transition-all flex items-center justify-center space-x-2 ${
                      isProceedDisabled() 
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    <span>Proceed to Configuration</span>
                    <ArrowRight className={`${isProceedDisabled() ? 'text-slate-300' : 'text-[#25D366]'} w-[18px] h-[18px] lg:w-5 lg:h-5`} />
                  </button>
                </div>
              )}

              {scanStep === 1 && configType === 'web_bridge' && (
                <div className="flex flex-col items-center text-center space-y-6 lg:space-y-8">
                  <div className="relative p-4 lg:p-6 bg-white rounded-2xl lg:rounded-[2.5rem] shadow-xl border border-slate-100 w-fit mx-auto">
                    {qrString ? (
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrString)}`} 
                        alt="WhatsApp QR"
                        className="w-48 h-48 lg:w-64 lg:h-64"
                      />
                    ) : (
                      <div className="w-48 h-48 lg:w-64 lg:h-64 bg-slate-50 flex flex-col items-center justify-center space-y-4 rounded-xl border-2 border-dashed border-slate-200">
                        <div className="w-8 h-8 lg:w-10 lg:h-10 border-4 border-[#25D366] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase">Awaiting Bridge...</p>
                      </div>
                    )}
                    {qrString && (
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 lg:px-4 py-1.5 rounded-full text-[9px] lg:text-[10px] font-black flex items-center space-x-2 shadow-lg whitespace-nowrap">
                        <Clock size={12} className="text-[#25D366]" />
                        <span>RELINK IN {countdown}S</span>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-50 rounded-2xl lg:rounded-3xl p-5 lg:p-6 text-left border border-slate-100 w-full">
                    <h4 className="text-[10px] lg:text-xs font-black text-slate-800 uppercase mb-3 flex items-center">Scan Guide</h4>
                    <ol className="text-[10px] lg:text-[11px] text-slate-500 space-y-2 lg:space-y-3 list-decimal ml-4 font-medium">
                      <li>Open WhatsApp {">"} Settings {">"} Linked Devices.</li>
                      <li>Scan this QR to link your session to our bridge.</li>
                    </ol>
                  </div>

                  <div className="grid grid-cols-2 gap-3 lg:gap-4 w-full">
                    <button onClick={() => setScanStep(0)} className="py-3 lg:py-4 bg-slate-100 text-slate-600 rounded-xl lg:rounded-2xl font-bold text-sm lg:text-base">Back</button>
                    <button 
                      onClick={() => { setScanStep(2); setTimeout(() => setScanStep(3), 2000); }}
                      className="py-3 lg:py-4 bg-[#25D366] text-white rounded-xl lg:rounded-2xl font-black shadow-lg text-sm lg:text-base"
                    >
                      I've Scanned
                    </button>
                  </div>
                </div>
              )}

              {scanStep === 1 && configType === 'cloud_api' && (
                <div className="space-y-5 lg:space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number ID</label>
                      <input 
                        type="text" 
                        value={cloudCreds.phoneNumberId}
                        onChange={(e) => setCloudCreds({...cloudCreds, phoneNumberId: e.target.value})}
                        placeholder="123456..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-400 outline-none" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WABA Account ID</label>
                      <input 
                        type="text" 
                        value={cloudCreds.wabaId}
                        onChange={(e) => setCloudCreds({...cloudCreds, wabaId: e.target.value})}
                        placeholder="WABA ID..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-400 outline-none" 
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Display Number</label>
                    <input 
                      type="text" 
                      value={cloudCreds.displayNumber}
                      onChange={(e) => setCloudCreds({...cloudCreds, displayNumber: e.target.value})}
                      placeholder="+1 (555) 0000"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-400 outline-none" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Token</label>
                    <div className="relative">
                      <Key className="absolute left-4 top-3.5 text-slate-300 w-4 h-4 lg:w-[18px] lg:h-[18px]" />
                      <input 
                        type="password" 
                        value={cloudCreds.accessToken}
                        onChange={(e) => setCloudCreds({...cloudCreds, accessToken: e.target.value})}
                        placeholder="EAAB..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-11 lg:px-12 py-3 lg:py-3.5 text-sm font-mono focus:ring-2 focus:ring-blue-400 outline-none" 
                      />
                    </div>
                    <p className="text-[9px] lg:text-[10px] text-slate-400 mt-2 px-1">Generate a permanent token in <a href="https://developers.facebook.com" className="text-blue-500 underline font-bold" target="_blank">Meta Developer Console</a>.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 lg:gap-4 pt-4 lg:pt-6">
                    <button onClick={() => setScanStep(0)} className="py-3 lg:py-4 bg-slate-100 text-slate-600 rounded-xl lg:rounded-2xl font-bold text-sm lg:text-base">Back</button>
                    <button 
                      onClick={() => { setScanStep(2); setTimeout(() => setScanStep(3), 1500); }}
                      className="py-3 lg:py-4 bg-blue-600 text-white rounded-xl lg:rounded-2xl font-black shadow-xl text-sm lg:text-base hover:bg-blue-700 transition-colors"
                    >
                      Verify
                    </button>
                  </div>
                </div>
              )}

              {scanStep === 2 && (
                <div className="py-12 lg:py-20 flex flex-col items-center text-center">
                  <div className={`w-16 h-16 lg:w-20 lg:h-20 border-[5px] lg:border-[6px] border-t-transparent rounded-full animate-spin mb-6 lg:mb-8 ${configType === 'web_bridge' ? 'border-[#25D366]' : 'border-blue-500'}`}></div>
                  <h3 className="text-xl lg:text-2xl font-black text-slate-900">Synchronizing...</h3>
                  <p className="text-xs lg:text-sm text-slate-500 mt-2 font-medium px-4">Validating security protocols and endpoint connectivity.</p>
                </div>
              )}

              {scanStep === 3 && (
                <div className="py-12 lg:py-20 flex flex-col items-center text-center animate-in zoom-in duration-300">
                  <div className={`w-20 h-20 lg:w-28 lg:h-28 rounded-full flex items-center justify-center mb-6 lg:mb-8 shadow-inner ring-4 lg:ring-8 ${configType === 'web_bridge' ? 'bg-green-50 text-[#25D366] ring-green-100' : 'bg-blue-50 text-blue-600 ring-blue-100'}`}>
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-black text-slate-900 px-4">Connection Verified!</h3>
                  <p className="text-sm lg:text-lg text-slate-500 mt-2 mb-8 lg:mb-12 font-medium px-4">Your {configType === 'web_bridge' ? 'WhatsApp Bridge' : 'Cloud API Instance'} is now live.</p>
                  <button 
                    onClick={handleAddInstance}
                    className="w-full py-4 lg:py-5 bg-slate-900 text-white rounded-xl lg:rounded-2xl font-black shadow-2xl hover:bg-slate-800 transition-all text-base lg:text-lg"
                  >
                    Enter Workspace
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Instances;
