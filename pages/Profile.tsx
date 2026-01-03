
import React, { useState } from 'react';
import { 
  User, Mail, Shield, Lock, Calendar, Smartphone, 
  Globe, Eye, EyeOff, CheckCircle2, AlertCircle, Save,
  LogOut, ShieldAlert, Cpu, Copy, Check, Fingerprint,
  Monitor, RefreshCcw, Key as KeyIcon, ChevronRight
} from 'lucide-react';
import { UserProfile } from '../types';

/**
 * Profile Page Component
 * Implemented with Next.js patterns: focused on server-like metadata and client-side interactivity.
 */
const ProfilePage = () => {
  // Mock User Data - In a real Next.js app, this would be fetched via Server Actions or a Hook
  const [user, setUser] = useState<UserProfile>({
    id: 'ADMIN-992-KLR',
    username: 'bridge_master_01',
    email: 'ops@bridgepro.io',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    role: 'Platform Architect',
    tier: 'Enterprise Suite',
    joinedAt: '2023-08-15',
    lastLogin: new Date().toLocaleTimeString(),
    loginIp: '184.22.105.63',
    twoFactorEnabled: true,
    passwordLastChanged: '2024-02-10'
  });

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const [showPass, setShowPass] = useState<Record<string, boolean>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [idCopied, setIdCopied] = useState(false);

  const toggleVisibility = (field: string) => {
    setShowPass(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const copyId = () => {
    navigator.clipboard.writeText(user.id);
    setIdCopied(true);
    setTimeout(() => setIdCopied(false), 2000);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      setStatus({ type: 'error', msg: 'Passwords do not match.' });
      return;
    }
    
    setIsUpdating(true);
    // Mimicking a Next.js Server Action delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsUpdating(false);
    setStatus({ type: 'success', msg: 'Password updated successfully. Other sessions invalidated.' });
    setPasswords({ current: '', new: '', confirm: '' });
    setTimeout(() => setStatus(null), 4000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-700">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Account Settings</h1>
          <p className="text-sm text-slate-500 font-medium">Manage your administrative profile and security credentials.</p>
        </div>
        <div className="flex items-center space-x-3 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
          <button className="flex items-center space-x-2 px-4 py-2 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all text-xs">
            <RefreshCcw size={14} />
            <span>Sync</span>
          </button>
          <div className="w-px h-4 bg-slate-200"></div>
          <button className="flex items-center space-x-2 px-4 py-2 text-red-500 font-bold rounded-xl hover:bg-red-50 transition-all text-xs">
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Login Details & Identity */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="absolute -inset-2 bg-gradient-to-tr from-[#25D366] to-blue-500 rounded-[2.5rem] opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <img src={user.avatar} className="relative w-28 h-28 rounded-[2.2rem] border-4 border-white shadow-xl" alt="Avatar" />
                <div className="absolute -bottom-2 -right-2 bg-slate-900 text-[#25D366] p-2 rounded-2xl border-4 border-white">
                  <Shield size={16} />
                </div>
              </div>
              
              <h2 className="text-2xl font-black text-slate-900">{user.username}</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{user.role}</p>
              
              <div className="flex items-center space-x-2 mt-4">
                <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black rounded-full border border-green-100 uppercase tracking-wider">
                  {user.tier}
                </span>
              </div>
            </div>

            <div className="mt-10 space-y-3">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-4">Login Context</h3>
              
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">System ID</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-700">{user.id}</span>
                  <button onClick={copyId} className="text-slate-400 hover:text-blue-500">
                    {idCopied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">Last IP</p>
                  <p className="text-xs font-bold text-slate-700">{user.loginIp}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">Active</p>
                  <p className="text-xs font-bold text-slate-700">{user.lastLogin}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 blur-[60px] rounded-full"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Security Check</h3>
                <Fingerprint size={20} className="text-blue-400" />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between group cursor-help">
                  <span className="text-xs text-slate-500 font-medium">Two-Factor Auth</span>
                  <span className="text-xs font-black text-green-400 flex items-center">
                    ENABLED <CheckCircle2 size={12} className="ml-1" />
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Device Trust</span>
                  <span className="text-xs font-black text-blue-400 uppercase">Verified</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full mt-4 overflow-hidden">
                  <div className="bg-gradient-to-r from-[#25D366] to-blue-500 h-full w-[92%]"></div>
                </div>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight text-center mt-2">Identity Health Score: 92/100</p>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Password & Credential Management */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 lg:p-12 shadow-sm border border-slate-100 h-full">
            <div className="flex items-center space-x-5 mb-12">
              <div className="w-14 h-14 bg-slate-100 text-slate-900 rounded-[1.5rem] flex items-center justify-center">
                <KeyIcon size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Change Security Password</h3>
                <p className="text-xs text-slate-400 font-medium">Update your login credentials to secure your bridge nodes.</p>
              </div>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Current Password</label>
                <div className="relative">
                  <input 
                    type={showPass.current ? "text" : "password"}
                    value={passwords.current}
                    onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                    placeholder="Enter existing password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4.5 text-sm font-semibold focus:ring-4 focus:ring-green-50 focus:border-green-400 outline-none transition-all"
                    required
                  />
                  <button type="button" onClick={() => toggleVisibility('current')} className="absolute right-6 top-4.5 text-slate-300 hover:text-slate-600">
                    {showPass.current ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">New Password</label>
                  <div className="relative">
                    <input 
                      type={showPass.new ? "text" : "password"}
                      value={passwords.new}
                      onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                      placeholder="Min. 12 chars"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4.5 text-sm font-semibold focus:ring-4 focus:ring-green-50 focus:border-green-400 outline-none transition-all"
                      required
                    />
                    <button type="button" onClick={() => toggleVisibility('new')} className="absolute right-6 top-4.5 text-slate-300 hover:text-slate-600">
                      {showPass.new ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Confirm New Password</label>
                  <div className="relative">
                    <input 
                      type={showPass.confirm ? "text" : "password"}
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                      placeholder="Repeat new password"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4.5 text-sm font-semibold focus:ring-4 focus:ring-green-50 focus:border-green-400 outline-none transition-all"
                      required
                    />
                    <button type="button" onClick={() => toggleVisibility('confirm')} className="absolute right-6 top-4.5 text-slate-300 hover:text-slate-600">
                      {showPass.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-[1.5rem] flex items-start space-x-4 border border-slate-100">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg shrink-0">
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 mb-1 uppercase tracking-tight">Security Protocol</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                    Changing your password will immediately invalidate all other active sessions and revoke API keys temporarily until manually re-confirmed. 
                    A confirmation email will be sent to <strong>{user.email}</strong>.
                  </p>
                </div>
              </div>

              {status && (
                <div className={`p-5 rounded-2xl flex items-center space-x-3 border animate-in slide-in-from-top-2 ${
                  status.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'
                }`}>
                  {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                  <span className="text-sm font-bold">{status.msg}</span>
                </div>
              )}

              <button 
                type="submit"
                disabled={isUpdating}
                className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center space-x-3 disabled:opacity-50"
              >
                {isUpdating ? (
                  <div className="w-5 h-5 border-2 border-[#25D366] border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Save size={20} className="text-[#25D366]" />
                    <span>Securely Save Credentials</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
