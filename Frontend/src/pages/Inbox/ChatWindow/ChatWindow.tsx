import { useCallback, useEffect, useState } from 'react';
import type { InboxConversation, InboxSSEEvent, SendReplyPayload, InboxMessage } from '../types/inbox.types';
import { useConversation } from '../hooks/useConversation';
import MessageBubble from './MessageBubble';
import DateSeparator, { getDateLabel } from './DateSeparator';
import ReplyArea from '../ReplyArea/ReplyArea';
import ConversationActionMenu from '../ActionMenu/ConversationActionMenu';
import { TemplateViewerModal } from '../components/TemplateViewerModal';
import * as inboxApi from '../services/inbox.api';
import { formatPhoneNumber } from '../../../utils/phone';

interface Props {
  conversation: InboxConversation;
  sessionId: string;
  sseEvent?: InboxSSEEvent | null;
  onConversationUpdate: (id: string, patch: Partial<InboxConversation>) => void;
  onConversationDelete: (id: string) => void;
}

function getInitials(name: string | null, phone: string): string {
  if (name) return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return phone.slice(-2);
}

export default function ChatWindow({
  conversation,
  sessionId,
  sseEvent,
  onConversationUpdate,
  onConversationDelete,
}: Props) {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set());
  const [replyingToMessage, setReplyingToMessage] = useState<InboxMessage | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConvUpdate = useCallback(
    (patch: Partial<InboxConversation>) => onConversationUpdate(conversation.id, patch),
    [conversation.id, onConversationUpdate],
  );

  const {
    messages,
    loading,
    loadingMore,
    sending,
    hasMore,
    bottomRef,
    containerRef,
    loadMore,
    sendReply,
    handleSSEMessage,
  } = useConversation(sessionId, conversation, handleConvUpdate);

  // Forward SSE events to conversation hook — must be in useEffect to avoid infinite re-renders
  useEffect(() => {
    if (sseEvent && sseEvent.conversationId === conversation.id) {
      handleSSEMessage(sseEvent);
    }
  }, [sseEvent]); // eslint-disable-line

  const handleSend = useCallback(
    async (payload: SendReplyPayload) => {
      const finalPayload = replyingToMessage
        ? {
            ...payload,
            // Must use waMessageId (WhatsApp's real message ID) for quoted replies,
            // not the DB UUID which WhatsApp doesn't know about.
            quotedMessageId: replyingToMessage.waMessageId ?? undefined,
            // Store quoted body so the UI can display it locally
            quotedBody: replyingToMessage.body || replyingToMessage.caption || undefined,
          }
        : payload;
      const result = await sendReply(finalPayload);
      setReplyingToMessage(null);
      return result;
    },
    [sendReply, replyingToMessage],
  );

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedMessageIds(new Set());
  };

  const toggleSelectMessage = (id: string) => {
    const next = new Set(selectedMessageIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedMessageIds(next);
  };

  const handleDeleteSelected = async () => {
    if (selectedMessageIds.size === 0) return;
    setIsDeleting(true);
    try {
      await inboxApi.deleteMessages(sessionId, conversation.id, Array.from(selectedMessageIds));
      setSelectionMode(false);
      setSelectedMessageIds(new Set());
    } catch (err) {
      console.error('Failed to delete messages', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteSingle = async (messageId: string) => {
    try {
      await inboxApi.deleteMessages(sessionId, conversation.id, [messageId]);
    } catch (err) {
      console.error('Failed to delete message', err);
    }
  };

  // Group messages by date
  const groups = groupByDate(messages);

  const formattedPhone = formatPhoneNumber(conversation.contactPhone);
  const displayName = conversation.contactName || formattedPhone;

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
      {/* Chat header */}
      {selectionMode ? (
        <div className="flex items-center justify-between px-5 py-4 bg-brand-50 border-b border-brand-100 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={toggleSelectionMode} className="text-brand-600 hover:text-brand-700">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <span className="font-semibold text-brand-900">{selectedMessageIds.size} selected</span>
          </div>
          <button 
            onClick={handleDeleteSelected}
            disabled={selectedMessageIds.size === 0 || isDeleting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-error-600 rounded-md border border-error-200 hover:bg-error-50 disabled:opacity-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            Delete
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between px-5 py-3.5 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative">
              {conversation.profilePicUrl ? (
                <img
                  src={conversation.profilePicUrl}
                  alt={displayName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-sm font-semibold">
                  {getInitials(conversation.contactName, conversation.contactPhone)}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">{displayName}</h3>
                {conversation.isBlocked && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-error-50 dark:bg-error-500/10 text-error-600 dark:text-error-400 rounded-md font-medium">
                    Blocked
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-400 dark:text-gray-500">{formattedPhone}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button 
              onClick={toggleSelectionMode}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors mr-1"
              title="Select Messages"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </button>
            {conversation.tags.length > 0 && (
              <div className="hidden sm:flex items-center gap-1 mr-1">
                {conversation.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10px] font-medium rounded-md">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            <ConversationActionMenu
              conversation={conversation}
              sessionId={sessionId}
              onUpdate={(updated) => onConversationUpdate(updated.id, updated)}
              onDelete={() => onConversationDelete(conversation.id)}
            />
          </div>
        </div>
      )}

      {/* Messages area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto custom-scrollbar py-4"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(99,102,241,0.04) 1px, transparent 0)', backgroundSize: '32px 32px' }}
      >
        {/* Load more button */}
        {hasMore && (
          <div className="flex justify-center mb-3">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-brand-500 bg-white dark:bg-gray-900 border border-brand-200 dark:border-brand-800 rounded-full shadow-sm hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors disabled:opacity-60"
            >
              {loadingMore ? (
                <>
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Loading older messages...
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  Load older messages
                </>
              )}
            </button>
          </div>
        )}

        {loading ? (
          <MessagesSkeleton />
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-gray-900 shadow-sm flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No messages yet</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Send a reply to start the conversation</p>
          </div>
        ) : (
          groups.map(({ label, messages: groupMsgs }) => (
            <div key={label}>
              <DateSeparator label={label} />
              {groupMsgs.map((msg) => (
                <MessageBubble 
                  key={msg.id} 
                  message={msg} 
                  selectionMode={selectionMode}
                  isSelected={selectedMessageIds.has(msg.id)}
                  onToggleSelect={toggleSelectMessage}
                  onReply={(m) => setReplyingToMessage(m)}
                  onDelete={handleDeleteSingle}
                  onViewTemplate={(t) => setViewingTemplate(t)}
                />
              ))}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quoted Message Preview before sending */}
      {replyingToMessage && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-1 h-8 bg-brand-500 rounded-full" />
            <div className="truncate text-sm text-gray-600">
              <span className="font-semibold text-brand-600 mr-2">
                Replying to:
              </span>
              {replyingToMessage.body || replyingToMessage.caption || 'Media message'}
            </div>
          </div>
          <button onClick={() => setReplyingToMessage(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* Reply area */}
      <ReplyArea
        onSend={handleSend}
        sending={sending}
        disabled={conversation.isBlocked || selectionMode}
        contactName={conversation.contactName}
      />

      <TemplateViewerModal
        isOpen={viewingTemplate !== null}
        onClose={() => setViewingTemplate(null)}
        templateName={viewingTemplate || ''}
        sessionId={sessionId}
      />
    </div>
  );
}

function groupByDate(messages: ReturnType<typeof useConversation>['messages']): { label: string; messages: typeof messages }[] {
  const map = new Map<string, typeof messages>();
  for (const msg of messages) {
    const label = getDateLabel(msg.timestamp, msg.createdAt);
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(msg);
  }
  return Array.from(map.entries()).map(([label, msgs]) => ({ label, messages: msgs }));
}

function MessagesSkeleton() {
  return (
    <div className="px-4 space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
          <div className={`max-w-[60%] h-10 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse ${i % 3 === 0 ? 'w-48' : 'w-32'}`} />
        </div>
      ))}
    </div>
  );
}
