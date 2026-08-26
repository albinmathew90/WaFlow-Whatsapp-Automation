import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import PageMeta from '../../components/common/PageMeta';

interface TemplateVersion {
  id: string;
  version: number;
  header: string;
  body: string;
  footer: string;
  createdAt: string;
}

export default function TemplateEditor() {
  const { templateId } = useParams();
  const isEdit = Boolean(templateId);
  const [searchParams] = useSearchParams();
  const appIdFromUrl = searchParams.get('appId');
  const navigate = useNavigate();

  const [appId, setAppId] = useState(appIdFromUrl || '');
  const [applications, setApplications] = useState<any[]>([]);

  const [name, setName] = useState('');
  const [language, setLanguage] = useState('en');
  const [status, setStatus] = useState('draft');
  const [description, setDescription] = useState('');
  const [header, setHeader] = useState('');
  const [body, setBody] = useState('');
  const [footer, setFooter] = useState('');

  const [versions, setVersions] = useState<TemplateVersion[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApplications();
    if (isEdit && appId) {
      fetchTemplate();
      fetchVersions();
    }
  }, [templateId, isEdit]);

  const fetchApplications = async () => {
    try {
      const token = (sessionStorage.getItem('crm_token') || localStorage.getItem('crm_token'));
      const res = await fetch('/openwa-api/otp-management/applications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      }
    } catch (e) { console.error(e); }
  };

  const fetchTemplate = async () => {
    try {
      const token = (sessionStorage.getItem('crm_token') || localStorage.getItem('crm_token'));
      const res = await fetch(`/openwa-api/otp-management/applications/${appId}/templates/${templateId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setName(data.name);
        setLanguage(data.language);
        setStatus(data.status);
        setDescription(data.description || '');
        setHeader(data.header || '');
        setBody(data.body || '');
        setFooter(data.footer || '');
      }
    } catch (e) { console.error(e); }
  };

  const fetchVersions = async () => {
    try {
      const token = (sessionStorage.getItem('crm_token') || localStorage.getItem('crm_token'));
      const res = await fetch(`/openwa-api/otp-management/applications/${appId}/templates/${templateId}/versions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setVersions(data);
      }
    } catch (e) { console.error(e); }
  };

  const handleRestore = async (versionId: string) => {
    if (!confirm('Are you sure you want to restore this version? This will become the active template version.')) return;
    try {
      const token = (sessionStorage.getItem('crm_token') || localStorage.getItem('crm_token'));
      const res = await fetch(`/openwa-api/otp-management/applications/${appId}/templates/${templateId}/restore`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ versionId })
      });
      if (res.ok) {
        fetchTemplate();
        fetchVersions();
      }
    } catch (e) { console.error(e); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    if (!appId) {
      setError('Please select an application.');
      setIsSubmitting(false);
      return;
    }

    if (!body.includes('{{OTP}}')) {
      setError('Template body must contain {{OTP}} variable.');
      setIsSubmitting(false);
      return;
    }

    try {
      const token = (sessionStorage.getItem('crm_token') || localStorage.getItem('crm_token'));
      const method = isEdit ? 'PUT' : 'POST';
      const url = isEdit 
        ? `/openwa-api/otp-management/applications/${appId}/templates/${templateId}`
        : `/openwa-api/otp-management/applications/${appId}/templates`;

      const payload = {
        name,
        language,
        status,
        description,
        header,
        body,
        footer
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        navigate('/otp-builder/templates');
      } else {
        const err = await res.json();
        setError(err.message || 'Failed to save template');
      }
    } catch (e) {
      setError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const insertVariable = (variable: string) => {
    setBody(prev => prev + variable);
  };

  const selectedAppData = applications.find(a => a.id === appId);
  const previewCompany = selectedAppData?.company || 'Your Company';
  const previewAppName = selectedAppData?.name || 'Your App';
  const previewExpiry = selectedAppData?.expiryMinutes ? `${selectedAppData.expiryMinutes} Minutes` : '10 Minutes';

  return (
    <>
      <PageMeta title={`${isEdit ? 'Edit' : 'Create'} OTP Template | Waflow`} description="Template Editor" />

      <div className="mb-8 flex items-center justify-between">
        <div>
          <button onClick={() => navigate('/otp-builder/templates')} className="text-brand-500 hover:text-brand-600 mb-2 flex items-center gap-1 text-sm font-medium transition">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Templates
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{isEdit ? 'Edit Template' : 'Create Template'}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Design your WhatsApp message layout.</p>
        </div>
        <button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-600 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Template'}
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-100 dark:border-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* General Details */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Template Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Application *</label>
                <div className="relative">
                  <select
                    value={appId}
                    onChange={e => setAppId(e.target.value)}
                    disabled={isEdit}
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-10 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="" disabled>Select Application</option>
                    {applications.map(app => (
                      <option key={app.id} value={app.id}>{app.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Template Name *</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g., Login OTP"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                <div className="relative">
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-10 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Description (Optional)</label>
                <input 
                  type="text" 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Internal notes..."
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Editor */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Message Content</h2>
              <div className="flex gap-2">
                <button type="button" onClick={() => insertVariable('{{OTP}}')} className="rounded-lg bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20">+ {'{{OTP}}'}</button>
                <button type="button" onClick={() => insertVariable('{{COMPANY}}')} className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700">+ {'{{COMPANY}}'}</button>
                <button type="button" onClick={() => insertVariable('{{APP_NAME}}')} className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700">+ {'{{APP_NAME}}'}</button>
                <button type="button" onClick={() => insertVariable('{{EXPIRY}}')} className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700">+ {'{{EXPIRY}}'}</button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Header (Optional)</label>
                <input 
                  type="text" 
                  value={header}
                  onChange={e => setHeader(e.target.value)}
                  placeholder="e.g., Waflow Security"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Body *</label>
                <textarea 
                  required
                  rows={5}
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="Your verification code is {{OTP}}. It will expire in {{EXPIRY}}."
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                <p className="mt-1.5 text-xs text-gray-500 text-right">{body.length} characters</p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Footer (Optional)</label>
                <input 
                  type="text" 
                  value={footer}
                  onChange={e => setFooter(e.target.value)}
                  placeholder="e.g., Do not share this code with anyone."
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm italic focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                />
              </div>
            </div>
          </div>


        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 rounded-3xl bg-[#efeae2] p-4 shadow-[inset_0_0_20px_rgba(0,0,0,0.05)] dark:bg-[#0b141a]">
            <div className="mb-4 text-center">
              <span className="inline-block rounded-full bg-[#e1f3fb] px-3 py-1 text-xs font-bold text-gray-600 shadow-sm dark:bg-[#182229] dark:text-gray-400">
                TODAY
              </span>
            </div>

            <div className="relative ml-auto max-w-[85%] rounded-2xl rounded-tr-none bg-[#d9fdd3] p-2 shadow-sm dark:bg-[#005c4b]">
              <div className="absolute -right-2 top-0 text-[#d9fdd3] dark:text-[#005c4b]">
                <svg viewBox="0 0 8 13" width="8" height="13" fill="currentColor">
                  <path opacity=".13" d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z"></path>
                  <path d="M5.188 0H0v11.193l6.467-8.625C7.526 1.156 6.958 0 5.188 0z"></path>
                </svg>
              </div>
              <div className="flex flex-col gap-1 text-[14.2px] leading-[19px] text-[#111b21] dark:text-[#e9edef]">
                {header && <div className="font-bold mb-1">{header}</div>}
                {body ? (
                   <div className="whitespace-pre-wrap">
                     {body.replace(/{{OTP}}/g, '123456')
                         .replace(/{{COMPANY}}/g, previewCompany)
                         .replace(/{{APP_NAME}}/g, previewAppName)
                         .replace(/{{EXPIRY}}/g, previewExpiry)}
                   </div>
                ) : (
                  <div className="text-gray-400 italic text-sm">Body text will appear here...</div>
                )}
                {footer && <div className="text-[12.5px] text-[#667781] dark:text-[#8696a0] mt-1">{footer}</div>}
                <div className="flex justify-end gap-1 mt-1">
                  <span className="text-[11px] text-[#667781] dark:text-[#8696a0]">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <svg className="text-[#53bdeb]" viewBox="0 0 16 15" width="16" height="15">
                    <path fill="currentColor" d="M15.01 3.316l-.478-.372a.365.365 0 00-.51.063L8.666 9.879a.32.32 0 01-.484.033l-.358-.325a.319.319 0 00-.484.032l-.378.483a.418.418 0 00.036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 00-.064-.512zm-4.1 0l-.478-.372a.365.365 0 00-.51.063L4.566 9.879a.32.32 0 01-.484.033L1.891 7.769a.366.366 0 00-.514.06l-.423.533a.419.419 0 00.036.541l2.294 2.204c.143.14.361.125.484-.033l2.493-3.193.358.325a.32.32 0 00.484-.033l5.337-6.843a.365.365 0 00-.063-.51z"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
