import { useState, useEffect } from 'react';
import { Application } from '../../Applications';
import CopyButton from '../../../../components/common/CopyButton';

export default function OverviewTab({ app, onAppUpdate }: { app: Application, onAppUpdate: (app: Application) => void }) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState(app.defaultWhatsappSessionId || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const token = (sessionStorage.getItem('crm_token') || localStorage.getItem('crm_token'));
      const res = await fetch('/openwa-api/crm/sessions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
        
        // Auto-select the first connected session if none is currently selected
        if (!selectedSessionId && data.length > 0) {
          setSelectedSessionId(data[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load sessions', e);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      const token = (sessionStorage.getItem('crm_token') || localStorage.getItem('crm_token'));
      const res = await fetch(`/openwa-api/otp-management/applications/${app.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ defaultWhatsappSessionId: selectedSessionId || null })
      });
      if (res.ok) {
        const updated = await res.json();
        if (typeof onAppUpdate === 'function') {
          onAppUpdate({ ...app, ...updated });
        }
        setSaveMessage('Saved successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        setSaveMessage(`Failed to save: ${err.message || res.status}`);
      }
    } catch (e: any) {
      setSaveMessage(`Error saving: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Integration Overview</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Quick details about your application's environment and setup.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Application ID</p>
          <div className="flex items-center justify-between">
            <p className="font-mono text-sm text-gray-900 dark:text-white font-bold">{app.applicationId}</p>
            <CopyButton 
              textToCopy={app.applicationId}
              className="text-gray-400 hover:text-brand-500 transition flex items-center justify-center w-5 h-5"
              title="Copy Application ID"
              defaultText={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              }
              copiedText={
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              }
            />
          </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Environment</p>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${app.environment === 'production' ? 'bg-red-500' : 'bg-brand-500'}`}></span>
            <p className="font-bold text-sm text-gray-900 dark:text-white capitalize">{app.environment}</p>
          </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Base API URL</p>
          <p className="font-mono text-sm text-gray-900 dark:text-white">https://waflow.devicedoctorindia.com/api/otp</p>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Connection Status</p>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${app.defaultWhatsappSessionId ? 'bg-green-500' : 'bg-orange-500'}`}></span>
            <p className="font-bold text-sm text-gray-900 dark:text-white">
              {app.defaultWhatsappSessionId ? 'Sender Connected' : 'No Default Sender'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Sender Configuration */}
      <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-md font-bold text-gray-900 dark:text-white mb-2">WhatsApp Sender Configuration</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Select the connected WhatsApp session that this application will use to send OTPs.
        </p>
        
        <div className="flex flex-col md:flex-row items-end gap-4">
          <div className="w-full md:w-2/3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Default WhatsApp Session
            </label>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-brand-500"
            >
              <option value="">-- No Default Sender --</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.status})
                </option>
              ))}
            </select>
          </div>
          <div className="w-full md:w-1/3 flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
        {saveMessage && (
          <p className={`mt-3 text-sm ${saveMessage.includes('successfully') ? 'text-green-500' : 'text-red-500'}`}>
            {saveMessage}
          </p>
        )}
      </div>

      <div className="mt-8 p-5 bg-brand-50 dark:bg-brand-900/10 rounded-xl border border-brand-100 dark:border-brand-800/50">
        <h3 className="text-sm font-bold text-brand-900 dark:text-brand-300 mb-2">Getting Started</h3>
        <p className="text-sm text-brand-700 dark:text-brand-400/80 mb-4">
          To integrate Waflow into your application, you will need your Application ID and a Secret Key. 
          Use the API Reference and SDK Snippets tabs to view code examples for your preferred language.
        </p>
      </div>
    </div>
  );
}

