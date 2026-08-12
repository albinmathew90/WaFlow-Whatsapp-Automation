import { useState } from 'react';
import { Application } from '../../Applications';
import CopyButton from '../../../../components/common/CopyButton';

export default function ApiReferenceTab({ app }: { app: Application }) {
  const getResponse = (endpoint: string) => {
    switch(endpoint) {
      case 'send':
      case 'resend':
        return `{
  "success": true,
  "requestId": "req_abc123",
  "expiresIn": 600,
  "status": "queued"
}`;
      case 'verify':
        return `{
  "verified": true,
  "status": "verified",
  "requestId": "req_abc123",
  "attemptsRemaining": 0
}`;
      case 'status':
        return `{
  "requestId": "req_abc123",
  "status": "pending",
  "phone": "+1234567890",
  "attemptsRemaining": 3,
  "expiresAt": "2024-01-15T10:35:00.000Z",
  "createdAt": "2024-01-15T10:25:00.000Z"
}`;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const ResponseBlock = ({ endpoint }: { endpoint: string }) => (
    <div className="mt-8 bg-[#121212] rounded-xl overflow-hidden border border-gray-800">
      <div className="flex justify-between items-center bg-[#1e1e1e] px-4 py-3 border-b border-[#333]">
        <span className="text-[12px] font-bold text-[#4ec9b0] font-mono flex items-center gap-2 uppercase tracking-widest">
          <span className="w-2 h-2 rounded-full bg-[#4ec9b0] animate-pulse"></span>
          Example Response (200 OK)
        </span>
        <CopyButton 
          textToCopy={getResponse(endpoint) || ''}
          className="text-xs font-medium text-gray-400 hover:text-white transition flex items-center justify-center gap-1.5 bg-[#2d2d2d] hover:bg-[#404040] px-3 py-1.5 rounded-lg border border-[#333] w-28"
          defaultText={
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy JSON
            </>
          }
          copiedText={
            <>
              <svg className="w-4 h-4 text-[#4ec9b0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-[#4ec9b0]">Copied!</span>
            </>
          }
        />
      </div>
      <div className="p-6 overflow-x-auto custom-scrollbar">
        <pre className="text-[14px] font-mono text-[#9cdcfe] leading-relaxed">
          <code>{getResponse(endpoint)}</code>
        </pre>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto pb-32">
      <div className="mb-16 pt-4 border-b border-gray-100 dark:border-gray-800 pb-12">
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">API Reference</h1>
        <p className="text-gray-600 dark:text-gray-400 text-base max-w-3xl leading-relaxed">
          The Waflow REST API empowers you to send, verify, and manage WhatsApp OTPs programmatically with zero infrastructure overhead.
        </p>
        
        <div className="mt-10 bg-gradient-to-r from-brand-50 to-brand-50 dark:from-brand-900/10 dark:to-brand-900/10 border border-brand-100 dark:border-brand-800/50 rounded-2xl p-8 shadow-sm">
          <h3 className="text-brand-900 dark:text-brand-300 font-bold text-lg mb-3 flex items-center gap-3">
            <svg className="w-6 h-6 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Authentication
          </h3>
          <p className="text-base text-brand-800/80 dark:text-brand-200/80 mb-5 max-w-3xl">
            Authenticate your API requests by including your secret API key in the header of every request. You can manage your API keys in the API Credentials tab.
          </p>
          <div className="bg-white dark:bg-[#121212] rounded-xl border border-brand-200 dark:border-brand-800/50 p-4 shadow-sm inline-block w-full md:w-auto">
            <code className="text-sm font-mono text-gray-800 dark:text-gray-300 flex items-center gap-3">
              <span className="text-gray-400 select-none">Header</span>
              <span className="text-brand-600 dark:text-brand-400">x-api-key:</span>
              YOUR_SECRET_KEY
            </code>
          </div>
        </div>
      </div>

      <div className="space-y-32">
        {/* Send OTP Endpoint */}
        <section id="send">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Send OTP</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Generates a one-time password and delivers it to the specified phone number via WhatsApp.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mb-10 bg-gray-50 dark:bg-[#1a1a1a] p-3 rounded-xl border border-gray-100 dark:border-gray-800/60 shadow-sm w-full md:w-max">
            <span className="px-3 py-1.5 text-sm font-bold bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400 rounded-lg uppercase tracking-widest shadow-sm">
              POST
            </span>
            <code className="text-base font-mono text-gray-700 dark:text-gray-300 pr-4">
              https://waflow.devicedoctorindia.com/api/otp/send
            </code>
          </div>

          <h4 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-widest mb-6 border-b-2 border-gray-100 dark:border-gray-800 pb-3">
            Body Parameters
          </h4>
          
          <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm mb-8">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-[#222] border-b border-gray-200 dark:border-gray-800">
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Parameter</th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                <tr>
                  <td className="py-5 px-6 align-top w-1/3">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-sm font-bold text-gray-900 dark:text-white">applicationId</code>
                      <span className="text-[10px] uppercase font-bold text-red-600 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full">Required</span>
                    </div>
                    <span className="text-xs font-mono text-gray-500">string</span>
                  </td>
                  <td className="py-5 px-6 align-top">
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      Your unique OTP application identifier. This determines the template and branding used for the message.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td className="py-5 px-6 align-top w-1/3">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-sm font-bold text-gray-900 dark:text-white">phone</code>
                      <span className="text-[10px] uppercase font-bold text-red-600 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full">Required</span>
                    </div>
                    <span className="text-xs font-mono text-gray-500">string</span>
                  </td>
                  <td className="py-5 px-6 align-top">
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      The recipient's phone number formatted in E.164 standard (e.g., <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">+1234567890</code>).
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <ResponseBlock endpoint="send" />
        </section>

        {/* Verify OTP Endpoint */}
        <section id="verify">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Verify OTP</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Validates the OTP code submitted by the user against the specific send request.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mb-10 bg-gray-50 dark:bg-[#1a1a1a] p-3 rounded-xl border border-gray-100 dark:border-gray-800/60 shadow-sm w-full md:w-max">
            <span className="px-3 py-1.5 text-sm font-bold bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 rounded-lg uppercase tracking-widest shadow-sm">
              POST
            </span>
            <code className="text-base font-mono text-gray-700 dark:text-gray-300 pr-4">
              https://waflow.devicedoctorindia.com/api/otp/verify
            </code>
          </div>

          <h4 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-widest mb-6 border-b-2 border-gray-100 dark:border-gray-800 pb-3">
            Body Parameters
          </h4>
          
          <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm mb-8">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-[#222] border-b border-gray-200 dark:border-gray-800">
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Parameter</th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                <tr>
                  <td className="py-5 px-6 align-top w-1/3">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-sm font-bold text-gray-900 dark:text-white">applicationId</code>
                      <span className="text-[10px] uppercase font-bold text-red-600 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full">Required</span>
                    </div>
                    <span className="text-xs font-mono text-gray-500">string</span>
                  </td>
                  <td className="py-5 px-6 align-top">
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      Your OTP application ID.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td className="py-5 px-6 align-top w-1/3">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-sm font-bold text-gray-900 dark:text-white">phone</code>
                      <span className="text-[10px] uppercase font-bold text-red-600 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full">Required</span>
                    </div>
                    <span className="text-xs font-mono text-gray-500">string</span>
                  </td>
                  <td className="py-5 px-6 align-top">
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      The phone number that received the OTP.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td className="py-5 px-6 align-top w-1/3">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-sm font-bold text-gray-900 dark:text-white">requestId</code>
                      <span className="text-[10px] uppercase font-bold text-red-600 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full">Required</span>
                    </div>
                    <span className="text-xs font-mono text-gray-500">string</span>
                  </td>
                  <td className="py-5 px-6 align-top">
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      The request ID returned in the response when the OTP was initially sent.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td className="py-5 px-6 align-top w-1/3">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-sm font-bold text-gray-900 dark:text-white">otp</code>
                      <span className="text-[10px] uppercase font-bold text-red-600 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full">Required</span>
                    </div>
                    <span className="text-xs font-mono text-gray-500">string</span>
                  </td>
                  <td className="py-5 px-6 align-top">
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      The 4-8 digit OTP code provided by the user.
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <ResponseBlock endpoint="verify" />
        </section>

        {/* Resend OTP Endpoint */}
        <section id="resend">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Resend OTP</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Invalidates the previous OTP request and delivers a fresh code to the same phone number.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mb-10 bg-gray-50 dark:bg-[#1a1a1a] p-3 rounded-xl border border-gray-100 dark:border-gray-800/60 shadow-sm w-full md:w-max">
            <span className="px-3 py-1.5 text-sm font-bold bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400 rounded-lg uppercase tracking-widest shadow-sm">
              POST
            </span>
            <code className="text-base font-mono text-gray-700 dark:text-gray-300 pr-4">
              https://waflow.devicedoctorindia.com/api/otp/resend
            </code>
          </div>

          <h4 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-widest mb-6 border-b-2 border-gray-100 dark:border-gray-800 pb-3">
            Body Parameters
          </h4>
          
          <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm mb-8">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-[#222] border-b border-gray-200 dark:border-gray-800">
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Parameter</th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                <tr>
                  <td className="py-5 px-6 align-top w-1/3">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-sm font-bold text-gray-900 dark:text-white">previousRequestId</code>
                      <span className="text-[10px] uppercase font-bold text-red-600 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full">Required</span>
                    </div>
                    <span className="text-xs font-mono text-gray-500">string</span>
                  </td>
                  <td className="py-5 px-6 align-top">
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      The request ID of the OTP to be replaced.
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <ResponseBlock endpoint="resend" />
        </section>

        {/* Status Endpoint */}
        <section id="status">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Get OTP Status</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Returns the current lifecycle status of an OTP request without consuming a verification attempt.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mb-10 bg-gray-50 dark:bg-[#1a1a1a] p-3 rounded-xl border border-gray-100 dark:border-gray-800/60 shadow-sm w-full md:w-max">
            <span className="px-3 py-1.5 text-sm font-bold bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400 rounded-lg uppercase tracking-widest shadow-sm">
              GET
            </span>
            <code className="text-base font-mono text-gray-700 dark:text-gray-300 pr-4">
              https://waflow.devicedoctorindia.com/api/otp/status/&#123;requestId&#125;
            </code>
          </div>

          <h4 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-widest mb-6 border-b-2 border-gray-100 dark:border-gray-800 pb-3">
            Path Parameters
          </h4>
          
          <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm mb-10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-[#222] border-b border-gray-200 dark:border-gray-800">
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Parameter</th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                <tr>
                  <td className="py-5 px-6 align-top w-1/3">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-sm font-bold text-gray-900 dark:text-white">requestId</code>
                      <span className="text-[10px] uppercase font-bold text-red-600 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full">Required</span>
                    </div>
                    <span className="text-xs font-mono text-gray-500">string</span>
                  </td>
                  <td className="py-5 px-6 align-top">
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      The OTP request ID returned by /send or /resend to query the status for.
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <h4 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-widest mb-6 border-b-2 border-gray-100 dark:border-gray-800 pb-3">
            Header Parameters
          </h4>
          
          <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm mb-8">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-[#222] border-b border-gray-200 dark:border-gray-800">
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Parameter</th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                <tr>
                  <td className="py-5 px-6 align-top w-1/3">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-sm font-bold text-gray-900 dark:text-white">x-application-id</code>
                      <span className="text-[10px] uppercase font-bold text-red-600 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full">Required</span>
                    </div>
                    <span className="text-xs font-mono text-gray-500">string</span>
                  </td>
                  <td className="py-5 px-6 align-top">
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      Your OTP application identifier (must be passed in headers for GET requests).
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <ResponseBlock endpoint="status" />
        </section>
      </div>
    </div>
  );
}

