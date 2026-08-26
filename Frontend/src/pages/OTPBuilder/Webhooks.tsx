import { useState, useEffect } from 'react';
import PageMeta from '../../components/common/PageMeta';

interface Application {
  id: string;
  name: string;
  environment: 'production' | 'development';
}

interface Webhook {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
}

const SUPPORTED_EVENTS = [
  'otp.sent',
  'otp.delivered',
  'otp.read',
  'otp.failed',
  'otp.expired',
  'otp.verified'
];

export default function Webhooks() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [selectedEnvironment, setSelectedEnvironment] = useState<'production' | 'development'>('production');
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(true);
  const [isLoadingWebhooks, setIsLoadingWebhooks] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New webhook form state
  const [newUrl, setNewUrl] = useState('');
  const [newEvents, setNewEvents] = useState<string[]>([]);
  const [formError, setFormError] = useState('');
  
  // Test notification state
  const [testNotification, setTestNotification] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'loading';
    message: string;
  } | null>(null);

  const filteredApplications = applications.filter(app => app.environment === selectedEnvironment);

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    if (filteredApplications.length > 0 && !filteredApplications.find(a => a.id === selectedAppId)) {
      setSelectedAppId(filteredApplications[0].id);
    } else if (filteredApplications.length === 0) {
      setSelectedAppId('');
      setWebhooks([]);
    }
  }, [selectedEnvironment, applications]);

  useEffect(() => {
    if (selectedAppId) {
      fetchWebhooks(selectedAppId);
    }
  }, [selectedAppId]);

  const fetchApplications = async () => {
    try {
      const crmToken = (sessionStorage.getItem('crm_token') || localStorage.getItem('crm_token'));
      const res = await fetch('/openwa-api/otp-management/applications', {
        headers: { 'Authorization': `Bearer ${crmToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingApps(false);
    }
  };

  const fetchWebhooks = async (appId: string) => {
    setIsLoadingWebhooks(true);
    try {
      const crmToken = (sessionStorage.getItem('crm_token') || localStorage.getItem('crm_token'));
      const res = await fetch(`/openwa-api/otp-management/applications/${appId}/webhooks`, {
        headers: { 'Authorization': `Bearer ${crmToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWebhooks(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingWebhooks(false);
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId) return;
    if (!newUrl) {
      setFormError('URL is required');
      return;
    }
    if (newEvents.length === 0) {
      setFormError('Please select at least one event');
      return;
    }

    setFormError('');
    setIsSubmitting(true);
    try {
      const crmToken = (sessionStorage.getItem('crm_token') || localStorage.getItem('crm_token'));
      const res = await fetch(`/openwa-api/otp-management/applications/${selectedAppId}/webhooks`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${crmToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: newUrl, events: newEvents })
      });
      
      if (res.ok) {
        setNewUrl('');
        setNewEvents([]);
        fetchWebhooks(selectedAppId);
      } else {
        const errorData = await res.json();
        setFormError(errorData.message || 'Failed to create webhook');
      }
    } catch (e) {
      console.error(e);
      setFormError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    if (!selectedAppId) return;
    if (!window.confirm('Are you sure you want to delete this webhook?')) return;

    try {
      const crmToken = (sessionStorage.getItem('crm_token') || localStorage.getItem('crm_token'));
      const res = await fetch(`/openwa-api/otp-management/applications/${selectedAppId}/webhooks/${webhookId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${crmToken}` }
      });
      
      if (res.ok) {
        fetchWebhooks(selectedAppId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTestWebhook = async (webhookId: string) => {
    setTestNotification({ show: true, type: 'loading', message: 'Sending test event...' });
    
    try {
      const crmToken = (sessionStorage.getItem('crm_token') || localStorage.getItem('crm_token'));
      const res = await fetch(`/openwa-api/otp-management/applications/${selectedAppId}/webhooks/${webhookId}/test`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${crmToken}` }
      });
      
      const data = await res.json();
      if (data.success) {
        setTestNotification({ 
          show: true, 
          type: 'success', 
          message: 'Test successful! Check your webhook URL to see the data.' 
        });
      } else {
        setTestNotification({ 
          show: true, 
          type: 'error', 
          message: 'Test failed. The server returned an error: ' + (data.error || data.status)
        });
      }
    } catch (e) {
      setTestNotification({ 
        show: true, 
        type: 'error', 
        message: 'Test failed due to a network error.' 
      });
    }
    
    // Auto-hide after 5 seconds if not loading
    setTimeout(() => {
      setTestNotification(prev => prev?.type !== 'loading' ? null : prev);
    }, 5000);
  };

  const toggleEventSelection = (event: string) => {
    setNewEvents(prev => 
      prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
    );
  };

  return (
    <>
      <PageMeta title="Webhooks | OTP Builder" description="Manage webhooks to receive real-time OTP delivery updates." />
      
      {/* Header section with dropdowns */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Webhooks</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Configure destination URLs to receive real-time event notifications.
          </p>
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Environment:</label>
            <select
              value={selectedEnvironment}
              onChange={(e) => setSelectedEnvironment(e.target.value as any)}
              className="w-full sm:w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-2 px-4 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand-500 shadow-sm transition cursor-pointer"
            >
              <option value="production">Production</option>
              <option value="development">Development</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Application:</label>
            <select
              value={selectedAppId}
              onChange={(e) => setSelectedAppId(e.target.value)}
              className="w-full sm:w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-2 px-4 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand-500 shadow-sm transition cursor-pointer"
            >
              {filteredApplications.map(app => (
                <option key={app.id} value={app.id}>{app.name}</option>
              ))}
              {filteredApplications.length === 0 && <option value="">No apps found</option>}
            </select>
          </div>
        </div>
      </div>

      {!selectedAppId ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Applications Found</h3>
          <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
            You need to create an application in this environment before you can configure webhooks.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Webhook Form */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Add Webhook</h2>
              
              <form onSubmit={handleCreateWebhook}>
                {formError && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-800">
                    {formError}
                  </div>
                )}

                <div className="mb-6 p-4 bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800 rounded-xl">
                  <h4 className="text-sm font-bold text-brand-900 dark:text-brand-300 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    What is this?
                  </h4>
                  <p className="mt-1 text-xs text-brand-700 dark:text-brand-400">
                    Your Webhook URL is a web address on <strong>your own server</strong> (e.g. <code>https://api.yourwebsite.com/webhook</code>) that we will send data to. 
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Destination URL
                  </label>
                  <input
                    type="url"
                    required
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="e.g., https://webhook.site/your-unique-id"
                    className="w-full rounded-xl border border-gray-200 py-2.5 px-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Events to Subscribe
                  </label>
                  <div className="space-y-2">
                    {SUPPORTED_EVENTS.map(event => (
                      <label key={event} className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                        <input
                          type="checkbox"
                          checked={newEvents.includes(event)}
                          onChange={() => toggleEventSelection(event)}
                          className="w-4 h-4 text-brand-500 border-gray-300 rounded focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-600"
                        />
                        <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                          {event}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {isSubmitting ? 'Adding...' : 'Add Webhook'}
                </button>
              </form>
            </div>
          </div>

          {/* Webhooks List */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden h-full">
              <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Configured Webhooks</h2>
              </div>
              
              <div className="p-6">
                {isLoadingWebhooks ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                  </div>
                ) : webhooks.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No webhooks</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new webhook configuration.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {webhooks.map((webhook) => (
                      <div key={webhook.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-brand-500 dark:hover:border-brand-400 transition bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex justify-between items-start">
                          <div className="break-all pr-4">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`w-2 h-2 rounded-full ${webhook.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                              <h3 className="text-sm font-bold text-gray-900 dark:text-white">{webhook.url}</h3>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 ml-4">
                              Added on {new Date(webhook.createdAt).toLocaleDateString()}
                            </p>
                            <div className="ml-4 flex flex-wrap gap-2">
                              {webhook.events.map(event => (
                                <span key={event} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-100 text-brand-800 dark:bg-brand-900/30 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                                  {event}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => handleTestWebhook(webhook.id)}
                              className="px-3 py-1.5 text-xs font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 dark:text-brand-400 dark:bg-brand-900/30 dark:hover:bg-brand-900/50 rounded-lg transition"
                            >
                              Send Test
                            </button>
                            <button
                              onClick={() => handleDeleteWebhook(webhook.id)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                              title="Delete webhook"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Centered Test Notification Overlay */}
      {testNotification && testNotification.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center transform animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-700">
            <div className="mx-auto w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-gray-50 dark:bg-gray-900">
              {testNotification.type === 'loading' && (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
              )}
              {testNotification.type === 'success' && (
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {testNotification.type === 'error' && (
                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            
            <h3 className={`text-lg font-bold mb-2 ${
              testNotification.type === 'success' ? 'text-green-600 dark:text-green-400' :
              testNotification.type === 'error' ? 'text-red-600 dark:text-red-400' :
              'text-gray-900 dark:text-white'
            }`}>
              {testNotification.type === 'loading' ? 'Testing Webhook...' : 
               testNotification.type === 'success' ? 'Success!' : 'Error'}
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
              {testNotification.message}
            </p>
            
            {testNotification.type !== 'loading' && (
              <button
                onClick={() => setTestNotification(null)}
                className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl text-sm font-bold transition"
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

