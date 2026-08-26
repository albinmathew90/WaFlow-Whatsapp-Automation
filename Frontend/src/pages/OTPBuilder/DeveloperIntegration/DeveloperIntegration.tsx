import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import PageMeta from '../../../components/common/PageMeta';
import { Application } from '../Applications';

import OverviewTab from './Tabs/OverviewTab';
import ApiCredentialsTab from './Tabs/ApiCredentialsTab';
import IntegrationFlowTab from './Tabs/IntegrationFlowTab';
import ApiReferenceTab from './Tabs/ApiReferenceTab';
import SdkSnippetsTab from './Tabs/SdkSnippetsTab';
import WebhooksTab from './Tabs/WebhooksTab';
import ApiTesterTab from './Tabs/ApiTesterTab';
import DownloadsTab from './Tabs/DownloadsTab';

const TABS = [
  'Overview',
  'API Credentials',
  'Integration',
  'API Reference',
  'SDK Snippets',
  'Webhooks',
  'API Tester',
  'Downloads',
] as const;

type TabType = typeof TABS[number];

export default function DeveloperIntegration() {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('Overview');
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (appId) fetchApplication(appId);
  }, [appId]);

  const fetchApplication = async (id: string) => {
    try {
      setLoading(true);
      const token = (sessionStorage.getItem('crm_token') || localStorage.getItem('crm_token'));
      // The backend needs to provide a single app endpoint, assuming it does based on Applications.tsx
      const res = await fetch(`/openwa-api/otp-management/applications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const apps: Application[] = await res.json();
        const found = apps.find(a => a.id === id);
        if (found) {
          setApp(found);
        } else {
          // fallback if not found
          navigate('/otp-builder/applications');
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading Integration...</div>;
  }

  if (!app) {
    return <div className="p-8 text-center text-red-500">Application not found</div>;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Overview':
        return <OverviewTab app={app} onAppUpdate={setApp} />;
      case 'API Credentials':
        return <ApiCredentialsTab app={app} onAppUpdate={setApp} />;
      case 'Integration':
        return <IntegrationFlowTab />;
      case 'API Reference':
        return <ApiReferenceTab app={app} />;
      case 'SDK Snippets':
        return <SdkSnippetsTab app={app} />;
      case 'Webhooks':
        return <WebhooksTab app={app} />;
      case 'API Tester':
        return <ApiTesterTab app={app} />;
      case 'Downloads':
        return <DownloadsTab app={app} />;
      default:
        return null;
    }
  };

  return (
    <>
      <PageMeta title={`Integration: ${app.name} | Waflow`} description="Developer Integration Portal" />
      
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button 
            onClick={() => navigate('/otp-builder/applications')}
            className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition mb-2"
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Applications
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Developer Integration
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {app.name} ({app.environment})
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col md:flex-row items-start min-h-[600px]">
        {/* Vertical Sidebar for Tabs on Desktop, Horizontal on Mobile */}
        <div className="md:w-64 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex-shrink-0 overflow-x-auto md:overflow-y-auto md:sticky md:top-24 self-start max-h-[calc(100vh-6rem)] rounded-tl-2xl rounded-bl-2xl">
          <nav className="flex md:flex-col p-2 gap-1 min-w-max md:min-w-0">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-left px-4 py-2.5 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 p-6 md:p-8 bg-white dark:bg-gray-900">
          {renderTabContent()}
        </div>
      </div>
    </>
  );
}
