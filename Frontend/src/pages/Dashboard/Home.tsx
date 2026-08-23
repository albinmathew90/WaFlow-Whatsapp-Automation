import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import ReactApexChart from "react-apexcharts";
import { getDashboardStats, DashboardStatsDto } from "../../services/openwa";

export default function Home() {
  const [stats, setStats] = useState<DashboardStatsDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load dashboard stats", err);
        setLoading(false);
      });
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  // --- Chart Configuration ---
  const totalMessagesPerDay = stats.trafficData.sent.map((sent, i) => sent + stats.trafficData.received[i]);
  const hasData = totalMessagesPerDay.some(v => v > 0);
  const peakVolumeDayIndex = hasData ? totalMessagesPerDay.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0) : -1;

  const chartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: "bar",
      toolbar: { show: false },
      fontFamily: "inherit",
    },
    colors: stats.trafficData.sent.map((_, i) => i === peakVolumeDayIndex ? "#22c55e" : "#dcfce7"),
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: "30%",
        distributed: true,
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: any, opt: any) => (opt.dataPointIndex === peakVolumeDayIndex && Number(val) > 0 ? val : ""),
      offsetY: -20,
      style: {
        fontSize: "12px",
        colors: ["#22c55e"],
      },
    },
    legend: { show: false },
    xaxis: {
      categories: stats.trafficData.dates,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          colors: "#9ca3af",
          fontSize: "12px",
        },
      },
    },
    yaxis: { show: false },
    grid: { show: false },
  };

  const chartSeries = [
    {
      name: "Messages",
      data: stats.trafficData.sent.map((sent, i) => sent + stats.trafficData.received[i]),
    },
  ];

  const totalTraffic = stats.totalMessagesSent;
  const deliveredPercent = stats.deliveredPercent || 0;
  const readPercent = stats.readPercent || 0;

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] overflow-hidden">
      <PageMeta title="Dashboard | Waflow" description="Overview of your account" />
      
      {/* Top Row: Metric Cards */}
      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 shrink-0">
        {/* Messages Sent */}
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">Messages Sent</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{stats.totalMessagesSent}</p>
        </div>

        {/* Synced Contacts */}
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">Synced Contacts</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{stats.totalContacts}</p>
        </div>

        {/* Active Sessions */}
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">Active Sessions</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{stats.activeSessions}</p>
        </div>

        {/* Messages Received */}
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">Messages Received</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{stats.totalMessagesReceived}</p>
        </div>
      </div>

      {/* Middle Row: Charts */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3 min-h-0 flex-1">
        {/* Bar Chart */}
        <div className="col-span-1 lg:col-span-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              <h2 className="text-base font-bold text-gray-900 dark:text-white font-serif">Message Volume Analytics</h2>
            </div>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">Weekly Overview</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Daily traffic distribution & response velocity</p>
          <div className="flex-1 min-h-0">
            <ReactApexChart options={chartOptions} series={chartSeries} type="bar" height="100%" />
          </div>
        </div>

        {/* Message Delivery Status */}
        <div className="col-span-1 rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-gray-900 dark:text-white font-serif">Message Delivery Status</h2>
          </div>
          
          <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm font-medium mb-2">
                  <span className="text-gray-700 dark:text-gray-300">Successfully Delivered</span>
                  <span className="text-gray-900 dark:text-white">{deliveredPercent}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${deliveredPercent}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm font-medium mb-2">
                  <span className="text-gray-700 dark:text-gray-300">Read by Recipient</span>
                  <span className="text-gray-900 dark:text-white">{readPercent}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${readPercent}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 shrink-0">
        {/* Recent System Activity */}
        <div className="col-span-1 lg:col-span-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
               <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
               <h2 className="text-base font-bold text-gray-900 dark:text-white font-serif">Recent System Activity</h2>
            </div>
            <Link to="/settings/logs" className="text-[10px] font-bold uppercase tracking-wider text-green-500 hover:text-green-600 transition-colors">View All &rarr;</Link>
          </div>
          
          <div className="space-y-2 overflow-y-auto flex-1 pr-2">
            {stats.recentActivity.slice(0, 5).map((log, i) => (
              <div key={i} className="flex items-center justify-between border-b border-gray-50 pb-1.5 last:border-0 last:pb-0 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">{log.type}</span>
                  <span className="text-[12px] font-medium text-gray-700 dark:text-gray-300">{log.message}</span>
                </div>
                <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="col-span-1 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-base font-bold text-gray-900 dark:text-white font-serif mb-4">Quick Actions</h2>
          
          <div className="grid grid-cols-2 gap-2.5">
            <Link to="/broadcasts" className="flex items-center justify-center gap-1.5 rounded-full bg-green-500 px-2 py-2 text-[11px] font-bold text-white transition hover:bg-green-600 shadow-sm">
              <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              <span className="truncate">Send Broadcast</span>
            </Link>
            <Link to="/chatbot" className="flex items-center justify-center gap-1.5 rounded-full border border-gray-200 bg-white px-2 py-2 text-[11px] font-bold text-gray-700 transition hover:bg-gray-50 hover:text-brand-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
              <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
              <span className="truncate">Edit Chatbot</span>
            </Link>
            <Link to="/templates" className="flex items-center justify-center gap-1.5 rounded-full border border-gray-200 bg-white px-2 py-2 text-[11px] font-bold text-gray-700 transition hover:bg-gray-50 hover:text-brand-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
              <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <span className="truncate">New Template</span>
            </Link>
            <Link to="/inbox" className="flex items-center justify-center gap-1.5 rounded-full border border-gray-200 bg-white px-2 py-2 text-[11px] font-bold text-gray-700 transition hover:bg-gray-50 hover:text-brand-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
              <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              <span className="truncate">Live Inbox</span>
            </Link>
            <Link to="/whatsapp-connect" className="flex items-center justify-center gap-1.5 rounded-full border border-gray-200 bg-white px-2 py-2 text-[11px] font-bold text-gray-700 transition hover:bg-gray-50 hover:text-brand-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
              <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" /></svg>
              <span className="truncate">Status / QR</span>
            </Link>
            <Link to="/settings/media" className="flex items-center justify-center gap-1.5 rounded-full border border-gray-200 bg-white px-2 py-2 text-[11px] font-bold text-gray-700 transition hover:bg-gray-50 hover:text-brand-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
              <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span className="truncate">Media Library</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

