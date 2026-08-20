import React, { useState, useEffect } from 'react';
import Badge from '../../../components/ui/badge/Badge';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '../../../components/ui/table';
import { Pagination } from '../../../components/Pagination';
import { Broadcast } from '../index';

interface Props {
  broadcasts: Broadcast[];
  stats: { total: number; live: number; sent: number; scheduled: number };
  loading: boolean;
  onViewDetail: (id: string) => void;
  onRefresh: () => void;
}

const statusColorMap: Record<string, 'primary' | 'success' | 'error' | 'warning' | 'info' | 'light' | 'dark'> = {
  draft: 'light',
  scheduled: 'info',
  queued: 'info',
  running: 'primary',
  paused: 'warning',
  completed: 'success',
  failed: 'error',
  cancelled: 'dark',
};

const API = '/openwa-api/crm/broadcasts';
const getToken = () => sessionStorage.getItem('crm_token');

function Countdown({ until }: { until: string }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const diff = new Date(until).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Resuming...');
        return;
      }
      const s = Math.floor(diff / 1000);
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      const sec = s % 60;
      if (h > 0) setTimeLeft(`${h}h ${m}m ${sec}s`);
      else setTimeLeft(`${m}m ${sec}s`);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [until]);

  return <span>{timeLeft}</span>;
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function BroadcastDashboard({ broadcasts, stats, loading, onViewDetail, onRefresh }: Props) {
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filtered = broadcasts.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBroadcasts = filtered.slice(startIndex, startIndex + itemsPerPage);

  const doAction = async (id: string, action: string) => {
    const token = getToken();
    if (!token) return;
    setActionLoading(id + action);
    try {
      await fetch(`${API}/${id}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const doDuplicate = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Duplicate Broadcast',
      message: 'Do you want to duplicate this broadcast and run it one more time?',
      onConfirm: () => { setConfirmModal(null); doAction(id, 'duplicate'); }
    });
  };
  
  const doCancel = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Cancel Broadcast',
      message: 'Are you sure you want to cancel this broadcast?',
      onConfirm: () => { setConfirmModal(null); doAction(id, 'cancel'); }
    });
  };
  
  const doPause = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Pause Broadcast',
      message: 'Are you sure you want to pause this broadcast?',
      onConfirm: () => { setConfirmModal(null); doAction(id, 'pause'); }
    });
  };
  
  const doResume = async (id: string) => doAction(id, 'resume');
  
  const doDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Broadcast',
      message: 'Are you sure you want to permanently delete this broadcast?',
      onConfirm: async () => {
        setConfirmModal(null);
        const token = getToken();
        if (!token) return;
        setActionLoading(id + 'delete');
        try {
          await fetch(`${API}/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          onRefresh();
        } catch (e) {
          console.error(e);
        } finally {
          setActionLoading(null);
        }
      }
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Broadcast"
          value={stats.total}
          color="bg-brand-50 dark:bg-brand-500/10 text-brand-500"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}
        />
        <StatCard
          title="Live Broadcast"
          value={stats.live}
          color="bg-success-50 dark:bg-success-500/10 text-success-500"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728M9 12a3 3 0 116 0 3 3 0 01-6 0z" /></svg>}
        />
        <StatCard
          title="Sent Broadcast"
          value={stats.sent}
          color="bg-brand-50 dark:bg-brand-500/10 text-brand-500"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>}
        />
        <StatCard
          title="Scheduled"
          value={stats.scheduled}
          color="bg-orange-50 dark:bg-orange-500/10 text-orange-500"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="flex items-center justify-between gap-4 p-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">All Broadcasts</h2>
          <div className="relative w-64">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search broadcasts..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <svg className="w-5 h-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            Loading broadcasts...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
            <svg className="w-12 h-12 text-gray-200 dark:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-sm font-medium">No broadcasts found</p>
            <p className="text-xs">Create your first broadcast to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
                <TableRow className="border-b border-gray-100 dark:border-gray-700">
                  {['Status', 'Name', 'Type', 'Scheduled', 'Statistics', 'Created', 'Actions'].map(h => (
                    <TableCell key={h} isHeader className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedBroadcasts.map(bc => (
                  <TableRow key={bc.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition">
                    <TableCell className="px-4 py-3">
                      {bc.isSleeping ? (
                        <div className="flex flex-col gap-1 items-start">
                          <Badge color="warning" size="sm">Sleeping</Badge>
                          {bc.sleepUntil && (
                            <span className="text-[10px] text-warning-600 font-medium whitespace-nowrap">
                              Resumes in <Countdown until={bc.sleepUntil} />
                            </span>
                          )}
                        </div>
                      ) : (
                        <Badge color={statusColorMap[bc.status] ?? 'light'} size="sm">
                          {bc.status.charAt(0).toUpperCase() + bc.status.slice(1)}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{bc.name}</span>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{bc.messageType}</span>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {bc.scheduleType === 'instant'
                          ? 'Instant'
                          : bc.scheduledAt
                          ? new Date(bc.scheduledAt).toLocaleString()
                          : '—'}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          {bc.sentCount + bc.deliveredCount + bc.readCount + bc.failedCount + bc.skippedCount} / {bc.totalCount} Processed
                        </span>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span className="text-success-500 font-medium">{bc.sentCount} sent</span>
                          <span>·</span>
                          <span>{bc.deliveredCount} delivered</span>
                          {bc.failedCount > 0 && (
                            <>
                              <span>·</span>
                              <span className="text-error-500">{bc.failedCount} failed</span>
                            </>
                          )}
                        </div>
                        {bc.totalCount > 0 && (
                          <div className="w-28 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand-500 rounded-full"
                              style={{ width: `${Math.min(100, ((bc.sentCount + bc.failedCount + bc.skippedCount) / bc.totalCount) * 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(bc.createdAt).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onViewDetail(bc.id)}
                          className="px-2 py-1 rounded text-xs font-medium text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition"
                        >
                          View
                        </button>
                        {bc.status === 'running' && (
                          <button
                            onClick={() => doPause(bc.id)}
                            disabled={actionLoading === bc.id + 'pause'}
                            className="px-2 py-1 rounded text-xs font-medium text-warning-600 hover:bg-warning-50 dark:hover:bg-warning-500/10 transition"
                          >
                            Pause
                          </button>
                        )}
                        {bc.status === 'paused' && (
                          <button
                            onClick={() => doResume(bc.id)}
                            disabled={actionLoading === bc.id + 'resume'}
                            className="px-2 py-1 rounded text-xs font-medium text-success-600 hover:bg-success-50 dark:hover:bg-success-500/10 transition"
                          >
                            Resume
                          </button>
                        )}
                        <button
                          onClick={() => doDuplicate(bc.id)}
                          disabled={actionLoading === bc.id + 'duplicate'}
                          className="px-2 py-1 rounded text-xs font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                        >
                          Duplicate
                        </button>
                        {!['completed', 'cancelled'].includes(bc.status) && (
                          <button
                            onClick={() => doCancel(bc.id)}
                            disabled={actionLoading === bc.id + 'cancel'}
                            className="px-2 py-1 rounded text-xs font-medium text-warning-500 hover:bg-warning-50 dark:hover:bg-warning-500/10 transition"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          onClick={() => doDelete(bc.id)}
                          disabled={actionLoading === bc.id + 'delete'}
                          className="px-2 py-1 rounded text-xs font-medium text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {!loading && (
          <Pagination
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            totalItems={filtered.length}
          />
        )}
      </div>

      {confirmModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setConfirmModal(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6 overflow-hidden">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{confirmModal.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{confirmModal.message}</p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

