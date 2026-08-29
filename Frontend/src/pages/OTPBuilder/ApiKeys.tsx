import { useState, useEffect } from 'react';
import PageMeta from '../../components/common/PageMeta';
import CopyButton from '../../components/common/CopyButton';
import { Pagination } from '../../components/Pagination';

interface Application {
  id: string;
  name: string;
  applicationId: string;
  webhookSecret: string;
}

interface ApiKeyLog {
  id: string;
  endpoint: string;
  ipAddress: string;
  statusCode: number;
  latencyMs: number;
  createdAt: string;
}

export default function ApiKeys() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [logs, setLogs] = useState<ApiKeyLog[]>([]);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [newSecretKey, setNewSecretKey] = useState<string | null>(null);
  const [newWebhookSecret, setNewWebhookSecret] = useState<string | null>(null);
  const [rotateConfirm, setRotateConfirm] = useState<'api' | 'secret' | 'webhook' | null>(null);
  const [isRotating, setIsRotating] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedAppId]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLogs = logs.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    if (selectedAppId) {
      fetchLogs(selectedAppId);
      // Clear revealed keys when switching apps
      setNewApiKey(null);
      setNewSecretKey(null);
      setNewWebhookSecret(null);
      setRotateConfirm(null);
    }
  }, [selectedAppId]);

  const fetchApplications = async () => {
    try {
      const token = (sessionStorage.getItem('crm_token') || localStorage.getItem('crm_token'));
      const res = await fetch('/openwa-api/otp-management/applications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
        if (data.length > 0 && !selectedAppId) {
          setSelectedAppId(data[0].id);
        }
      }
    } catch (e) { console.error(e); }
  };

  const fetchLogs = async (appId: string) => {
    try {
      const token = (sessionStorage.getItem('crm_token') || localStorage.getItem('crm_token'));
      const res = await fetch(`/openwa-api/otp-management/applications/${appId}/api-key-logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) { console.error(e); }
  };

  const executeRotate = async () => {
    if (!selectedAppId || !rotateConfirm) return;
    setIsRotating(true);
    const type = rotateConfirm;

    try {
      const token = (sessionStorage.getItem('crm_token') || localStorage.getItem('crm_token'));
      const endpoint = type === 'api' ? 'rotate-api-key' : type === 'secret' ? 'rotate-secret' : 'rotate-webhook-secret';
      const res = await fetch(`/openwa-api/otp-management/applications/${selectedAppId}/${endpoint}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (type === 'api') setNewApiKey(data.newApiKey);
        if (type === 'secret') setNewSecretKey(data.newSecretKey);
        if (type === 'webhook') setNewWebhookSecret(data.newWebhookSecret);
        fetchApplications(); // refresh webhookSecret if needed
      } else {
        alert('Failed to rotate key.');
      }
    } catch (e) { console.error(e); } finally {
      setIsRotating(false);
      setRotateConfirm(null);
    }
  };

  const selectedApp = applications.find(a => a.id === selectedAppId);

  return (
    <>
      <PageMeta title="API Keys | Waflow" description="Manage API Keys for Waflow" />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">API Keys & Authentication</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage credentials for your registered applications.</p>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">No Applications Found</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">You must create an application first before managing API keys.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Col: Credentials */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <label className="mb-3 block text-sm font-bold text-gray-900 dark:text-white">Select Application</label>
              <div className="relative">
                <select
                  value={selectedAppId}
                  onChange={e => setSelectedAppId(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 pr-10 text-sm font-medium focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  {applications.map(app => (
                    <option key={app.id} value={app.id}>{app.name}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>

            {selectedApp && (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 space-y-6">
                
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-bold text-gray-900 dark:text-white">Application ID</label>
                    <CopyButton textToCopy={selectedApp.applicationId} className="text-xs font-medium text-brand-500 hover:text-brand-600 w-12 text-right" />
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3 text-sm font-mono text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    {selectedApp.applicationId}
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-bold text-gray-900 dark:text-white">API Key</label>
                    <button onClick={() => setRotateConfirm('api')} className="text-xs font-medium text-red-500 hover:text-red-600">Rotate</button>
                  </div>
                  {newApiKey ? (
                    <div className="rounded-xl border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
                      <p className="text-xs text-green-600 dark:text-green-400 mb-2 font-bold">Copy this now! It won't be shown again.</p>
                      <div className="flex items-center justify-between">
                        <code className="text-sm font-mono text-gray-900 dark:text-white break-all">{newApiKey}</code>
                        <CopyButton textToCopy={newApiKey} className="ml-2 text-xs font-medium text-brand-500 w-12 text-right" />
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-gray-50 p-3 text-sm font-mono text-gray-400 dark:bg-gray-800 dark:text-gray-500">
                      ********************************
                    </div>
                  )}
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-bold text-gray-900 dark:text-white">Secret Key</label>
                    <button onClick={() => setRotateConfirm('secret')} className="text-xs font-medium text-red-500 hover:text-red-600">Rotate</button>
                  </div>
                  {newSecretKey ? (
                    <div className="rounded-xl border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
                      <p className="text-xs text-green-600 dark:text-green-400 mb-2 font-bold">Copy this now! It won't be shown again.</p>
                      <div className="flex items-center justify-between">
                        <code className="text-sm font-mono text-gray-900 dark:text-white break-all">{newSecretKey}</code>
                        <CopyButton textToCopy={newSecretKey} className="ml-2 text-xs font-medium text-brand-500 w-12 text-right" />
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-gray-50 p-3 text-sm font-mono text-gray-400 dark:bg-gray-800 dark:text-gray-500">
                      ********************************
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-bold text-gray-900 dark:text-white">Webhook Secret</label>
                    <button onClick={() => setRotateConfirm('webhook')} className="text-xs font-medium text-red-500 hover:text-red-600">Rotate</button>
                  </div>
                  {newWebhookSecret ? (
                    <div className="rounded-xl border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
                      <div className="flex items-center justify-between">
                        <code className="text-sm font-mono text-gray-900 dark:text-white break-all">{newWebhookSecret}</code>
                        <CopyButton textToCopy={newWebhookSecret} className="ml-2 text-xs font-medium text-brand-500 w-12 text-right" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                       <code className="text-sm font-mono text-gray-600 dark:text-gray-300 break-all">
                         {selectedApp.webhookSecret || 'Not configured'}
                       </code>
                       <CopyButton textToCopy={selectedApp.webhookSecret} className="ml-2 text-xs font-medium text-brand-500 w-12 text-right" />
                    </div>
                  )}
                  <p className="mt-2 text-xs text-gray-500">
                    Used to verify incoming webhooks are sent from Waflow. Compute HMAC SHA256 of the payload body with this secret and compare with the `X-Hub-Signature` header.
                  </p>
                </div>

                {rotateConfirm && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-6 rounded-2xl max-w-sm w-full mx-4 flex flex-col gap-5 border border-gray-100 dark:border-gray-800 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold">Rotate Key</h3>
                      </div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 leading-relaxed">
                        Are you sure you want to rotate the <strong className="text-gray-900 dark:text-white">{rotateConfirm.toUpperCase()}</strong> Key? This will immediately invalidate the old key.
                      </p>
                      <div className="flex gap-3 mt-2 w-full">
                        <button 
                          onClick={() => setRotateConfirm(null)} 
                          className="flex-1 px-4 py-2.5 text-sm font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 rounded-xl transition"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={executeRotate} 
                          disabled={isRotating} 
                          className="flex-1 px-4 py-2.5 text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition disabled:opacity-50"
                        >
                          {isRotating ? 'Rotating...' : 'Yes, Rotate'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Col: Logs */}
          <div className="lg:col-span-2">
             <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Authentication Requests</h2>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
                      <tr>
                        <th className="rounded-l-xl px-4 py-3">Time</th>
                        <th className="px-4 py-3">Endpoint</th>
                        <th className="px-4 py-3">IP Address</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="rounded-r-xl px-4 py-3">Latency</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                      {logs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                            No authentication requests logged yet.
                          </td>
                        </tr>
                      ) : paginatedLogs.map(log => (
                        <tr key={log.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 font-mono">
                            {log.endpoint}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {log.ipAddress || 'Unknown'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${log.statusCode >= 200 && log.statusCode < 300 ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>
                              {log.statusCode}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {log.latencyMs ? `${log.latencyMs}ms` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {logs.length > 0 && (
                  <div className="mt-4">
                    <Pagination
                      currentPage={currentPage}
                      setCurrentPage={setCurrentPage}
                      itemsPerPage={itemsPerPage}
                      setItemsPerPage={setItemsPerPage}
                      totalItems={logs.length}
                    />
                  </div>
                )}
             </div>
          </div>

        </div>
      )}
    </>
  );
}
