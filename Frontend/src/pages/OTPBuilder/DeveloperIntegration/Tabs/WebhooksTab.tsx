import { Application } from '../../Applications';

import CopyButton from '../../../../components/common/CopyButton';

export default function WebhooksTab({ app }: { app: Application }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Webhooks Integration</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Listen to real-time events about your OTPs using Webhooks.
        </p>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Webhook Secret</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          This secret is used to sign webhook payloads so you can verify they came from Waflow.
        </p>
        <div className="flex max-w-lg">
          <input 
            type="text" 
            readOnly 
            value={app.webhookSecret || 'No Webhook Secret configured'} 
            className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-l-lg py-2.5 px-4 text-sm font-mono text-gray-900 dark:text-white focus:outline-none"
          />
          <CopyButton 
            textToCopy={app.webhookSecret || ''}
            className="bg-gray-100 dark:bg-gray-700 px-4 py-2.5 rounded-r-lg border border-l-0 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm font-medium w-24 flex items-center justify-center"
            defaultText="Copy"
            copiedText="Copied"
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Supported Events</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {['otp.sent', 'otp.delivered', 'otp.read', 'otp.failed', 'otp.expired', 'otp.verified'].map(event => (
            <div key={event} className="p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
              <code className="text-xs font-bold text-brand-600 dark:text-brand-400">{event}</code>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Sample Payload</h3>
        <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto shadow-lg border border-gray-800">
          <pre className="text-sm font-mono text-gray-300">
{`{
  "event": "otp.verified",
  "applicationId": "${app.applicationId}",
  "requestId": "uuid-v4-string",
  "data": {
    "phone": "+1234567890",
    "status": "verified"
  },
  "timestamp": "2026-08-07T12:00:00Z"
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
