import { useState } from 'react';
import type { InboxMessage } from '../types/inbox.types';

interface Props {
  message: InboxMessage;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onReply?: (message: InboxMessage) => void;
  onDelete?: (id: string) => void;
  onViewTemplate?: (templateName: string) => void;
}

function formatTime(timestamp: number | null, createdAt: string): string {
  const date = timestamp ? new Date(timestamp * 1000) : new Date(createdAt);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function DeliveryTick({ status }: { status: InboxMessage['status'] }) {
  if (status === 'pending') {
    return (
      <svg className="w-3.5 h-3.5 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" opacity="0.5" />
      </svg>
    );
  }
  if (status === 'sent') {
    return (
      <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
      </svg>
    );
  }
  if (status === 'delivered') {
    return (
      <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z" />
      </svg>
    );
  }
  if (status === 'read') {
    return (
      <svg className="w-3.5 h-3.5 text-brand-400" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z" />
      </svg>
    );
  }
  if (status === 'failed') {
    return (
      <svg className="w-3.5 h-3.5 text-error-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
      </svg>
    );
  }
  return null;
}

function MediaPreview({ message }: { message: InboxMessage }) {
  const [imgError, setImgError] = useState(false);

  if (message.type === 'image') {
    if (message.mediaUrl && !imgError) {
      return (
        <div className="mb-1 rounded-xl overflow-hidden max-w-[260px]">
          <img
            src={message.mediaUrl}
            alt="Image"
            className="w-full object-cover max-h-[200px]"
            onError={() => setImgError(true)}
          />
        </div>
      );
    }
    return (
      <div className="mb-1 flex items-center gap-2 px-3 py-2 bg-black/10 dark:bg-white/10 rounded-xl">
        <svg className="w-5 h-5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-xs opacity-70">Photo</span>
      </div>
    );
  }

  if (message.type === 'video') {
    return (
      <div className="mb-1 flex items-center gap-2 px-3 py-2 bg-black/10 dark:bg-white/10 rounded-xl">
        <svg className="w-5 h-5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <span className="text-xs opacity-70">Video{message.mediaDuration ? ` (${message.mediaDuration}s)` : ''}</span>
      </div>
    );
  }

  if (message.type === 'audio' || message.type === 'voice') {
    return (
      <div className="mb-1 flex items-center gap-2 px-3 py-2 bg-black/10 dark:bg-white/10 rounded-xl">
        <svg className="w-5 h-5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
        <div className="flex items-center gap-1">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="w-0.5 rounded-full bg-current opacity-50"
              style={{ height: `${8 + Math.random() * 16}px` }}
            />
          ))}
        </div>
        <span className="text-xs opacity-70 ml-1">
          {message.mediaDuration ? `${message.mediaDuration}s` : message.type === 'voice' ? 'Voice' : 'Audio'}
        </span>
      </div>
    );
  }

  if (message.type === 'document') {
    return (
      <div className="mb-1 flex items-center gap-2.5 px-3 py-2.5 bg-black/10 dark:bg-white/10 rounded-xl max-w-[260px]">
        <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium truncate opacity-90">{message.mediaName || 'Document'}</p>
          <p className="text-[10px] opacity-60">{message.mediaMimeType || 'File'}</p>
        </div>
      </div>
    );
  }

  return null;
}

export default function MessageBubble({ 
  message, 
  selectionMode, 
  isSelected, 
  onToggleSelect,
  onReply,
  onDelete,
  onViewTemplate
}: Props) {
  const isOutgoing = message.direction === 'outgoing';
  const time = formatTime(message.timestamp, message.createdAt);
  const isOptimistic = message.isOptimistic;
  const [isHovered, setIsHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const templateMatch = (message.body || message.caption)?.match(/\[Template:\s*(.+?)\]/i);
  const templateName = templateMatch ? templateMatch[1].trim() : null;

  return (
    <div 
      className={`flex mb-1 group px-4 relative items-end ${isOutgoing ? 'justify-end' : 'justify-start'} ${isSelected ? 'bg-brand-50 dark:bg-brand-900/10' : ''} ${selectionMode ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setMenuOpen(false); }}
      onClick={() => {
        if (selectionMode && onToggleSelect) {
          onToggleSelect(message.id);
        }
      }}
    >
      {selectionMode && (
        <div className="absolute left-0 h-full flex items-center pl-2 z-10 pointer-events-none">
          <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${isSelected ? 'bg-brand-500 border-brand-500 text-white' : 'border-gray-300'}`}>
            {isSelected && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
          </div>
        </div>
      )}

      <div
        className={`max-w-[72%] min-w-[80px] rounded-2xl px-3 py-2 shadow-sm relative ${selectionMode ? 'ml-8' : ''}
          ${isOutgoing
            ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-gray-900 dark:text-white rounded-br-sm'
            : 'bg-white dark:bg-[#202c33] text-gray-900 dark:text-white border border-gray-100 dark:border-gray-800 rounded-bl-sm'
          }
          ${isOptimistic ? 'opacity-80' : 'opacity-100'}
        `}
      >
        {/* Dropdown Chevron */}
        {!selectionMode && (isHovered || menuOpen) && (
          <div className="absolute top-1 right-2 z-20">
            <button 
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              className={`p-0.5 rounded-full backdrop-blur-sm ${isOutgoing ? 'bg-black/10 hover:bg-black/20 text-white' : 'bg-gray-100/80 hover:bg-gray-200 text-gray-500'}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            
            {menuOpen && (
              <div className={`absolute top-6 ${isOutgoing ? 'right-0' : 'left-0'} w-36 py-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 z-50 text-sm overflow-hidden animate-in fade-in zoom-in duration-100`}>
                {onReply && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onReply(message); }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-200 flex items-center gap-2"
                  >
                    Reply
                  </button>
                )}
                {onDelete && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(message.id); }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-error-600 dark:text-error-400 flex items-center gap-2"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Eye button — floats to the LEFT of the bubble on hover, for outgoing template messages */}
        {!selectionMode && isHovered && templateName && onViewTemplate && isOutgoing && (
          <div className="absolute right-full mr-2 bottom-1 z-20">
            <button
              onClick={(e) => { e.stopPropagation(); onViewTemplate(templateName); }}
              className="p-1.5 rounded-full bg-white dark:bg-gray-700 shadow border border-gray-100 dark:border-gray-600 text-brand-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/30 transition-all"
              title="View Template"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            </button>
          </div>
        )}

        {message.quotedBody && (
          <div className={`mb-1.5 px-2 py-1.5 rounded-lg text-xs border-l-2 
            ${isOutgoing
              ? 'bg-black/5 dark:bg-white/10 border-brand-500 dark:border-brand-400 text-gray-700 dark:text-gray-300'
              : 'bg-gray-100 dark:bg-gray-700 border-brand-400 text-gray-600 dark:text-gray-400'
            }`}>
            <p className="line-clamp-2">{message.quotedBody}</p>
          </div>
        )}

        {/* Media preview */}
        <MediaPreview message={message} />

        {/* Text body */}
        {(message.body || message.caption) && (
          <div className="flex items-start gap-2">
            <p className="text-sm leading-relaxed break-words text-gray-900 dark:text-white">
              {message.body || message.caption}
            </p>
          </div>
        )}

        {/* Timestamp + delivery tick */}
        <div className={`flex items-center gap-1 mt-1 ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[10px] text-gray-500 dark:text-gray-400">
            {time}
          </span>
          {isOutgoing && <DeliveryTick status={message.status} />}
        </div>

        {/* Failed indicator */}
        {message.status === 'failed' && (
          <p className="text-[10px] text-error-300 mt-0.5">Failed to send</p>
        )}
      </div>
    </div>
  );
}

