
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Smartphone, 
  Key, 
  MessageSquare, 
  Settings, 
  LogOut,
  Bell,
  Search,
  ShieldCheck,
  Menu,
  X,
  User,
  Zap
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Instances from './pages/Instances';
import ApiKeys from './pages/ApiKeys';
import Chat from './pages/Chat';
import AutoReply from './pages/AutoReply';
import SettingsPage from './pages/Settings';
import ProfilePage from './pages/Profile';
import Login from './pages/Login';
import { WhatsAppInstance, ApiKey } from './types';

/**
 * Root Layout & Navigation Hub
 * Mimics Next.js 14 App Router layout logic.
 */
const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // App-wide state - In true Next.js, this might use a Context Provider or State Store
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);

  // Check if user is already logged in on mount
  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    const email = localStorage.getItem('userEmail');
    if (authToken && email) {
      setIsAuthenticated(true);
      setUserEmail(email);
      // Fetch instances from backend
      fetchInstances();
      // Fetch API keys from backend
      fetchApiKeys();
    }
    setIsLoading(false);
  }, []);

  // Fetch instances from backend
  const fetchInstances = async () => {
    try {
      const res = await fetch('http://localhost:3000/instances');
      if (res.ok) {
        const data = await res.json();
        setInstances(data);
      }
    } catch (err) {
      console.error('Failed to fetch instances:', err);
    }
  };

  // Fetch API keys from backend
  const fetchApiKeys = async () => {
    try {
      // First try to load from localStorage as backup
      const storedKeys = localStorage.getItem('apiKeys');
      if (storedKeys) {
        try {
          const parsedKeys = JSON.parse(storedKeys);
          setApiKeys(parsedKeys);
        } catch (e) {
          console.error('Error parsing stored API keys:', e);
        }
      }

      // Then fetch from backend
      const res = await fetch('http://localhost:3000/api/keys');
      if (res.ok) {
        const data = await res.json();
        const backendKeys = data.keys.map((key: string, index: number) => ({
          id: `key_${key.replace(/[^a-zA-Z0-9]/g, '_')}`, // Use the actual key to create a stable ID
          name: `Integration Key ${index + 1}`,
          key: key,
          createdAt: new Date().toISOString().split('T')[0],
          lastUsed: null,
          status: 'active' as const,
          requestCount: 0
        }));
        setApiKeys(backendKeys);
        // Save to localStorage as backup
        localStorage.setItem('apiKeys', JSON.stringify(backendKeys));
      }
    } catch (err) {
      console.error('Failed to fetch API keys:', err);
      // If backend fetch fails, keep using localStorage data if available
    }
  };

  // Handle route changes
  useEffect(() => {
    setIsSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  const handleLoginSuccess = (email: string) => {
    setUserEmail(email);
    setIsAuthenticated(true);
    // Fetch API keys after successful login
    fetchApiKeys();
  };

  // Function to update API keys and persist to localStorage
  const updateApiKeys = (newKeys: ApiKey[]) => {
    setApiKeys(newKeys);
    localStorage.setItem('apiKeys', JSON.stringify(newKeys));
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    setIsAuthenticated(false);
    setUserEmail('');
    setActiveTab('dashboard');
  };

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Page Routing Logic
  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard instances={instances} apiKeys={apiKeys} />;
      case 'instances': return <Instances instances={instances} setInstances={setInstances} />;
      case 'apikeys': return <ApiKeys apiKeys={apiKeys} setApiKeys={updateApiKeys} />;
      case 'chat': return <Chat instances={instances.filter(i => i.status === 'connected')} />;
      case 'autoreply': return <AutoReply />;
      case 'profile': return <ProfilePage userEmail={userEmail} onLogout={handleLogout} />;
      case 'settings': return <SettingsPage />;
      default: return <Dashboard instances={instances} apiKeys={apiKeys} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden text-slate-900 selection:bg-green-100 selection:text-green-900">
      {/* Mobile Navigation Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[60] lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 w-72 bg-white border-r border-slate-200 flex flex-col shadow-2xl lg:shadow-none z-[70] transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) transform
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-8 flex items-center justify-between border-b border-slate-50">
          <div className="flex items-center space-x-4 cursor-pointer group" onClick={() => setActiveTab('dashboard')}>
            <div className="w-12 h-12 bg-slate-900 rounded-[1.25rem] flex items-center justify-center text-[#25D366] shadow-xl group-hover:scale-105 transition-transform">
              <MessageSquare size={24} fill="currentColor" />
            </div>
            <div className="leading-none">
              <span className="text-xl font-black tracking-tighter text-slate-900">Bridge<span className="text-[#25D366]">Pro</span></span>
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-0.5">Control Panel</p>
            </div>
          </div>
          <button className="lg:hidden p-2 text-slate-400 bg-slate-50 rounded-xl" onClick={() => setIsSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-6 py-10 space-y-2 overflow-y-auto custom-scrollbar">
          <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<Smartphone size={18} />} label="Instances" active={activeTab === 'instances'} onClick={() => setActiveTab('instances')} />
          <NavItem icon={<MessageSquare size={18} />} label="Live Chat" active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} />
          <NavItem icon={<Zap size={18} />} label="Auto Reply" active={activeTab === 'autoreply'} onClick={() => setActiveTab('autoreply')} />
          <NavItem icon={<Key size={18} />} label="API Keys" active={activeTab === 'apikeys'} onClick={() => setActiveTab('apikeys')} />
          <NavItem icon={<User size={18} />} label="My Profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
          <NavItem icon={<Settings size={18} />} label="Platform Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>

        <div className="p-6 border-t border-slate-50 space-y-4">
          <div className="px-5 py-4 bg-slate-900 rounded-[1.5rem] border border-slate-800 flex items-center justify-between group cursor-pointer overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 blur-2xl group-hover:bg-green-500/10 transition-colors"></div>
            <div className="relative z-10">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Current Tier</p>
              <span className="text-xs font-black text-white">Enterprise Pro</span>
            </div>
            <ShieldCheck size={18} className="text-[#25D366] relative z-10" />
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-3 px-4 py-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all duration-300 font-bold text-sm"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-12 z-50 shrink-0">
          <div className="flex items-center space-x-6">
            <button 
              className="lg:hidden p-3 text-slate-500 hover:bg-slate-50 rounded-2xl transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={22} />
            </button>
            <div className="hidden md:flex items-center bg-slate-50 rounded-2xl px-5 py-2.5 w-80 lg:w-[400px] border border-slate-100 focus-within:ring-4 focus-within:ring-green-50 focus-within:bg-white focus-within:border-green-400 transition-all">
              <Search className="text-slate-400 mr-3" size={18} />
              <input type="text" placeholder="Search infrastructure..." className="bg-transparent border-none focus:outline-none w-full text-sm font-semibold placeholder:text-slate-400" />
            </div>
          </div>
          
          <div className="flex items-center space-x-4 lg:space-x-8">
            <div className="hidden sm:flex items-center space-x-4 pr-6 border-r border-slate-100">
              <button className="relative p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">
                <Bell size={20} />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#25D366] rounded-full border-2 border-white animate-pulse"></span>
              </button>
            </div>
            
            <div 
              className="flex items-center space-x-4 cursor-pointer group p-1.5 hover:bg-slate-50 rounded-2xl transition-all"
              onClick={() => setActiveTab('profile')}
            >
              <div className="text-right hidden xl:block leading-tight">
                <p className="text-sm font-black text-slate-900">{userEmail.split('@')[0]}</p>
                <p className="text-[10px] text-[#25D366] font-black uppercase tracking-tighter">Root Level</p>
              </div>
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userEmail}`}
                alt="Admin" 
                className="w-10 h-10 rounded-[1.1rem] shadow-lg border-2 border-slate-100 group-hover:border-[#25D366] transition-all" 
              />
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-6 lg:p-12 bg-[#f8fafc] custom-scrollbar scroll-smooth">
          {renderPage()}
        </section>
      </main>
    </div>
  );
};

// Next.js styled NavItem component
const NavItem: React.FC<{ icon: React.ReactNode; label: string; active: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-4 px-5 py-4 rounded-2xl transition-all duration-300 font-bold text-sm group ${
      active 
      ? 'bg-slate-900 text-white shadow-2xl shadow-slate-200 translate-x-1' 
      : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
    }`}
  >
    <span className={`${active ? 'text-[#25D366]' : 'text-slate-300 group-hover:text-slate-500'} transition-colors`}>{icon}</span>
    <span className="tracking-tight">{label}</span>
    {active && <div className="ml-auto w-1.5 h-1.5 bg-[#25D366] rounded-full shadow-[0_0_8px_rgba(37,211,102,0.8)]"></div>}
  </button>
);

export default App;
