import { useState, useEffect, useCallback } from 'react';
import PageMeta from '../../components/common/PageMeta';
import BroadcastDashboard from './components/BroadcastDashboard';
import CreateBroadcastForm from './components/CreateBroadcastForm';
import BroadcastDetail from './components/BroadcastDetail';

export type BroadcastView = 'dashboard' | 'create' | 'detail';

export interface Broadcast {
  id: string;
  name: string;
  status: 'draft' | 'scheduled' | 'queued' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  messageType: 'template' | 'text' | 'image' | 'video' | 'file';
  scheduleType: 'instant' | 'scheduled';
  scheduledAt?: string;
  totalCount: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  failedCount: number;
  skippedCount: number;
  queuedCount: number;
  retryAttempts: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  sessionId?: string;
  isSleeping?: boolean;
  sleepUntil?: string;
  sleepReason?: string;
}

const getToken = () => (sessionStorage.getItem('crm_token') || localStorage.getItem('crm_token'));
const API = '/openwa-api/crm/broadcasts';

export default function BroadcastsPage() {
  const [view, setView] = useState<BroadcastView>('dashboard');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [stats, setStats] = useState({ total: 0, live: 0, sent: 0, scheduled: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const token = getToken();
    if (!token) { setLoading(false); return; }
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [listRes, statsRes] = await Promise.all([
        fetch(API, { headers }),
        fetch(`${API}/stats`, { headers }),
      ]);
      if (listRes.ok) setBroadcasts(await listRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (e) {
      console.error('Failed to fetch broadcasts', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleViewDetail = (id: string) => {
    setSelectedId(id);
    setView('detail');
  };

  const handleBack = () => {
    setSelectedId(null);
    setView('dashboard');
    fetchData();
  };

  const handleCreated = () => {
    setView('dashboard');
    fetchData();
  };

  return (
    <>
      <PageMeta
        title="Broadcasts | WhatsApp Marketing"
        description="Create, schedule and monitor WhatsApp broadcast campaigns."
      />
      <div className="flex flex-col gap-5">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {view !== 'dashboard' && (
              <button
                onClick={handleBack}
                className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {view === 'dashboard' ? 'Broadcasts' : view === 'create' ? 'Create Broadcast' : 'Broadcast Detail'}
              </h1>
              {view === 'dashboard' && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Manage and monitor your WhatsApp campaigns
                </p>
              )}
            </div>
          </div>
          {view === 'dashboard' && (
            <button
              onClick={() => setView('create')}
              className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2.5 rounded-xl font-medium transition shadow-sm shadow-brand-500/20 text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Broadcast
            </button>
          )}
        </div>

        {/* Views */}
        {view === 'dashboard' && (
          <BroadcastDashboard
            broadcasts={broadcasts}
            stats={stats}
            loading={loading}
            onViewDetail={handleViewDetail}
            onRefresh={fetchData}
          />
        )}
        {view === 'create' && (
          <CreateBroadcastForm onCreated={handleCreated} onCancel={handleBack} />
        )}
        {view === 'detail' && selectedId && (
          <BroadcastDetail broadcastId={selectedId} onBack={handleBack} />
        )}
      </div>
    </>
  );
}
