import { useEffect, useState, useCallback } from 'react';
import Badge from '../../../components/ui/badge/Badge';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '../../../components/ui/table';

interface Props {
  broadcastId: string;
  onBack: () => void;
}

const API = '/openwa-api/crm/broadcasts';
const getToken = () => sessionStorage.getItem('crm_token');

const statusColorMap: Record<string, 'primary' | 'success' | 'error' | 'warning' | 'info' | 'light' | 'dark'> = {
  draft: 'light', scheduled: 'info', queued: 'info', running: 'primary',
  paused: 'warning', completed: 'success', failed: 'error', cancelled: 'dark',
  sending: 'primary', sent: 'success', delivered: 'success', read: 'info', retrying: 'warning', skipped: 'light',
};

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

export default function BroadcastDetail({ broadcastId, onBack }: Props) {
  const [report, setReport] = useState<any>(null);
  const [recipients, setRecipients] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [recipientPage, setRecipientPage] = useState(1);
  const [recipientTotal, setRecipientTotal] = useState(0);
  const [tab, setTab] = useState<'overview' | 'recipients' | 'activity'>('overview');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${getToken()}` };
      const [reportRes, recipientsRes, activityRes] = await Promise.all([
        fetch(`${API}/${broadcastId}/report`, { headers }),
        fetch(`${API}/${broadcastId}/recipients?page=${recipientPage}&limit=20`, { headers }),
        fetch(`${API}/${broadcastId}/activity`, { headers }),
      ]);
      if (reportRes.ok) setReport(await reportRes.json());
      if (recipientsRes.ok) {
        const data = await recipientsRes.json();
        setRecipients(data.data ?? []);
        setRecipientTotal(data.total ?? 0);
      }
      if (activityRes.ok) setActivity(await activityRes.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [broadcastId, recipientPage]);

  useEffect(() => { 
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const poll = async () => {
      await fetchData();
      if (mounted) {
        timeoutId = setTimeout(poll, 2500); // Wait 2.5s before next poll
      }
    };

    poll();
    return () => { 
      mounted = false;
      clearTimeout(timeoutId); 
    };
  }, [fetchData]);

  const exportCSV = () => {
    if (!recipients.length) return;
    const headers = ['Name', 'Phone', 'Status', 'Sent At', 'Delivered At', 'Read At', 'Error'];
    const rows = recipients.map(r => [r.name ?? '', r.phone ?? '', r.status, r.sentAt ?? '', r.deliveredAt ?? '', r.readAt ?? '', r.errorReason ?? '']);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `broadcast-${broadcastId}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <svg className="w-5 h-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
        Loading broadcast details...
      </div>
    );
  }

  const bc = report?.broadcast;
  const stats = report?.stats;
  const completionPct = stats?.completionPct ?? 0;

  return (
    <div className="flex flex-col gap-5">
      {bc?.isSleeping && (
        <div className="bg-warning-50 border border-warning-200 rounded-2xl p-5 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-warning-100 flex items-center justify-center text-warning-600 shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-warning-800">Broadcast is Sleeping</h3>
            <p className="text-warning-700 mt-1">{bc.sleepReason || 'Taking a pause.'}</p>
            {bc.sleepUntil && (
              <p className="text-warning-800 font-semibold mt-2 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-warning-500 animate-pulse" />
                Resuming in: <Countdown until={bc.sleepUntil} />
              </p>
            )}
          </div>
        </div>
      )}

      {/* Header Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <button
              onClick={onBack}
              title="Back to Broadcasts"
              className="mt-1 p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{bc?.name ?? '—'}</h2>
                {bc?.status && <Badge color={statusColorMap[bc.status] ?? 'light'}>{bc.status}</Badge>}
              </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Created {bc?.createdAt ? new Date(bc.createdAt).toLocaleString() : '—'}
              {bc?.startedAt && ` · Started ${new Date(bc.startedAt).toLocaleString()}`}
              {bc?.completedAt && ` · Completed ${new Date(bc.completedAt).toLocaleString()}`}
            </p>
          </div>
          </div>
          <button onClick={exportCSV} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Export CSV
          </button>
        </div>

        {/* Progress Bar */}
        {bc?.totalCount > 0 && (
          <div className="mt-5">
            <div className="flex justify-between items-center text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
              <span>{bc.sentCount + bc.deliveredCount + bc.readCount + bc.failedCount + bc.skippedCount} / {bc.totalCount} Contacts Processed</span>
              <span>{completionPct}% Complete</span>
            </div>
            <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all" style={{ width: `${completionPct}%` }} />
            </div>
          </div>
        )}

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 mt-5">
            {[
              { label: 'Queued', value: stats.queued, color: 'text-gray-500' },
              { label: 'Sent', value: stats.sent, color: 'text-brand-500' },
              { label: 'Delivered', value: stats.delivered, color: 'text-success-500' },
              { label: 'Read', value: stats.read, color: 'text-brand-500' },
              { label: 'Failed', value: stats.failed, color: 'text-error-500' },
              { label: 'Skipped', value: stats.skipped, color: 'text-orange-500' },
              { label: 'Retries', value: stats.retries, color: 'text-warning-600' },
            ].map(s => (
              <div key={s.label} className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <span className={`text-xl font-bold ${s.color}`}>{s.value ?? 0}</span>
                <span className="text-xs text-gray-400 mt-0.5">{s.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        {(['overview', 'recipients', 'activity'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${tab === t ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:bg-gray-800 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Broadcast Settings</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Message Type', value: bc?.messageType },
              { label: 'Schedule', value: bc?.scheduleType === 'instant' ? 'Instant' : bc?.scheduledAt ? new Date(bc.scheduledAt).toLocaleString() : 'Scheduled' },
              { label: 'Session', value: bc?.sessionId ?? '—' },
              { label: 'Retry', value: bc?.retryEnabled ? `${bc.retryCount}x every ${bc.retryIntervalHours}hr` : 'Disabled' },
              { label: 'Skip Active Window', value: bc?.skipActiveWindow ? 'Yes' : 'No' },
            ].map(item => (
              <div key={item.label} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{item.label}</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5 capitalize">{String(item.value ?? '—')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'recipients' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Recipients ({recipientTotal.toLocaleString()})</span>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
                <TableRow className="border-b border-gray-100 dark:border-gray-700">
                  {['Name', 'Phone', 'Status', 'Sent', 'Delivered', 'Read', 'Error'].map(h => (
                    <TableCell key={h} isHeader className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left whitespace-nowrap">{h}</TableCell>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipients.map(r => (
                  <TableRow key={r.id} className="border-b border-gray-50 dark:border-gray-800/50">
                    <TableCell className="px-4 py-3 text-sm text-gray-900 dark:text-white">{r.name ?? '—'}</TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{r.phone ?? '—'}</TableCell>
                    <TableCell className="px-4 py-3"><Badge color={statusColorMap[r.status] ?? 'light'} size="sm">{r.status}</Badge></TableCell>
                    <TableCell className="px-4 py-3 text-xs text-gray-400">{r.sentAt ? new Date(r.sentAt).toLocaleTimeString() : '—'}</TableCell>
                    <TableCell className="px-4 py-3 text-xs text-gray-400">{r.deliveredAt ? new Date(r.deliveredAt).toLocaleTimeString() : '—'}</TableCell>
                    <TableCell className="px-4 py-3 text-xs text-gray-400">{r.readAt ? new Date(r.readAt).toLocaleTimeString() : '—'}</TableCell>
                    <TableCell className="px-4 py-3 text-xs text-error-500 max-w-xs truncate">{r.errorReason ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {/* Pagination */}
          {recipientTotal > 20 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
              <span className="text-xs text-gray-400">Page {recipientPage} of {Math.ceil(recipientTotal / 20)}</span>
              <div className="flex gap-2">
                <button disabled={recipientPage === 1} onClick={() => setRecipientPage(p => p - 1)} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition">← Prev</button>
                <button disabled={recipientPage >= Math.ceil(recipientTotal / 20)} onClick={() => setRecipientPage(p => p + 1)} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition">Next →</button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'activity' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Activity Log</h3>
          {activity.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No activity recorded yet</p>
          ) : (
            <div className="flex flex-col gap-3">
              {activity.map((log: any) => (
                <div key={log.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0 text-xs font-bold">
                    {log.action[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{log.action}</p>
                    {log.detail && <p className="text-xs text-gray-500 dark:text-gray-400">{log.detail}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(log.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

