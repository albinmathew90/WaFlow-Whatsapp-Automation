import { useState, useRef, useCallback } from 'react';
import type { SendReplyPayload, CRMTemplate } from '../types/inbox.types';
import EmojiPicker from './EmojiPicker';
import TemplateSelector from './TemplateSelector';

interface Props {
  onSend: (payload: SendReplyPayload) => Promise<boolean>;
  sending: boolean;
  disabled?: boolean;
  contactName?: string | null;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip data: prefix
      const base64 = result.split(',')[1] ?? result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getReplyType(file: File): SendReplyPayload['type'] {
  const { type } = file;
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  return 'document';
}

export default function ReplyArea({ onSend, sending, disabled = false, contactName }: Props) {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = useCallback(async () => {
    if ((!text.trim() && !attachedFile) || sending || disabled) return;

    let payload: SendReplyPayload;

    if (attachedFile) {
      const base64 = await fileToBase64(attachedFile);
      const type = getReplyType(attachedFile);
      payload = {
        type,
        text: text.trim() || undefined,
        mediaBase64: base64,
        mediaName: attachedFile.name,
        mimeType: attachedFile.type,
      };
    } else {
      payload = { type: 'text', text: text.trim() };
    }

    const ok = await onSend(payload);
    if (ok) {
      setText('');
      setAttachedFile(null);
    }
  }, [text, attachedFile, sending, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const el = textareaRef.current;
    if (el) {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const newText = text.slice(0, start) + emoji + text.slice(end);
      setText(newText);
      setTimeout(() => {
        el.setSelectionRange(start + emoji.length, start + emoji.length);
        el.focus();
      }, 0);
    } else {
      setText((prev) => prev + emoji);
    }
  };

  const handleTemplateSelect = async (template: CRMTemplate) => {
    // Generate the message text so it can be saved in the database correctly
    // The backend's inbox service saves `dto.text` as the message body.
    // The [Template: name] prefix is required for the UI to show the eye icon.
    const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

    const segments: string[] = [template.header, template.body, template.footer]
      .filter((s): s is string => s != null && s.trim().length > 0)
      .map(s => contactName ? s.replace(/\{\{\s*name\s*\}\}/g, contactName) : s);
    let text = segments.join('\n\n');

    const rawButtons = template.content?.buttons || template.buttons || [];
    if (rawButtons.length > 0) {
      const quickReplies = [];
      const ctaButtons = [];

      for (const btn of rawButtons) {
        const btnText = (btn.text || '').trim();
        let btnVal = (btn.value || '').trim();

        if (btn.type === 'quick_reply' || !btnVal || btnVal === btnText) {
          if (btnText) quickReplies.push({ ...btn, text: btnText });
        } else {
          if (btn.type === 'phone' || (btn.type === 'url' && /^\d{10,15}$/.test(btnVal))) {
            if (!btnVal.startsWith('http')) {
              btnVal = `https://wa.me/${btnVal.replace(/[^0-9]/g, '')}`;
            }
          }
          if (btnText || btnVal) ctaButtons.push({ ...btn, text: btnText, value: btnVal });
        }
      }

      const parts: string[] = [];

      if (ctaButtons.length > 0) {
        const formattedCta = ctaButtons.map(btn => {
          if (btn.type === 'phone' || (btn.value && btn.value.includes('wa.me'))) {
            return `☎️ *${btn.text}:* ${btn.value}`;
          } else if (btn.type === 'url' || (btn.value && btn.value.startsWith('http'))) {
            return `🌐 *${btn.text}:* ${btn.value}`;
          }
          return `🔗 *${btn.text}:* ${btn.value}`;
        }).join('\n\n');
        parts.push(formattedCta);
      }

      if (quickReplies.length > 0) {
        const qrHeader = quickReplies.length === 1 ? '⚡ *QUICK REPLY*' : '⚡ *QUICK REPLIES*';
        const formattedQr = [
          qrHeader,
          '_Reply with an option below:_',
          '',
          ...quickReplies.map((btn, i) => {
            const numIcon = numberEmojis[i] || `${i + 1}.`;
            return `${numIcon}  *[ ${btn.text} ]*`;
          }),
        ].join('\n');
        parts.push(formattedQr);
      }

      if (parts.length > 0) {
        text = `${text}\n\n─────────────────\n${parts.join('\n\n─────────────────\n')}\n─────────────────`;
      }
    }

    const fullText = `[Template: ${template.name}]\n\n${text}`;

    const vars: Record<string, string> = {};
    if (contactName) {
      vars['name'] = contactName;
    }

    await onSend({
      type: 'template',
      templateId: template.id,
      templateName: template.name,
      text: fullText,
      vars
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
    }
    e.target.value = '';
  };

  const canSend = (text.trim() || attachedFile) && !sending && !disabled;

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3">
      {/* Attached file preview */}
      {attachedFile && (
        <div className="mb-2 flex items-center gap-2 px-3 py-2 bg-brand-50 dark:bg-brand-500/10 rounded-xl">
          <svg className="w-4 h-4 text-brand-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          <span className="text-xs text-brand-600 dark:text-brand-400 font-medium truncate flex-1">{attachedFile.name}</span>
          <span className="text-[10px] text-brand-400">
            {(attachedFile.size / 1024).toFixed(0)}KB
          </span>
          <button
            onClick={() => setAttachedFile(null)}
            className="text-brand-400 hover:text-brand-600 dark:hover:text-brand-300 flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Emoji & Attach toolbar */}
        <div className="relative flex items-center gap-1 flex-shrink-0 pb-1">
          {/* Emoji toggle */}
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            disabled={disabled}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            title="Emoji"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {/* Attach file */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            title="Attach file"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,video/*,audio/*,application/*"
            onChange={handleFileChange}
          />

          {/* Template */}
          <button
            onClick={() => setShowTemplate(true)}
            disabled={disabled}
            className="p-2 rounded-xl text-gray-400 hover:text-brand-500 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors disabled:opacity-50"
            title="Use template"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </button>

          {/* Emoji picker popup */}
          {showEmoji && (
            <EmojiPicker
              onSelect={handleEmojiSelect}
              onClose={() => setShowEmoji(false)}
            />
          )}
        </div>

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || sending}
            placeholder={disabled ? 'Select a conversation to reply...' : attachedFile ? 'Add a caption...' : 'Type a message... (Enter to send, Shift+Enter for newline)'}
            rows={1}
            className="w-full px-4 py-3 pr-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-colors resize-none max-h-32 overflow-y-auto custom-scrollbar disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              minHeight: '46px',
              height: 'auto',
            }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
            }}
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          className={`flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 mb-[1px]
            ${canSend
              ? 'bg-brand-500 text-white hover:bg-brand-600 shadow-sm hover:shadow-md active:scale-95'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed'
            }`}
          title="Send message"
        >
          {sending ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          )}
        </button>
      </div>

      {/* Template selector modal */}
      {showTemplate && (
        <TemplateSelector
          onSelect={handleTemplateSelect}
          onClose={() => setShowTemplate(false)}
        />
      )}
    </div>
  );
}
