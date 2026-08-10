import { Application } from '../../Applications';

export default function DownloadsTab({ app }: { app: Application }) {
  const downloadJson = (filename: string, data: object) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadPostman = () => {
    const collection = {
      info: {
        name: `Waflow OTP API - ${app.name}`,
        description: 'Postman collection for Waflow OTP API integration',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      item: [
        {
          name: 'Send OTP',
          request: {
            method: 'POST',
            header: [
              { key: 'Content-Type', value: 'application/json' },
              { key: 'x-api-key', value: '{{SECRET_KEY}}' }
            ],
            url: { raw: 'https://waflow.devicedoctorindia.com/api/otp/send', host: ['waflow', 'devicedoctorindia', 'com'], path: ['api', 'otp', 'send'] },
            body: {
              mode: 'raw',
              raw: JSON.stringify({ applicationId: app.applicationId, phone: '+1234567890' }, null, 2)
            }
          }
        },
        {
          name: 'Verify OTP',
          request: {
            method: 'POST',
            header: [
              { key: 'Content-Type', value: 'application/json' },
              { key: 'x-api-key', value: '{{SECRET_KEY}}' }
            ],
            url: { raw: 'https://waflow.devicedoctorindia.com/api/otp/verify', host: ['waflow', 'devicedoctorindia', 'com'], path: ['api', 'otp', 'verify'] },
            body: {
              mode: 'raw',
              raw: JSON.stringify({ applicationId: app.applicationId, phone: '+1234567890', requestId: 'req_uuid', otp: '1234' }, null, 2)
            }
          }
        }
      ]
    };
    downloadJson('postman_collection.json', collection);
  };

  const downloadOpenAPI = () => {
    const openapi = {
      openapi: '3.0.0',
      info: { title: 'Waflow OTP API', version: '1.0.0' },
      paths: {
        '/api/otp/send': {
          post: {
            summary: 'Send OTP',
            responses: { '200': { description: 'Success' } }
          }
        }
      }
    };
    downloadJson('openapi.json', openapi);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Downloads</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Download configurations and specifications customized for your application.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">Postman Collection</h3>
          <p className="text-sm text-gray-500 mb-6">Import this collection into Postman to instantly test all endpoints.</p>
          <button onClick={downloadPostman} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 rounded-lg transition shadow-sm">
            Download Collection
          </button>
        </div>

        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">OpenAPI Spec</h3>
          <p className="text-sm text-gray-500 mb-6">Download the OpenAPI specification for generating clients.</p>
          <button onClick={downloadOpenAPI} className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg transition shadow-sm">
            Download JSON
          </button>
        </div>
      </div>
    </div>
  );
}
