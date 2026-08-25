import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import { AddSessionModal } from '../Dashboard/WhatsappConnect';

interface PaymentRecord {
  id: string;
  amount: number;
  planType: string;
  status: string;
  createdAt: string;
  razorpayOrderId: string;
  paymentMethod?: string;
}

export default function SettingsBilling() {
  const { user } = useUser();
  const [history, setHistory] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    fetchHistory();
    const params = new URLSearchParams(window.location.search);
    const plan = params.get('plan');
    if (plan === 'yearly' || plan === 'monthly') {
      setShowPaymentModal(true);
      // Clean up the URL so it doesn't reopen on refresh
      window.history.replaceState({}, document.title, window.location.pathname + "?tab=billing");
    }
  }, []);

  const fetchHistory = async () => {
    try {
      const token = sessionStorage.getItem('crm_token');
      const res = await fetch('/openwa-api/payment/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async (id: string) => {
    try {
      const token = sessionStorage.getItem('crm_token');
      const res = await fetch(`/openwa-api/payment/receipt/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt_${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        alert("Failed to download receipt");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to download receipt");
    }
  };

  const daysLeft = user?.subscriptionStatus === 'active' && user.subscriptionExpiresAt
    ? Math.max(0, Math.floor((new Date(user.subscriptionExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const isNewUser = !user?.subscriptionStatus || user?.subscriptionStatus === 'none' || user?.subscriptionStatus === 'pending';

  return (
    <div className="space-y-6">


      {/* Current Plan Summary */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex-1 w-full">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white uppercase mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
            {isNewUser ? 'Free Trial Available' :
             user?.subscriptionStatus === 'trial' ? '24-Hour Free Trial' : 
             user?.planType === 'yearly' ? 'Yearly Plan' : 
             user?.planType === 'monthly' ? 'Monthly Plan' : 'Free Trial Expired'}
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400 block mb-1.5 text-xs font-medium uppercase tracking-wider">Price</span>
              <span className="font-bold text-gray-900 dark:text-white text-base">
                {user?.planType === 'yearly' ? '₹1,499/year' : user?.planType === 'monthly' ? '₹249/month' : 'Free'}
              </span>
            </div>
            
            <div>
              <span className="text-gray-500 dark:text-gray-400 block mb-1.5 text-xs font-medium uppercase tracking-wider">Status</span>
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${isNewUser ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' : user?.subscriptionStatus === 'active' || user?.subscriptionStatus === 'trial' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                {isNewUser ? 'Not Started' : user?.subscriptionStatus === 'active' ? 'Active' : user?.subscriptionStatus === 'trial' ? 'Active Trial' : 'Expired'}
              </span>
            </div>

            <div>
              <span className="text-gray-500 dark:text-gray-400 block mb-1.5 text-xs font-medium uppercase tracking-wider">Renewal Date</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {isNewUser ? (
                  <span className="text-gray-500">-</span>
                ) : user?.subscriptionStatus === 'active' || user?.subscriptionStatus === 'trial' ? (
                  <>{user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : new Date(user.trialExpiresAt!).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} <span className="text-brand-500 ml-1">({daysLeft} days left)</span></>
                ) : (
                  <span className="text-red-500">Subscription Ended</span>
                )}
              </span>
            </div>

            <div>
              <span className="text-gray-500 dark:text-gray-400 block mb-1.5 text-xs font-medium uppercase tracking-wider">Payment Method</span>
              <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                {isNewUser ? (
                  <span className="text-gray-500">-</span>
                ) : (
                  <>
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
                    </svg>
                    Razorpay {history.length > 0 && history[0].paymentMethod && history[0].paymentMethod !== 'Unknown' 
                      ? `(${history[0].paymentMethod.charAt(0).toUpperCase() + history[0].paymentMethod.slice(1)})` 
                      : '(Card/UPI/NetBanking)'}
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 min-w-[200px]">
          {isNewUser || user?.subscriptionStatus === 'expired' || user?.subscriptionStatus === 'trial' ? (
            <button onClick={() => setShowPaymentModal(true)} className="w-full rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-600">
              {isNewUser ? 'Purchase Plan' : 'Upgrade Plan'}
            </button>
          ) : daysLeft <= 7 ? (
            <button onClick={() => setShowPaymentModal(true)} className="w-full rounded-lg bg-orange-500 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600">
              Extend Subscription
            </button>
          ) : null}
        </div>
      </div>

      {/* Payment History */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <h3 className="text-base font-bold text-gray-900 dark:text-white font-serif">Billing History</h3>
        </div>
        
        {loading ? (
          <div className="p-10 flex justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="p-10 text-center text-gray-500 dark:text-gray-400">
            No past invoices found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-3 font-semibold">Date & Time</th>
                  <th className="px-6 py-3 font-semibold">Plan</th>
                  <th className="px-6 py-3 font-semibold">Amount</th>
                  <th className="px-6 py-3 font-semibold">Method</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {history.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 text-gray-900 dark:text-white">
                      <div className="font-medium">{new Date(record.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      <div className="text-xs text-gray-500">{new Date(record.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {record.planType === 'yearly' ? 'Yearly Subscription' : 'Monthly Subscription'}
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                      ₹{(record.amount / 100).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 capitalize">
                      {record.paymentMethod || 'Online'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                        {record.status === 'success' ? 'Paid' : record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDownloadReceipt(record.id)}
                        className="text-brand-500 hover:text-brand-600 hover:underline font-medium text-sm inline-flex items-center gap-1.5"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showPaymentModal && (
        <AddSessionModal
          initialStep="expired"
          onClose={() => setShowPaymentModal(false)}
          onAdded={() => {
            setShowPaymentModal(false);
            window.location.reload(); 
          }}
        />
      )}
    </div>
  );
}
