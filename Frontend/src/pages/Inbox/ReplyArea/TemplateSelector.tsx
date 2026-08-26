import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import type { CRMTemplate } from '../types/inbox.types';

interface Props {
  onSelect: (template: CRMTemplate) => void;
  onClose: () => void;
}

export default function TemplateSelector({ onSelect, onClose }: Props) {
  const [search, setSearch] = useState('');
  const [templates, setTemplates] = useState<CRMTemplate[]>([]);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const token = (sessionStorage.getItem('crm_token') || localStorage.getItem('crm_token'));
        const res = await fetch('/openwa-api/crm/templates', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Map to CRMTemplate — include all fields
          setTemplates(data.map((t: any) => ({
            id: t.id,
            name: t.name,
            body: t.body || '',
            header: t.header,
            footer: t.footer,
            category: t.category,
            language: t.language,
            type: t.type,
            content: t.content,
            buttons: t.buttons,
            mediaUrl: t.mediaUrl || t.content?.mediaUrl,
            createdAt: t.createdAt,
          })));
        }
      } catch (e) {
        console.error("Failed to load templates", e);
      }
    };
    fetchTemplates();
  }, []);

  const filtered = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.body.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Use Template</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              autoFocus
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-colors"
            />
          </div>
        </div>

        {/* Template list */}
        <div className="max-h-72 overflow-y-auto custom-scrollbar">
          {templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No templates yet</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">Create templates to reuse them here</p>
              <Link
                to="/templates"
                onClick={onClose}
                className="text-xs text-brand-500 hover:text-brand-600 font-medium"
              >
                Go to Templates →
              </Link>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">No templates match "{search}"</p>
            </div>
          ) : (
            filtered.map((template) => (
              <button
                key={template.id}
                onClick={() => { onSelect(template); onClose(); }}
                className="w-full text-left px-5 py-3.5 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors border-b border-gray-50 dark:border-gray-800 last:border-b-0 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 mb-0.5">
                      {template.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                      {template.body}
                    </p>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-md flex-shrink-0">
                    {template.category || 'General'}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
