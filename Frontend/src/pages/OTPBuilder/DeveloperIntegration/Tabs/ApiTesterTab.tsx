import { useState } from 'react';
import { Application } from '../../Applications';

export default function ApiTesterTab({ app }: { app: Application }) {
  const [secretKey, setSecretKey] = useState('');
  const [phone, setPhone] = useState('');
  const [response, setResponse] = useState<{ status: number; data: any; time: number } | null>(null);
  const [loading, setLoading] = useState(false);

  // Verification state
  const [requestId, setRequestId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [verifyResponse, setVerifyResponse] = useState<{ status: number; data: any; time: number } | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);

  const handleTest = async () => {
    if (!secretKey || !phone) return;
    setLoading(true);
    setResponse(null);
    const start = performance.now();
    try {
      const res = await fetch('/openwa-api/otp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': secretKey,
        },
        body: JSON.stringify({
          applicationId: app.applicationId,
          phone: phone
        })
      });
      const data = await res.json();
      const end = performance.now();
      setResponse({ status: res.status, data, time: Math.round(end - start) });

      // Automatically fill the request ID for verification if successful
      if (res.status === 200 && data.requestId) {
        setRequestId(data.requestId);
      }
    } catch (e: any) {
      const end = performance.now();
      setResponse({ status: 0, data: { error: e.message }, time: Math.round(end - start) });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!secretKey || !phone || !requestId || !otpCode) return;
    setVerifyLoading(true);
    setVerifyResponse(null);
    const start = performance.now();
    try {
      const res = await fetch('/openwa-api/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': secretKey,
        },
        body: JSON.stringify({
          applicationId: app.applicationId,
          phone: phone,
          requestId: requestId,
          otp: otpCode
        })
      });
      const data = await res.json();
      const end = performance.now();
      setVerifyResponse({ status: res.status, data, time: Math.round(end - start) });
    } catch (e: any) {
      const end = performance.now();
      setVerifyResponse({ status: 0, data: { error: e.message }, time: Math.round(end - start) });
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">API Tester</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Test the complete Send OTP and Verify OTP flows directly from the browser.
        </p>
      </div>

      {/* Global Credentials */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1">Secret Key</label>
            <input 
              type="password" 
              value={secretKey}
              onChange={e => setSecretKey(e.target.value)}
              placeholder="Paste your Secret Key here"
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-brand-500 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1">Test Phone Number</label>
            <input 
              type="text" 
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+1234567890"
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-brand-500 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Send OTP Section */}
        <div className="flex flex-col space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm flex-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">1. Send OTP</h3>
            <button
              onClick={handleTest}
              disabled={loading || !secretKey || !phone}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send OTP Request'}
            </button>
            <div className="mt-6 bg-gray-900 rounded-xl border border-gray-800 p-4 flex flex-col shadow-inner min-h-[160px]">
              <div className="flex justify-between items-center mb-3 border-b border-gray-800 pb-2">
                <span className="text-sm font-bold text-white">Send Response</span>
                {response && (
                  <div className="flex gap-3 text-xs font-mono">
                    <span className={response.status === 200 || response.status === 201 ? 'text-green-400' : 'text-red-400'}>
                      Status: {response.status}
                    </span>
                    <span className="text-gray-400">{response.time}ms</span>
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-auto">
                {response ? (
                  <pre className="text-xs font-mono text-green-400 whitespace-pre-wrap">
                    {JSON.stringify(response.data, null, 2)}
                  </pre>
                ) : (
                  <p className="text-xs font-mono text-gray-600 text-center mt-6">Click Send OTP to see response.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Verify OTP Section */}
        <div className="flex flex-col space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm flex-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">2. Verify OTP</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1">Request ID</label>
                <input 
                  type="text" 
                  value={requestId}
                  onChange={e => setRequestId(e.target.value)}
                  placeholder="Auto-filled on Send"
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-brand-500 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1">OTP Code</label>
                <input 
                  type="text" 
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value)}
                  placeholder="Check your WhatsApp"
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-brand-500 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <button
              onClick={handleVerify}
              disabled={verifyLoading || !secretKey || !phone || !requestId || !otpCode}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50"
            >
              {verifyLoading ? 'Verifying...' : 'Verify OTP Request'}
            </button>
            <div className="mt-6 bg-gray-900 rounded-xl border border-gray-800 p-4 flex flex-col shadow-inner min-h-[160px]">
              <div className="flex justify-between items-center mb-3 border-b border-gray-800 pb-2">
                <span className="text-sm font-bold text-white">Verify Response</span>
                {verifyResponse && (
                  <div className="flex gap-3 text-xs font-mono">
                    <span className={verifyResponse.status === 200 || verifyResponse.status === 201 ? 'text-green-400' : 'text-red-400'}>
                      Status: {verifyResponse.status}
                    </span>
                    <span className="text-gray-400">{verifyResponse.time}ms</span>
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-auto">
                {verifyResponse ? (
                  <pre className="text-xs font-mono text-green-400 whitespace-pre-wrap">
                    {JSON.stringify(verifyResponse.data, null, 2)}
                  </pre>
                ) : (
                  <p className="text-xs font-mono text-gray-600 text-center mt-6">Enter OTP and Verify to see response.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
