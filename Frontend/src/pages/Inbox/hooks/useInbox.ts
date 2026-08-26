import { useState, useEffect, useCallback, useRef } from 'react';
import type { InboxConversation, InboxFilter, InboxSSEEvent } from '../types/inbox.types';
import * as api from '../services/inbox.api';
import { emitGlobalNotification } from '../../../components/header/NotificationDropdown';

const SSE_URL = '/openwa-api/crm/inbox/events';
const POLL_INTERVAL = 8000; // 8s fallback polling
const INITIAL_LOAD = 40;

function matchesFilter(conv: InboxConversation, currentFilter: InboxFilter): boolean {
  if (currentFilter === 'archived') {
    return conv.isArchived === true;
  }
  // For all other tabs, archived conversations must NEVER appear
  if (conv.isArchived === true) {
    return false;
  }
  if (currentFilter === 'unread') {
    return (conv.unreadCount ?? 0) > 0;
  }
  if (currentFilter === 'replied') {
    return conv.status === 'replied';
  }
  if (currentFilter === 'not_replied') {
    return conv.status === 'not_replied';
  }
  if (currentFilter === 'interested') {
    return conv.status === 'interested';
  }
  if (currentFilter === 'follow_up') {
    return conv.status === 'follow_up';
  }
  if (currentFilter === 'closed') {
    return conv.status === 'closed';
  }
  if (currentFilter === 'tagged') {
    return (conv.tags?.length ?? 0) > 0;
  }
  return true;
}

export function useInbox(sessionId: string | null) {
  const [conversations, setConversations] = useState<InboxConversation[]>([]);
  const [total, setTotal] = useState(0);
  const [archivedCount, setArchivedCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<InboxFilter>('all');
  const [search, setSearch] = useState('');
  const [sseConnected, setSseConnected] = useState(false);
  const [lastSSEEvent, setLastSSEEvent] = useState<InboxSSEEvent | null>(null);

  const sseRef = useRef<EventSource | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs to eliminate stale closures in timer/polling/SSE callbacks
  const filterRef = useRef<InboxFilter>(filter);
  const searchRef = useRef<string>(search);
  const sessionIdRef = useRef<string | null>(sessionId);
  const conversationsRef = useRef<InboxConversation[]>(conversations);
  const fetchConversationsRef = useRef<((silent?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    filterRef.current = filter;
    searchRef.current = search;
    sessionIdRef.current = sessionId;
  }, [filter, search, sessionId]);

  // ─── Fetch conversations ─────────────────────────────────────────────

  const fetchConversations = useCallback(
    async (silent = false) => {
      const sid = sessionIdRef.current;
      const currentFilter = filterRef.current;
      const currentSearch = searchRef.current;
      if (!sid) return;
      if (!silent) setLoading(true);
      setError(null);
      try {
        const [data, archData] = await Promise.all([
          api.getConversations(sid, {
            filter: currentFilter,
            search: currentSearch || undefined,
            limit: INITIAL_LOAD,
          }),
          currentFilter !== 'archived'
            ? api.getConversations(sid, { filter: 'archived', limit: 1 }).catch(() => ({ total: 0 }))
            : Promise.resolve({ total: 0 }),
        ]);
        setConversations(data.conversations);
        setTotal(data.total);
        if (currentFilter !== 'archived') {
          setArchivedCount(archData.total);
        } else {
          setArchivedCount(data.total);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load conversations');
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchConversationsRef.current = fetchConversations;
  }, [fetchConversations]);

  // ─── SSE real-time updates ───────────────────────────────────────────

  const setupSSE = useCallback(() => {
    const sid = sessionIdRef.current;
    if (!sid) return;

    // Close existing
    sseRef.current?.close();

    const token = sessionStorage.getItem('crm_token') || localStorage.getItem('crm_token');
    const url = `${SSE_URL}?sessionId=${encodeURIComponent(sid)}&token=${token}`;
    let es: EventSource;
    try {
      es = new EventSource(url);
    } catch {
      // SSE not supported — fall back to polling
      return;
    }

    sseRef.current = es;

    es.onopen = () => {
      setSseConnected(true);
      // Clear polling if SSE connects successfully
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };

    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as InboxSSEEvent;
        setLastSSEEvent(payload);
        handleSSEEvent(payload);
      } catch {
        // Malformed event — ignore
      }
    };

    es.onerror = () => {
      setSseConnected(false);
      es.close();
      sseRef.current = null;
      // Start polling as fallback using ref so it ALWAYS uses latest filter and search
      if (!pollRef.current) {
        pollRef.current = setInterval(() => {
          fetchConversationsRef.current?.(true);
        }, POLL_INTERVAL);
      }
      // Reconnect SSE after 5s
      setTimeout(() => {
        if (sessionIdRef.current) setupSSE();
      }, 5000);
    };
  }, []); // eslint-disable-line

  const handleSSEEvent = useCallback((event: InboxSSEEvent) => {
    if (event.type === 'conversation_created') {
      const newConv = event.data as InboxConversation;
      setConversations((prev) => {
        const exists = prev.find((c) => c.id === newConv.id);
        if (exists) return prev;
        const updated = [newConv, ...prev];
        return updated.filter((c) => matchesFilter(c, filterRef.current));
      });
    } else if (event.type === 'conversation_updated') {
      const updatedData = event.data as InboxConversation;
      setConversations((prev) =>
        prev
          .map((c) => (c.id === event.conversationId ? { ...c, ...updatedData } : c))
          .filter((c) => matchesFilter(c, filterRef.current)),
      );
    } else if (event.type === 'message_received' || event.type === 'message_sent') {
      // A new incoming or outgoing message arrived — update the conversation's preview & unread count
      const payload = event.data as { message?: unknown; conversation?: InboxConversation };
      if (payload.conversation) {
        setConversations((prev) =>
          prev
            .map((c) =>
              c.id === event.conversationId ? { ...c, ...payload.conversation } : c,
            )
            .filter((c) => matchesFilter(c, filterRef.current))
            .sort(
              (a, b) =>
                new Date(b.lastMessageAt ?? 0).getTime() -
                new Date(a.lastMessageAt ?? 0).getTime(),
            ),
        );

        // Trigger in-app toast + bell badge via global bridge
        // Only for truly incoming messages (not our own outgoing ones)
        if (event.type === 'message_received') {
          const conv = payload.conversation as InboxConversation;
          const msgPayload = payload.message as any;
          emitGlobalNotification({
            id: msgPayload?.id ?? event.conversationId + '-' + Date.now(),
            chatName: conv.contactName ?? undefined,
            from: conv.chatId ?? '',
            body: conv.lastMessageBody || '',
            type: 'text',
            timestamp: msgPayload?.timestamp ?? Math.floor(Date.now() / 1000),
          });
          // Also fire OS notification
          showBrowserNotification(conv);
        }
      }
    }
  }, []);

  // ─── Browser notifications ───────────────────────────────────────────

  const showBrowserNotification = (conv: InboxConversation) => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') {
      Notification.requestPermission().catch(() => null);
      return;
    }
    const name = conv.contactName || conv.contactPhone;
    const body = conv.lastMessageBody || 'New message';
    try {
      new Notification(`New message from ${name}`, {
        body,
        icon: conv.profilePicUrl ?? undefined,
        tag: conv.id,
      });
    } catch {
      // Notification may be blocked
    }
  };

  // ─── Effects ─────────────────────────────────────────────────────────

  // Load conversations when filter/search/sessionId changes
  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      fetchConversations();
    }, search ? 300 : 0);
    return () => {
      if (searchDebounce.current) clearTimeout(searchDebounce.current);
    };
  }, [fetchConversations, filter, search, sessionId]);

  // Setup SSE on mount
  useEffect(() => {
    if (!sessionId) return;
    setupSSE();

    return () => {
      sseRef.current?.close();
      sseRef.current = null;
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [sessionId, setupSSE]);

  // ─── Conversation actions ─────────────────────────────────────────────

  const refreshConversation = useCallback(
    async (id: string) => {
      if (!sessionId) return;
      try {
        const updated = await api.getConversation(sessionId, id);
        setConversations((prev) =>
          prev
            .map((c) => (c.id === id ? updated : c))
            .filter((c) => matchesFilter(c, filterRef.current)),
        );
      } catch {
        // Silent failure
      }
    },
    [sessionId],
  );

  const removeConversationLocally = useCallback((id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const updateConversationLocally = useCallback(
    (id: string, patch: Partial<InboxConversation>) => {
      const oldConv = conversationsRef.current.find(c => c.id === id);
      if (oldConv && patch.isArchived !== undefined && patch.isArchived !== oldConv.isArchived) {
        const delta = patch.isArchived ? 1 : -1;
        setArchivedCount((ac) => Math.max(0, ac + delta));
        oldConv.isArchived = patch.isArchived; // Optimistically mutate to prevent double-count from rapid events
      }

      setConversations((prev) => {
        const next = prev.map((c) => (c.id === id ? { ...c, ...patch } : c));
        return next.filter((c) => matchesFilter(c, filterRef.current));
      });
    },
    [],
  );

  return {
    conversations,
    total,
    archivedCount,
    loading,
    error,
    filter,
    setFilter,
    search,
    setSearch,
    sseConnected,
    lastSSEEvent,
    fetchConversations,
    refreshConversation,
    removeConversationLocally,
    updateConversationLocally,
  };
}
