import { useState } from 'react';
import type { FlowTrigger } from '../types/flow.types';
import { TemplateSelectorModal } from './NodeBodies';

interface Props {
  trigger: FlowTrigger;
  x: number;
  y: number;
  dragging?: boolean;
  onChange: (trigger: FlowTrigger) => void;
  onStartEdge: (fromId: string, branch?: string, startClientX?: number, startClientY?: number) => void;
  onDragStart: (e: React.MouseEvent) => void;
}

export default function TriggerNode({ trigger, x, y, dragging, onChange, onStartEdge, onDragStart }: Props) {
  const [keywordInput, setKeywordInput] = useState('');
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const addKeyword = (k: string) => {
    const words = k.split(',').map(w => w.trim()).filter(Boolean);
    if (!words.length) return;
    const current = trigger.keywords || [];
    const newKeywords = [...current];
    words.forEach(word => {
      if (!newKeywords.includes(word)) {
        newKeywords.push(word);
      }
    });
    if (newKeywords.length !== current.length) {
      onChange({ ...trigger, keywords: newKeywords });
    }
  };

  const removeKeyword = (idx: number) => {
    const current = trigger.keywords || [];
    onChange({ ...trigger, keywords: current.filter((_, i) => i !== idx) });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addKeyword(keywordInput);
      setKeywordInput('');
    }
  };

  const handleBlur = () => {
    if (keywordInput.trim()) {
      addKeyword(keywordInput);
      setKeywordInput('');
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        zIndex: 15,
      }}
      className="relative w-[320px] rounded-xl bg-white dark:bg-gray-900 border-2 border-blue-400 dark:border-blue-500 shadow-md flex flex-col"
      data-nodeid="trigger_node"
    >
      {/* Header (Drag Handle) */}
      <div 
        className="flex items-center justify-between px-4 py-3 border-b border-blue-100 dark:border-blue-900/30 cursor-grab active:cursor-grabbing select-none"
        onMouseDown={(e) => {
          if ((e.target as HTMLElement).tagName.toLowerCase() !== 'button' && !(e.target as HTMLElement).closest('button')) {
            onDragStart(e);
          }
        }}
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center text-gray-400">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5a2 2 0 100-4 2 2 0 000 4zm0 8a2 2 0 100-4 2 2 0 000 4zm0 8a2 2 0 100-4 2 2 0 000 4zm8-16a2 2 0 100-4 2 2 0 000 4zm0 8a2 2 0 100-4 2 2 0 000 4zm0 8a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
          </div>
          <span className="text-[14px] font-bold text-gray-800 dark:text-gray-100">Trigger</span>
        </div>
        <button
          id="port-trigger_node-output"
          onMouseDown={(e) => {
            e.stopPropagation();
            onStartEdge('trigger_node', undefined, e.clientX, e.clientY);
          }}
          className="absolute right-[-8px] top-[14px] w-4 h-4 rounded-full border-2 bg-white dark:bg-gray-900 hover:scale-125 transition-transform z-20 cursor-pointer shadow-sm border-blue-400"
          title="Drag to connect"
        />
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Trigger Event</label>
          <select
            className="w-full text-[13px] px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 outline-none focus:border-blue-400"
            value={trigger.event}
            onChange={(e) => onChange({ ...trigger, event: e.target.value as any })}
          >
            <option value="keyword">Keyword/Regex Match</option>
            <option value="any">User Starts Conversation</option>
            <option value="template_selected">Template Selected</option>
            <option value="payment_capture">Payment Capture</option>
          </select>
          {trigger.event === 'keyword' && (
            <p className="text-[11px] text-gray-400 mt-1 leading-tight">
              Trigger the flow when a user's message matches any defined keyword or regex pattern.
            </p>
          )}
          {trigger.event === 'any' && (
            <p className="text-[11px] text-gray-400 mt-1 leading-tight">
              Trigger occurs when a user initiates a new conversation.
            </p>
          )}
          {trigger.event === 'template_selected' && (
            <p className="text-[11px] text-gray-400 mt-1 leading-tight">
              Trigger the flow when a user replies via a quick reply button on a sent template.
            </p>
          )}
          {trigger.event === 'payment_capture' && (
            <p className="text-[11px] text-gray-400 mt-1 leading-tight">
              Triggers when a customer's payment is successfully captured.
            </p>
          )}
        </div>

        {trigger.event === 'keyword' && (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Enter Keywords</label>
              <div className="flex flex-wrap gap-1.5 p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 min-h-[42px]">
                {(trigger.keywords || []).map((k, i) => (
                  <div key={i} className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-md">
                    <span className="text-[12px] text-gray-700 dark:text-gray-200">{k}</span>
                    <button
                      onClick={() => removeKeyword(i)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                <input
                  className="flex-1 min-w-[100px] text-[13px] bg-transparent outline-none text-gray-800 dark:text-gray-200 px-1"
                  placeholder={!(trigger.keywords?.length) ? "Type, press enter to add keyword" : ""}
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleBlur}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col">
                  <span className="text-[12px] font-semibold text-gray-700 dark:text-gray-200">Enable case sensitive regex/keywords.</span>
                  <span className="text-[11px] text-gray-400">Enable toggle for case sensitive matching.</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer mt-1 flex-shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={!!trigger.caseSensitive}
                    onChange={(e) => onChange({ ...trigger, caseSensitive: e.target.checked })}
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-500"></div>
                </label>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Enter Regex</label>
                <input
                  className="w-full text-[13px] px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 outline-none focus:border-blue-400"
                  placeholder="Enter a regex pattern..."
                  value={trigger.regex || ''}
                  onChange={(e) => onChange({ ...trigger, regex: e.target.value })}
                />
                <span className="text-[10px] text-gray-400">Enter a regex pattern to match messages. To match all messages, use .* or ^.*$.</span>
              </div>
            </div>


          </>
        )}

        {trigger.event === 'template_selected' && (
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            {!trigger.selectedTemplate ? (
              <div className="flex flex-col gap-2 mt-2">
                <button
                  onMouseDown={(e) => { e.stopPropagation(); setShowTemplateModal(true); }}
                  className="w-full py-2 flex justify-center items-center gap-1.5 text-[13px] font-bold text-blue-600 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>
                  Choose Template
                </button>
                <p className="text-[11px] text-gray-400">Add up to 1 template to begin flow.</p>
              </div>
            ) : (
              <div className="relative bg-[#e0f2fe] dark:bg-sky-900/30 border border-sky-100 dark:border-sky-800 rounded-lg p-3 text-sky-900 dark:text-sky-100 flex flex-col gap-2 mt-2">
                <div className="flex justify-between items-start">
                  <div className="font-bold text-[13px]">{trigger.selectedTemplate.name}</div>
                  <button
                    onMouseDown={(e) => { e.stopPropagation(); onChange({ ...trigger, selectedTemplate: null }); }}
                    className="text-sky-500 hover:text-red-500 transition cursor-pointer"
                    title="Remove template"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
                <div className="text-[12px] whitespace-pre-wrap line-clamp-3">{trigger.selectedTemplate.body}</div>
              </div>
            )}
          </div>
        )}

        {showTemplateModal && (
          <TemplateSelectorModal
            onSelect={(t) => {
              onChange({ ...trigger, selectedTemplate: t });
              setShowTemplateModal(false);
            }}
            onClose={() => setShowTemplateModal(false)}
          />
        )}
      </div>

    </div>
  );
}
