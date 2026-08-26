import { useState, useRef, useEffect } from 'react';
import type { InboxConversation } from '../types/inbox.types';
import * as api from '../services/inbox.api';
import ConfirmDeleteModal from '../../../components/common/ConfirmDeleteModal';

interface Props {
  conversation: InboxConversation;
  sessionId: string;
  onUpdate: (updated: InboxConversation) => void;
  onDelete: () => void;
}

export default function ConversationActionMenu({ conversation, sessionId, onUpdate, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [showTagModal, setShowTagModal] = useState<'add' | 'remove' | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [working, setWorking] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [deleteModalConfig, setDeleteModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    itemName: string;
    onConfirm: () => void;
  } | null>(null);

  // Available tags from backend API
  const [availableTags, setAvailableTags] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const token = (sessionStorage.getItem('crm_token') || localStorage.getItem('crm_token'));
        const res = await fetch('/openwa-api/crm/tags', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAvailableTags(data);
        }
      } catch (e) {
        console.error("Failed to fetch tags", e);
      }
    };
    fetchTags();
  }, []);

  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number } | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleScrollOrResize = () => {
      if (open) setOpen(false);
    };
    if (open) {
      document.addEventListener('mousedown', handler);
      window.addEventListener('scroll', handleScrollOrResize, true);
      window.addEventListener('resize', handleScrollOrResize);
    }
    return () => {
      document.removeEventListener('mousedown', handler);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [open]);

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!open) {
      if (menuRef.current) {
        const rect = menuRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const top = spaceBelow < 280 ? Math.max(10, rect.top - 260) : rect.bottom + 4;
        const right = window.innerWidth - rect.right;
        setDropdownPos({ top, right });
      }
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  const handle = async (action: () => Promise<InboxConversation | void>) => {
    setWorking(true);
    setOpen(false);
    try {
      const result = await action();
      if (result) onUpdate(result);
    } catch (err) {
      console.error(err);
    } finally {
      setWorking(false);
    }
  };

  const handleExport = async () => {
    setOpen(false);
    try {
      const data = await api.exportChat(sessionId, conversation.id);
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-${conversation.contactPhone}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTag = async (tag: string) => {
    if (!tag.trim()) return;
    setShowTagModal(null);
    setTagInput('');
    await handle(() => api.addTag(sessionId, conversation.id, tag.trim()));
  };

  const handleRemoveTag = async (tag: string) => {
    setShowTagModal(null);
    await handle(() => api.removeTag(sessionId, conversation.id, tag));
  };

  const handleDelete = () => {
    setOpen(false);
    setDeleteModalConfig({
      isOpen: true,
      title: 'Delete Conversation',
      itemName: 'this conversation and all its messages',
      onConfirm: async () => {
        setWorking(true);
        try {
          await api.deleteConversation(sessionId, conversation.id);
          onDelete();
        } catch (err) {
          console.error(err);
        } finally {
          setWorking(false);
          setDeleteModalConfig(null);
        }
      }
    });
  };

  return (
    <div className="relative inline-block" ref={menuRef} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={toggleOpen}
        disabled={working}
        className="flex items-center justify-center w-8 h-8 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
        title="Conversation options"
      >
        {working ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
          </svg>
        )}
      </button>

      {open && dropdownPos && (
        <div
          style={{ position: 'fixed', top: dropdownPos.top, right: dropdownPos.right, zIndex: 99999 }}
          className="w-52 bg-white dark:bg-gray-900 rounded-xl shadow-theme-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="py-1">

            <ActionItem
              icon={<ArchiveIcon />}
              label={conversation.isArchived ? 'Unarchive' : 'Archive'}
              onClick={() =>
                handle(() =>
                  conversation.isArchived
                    ? api.updateConversation(sessionId, conversation.id, { isArchived: false, status: 'active' as any })
                    : api.archiveConversation(sessionId, conversation.id)
                )
              }
            />
            <ActionItem
              icon={<ExportIcon />}
              label="Export Chat"
              onClick={handleExport}
            />
            <div className="h-px bg-gray-100 dark:bg-gray-800 my-1" />
            <ActionItem
              icon={<BlockIcon />}
              label={conversation.isBlocked ? 'Unblock Contact' : 'Block Contact'}
              onClick={() =>
                handle(() =>
                  conversation.isBlocked
                    ? api.updateConversation(sessionId, conversation.id, { isBlocked: false })
                    : api.blockContact(sessionId, conversation.id)
                )
              }
              danger={!conversation.isBlocked}
            />
            <ActionItem
              icon={<DeleteIcon />}
              label="Delete Conversation"
              onClick={handleDelete}
              danger
            />
          </div>
        </div>
      )}

      {/* Add Tag Modal */}
      {showTagModal === 'add' && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-5">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Add Tag</h3>
            {availableTags.length > 0 ? (
              <div className="space-y-1 mb-4 max-h-40 overflow-y-auto custom-scrollbar">
                {availableTags
                  .filter((t) => !conversation.tags.includes(t.name))
                  .map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleAddTag(t.name)}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-brand-500/10 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                    >
                      #{t.name}
                    </button>
                  ))}
              </div>
            ) : null}
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag(tagInput)}
                placeholder="Custom tag name..."
                className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
              />
              <button
                onClick={() => handleAddTag(tagInput)}
                className="px-4 py-2 bg-brand-500 text-white text-sm font-medium rounded-xl hover:bg-brand-600 transition-colors"
              >
                Add
              </button>
            </div>
            <button onClick={() => setShowTagModal(null)} className="mt-3 w-full text-center text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Remove Tag Modal */}
      {showTagModal === 'remove' && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-5">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Remove Tag</h3>
            <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
              {conversation.tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleRemoveTag(tag)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-500/10 transition-colors flex items-center justify-between"
                >
                  <span>#{tag}</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ))}
            </div>
            <button onClick={() => setShowTagModal(null)} className="mt-3 w-full text-center text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              Cancel
            </button>
          </div>
        </div>
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
    </div>
  );
}

function ActionItem({ icon, label, onClick, danger = false }: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors text-left
        ${danger
          ? 'text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-500/10'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
    >
      <span className="w-4 h-4 flex-shrink-0">{icon}</span>
      {label}
    </button>
  );
}

const TagIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const TagRemoveIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ReadIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ArchiveIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
  </svg>
);

const ExportIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const BlockIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
  </svg>
);

const DeleteIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
