import { useEffect, useState, useRef, useCallback } from 'react';
import PageMeta from "../../components/common/PageMeta";
import ConfirmDeleteModal from "../../components/common/ConfirmDeleteModal";
import { io, Socket } from 'socket.io-client';

import api from '../../services/api';
import {
  Users, Search, Filter, MessageSquare, Send, CheckCheck,
  Phone, Mail, Globe, Calendar, Trash2, Download, RefreshCw,
  Clock, Check
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

const getHeaders = () => {
  const token = (sessionStorage.getItem('crm_token') || localStorage.getItem('crm_token'));
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

const chatbotLeadsApi = {
  list: async (params: any) => {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch('/openwa-api/crm/chatbot/leads?' + qs, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch leads');
    return res.json();
  },
  reply: async (id: string, text: string) => {
    const res = await fetch('/openwa-api/crm/chatbot/leads/' + id + '/reply', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ text })
    });
    if (!res.ok) throw new Error('Failed to reply');
    return res.json();
  },
  delete: async (id: string) => {
    const res = await fetch('/openwa-api/crm/chatbot/leads/' + id, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete lead');
    return res.json();
  }
};

const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  useEffect(() => {
    const token = (sessionStorage.getItem('crm_token') || localStorage.getItem('crm_token'));
    if (!token) return;

    const newSocket = io("/crm-events", {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 2000,
    });
    setSocket(newSocket);
    newSocket.on('connect', () => setIsConnected(true));
    newSocket.on('disconnect', () => setIsConnected(false));
    return () => { newSocket.disconnect(); };
  }, []);
  return { socket, isConnected };
};

interface Lead {
  id: string;
  sessionId: string;
  domain: string;
  pageUrl?: string;
  capturedData: { name?: string; email?: string; phone?: string; message?: string };
  messages: Array<{ sender: 'user' | 'bot' | 'agent'; text: string; timestamp: string }>;
  createdAt: string;
  updatedAt: string;
}

export default function ChatbotLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [filterDomain, setFilterDomain] = useState('');
  const [filterDate, setFilterDate] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [filterType, setFilterType] = useState('all');
  
  // Dynamically extract unique domains from the leads array so it updates automatically
  const domains = Array.from(new Set(leads.map(l => l.domain).filter(Boolean)));
  
  const [isBotOnline, setIsBotOnline] = useState(false);
  const [leadsError, setLeadsError] = useState<string | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedLead?.messages]);

  // Mark the currently selected lead as read whenever it's active or receives a new message
  useEffect(() => {
    if (selectedLead && (selectedLead.messages?.length || 0) > 0) {
      const receipts = JSON.parse(localStorage.getItem('chatbot_read_receipts') || '{}');
      receipts[selectedLead.id] = new Date(Date.now() + 1000).toISOString();
      localStorage.setItem('chatbot_read_receipts', JSON.stringify(receipts));
      window.dispatchEvent(new Event('chatbot_read_receipt_updated'));
    }
  }, [selectedLead, selectedLead?.updatedAt]);

  const fetchLeads = useCallback(async () => {
    setLoadingLeads(true);
    setLeadsError(null);
    try {
      const res = await chatbotLeadsApi.list({ page: 1, limit: 100, domain: filterDomain || undefined });
      const body = res as any;
      const data: Lead[] = Array.isArray(body) ? body : (Array.isArray(body.data) ? body.data : []);
      setLeads(data);
      
      if (data.length > 0 && !selectedLead) {
        setSelectedLead(data[0]);
      } else if (selectedLead) {
        const updated = data.find(l => l.id === selectedLead.id);
        if (updated) setSelectedLead(updated);
      }
    } catch (err: any) {
      console.error('Failed to load leads:', err);
      setLeadsError(err.message || String(err));
    } finally {
      setLoadingLeads(false);
    }
  }, [filterDomain, selectedLead]);

  useEffect(() => {
    fetchLeads();
  }, [filterDomain]);

  useEffect(() => {
    if (!socket) return;
    
    // CrmEventsGateway automatically places this socket into user's private room.
    
    socket.on('chatbot:lead:message', (payload: any) => {
      setLeads(prevLeads => {
        const exists = prevLeads.some(l => l.id === payload.leadId);
        
        if (exists) {
          return prevLeads.map(l => {
            if (l.id === payload.leadId) {
              const updatedMessages = [...(l.messages || [])];
              
              if (payload.message) {
                const isDuplicate = updatedMessages.some(m => 
                  m.text === payload.message.text && 
                  m.sender === payload.message.sender && 
                  Math.abs(new Date(m.timestamp).getTime() - new Date(payload.message.timestamp).getTime()) < 1000
                );
                
                if (!isDuplicate) {
                  updatedMessages.push(payload.message);
                }
              }

              const updatedLead = {
                ...l,
                messages: updatedMessages,
                capturedData: { ...l.capturedData, ...payload.capturedData },
                updatedAt: payload.message ? payload.message.timestamp : new Date().toISOString()
              };

              if (selectedLead && selectedLead.id === l.id) {
                setSelectedLead(updatedLead);
              }

              return updatedLead;
            }
            return l;
          }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        } else {
          const newLead: Lead = {
            id: payload.leadId,
            sessionId: payload.sessionId,
            domain: payload.domain,
            capturedData: payload.capturedData || {},
            messages: payload.message ? [payload.message] : [],
            createdAt: payload.message ? payload.message.timestamp : new Date().toISOString(),
            updatedAt: payload.message ? payload.message.timestamp : new Date().toISOString()
          };
          
          if (selectedLead === null) {
            setSelectedLead(newLead);
          }

          return [newLead, ...prevLeads];
        }
      });
    });

    socket.on('chatbot:status', (payload: { instanceId: string; enabled: boolean }) => {
      setIsBotOnline(payload.enabled);
    });

    return () => {
      socket.off('chatbot:lead:message');
      socket.off('chatbot:status');
    };
  }, [socket, selectedLead]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedLead || sending) return;

    const textToSend = replyText.trim();
    setReplyText('');
    setSending(true);

    try {
      const res = await chatbotLeadsApi.reply(selectedLead.id, textToSend);
      const newMsg = {
        sender: 'agent' as const,
        text: textToSend,
        timestamp: new Date().toISOString(),
      };

      const updatedLead = {
        ...selectedLead,
        messages: [...(selectedLead.messages || []), newMsg],
      };
      
      setSelectedLead(updatedLead);
      setLeads(prev => prev.map(l => l.id === selectedLead.id ? updatedLead : l));
    } catch (err: any) {
      alert(err?.message || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const confirmDeleteLead = (lead: Lead, e: React.MouseEvent) => {
    e.stopPropagation();
    setLeadToDelete(lead);
  };

  const executeDeleteLead = async () => {
    if (!leadToDelete) return;
    try {
      await chatbotLeadsApi.delete(leadToDelete.id);
      setLeads(prev => prev.filter(l => l.id !== leadToDelete.id));
      if (selectedLead?.id === leadToDelete.id) {
        setSelectedLead(null);
      }
      setLeadToDelete(null);
    } catch (err) {
      alert('Failed to delete lead');
    }
  };

  const handleExportCSV = () => {
    const rows = [
      ['Name', 'Email', 'Phone', 'Domain', 'Page URL', 'Total Messages', 'Date Created'],
      ...leads.map(l => [
        l.capturedData?.name || 'Anonymous Visitor',
        l.capturedData?.email || '',
        l.capturedData?.phone || '',
        l.domain,
        l.pageUrl || '',
        (l.messages || []).length.toString(),
        new Date(l.createdAt).toLocaleString(),
      ])
    ];
    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chatbot-leads-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getDisplayName = (lead: Lead) => {
    return lead?.capturedData?.name || lead?.capturedData?.email || lead?.capturedData?.phone || 'Anonymous Visitor';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  };

  const filteredLeads = leads.filter(lead => {
    const name = (lead?.capturedData?.name || '').toLowerCase();
    const email = (lead?.capturedData?.email || '').toLowerCase();
    const phone = (lead?.capturedData?.phone || '').toLowerCase();
    const domain = (lead?.domain || '').toLowerCase();
    const q = search.toLowerCase();
    
    // Search
    if (q && !(name.includes(q) || email.includes(q) || phone.includes(q) || domain.includes(q))) return false;
    
    // Domain
    if (filterDomain && lead.domain !== filterDomain) return false;
    
    // Type
    if (filterType === 'contact' && !lead.capturedData?.email && !lead.capturedData?.phone) return false;
    if (filterType === 'anonymous' && (lead.capturedData?.email || lead.capturedData?.phone)) return false;

    // Date
    if (filterDate !== 'all') {
      const leadDate = new Date(lead.createdAt);
      const now = new Date();
      if (filterDate === 'today') {
        if (leadDate.toDateString() !== now.toDateString()) return false;
      } else if (filterDate === 'week') {
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        if (leadDate < weekAgo) return false;
      } else if (filterDate === 'month') {
        const monthAgo = new Date(now.setDate(now.getDate() - 30));
        if (leadDate < monthAgo) return false;
      } else if (filterDate === 'custom') {
        if (customStartDate && leadDate < new Date(customStartDate)) return false;
        if (customEndDate) {
          const endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999);
          if (leadDate > endDate) return false;
        }
      }
    }

    return true;
  });

  return (
    <>
      <PageMeta title="Chatbot Leads Console" description="Real-time website visitor interactions and captured customer records" />
      
      <ConfirmDeleteModal 
        isOpen={!!leadToDelete} 
        onClose={() => setLeadToDelete(null)} 
        onConfirm={executeDeleteLead} 
        title="Delete Lead" 
        message="Delete this lead and all of its conversation logs? This action cannot be undone." 
        itemName={leadToDelete ? getDisplayName(leadToDelete) : ""} 
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Inbox & Leads</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Real-time visitor chats and captured leads</p>
        </div>
      </div>
      
      <div className="flex bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden" style={{ height: 'calc(100vh - 210px)', minHeight: '500px' }}>
        
        {/* Left Sidebar */}
        <div className="w-[380px] border-r border-gray-200 dark:border-gray-800 flex flex-col bg-slate-50 dark:bg-gray-800">
          
          {/* Header & Search */}
          <div className="p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex flex-col gap-4">
            <div className="flex gap-2 items-center">
              <div className="relative flex-1 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                <input
                  type="text"
                  placeholder="Search leads, emails..."
                  className="w-full bg-slate-100 dark:bg-gray-700 border-none text-sm rounded-full pl-9 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-700 dark:text-slate-200"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <button
                onClick={handleExportCSV}
                className="w-10 h-10 flex items-center justify-center bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
                title="Export CSV"
              >
                <Download size={16} />
              </button>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <select
                    value={filterDomain}
                    onChange={e => setFilterDomain(e.target.value)}
                    className="w-full bg-transparent text-xs text-slate-600 dark:text-slate-400 appearance-none outline-none pl-8 pr-8 py-1 cursor-pointer border-b border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                  >
                    <option value="">All Domains</option>
                    {domains.map(d => (
                      <option key={d} value={d}>{d || 'Unknown'}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={fetchLeads}
                  className="text-slate-400 hover:text-indigo-500 transition-colors p-1"
                  title="Refresh"
                >
                  <RefreshCw size={14} className={loadingLeads ? "animate-spin" : ""} />
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <select
                  value={filterDate}
                  onChange={e => setFilterDate(e.target.value)}
                  className="flex-1 bg-slate-100 dark:bg-gray-700 rounded-md text-[11px] text-slate-600 dark:text-slate-400 outline-none px-2 py-1.5 cursor-pointer"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="custom">Custom Range</option>
                </select>
                
                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  className="flex-1 bg-slate-100 dark:bg-gray-700 rounded-md text-[11px] text-slate-600 dark:text-slate-400 outline-none px-2 py-1.5 cursor-pointer"
                >
                  <option value="all">All Leads</option>
                  <option value="contact">Has Email/Phone</option>
                  <option value="anonymous">Anonymous</option>
                </select>
              </div>

              {filterDate === 'custom' && (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={e => setCustomStartDate(e.target.value)}
                    className="flex-1 bg-slate-100 dark:bg-gray-700 border-none rounded-md text-[11px] text-slate-600 dark:text-slate-400 outline-none px-2 py-1.5"
                    title="Start Date"
                  />
                  <span className="text-slate-400 text-xs">-</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={e => setCustomEndDate(e.target.value)}
                    className="flex-1 bg-slate-100 dark:bg-gray-700 border-none rounded-md text-[11px] text-slate-600 dark:text-slate-400 outline-none px-2 py-1.5"
                    title="End Date"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loadingLeads ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-3">
                <RefreshCw size={24} className="animate-spin text-indigo-500" />
                <span className="text-sm">Loading conversations...</span>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-3 p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-gray-700 flex items-center justify-center mb-2">
                  <Users size={20} />
                </div>
                <p className="text-sm">No leads match your search criteria.</p>
              </div>
            ) : (
              <div className="flex flex-col p-2 gap-1">
                {filteredLeads.map(lead => {
                  const isActive = selectedLead?.id === lead.id;
                  const lastMsg = lead.messages && lead.messages.length > 0 ? lead.messages[lead.messages.length - 1] : null;
                  const displayName = getDisplayName(lead);
                  
                  return (
                    <div
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className={`relative group flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                        isActive 
                          ? 'bg-indigo-50 dark:bg-indigo-500/10 shadow-sm' 
                          : 'hover:bg-white dark:hover:bg-gray-900 hover:shadow-sm'
                      }`}
                    >
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shadow-inner ${
                        isActive ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' : 'bg-slate-200 dark:bg-gray-700 text-slate-600 dark:text-slate-300'
                      }`}>
                        {getInitials(displayName)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1 gap-2">
                          <h4 className={`text-sm font-semibold truncate ${isActive ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-800 dark:text-slate-200'}`}>
                            {displayName}
                          </h4>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {lead.updatedAt && (
                              <span className={`text-[10px] whitespace-nowrap ${isActive ? 'text-indigo-500' : 'text-slate-400'}`}>
                                {formatDistanceToNow(new Date(lead.updatedAt), { addSuffix: false })}
                              </span>
                            )}
                            <button
                              onClick={(e) => confirmDeleteLead(lead, e)}
                              className={`p-1 rounded-md text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 ${isActive ? 'opacity-100' : ''}`}
                              title="Delete lead"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 pr-2">
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex-1">
                            {lastMsg ? (
                              <>
                                {lastMsg.sender === 'agent' && <span className="text-indigo-500 font-medium">You: </span>}
                                {lastMsg.sender === 'bot' && <span className="text-slate-400">Bot: </span>}
                                {lastMsg.text}
                              </>
                            ) : (
                              <span className="italic text-slate-400">Lead captured (No messages)</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Conversation Area */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 relative">
          {selectedLead ? (
            <>
              {/* Header */}
              <div className="h-[72px] px-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-lg font-bold shadow-md">
                    {getInitials(getDisplayName(selectedLead))}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-800 dark:text-white">
                        {getDisplayName(selectedLead)}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      {selectedLead.capturedData?.email && (
                        <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <Mail size={12} /> {selectedLead.capturedData.email}
                        </span>
                      )}
                      {selectedLead.capturedData?.phone && (
                        <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <Phone size={12} /> {selectedLead.capturedData.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {selectedLead.pageUrl && (
                    <a 
                      href={selectedLead.pageUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-3 py-1.5 rounded-full transition-colors"
                    >
                      <Globe size={12} /> View Page
                    </a>
                  )}
                  <span className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock size={12} /> {format(new Date(selectedLead.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>

              {/* Chat Transcript Area */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-gray-700/20 scroll-smooth">
                {(!selectedLead.messages || selectedLead.messages.length === 0) ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center mb-4 transform -rotate-6">
                      <MessageSquare size={28} className="text-indigo-300" />
                    </div>
                    <p className="text-sm font-medium text-slate-500">Form filled leads captured, but no conversation happened.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 max-w-3xl mx-auto w-full">
                    {selectedLead.messages.map((msg, idx) => {
                      const isVisitor = msg.sender === 'user';
                      const isBot = msg.sender === 'bot';
                      const isAgent = msg.sender === 'agent';
                      
                      return (
                        <div
                          key={idx}
                          className={`flex flex-col max-w-[85%] ${isVisitor ? 'self-end items-end' : 'self-start items-start'}`}
                        >
                          <div 
                            className={`px-4 py-3 shadow-sm ${
                              isVisitor 
                                ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-[20px_20px_4px_20px]' 
                                : isBot 
                                  ? 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-slate-800 dark:text-slate-200 rounded-[20px_20px_20px_4px]'
                                  : 'bg-slate-100 dark:bg-gray-700 text-slate-800 dark:text-slate-200 rounded-[20px_20px_20px_4px]'
                            }`}
                          >
                            <div className="text-[13.5px] leading-relaxed whitespace-pre-wrap">
                              {msg.text}
                            </div>
                          </div>
                          
                          <div className={`flex items-center gap-1.5 mt-1.5 px-1 text-[10px] font-medium text-slate-400 dark:text-slate-500 ${isVisitor ? 'flex-row-reverse' : ''}`}>
                            <span className="uppercase tracking-wider opacity-80">
                              {isBot ? '🤖 Bot' : isAgent ? 'Agent' : 'Visitor'}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                            <span>{msg.timestamp ? format(new Date(msg.timestamp), 'h:mm a') : ''}</span>
                            {isVisitor && <Check size={12} className="text-indigo-400 ml-0.5" />}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} className="h-2" />
                  </div>
                )}
              </div>

              {/* Composer removed as per user request */}
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
              <div className="w-24 h-24 rounded-full bg-slate-50 dark:bg-gray-700 border-2 border-dashed border-slate-200 dark:border-gray-700 flex items-center justify-center mb-6">
                <Users size={32} className="text-indigo-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">Select a Conversation</h3>
              <p className="text-sm max-w-sm text-center leading-relaxed">
                Choose a visitor from the left sidebar to view their captured details, and jump into the chat.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
