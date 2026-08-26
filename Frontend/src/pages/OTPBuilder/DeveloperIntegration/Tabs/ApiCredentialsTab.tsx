import { useState } from 'react';
import { Application } from '../../Applications';

import CopyButton from '../../../../components/common/CopyButton';

export default function ApiCredentialsTab({ app, onAppUpdate }: { app: Application, onAppUpdate: (app: Application) => void }) {
  const [isRotating, setIsRotating] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [showRotateConfirm, setShowRotateConfirm] = useState(false);

  const executeRotation = async () => {
    setIsRotating(true);
    setNewSecret(null);
    setShowRotateConfirm(false);
    try {
      const token = (sessionStorage.getItem('crm_token') || localStorage.getItem('crm_token'));
      const res = await fetch(`/openwa-api/otp-management/applications/${app.id}/rotate-secret`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNewSecret(data.newSecretKey);
        if (typeof onAppUpdate === 'function') {
          onAppUpdate({ ...app }); 
        }
      } else {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        alert(`Failed to rotate key: ${err.message || res.status}`);
      }
    } catch (e: any) {
      alert(`Error: ${e.message}`);
      console.error(e);
    } finally {
      setIsRotating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">API Credentials</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your application's authentication credentials. Keep your secret key safe!
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
          <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1">Application ID (Public)</label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Identifies your application. It is safe to expose this in frontend code if needed.</p>
          <div className="flex max-w-lg">
            <input 
              type="text" 
              readOnly 
              value={app.applicationId} 
              className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-l-lg py-2.5 px-4 text-sm font-mono text-gray-900 dark:text-white focus:outline-none"
            />
            <CopyButton 
              textToCopy={app.applicationId}
              className="bg-gray-100 dark:bg-gray-700 px-4 py-2.5 rounded-r-lg border border-l-0 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm font-medium w-24 flex items-center justify-center"
              defaultText="Copy"
              copiedText="Copied"
            />
          </div>
        </div>

        <div className="p-5">
          <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1">Secret Key (Private)</label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Never share this key. It should only be used in secure backend environments.</p>
          
          {newSecret ? (
            <div className="mb-4">
              <div className="flex max-w-lg">
                <input 
                  type="text" 
                  readOnly 
                  value={newSecret} 
                  className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-l-lg py-2.5 px-4 text-sm font-mono text-gray-900 dark:text-white focus:outline-none"
                />
                <CopyButton 
                  textToCopy={newSecret}
                  className="bg-gray-100 dark:bg-gray-700 px-4 py-2.5 rounded-r-lg border border-l-0 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm font-medium w-24 flex items-center justify-center"
                  defaultText="Copy"
                  copiedText="Copied"
                />
              </div>
              <p className="text-xs text-red-500 mt-2 font-medium">Please copy this now! It will not be shown again.</p>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="max-w-lg flex-1 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg py-2.5 px-4 text-sm font-mono text-gray-500 select-none">
                ••••••••••••••••••••••••••••••••
              </div>
            </div>
          )}
          {showRotateConfirm && (
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
                  Are you sure you want to rotate the <strong className="text-gray-900 dark:text-white">Secret</strong> Key? This will immediately invalidate the old key.
                </p>
                <div className="flex gap-3 mt-2 w-full">
                  <button 
                    onClick={() => setShowRotateConfirm(false)} 
                    className="flex-1 px-4 py-2.5 text-sm font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={executeRotation} 
                    disabled={isRotating} 
                    className="flex-1 px-4 py-2.5 text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition disabled:opacity-50"
                  >
                    {isRotating ? 'Rotating...' : 'Yes, Rotate'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {!showRotateConfirm && (
            <div className="mt-4 flex gap-3">
              <button 
                onClick={() => setShowRotateConfirm(true)}
                disabled={isRotating}
                className="text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-lg transition disabled:opacity-50"
              >
                Rotate Secret Key
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
