import { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import { useUser } from '../../../../context/UserContext';
import { ApexOptions } from 'apexcharts';

interface DashboardTabProps {
  appId: string;
}

export default function DashboardTab({ appId }: DashboardTabProps) {
  const token = (sessionStorage.getItem('crm_token') || localStorage.getItem('crm_token'));
  const [summary, setSummary] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [appId]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [summaryRes, chartRes] = await Promise.all([
        fetch(`/openwa-api/otp-management/analytics/${appId}/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/openwa-api/otp-management/analytics/${appId}/charts`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (summaryRes.ok && chartRes.ok) {
        setSummary(await summaryRes.json());
        setChartData(await chartRes.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="py-8 text-center text-gray-500">Loading dashboard...</div>;
  }

  if (!summary) {
    return <div className="py-8 text-center text-red-500">Failed to load dashboard data.</div>;
  }

  const chartOptions: ApexOptions = {
    chart: {
      type: 'area',
      fontFamily: 'inherit',
      toolbar: { show: false },
    },
    colors: ['#059669', '#10b981', '#ef4444'], // requests, verified, failed
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    xaxis: {
      categories: chartData.map(d => d.date),
      labels: { style: { colors: '#9ca3af' } }
    },
    yaxis: {
      labels: { style: { colors: '#9ca3af' } }
    },
    grid: { borderColor: '#e5e7eb', strokeDashArray: 4 },
    legend: { position: 'top' },
    tooltip: { theme: 'light' }
  };

  const series = [
    { name: 'Total Requests', data: chartData.map(d => d.requests) },
    { name: 'Verified', data: chartData.map(d => d.verified) },
    { name: 'Failed', data: chartData.map(d => d.failed) },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total OTP Requests</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{summary.totalRequests}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Successful Verifications</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{summary.verified}</p>
          <p className="text-sm text-gray-500 mt-1">{summary.verificationRate}% success rate</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Delivery Success</p>
          <p className="text-3xl font-bold text-brand-600 mt-2">{summary.delivered}</p>
          <p className="text-sm text-gray-500 mt-1">{summary.deliveryRate}% delivered</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Failed / Expired</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{summary.failed + summary.expired}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Traffic Overview (Last 30 Days)</h3>
        {chartData.length > 0 ? (
          <div className="h-80">
            <Chart options={chartOptions} series={series} type="area" height="100%" />
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center text-gray-400">
            No analytics data available yet.
          </div>
        )}
      </div>
    </div>
  );
}

