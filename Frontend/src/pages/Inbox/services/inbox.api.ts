// ============================================================
// Inbox API Service
// All inbox API calls go through here
// ============================================================

import type {
  InboxConversation,
  InboxMessage,
  CreateConversationPayload,
  SendReplyPayload,
  ConversationStatus,
  InboxFilter,
} from '../types/inbox.types';

const BASE_URL = '/openwa-api/crm';
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = sessionStorage.getItem('crm_token') || localStorage.getItem('crm_token');
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((err as { message?: string }).message || 'API error');
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ─── Conversations ───────────────────────────────────────────────────────

export const getConversations = (
  sessionId: string,
  opts?: { filter?: InboxFilter; search?: string; limit?: number; offset?: number },
) => {
  const params = new URLSearchParams({ sessionId });
  if (opts?.filter && opts.filter !== 'all') params.set('filter', opts.filter);
  if (opts?.search) params.set('search', opts.search);
  if (opts?.limit) params.set('limit', String(opts.limit));
  if (opts?.offset) params.set('offset', String(opts.offset));
  return apiFetch<{ conversations: InboxConversation[]; total: number }>(
    `/inbox/conversations?${params}`,
  );
};

export const getConversation = (sessionId: string, id: string) =>
  apiFetch<InboxConversation>(`/inbox/conversations/${id}?sessionId=${sessionId}`);

export const createConversation = (sessionId: string, payload: CreateConversationPayload) =>
  apiFetch<InboxConversation>(`/inbox/conversations?sessionId=${sessionId}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateConversation = (
  sessionId: string,
  id: string,
  patch: Partial<{
    status: ConversationStatus;
    isArchived: boolean;
    isBlocked: boolean;
    tags: string[];
    contactName: string;
    profilePicUrl: string;
    unreadCount: number;
  }>,
) =>
  apiFetch<InboxConversation>(`/inbox/conversations/${id}?sessionId=${sessionId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });

export const deleteConversation = (sessionId: string, id: string) =>
  apiFetch<void>(`/inbox/conversations/${id}?sessionId=${sessionId}`, { method: 'DELETE' });

// ─── Actions ─────────────────────────────────────────────────────────────

export const markConversationRead = (sessionId: string, id: string) =>
  apiFetch<InboxConversation>(`/inbox/conversations/${id}/mark-read?sessionId=${sessionId}`, {
    method: 'POST',
  });

export const archiveConversation = (sessionId: string, id: string) =>
  apiFetch<InboxConversation>(`/inbox/conversations/${id}/archive?sessionId=${sessionId}`, {
    method: 'POST',
  });

export const blockContact = (sessionId: string, id: string) =>
  apiFetch<InboxConversation>(`/inbox/conversations/${id}/block?sessionId=${sessionId}`, {
    method: 'POST',
  });

export const addTag = (sessionId: string, id: string, tag: string) =>
  apiFetch<InboxConversation>(`/inbox/conversations/${id}/tags?sessionId=${sessionId}`, {
    method: 'POST',
    body: JSON.stringify({ tag }),
  });

export const removeTag = (sessionId: string, id: string, tag: string) =>
  apiFetch<InboxConversation>(`/inbox/conversations/${id}/tags?sessionId=${sessionId}`, {
    method: 'DELETE',
    body: JSON.stringify({ tag }),
  });

export const exportChat = (sessionId: string, id: string) =>
  apiFetch<{ conversation: InboxConversation; messages: InboxMessage[] }>(
    `/inbox/conversations/${id}/export?sessionId=${sessionId}`,
  );

// ─── Messages ────────────────────────────────────────────────────────────

export const getMessages = (
  sessionId: string,
  conversationId: string,
  opts?: { limit?: number; offset?: number },
) => {
  const params = new URLSearchParams({ sessionId });
  if (opts?.limit) params.set('limit', String(opts.limit));
  if (opts?.offset) params.set('offset', String(opts.offset));
  return apiFetch<{ messages: InboxMessage[]; total: number }>(
    `/inbox/conversations/${conversationId}/messages?${params}`,
  );
};

export const sendReply = (sessionId: string, conversationId: string, payload: SendReplyPayload) =>
  apiFetch<InboxMessage>(`/inbox/conversations/${conversationId}/reply?sessionId=${sessionId}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const deleteMessages = (sessionId: string, conversationId: string, messageIds: string[]) => {
  const ids = messageIds.join(',');
  return apiFetch<{ deleted: number }>(`/inbox/conversations/${conversationId}/messages?sessionId=${sessionId}&ids=${encodeURIComponent(ids)}`, {
    method: 'DELETE',
  });
};
