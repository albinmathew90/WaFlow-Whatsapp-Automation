import { useState, useEffect } from 'react';
import PageMeta from '../../../components/common/PageMeta';
import { useUser } from '../../../context/UserContext';
import { Application } from '../Applications';
import DashboardTab from './Tabs/DashboardTab';
import OtpLogsTab from './Tabs/OtpLogsTab';
import AuditLogsTab from './Tabs/AuditLogsTab';
import WebhookLogsTab from './Tabs/WebhookLogsTab';
import ExportTab from './Tabs/ExportTab';

type Tab = 'Dashboard' | 'OTP Logs' | 'Webhook Logs' | 'Audit Logs' | 'Export';
const TABS: Tab[] = ['Dashboard', 'OTP Logs', 'Webhook Logs', 'Audit Logs', 'Export'];

export default function AnalyticsAndLogs() {
  const userContext = useUser();
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [selectedEnvironment, setSelectedEnvironment] = useState<'production' | 'development'>('production');
  const [activeTab, setActiveTab] = useState<Tab>('Dashboard');
  const [isLoading, setIsLoading] = useState(true);

  const filteredApplications = applications.filter(app => app.environment === selectedEnvironment);

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    if (filteredApplications.length > 0 && !filteredApplications.find(a => a.id === selectedAppId)) {
      setSelectedAppId(filteredApplications[0].id);
    } else if (filteredApplications.length === 0) {
      setSelectedAppId('');
    }
  }, [selectedEnvironment, applications]);

  const fetchApplications = async () => {
    try {
      const crmToken = sessionStorage.getItem('crm_token');
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
      setIsLoading(false);
    }
  };

  const renderTabContent = () => {
    if (!selectedAppId) return <div className="text-gray-500">Please select an application.</div>;

    switch (activeTab) {
      case 'Dashboard':
        return <DashboardTab appId={selectedAppId} />;
      case 'OTP Logs':
        return <OtpLogsTab appId={selectedAppId} />;
      case 'Webhook Logs':
        return <WebhookLogsTab appId={selectedAppId} />;
      case 'Audit Logs':
        return <AuditLogsTab appId={selectedAppId} />;
      case 'Export':
        return <ExportTab appId={selectedAppId} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Loading analytics...
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-3xl min-h-[400px]">
        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 text-gray-400">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Applications Found</h2>
        <p className="text-gray-500 text-center max-w-md">
          You need to create an OTP Application first before you can view analytics and logs.
        </p>
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Analytics & Logs | Waflow" description="Monitor OTP traffic and performance." />
      
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics & Logs</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Monitor OTP traffic, delivery rates, and developer logs.
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

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <nav className="flex gap-6 px-6" aria-label="Tabs">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab
                    ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </>
  );
}
