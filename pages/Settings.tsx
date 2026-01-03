
import React from 'react';
import { 
  Bell, Shield, Webhook, Zap, Database
} from 'lucide-react';

const SettingsPage: React.FC = () => {
  return (
    <div className="max-w-4xl space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">System Settings</h1>
        <p className="text-sm text-slate-500 font-medium">Configure routing, security, and global data hooks.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:gap-8">
        {/* Webhooks Section */}
        <div className="bg-white rounded-2xl lg:rounded-[2rem] p-6 lg:p-8 shadow-sm border border-slate-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Webhook size={18} /></div>
            <h3 className="text-lg lg:text-xl font-bold text-slate-800">Inbound Webhooks</h3>
          </div>
          
          <div className="space-y-4 lg:space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Message Hook</p>
                <code className="text-[11px] lg:text-xs font-mono text-slate-600 truncate block">https://your-api.com/v1/wa/webhook</code>
              </div>
              <button className="px-4 py-2 bg-white text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 hover:bg-slate-50 transition-all self-start lg:self-auto">Test Hook</button>
            </div>
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Sync</p>
                <code className="text-[11px] lg:text-xs font-mono text-slate-600 truncate block">https://your-api.com/v1/wa/status</code>
              </div>
              <button className="px-4 py-2 bg-white text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 hover:bg-slate-50 transition-all self-start lg:self-auto">Test Hook</button>
            </div>
          </div>
        </div>

        {/* Global Config Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
          <SettingCard 
            icon={<Zap className="text-yellow-600" />} 
            color="bg-yellow-50"
            title="Auto-Retries"
            description="Retry failed messages up to 3 times."
            enabled={true}
          />
          <SettingCard 
            icon={<Shield className="text-green-600" />} 
            color="bg-green-50"
            title="Force TLS"
            description="Ensure bridge connections use TLS 1.3."
            enabled={true}
          />
          <SettingCard 
            icon={<Database className="text-purple-600" />} 
            color="bg-purple-50"
            title="Media Retention"
            description="Persist chat media for 30 days."
            enabled={false}
          />
          <SettingCard 
            icon={<Bell className="text-red-600" />} 
            color="bg-red-50"
            title="Critical Alerts"
            description="Failure notifications via SMS."
            enabled={true}
          />
        </div>

        {/* Diagnostic Tool */}
        <div className="bg-slate-900 rounded-2xl lg:rounded-[2.5rem] p-6 lg:p-10 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 blur-[100px] pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 lg:gap-8">
            <div className="max-w-md">
              <div className="flex items-center space-x-2 text-green-400 mb-2">
                <Zap size={14} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Diagnostic</span>
              </div>
              <h3 className="text-xl lg:text-2xl font-black mb-2">System Integrity Audit</h3>
              <p className="text-slate-400 text-xs lg:text-sm leading-relaxed">Run a full audit of instances, keys, and bridge latencies. Our AI analyzer reports bottlenecks instantly.</p>
            </div>
            <button className="bg-[#25D366] text-slate-900 px-6 py-3 lg:px-8 lg:py-4 rounded-xl lg:rounded-2xl font-black hover:bg-[#1EBE57] transition-all transform active:scale-95 shadow-2xl shadow-green-500/20 text-xs lg:text-base">
              Run System Pulse
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SettingCard: React.FC<{ icon: React.ReactNode; color: string; title: string; description: string; enabled: boolean }> = ({ icon, color, title, description, enabled }) => (
  <div className="bg-white p-4 lg:p-6 rounded-2xl lg:rounded-3xl shadow-sm border border-slate-100 flex items-start space-x-4">
    {/* Fix: Cast icon to React.ReactElement<any> to allow 'size' prop to be passed via cloneElement and avoid type mismatch */}
    <div className={`p-2 lg:p-3 rounded-xl lg:rounded-2xl shrink-0 ${color}`}>{React.cloneElement(icon as React.ReactElement<any>, { size: 18 })}</div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <h4 className="font-bold text-slate-800 text-sm lg:text-base truncate">{title}</h4>
        <div className={`w-8 h-4 lg:w-10 lg:h-5 rounded-full relative transition-colors shrink-0 ${enabled ? 'bg-[#25D366]' : 'bg-slate-200'}`}>
          <div className={`absolute top-0.5 w-3 h-3 lg:w-4 lg:h-4 lg:top-0.5 bg-white rounded-full transition-all ${enabled ? 'right-0.5 lg:right-0.5' : 'left-0.5 lg:left-0.5'}`}></div>
        </div>
      </div>
      <p className="text-[10px] lg:text-xs text-slate-500 leading-relaxed font-medium">{description}</p>
    </div>
  </div>
);

export default SettingsPage;
