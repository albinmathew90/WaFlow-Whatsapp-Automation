import { useState, useCallback, useEffect } from 'react';
import PageMeta from '../../components/common/PageMeta';
import { getSessions, Session } from '../../services/openwa';
import { useInbox } from './hooks/useInbox';
import type { InboxConversation, InboxFilter } from './types/inbox.types';
import ConversationList from './ConversationList/ConversationList';
import ChatWindow from './ChatWindow/ChatWindow';
import AddNewContactModal from './AddNewContactModal';
import { Modal } from '../../components/ui/modal';
import * as api from './services/inbox.api';
export default function InboxPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // ─── Load sessions ────────────────────────────────────────────────────

  useEffect(() => {
    getSessions()
      .then((all) => {
        setSessions(all);
        // Auto-select first READY session
        const ready = all.find((s) => s.status === 'READY' || s.status === 'AUTHENTICATED');
        if (ready) setActiveSessionId(ready.id);
        else if (all.length > 0) setActiveSessionId(all[0].id);
      })
      .catch(() => { })
      .finally(() => setSessionsLoading(false));
  }, []);

  // ─── Inbox hook ───────────────────────────────────────────────────────

  const {
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
    removeConversationLocally,
    updateConversationLocally,
  } = useInbox(activeSessionId);

  // ─── Conversation selection & mark as read ────────────────────────────

  const handleSelectConversation = useCallback(
    async (id: string) => {
      setSelectedConvId(id);
      // Mark as read when opening
      if (activeSessionId) {
        try {
          await api.markConversationRead(activeSessionId, id);
          updateConversationLocally(id, { unreadCount: 0 });
        } catch {
          // Non-critical
        }
      }
    },
    [activeSessionId, updateConversationLocally],
  );

  const handleConvUpdate = useCallback(
    (id: string, patch: Partial<InboxConversation>) => {
      updateConversationLocally(id, patch);
    },
    [updateConversationLocally],
  );

  const handleConvDelete = useCallback(
    (id: string) => {
      removeConversationLocally(id);
      if (selectedConvId === id) setSelectedConvId(null);
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    [removeConversationLocally, selectedConvId],
  );

  // ─── Bulk Actions ───────────────────────────────────────────────────────

  const handleToggleCheck = useCallback((id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(conversations.map(c => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  }, [conversations]);

  const handleBulkDelete = useCallback(() => {
    if (!activeSessionId || selectedIds.size === 0) return;
    setIsDeleteDialogOpen(true);
  }, [activeSessionId, selectedIds]);

  const executeBulkDelete = useCallback(async () => {
    setIsDeleteDialogOpen(false);
    if (!activeSessionId || selectedIds.size === 0) return;
    
    for (const id of Array.from(selectedIds)) {
      try {
        await api.deleteConversation(activeSessionId, id);
        removeConversationLocally(id);
        if (selectedConvId === id) setSelectedConvId(null);
      } catch (e) {
        console.error(e);
      }
    }
    setSelectedIds(new Set());
  }, [activeSessionId, selectedIds, removeConversationLocally, selectedConvId]);

  const handleBulkArchive = useCallback(async () => {
    if (!activeSessionId || selectedIds.size === 0) return;
    
    for (const id of Array.from(selectedIds)) {
      try {
        if (filter === 'archived') {
          await api.updateConversation(activeSessionId, id, { isArchived: false, status: 'active' as any });
          updateConversationLocally(id, { isArchived: false, status: 'active' as any });
          if (selectedConvId === id) setSelectedConvId(null);
        } else {
          await api.archiveConversation(activeSessionId, id);
          updateConversationLocally(id, { isArchived: true, status: 'archived' as any });
          if (selectedConvId === id) setSelectedConvId(null);
        }
      } catch (e) {
        console.error(e);
      }
    }
    setSelectedIds(new Set());
    setIsSelectMode(false);
  }, [activeSessionId, selectedIds, filter, removeConversationLocally, updateConversationLocally, selectedConvId]);

  const handleMarkAllRead = useCallback(async () => {
    if (!activeSessionId) return;
    const unread = conversations.filter(c => c.unreadCount > 0);
    if (unread.length === 0) return;
    for (const c of unread) {
      try {
        await api.markConversationRead(activeSessionId, c.id);
        updateConversationLocally(c.id, { unreadCount: 0 });
      } catch (e) {
        console.error(e);
      }
    }
  }, [activeSessionId, conversations, updateConversationLocally]);

  // ─── Derived values ───────────────────────────────────────────────────

  const selectedConversation = selectedConvId
    ? conversations.find((c) => c.id === selectedConvId) ?? null
    : null;

  const readySessions = sessions.filter(
    (s) => s.status === 'READY' || s.status === 'AUTHENTICATED',
  );

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <>
      <PageMeta title="Inbox | Waflow" description="Manage WhatsApp conversations from your marketing campaigns" />

      {/*
        Full-bleed inbox layout: escape AppLayout's padding using negative margins.
        AppLayout adds p-4 (16px) on mobile and md:p-6 (24px) on desktop.
        We subtract those to get edge-to-edge from the content slot.
      */}
      <div className="-mx-4 -my-4 md:-mx-6 md:-my-6 flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>

        {/* Session selector bar — only shows if multiple sessions */}
        {sessions.length > 1 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-1">Session:</span>
            {(readySessions.length === 0 ? sessions : readySessions).map((session: Session) => (
              <button
                key={session.id}
                onClick={() => setActiveSessionId(session.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
                  ${activeSessionId === session.id
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
              >
                {session.name || session.id}
              </button>
            ))}
          </div>
        )}

        {/* Main two-pane layout */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left: Conversation List */}
          <div className="w-80 flex-shrink-0 flex flex-col overflow-hidden border-r border-gray-200 dark:border-gray-800">
            {sessionsLoading ? (
              <div className="flex flex-col items-center justify-center flex-1 gap-3">
                <svg className="w-6 h-6 text-brand-400 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-xs text-gray-400">Loading sessions...</p>
              </div>
            ) : !activeSessionId ? (
              <NoSessionState />
            ) : (
              <ConversationList
                conversations={conversations}
                total={total}
                archivedCount={archivedCount}
                loading={loading}
                error={error}
                filter={filter}
                search={search}
                selectedId={selectedConvId}
                sseConnected={sseConnected}
                onFilterChange={(f: InboxFilter) => {
                  setSelectedIds(new Set());
                  setIsSelectMode(false);
                  setFilter(f);
                }}
                onSearchChange={setSearch}
                onSelectConversation={handleSelectConversation}
                onAddContact={() => setIsAddModalOpen(true)}
                isSelectMode={isSelectMode}
                setIsSelectMode={setIsSelectMode}
                selectedIds={selectedIds}
                onToggleCheck={handleToggleCheck}
                onSelectAll={handleSelectAll}
                onBulkDelete={handleBulkDelete}
                onBulkArchive={handleBulkArchive}
                onMarkAllRead={handleMarkAllRead}
              />
            )}
          </div>

          {/* Right: Chat Window */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {!activeSessionId ? (
              <NoChatSelected message="Connect a WhatsApp session to start using Inbox" />
            ) : selectedConversation ? (
              <ChatWindow
                key={selectedConversation.id}
                conversation={selectedConversation}
                sessionId={activeSessionId}
                sseEvent={lastSSEEvent}
                onConversationUpdate={handleConvUpdate}
                onConversationDelete={handleConvDelete}
              />
            ) : (
              <NoChatSelected message="Select a conversation to chat with..." />
            )}
          </div>
        </div>
      </div>

      {isAddModalOpen && activeSessionId && (
        <AddNewContactModal
          onClose={() => setIsAddModalOpen(false)}
          sessionId={activeSessionId}
          onSuccess={(conv) => {
            setIsAddModalOpen(false);
            setSelectedConvId(conv.id);
          }}
        />
      )}

      {/* Bulk Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        className="w-full max-w-sm p-6"
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center text-red-600 dark:text-red-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              Delete Conversations
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to delete {selectedIds.size} selected conversation(s)? This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={() => setIsDeleteDialogOpen(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={executeBulkDelete}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
          >
            Delete
          </button>
        </div>
      </Modal>
    </>
  );
}

function NoChatSelected({ message }: { message: string }) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950 relative">
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center relative shadow-sm">
          <svg className="w-12 h-12 text-green-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.029 2 11c0 2.87 1.488 5.432 3.82 7.081.258 1.417-.66 3.011-.7 3.078a.498.498 0 00.548.718c2.812-.516 4.672-1.895 5.253-2.355A10.82 10.82 0 0012 20c5.523 0 10-4.029 10-9s-4.477-9-10-9z" />
          </svg>
          <div className="absolute flex gap-1 items-center justify-center -translate-y-1">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse delay-75"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse delay-150"></div>
          </div>
        </div>
        <div className="text-center mt-2">
          <p className="text-xl font-bold text-gray-700 dark:text-gray-300">{getGreeting()}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2 font-medium">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}

function NoSessionState() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-10 text-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-warning-50 dark:bg-warning-500/10 flex items-center justify-center">
        <svg className="w-7 h-7 text-warning-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No WhatsApp session</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Connect a session from the Dashboard first
        </p>
      </div>
    </div>
  );
}
