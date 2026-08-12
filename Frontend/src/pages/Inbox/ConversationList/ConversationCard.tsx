import type { InboxConversation } from '../types/inbox.types';
import ConversationActionMenu from '../ActionMenu/ConversationActionMenu';
import { formatPhoneNumber } from '../../../utils/phone';

interface Props {
  conversation: InboxConversation;
  isSelected: boolean;
  sessionId?: string | null;
  onClick: () => void;
  onUpdate?: (id: string, patch: Partial<InboxConversation>) => void;
  onDelete?: (id: string) => void;
  isChecked?: boolean;
  onToggleCheck?: (checked: boolean, e: React.MouseEvent) => void;
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getInitials(name: string | null, phone: string): string {
  if (name) {
    return name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }
  return phone.slice(-2);
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300',
  replied: 'bg-success-50 text-success-700 dark:bg-success-500/20 dark:text-success-400',
  not_replied: 'bg-warning-50 text-warning-700 dark:bg-warning-500/20 dark:text-warning-400',
  interested: 'bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300',
  follow_up: 'bg-orange-50 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300',
  closed: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  archived: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  replied: 'Replied',
  not_replied: 'Not Replied',
  interested: 'Interested',
  follow_up: 'Follow-up',
  closed: 'Closed',
  archived: 'Archived',
};

export default function ConversationCard({ conversation, isSelected, sessionId, onClick, onUpdate, onDelete, isChecked, onToggleCheck }: Props) {
  const { contactName, contactPhone, profilePicUrl, lastMessageBody, lastMessageAt,
    unreadCount, status, tags, templateName, lastMessageDirection, isBlocked } = conversation;

  const formattedPhone = formatPhoneNumber(contactPhone);
  const displayName = contactName || formattedPhone;
  const initials = getInitials(contactName, contactPhone);

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      className={`w-full text-left px-4 py-3 transition-colors duration-150 border-b border-gray-100 dark:border-gray-800 group cursor-pointer relative
        ${isSelected
          ? 'bg-brand-50 dark:bg-brand-500/10 border-l-2 border-l-brand-500'
          : 'hover:bg-gray-50 dark:hover:bg-white/[0.03] border-l-2 border-l-transparent'
        }`}
    >
      <div className="flex items-start gap-3">
        {onToggleCheck && (
          <div className="flex-shrink-0 mt-3" onClick={(e) => e.stopPropagation()}>
            <input 
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-brand-600 focus:ring-brand-500 cursor-pointer"
              checked={!!isChecked}
              onChange={(e) => onToggleCheck(e.target.checked, e as any)}
            />
          </div>
        )}
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {profilePicUrl ? (
            <img
              src={profilePicUrl}
              alt={displayName}
              className="w-11 h-11 rounded-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.removeAttribute('style');
              }}
            />
          ) : null}
          <div
            className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-sm font-semibold"
            style={profilePicUrl ? { display: 'none' } : undefined}
          >
            {initials}
          </div>
          {/* Online indicator for unread */}
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-success-500 rounded-full border-2 border-white dark:border-gray-900" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className={`text-sm font-semibold truncate ${isSelected ? 'text-brand-600 dark:text-brand-400' : 'text-gray-900 dark:text-white'}`}>
                {displayName}
              </span>
              {isBlocked && (
                <svg className="w-3 h-3 text-error-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.42 0 8 3.58 8 8 0 1.85-.63 3.55-1.69 4.9z"/>
                </svg>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {unreadCount > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
              <span className="text-[11px] text-gray-400 dark:text-gray-500">
                {formatTime(lastMessageAt)}
              </span>
              {sessionId && onUpdate && onDelete && (
                <div className="ml-0.5 opacity-70 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                  <ConversationActionMenu
                    conversation={conversation}
                    sessionId={sessionId}
                    onUpdate={(updated) => onUpdate(updated.id, updated)}
                    onDelete={() => onDelete(conversation.id)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Phone if different from name */}
          {contactName && (
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-0.5 truncate">{formattedPhone}</p>
          )}

          {/* Last message preview */}
          <div className="flex items-center gap-1 mb-1.5">
            {lastMessageDirection === 'outgoing' && (
              <svg className="w-3 h-3 flex-shrink-0 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate leading-relaxed flex-1">
              {lastMessageBody || 'No messages yet'}
            </p>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {tags.slice(0, 2).map((tag) => (
                <span key={tag} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10px] font-medium rounded-md">
                  #{tag}
                </span>
              ))}
              {tags.length > 2 && (
                <span className="text-[10px] text-gray-400">+{tags.length - 2}</span>
              )}
            </div>
          )}

          {/* Status badge — only show non-active/non-replied */}
          {status !== 'active' && status !== 'replied' && (
            <div className="mt-1">
              <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded-md ${STATUS_COLORS[status] ?? ''}`}>
                {STATUS_LABELS[status] ?? status}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

