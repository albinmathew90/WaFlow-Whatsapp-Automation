import React, { useState, useEffect, useCallback, useRef } from 'react';
import Input from '../../../components/form/input/InputField';
import Label from '../../../components/form/Label';
import Select from '../../../components/form/Select';
import WhatsAppPreview from '../../../components/Templates/WhatsAppPreview';
import MediaSelectorModal from '../../../components/common/MediaSelectorModal';
import DateTimePickerModal from '../../../components/common/DateTimePickerModal';
import { getSessions, sendTextMessage, sendTemplateMessage } from '../../../services/openwa';

interface Props {
  onCreated: () => void;
  onCancel: () => void;
}

interface Segment { id: string; name: string; }
interface Contact { id: string; firstName: string; lastName?: string; phone?: string; segmentId?: string; }
interface Template { id: string; name: string; body: string; header?: string; footer?: string; type?: string; content?: any; mediaUrl?: string; buttons?: any[]; carouselCards?: any[]; }

const API = '/openwa-api/crm';
const getToken = () => sessionStorage.getItem('crm_token');
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });

function DropdownMultiSelect({
  label,
  placeholder,
  items,
  selectedIds,
  onChange,
  onSearch,
  searchValue,
  searchPlaceholder,
  color = 'brand',
}: {
  label: React.ReactNode;
  placeholder?: string;
  items: { id: string; name: string; description?: string }[];
  selectedIds: string[];
  onChange: (id: string) => void;
  onSearch?: (val: string) => void;
  searchValue?: string;
  searchPlaceholder?: string;
  color?: 'brand' | 'error';
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const colorClass = color === 'error' ? 'text-error-500 focus:ring-error-500' : 'text-brand-500 focus:ring-brand-500';
  const ringClass = color === 'error' ? 'focus-within:ring-error-500/20 focus-within:border-error-500' : 'focus-within:ring-brand-500/20 focus-within:border-brand-500';

  return (
    <div className="flex flex-col relative" ref={containerRef}>
      {label}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full min-h-[40px] mt-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white cursor-pointer flex items-center justify-between shadow-sm focus-within:ring-2 ${ringClass} transition`}
      >
        <span className={selectedIds.length === 0 ? "text-gray-400" : "font-medium"}>
          {selectedIds.length === 0 
            ? placeholder || "Select items..." 
            : `${selectedIds.length} item${selectedIds.length > 1 ? 's' : ''} selected`}
        </span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute z-10 top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden flex flex-col max-h-60">
          {onSearch && (
            <div className="p-2 border-b border-gray-100 dark:border-gray-700 shrink-0">
              <input
                type="text"
                autoFocus
                value={searchValue}
                onChange={e => onSearch(e.target.value)}
                placeholder={searchPlaceholder || "Search..."}
                className={`w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 ${color === 'error' ? 'focus:ring-error-500 focus:border-error-500' : 'focus:ring-brand-500 focus:border-brand-500'}`}
              />
            </div>
          )}
          <div className="overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
            {items.length === 0 ? (
              <p className="text-sm text-gray-400 p-3 text-center">No items found</p>
            ) : items.map(item => (
              <label key={item.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition">
                <input 
                  type="checkbox" 
                  checked={selectedIds.includes(item.id)} 
                  onChange={() => onChange(item.id)} 
                  className={`rounded border-gray-300 ${colorClass}`} 
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{item.name}</span>
                  {item.description && <span className="text-xs text-gray-400 truncate">{item.description}</span>}
                </div>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreateBroadcastForm({ onCreated, onCancel }: Props) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Step 1 – Basic Info
  const [name, setName] = useState('');

  // Step 2 – Audience
  const [segments, setSegments] = useState<Segment[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedSegmentIds, setSelectedSegmentIds] = useState<string[]>(['all']);
  const [excludeContactIds, setExcludeContactIds] = useState<string[]>([]);
  const [skipActiveWindow, setSkipActiveWindow] = useState(false);
  const [audienceCount, setAudienceCount] = useState<number | null>(null);
  const [contactSearch, setContactSearch] = useState('');

  // Step 3 – Message
  const [messageType, setMessageType] = useState<'template' | 'text' | 'image' | 'video' | 'file'>('template');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [simpleText, setSimpleText] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [testRecipientName, setTestRecipientName] = useState('');
  const [testRecipientNumber, setTestRecipientNumber] = useState('');
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);

  // Step 4 – Schedule & Delivery
  const [scheduleType, setScheduleType] = useState<'instant' | 'scheduled'>('instant');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [scheduledDisplay, setScheduledDisplay] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [sessions, setSessions] = useState<{ id: string; name: string }[]>([]);

  // Step 6 – Retry
  const [retryEnabled, setRetryEnabled] = useState(false);
  const [retryCount, setRetryCount] = useState(1);
  const [retryIntervalHours, setRetryIntervalHours] = useState(24);

  // ── Data Loading ──────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const token = getToken();
      if (!token) return;
      const h = { Authorization: `Bearer ${token}` };
      try {
        const [segsRes, contactsRes, templatesRes, allSessions] = await Promise.all([
          fetch(`${API}/segments`, { headers: h }),
          fetch(`${API}/contacts`, { headers: h }),
          fetch(`${API}/templates`, { headers: h }),
          getSessions().catch(() => []),
        ]);
        if (segsRes.ok) setSegments(await segsRes.json());
        if (contactsRes.ok) setContacts(await contactsRes.json());
        if (templatesRes.ok) setTemplates(await templatesRes.json());
        
        const loadedSessions = (allSessions || []).map((s: any) => ({ id: s.id, name: s.name || s.id }));
        setSessions(loadedSessions);
        if (loadedSessions.length > 0 && !sessionId) {
          const ready = (allSessions || []).find((s: any) => (s.status || '').toUpperCase() === 'READY' || (s.status || '').toUpperCase() === 'AUTHENTICATED');
          setSessionId(ready ? ready.id : loadedSessions[0].id);
        }
      } catch (e) { console.error('Failed to load form data', e); }
    };
    load();
  }, []);

  // ── Audience Count ────────────────────────────────────────────────────────
  const refreshAudienceCount = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}/broadcasts/audience-count`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ segmentIds: selectedSegmentIds.includes('all') ? [] : selectedSegmentIds, excludeContactIds, skipActiveWindow, sessionId }),
      });
      if (res.ok) {
        const { count } = await res.json();
        setAudienceCount(count);
      }
    } catch (e) { /* ignore */ }
  }, [selectedSegmentIds, excludeContactIds, skipActiveWindow, sessionId]);

  useEffect(() => { refreshAudienceCount(); }, [refreshAudienceCount]);

  // ── Test Message ──────────────────────────────────────────────────────────
  const sendTest = async () => {
    if (!testRecipientNumber || !sessionId) return;
    setTestLoading(true);
    setTestResult(null);
    try {
      const cleaned = testRecipientNumber.replace(/\D/g, '');
      const phone = cleaned.length <= 10 ? `91${cleaned}` : cleaned;
      const chatId = `${phone}@c.us`;

      if (messageType === 'template' && selectedTemplateId) {
        await sendTemplateMessage(sessionId, chatId, selectedTemplateId);
      } else {
        await sendTextMessage(sessionId, chatId, simpleText || 'Test message');
      }
      setTestResult({ ok: true, msg: 'Test message sent successfully!' });
    } catch (e: any) {
      setTestResult({ ok: false, msg: e.message || 'Failed to send test message' });
    } finally {
      setTestLoading(false);
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (asDraft = false) => {
    if (!name.trim()) { setError('Broadcast name is required.'); return; }
    if (!asDraft && messageType === 'template' && !selectedTemplateId) { setError('Please select a WhatsApp Template before launching.'); return; }
    if (!asDraft && !sessionId) { setError('Please select an active WhatsApp Session before launching.'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: name.trim(),
        segmentIds: selectedSegmentIds.includes('all') ? [] : selectedSegmentIds,
        excludeContactIds,
        skipActiveWindow,
        messageType,
        templateId: messageType === 'template' ? selectedTemplateId || undefined : undefined,
        simpleText: messageType === 'text' ? simpleText : undefined,
        mediaUrl: ['image', 'video', 'file'].includes(messageType) ? mediaUrl : undefined,
        scheduleType,
        scheduledAt: scheduleType === 'scheduled' && scheduledDate && scheduledTime
          ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
          : undefined,
        sessionId: sessionId || undefined,
        batches: [],
        retryEnabled,
        retryCount,
        retryIntervalHours,
      };

      const res = await fetch(`${API}/broadcasts`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Failed to create broadcast.');
        return;
      }

      if (!asDraft) {
        const broadcast = await res.json();
        // Launch immediately (starts instantly if instant, or enters backend queue if scheduled)
        await fetch(`${API}/broadcasts/${broadcast.id}/launch`, {
          method: 'POST',
          headers: authHeaders(),
        });
      }

      onCreated();
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const toggleItem = (list: string[], setList: (v: string[]) => void, id: string) => {
    setList(list.includes(id) ? list.filter(i => i !== id) : [...list, id]);
  };

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
  const filteredContacts = contacts.filter(c => {
    const matchesSearch = `${c.firstName} ${c.lastName ?? ''} ${c.phone ?? ''}`.toLowerCase().includes(contactSearch.toLowerCase());
    const matchesSegment = selectedSegmentIds.length === 0 || selectedSegmentIds.includes('all') || (c.segmentId && selectedSegmentIds.includes(c.segmentId));
    return matchesSearch && matchesSegment;
  });

  const steps = [
    { n: 1, label: 'Basic Info' },
    { n: 2, label: 'Audience' },
    { n: 3, label: 'Message' },
    { n: 4, label: 'Schedule' },
    { n: 5, label: 'Delivery' },
    { n: 6, label: 'Review' },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Step Indicator */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
        <div className="flex items-center gap-1 overflow-x-auto">
          {steps.map((s, i) => (
            <React.Fragment key={s.n}>
              <button
                onClick={() => setStep(s.n)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                  step === s.n
                    ? 'bg-brand-500 text-white'
                    : step > s.n
                    ? 'text-brand-500 bg-brand-50 dark:bg-brand-500/10'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  step === s.n ? 'bg-white/20' : step > s.n ? 'bg-brand-500 text-white' : 'bg-gray-200 dark:bg-gray-700'
                }`}>
                  {step > s.n ? '✓' : s.n}
                </span>
                {s.label}
              </button>
              {i < steps.length - 1 && <div className="w-6 h-px bg-gray-200 dark:bg-gray-700 shrink-0" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Form Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* ── Step 1: Basic Info ─────────────────────────────────────────────── */}
          {step === 1 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h3>
              <div>
                <Label>Broadcast Name *</Label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Summer Promo 2024"
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* ── Step 2: Audience ───────────────────────────────────────────────── */}
          {step === 2 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Audience Targeting</h3>
                {audienceCount !== null && (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 px-3 py-1 rounded-full">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {audienceCount.toLocaleString()} contacts selected
                  </span>
                )}
              </div>

              {/* Include Segments */}
              <DropdownMultiSelect
                label={
                  <div className="mb-1">
                    <Label>Select Contact Segments</Label>
                    <p className="text-xs text-gray-400">Leave empty to include all contacts</p>
                  </div>
                }
                placeholder="No segments selected"
                items={[{ id: 'all', name: 'All Contacts' }, ...segments.map(s => ({ id: s.id, name: s.name }))]}
                selectedIds={selectedSegmentIds}
                onChange={id => {
                  if (id === 'all') {
                    setSelectedSegmentIds(['all']);
                  } else {
                    const newIds = selectedSegmentIds.includes(id) 
                      ? selectedSegmentIds.filter(i => i !== id) 
                      : [...selectedSegmentIds.filter(i => i !== 'all'), id];
                    setSelectedSegmentIds(newIds.length === 0 ? ['all'] : newIds);
                  }
                }}
              />



              {/* Exclude Contacts */}
              <DropdownMultiSelect
                label={<Label>Exclude Individual Contacts</Label>}
                placeholder="Select contacts to exclude..."
                items={filteredContacts.slice(0, 50).map(c => ({ id: c.id, name: `${c.firstName} ${c.lastName ?? ''}`.trim(), description: c.phone }))}
                selectedIds={excludeContactIds}
                onChange={id => toggleItem(excludeContactIds, setExcludeContactIds, id)}
                onSearch={setContactSearch}
                searchValue={contactSearch}
                searchPlaceholder="Search contacts..."
                color="error"
              />

              {/* Skip window toggle */}
              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                <div className="mt-0.5">
                  <input type="checkbox" className="sr-only" checked={skipActiveWindow} onChange={e => setSkipActiveWindow(e.target.checked)} />
                  <div className={`relative w-10 h-5 rounded-full transition ${skipActiveWindow ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${skipActiveWindow ? 'translate-x-5' : ''}`} />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Skip active conversation window</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Skip contacts that already have an active 12-hour WhatsApp conversation window</p>
                </div>
              </label>
            </div>
          )}

          {/* ── Step 3: Message ────────────────────────────────────────────────── */}
          {step === 3 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 flex flex-col gap-5">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Message Setup</h3>

              {/* Message Type Radio */}
              <div>
                <Label>Select Message Type</Label>
                <div className="flex gap-6 items-center mt-3 mb-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input type="radio" name="broadMessageType" className="w-4 h-4 text-brand-500 border-gray-300 focus:ring-brand-500" checked={messageType === 'template'} onChange={() => setMessageType('template')} />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Template Message</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input type="radio" name="broadMessageType" className="w-4 h-4 text-brand-500 border-gray-300 focus:ring-brand-500" checked={messageType !== 'template'} onChange={() => setMessageType('text')} />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Simple Message</span>
                  </label>
                </div>
              </div>

              {messageType === 'template' && (
                <div className="mb-2">
                  {!selectedTemplateId ? (
                    <button 
                      onClick={() => setShowTemplateModal(true)}
                      className="flex flex-col items-center justify-center gap-2 w-64 h-24 border border-brand-200 dark:border-brand-900/50 text-brand-600 dark:text-brand-400 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-900/20 transition"
                    >
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M4 6h16v2H4V6zm0 5h8v2H4v-2zm10 0h6v2h-6v-2zm-10 5h8v2H4v-2zm10 0h6v2h-6v-2z" />
                        </svg>
                        <span className="font-semibold text-[15px]">Select WhatsApp</span>
                      </div>
                      <span className="font-semibold text-[15px]">Template</span>
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2 max-w-sm">
                      <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                        <div>
                          <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1 font-semibold">Selected Template</p>
                          <p className="font-medium text-gray-900 dark:text-white">{templates.find(t => t.id === selectedTemplateId)?.name}</p>
                        </div>
                        <button 
                          onClick={() => { setPreviewTemplateId(selectedTemplateId); setShowTemplateModal(true); }}
                          className="px-4 py-2 text-sm font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 dark:bg-brand-900/30 dark:text-brand-400 dark:hover:bg-brand-900/50 transition"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {messageType !== 'template' && (
                <div className="flex flex-col gap-5">
                  <div>
                    <Label>Select Simple Message Type</Label>
                    <div className="mt-1">
                      <Select
                        options={(['text', 'image', 'video', 'file'] as const).map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))}
                        placeholder="Select message type..."
                        onChange={(val: any) => setMessageType(val)}
                        defaultValue={messageType}
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">Choose the message type for your broadcast. Options include Text, Image, File, Video, or Audio.</p>
                  </div>

                  {messageType === 'text' && (
                    <div>
                      <Label>Message</Label>
                      <textarea
                        value={simpleText}
                        onChange={e => setSimpleText(e.target.value)}
                        placeholder="Type your message here..."
                        className="mt-1 w-full h-32 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">Enter the message content you want to send in the broadcast.</p>
                    </div>
                  )}

                  {['image', 'video', 'file'].includes(messageType) && (
                    <div className="flex flex-col gap-3">
                      <div>
                        <Label>Media URL</Label>
                        <Input value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} placeholder="https://..." className="mt-1" />
                      </div>
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() => setMediaModalOpen(true)}
                          className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl cursor-pointer hover:border-brand-500 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold text-sm text-brand-600 dark:text-brand-400 transition"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                          <span>Select from Media Library / Upload</span>
                        </button>
                      </div>
                      <div>
                        <Label>Caption (Optional)</Label>
                        <Input value={simpleText} onChange={e => setSimpleText(e.target.value)} placeholder="Add a caption..." className="mt-1" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Send Test Message Section */}
              <div className="mt-6 pt-6 border-t border-dashed border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="flex-1 w-full">
                    <Label>Contact's Name</Label>
                    <Input value={testRecipientName} onChange={e => setTestRecipientName(e.target.value)} placeholder="Contact's Name" className="mt-1" />
                    <p className="text-[11px] text-gray-400 mt-1.5">Enter the contact's name here.</p>
                  </div>
                  <div className="flex-1 w-full">
                    <Label>Phone Number</Label>
                    <div className="flex items-center h-[42px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500 transition mt-1">
                      <div className="px-3 h-full bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex items-center gap-2 shrink-0">
                        <img src="https://flagcdn.com/in.svg" alt="IN" className="w-5 h-auto rounded-[2px]" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">+91</span>
                      </div>
                      <input 
                        type="text" 
                        value={testRecipientNumber} 
                        onChange={e => setTestRecipientNumber(e.target.value)} 
                        placeholder="Enter mobile number" 
                        className="w-full h-full bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none" 
                      />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1.5">Enter the contact's mobile number.</p>
                  </div>
                  <div className="shrink-0 pt-6">
                    <button
                      onClick={sendTest}
                      disabled={testLoading || !testRecipientNumber || !sessionId}
                      className="w-full sm:w-auto h-[42px] px-6 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition shadow-sm"
                    >
                      {testLoading ? 'Sending...' : 'Send Test Message'}
                    </button>
                  </div>
                </div>
                
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  {sessions.length >= 1 ? (
                    <div className="w-full sm:w-1/2">
                      <Select
                        options={sessions.map(s => ({ value: s.id, label: s.name }))}
                        placeholder="Select WhatsApp session for test..."
                        onChange={setSessionId}
                        defaultValue={sessionId}
                      />
                    </div>
                  ) : <div className="w-full sm:w-1/2"></div>}
                  {testResult && (
                    <p className={`text-sm font-medium ${testResult.ok ? 'text-success-600' : 'text-error-500'}`}>
                      {testResult.ok ? '✓' : '✗'} {testResult.msg}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 4: Schedule ───────────────────────────────────────────────── */}
          {step === 4 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 flex flex-col gap-6">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Schedule Broadcast</h3>

              <div>
                <div className="flex items-center gap-6 mt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="scheduleType"
                      checked={scheduleType === 'scheduled'}
                      onChange={() => setScheduleType('scheduled')}
                      className="w-4 h-4 text-brand-600 border-gray-300 focus:ring-brand-500 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Yes (Schedule for Later)</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="scheduleType"
                      checked={scheduleType === 'instant'}
                      onChange={() => setScheduleType('instant')}
                      className="w-4 h-4 text-brand-600 border-gray-300 focus:ring-brand-500 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">No (Send Instantly)</span>
                  </label>
                </div>
              </div>

              {scheduleType === 'scheduled' && (
                <div className="mt-2 relative">
                  <div 
                    onClick={() => setShowDatePicker(true)}
                    className="relative w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3.5 cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 transition shadow-xs flex items-center justify-between"
                  >
                    <span className="absolute -top-2.5 left-3.5 bg-white dark:bg-gray-800 px-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Select Date and Time
                    </span>
                    <span className={`text-base font-medium ${scheduledDisplay ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                      {scheduledDisplay || 'Click to select date and time...'}
                    </span>
                    <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-1 font-normal">
                    Select the date and time for scheduling the broadcast.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Step 5: Delivery (Retry) ─────────────────────────────── */}
          {step === 5 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 flex flex-col gap-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Retry Settings</h3>

              {/* Retry */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer mb-4">
                  <div className="mt-0.5">
                    <input type="checkbox" className="sr-only" checked={retryEnabled} onChange={e => setRetryEnabled(e.target.checked)} />
                    <div className={`relative w-10 h-5 rounded-full transition ${retryEnabled ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${retryEnabled ? 'translate-x-5' : ''}`} />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Enable Automatic Retry</p>
                    <p className="text-xs text-gray-400">Retry failed messages (excludes invalid WhatsApp numbers)</p>
                  </div>
                </label>

                {retryEnabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Retry Count</Label>
                      <Select
                        options={[1, 2, 3].map(n => ({ value: String(n), label: `${n} time${n > 1 ? 's' : ''}` }))}
                        defaultValue={String(retryCount)}
                        onChange={val => setRetryCount(parseInt(val))}
                        placeholder="Select"
                      />
                    </div>
                    <div>
                      <Label>Retry Interval</Label>
                      <Select
                        options={[{ value: '12', label: '12 hours' }, { value: '24', label: '24 hours' }]}
                        defaultValue={String(retryIntervalHours)}
                        onChange={val => setRetryIntervalHours(parseInt(val))}
                        placeholder="Select"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Step 6: Review ─────────────────────────────────────────────────── */}
          {step === 6 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 flex flex-col gap-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Review & Launch</h3>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Name', value: name || '—' },
                  { label: 'Message Type', value: messageType },
                  { label: 'Audience Segments', value: selectedSegmentIds.length === 0 ? 'All contacts' : `${selectedSegmentIds.length} segment(s)` },
                  { label: 'Estimated Recipients', value: audienceCount !== null ? audienceCount.toLocaleString() : 'Calculating...' },
                  { label: 'Schedule', value: scheduleType === 'instant' ? 'Send Instantly' : (scheduledDate && scheduledTime ? `${scheduledDate} ${scheduledTime}` : 'Not set') },
                  { label: 'Session', value: sessions.find(s => s.id === sessionId)?.name || '—' },
                  { label: 'Retry', value: retryEnabled ? `${retryCount}x every ${retryIntervalHours}hr` : 'Disabled' },
                ].map(item => (
                  <div key={item.label} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{item.label}</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5 capitalize">{item.value}</p>
                  </div>
                ))}
              </div>

              {error && (
                <div className="p-3 bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-500/30 rounded-xl text-sm text-error-600 dark:text-error-400">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={step === 1 ? onCancel : () => setStep(step - 1)}
              className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              {step === 1 ? 'Cancel' : '← Previous'}
            </button>
            <div className="flex gap-2">
              {step === 6 ? (
                <>
                  <button
                    onClick={() => handleSubmit(true)}
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-50"
                  >
                    Save as Draft
                  </button>
                  <button
                    onClick={() => handleSubmit(false)}
                    disabled={saving || !name.trim()}
                    className="px-5 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition disabled:opacity-50 shadow-sm shadow-brand-500/20"
                  >
                    {saving ? 'Launching...' : scheduleType === 'instant' ? '🚀 Launch Broadcast' : '📅 Schedule Broadcast'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setStep(step + 1)}
                  className="px-5 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition shadow-sm shadow-brand-500/20"
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Live Preview Panel */}
        <div className="hidden lg:block">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 sticky top-24">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Live Preview</h4>
            <WhatsAppPreview
              type={messageType === 'template' ? (selectedTemplate?.type || 'text') : messageType === 'text' ? 'text' : messageType === 'image' ? 'image' : messageType === 'video' ? 'video' : 'document'}
              headerText={messageType === 'template' ? (selectedTemplate?.header || selectedTemplate?.content?.header || '') : ''}
              bodyText={messageType === 'template' ? (selectedTemplate?.body || selectedTemplate?.content?.body || '') : simpleText}
              footerText={messageType === 'template' ? (selectedTemplate?.footer || selectedTemplate?.content?.footer || '') : ''}
              mediaUrl={messageType === 'template' ? (selectedTemplate?.mediaUrl || selectedTemplate?.content?.mediaUrl || '') : mediaUrl}
              buttons={messageType === 'template' ? (selectedTemplate?.buttons || selectedTemplate?.content?.buttons || []) : []}
              locationData={messageType === 'template' && selectedTemplate?.content ? {
                locationName: selectedTemplate.content.locationName,
                locationAddress: selectedTemplate.content.locationAddress,
                locationLat: selectedTemplate.content.locationLat,
                locationLong: selectedTemplate.content.locationLong,
              } : undefined}
              carouselCards={messageType === 'template' ? (selectedTemplate?.carouselCards || selectedTemplate?.content?.carouselCards || []) : []}
              catalogData={messageType === 'template' && selectedTemplate?.content ? {
                catalogId: selectedTemplate.content.catalogId,
                catalogThumbnail: selectedTemplate.content.catalogThumbnail,
              } : undefined}
            />
          </div>
        </div>
      </div>

      {/* ── Template Selection Modal ─────────────────────────────────────────── */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl flex flex-col h-[80vh] overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Select WhatsApp Template</h2>
              <button onClick={() => setShowTemplateModal(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="flex-1 flex overflow-hidden min-h-0">
              {/* Left: Table */}
              <div className="w-3/5 border-r border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden">
                <div className="overflow-y-auto flex-1 p-0">
                  <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                    <thead className="sticky top-0 text-[11px] font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-900 shadow-sm z-10">
                      <tr>
                        <th className="px-5 py-4">Template Name</th>
                        <th className="px-5 py-4">Type</th>
                        <th className="px-5 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                      {templates.map(t => (
                        <tr key={t.id} 
                          className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition ${previewTemplateId === t.id ? 'bg-brand-50/50 dark:bg-brand-900/10' : ''}`}
                          onClick={() => setPreviewTemplateId(t.id)}
                        >
                          <td className="px-5 py-4 font-medium text-gray-900 dark:text-white">{t.name}</td>
                          <td className="px-5 py-4 capitalize">{t.type || 'Standard'}</td>
                          <td className="px-5 py-4 text-right">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setSelectedTemplateId(t.id); setShowTemplateModal(false); }}
                              className="px-3 py-1.5 text-xs font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 dark:bg-brand-900/30 dark:text-brand-400 dark:hover:bg-brand-900/50 transition"
                            >
                              Select
                            </button>
                          </td>
                        </tr>
                      ))}
                      {templates.length === 0 && (
                        <tr><td colSpan={3} className="px-5 py-12 text-center text-gray-500">No templates found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Right: Preview */}
              <div className="w-2/5 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col overflow-y-auto relative p-6">
                {previewTemplateId ? (
                  (() => {
                    const pt = templates.find(t => t.id === previewTemplateId);
                    if (!pt) return null;
                    return (
                      <div className="w-full flex flex-col items-center">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4 w-full text-center">Previewing: {pt.name}</p>
                        <WhatsAppPreview 
                          type={pt.type || 'text'}
                          bodyText={pt.body || pt.content?.body}
                          headerText={pt.header || pt.content?.header}
                          footerText={pt.footer || pt.content?.footer}
                          mediaUrl={pt.mediaUrl || pt.content?.mediaUrl}
                          buttons={pt.buttons || pt.content?.buttons}
                          locationData={pt.content ? {
                            locationName: pt.content.locationName,
                            locationAddress: pt.content.locationAddress,
                            locationLat: pt.content.locationLat,
                            locationLong: pt.content.locationLong,
                          } : undefined}
                          carouselCards={pt.carouselCards || pt.content?.carouselCards}
                          catalogData={pt.content ? {
                            catalogId: pt.content.catalogId,
                            catalogThumbnail: pt.content.catalogThumbnail,
                          } : undefined}
                        />
                        <div className="mt-8 flex justify-center w-full">
                          <button 
                            onClick={() => { setSelectedTemplateId(pt.id); setShowTemplateModal(false); }}
                            className="px-6 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-brand-600 w-full max-w-[250px] transition"
                          >
                            Confirm & Use Template
                          </button>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-center text-gray-400 flex flex-col items-center justify-center h-full gap-3 opacity-60">
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    <p className="text-sm font-medium">Select a template to view preview</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <MediaSelectorModal
        isOpen={mediaModalOpen}
        onClose={() => setMediaModalOpen(false)}
        onSelect={(m) => setMediaUrl(m.url)}
        defaultFilter={messageType === 'image' ? 'image' : messageType === 'video' ? 'video' : messageType === 'file' ? 'document' : 'all'}
      />

      <DateTimePickerModal
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        initialDate={scheduledDate}
        initialTime={scheduledTime}
        onConfirm={(dateStr, timeStr, displayStr) => {
          setScheduledDate(dateStr);
          setScheduledTime(timeStr);
          setScheduledDisplay(displayStr);
          setShowDatePicker(false);
        }}
      />
    </div>
  );
}

