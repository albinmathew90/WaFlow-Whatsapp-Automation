// ============================================================
// OpenWA API Service
// Connects to: /openwa-api (proxied via vite.config.ts)
// All calls go through the backend CRM endpoints which are
// JWT-authenticated and user-isolated. The Master API Key is
// NEVER sent from the browser — it lives only in the backend .env
// ============================================================

const BASE_URL = '/openwa-api';  // proxied via vite.config.ts → localhost:2785/api

// ---- Types ----
export type SessionStatus =
  | 'CREATED'
  | 'INITIALIZING'
  | 'STARTING'
  | 'QR_READY'
  | 'AUTHENTICATING'
  | 'AUTHENTICATED'
  | 'READY'
  | 'DISCONNECTED'
  | 'STOPPED'
  | 'FAILED'
  | 'ERROR';

export interface Session {
  id: string;
  name: string;
  status: SessionStatus;
  phone?: string;
  pushName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QRCodeResponse {
  qrCode: string;       // base64 image string
  expiresAt?: string;
}

export interface SessionStats {
  total: number;
  active: number;
  ready: number;
  disconnected: number;
  byStatus: Record<string, number>;
  memoryUsage: { heapUsed: number; heapTotal: number; rss: number };
}

export interface DashboardStatsDto {
  totalMessagesSent: number;
  totalMessagesReceived: number;
  totalContacts: number;
  activeSessions: number;
  trafficData: {
    dates: string[];
    sent: number[];
    received: number[];
  };
  connectionStatus: {
    total: number;
    active: number;
    status: 'HEALTHY' | 'DISCONNECTED' | 'NONE';
  };
  recentActivity: any[];
  deliveredPercent: number;
  readPercent: number;
}

// ---- Helper ----

/**
 * All requests go through this single helper using the user's JWT token.
 * The Master API Key never leaves the backend server.
 */
export async function jwtFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = sessionStorage.getItem('crm_token') || localStorage.getItem('crm_token');
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    let errorMessage = err.message || 'API error';
    if (Array.isArray(errorMessage)) {
      errorMessage = errorMessage.join(', ');
    }
    throw new Error(errorMessage);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ---- Session APIs (user-scoped via JWT) ----

/** List WhatsApp sessions belonging to the current user */
export const getSessions = async (): Promise<Session[]> => {
  const sessions = await jwtFetch<Session[]>('/crm/sessions');
  return (sessions || []).map(s => ({
    ...s,
    status: (s.status || '').toUpperCase() as SessionStatus
  }));
};

/** Get a single session by ID */
export const getSession = async (id: string): Promise<Session> => {
  const s = await jwtFetch<Session>(`/crm/sessions/${id}`);
  if (s) s.status = (s.status || '').toUpperCase() as SessionStatus;
  return s;
};

export const getDashboardStats = async (): Promise<DashboardStatsDto> => {
  return await jwtFetch<DashboardStatsDto>('/crm/dashboard/stats');
};

/** Get overall stats for the current user's sessions */
export const getSessionStats = () =>
  jwtFetch<SessionStats>('/crm/sessions/stats/overview');

/** Create a new WhatsApp session owned by the current user */
export const createSession = async (name: string): Promise<Session> => {
  const s = await jwtFetch<Session>('/crm/sessions', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
  if (s) s.status = (s.status || '').toUpperCase() as SessionStatus;
  return s;
};

/** Start a session (triggers QR generation) */
export const startSession = async (id: string): Promise<Session> => {
  const s = await jwtFetch<Session>(`/crm/sessions/${id}/start`, { method: 'POST' });
  if (s) s.status = (s.status || '').toUpperCase() as SessionStatus;
  return s;
};

/** Stop a session */
export const stopSession = async (id: string): Promise<Session> => {
  const s = await jwtFetch<Session>(`/crm/sessions/${id}/stop`, { method: 'POST' });
  if (s) s.status = (s.status || '').toUpperCase() as SessionStatus;
  return s;
};

/** Delete a session permanently */
export const deleteSession = (id: string) =>
  jwtFetch<void>(`/crm/sessions/${id}`, { method: 'DELETE' });

/** Get QR code image (base64) for scanning */
export const getQRCode = (id: string) =>
  jwtFetch<QRCodeResponse>(`/crm/sessions/${id}/qr`);

/**
 * Send text message — routed through the secure backend.
 * The backend verifies the session belongs to the logged-in user
 * before forwarding to the WhatsApp engine.
 */
export const sendTextMessage = (sessionId: string, chatId: string, text: string) =>
  jwtFetch(`/crm/sessions/${sessionId}/messages/send-text`, {
    method: 'POST',
    body: JSON.stringify({ chatId, text }),
  });

/**
 * Send template message — routed through the secure backend.
 * The backend verifies ownership and uses the engine to send.
 */
export const sendTemplateMessage = (sessionId: string, chatId: string, templateId: string) =>
  jwtFetch(`/crm/sessions/${sessionId}/messages/send-template`, {
    method: 'POST',
    body: JSON.stringify({ chatId, templateId }),
  });

// ---- Monitor APIs (JWT-secured via backend proxy) ----

export interface HealthSummary {
  deliveryRate: number;
  readRate: number;
  stuckRate: number;
  replyRate: number;
  accountStatus: 'good' | 'warning' | 'critical';
  rawCounts: {
    totalOutgoing: number;
    delivered: number;
    read: number;
    stuck: number;
  };
  chartData: Array<{ name: string; Sent: number; Delivered: number; Read: number }>;
}

export interface StuckContact {
  chatId: string;
  contactName: string;
  contactStatus: string;
  lastMessageId: string;
  messageContent: string;
  stuckSinceHours: number;
  optedOut: boolean;
}

export const getHealthSummary = (sessionId: string, timeRange?: string, customDate?: string) => {
  const query = new URLSearchParams();
  if (timeRange) query.append('timeRange', timeRange);
  if (customDate) query.append('customDate', customDate);
  return jwtFetch<HealthSummary>(`/crm/monitor/${sessionId}/summary?${query.toString()}`);
};

export const getStuckContacts = (sessionId: string, timeRange?: string, customDate?: string) => {
  const query = new URLSearchParams();
  if (timeRange) query.append('timeRange', timeRange);
  if (customDate) query.append('customDate', customDate);
  return jwtFetch<StuckContact[]>(`/crm/monitor/${sessionId}/stuck-contacts?${query.toString()}`);
};

export const executeContactAction = (sessionId: string, action: 'opt-out' | 'ignore', chatIds: string[]) =>
  jwtFetch<{ success: boolean }>(`/crm/monitor/${sessionId}/contacts/action`, {
    method: 'POST',
    body: JSON.stringify({ action, chatIds }),
  });

export interface ActivityLog {
  id: string;
  action: string;
  severity: string;
  createdAt: string;
  metadata?: any;
}

export const getActivityLogs = async (limit = 50, offset = 0) => {
  return await jwtFetch<{ data: ActivityLog[]; total: number }>(`/crm/audit/logs?limit=${limit}&offset=${offset}`);
};
