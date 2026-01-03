
import React, { useEffect, useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { Smartphone, Key, TrendingUp, ShieldCheck, Server } from 'lucide-react';
import { WhatsAppInstance, ApiKey, UsageData } from '../types';
import { analyzeHealth } from '../services/geminiService';

const MOCK_USAGE_DATA: UsageData[] = [
  { date: 'Mon', messages: 120, apiCalls: 210 },
  { date: 'Tue', messages: 450, apiCalls: 600 },
  { date: 'Wed', messages: 300, apiCalls: 450 },
  { date: 'Thu', messages: 700, apiCalls: 900 },
  { date: 'Fri', messages: 600, apiCalls: 850 },
  { date: 'Sat', messages: 200, apiCalls: 300 },
  { date: 'Sun', messages: 150, apiCalls: 250 },
];

interface DashboardProps {
  instances: WhatsAppInstance[];
  apiKeys: ApiKey[];
}

const Dashboard: React.FC<DashboardProps> = ({ instances, apiKeys }) => {
  const [healthStatus, setHealthStatus] = useState<string>("Analyzing infrastructure...");
  
  useEffect(() => {
    const fetchHealth = async () => {
      const summary = await analyzeHealth({
        bridgeCount: instances.filter(i => i.type === 'web_bridge').length,
        cloudCount: instances.filter(i => i.type === 'cloud_api').length,
        activeKeys: apiKeys.filter(k => k.status === 'active').length,
      });
      setHealthStatus(summary);
    };
    fetchHealth();
  }, [instances, apiKeys]);

  const stats = [
    { label: 'Web Bridges', value: instances.filter(i => i.type === 'web_bridge').length, icon: <Smartphone className="text-green-600" />, color: 'bg-green-100' },
    { label: 'Cloud API Nodes', value: instances.filter(i => i.type === 'cloud_api').length, icon: <Server className="text-blue-600" />, color: 'bg-blue-100' },
    { label: 'Platform Load', value: '42%', icon: <TrendingUp className="text-purple-600" />, color: 'bg-purple-100' },
    { label: 'System Trust', value: '99.9%', icon: <ShieldCheck className="text-emerald-600" />, color: 'bg-emerald-100' },
  ];

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900">Infrastructure</h1>
          <p className="text-sm text-slate-500 font-medium">Node health and traffic overview.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-2 self-start sm:self-auto">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Nominal</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-5 lg:p-6 rounded-2xl lg:rounded-[2rem] shadow-sm border border-slate-100 flex items-center space-x-4">
            <div className={`p-3 lg:p-4 rounded-2xl ${stat.color}`}>
              {/* Fix: Cast icon to React.ReactElement<any> to allow 'size' prop to be passed via cloneElement */}
              {React.cloneElement(stat.icon as React.ReactElement<any>, { size: 20 })}
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none mb-1">{stat.label}</p>
              <p className="text-xl lg:text-2xl font-black text-slate-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl lg:rounded-[2rem] p-4 lg:p-5 flex items-center space-x-4 lg:space-x-5 shadow-2xl overflow-hidden">
        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-500 rounded-xl lg:rounded-2xl flex items-center justify-center text-slate-900 shrink-0">
          <ShieldCheck size={24} />
        </div>
        <div className="min-w-0">
          <h3 className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-0.5">Gemini Engine</h3>
          <p className="text-xs lg:text-sm text-slate-300 font-medium truncate">{healthStatus}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <div className="bg-white p-6 lg:p-8 rounded-2xl lg:rounded-[2.5rem] shadow-sm border border-slate-100">
          <h3 className="text-md lg:text-lg font-black mb-6 text-slate-800">Traffic Distribution</h3>
          <div className="h-48 lg:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_USAGE_DATA}>
                <defs>
                  <linearGradient id="trafficGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#25D366" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#25D366" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="messages" stroke="#25D366" strokeWidth={3} fill="url(#trafficGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 lg:p-8 rounded-2xl lg:rounded-[2.5rem] shadow-sm border border-slate-100">
          <h3 className="text-md lg:text-lg font-black mb-6 text-slate-800">API Latency (ms)</h3>
          <div className="h-48 lg:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_USAGE_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                <Bar dataKey="apiCalls" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
