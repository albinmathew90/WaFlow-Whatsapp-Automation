import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, AlertTriangle, XCircle, RefreshCw, 
  TrendingUp, CalendarDays, Activity, MessageSquare,
  AlertCircle, Info
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell
} from 'recharts';
import { Pagination } from '../components/Pagination';

type TimeRange = '24h' | '7d' | '30d' | 'custom';

export default function HealthMonitor() {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showStatusDetails, setShowStatusDetails] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>({
    deliveryRate: 0,
    readRate: 0,
    replyRate: 0,
    stuckRate: 0,
    accountStatus: 'good',
    rawCounts: { totalOutgoing: 0, delivered: 0, read: 0, stuck: 0 },
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [stuckContacts, setStuckContacts] = useState<any[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [timeRange, selectedDate]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedContacts = stuckContacts.slice(startIndex, startIndex + itemsPerPage);

  // Trigger re-animation when time range changes
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 500);
    return () => clearTimeout(timer);
  }, [timeRange, selectedDate]);

  useEffect(() => {
    import('../services/openwa').then(module => {
      module.getSessions().then(sessions => {
        if (sessions && sessions.length > 0) {
          setActiveSessionId(sessions[0].id);
        } else {
          setLoading(false);
        }
      }).catch(err => {
        console.error("Failed to load sessions:", err);
        setLoading(false);
      });
    });
  }, []);

  useEffect(() => {
    if (!activeSessionId) return;
    
    setLoading(true);
    let customDateParam = undefined;
    if (timeRange === 'custom') {
      customDateParam = selectedDate;
    }

    import('../services/openwa').then(module => {
      Promise.all([
        module.getHealthSummary(activeSessionId, timeRange, customDateParam),
        module.getStuckContacts(activeSessionId, timeRange, customDateParam)
      ]).then(([healthSummary, contacts]) => {
        setSummary(healthSummary);
        setChartData(healthSummary.chartData || []);
        setStuckContacts(contacts || []);
        setLoading(false);
      }).catch(err => {
        console.error("Failed to fetch health data:", err);
        setLoading(false);
      });
    });
  }, [activeSessionId, timeRange, selectedDate]);

  const handleAction = async (chatId: string, action: 'opt-out' | 'ignore') => {
    if (action === 'opt-out') {
      if (!window.confirm('Are you sure you want to force opt-out this contact? They will no longer receive campaigns.')) return;
      
      try {
        if (activeSessionId) {
          const module = await import('../services/openwa');
          await module.executeContactAction(activeSessionId, action, [chatId]);
          // Update local state to reflect opt-out
          setStuckContacts(prev => prev.map(c => c.chatId === chatId ? { ...c, optedOut: true } : c));
        }
      } catch (err) {
        console.error("Failed to opt-out contact:", err);
        alert("Failed to perform action.");
      }
    } else {
      setStuckContacts(prev => prev.filter(c => c.chatId !== chatId));
    }
  };

  const formatDuration = (hours: number) => {
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const getBadgeColor = (status: string) => {
    switch (status) {
      case 'good': return 'bg-emerald-50 text-emerald-600 border border-emerald-200';
      case 'warning': return 'bg-amber-50 text-amber-600 border border-amber-200';
      case 'critical': return 'bg-rose-50 text-rose-600 border border-rose-200';
      default: return 'bg-gray-50 text-gray-600 border border-gray-200';
    }
  };

  // Custom Card Component matching the app's native layout
  const MetricCard = ({ title, value, subtitle, icon: Icon, color, delay }: any) => (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4 transition-all duration-500 ${isAnimating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className={`p-3.5 rounded-xl ${color.bg}`}>
        <Icon className={`w-6 h-6 ${color.text}`} />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-0.5">{title}</p>
        <div className="flex items-baseline gap-2">
          {loading ? (
             <div className="h-7 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
          ) : (
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white leading-none">{value}</h3>
          )}
          {!loading && <span className="text-sm font-medium text-gray-500 dark:text-gray-400">({subtitle})</span>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">System Health</h1>
            <div className="relative">
              <button 
                onClick={() => setShowStatusDetails(!showStatusDetails)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer hover:shadow-sm transition-all ${getBadgeColor(summary.accountStatus)}`}
              >
                {summary.accountStatus === 'good' && <ShieldCheck className="w-3.5 h-3.5" />}
                {summary.accountStatus === 'warning' && <AlertTriangle className="w-3.5 h-3.5" />}
                {summary.accountStatus === 'critical' && <XCircle className="w-3.5 h-3.5" />}
                {summary.accountStatus}
                <Info className="w-3.5 h-3.5 ml-0.5 opacity-70" />
              </button>

              {showStatusDetails && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-gray-100 dark:border-gray-700 p-5 z-50 animate-in fade-in zoom-in-95 duration-200">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    {summary.accountStatus === 'warning' ? <AlertTriangle className="w-4 h-4 text-amber-500" /> : <ShieldCheck className="w-4 h-4 text-emerald-500" />}
                    Status: {summary.accountStatus.toUpperCase()}
                  </h4>
                  {summary.accountStatus === 'warning' && (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong className="text-gray-900 dark:text-white">Issue:</strong> Your "Stuck at Sent" rate is approaching 5%.
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong className="text-gray-900 dark:text-white">Risk:</strong> WhatsApp's automated systems detect high volumes of unread/stuck messages as spamming behavior. This can lead to a permanent ban of your sender number.
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong className="text-gray-900 dark:text-white">Action Required:</strong> Review the At-Risk Contacts table below and click "Force Opt-Out" to prevent future campaigns from sending to dead numbers.
                      </p>
                    </div>
                  )}
                  {summary.accountStatus === 'good' && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">All metrics are healthy! Your sender reputation is strong and there are no immediate risks.</p>
                  )}
                  <button 
                    onClick={() => setShowStatusDetails(false)} 
                    className="mt-4 w-full py-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Real-time monitoring of your WhatsApp sender reputation
          </p>
        </div>

        {/* Time Filter */}
        <div className="flex items-center gap-2">
          {timeRange === 'custom' && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          )}
          <div className="flex items-center bg-gray-100/80 dark:bg-gray-800/80 p-1 rounded-xl">
            {(['24h', '7d', '30d', 'custom'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  timeRange === range 
                    ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                }`}
              >
                {range === '24h' ? '24 Hours' : range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : 'Custom Date'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Delivery Rate" 
          value={`${(summary.deliveryRate * 100).toFixed(1)}%`}
          subtitle={`${summary.rawCounts.delivered.toLocaleString()} msgs`}
          icon={ShieldCheck}
          delay={0}
          color={{ bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-500' }}
        />
        <MetricCard 
          title="Read Rate" 
          value={`${(summary.readRate * 100).toFixed(1)}%`}
          subtitle={`${summary.rawCounts.read.toLocaleString()} msgs`}
          icon={MessageSquare}
          delay={100}
          color={{ bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-500' }}
        />
        <MetricCard 
          title="Reply Rate" 
          value={`${(summary.replyRate * 100).toFixed(1)}%`}
          subtitle="per msg"
          icon={TrendingUp}
          delay={200}
          color={{ bg: 'bg-purple-50 dark:bg-purple-500/10', text: 'text-purple-500' }}
        />
        <MetricCard 
          title="Stuck (>24h)" 
          value={`${(summary.stuckRate * 100).toFixed(1)}%`}
          subtitle={`${summary.rawCounts.stuck.toLocaleString()} at risk`}
          icon={AlertCircle}
          delay={300}
          color={{ bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-500' }}
        />
      </div>

      {/* Main Chart Area */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 transition-colors">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Message Funnel Trends</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track your delivery and read performance over {timeRange === '24h' ? 'the last 24 hours' : timeRange === '7d' ? 'the last 7 days' : 'the last 30 days'}.</p>
          </div>
        </div>
        
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9ca3af" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#9ca3af" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorDelivered" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorRead" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" className="dark:opacity-10" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#9ca3af', fontSize: 12 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#9ca3af', fontSize: 12 }} 
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', backgroundColor: 'var(--color-bg-white, #fff)', color: '#111827' }}
                cursor={{ stroke: '#e5e7eb', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
              <Area type="monotone" dataKey="Sent" stroke="#9ca3af" strokeWidth={2} fillOpacity={1} fill="url(#colorSent)" />
              <Area type="monotone" dataKey="Delivered" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorDelivered)" />
              <Area type="monotone" dataKey="Read" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRead)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Actionable Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden transition-colors">
        <div className="px-6 py-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">At-Risk Contacts</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Contacts stuck at "Sent". Marking cold contacts as opted-out protects your reputation.</p>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-500/10 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
          </div>
        </div>
        
        {stuckContacts.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 dark:border-emerald-500/20">
              <ShieldCheck className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Clean Funnel</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">No contacts are currently stuck in the selected period. Your message delivery pipeline is perfectly healthy.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
              <thead className="bg-gray-50/50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact Details</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Interaction</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stuck Duration</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Recommended Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {paginatedContacts.map((contact) => (
                  <tr key={contact.chatId} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold border border-blue-100 dark:border-blue-500/20 shrink-0">
                          {contact.contactName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">{contact.contactName}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 font-mono text-xs">{contact.chatId.split('@')[0]}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-200 max-w-[250px] truncate">{contact.messageContent}</div>
                      <div className="flex items-center gap-1.5 text-xs text-rose-500 dark:text-rose-400 mt-1.5 font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400" />
                        Sent but not Delivered
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20 whitespace-nowrap">
                        {formatDuration(contact.stuckSinceHours)}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-3 transition-opacity">
                        <button
                          onClick={() => handleAction(contact.chatId, 'ignore')}
                          className="px-3 py-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                          Ignore
                        </button>
                        <button
                          onClick={() => handleAction(contact.chatId, 'opt-out')}
                          disabled={contact.optedOut}
                          className={`px-4 py-1.5 text-sm font-medium rounded-lg shadow-sm transition-all whitespace-nowrap ${
                            contact.optedOut 
                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed border-transparent' 
                              : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-500 dark:hover:text-white border border-rose-100 dark:border-rose-500/20 hover:border-transparent dark:hover:border-transparent'
                          }`}
                        >
                          {contact.optedOut ? 'Opted Out' : 'Force Opt-Out'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <Pagination
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
          totalItems={stuckContacts.length}
        />
      </div>

    </div>
  );
}
