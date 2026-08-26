import { useState } from 'react';
import { useUser } from '../../../../context/UserContext';

interface ExportTabProps {
  appId: string;
}

export default function ExportTab({ appId }: ExportTabProps) {
  const token = (sessionStorage.getItem('crm_token') || localStorage.getItem('crm_token'));
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState('otp');

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // In a real application, you would pass the type and have a dedicated export endpoint.
      // Here we will reuse the logs endpoint and convert to CSV on the client for simplicity,
      // or fetch a large limit.
      const res = await fetch(`/openwa-api/otp-management/logs/${appId}/${exportType}?limit=1000`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        const items = data.data || [];
        
        if (items.length === 0) {
          alert('No data available to export.');
          return;
        }

        // Convert JSON to CSV
        const headers = Object.keys(items[0]).join(',');
        const rows = items.map((item: any) => 
          Object.values(item).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
        );
        const csvContent = [headers, ...rows].join('\n');

        // Trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${exportType}_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (e) {
      console.error('Export failed:', e);
      alert('Export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Export Data</h3>
      <p className="text-sm text-gray-500 mb-6">
        Download a CSV report of your application's logs and analytics for offline analysis.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Data Type
          </label>
          <select 
            value={exportType}
            onChange={(e) => setExportType(e.target.value)}
            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-3 px-4 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand-500 transition"
          >
            <option value="otp">OTP Requests</option>
            <option value="webhooks">Webhook Deliveries</option>
            <option value="audit">Audit Logs</option>
          </select>
        </div>

        <button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full sm:w-auto px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isExporting ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Exporting...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download CSV
            </>
          )}
        </button>
      </div>
    </div>
  );
}
