import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface TemplateButton {
  type: 'quick_reply' | 'url' | 'phone' | string;
  text: string;
  value?: string;
}

interface TemplateContent {
  buttons?: TemplateButton[];
  mediaUrl?: string;
}

interface Template {
  name: string;
  body: string;
  header?: string;
  footer?: string;
  type?: string;
  content?: TemplateContent;
  buttons?: TemplateButton[];
  mediaUrl?: string;
}

interface TemplateViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateName: string;
  sessionId: string;
}

export const TemplateViewerModal: React.FC<TemplateViewerModalProps> = ({
  isOpen,
  onClose,
  templateName,
  sessionId,
}) => {
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !templateName) return;
    setTemplate(null);
    setError(null);

    const fetchTemplate = async () => {
      setLoading(true);
      try {
        const token = sessionStorage.getItem('crm_token') || localStorage.getItem('crm_token');

        const res = await fetch(`/openwa-api/crm/templates`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!res.ok) throw new Error('Failed to fetch templates');

        const data = await res.json();
        const found = data?.find((t: Template) => t.name.trim().toLowerCase() === templateName.trim().toLowerCase());

        if (found) {
          setTemplate(found);
        } else {
          setError(`Template "${templateName}" is no longer available. It may have been deleted.`);
        }
      } catch (err) {
        setError('Error fetching template.');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [isOpen, templateName, sessionId]);

  if (!isOpen) return null;

  const buttons: TemplateButton[] = template?.content?.buttons || template?.buttons || [];
  const mediaUrl: string | undefined = template?.content?.mediaUrl || template?.mediaUrl;
  const quickReplies = buttons.filter(b => b.type === 'quick_reply' || !b.value || b.value === b.text);
  const ctaButtons = buttons.filter(b => b.type !== 'quick_reply' && b.value && b.value !== b.text);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">View Template</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <svg className="w-8 h-8 text-brand-500 animate-spin mb-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-gray-500 text-sm">Loading template...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500 text-sm">{error}</div>
          ) : template ? (
            <div className="space-y-3">
              {/* WhatsApp-style bubble */}
              <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                {/* Template name badge */}
                <div className="flex justify-end px-3 pt-2">
                  <span className="text-[10px] px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full font-medium">
                    {template.name}
                  </span>
                </div>

                <div className="px-4 pb-3 space-y-2">
                  {/* Media preview */}
                  {mediaUrl && (
                    <div className="rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center h-32 mb-2">
                      <img
                        src={mediaUrl}
                        alt="Template media"
                        className="max-h-full max-w-full object-cover"
                        onError={e => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Header */}
                  {template.header && (
                    <p className="font-bold text-gray-900 text-sm leading-snug whitespace-pre-wrap">
                      {template.header}
                    </p>
                  )}

                  {/* Body */}
                  <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                    {template.body}
                  </p>

                  {/* Footer */}
                  {template.footer && (
                    <p className="text-xs text-gray-400 whitespace-pre-wrap">{template.footer}</p>
                  )}
                </div>

                {/* CTA buttons */}
                {ctaButtons.length > 0 && (
                  <div className="border-t border-gray-200">
                    {ctaButtons.map((btn, i) => (
                      <div
                        key={i}
                        className="px-4 py-2.5 border-b border-gray-100 last:border-b-0 flex items-center gap-2"
                      >
                        {(btn.type === 'url' || (btn.value && btn.value.startsWith('http'))) && (
                          <svg className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        )}
                        {btn.type === 'phone' && (
                          <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-brand-600 truncate">{btn.text}</p>
                          {btn.value && btn.value !== btn.text && (
                            <p className="text-[10px] text-gray-400 truncate">{btn.value}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick reply buttons */}
                {quickReplies.length > 0 && (
                  <div className="border-t border-gray-200 px-3 py-2 flex flex-wrap gap-1.5">
                    {quickReplies.map((btn, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 text-xs font-medium text-brand-600 bg-brand-50 border border-brand-200 rounded-full"
                      >
                        {btn.text}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
};
