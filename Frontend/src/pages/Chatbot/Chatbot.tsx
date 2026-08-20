
import { useEffect, useState, useRef } from 'react';
import PageMeta from "../../components/common/PageMeta";
import { WIDGET_SCRIPT } from "./widget-script";
const API_BASE = '/openwa-api'; // Or standard backend url
const getAuthHeaders = () => {
  const token = sessionStorage.getItem('crm_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': 'Bearer ' + token } : {})
  };
};

const chatbotApi = {
  get: async () => fetch(API_BASE + '/crm/chatbot/settings', { headers: getAuthHeaders() }).then(r => r.json()).then(data => ({ data })),
  update: async (payload) => fetch(API_BASE + '/crm/chatbot/settings', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(payload) }).then(r => r.json())
};

const knowledgeApi = {
  list: async () => fetch(API_BASE + '/crm/chatbot/knowledge', { headers: getAuthHeaders() }).then(r => r.json()),
  create: async (payload) => fetch(API_BASE + '/crm/chatbot/knowledge', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(payload) }).then(r => r.json()),
  update: async (id, payload) => fetch(API_BASE + '/crm/chatbot/knowledge/' + id, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(payload) }).then(r => r.json()),
  delete: async (id) => fetch(API_BASE + '/crm/chatbot/knowledge/' + id, { method: 'DELETE', headers: getAuthHeaders() }),
  test: async (text, chatbotId) => fetch(API_BASE + '/api/v1/chatbot/widget/message', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chatbotId: chatbotId, sessionId: 'test-session-123', message: text }) }).then(r => r.json()).then(data => ({ data }))
};
import {
  Bot, Plus, Trash2, Save, Copy, CheckCheck, ToggleLeft, ToggleRight,
  Zap, MessageSquare, Code2, Settings, Globe, Eye, Send, Palette,
  Shield, X, ChevronRight, Monitor, Sparkles, User, Check, BookOpen,
  Search, Edit2, Brain, Tag, Star, AlertCircle, RefreshCw, ChevronDown, Info
} from 'lucide-react';

interface ChatbotRule {
  _id?: string;
  keyword: string;
  response: string;
  matchType: 'exact' | 'contains' | 'startsWith';
}

type Tab = 'settings' | 'appearance' | 'rules' | 'preview' | 'embed' | 'knowledge';

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: 'settings', label: 'Bot Identity & Settings', icon: Settings },
  { key: 'appearance', label: 'Appearance & Themes', icon: Palette },
  { key: 'rules', label: 'Auto-Reply Rules', icon: Zap },
  { key: 'knowledge', label: 'Company Knowledge', icon: BookOpen },
  { key: 'preview', label: 'Test Simulator', icon: Eye },
  { key: 'embed', label: 'Embed Widget', icon: Code2 },
];

const KNOWLEDGE_CATEGORIES = [
  'Company', 'Products', 'Services', 'Pricing', 'Commission', 'Subscription',
  'Restaurant', 'Customer', 'Delivery', 'Orders', 'Payments', 'Refunds',
  'Policies', 'Locations', 'Features', 'Support', 'FAQ', 'Other',
];

const PRESET_COLORS = [
  { label: 'WhatsApp Green', primary: '#25D366', secondary: '#128C7E' },
  { label: 'Royal Indigo', primary: '#6366F1', secondary: '#4F46E5' },
  { label: 'Sunset Purple', primary: '#8B5CF6', secondary: '#D946EF' },
  { label: 'Neon Emerald', primary: '#10B981', secondary: '#059669' },
  { label: 'Vibrant Ruby', primary: '#F43F5E', secondary: '#BE123C' },
  { label: 'Classic Slate', primary: '#475569', secondary: '#1E293B' },
];

const ICON_OPTIONS = [
  { key: 'bot', icon: Bot, label: 'Default Bot' },
  { key: 'sparkles', icon: Sparkles, label: 'AI Magic' },
  { key: 'message', icon: MessageSquare, label: 'Chat Balloon' },
  { key: 'user', icon: User, label: 'Human Assistant' },
  { key: 'zap', icon: Zap, label: 'Instant Agent' },
  { key: 'globe', icon: Globe, label: 'Global Help' },
];

const RULE_TEMPLATES = [
  { keyword: 'hello', response: 'Hello! 👋 How can we help you today? Ask a question or share your contact details to connect.' },
  { keyword: 'talk', response: 'We would love to speak with you! Please share your phone number or email and our representative will contact you shortly.' },
  { keyword: 'price', response: 'Our pricing plans start from just $19/month. You can find our full pricing structure here: https://example.com/pricing' },
  { keyword: 'hours', response: 'Our support team is active Monday to Friday from 9 AM to 6 PM EST. Feel free to leave a message and we will respond as soon as we are online!' },
  { keyword: 'contact', response: 'You can reach our helpdesk via email at support@example.com or call us directly at +1-800-555-0199.' },
  { keyword: 'discount', response: 'Use coupon code WAFLOW10 at checkout to get an extra 10% off on your first month!' },
];

export default function ChatbotPage() {
  // General settings
  const [enabled, setEnabled] = useState(false);
  const [botName, setBotName] = useState('Waflow Bot');
  const [botIcon, setBotIcon] = useState('bot');
  const [welcomeMessage, setWelcomeMessage] = useState('Hello! Welcome. How can I help you today? 👋');
  const [fallbackMessage, setFallbackMessage] = useState("Thanks for reaching out! 🚀 Share your details or ask a question and our team will connect with you right away.");
  const [offlineMessage, setOfflineMessage] = useState("We're currently offline. Please leave a message and we'll get back to you.");
  const [headerText, setHeaderText] = useState('Chat with us');
  const [subHeaderText, setSubHeaderText] = useState('We typically reply within minutes');
  const [buttonLabel, setButtonLabel] = useState('Chat');
  const [collectLeads, setCollectLeads] = useState(false);
  const [leadFields, setLeadFields] = useState<Array<'name' | 'email' | 'phone'>>(['name', 'email']);

  // Appearance
  const [primaryColor, setPrimaryColor] = useState('#25D366');
  const [secondaryColor, setSecondaryColor] = useState('#128C7E');
  const [gradient, setGradient] = useState(true);
  const [gradientAngle, setGradientAngle] = useState(135);
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'>('bottom-right');
  const [theme, setTheme] = useState<'classic' | 'glassmorphic'>('glassmorphic');

  // Chatbot ID
  const [chatbotId, setChatbotId] = useState<string>('');

  // Rules
  const [rules, setRules] = useState<ChatbotRule[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('settings');
  const [copied, setCopied] = useState(false);
  const [showIntegrationGuide, setShowIntegrationGuide] = useState(false);
  
  // Floating Simulator state
  const [floatingOpen, setFloatingOpen] = useState(true);
  const [simulatedLeadDone, setSimulatedLeadDone] = useState(false);
  const [simulatedName, setSimulatedName] = useState('');
  const [simulatedEmail, setSimulatedEmail] = useState('');
  const [simulatedPhone, setSimulatedPhone] = useState('');

  // Preview messages
  const [previewMessages, setPreviewMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; time: string }>>([]);
  const [previewInput, setPreviewInput] = useState('');
  const [previewTyping, setPreviewTyping] = useState(false);
  const previewEndRef = useRef<HTMLDivElement>(null);

  // ── Company Knowledge state ──────────────────────────────────────
  interface KnowledgeItem {
    _id: string; title: string; category: string; content: string;
    keywords: string[]; synonyms: string[]; priority: number;
    status: 'active' | 'inactive'; createdAt: string;
  }
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [knowledgeLoading, setKnowledgeLoading] = useState(false);
  const [knowledgeSearch, setKnowledgeSearch] = useState('');
  const [knowledgeCategoryFilter, setKnowledgeCategoryFilter] = useState('');
  const [knowledgeStatusFilter, setKnowledgeStatusFilter] = useState('');
  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const [kForm, setKForm] = useState({
    title: '', category: 'Other', content: '',
    keywords: '', synonyms: '', priority: 5, status: 'active' as 'active' | 'inactive' });
  const [kSaving, setKSaving] = useState(false);
  // Test chat panel
  const [testQuery, setTestQuery] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testMessages, setTestMessages] = useState<Array<{
    role: 'user' | 'bot';
    text: string;
    meta?: { intent: string; confidence: number; knowledgeTitle: string | null; suggestions: string[] };
  }>>([]);
  const testEndRef = useRef<HTMLDivElement>(null);

  const backendUrl = import.meta.env.VITE_API_URL || (typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:2785`
    : 'http://localhost:2785');

  

  useEffect(() => {
    chatbotApi.get().then((res) => {
      const d = res.data;
      if (d) {
        setEnabled(d.enabled || false);
        setBotName(d.botName || 'Waflow Bot');
        setBotIcon(d.botIcon || 'bot');
        setWelcomeMessage(d.welcomeMessage || 'Hello! Welcome. How can I help you today? 👋');
        setFallbackMessage(d.fallbackMessage || "Thanks for reaching out! 🚀 Share your details or ask a question and our team will connect with you right away.");
        setOfflineMessage(d.offlineMessage || "We're currently offline.");
        setHeaderText(d.headerText || 'Chat with us');
        setSubHeaderText(d.subHeaderText || 'We typically reply within minutes');
        setButtonLabel(d.buttonLabel || 'Chat');
        setPrimaryColor(d.primaryColor || '#25D366');
        setSecondaryColor(d.secondaryColor || '#128C7E');
        setGradient(d.gradient !== undefined ? d.gradient : true);
        setGradientAngle(d.gradientAngle !== undefined ? d.gradientAngle : 135);
        setPosition(d.position || 'bottom-right');
        setTheme(d.theme || 'glassmorphic');
        setChatbotId(d.id || d._id || '');
        setRules(d.rules || []);
        setCollectLeads(d.collectLeads || false);
        setLeadFields(d.leadFields || ['name', 'email']);
      }
    }).catch(() => { }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab === 'preview') {
      setPreviewMessages([{ sender: 'bot', text: welcomeMessage, time: now() }]);
    }
  }, [activeTab, welcomeMessage]);

  useEffect(() => {
    previewEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [previewMessages, previewTyping, floatingOpen, simulatedLeadDone]);

  const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        enabled, botName, botIcon, welcomeMessage, fallbackMessage, offlineMessage,
        headerText, subHeaderText, buttonLabel,
        primaryColor, secondaryColor, gradient, gradientAngle, position, theme,
        rules, collectLeads, leadFields };
      const res = await chatbotApi.update(payload);
      
      if (res && res.data && (res.data.id || res.data._id)) {
        setChatbotId(res.data.id || res.data._id);
      } else if (res && (res.id || res._id)) {
        setChatbotId(res.id || res._id);
      } else {
        // Fallback to fetch
        const fresh = await chatbotApi.get();
        if (fresh && fresh.data && (fresh.data.id || fresh.data._id)) {
          setChatbotId(fresh.data.id || fresh.data._id);
        }
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      alert('Failed to save configuration. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Rules
  const handleAddRule = () => setRules([...rules, { keyword: '', response: '', matchType: 'contains' }]);
  const handleRemoveRule = (i: number) => setRules(rules.filter((_, idx) => idx !== i));
  const handleRuleChange = (i: number, field: keyof ChatbotRule, value: string) => {
    const u = [...rules]; (u[i] as any)[field] = value; setRules(u);
  };
  const handleApplyTemplate = (tpl: typeof RULE_TEMPLATES[0]) => {
    if (rules.some(r => r.keyword.toLowerCase() === tpl.keyword)) return;
    setRules([...rules, { keyword: tpl.keyword, response: tpl.response, matchType: 'contains' }]);
  };

  // Lead fields toggle
  const toggleLeadField = (f: 'name' | 'email' | 'phone') => {
    setLeadFields(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  // Preview simulate
  const sendPreviewMessage = () => {
    if (!previewInput.trim()) return;
    const userMsg = previewInput.trim();
    setPreviewMessages(p => [...p, { sender: 'user', text: userMsg, time: now() }]);
    setPreviewInput('');
    setPreviewTyping(true);
    setTimeout(() => {
      const lower = userMsg.toLowerCase();
      const isGreeting = /^(hey|hi|hello|hola|hey there|good morning|good afternoon|good evening|yo|hlo)\b/i.test(lower);
      let reply = fallbackMessage;
      let matchedRule = false;
      for (const rule of rules) {
        if (!rule.keyword) continue;
        const kw = rule.keyword.toLowerCase();
        if ((rule.matchType === 'exact' && lower === kw) ||
          (rule.matchType === 'startsWith' && lower.startsWith(kw)) ||
          (rule.matchType === 'contains' && lower.includes(kw))) {
          reply = rule.response; matchedRule = true; break;
        }
      }
      if (!matchedRule && isGreeting) {
        reply = "Hello! 👋 Thanks for reaching out. How can we help you today? Feel free to ask any question or leave your contact details so our team can connect with you!";
      }
      setPreviewMessages(p => [...p, { sender: 'bot', text: reply, time: now() }]);
      setPreviewTyping(false);
    }, 800);
  };

  // ── Knowledge Handlers ───────────────────────────────────────────

  const loadKnowledge = async () => {
    setKnowledgeLoading(true);
    try {
      const params: Record<string, string> = {};
      if (knowledgeSearch) params.search = knowledgeSearch;
      if (knowledgeCategoryFilter) params.category = knowledgeCategoryFilter;
      if (knowledgeStatusFilter) params.status = knowledgeStatusFilter;
      const res = await knowledgeApi.list(params);
      setKnowledgeItems(Array.isArray(res) ? res : (Array.isArray(res.data) ? res.data : (res.data?.data || [])));
    } catch { /* silent */ } finally {
      setKnowledgeLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'knowledge') loadKnowledge();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, knowledgeSearch, knowledgeCategoryFilter, knowledgeStatusFilter]);

  useEffect(() => {
    testEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [testMessages]);

  const openAddModal = () => {
    setEditingItem(null);
    setKForm({ title: '', category: 'Other', content: '', keywords: '', synonyms: '', priority: 5, status: 'active' });
    setShowKnowledgeModal(true);
  };

  const openEditModal = (item: KnowledgeItem) => {
    setEditingItem(item);
    setKForm({
      title: item.title,
      category: item.category,
      content: item.content,
      keywords: item.keywords.join(', '),
      synonyms: item.synonyms.join(', '),
      priority: item.priority,
      status: item.status });
    setShowKnowledgeModal(true);
  };

  const handleSaveKnowledge = async () => {
    if (!kForm.title.trim() || !kForm.content.trim()) return;
    setKSaving(true);
    try {
      const payload = {
        title: kForm.title.trim(),
        category: kForm.category,
        content: kForm.content.trim(),
        keywords: kForm.keywords.split(',').map(k => k.trim()).filter(Boolean),
        synonyms: kForm.synonyms.split(',').map(s => s.trim()).filter(Boolean),
        priority: kForm.priority,
        status: kForm.status };
      if (editingItem) {
        await knowledgeApi.update(editingItem._id, payload);
      } else {
        await knowledgeApi.create(payload);
      }
      setShowKnowledgeModal(false);
      loadKnowledge();
    } catch { alert('Failed to save knowledge. Please try again.'); } finally {
      setKSaving(false);
    }
  };

  const handleDeleteKnowledge = async (id: string) => {
    if (!confirm('Delete this knowledge item? This cannot be undone.')) return;
    try {
      await knowledgeApi.delete(id);
      loadKnowledge();
    } catch { alert('Failed to delete. Please try again.'); }
  };

  const handleToggleKnowledgeStatus = async (item: KnowledgeItem) => {
    try {
      await knowledgeApi.update(item._id, { status: item.status === 'active' ? 'inactive' : 'active' });
      loadKnowledge();
    } catch { /* silent */ }
  };

  const sendTestMessage = async () => {
    if (!testQuery.trim() || testLoading) return;
    const msg = testQuery.trim();
    setTestQuery('');
    setTestMessages(p => [...p, { role: 'user', text: msg }]);
    setTestLoading(true);
    try {
      const res = await knowledgeApi.test(msg, chatbotId);
      const d = res.data;
      setTestMessages(p => [...p, {
        role: 'bot', text: d.reply,
        meta: { intent: d.intent, confidence: d.confidence, knowledgeTitle: d.knowledgeTitle, suggestions: d.suggestions } }]);
    } catch {
      setTestMessages(p => [...p, { role: 'bot', text: 'Error running test. Please try again.' }]);
    } finally {
      setTestLoading(false);
    }
  };


  const sOpen = '\x3Cscript\x3E';
  const sClose = '\x3C/script\x3E';
  const embedCode = [
    '\x3C!-- Waflow WhatsApp Chatbot Widget --\x3E',
    sOpen,
    '  window.WaflowConfig = {',
    `    apiUrl: '${backendUrl}',`,
    `    position: '${position}',`,
    `    primaryColor: '${primaryColor}',`,
    `    secondaryColor: '${secondaryColor}',`,
    `    gradient: ${gradient},`,
    `    gradientAngle: ${gradientAngle},`,
    `    botName: '${botName.replace(/'/g, "\\'")}',`,
    `    botIcon: '${botIcon}',`,
    `    headerText: '${headerText.replace(/'/g, "\\'")}',`,
    `    subHeaderText: '${subHeaderText.replace(/'/g, "\\'")}',`,
    `    buttonLabel: '${buttonLabel.replace(/'/g, "\\'")}',`,
    `    collectLeads: ${collectLeads},`,
    `    leadFields: ${JSON.stringify(leadFields)},`,
    `    theme: '${theme}',`,
    `    chatbotId: '${chatbotId}',`,
    '  };',
    '',
    WIDGET_SCRIPT,
    sClose,
  ].join('\n');

  const handleCopy = () => { navigator.clipboard.writeText(embedCode); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  // Calculate step completions for onboarding
  const steps = [
    { n: 1, label: 'Identity', desc: 'Set name & welcome prompt', tab: 'settings' as Tab, isComplete: botName.trim().length > 0 && welcomeMessage.trim().length > 0 },
    { n: 2, label: 'Appearance', desc: 'Set branding & style', tab: 'appearance' as Tab, isComplete: !!primaryColor },
    { n: 3, label: 'Auto-Reply Rules', desc: 'Add response keywords', tab: 'rules' as Tab, isComplete: rules.length > 0 },
    { n: 4, label: 'Copy & Embed', desc: 'Integrate into website', tab: 'embed' as Tab, isComplete: copied },
  ];
  const completedCount = steps.filter(s => s.isComplete).length;
  const completionPercentage = Math.round((completedCount / steps.length) * 100);

  // Render Bot Icon dynamically
  const renderBotIcon = (size: number, color?: string) => {
    const isUrl = botIcon.startsWith('http://') || botIcon.startsWith('https://') || botIcon.startsWith('/') || botIcon.includes('.');
    if (isUrl) {
      return (
        <img
          src={botIcon}
          alt="Bot Avatar"
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            objectFit: 'cover' }}
          onError={(e) => {
            // fallback if image fails to load
            e.currentTarget.style.display = 'none';
          }}
        />
      );
    }
    const selected = ICON_OPTIONS.find(o => o.key === botIcon) || ICON_OPTIONS[0];
    const IconComponent = selected.icon;
    return <IconComponent size={size} style={{ color: color || 'white' }} />;
  };

  const headerGradientStyle = gradient
    ? 'linear-gradient(' + gradientAngle + 'deg, ' + primaryColor + ', ' + secondaryColor + ')'
    : primaryColor;

  if (loading) {
    return (
      <div>
        <PageMeta title="Chatbot" description="AI-powered auto-response engine" />
<div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chatbot</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Premium keyword-triggered auto-response engine for WhatsApp
            </p>
          </div>
        </div>
        <div className="page-content">
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-6 p-16 text-center">
            <div className="w-15 h-15 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mx-auto mb-4">
              <Bot size={28} color="white" />
            </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading chatbot configuration...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageMeta title="Chatbot" description="Premium keyword-triggered auto-response engine for WhatsApp" />
<div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chatbot</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Premium keyword-triggered auto-response engine for WhatsApp
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-6">

        {/* ── Hero Status Banner ── */}
        <div
          style={{ marginBottom: 24, padding: '20px 24px' }}
          className={`rounded-2xl border flex items-center justify-between flex-wrap gap-4 ${
            enabled
              ? 'border-green-500/30 bg-gradient-to-br from-green-500/10 to-teal-500/10'
              : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
          }`}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300" style={{ background: enabled ? headerGradientStyle : "var(--color-gray-100)", boxShadow: enabled ? `0 4px 24px ${primaryColor}55` : "none" }}>
              {renderBotIcon(26, enabled ? 'white' : 'var(--color-gray-500)')}
            </div>
            <div>
              <div className="font-semibold text-base mb-1 text-gray-900 dark:text-gray-100">{botName} Auto-Responder</div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400">
                {enabled
                  ? '🟢 Active • ' + rules.length + ' rules'
                  : '⚫ Inactive — enable to start auto-responding'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setEnabled(!enabled)} className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${enabled ? 'bg-brand-50 text-brand-600 border border-brand-200' : 'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'}`}>
              {enabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
              {enabled ? 'Enabled' : 'Disabled'}
            </button>

            <button
              className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition flex items-center gap-2 justify-center"
              onClick={handleSave}
              disabled={saving}
              className="min-w-[120px] px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {saved ? <><CheckCheck size={15} /> Saved!</> : saving ? <><Save size={15} /> Saving...</> : <><Save size={15} /> Save Settings</>}
            </button>
          </div>
        </div>

        {/* ── Tab Navigation ── */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-800 mb-6">
          {TABS.map(({ key, label, icon: Icon }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-200 border-b-2 ${isActive ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}`}
              >
                <Icon size={16} />
                {label}
                {key === 'rules' && rules.length > 0 && (
                  <span className={`ml-1.5 py-0.5 px-2 rounded-full text-[10px] font-bold ${isActive ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                    {rules.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ══════════════════════════════════════════ SETTINGS TAB ══ */}
        {activeTab === 'settings' && (
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-6">
              <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100 dark:border-gray-800"><Bot size={16} className="text-accent" /><h3 className="text-lg font-bold text-gray-900 dark:text-white">Bot Identity
              </h3></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Bot Display Name</label>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2">The name shown in the chat window.</p>
                  <input className="w-full text-sm px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 outline-none focus:border-brand-500 transition-all" value={botName} onChange={e => setBotName(e.target.value)} placeholder="e.g. Support Bot" />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Floating Button Label</label>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2">Text printed next to the trigger button.</p>
                  <input className="w-full text-sm px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 outline-none focus:border-brand-500 transition-all" value={buttonLabel} onChange={e => setButtonLabel(e.target.value)} placeholder="Chat" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-6">
              <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100 dark:border-gray-800"><MessageSquare size={16} className="text-accent" /><h3 className="text-lg font-bold text-gray-900 dark:text-white">Widget Text & Labels
              </h3></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Chat Header Title</label>
                  <input className="w-full text-sm px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 outline-none focus:border-brand-500 transition-all" value={headerText} onChange={e => setHeaderText(e.target.value)} placeholder="Chat with us" />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Header Sub-text</label>
                  <input className="w-full text-sm px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 outline-none focus:border-brand-500 transition-all" value={subHeaderText} onChange={e => setSubHeaderText(e.target.value)} placeholder="We typically reply within minutes" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-6">
              <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100 dark:border-gray-800"><MessageSquare size={16} className="text-accent" /><h3 className="text-lg font-bold text-gray-900 dark:text-white">Bot Messages
              </h3></div>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Welcome Message</label>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2">Sent when a new visitor opens the chat.</p>
                  <textarea className="w-full text-sm px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 outline-none focus:border-brand-500 transition-all" rows={3} value={welcomeMessage} onChange={e => setWelcomeMessage(e.target.value)} />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Fallback Message</label>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2">Sent when no keyword rule matches.</p>
                  <textarea className="w-full text-sm px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 outline-none focus:border-brand-500 transition-all" rows={3} value={fallbackMessage} onChange={e => setFallbackMessage(e.target.value)} />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Offline Message</label>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2">Shown when chatbot is disabled.</p>
                  <textarea className="w-full text-sm px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 outline-none focus:border-brand-500 transition-all" rows={2} value={offlineMessage} onChange={e => setOfflineMessage(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-6">
              <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100 dark:border-gray-800"><Shield size={16} className="text-amber-500" /><h3 className="text-lg font-bold text-gray-900 dark:text-white">Lead Collection
              </h3></div>
              <div className={`flex items-center justify-between mb-4 p-4 rounded-xl border transition-colors ${collectLeads ? 'bg-brand-500/10 border-brand-500/30 dark:bg-brand-500/20 dark:border-brand-500/40' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                <div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">Collect Visitor Information</div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Ask for contact details before the chat starts</div>
                </div>
                <button onClick={() => setCollectLeads(!collectLeads)} className={`appearance-none bg-transparent border-none cursor-pointer transition-colors ${collectLeads ? "text-brand-500" : "text-gray-500"}`}>
                  {collectLeads ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                </button>
              </div>

              {collectLeads && (
                <div>
                  <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block mb-3">Fields to Collect</label>
                  <div className="flex gap-2.5">
                    {(['name', 'email', 'phone'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => toggleLeadField(f)}
                        className={`px-5 py-2 rounded-full text-sm font-semibold capitalize transition-all cursor-pointer border ${leadFields.includes(f) ? 'bg-brand-50 text-brand-600 border-brand-300 dark:bg-brand-900/30 dark:border-brand-500' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2.5">
                    All collected leads will appear in the <strong>Chatbot Leads</strong> section of the sidebar.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════ APPEARANCE TAB ══ */}
        {activeTab === 'appearance' && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">
            <div className="flex flex-col gap-5">
              
              {/* Preset Color Palettes */}
              <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-6">
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100 dark:border-gray-800"><Sparkles size={16} className="text-accent" /><h3 className="text-lg font-bold text-gray-900 dark:text-white">Palette Presets
                </h3></div>
                <div className="grid grid-cols-3 gap-2.5">
                  {PRESET_COLORS.map(palette => {
                    const isSelected = primaryColor === palette.primary && secondaryColor === palette.secondary;
                    return (
                      <button
                        key={palette.label}
                        onClick={() => { setPrimaryColor(palette.primary); setSecondaryColor(palette.secondary); }}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all cursor-pointer ${isSelected ? 'border-brand-500 bg-brand-500/10 dark:bg-brand-500/20' : 'border-gray-200 bg-gray-50 hover:border-brand-300 dark:border-gray-700 dark:bg-gray-800 hover:dark:border-brand-500'}`}
                      >
                        <div style={{ display: 'flex', gap: 4 }}>
                          <span style={{ width: 16, height: 16, borderRadius: '50%', background: palette.primary, display: 'inline-block' }} />
                          <span style={{ width: 16, height: 16, borderRadius: '50%', background: palette.secondary, display: 'inline-block' }} />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300" style={{ fontSize: 11, fontWeight: 500 }}>{palette.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bot Icon Selector */}
              <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-6">
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100 dark:border-gray-800"><Bot size={16} className="text-accent" /><h3 className="text-lg font-bold text-gray-900 dark:text-white">Chatbot Icon / Avatar
                </h3></div>
                <div className="grid grid-cols-3 gap-2.5">
                  {ICON_OPTIONS.map(opt => {
                    const isSelected = botIcon === opt.key;
                    const IconComponent = opt.icon;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => setBotIcon(opt.key)}
                        className={`flex flex-col items-center gap-2 rounded-xl transition-all cursor-pointer ${isSelected ? 'border-[1.5px] border-brand-500 bg-brand-500/10 dark:bg-brand-500/20' : 'border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-brand-400'}`}
                        style={{ padding: '12px 10px', borderRadius: 12 }}
                      >
                        <IconComponent size={20} className={isSelected ? 'text-brand-500' : 'text-gray-500 dark:text-gray-400'} />
                        <span className={`text-[11px] font-medium ${isSelected ? 'text-brand-500' : 'text-gray-600 dark:text-gray-400'}`}>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div style={{ marginTop: 16 }}>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Or Paste Custom Avatar Image URL</label>
                  <input
                    type="text"
                    className="w-full text-xs px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 outline-none focus:border-brand-500 transition-all"
                    placeholder="https://example.com/avatar.png"
                    value={botIcon.startsWith('http://') || botIcon.startsWith('https://') || botIcon.startsWith('/') || botIcon.includes('.') ? botIcon : ''}
                    onChange={e => {
                      const val = e.target.value.trim();
                      setBotIcon(val || 'bot');
                    }}
                  />
                  <p className="text-[10px] text-gray-500 dark:text-gray-400" style={{ marginTop: 4 }}>
                    Supports PNG, JPG, WebP, or SVG. Overrides preset icon selections.
                  </p>
                </div>
              </div>

              {/* Custom Colors & Gradients */}
              <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-6">
                <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100 dark:border-gray-800"><Palette size={16} className="text-accent" /><h3 className="text-lg font-bold text-gray-900 dark:text-white">Custom Brand Colors
                </h3></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Primary Color</label>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} style={{ width: 44, height: 38, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 8 }} />
                      <input type="text" className="w-full text-sm px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-mono outline-none focus:border-brand-500 transition-all" style={{ maxWidth: 120 }} value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Secondary Color</label>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} style={{ width: 44, height: 38, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 8 }} />
                      <input type="text" className="w-full text-sm px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-mono outline-none focus:border-brand-500 transition-all" style={{ maxWidth: 120 }} value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} />
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <div>
                      <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">Gradient Header</div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Blend primary and secondary colors</div>
                    </div>
                    <button onClick={() => setGradient(!gradient)} className={`appearance-none bg-transparent border-none cursor-pointer transition-colors ${gradient ? "text-brand-500" : "text-gray-500 dark:text-gray-400"}`}>
                      {gradient ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                    </button>
                  </div>

                  {gradient && (
                    <div style={{ padding: '4px 8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span className="font-semibold text-xs text-gray-900 dark:text-gray-100">Gradient Angle</span>
                        <span className="font-mono text-xs text-gray-700 dark:text-gray-300">{gradientAngle}°</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={gradientAngle}
                        onChange={e => setGradientAngle(Number(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--color-brand-500)', cursor: 'pointer' }}
                      />
                      <div className="text-gray-500 dark:text-gray-400" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10 }}>
                        <span>0°</span>
                        <span>90°</span>
                        <span>180°</span>
                        <span>270°</span>
                        <span>360°</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-6">
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100 dark:border-gray-800"><Sparkles size={16} className="text-accent" /><h3 className="text-lg font-bold text-gray-900 dark:text-white">Visual Theme style
                </h3></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {(['classic', 'glassmorphic'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`py-3 px-4 rounded-xl text-sm font-medium capitalize transition-all cursor-pointer ${
                        theme === t
                          ? 'bg-brand-500 text-white border-[1.5px] border-brand-500 shadow-sm'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-brand-400'
                      }`}
                    >
                      {t === 'classic' ? 'Classic Solid' : '✨ Premium Glass'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-6">
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100 dark:border-gray-800"><Monitor size={16} className="text-accent" /><h3 className="text-lg font-bold text-gray-900 dark:text-white">Widget Position
                </h3></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {(['bottom-right', 'bottom-left', 'top-right', 'top-left'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setPosition(p)}
                      className={`py-3 px-4 rounded-xl text-sm font-medium capitalize transition-all cursor-pointer ${
                        position === p
                          ? 'bg-brand-500 text-white border-[1.5px] border-brand-500 shadow-sm'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-brand-400'
                      }`}
                    >
                      {p.replace(/-/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Preview Panel */}
            <div className={`rounded-2xl border border-gray-200 dark:border-gray-800 p-6 ${theme === 'glassmorphic' ? '' : 'bg-gray-50 dark:bg-gray-900'}`} style={{
              ...(theme === 'glassmorphic' ? { background: 'linear-gradient(135deg, #f1f3fd 0%, #eef6fd 50%, #f7f3fd 100%)' } : {}),
              position: 'sticky',
              top: 20,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              minHeight: 380,
              transition: 'background 0.3s ease'
            }}>
              <h4 className="font-semibold text-gray-700 dark:text-gray-200" style={{ marginBottom: 16, fontSize: 13 }}>🔴 Live Preview</h4>
              
              {theme === 'glassmorphic' ? (
                /* Premium Glassmorphic Chat Panel */
                <div style={{
                  borderRadius: 24,
                  overflow: 'hidden',
                  background: 'rgba(255, 255, 255, 0.35)',
                  backdropFilter: 'blur(20px) saturate(190%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(190%)',
                  border: '1px solid rgba(255, 255, 255, 0.45)',
                  boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.65), 0 20px 45px -10px rgba(118, 93, 203, 0.12)',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative'
                }}>
                  {/* Subtle Multi-color Gradient Flow inside the glass */}
                  <div style={{
                    position: 'absolute',
                    top: '-50%',
                    left: '-50%',
                    width: '200%',
                    height: '200%',
                    background: 'radial-gradient(circle, ' + primaryColor + '20 0%, ' + secondaryColor + '10 40%, transparent 80%)',
                    zIndex: 0,
                    pointerEvents: 'none' }} />

                  {/* Header */}
                  <div style={{
                    padding: '18px 20px 14px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.25)',
                    zIndex: 1,
                    position: 'relative' }}>
                    {/* Floating Assistant Aura */}
                    <div style={{
                      width: 52,
                      height: 52,
                      borderRadius: '50%',
                      background: headerGradientStyle,
                      boxShadow: '0 8px 24px rgba(99, 102, 241, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 10,
                      position: 'relative'
                    }}>
                      {renderBotIcon(22, 'white')}
                    </div>
                    <div style={{ color: '#1e293b', fontWeight: 600, fontSize: 13, letterSpacing: '-0.01em' }}>{botName}</div>
                    <div style={{ color: '#64748b', fontSize: 10, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                      {subHeaderText || 'Always online'}
                    </div>
                  </div>

                  {/* Message body */}
                  <div style={{ padding: '16px 20px', zIndex: 1, minHeight: 90 }}>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.65)',
                      border: '1px solid rgba(255, 255, 255, 0.7)',
                      padding: '10px 14px',
                      borderRadius: '16px 16px 16px 4px',
                      fontSize: 12,
                      color: '#334155',
                      display: 'inline-block',
                      maxWidth: '85%',
                      lineHeight: 1.45,
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.01)'
                    }}>
                      {welcomeMessage.slice(0, 80)}{welcomeMessage.length > 80 ? '...' : ''}
                    </div>
                  </div>

                  {/* Form area */}
                  <div style={{
                    padding: '12px 14px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    zIndex: 1
                  }}>
                    <div style={{
                      flex: 1,
                      background: 'rgba(255, 255, 255, 0.5)',
                      border: '1px solid rgba(255, 255, 255, 0.5)',
                      borderRadius: 14,
                      padding: '8px 14px',
                      fontSize: 11,
                      color: '#94a3b8'
                    }}>
                      Ask a question...
                    </div>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: 'rgba(255, 255, 255, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: primaryColor,
                      boxShadow: '0 2px 6px rgba(99, 102, 241, 0.08)'
                    }}>
                      <Send size={12} />
                    </div>
                  </div>
                </div>
              ) : (
                /* Classic solid theme panel */
                <div className="border border-gray-200 dark:border-gray-700 shadow-xl" style={{ borderRadius: 16, overflow: 'hidden' }}>
                  <div style={{
                    background: headerGradientStyle,
                    padding: '14px 16px',
                    display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {renderBotIcon(18, 'white')}
                    </div>
                    <div>
                      <div style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>{botName}</div>
                      <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11 }}>{subHeaderText || 'Online'}</div>
                    </div>
                  </div>
                  <div className="bg-[#ECE5DD] dark:bg-gray-800" style={{ padding: 14, minHeight: 100 }}>
                    <div style={{ padding: '10px 13px', borderRadius: '12px 12px 12px 2px', fontSize: 12, display: 'inline-block', maxWidth: '80%', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }} className="bg-white dark:bg-gray-700 text-[#303030] dark:text-gray-100">
                      {welcomeMessage.slice(0, 80)}{welcomeMessage.length > 80 ? '...' : ''}
                    </div>
                  </div>
                  <div className="bg-[#F0F0F0] dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800" style={{ padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ flex: 1, borderRadius: 20, padding: '6px 14px', fontSize: 12 }} className="bg-white dark:bg-gray-800 text-[#999] dark:text-gray-300">Message...</div>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: primaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Send size={14} color="white" />
                    </div>
                  </div>
                </div>
              )}

              <div style={{ marginTop: 14, display: 'flex', justifyContent: position.includes('right') ? 'flex-end' : 'flex-start' }}>
                {theme === 'glassmorphic' ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 20px',
                    borderRadius: '9999px',
                    background: 'rgba(255, 255, 255, 0.45)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    color: primaryColor,
                    fontSize: 13,
                    fontWeight: 600,
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.7), 0 10px 25px -5px rgba(118, 93, 203, 0.15)',
                    cursor: 'default'
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: headerGradientStyle }} />
                    {renderBotIcon(14, primaryColor)}
                    {buttonLabel || 'Chat'}
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 'var(--radius-pill)', background: primaryColor, color: 'white', fontSize: 13, fontWeight: 600, boxShadow: '0 4px 16px ' + primaryColor + '55', cursor: 'default' }}>
                    <MessageSquare size={15} />
                    {buttonLabel || 'Chat'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════ RULES TAB ══ */}
        {activeTab === 'rules' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-6">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100" style={{ fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Zap size={16} className="text-amber-500" /> Auto-Reply Triggers
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400" style={{ marginTop: 4 }}>Configure replies when incoming messages contain specified keywords.</p>
                </div>
                <button className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition flex items-center gap-2 justify-center" onClick={handleAddRule}>
                  <Plus size={14} /> Add Rule
                </button>
              </div>

              {rules.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', border: '2px dashed var(--color-gray-200)', borderRadius: 12 }}>
                  <Zap size={32} style={{ color: 'var(--color-text-tertiary)', margin: '0 auto 12px' }} />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No rules yet. Add a keyword rule to start auto-responding.</p>
                  <button className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition flex items-center gap-2 justify-center mt-4 mx-auto" onClick={handleAddRule}>
                    <Plus size={14} /> Add Your First Rule
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {rules.map((rule, idx) => (
                    <div key={idx} className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-6" style={{ background: '', padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 130px 1fr auto', gap: 10, alignItems: 'start' }}>
                      <div>
                        <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block" style={{ fontSize: 9, marginBottom: 4, letterSpacing: 1 }}>KEYWORD</label>
                        <input type="text" className="w-full text-sm px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 outline-none focus:border-brand-500 transition-all" placeholder="e.g. price, hours" value={rule.keyword} onChange={e => handleRuleChange(idx, 'keyword', e.target.value)} />
                      </div>
                      <div>
                        <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block" style={{ fontSize: 9, marginBottom: 4, letterSpacing: 1 }}>MATCH TYPE</label>
                        <select className="w-full text-sm px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 outline-none focus:border-brand-500 transition-all" value={rule.matchType} onChange={e => handleRuleChange(idx, 'matchType', e.target.value as any)}>
                          <option value="contains">Contains</option>
                          <option value="exact">Exact Match</option>
                          <option value="startsWith">Starts With</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block" style={{ fontSize: 9, marginBottom: 4, letterSpacing: 1 }}>AUTO-RESPONSE</label>
                        <textarea className="w-full text-sm px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 outline-none focus:border-brand-500 transition-all" rows={2} placeholder="Type responses..." value={rule.response} onChange={e => handleRuleChange(idx, 'response', e.target.value)} />
                      </div>
                      <button className="h-[42px] w-[42px] bg-red-50 hover:bg-red-100 text-red-500 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 rounded-lg disabled:opacity-50 transition flex items-center justify-center shrink-0 mt-[20px]" onClick={() => handleRemoveRule(idx)} title="Delete Rule">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Template Presets sidebar */}
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-6">
              <div className="flex items-center gap-2 mb-12 pb-4 border-b border-gray-100 dark:border-gray-800"><Sparkles size={16} className="text-accent" /><h3 className="text-lg font-bold text-gray-900 dark:text-white">Quick Templates
              </h3></div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-4">
                Click to add common auto-reply rule configurations instantly.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {RULE_TEMPLATES.map(tpl => (
                  <button
                    key={tpl.keyword}
                    onClick={() => handleApplyTemplate(tpl)}
                    className="w-full text-left rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-brand-400 dark:hover:border-brand-500 hover:bg-brand-500/5 transition-all"
                    style={{ padding: 12, cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span className="font-bold text-xs text-brand-500">Keyword: &quot;{tpl.keyword}&quot;</span>
                      <Plus size={12} className="text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tpl.response}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════ PREVIEW TAB ══ */}
        {activeTab === 'preview' && (
          <div className="flex flex-col gap-4">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100" style={{ fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Eye size={16} className="text-accent" /> Interactive Floating Widget Simulator
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Test your live floating chatbot, custom position, lead collection form, and keyword triggers.
                </p>
              </div>
              <button
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg disabled:opacity-50 transition flex items-center justify-center"
                onClick={() => {
                  setPreviewMessages([{ sender: 'bot', text: welcomeMessage, time: now() }]);
                  setSimulatedLeadDone(false);
                  setSimulatedName('');
                  setSimulatedEmail('');
                  setSimulatedPhone('');
                  setFloatingOpen(true);
                }}
              >
                Reset Simulator
              </button>
            </div>

            {/* Simulated Website Canvas Container */}
            <div style={{
              width: '100%',
              minHeight: 580,
              height: 580,
              borderRadius: 20,
              position: 'relative',
              overflow: 'visible',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              border: '1px solid var(--color-gray-200)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
              {/* Simulated Website Navigation Bar */}
              <div style={{ padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: primaryColor }} />
                  <span style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>MyAwesomeSite.com</span>
                </div>
                <div style={{ display: 'flex', gap: 20, color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                  <span>Home</span>
                  <span>Products</span>
                  <span>Pricing</span>
                  <span>Contact</span>
                </div>
              </div>

              {/* Simulated Website Hero Section */}
              <div style={{ padding: '40px 24px', textAlign: 'center', color: 'white' }}>
                <span style={{ fontSize: 11, padding: '4px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                  LIVE EMBED PREVIEW CANVAS
                </span>
                <h2 style={{ fontSize: 24, fontWeight: 800, marginTop: 14, marginBottom: 10 }}>
                  Welcome to Our Store
                </h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', maxWidth: 460, margin: '0 auto' }}>
                  Experience your floating WhatsApp widget exactly as your website visitors will see and interact with it.
                </p>
              </div>

              {/* FLOATING CHAT POPUP WINDOW */}
              {floatingOpen && (
                <div style={{
                  position: 'absolute',
                  top: position.includes('top') ? 60 : 'auto',
                  bottom: position.includes('bottom') ? 80 : 'auto',
                  left: position.includes('left') ? 24 : 'auto',
                  right: position.includes('right') ? 24 : 'auto',
                  width: 350,
                  maxHeight: 540,
                  borderRadius: 24,
                  overflow: 'hidden',
                  zIndex: 20,
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                  boxShadow: theme === 'glassmorphic'
                    ? '0 25px 60px -10px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.15)'
                    : '0 20px 40px rgba(0,0,0,0.4)',
                  border: theme === 'glassmorphic'
                    ? '1px solid rgba(255,255,255,0.6)'
                    : '1px solid var(--color-gray-200)',
                  background: theme === 'glassmorphic'
                    ? 'rgba(255, 255, 255, 0.95)'
                    : 'var(--color-white)',
                  backdropFilter: theme === 'glassmorphic' ? 'blur(30px) saturate(180%)' : 'none',
                  WebkitBackdropFilter: theme === 'glassmorphic' ? 'blur(30px) saturate(180%)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  animation: 'simPopupSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                  transformOrigin: position.includes('bottom') ? 'bottom center' : 'top center' }}>
                  {/* Glassmorphic Centered Header */}
                  {theme === 'glassmorphic' ? (
                    <div style={{
                      padding: '22px 20px 16px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      position: 'relative',
                      borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                      {/* Close Button - absolute top right */}
                      <button onClick={() => setFloatingOpen(false)} style={{
                        position: 'absolute', top: 14, right: 14,
                        width: 26, height: 26, borderRadius: '50%',
                        background: 'rgba(0,0,0,0.05)', border: 'none',
                        color: '#94a3b8', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, transition: 'all 0.2s' }}>
                        <X size={14} />
                      </button>

                      {/* Centered Avatar */}
                      <div style={{
                        width: 56, height: 56, borderRadius: '50%',
                        background: `linear-gradient(${gradientAngle}deg, ${primaryColor}25, ${secondaryColor}25)`,
                        border: `2px solid ${primaryColor}30`,
                        boxShadow: `0 8px 24px ${primaryColor}18`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: 8,
                        animation: 'simAvatarFloat 4s ease-in-out infinite' }}>
                        {renderBotIcon(24, primaryColor)}
                      </div>

                      {/* Bot Name */}
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b', letterSpacing: '-0.01em' }}>
                        {botName}
                      </div>

                      {/* Status */}
                      <div style={{
                        marginTop: 3, fontSize: 10, color: '#64748b', fontWeight: 500,
                        display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: primaryColor, display: 'inline-block',
                          boxShadow: `0 0 6px ${primaryColor}` }} />
                        {subHeaderText || 'We typically reply within minutes'}
                      </div>
                    </div>
                  ) : (
                    /* Classic Header - left-aligned */
                    <div style={{
                      background: headerGradientStyle,
                      padding: '14px 16px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      color: 'white', minHeight: 68 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {renderBotIcon(20, 'white')}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>{botName}</div>
                          <div style={{ fontSize: 11, opacity: 0.85, marginTop: 3 }}>{subHeaderText || 'Online'}</div>
                        </div>
                      </div>
                      <button onClick={() => setFloatingOpen(false)} style={{
                        width: 34, height: 34, borderRadius: 8,
                        background: 'transparent', border: 'none', color: 'white',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={18} />
                      </button>
                    </div>
                  )}

                  {/* Lead Collection Mode or Active Chat Mode */}
                  {collectLeads && !simulatedLeadDone ? (
                    <div style={{
                      padding: 20, display: 'flex', flexDirection: 'column', gap: 12,
                      background: theme === 'glassmorphic' ? 'transparent' : 'white',
                      flex: 1, overflowY: 'auto'
                    }}>
                      <div className="font-semibold text-sm" style={{ color: '#1e293b' }}>
                        Start Chatting with Us 👋
                      </div>
                      <p className="text-xs" style={{ color: '#64748b' }}>Please enter your details below to start the conversation.</p>

                      {leadFields.includes('name') && (
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', display: 'block', marginBottom: 4 }}>Your Name</label>
                          <input type="text" style={{
                            width: '100%', height: 40, borderRadius: 14,
                            border: theme === 'glassmorphic' ? '1px solid #e2e8f0' : '1px solid #ddd',
                            background: theme === 'glassmorphic' ? '#f8fafc' : 'white',
                            padding: '0 14px', fontSize: 13, color: '#1e293b', outline: 'none' }} placeholder="John Doe" value={simulatedName} onChange={e => setSimulatedName(e.target.value)} />
                        </div>
                      )}
                      {leadFields.includes('email') && (
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', display: 'block', marginBottom: 4 }}>Email Address</label>
                          <input type="email" style={{
                            width: '100%', height: 40, borderRadius: 14,
                            border: theme === 'glassmorphic' ? '1px solid rgba(255,255,255,0.5)' : '1px solid #ddd',
                            background: theme === 'glassmorphic' ? 'rgba(255,255,255,0.5)' : 'white',
                            padding: '0 14px', fontSize: 13, color: '#1e293b', outline: 'none' }} placeholder="john@example.com" value={simulatedEmail} onChange={e => setSimulatedEmail(e.target.value)} />
                        </div>
                      )}
                      {leadFields.includes('phone') && (
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', display: 'block', marginBottom: 4 }}>Phone Number</label>
                          <input type="tel" style={{
                            width: '100%', height: 40, borderRadius: 14,
                            border: theme === 'glassmorphic' ? '1px solid rgba(255,255,255,0.5)' : '1px solid #ddd',
                            background: theme === 'glassmorphic' ? 'rgba(255,255,255,0.5)' : 'white',
                            padding: '0 14px', fontSize: 13, color: '#1e293b', outline: 'none' }} placeholder="+1 555-0199" value={simulatedPhone} onChange={e => setSimulatedPhone(e.target.value)} />
                        </div>
                      )}

                      <button
                        style={{
                          marginTop: 6, width: '100%', height: 42, borderRadius: 14,
                          background: headerGradientStyle, color: 'white',
                          border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                          transition: 'all 0.2s' }}
                        onClick={() => setSimulatedLeadDone(true)}
                      >
                        Start Chat
                      </button>
                    </div>
                  ) : (
                    /* Active Chat Body */
                    <>
                      <div style={{
                        flex: 1, minHeight: 200, maxHeight: 260, overflowY: 'auto',
                        padding: theme === 'glassmorphic' ? 20 : 12,
                        display: 'flex', flexDirection: 'column', gap: 10,
                        background: theme === 'glassmorphic' ? 'transparent' : '#f7f7f8' }}>
                        {previewMessages.map((msg, idx) => (
                          <div key={idx} style={{
                            maxWidth: '84%',
                            alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                            <div style={{
                              padding: '11px 14px',
                              borderRadius: 16,
                              fontSize: 13, lineHeight: 1.5,
                              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                              ...(msg.sender === 'user'
                                ? (theme === 'glassmorphic'
                                  ? {
                                    background: `${primaryColor}20`,
                                    color: '#1e293b',
                                    border: `1px solid ${primaryColor}30`,
                                    borderBottomRightRadius: 4 }
                                  : {
                                    background: primaryColor,
                                    color: 'white',
                                    borderBottomRightRadius: 5 })
                                : (theme === 'glassmorphic'
                                  ? {
                                    background: '#f1f5f9',
                                    color: '#1e293b',
                                    border: '1px solid #e2e8f0',
                                    borderBottomLeftRadius: 4,
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }
                                  : {
                                    background: 'white',
                                    color: '#222',
                                    border: '1px solid #e7e7e7',
                                    borderBottomLeftRadius: 5 })
                              ) }}>
                              {msg.text}
                            </div>
                          </div>
                        ))}
                        {previewTyping && (
                          <div style={{
                            alignSelf: 'flex-start',
                            padding: '9px 12px', borderRadius: 14,
                            background: theme === 'glassmorphic' ? '#f1f5f9' : 'white',
                            border: theme === 'glassmorphic' ? '1px solid #e2e8f0' : '1px solid #e7e7e7',
                            display: 'flex', gap: 4, fontSize: 12, color: '#64748b' }}>
                            {[0, 0.15, 0.3].map((delay, i) => (
                              <div key={i} style={{ width: 5, height: 5, background: '#aaa', borderRadius: '50%', animation: 'pulse 1.2s ' + delay + 's infinite' }} />
                            ))}
                          </div>
                        )}
                        <div ref={previewEndRef} />
                      </div>

                      {/* Input Footer */}
                      <div style={{
                        padding: '12px 14px',
                        background: theme === 'glassmorphic' ? 'rgba(255,255,255,0.7)' : 'white',
                        borderTop: theme === 'glassmorphic' ? '1px solid rgba(0,0,0,0.06)' : '1px solid #e8e8e8',
                        display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input
                          type="text"
                          style={{
                            flex: 1, height: 40, borderRadius: 14, fontSize: 13, color: '#1e293b',
                            padding: '0 14px', outline: 'none', minWidth: 0,
                            background: theme === 'glassmorphic' ? '#f8fafc' : 'white',
                            border: theme === 'glassmorphic' ? '1px solid #e2e8f0' : '1px solid #ddd',
                            transition: 'all 0.2s' }}
                          placeholder="Ask a question..."
                          value={previewInput}
                          onChange={e => setPreviewInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && sendPreviewMessage()}
                        />
                        <button
                          onClick={sendPreviewMessage}
                          style={{
                            width: 40, height: 40, flexShrink: 0,
                            borderRadius: 12, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s',
                            ...(theme === 'glassmorphic'
                              ? {
                                background: '#f8fafc',
                                color: primaryColor,
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }
                              : {
                                background: primaryColor,
                                color: 'white',
                                border: 'none' }) }}
                        >
                          <Send size={16} />
                        </button>
                      </div>
                    </>
                  )}

                  {/* Powered By Footer */}
                  <div style={{
                    padding: '6px 0',
                    textAlign: 'center',
                    background: theme === 'glassmorphic' ? 'rgba(248,250,252,0.8)' : '#fafafa',
                    borderTop: theme === 'glassmorphic' ? '1px solid rgba(0,0,0,0.04)' : '1px solid #f0f0f0' }}>
                    <a
                      href="https://devicedoctor.in"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: 9, color: '#94a3b8', textDecoration: 'none',
                        fontWeight: 500, letterSpacing: '0.02em',
                        transition: 'color 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.color = primaryColor; }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; }}
                    >
                      Developed by <span style={{ fontWeight: 600 }}>Device Doctor India</span>
                    </a>
                  </div>
                </div>
              )}

              {/* FLOATING TRIGGER BUTTON (CORNER POSITIONED) */}
              <div
                onClick={() => setFloatingOpen(!floatingOpen)}
                style={{
                  position: 'absolute',
                  top: position.includes('top') ? 16 : 'auto',
                  bottom: position.includes('bottom') ? 16 : 'auto',
                  left: position.includes('left') ? 16 : 'auto',
                  right: position.includes('right') ? 16 : 'auto',
                  cursor: 'pointer',
                  zIndex: 30,
                  animation: 'simBtnBounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}
              >
                {theme === 'glassmorphic' ? (
                  <div
                    className="sim-float-btn"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 18px',
                      borderRadius: '9999px',
                      background: 'rgba(255, 255, 255, 0.92)',
                      backdropFilter: 'blur(20px)',
                      color: primaryColor,
                      fontSize: 13,
                      fontWeight: 700,
                      border: '1px solid rgba(255, 255, 255, 0.8)',
                      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0,0,0,0.1)',
                      transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08) translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 35px rgba(0,0,0,0.25), 0 6px 16px rgba(0,0,0,0.12)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.1)'; }}
                    onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.94)'; }}
                    onMouseUp={e => { e.currentTarget.style.transform = 'scale(1.08) translateY(-2px)'; }}
                  >
                    {renderBotIcon(15, primaryColor)}
                    {buttonLabel || 'Chat'}
                  </div>
                ) : (
                  <div
                    className="sim-float-btn"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 18px',
                      borderRadius: 'var(--radius-pill)',
                      background: headerGradientStyle,
                      color: 'white',
                      fontSize: 13,
                      fontWeight: 700,
                      boxShadow: `0 8px 25px rgba(0,0,0,0.3), 0 0 0 0 ${primaryColor}55`,
                      transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08) translateY(-2px)'; e.currentTarget.style.boxShadow = `0 12px 30px rgba(0,0,0,0.35), 0 0 0 6px ${primaryColor}22`; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = `0 8px 25px rgba(0,0,0,0.3), 0 0 0 0 ${primaryColor}55`; }}
                    onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.94)'; }}
                    onMouseUp={e => { e.currentTarget.style.transform = 'scale(1.08) translateY(-2px)'; }}
                  >
                    {renderBotIcon(16, 'white')}
                    {buttonLabel || 'Chat'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════ EMBED TAB ══ */}
        {activeTab === 'embed' && (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-6" style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #111827 100%)', border: '1px solid rgba(255,255,255,0.08)', padding: 32, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, background: 'radial-gradient(circle, ' + primaryColor + '25 0%, transparent 70%)', borderRadius: '50%' }} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Globe size={20} style={{ color: primaryColor }} />
                      <h3 style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>Website Widget Embed</h3>
                    </div>
                    <button
                      onClick={() => setShowIntegrationGuide(!showIntegrationGuide)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: 'rgba(255,255,255,0.1)', color: 'white', borderRadius: 20, border: '1px solid rgba(255,255,255,0.2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', zIndex: 51 }}
                    >
                      <Info size={14} />
                      Integration Guide
                      <ChevronDown size={14} style={{ transform: showIntegrationGuide ? 'rotate(180deg)' : 'none', transition: 'all 0.2s' }} />
                    </button>
                    
                    {showIntegrationGuide && (
                      <>
                        <div onClick={() => setShowIntegrationGuide(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                        <div style={{ position: 'absolute', top: 70, right: 32, width: 340, zIndex: 50, borderRadius: 16, padding: 20, boxShadow: '0 20px 40px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', animation: 'waflowSlideIn 0.2s ease-out' }} className="bg-white dark:bg-gray-800">
                          <h4 style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }} className="text-gray-900 dark:text-gray-100">📋 Quick Integration Guide</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {[
                              { n: 1, title: 'Copy the snippet below', desc: 'Click Copy and grab the embed code.' },
                              { n: 2, title: 'Paste before closing body tag', desc: 'Add it to every page where you want the widget to appear.' },
                              { n: 3, title: 'Save & deploy your site', desc: 'The widget is now active on your site.' },
                            ].map(item => (
                              <div key={item.n} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-brand-500), var(--color-brand-600))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                                  {item.n}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: 13 }} className="text-gray-900 dark:text-gray-100">{item.title}</div>
                                  <div style={{ color: '#6b7280', fontSize: 11, marginTop: 2 }}>{item.desc}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 20 }}>
                    Paste this snippet just before the closing body tag.
                  </p>
                  <div style={{ position: 'relative' }}>
                    <pre style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 18, color: '#a8ff78', fontSize: 12, lineHeight: 1.7, overflowX: 'auto', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {embedCode}
                    </pre>
                    <button
                      onClick={handleCopy}
                      style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, border: copied ? '1px solid rgba(37,211,102,0.4)' : '1px solid rgba(255,255,255,0.2)', background: copied ? 'rgba(37,211,102,0.2)' : 'rgba(255,255,255,0.1)', color: copied ? '#22c55e' : 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.2s' }}
                    >
                      {copied ? <CheckCheck size={13} /> : <Copy size={13} />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>


          </div>
        )}

        {/* ══════════════════════════════════════════ KNOWLEDGE TAB ══ */}
        {activeTab === 'knowledge' && (
          <div className="flex flex-col gap-5">

            {/* Header + Add button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100" style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BookOpen size={16} className="text-accent" /> Company Knowledge Base
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Add detailed information about your company, products, pricing, FAQs and policies. The chatbot uses this to reply to customer questions.
                </p>
              </div>
              <button className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition flex items-center gap-2 justify-center" onClick={openAddModal}>
                <Plus size={15} /> Add Knowledge
              </button>
            </div>

            {/* Search + Filters */}
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-6" style={{  padding: '14px 18px' }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
                  <input
                    className="w-full text-sm px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 outline-none focus:border-brand-500 transition-all"
                    style={{ paddingLeft: 32, fontSize: 13 }}
                    placeholder="Search knowledge..."
                    value={knowledgeSearch}
                    onChange={e => setKnowledgeSearch(e.target.value)}
                  />
                </div>
                <select
                  className="w-full text-sm px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 outline-none focus:border-brand-500 transition-all"
                  style={{ width: 160, fontSize: 13 }}
                  value={knowledgeCategoryFilter}
                  onChange={e => setKnowledgeCategoryFilter(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {KNOWLEDGE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                  className="w-full text-sm px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 outline-none focus:border-brand-500 transition-all"
                  style={{ width: 130, fontSize: 13 }}
                  value={knowledgeStatusFilter}
                  onChange={e => setKnowledgeStatusFilter(e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg disabled:opacity-50 transition flex items-center gap-2" onClick={loadKnowledge} title="Refresh">
                  <RefreshCw size={13} />
                </button>
              </div>
            </div>

            {/* Knowledge List */}
            {knowledgeLoading ? (
              <div style={{ padding: '48px 0', textAlign: 'center' }}>
                <RefreshCw size={28} style={{ margin: '0 auto 12px', color: 'var(--color-text-tertiary)', animation: 'spin 1s linear infinite' }} />
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading knowledge base...</p>
              </div>
            ) : knowledgeItems.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-6" style={{ padding: '60px 20px', textAlign: 'center' }}>
                <Brain size={48} style={{ margin: '0 auto 16px', color: 'var(--color-text-tertiary)' }} />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100" style={{ marginBottom: 10 }}>No Knowledge Items Yet</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400" style={{ maxWidth: 400, margin: '0 auto 20px' }}>
                  Add company information, products, pricing, FAQs, and policies so your chatbot can answer customer questions accurately.
                </p>
                <button className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition flex items-center gap-2 justify-center mx-auto" onClick={openAddModal}>
                  <Plus size={14} /> Add First Knowledge Item
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {knowledgeItems.map(item => (
                  <div key={item._id} className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-6" style={{
                    
                    border: item.status === 'active' ? '1px solid var(--color-gray-200)' : '1px solid var(--color-gray-200)',
                    opacity: item.status === 'inactive' ? 0.65 : 1,
                    transition: 'all 0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                          <span className="font-semibold text-gray-900 dark:text-gray-100" style={{ fontSize: 14 }}>{item.title}</span>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                            background: item.status === 'active' ? 'rgba(37,211,102,0.12)' : 'var(--color-gray-100)',
                            color: item.status === 'active' ? 'var(--color-brand-500)' : 'var(--color-gray-500)',
                            border: item.status === 'active' ? '1px solid rgba(37,211,102,0.3)' : '1px solid var(--color-gray-200)' }}>
                            {item.status === 'active' ? '● Active' : '○ Inactive'}
                          </span>
                          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'var(--color-brand-50)', color: 'var(--color-brand-500)', border: '1px solid rgba(99,102,241,0.2)' }}>
                            {item.category}
                          </span>
                          <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Star size={10} /> Priority {item.priority}
                          </span>
                        </div>
                        <p className="text-[12px] text-gray-500 dark:text-gray-400" style={{ lineHeight: 1.5, marginBottom: 8 }}>
                          {item.content.slice(0, 180)}{item.content.length > 180 ? '…' : ''}
                        </p>
                        {item.keywords.length > 0 && (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                            <Tag size={11} style={{ color: 'var(--color-text-tertiary)' }} />
                            {item.keywords.slice(0, 8).map(kw => (
                              <span key={kw} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'var(--color-gray-100)', color: 'var(--color-gray-500)', border: '1px solid var(--color-gray-200)' }}>
                                {kw}
                              </span>
                            ))}
                            {item.keywords.length > 8 && <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>+{item.keywords.length - 8} more</span>}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg disabled:opacity-50 transition flex items-center gap-2"
                          onClick={() => handleToggleKnowledgeStatus(item)}
                          title={item.status === 'active' ? 'Disable' : 'Enable'}
                        >
                          {item.status === 'active' ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                          {item.status === 'active' ? 'Disable' : 'Enable'}
                        </button>
                        <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg disabled:opacity-50 transition flex items-center gap-2" onClick={() => openEditModal(item)}>
                          <Edit2 size={13} /> Edit
                        </button>
                        <button
                          className="inline-flex items-center justify-center rounded border border-stroke py-2 px-6 text-center font-medium text-black hover:bg-gray transition dark:border-strokedark dark:text-white dark:hover:bg-meta-4 btn-sm flex items-center gap-1"
                          style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
                          onClick={() => handleDeleteKnowledge(item._id)}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Test Chat Panel ─────────────────────────────────────────────── */}
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-6" style={{  marginTop: 8 }}>
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100 dark:border-gray-800"><Brain size={15} className="text-accent" /><h3 className="text-lg font-bold text-gray-900 dark:text-white">Test Knowledge Matching
              </h3></div>
              <p className="text-[11px] text-gray-500 mb-4">
                Type a customer question to test how the knowledge engine responds. Shows intent, confidence score, and matched knowledge.
              </p>

              {/* Message history */}
              <div style={{ minHeight: 180, maxHeight: 340, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                {testMessages.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', padding: '40px 0', fontSize: 13 }}>
                    Ask a question to test your knowledge base...
                  </div>
                )}
                {testMessages.map((msg, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '80%', padding: '10px 14px', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: msg.role === 'user' ? 'var(--color-brand-500)' : 'var(--color-white)',
                      color: msg.role === 'user' ? 'white' : 'var(--color-gray-900)',
                      fontSize: 13, lineHeight: 1.5,
                      border: msg.role === 'bot' ? '1px solid var(--color-gray-200)' : 'none' }}>
                      {msg.text}
                    </div>
                    {msg.meta && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4, maxWidth: '80%' }}>
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}>
                          Intent: {msg.meta.intent}
                        </span>
                        <span style={{
                          fontSize: 10, padding: '2px 8px', borderRadius: 20,
                          background: msg.meta.confidence >= 0.70 ? 'rgba(37,211,102,0.1)' : msg.meta.confidence >= 0.40 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                          color: msg.meta.confidence >= 0.70 ? '#16a34a' : msg.meta.confidence >= 0.40 ? '#d97706' : '#ef4444',
                          border: `1px solid ${msg.meta.confidence >= 0.70 ? 'rgba(37,211,102,0.3)' : msg.meta.confidence >= 0.40 ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                          Confidence: {Math.round(msg.meta.confidence * 100)}%
                        </span>
                        {msg.meta.knowledgeTitle && (
                          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'var(--color-gray-100)', color: 'var(--color-gray-500)', border: '1px solid var(--color-gray-200)' }}>
                            📚 {msg.meta.knowledgeTitle}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {testLoading && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-tertiary)', fontSize: 12 }}>
                    <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> Matching knowledge...
                  </div>
                )}
                <div ref={testEndRef} />
              </div>

              {/* Input */}
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="w-full text-sm px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 outline-none focus:border-brand-500 transition-all"
                  style={{ flex: 1, fontSize: 13 }}
                  placeholder="e.g. How much commission do you charge restaurants?"
                  value={testQuery}
                  onChange={e => setTestQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') sendTestMessage(); }}
                />
                <button
                  className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition flex items-center gap-2 justify-center"
                  onClick={sendTestMessage}
                  disabled={testLoading || !testQuery.trim()}
                >
                  <Send size={14} /> Test
                </button>
                {testMessages.length > 0 && (
                  <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg disabled:opacity-50 transition flex items-center justify-center" onClick={() => setTestMessages([])}>
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══ KNOWLEDGE ADD/EDIT MODAL ══════════════════════════════════════════ */}
      {showKnowledgeModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px' }}>
          <div className="bg-white dark:bg-gray-900" style={{
            borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto',
            padding: 32 }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100" style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BookOpen size={18} className="text-accent" />
                  {editingItem ? 'Edit Knowledge Item' : 'Add Knowledge Item'}
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  Supports 5,000+ words per entry. Content is stored securely in the database.
                </p>
              </div>
              <button
                onClick={() => setShowKnowledgeModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Title + Category row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Title <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    className="w-full text-sm px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 outline-none focus:border-brand-500 transition-all"
                    placeholder="e.g. Restaurant Commission"
                    value={kForm.title}
                    onChange={e => setKForm(f => ({ ...f, title: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Category</label>
                  <select
                    className="w-full text-sm px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 outline-none focus:border-brand-500 transition-all"
                    value={kForm.category}
                    onChange={e => setKForm(f => ({ ...f, category: e.target.value }))}
                  >
                    {KNOWLEDGE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Content <span style={{ color: '#ef4444' }}>*</span></label>
                <p className="text-[11px] text-gray-500 dark:text-gray-400" style={{ marginBottom: 6 }}>
                  Write detailed information. Supports up to 5,000+ words. The chatbot will use the first 2-3 sentences in replies.
                </p>
                <textarea
                  className="w-full text-sm px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 outline-none focus:border-brand-500 transition-all"
                  style={{ minHeight: 180, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
                  placeholder="Write your detailed company knowledge here. Be specific — mention exact details, pricing, policies, processes, or any information customers might ask about."
                  value={kForm.content}
                  onChange={e => setKForm(f => ({ ...f, content: e.target.value }))}
                />
                <p className="text-[11px] text-gray-500 dark:text-gray-400" style={{ marginTop: 4 }}>
                  {kForm.content.length.toLocaleString()} characters · ~{Math.ceil(kForm.content.split(/\s+/).filter(Boolean).length)} words
                </p>
              </div>

              {/* Keywords + Synonyms row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Keywords</label>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400" style={{ marginBottom: 6 }}>Comma-separated. Primary terms this content answers.</p>
                  <input
                    className="w-full text-sm px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 outline-none focus:border-brand-500 transition-all"
                    placeholder="commission, fee, charges, rate"
                    value={kForm.keywords}
                    onChange={e => setKForm(f => ({ ...f, keywords: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Synonyms</label>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400" style={{ marginBottom: 6 }}>Comma-separated. Alternative words meaning the same thing.</p>
                  <input
                    className="w-full text-sm px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 outline-none focus:border-brand-500 transition-all"
                    placeholder="platform fee, cut, percentage, revenue share"
                    value={kForm.synonyms}
                    onChange={e => setKForm(f => ({ ...f, synonyms: e.target.value }))}
                  />
                </div>
              </div>

              {/* Priority + Status row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Priority: {kForm.priority}</label>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400" style={{ marginBottom: 6 }}>Higher priority items are matched first when multiple items qualify.</p>
                  <input
                    type="range" min={1} max={10} step={1}
                    value={kForm.priority}
                    onChange={e => setKForm(f => ({ ...f, priority: Number(e.target.value) }))}
                    style={{ width: '100%', accentColor: 'var(--color-brand-500)' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--color-text-tertiary)' }}>
                    <span>1 (Low)</span><span>10 (High)</span>
                  </div>
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Status</label>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400" style={{ marginBottom: 6 }}>Only Active items are used in chatbot replies.</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['active', 'inactive'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => setKForm(f => ({ ...f, status: s }))}
                        className={`flex-1 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                          kForm.status === s
                            ? s === 'active'
                              ? 'bg-green-500/15 text-green-500 border border-green-500/40'
                              : 'bg-red-500/10 text-red-500 border border-red-500/30'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                        }`}
                        style={{ padding: '9px 0' }}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid var(--color-gray-200)' }}>
                <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg disabled:opacity-50 transition flex items-center justify-center" onClick={() => setShowKnowledgeModal(false)}>
                  Cancel
                </button>
                <button
                  className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition flex items-center gap-2 justify-center"
                  onClick={handleSaveKnowledge}
                  disabled={kSaving || !kForm.title.trim() || !kForm.content.trim()}
                >
                  {kSaving ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : <><Save size={14} /> {editingItem ? 'Update' : 'Save Knowledge'}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

