import { useEffect, useState, useCallback, useRef } from "react";
import { useUser } from "../../context/UserContext";
import PageMeta from "../../components/common/PageMeta";
import ConfirmDeleteModal from "../../components/common/ConfirmDeleteModal";
import {
  getSessions,
  getSessionStats,
  createSession,
  startSession,
  stopSession,
  deleteSession,
  getQRCode,
  Session,
  SessionStats,
} from "../../services/openwa";
import {
  FolderIcon,
  TrashBinIcon,
  CloseIcon,
  MoreDotIcon,
} from "../../icons";

// ---- Types ----
interface Folder {
  id: string;
  name: string;
  sessionIds: string[];
}

// ---- Status Badge ----
const StatusBadge = ({ status }: { status: string }) => {
  const upper = (status || "").toUpperCase();
  const map: Record<string, string> = {
    READY: "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400",
    AUTHENTICATED: "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400",
    AUTHENTICATING: "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400",
    QR_READY: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400",
    STARTING: "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400",
    INITIALIZING: "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400",
    DISCONNECTED: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
    STOPPED: "bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400",
    ERROR: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
    FAILED: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
    CREATED: "bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[upper] ?? map.CREATED}`}>
      {upper}
    </span>
  );
};

// ---- Add Session Modal ----
export const AddSessionModal = ({
  onClose,
  onAdded,
  initialStep,
  initialSessionId,
}: {
  onClose: () => void;
  onAdded: () => void;
  initialStep?: "name" | "qr" | "expired";
  initialSessionId?: string;
}) => {
  const [step, setStep] = useState<"name" | "qr" | "expired">(initialStep || "name");
  const [name, setName] = useState("");
  const [sessionId, setSessionId] = useState(initialSessionId || "");
  const [qrImage, setQrImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [polling, setPolling] = useState(false);
  const [deniedReason, setDeniedReason] = useState(false);
  const [scannedStatus, setScannedStatus] = useState("");
  const [couponCode, setCouponCode] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const session = await createSession(name.trim());
      await startSession(session.id);
      setSessionId(session.id);
      setStep("qr");
    } catch (e: any) {
      if (e.message === 'TRIAL_EXPIRED') {
        setStep("expired");
      } else {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (planType: 'monthly' | 'yearly') => {
    try {
      setLoadingPlan(planType);
      setError("");
      
      const { jwtFetch } = await import("../../services/openwa");
      const response = await jwtFetch<{ id: string; amount: number; currency: string }>(
        '/payment/create-order',
        {
          method: 'POST',
          body: JSON.stringify({ planType, couponCode: couponCode.trim() }),
        }
      );

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_TUmffQnLVo1oIZ',
        amount: response.amount,
        currency: response.currency,
        name: 'WA Flow',
        description: `${planType === 'monthly' ? 'Monthly' : 'Yearly'} Subscription`,
        order_id: response.id,
        handler: async function (paymentResponse: any) {
          try {
            await jwtFetch('/payment/verify', {
              method: 'POST',
              body: JSON.stringify({
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
                planType,
                couponCode: couponCode.trim()
              }),
            });
            if (sessionId) {
              try {
                const { startSession } = await import("../../services/openwa");
                await startSession(sessionId);
                onAddedRef.current();
                setStep("qr");
              } catch (e: any) {
                setError(e.message);
              }
            } else {
              onAddedRef.current();
              onCloseRef.current(); 
            }
          } catch (err: any) {
            setError(err.message);
          }
        },
        theme: {
          color: '#10B981',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (resp: any) {
        setError(resp.error.description);
      });
      rzp.open();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingPlan(null);
    }
  };

  // Use refs so the interval callback always sees the latest callbacks
  const onCloseRef = useRef(onClose);
  const onAddedRef = useRef(onAdded);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => { onAddedRef.current = onAdded; }, [onAdded]);

  // Poll for QR image
  useEffect(() => {
    if (step !== "qr" || !sessionId || qrImage) return;
    
    setPolling(true);
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const { getQRCode } = await import("../../services/openwa");
        const qr = await getQRCode(sessionId);
        if (qr?.qrCode) {
          setQrImage(qr.qrCode);
          clearInterval(interval);
          setPolling(false);
        }
      } catch (err: any) {
        if (err?.message === 'TRIAL_EXPIRED') {
          clearInterval(interval);
          setPolling(false);
          setStep("expired");
        }
      }
      if (attempts > 20) {
        clearInterval(interval);
        setPolling(false);
        setError("QR code timed out. Please try again.");
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [step, sessionId, qrImage]);

  // Poll for authenticated status after QR is shown
  useEffect(() => {
    if (step !== "qr" || !sessionId) return;
    const interval = setInterval(async () => {
      try {
        const { getSessions } = await import("../../services/openwa");
        const sessions = await getSessions();
        const s = sessions.find((sess) => sess.id === sessionId);
        const st = (s?.status || "").toUpperCase();
        console.log("[QR Poll] Session status:", st);
        setScannedStatus(st);
        if (st === "READY") {
          clearInterval(interval);
          onAddedRef.current();
          // Small delay so user sees the "connected" state before modal closes
          setTimeout(() => onCloseRef.current(), 800);
        } else if (st === "DISCONNECTED" || st === "FAILED" || st === "STOPPED") {
          clearInterval(interval);
          setPolling(false);
          setDeniedReason(true);
          setStep("expired");
        }
      } catch {}
    }, 1500);
    return () => clearInterval(interval);
  }, [step, sessionId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-sm border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {step === "name" ? "Add WhatsApp Number" : step === "qr" ? "Scan QR Code" : "Subscription Required"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {step === "name" ? (
          <>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              Give this WhatsApp number a label so you can identify it easily.
            </p>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Session Name / Label
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.replace(/ /g, '_'))}
              placeholder="e.g. Sales India, Support Bot"
              className="mb-4 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            {error && <p className="mb-3 text-xs text-red-500">{error}</p>}
            <button
              onClick={handleCreate}
              disabled={loading || polling || !name.trim()}
              className="w-full rounded-lg bg-brand-500 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-50"
            >
              {loading ? "Creating..." : polling ? "Waiting for QR..." : "Continue"}
            </button>
          </>
        ) : step === "qr" ? (
          <>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              Open WhatsApp on your phone → Linked Devices → Link a Device → Scan this QR code.
            </p>
            <div className="flex justify-center">
              {qrImage ? (
                <img
                  src={qrImage.startsWith("data:") ? qrImage : `data:image/png;base64,${qrImage}`}
                  alt="WhatsApp QR Code"
                  className="h-56 w-56 rounded-xl border border-gray-200 dark:border-gray-700"
                />
              ) : (
                <div className="flex h-56 w-56 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-400">Loading QR...</span>
                </div>
              )}
            </div>
            <p className="mt-4 text-center text-xs text-gray-400">
              {scannedStatus === "AUTHENTICATING"
                ? "✅ Scanned! Authenticating... closing shortly."
                : scannedStatus === "READY" || scannedStatus === "AUTHENTICATED"
                ? "✅ Connected! Closing..."
                : "Waiting for you to scan... This will close automatically."}
            </p>
          </>
        ) : (
          <div className="py-2">
            <div className="mb-6 border-l-4 border-brand-500 pl-4 text-left">
              <h4 className="text-xl font-bold text-gray-900 dark:text-white">Select a Plan</h4>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {deniedReason 
                  ? "This WhatsApp number has already availed the 24-hour free trial previously. Please select a plan to continue."
                  : "Your trial or previous subscription has ended. Choose a plan to continue using all WhatsApp integration features."}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Monthly Plan */}
              <div className="flex flex-col rounded-sm border border-gray-200 bg-gray-50 p-5 text-left transition hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800/50">
                <span className="mb-1 text-xs font-bold text-gray-500 uppercase tracking-wider">Monthly</span>
                <div className="mb-5 flex items-baseline">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">₹249</span>
                  <span className="ml-1 text-sm text-gray-500 font-medium">/mo</span>
                </div>
                <button 
                  onClick={() => handlePayment('monthly')}
                  disabled={!!loadingPlan}
                  className="mt-auto w-full rounded-sm bg-white border border-gray-300 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  {loadingPlan === 'monthly' ? "Processing..." : "Buy Now"}
                </button>
              </div>

              {/* Yearly Plan */}
              <div className="flex flex-col rounded-sm border-2 border-brand-500 bg-white p-5 text-left shadow-sm dark:bg-gray-900">
                <span className="mb-1 text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">Yearly (Save 50%)</span>
                <div className="mb-5 flex items-baseline">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">₹1,499</span>
                  <span className="ml-1 text-sm text-gray-500 font-medium">/yr</span>
                </div>
                <button 
                  onClick={() => handlePayment('yearly')}
                  disabled={!!loadingPlan}
                  className="mt-auto w-full rounded-sm bg-brand-500 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 shadow-sm disabled:opacity-50"
                >
                  {loadingPlan === 'yearly' ? "Processing..." : "Buy Now"}
                </button>
              </div>
            </div>
            
            <div className="mt-5 border-t border-gray-100 pt-5 dark:border-gray-800">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Have a promo code?</label>
              <div className="mt-1.5 flex gap-2">
                <input 
                  type="text" 
                  value={couponCode} 
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter code here" 
                  className="w-full max-w-[200px] px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-sm text-sm focus:outline-none focus:border-brand-500 uppercase"
                />
              </div>
            </div>

            {error && <p className="mt-4 text-left text-sm font-medium text-red-500">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

// ---- Folder Modal ----
const AddFolderModal = ({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (name: string) => void;
}) => {
  const [name, setName] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">New Folder</h3>
          <button onClick={onClose}><CloseIcon className="h-5 w-5 text-gray-400" /></button>
        </div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Folder name"
          className="mb-4 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
        <button
          onClick={() => { if (name.trim()) { onAdd(name.trim()); onClose(); } }}
          className="w-full rounded-lg bg-brand-500 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          disabled={!name.trim()}
        >
          Create Folder
        </button>
      </div>
    </div>
  );
};

// ---- Confirm Toggle Modal ----
const ConfirmToggleModal = ({
  action,
  onConfirm,
  onClose,
}: {
  action: "active" | "inactive";
  onConfirm: () => void;
  onClose: () => void;
}) => {
  const label = action === "inactive" ? "Inactive" : "Active";
  const isInactive = action === "inactive";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">{label}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Are you sure you want to set this WhatsApp number as <strong>{label}</strong>?
          </p>
        </div>
        {/* Footer */}
        <div className="flex justify-end px-6 pb-5">
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:opacity-90 ${
              isInactive ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
            }`}
          >
            {isInactive ? "Set Inactive" : "Set Active"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ---- Main Dashboard ----
export default function WhatsappConnect() {
  const { user, loading: userLoading, refetch } = useUser();
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (user?.subscriptionStatus === 'trial' && user?.trialExpiresAt) {
      const expiresAt = new Date(user.trialExpiresAt).getTime();
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const distance = expiresAt - now;
        if (distance < 0) {
          setTimeLeft("Expired");
          clearInterval(interval);
        } else {
          const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [user]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [folders, setFolders] = useState<Folder[]>([
    { id: "home", name: "Home", sessionIds: [] },
    { id: "trash", name: "Trash", sessionIds: [] },
  ]);
  const [activeFolder, setActiveFolder] = useState("home");
  const [showAddSession, setShowAddSession] = useState<{ step: "name" | "expired", sessionId?: string } | null>(null);
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "active" | "inactive">("all");
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [moveFolderMenuId, setMoveFolderMenuId] = useState<string | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<{ id: string; action: "active" | "inactive" } | null>(null);
  
  const [deleteModalConfig, setDeleteModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    itemName: string;
    onConfirm: () => void;
  } | null>(null);

  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActionMenuId(null);
        setMoveFolderMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchData = useCallback(async () => {
    const token = sessionStorage.getItem('crm_token') || localStorage.getItem('crm_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setError("");
      const [sessionsData, statsData] = await Promise.all([
        getSessions(),
        getSessionStats(),
      ]);
      setSessions(sessionsData);
      setStats(statsData);
      window.dispatchEvent(new Event('waflow-sessions-changed'));
    } catch (e: any) {
      const msg = e?.message || '';
      if (msg.includes('401') || msg.includes('Unauthorized') || msg.includes('Not authenticated')) {
        setError("Session expired. Please sign in again.");
      } else {
        setError("Cannot connect to backend API. Make sure it is running on port 2785.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteSession = async (id: string) => {
    try {
      await deleteSession(id);
      // Also remove from all local folders so counts update immediately
      setFolders((prev) =>
        prev.map((f) => ({ ...f, sessionIds: f.sessionIds.filter((sid) => sid !== id) }))
      );
      fetchData();
    } catch (e: any) {
      showToast(e.message);
    }
    setActionMenuId(null);
  };

  const handleStopSession = async (id: string) => {
    try {
      await stopSession(id);
      fetchData();
    } catch (e: any) {
      showToast(e.message);
    }
    setActionMenuId(null);
  };

  const handleStartSession = async (id: string) => {
    try {
      await startSession(id);
      fetchData();
    } catch (e: any) {
      if (e.message === 'TRIAL_EXPIRED') {
        setShowAddSession({ step: "expired", sessionId: id });
      } else {
        showToast(e.message);
      }
    }
    setActionMenuId(null);
  };

  const addFolder = (name: string) => {
    setFolders((prev) => [
      ...prev,
      { id: Date.now().toString(), name, sessionIds: [] },
    ]);
  };

  const moveToFolder = (sessionId: string, folderId: string) => {
    setFolders((prev) =>
      prev.map((f) => ({
        ...f,
        sessionIds: f.id === folderId
          ? [...new Set([...f.sessionIds, sessionId])]
          : f.sessionIds.filter((id) => id !== sessionId),
      }))
    );
    setActionMenuId(null);
  };

  // Filter sessions
  const folderSessionIds = folders.find((f) => f.id === activeFolder)?.sessionIds ?? [];
  const filtered = sessions
    .filter((s) => activeFolder === "home" || folderSessionIds.includes(s.id))
    .filter((s) => {
      if (activeTab === "active") return s.status === "READY" || s.status === "AUTHENTICATED";
      if (activeTab === "inactive") return s.status !== "READY" && s.status !== "AUTHENTICATED";
      return true;
    })
    .filter((s) =>
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.phone && s.phone.includes(search))
    );

  const activeCount = sessions.filter((s) => s.status === "READY" || s.status === "AUTHENTICATED").length;
  const inactiveCount = sessions.length - activeCount;

  return (
    <>
      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 rounded-xl border border-red-200 bg-white px-4 py-3 shadow-xl dark:border-red-500/20 dark:bg-gray-900">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/10">
            <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">{toast}</p>
          <button onClick={() => setToast(null)} className="ml-2 text-gray-400 hover:text-gray-600">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}
      <PageMeta title="WhatsApp Connect" description="Manage your connected WhatsApp numbers" />

      {/* Modals */}
      {showAddSession && (
        <AddSessionModal
          initialStep={showAddSession.step}
          initialSessionId={showAddSession.sessionId}
          onClose={() => {
            setShowAddSession(null);
            fetchData();
            refetch();
          }}
          onAdded={() => {
            setShowAddSession(null);
            fetchData();
            refetch(); // Instantly update User Context (e.g. trial status)
          }}
        />
      )}
      {showAddFolder && (
        <AddFolderModal
          onClose={() => setShowAddFolder(false)}
          onAdd={addFolder}
        />
      )}
      {confirmToggle && (
        <ConfirmToggleModal
          action={confirmToggle.action}
          onConfirm={() => {
            if (confirmToggle.action === "inactive") handleStopSession(confirmToggle.id);
            else handleStartSession(confirmToggle.id);
          }}
          onClose={() => setConfirmToggle(null)}
        />
      )}
      {deleteModalConfig && (
        <ConfirmDeleteModal
          isOpen={deleteModalConfig.isOpen}
          onClose={() => setDeleteModalConfig(null)}
          onConfirm={deleteModalConfig.onConfirm}
          title={deleteModalConfig.title}
          itemName={deleteModalConfig.itemName}
        />
      )}

      {/* Trial Countdown Banner */}
      {user?.subscriptionStatus === 'trial' && timeLeft && timeLeft !== "Expired" && (
        <div className="mb-6 flex items-center justify-between rounded-xl bg-orange-50 px-4 py-3 border border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/20">
          <div className="flex items-center gap-3 text-orange-800 dark:text-orange-400">
            <svg className="h-6 w-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <div>
              <p className="font-bold">Your Free Trial is Active</p>
              <p className="text-sm">Trial ends in: <span className="font-mono bg-orange-200 dark:bg-orange-500/30 px-2 py-0.5 rounded text-orange-900 dark:text-orange-300 ml-1">{timeLeft}</span></p>
            </div>
          </div>
          <button 
            onClick={() => setShowAddSession({ step: "expired" })}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-orange-600"
          >
            Upgrade Plan
          </button>
        </div>
      )}

      {/* Top action bar */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">WhatsApp Connect</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your connected WhatsApp numbers
          </p>
        </div>
        <button
          onClick={() => setShowAddSession({ step: user?.subscriptionStatus === 'expired' ? "expired" : "name" })}
          className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-600"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          Add WhatsApp Number
        </button>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total Sessions", value: stats.total, color: "text-gray-900 dark:text-white" },
            { label: "Active", value: stats.active, color: "text-green-600 dark:text-green-400" },
            { label: "Ready", value: stats.ready, color: "text-amber-600 dark:text-amber-400" },
            { label: "Disconnected", value: stats.disconnected, color: "text-red-500 dark:text-red-400" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
              <p className={`mt-1 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
          ⚠️ {error}
        </div>
      )}

      <div className="flex gap-5">
        {/* LEFT: Folders panel */}
        <div className="w-56 shrink-0">
          <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Folders</span>
              <button
                onClick={() => setShowAddFolder(true)}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500 text-white hover:bg-brand-600"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>
            <div className="p-2">
              {folders.map((folder) => {
                const isCustom = folder.id !== "home" && folder.id !== "trash";
                return (
                  <div key={folder.id} className="group flex items-center">
                    <button
                      onClick={() => setActiveFolder(folder.id)}
                      className={`flex flex-1 items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                        activeFolder === folder.id
                          ? "bg-brand-50 font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                          : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {folder.id === "trash" ? (
                          <TrashBinIcon className="h-4 w-4" />
                        ) : (
                          <FolderIcon className="h-4 w-4" />
                        )}
                        <span>{folder.name}</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {folder.id === "home"
                          ? sessions.length
                          : folder.sessionIds.filter((sid) => sessions.some((s) => s.id === sid)).length}
                      </span>
                    </button>
                    {/* Delete button for custom folders */}
                    {isCustom && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteModalConfig({
                            isOpen: true,
                            title: 'Delete Folder',
                            itemName: folder.name,
                            onConfirm: () => {
                              setFolders(prev => prev.filter(f => f.id !== folder.id));
                              if (activeFolder === folder.id) setActiveFolder("home");
                            }
                          });
                        }}
                        className="ml-auto flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:bg-gray-200 hover:text-red-500 dark:hover:bg-gray-700 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete folder"
                      >
                        <TrashBinIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: Sessions table */}
        <div className="flex-1 rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          {/* Table header */}
          <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
            <div className="flex items-center gap-4 mb-3">
              {(["all", "active", "inactive"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-1.5 text-sm font-medium capitalize transition ${
                    activeTab === tab
                      ? "border-b-2 border-brand-600 text-brand-600 dark:border-brand-500 dark:text-brand-500"
                      : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  {tab}
                  <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs ${
                    activeTab === tab ? "bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400" : "bg-gray-100 text-gray-500 dark:bg-gray-800"
                  }`}>
                    {tab === "all" ? sessions.length : tab === "active" ? activeCount : inactiveCount}
                  </span>
                </button>
              ))}
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search WhatsApp number or name..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Table */}
          <div>
            {loading ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                    <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="ml-auto h-4 w-20 rounded bg-gray-200 dark:bg-gray-700" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center gap-2 text-sm text-gray-400">
                <p>No sessions found.</p>
                <button onClick={() => setShowAddSession({ step: user?.subscriptionStatus === 'expired' ? "expired" : "name" })} className="flex items-center gap-2 text-brand-500 hover:underline">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                  Add a WhatsApp Number
                </button>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/95">
                    <th className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400">Status / Date</th>
                    <th className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400">WhatsApp Number / Name</th>
                    <th className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400">Session Label</th>
                    <th className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400 text-right pr-6">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filtered.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                      <td className="px-5 py-4">
                        <StatusBadge status={session.status} />
                        <p className="mt-1 text-xs text-gray-400">
                          {new Date(session.createdAt).toLocaleString("en-IN", {
                            day: "2-digit", month: "short", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {session.phone ? `+${session.phone}` : "Status unavailable"}
                        </p>
                        <p className="text-xs text-gray-400">{session.pushName ?? "—"}</p>
                      </td>
                      <td className="px-5 py-4 text-gray-600 dark:text-gray-300">{session.name}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="relative inline-block" ref={actionMenuId === session.id ? menuRef : undefined}>
                          <button
                            onClick={(e) => { e.stopPropagation(); setActionMenuId(actionMenuId === session.id ? null : session.id); setMoveFolderMenuId(null); }}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <MoreDotIcon className="h-5 w-5" />
                          </button>
                          {actionMenuId === session.id && (
                            <div className="absolute right-0 bottom-full z-50 mb-1 w-48 overflow-visible rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">

                              {/* --- Move (with folder picker) --- */}
                              <div className="relative">
                                <button
                                  onClick={() => setMoveFolderMenuId(moveFolderMenuId === session.id ? null : session.id)}
                                  className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                                >
                                  <div className="flex items-center gap-3">
                                    <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></svg>
                                    Move
                                  </div>
                                  <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </button>
                                {/* Folder submenu */}
                                {moveFolderMenuId === session.id && (
                                  <div className="absolute right-full top-0 mr-1 w-40 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
                                    {folders.map((folder) => (
                                      <button
                                        key={folder.id}
                                        onClick={() => { moveToFolder(session.id, folder.id); setActionMenuId(null); setMoveFolderMenuId(null); }}
                                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                                      >
                                        <FolderIcon className="h-3.5 w-3.5 text-gray-400" />
                                        {folder.name}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* --- Active / Inactive toggle (always visible) --- */}
                              <button
                                onClick={() => {
                                  const isActive = session.status === "READY" || session.status === "AUTHENTICATED" || session.status === "STARTING" || session.status === "QR_READY";
                                  setActionMenuId(null);
                                  setConfirmToggle({ id: session.id, action: isActive ? "inactive" : "active" });
                                }}
                                className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                              >
                                <div className="flex items-center gap-3">
                                  <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                  {(session.status === "READY" || session.status === "AUTHENTICATED" || session.status === "STARTING" || session.status === "QR_READY") ? "Set Inactive" : "Set Active"}
                                </div>
                                {/* Toggle pill */}
                                <div className={`relative h-5 w-9 rounded-full transition-colors ${
                                  (session.status === "READY" || session.status === "AUTHENTICATED" || session.status === "STARTING" || session.status === "QR_READY")
                                    ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
                                }`}>
                                  <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                                    (session.status === "READY" || session.status === "AUTHENTICATED" || session.status === "STARTING" || session.status === "QR_READY")
                                      ? "translate-x-4" : "translate-x-0"
                                  }`} />
                                </div>
                              </button>

                              {/* --- Divider + Delete --- */}
                              <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
                              <button
                                onClick={() => setDeleteModalConfig({
                                  isOpen: true,
                                  title: 'Delete WhatsApp Session',
                                  itemName: session.name,
                                  onConfirm: () => handleDeleteSession(session.id)
                                })}
                                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                              >
                                <TrashBinIcon className="h-4 w-4" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
