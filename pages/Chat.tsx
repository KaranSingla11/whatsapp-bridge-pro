
import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Smile, Paperclip, Search, MoreVertical, CheckCheck, 
  Sparkles, ShieldAlert, CheckCircle, List, ChevronLeft, X,
  MessageSquare
} from 'lucide-react';
import { WhatsAppInstance, ChatMessage } from '../types';
import { generateDraft, checkCompliance } from '../services/geminiService';
import { API_BASE } from '../config';

interface ChatProps {
  instances: WhatsAppInstance[];
}

const Chat: React.FC<ChatProps> = ({ instances }) => {
  const [selectedInstance, setSelectedInstance] = useState<WhatsAppInstance | null>(instances[0] || null);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAiDrafting, setIsAiDrafting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [compliance, setCompliance] = useState<{ compliant: boolean; feedback: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (message.length > 5) {
        const res = await checkCompliance(message);
        setCompliance(res);
      } else {
        setCompliance(null);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [message]);

  // if instances prop changes, ensure we have a selected instance
  useEffect(() => {
    if (!selectedInstance && instances && instances.length) {
      setSelectedInstance(instances[0]);
    }
  }, [instances]);

  // When contact is selected, auto-populate the phone number input
  useEffect(() => {
    if (selectedContact) {
      setPhoneNumber(extractPhoneNumber(selectedContact));
    }
  }, [selectedContact]);

  // Realtime messages via Server-Sent Events
  useEffect(() => {
    if (!selectedInstance) return;
    setMessages([]);
    const url = `${API_BASE}/instances/${selectedInstance.id}/messages/stream`;
    const es = new EventSource(url);

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        // Transform server message format to ChatMessage format
        const msg: ChatMessage = {
          id: data.id,
          from: data.direction === 'received' ? data.to : 'me',
          to: data.to,
          content: data.content,
          timestamp: data.timestamp,
          status: 'delivered',
          direction: data.direction
        };
        console.log('Received SSE message:', msg);
        setMessages(prev => [...prev, msg]);
      } catch (err) {
        console.error('Error parsing SSE message:', err);
      }
    };

    es.onerror = () => {
      console.error('SSE connection error');
      try { es.close(); } catch (e) {}
    };

    return () => { try { es.close(); } catch (e) {} };
  }, [selectedInstance?.id]);

  const handleSendMessage = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault?.();
    if (!message.trim() || !selectedInstance) return;
    if (!phoneNumber.trim()) {
      alert('Please enter a phone number');
      return;
    }

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      from: 'me',
      to: phoneNumber,
      content: message,
      timestamp: new Date().toISOString(),
      status: 'sent',
      direction: 'outgoing'
    };

    setMessages([...messages, newMsg]);
    setMessage('');
    setCompliance(null);
    setIsSending(true);

    try {
      // Send message via backend API
      const url = `${API_BASE}/api/v1/messages/send`;
      console.log('Sending message to:', url, { instanceId: selectedInstance.id, to: phoneNumber, message: message });
      
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer wa_live_demo_key_123'
        },
        body: JSON.stringify({
          instanceId: selectedInstance.id,
          to: phoneNumber,
          message: newMsg.content,
          type: selectedInstance.type || 'web_bridge',
          config: selectedInstance.config
        })
      });

      if (res.ok) {
        const data = await res.json();
        console.log('Message sent successfully:', data);
        setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: 'delivered' } : m));
        setTimeout(() => {
          setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: 'read' } : m));
        }, 1500);
      } else {
        const error = await res.text();
        console.error('Send failed:', res.status, error);
        setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: 'failed' } : m));
      }
    } catch (err) {
      console.error('Send error:', err);
      setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: 'failed' } : m));
    } finally {
      setIsSending(false);
    }
  };

  const handleAiDraft = async () => {
    if (!message) return;
    setIsAiDrafting(true);
    const draft = await generateDraft(message);
    setMessage(draft);
    setIsAiDrafting(false);
  };

  // Helper function to extract phone number from WhatsApp JID format (if needed)
  const extractPhoneNumber = (jid: string): string => {
    if (!jid) return 'Unknown';
    // If it already has + prefix, it's formatted. Otherwise extract from JID format
    if (jid.includes('@')) {
      // Extract phone number from "177773058519141@lid" format
      return '+' + jid.split('@')[0];
    }
    // Already formatted
    return jid;
  };

  // Extract unique contacts from messages with their data
  const getUniqueContacts = () => {
    const contactMap = new Map<string, { phoneNumber: string; lastMessage: string; timestamp: string; direction: string }>();
    messages.forEach(msg => {
      const phone = extractPhoneNumber(msg.to || msg.from || 'Unknown');
      if (!contactMap.has(phone)) {
        contactMap.set(phone, {
          phoneNumber: phone,
          lastMessage: msg.content,
          timestamp: msg.timestamp,
          direction: msg.direction
        });
      } else {
        const existing = contactMap.get(phone)!;
        existing.lastMessage = msg.content;
        existing.timestamp = msg.timestamp;
        existing.direction = msg.direction;
      }
    });
    return Array.from(contactMap.values()).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const handleContactSelect = (phoneNum: string) => {
    const cleanedPhone = extractPhoneNumber(phoneNum);
    setSelectedContact(phoneNum);
    setPhoneNumber(cleanedPhone);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] lg:h-[calc(100vh-140px)]">
      {/* Top Header with Recipient Number, Message Input, and Send - Outside Chat */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-slate-100 px-4 lg:px-8 py-3 shadow-sm">
        <div className="flex gap-3 items-end">
          <div className="w-48">
            <label className="text-[9px] font-black uppercase text-slate-500 block mb-1.5">Recipient Number</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter phone number"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-green-400 focus:border-transparent focus:outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="text-[9px] font-black uppercase text-slate-500 block mb-1.5">Message</label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isSending && handleSendMessage(e)}
              placeholder="Type your message..."
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-green-400 focus:border-transparent focus:outline-none"
            />
          </div>
          <button 
            onClick={handleSendMessage}
            disabled={!message.trim() || !phoneNumber.trim() || isSending}
            title="Send message"
            className={`py-2.5 px-6 rounded-lg font-bold flex items-center gap-2 transition-all transform active:scale-95 shadow-md ${
              message.trim() && phoneNumber.trim() && !isSending ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Send size={16} />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="bg-white rounded-2xl lg:rounded-[2.5rem] shadow-sm border border-slate-100 flex overflow-hidden flex-1">
        {/* Contact List Pane */}
      <div className={`
        w-full lg:w-80 border-r border-slate-100 flex flex-col bg-slate-50/20 transition-all duration-300
        ${selectedContact ? 'hidden lg:flex' : 'flex'}
      `}>
        <div className="p-4 lg:p-6 border-b border-slate-100 bg-white">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-black text-lg lg:text-xl text-slate-800">Direct Live</h2>
              {instances.length > 0 && (
                <select
                  className="text-[9px] font-black uppercase text-slate-400 bg-slate-50 border border-slate-200 px-2 py-1 rounded focus:ring-1 focus:ring-green-400 cursor-pointer truncate max-w-[100px]"
                  value={selectedInstance?.id}
                  onChange={(e) => setSelectedInstance(instances.find(i => i.id === e.target.value) || null)}
                >
                  {instances.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              )}
            </div>
            <div className="mt-4 relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Filter..." 
                className="w-full bg-slate-100 border-none rounded-xl py-2 pl-9 pr-4 text-xs font-semibold focus:ring-1 focus:ring-green-400"
              />
            </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {getUniqueContacts().length > 0 ? (
            getUniqueContacts().map((contact) => (
              <div 
                key={contact.phoneNumber} 
                onClick={() => handleContactSelect(contact.phoneNumber)}
                className={`p-3 flex items-center space-x-3 cursor-pointer rounded-2xl transition-all ${selectedContact === contact.phoneNumber ? 'bg-white shadow-sm ring-1 ring-slate-100' : 'hover:bg-white/60'}`}
              >
                <div className="relative shrink-0">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl shadow-sm bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                    {contact.phoneNumber.charAt(0).toUpperCase()}
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h4 className="font-bold text-slate-800 text-sm truncate">{contact.phoneNumber}</h4>
                    <span className="text-[8px] text-slate-400 font-black">{new Date(contact.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate font-medium mt-0.5">{contact.lastMessage}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-slate-400 text-sm">No conversations yet</div>
          )}
        </div>
      </div>

      {/* Chat Pane Area */}
      <div className={`
        flex-1 flex flex-col bg-slate-50/50 relative transition-all duration-300
        ${!selectedContact ? 'hidden lg:flex' : 'flex'}
      `}>
        {selectedContact ? (
          <>
            {/* Header with Title and Instance Selector - WhatsApp Style */}
            <div className="bg-slate-50 border-b border-slate-100 px-4 lg:px-8 py-3 lg:py-4 flex items-center justify-between z-10 shadow-sm shrink-0">
              <div className="flex items-center space-x-3 lg:space-x-4 min-w-0 flex-1">
                <button 
                  className="lg:hidden p-2 -ml-2 text-slate-400"
                  onClick={() => setSelectedContact(null)}
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="relative shrink-0">
                  <div className="w-9 h-9 lg:w-11 lg:h-11 rounded-full shadow-md bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                    {selectedContact.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-slate-800 text-sm lg:text-base truncate">{extractPhoneNumber(selectedContact)}</h3>
                  <div className="flex items-center space-x-1.5 overflow-hidden">
                    <span className="text-[10px] font-black uppercase text-green-600 shrink-0">● Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                {instances.length > 0 && (
                  <select 
                    className="text-[8px] font-black uppercase text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg focus:ring-2 focus:ring-green-400 cursor-pointer"
                    value={selectedInstance?.id}
                    onChange={(e) => setSelectedInstance(instances.find(i => i.id === e.target.value) || null)}
                  >
                    {instances.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                )}
              </div>
            </div>

            {/* Message Input Section at Bottom - Minimal */}
            <div className="bg-white border-t border-slate-100 px-4 lg:px-8 py-3 space-y-2 shrink-0 shadow-lg">
              <div className="flex items-center space-x-2 gap-2">
                <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 relative">
                  <input 
                    type="text" 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !isSending && handleSendMessage(e)}
                    placeholder="Quick reply..." 
                    className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-sm font-medium placeholder-slate-400"
                  />
                  <button 
                    onClick={handleAiDraft}
                    disabled={!message || isAiDrafting}
                    title="AI Draft"
                    className={`ml-2 p-1.5 rounded-lg transition-all ${
                      isAiDrafting ? 'bg-purple-100 animate-pulse' : 'text-purple-600 hover:bg-purple-100'
                    }`}
                  >
                    <Sparkles size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 p-4 lg:p-8 overflow-y-auto space-y-4 lg:space-y-6">
              {/* Filter messages for selected contact - show all messages to/from this contact */}
              {(() => {
                const contactMessages = selectedContact 
                  ? messages.filter(m => {
                      // Extract phone numbers from both sides and compare
                      const msgFrom = extractPhoneNumber(m.from === 'me' ? m.to || '' : m.from || '');
                      const msgTo = extractPhoneNumber(m.to || '');
                      const cleanContact = extractPhoneNumber(selectedContact);
                      
                      // Show if message is from this contact OR to this contact
                      return msgFrom === cleanContact || msgTo === cleanContact;
                    })
                  : [];
                
                return contactMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-2 opacity-50">
                    <MessageSquare size={48} />
                    <p className="text-xs font-bold uppercase tracking-widest">No messages yet</p>
                  </div>
                ) : (
                  contactMessages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] lg:max-w-[75%] px-4 py-2.5 lg:px-5 lg:py-3.5 rounded-2xl lg:rounded-3xl shadow-sm text-xs lg:text-sm font-medium ${
                        msg.from === 'me' 
                        ? 'bg-slate-900 text-white rounded-tr-none' 
                        : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                      }`}>
                        {msg.content}
                        <div className="flex items-center justify-end space-x-1.5 mt-2 opacity-60">
                          <span className="text-[8px] font-black uppercase tracking-widest">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {msg.from === 'me' && (
                            <CheckCheck size={12} className={msg.status === 'read' ? 'text-[#25D366]' : 'text-slate-400'} />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                );
              })()}
            </div>

            <div className="px-4 lg:px-8 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-center shrink-0">
              {compliance && (
                <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-[8px] font-bold ${
                  compliance.compliant ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {compliance.compliant ? <CheckCircle size={12} /> : <ShieldAlert size={12} />}
                  <span>{compliance.feedback}</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="hidden lg:flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
              {/* Fix: MessageSquare component is now correctly imported */}
              <MessageSquare size={40} />
            </div>
            <h3 className="text-lg font-black text-slate-800">Select a Conversation</h3>
            <p className="text-sm text-slate-400 max-w-xs mt-2 font-medium">Connect with your clients in real-time through BridgePro secure routing.</p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default Chat;
