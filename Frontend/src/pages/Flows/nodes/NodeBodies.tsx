import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { FlowNode } from '../types/flow.types';

interface BodyProps {
  id: string;
  node: FlowNode;
  onChange: (patch: Record<string, any>) => void;
  onStartEdge: (fromId: string, branch?: string, startClientX?: number, startClientY?: number) => void;
  color: string;
}

function ButtonConfigModal({ node, onChange, onClose }: { node: FlowNode, onChange: (patch: any) => void, onClose: () => void }) {
  const [btnName, setBtnName] = useState('');
  const [btnType, setBtnType] = useState<'quick_reply' | 'link'>('quick_reply');
  const [btnUrl, setBtnUrl] = useState('');
  const [errorField, setErrorField] = useState<'name' | 'url' | null>(null);
  const [toastMessage, setToastMessage] = useState('');

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl rounded-xl z-50 p-4">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[12px] font-bold px-4 py-2 rounded-lg shadow-lg whitespace-nowrap z-50 animate-bounce">
          {toastMessage}
        </div>
      )}
      
      <div className="text-[14px] font-bold text-gray-800 dark:text-gray-200 dark:text-gray-100 mb-4">Add Button</div>
      
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <input 
            className={`w-full text-[13px] border rounded-lg p-2.5 bg-white dark:bg-gray-900/50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-900 transition ${
              errorField === 'name' ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 dark:border-gray-700 focus:border-brand-500'
            }`}
            placeholder="Button Name"
            value={btnName}
            onChange={e => { setBtnName(e.target.value); setErrorField(null); }}
          />
          <span className="text-[10px] text-gray-400 dark:text-gray-300">Enter button text here, only {(btnName || '').length}/20 characters allowed.</span>
        </div>
        
        <div className="flex flex-col gap-1 relative">
          <span className="absolute -top-2 left-2 bg-white dark:bg-gray-900 px-1 text-[10px] font-bold text-gray-800 dark:text-gray-200 dark:text-gray-300">Button Type</span>
          <select 
            className="w-full text-[13px] border border-gray-800 rounded-lg p-2.5 pt-3 bg-white dark:bg-gray-900/50 focus:bg-white font-medium dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600"
            value={btnType}
            onChange={e => setBtnType(e.target.value as any)}
          >
            <option value="quick_reply">Quick Reply</option>
            <option value="link">Link</option>
          </select>
          <span className="text-[10px] text-gray-400 mt-1 dark:text-gray-300">Select the type of button: Quick Reply (up to 3) or Link (only 1)</span>
        </div>
        
        {btnType === 'link' && (
          <div className="flex flex-col gap-1 relative mt-1">
            <span className="absolute -top-2 left-2 bg-white dark:bg-gray-900 px-1 text-[10px] font-bold text-gray-800 dark:text-gray-200 dark:text-gray-300">Link</span>
            <input 
              className={`w-full text-[13px] border rounded-lg p-2.5 pt-3 bg-white dark:bg-gray-900/50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-900 transition ${
                errorField === 'url' ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-800 focus:border-brand-500'
              }`}
              placeholder="https://example.com"
              value={btnUrl}
              onChange={e => { setBtnUrl(e.target.value); setErrorField(null); }}
            />
            <span className="text-[10px] text-gray-400 mt-1 dark:text-gray-300">Enter a valid URL.</span>
          </div>
        )}
      </div>
      
      <div className="flex justify-end gap-2 mt-5">
        <button 
          onMouseDown={(e) => { e.stopPropagation(); onClose(); }}
          className="px-4 py-1.5 text-[12px] font-bold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200 transition"
        >
          Cancel
        </button>
        <button 
          onMouseDown={(e) => { 
            e.stopPropagation(); 
            if (!btnName.trim()) {
              setErrorField('name');
              setToastMessage('Please enter a button name');
              setTimeout(() => setToastMessage(''), 3000);
              return;
            }
            if (btnType === 'link' && !btnUrl.trim()) {
              setErrorField('url');
              setToastMessage('Please enter a valid URL');
              setTimeout(() => setToastMessage(''), 3000);
              return;
            }
            
            const newBtn = { 
              id: Math.random().toString(36).substr(2, 9), 
              name: btnName, 
              type: btnType,
              ...(btnType === 'link' ? { url: btnUrl } : {})
            };
            onChange({ buttons: [...(node.buttons || []), newBtn] });
            onClose();
          }}
          className="px-5 py-1.5 text-[13px] font-bold bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
        >
          Save
        </button>
      </div>
    </div>
  );
}

export function TextButtonNodeBody({ id, node, onChange, onStartEdge, color }: BodyProps) {
  const [showButtonModal, setShowButtonModal] = useState(false);

  return (
    <div className="px-3 py-1.5 flex flex-col gap-2">
      <div className="relative border border-red-400 dark:border-red-500/40 dark:border-red-500/30 rounded-lg p-2.5 pt-3">
        <span className="absolute -top-2 left-2 bg-white dark:bg-gray-900 px-1 text-[10px] font-bold text-gray-800 dark:text-gray-200 dark:text-gray-300">Enter Message</span>
        <textarea 
          className="w-full text-[12px] text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900/50 focus:bg-white outline-none focus:ring-2 focus:ring-brand-500/50 transition-all resize-none dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600"
          rows={3} 
          value={node.message || ''}
          onChange={(e) => onChange({ message: e.target.value })}
        />
        <div className="text-[10px] text-gray-400 mt-1">Enter message here, {(node.message || '').length}/1024 characters allowed.</div>
        
        {node.buttons && node.buttons.length > 0 && (
          <div className="mt-2 flex flex-col gap-1.5">
            {node.buttons.map((b: any) => (
              <div key={b.id} className="relative group w-full py-1.5 flex justify-center items-center text-[12px] font-bold text-brand-600 bg-brand-50 border border-brand-100 rounded-lg">
                <span>{b.name}</span>
                <button
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    onChange({ buttons: node.buttons.filter((btn: any) => btn.id !== b.id) });
                  }}
                  className="absolute right-2 text-brand-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                  title="Remove button"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <div className="absolute -right-4 top-1/2 -translate-y-1/2 flex items-center justify-center p-1 group-hover:scale-110 transition-transform opacity-0 group-hover:opacity-100 z-10">
                  <div 
                    id={`port-${id}-${b.id}`}
                    onMouseDown={(e) => { e.stopPropagation(); onStartEdge(id, b.id, e.clientX, e.clientY); }}
                    className="w-3.5 h-3.5 rounded-full border-[2.5px] bg-white dark:bg-gray-900 cursor-crosshair hover:bg-brand-50 shadow-sm"
                    style={{ borderColor: '#059669' }}
                    title="Connect Button"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        <button 
          onMouseDown={(e) => { e.stopPropagation(); setShowButtonModal(true); }}
          className="w-full mt-2 py-1.5 flex justify-center items-center gap-1 text-[12px] font-bold text-brand-600 border border-brand-200 rounded-lg hover:bg-brand-50 transition cursor-pointer"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>
          Add Button
        </button>
      </div>

      {showButtonModal && <ButtonConfigModal node={node} onChange={onChange} onClose={() => setShowButtonModal(false)} />}
    </div>
  );
}

export function MediaButtonNodeBody({ id, node, onChange, onStartEdge, color }: BodyProps) {
  const [showButtonModal, setShowButtonModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange({ mediaFile: { name: file.name, type: file.type, url: URL.createObjectURL(file) } });
    }
  };

  const getAcceptList = () => {
    switch (node.mediaType) {
      case 'image': return 'image/*';
      case 'video': return 'video/*';
      case 'document': return '.pdf,.doc,.docx,.txt,.csv';
      default: return 'image/*'; // fallback to image if undefined since it's the default select value
    }
  };

  return (
    <div className="px-3 py-1.5 flex flex-col gap-2">
      <div className="relative border border-red-400 dark:border-red-500/40 dark:border-red-500/30 rounded-lg p-2.5 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Select Media Type</span>
          <select className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white outline-none focus:ring-2 focus:ring-brand-500/50 transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600" value={node.mediaType || 'image'} onChange={(e) => onChange({ mediaType: e.target.value as any })}>
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="document">Document</option>
          </select>
          <span className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">Select media type you want.</span>
        </div>
        
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Enter or Paste URL</span>
          <input className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white outline-none focus:ring-2 focus:ring-brand-500/50 transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600" value={node.mediaUrl || ''} onChange={(e) => onChange({ mediaUrl: e.target.value })} />
          <span className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">Enter media URL here.</span>
        </div>

        {node.mediaFile ? (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800/30">
            <div className="flex items-center gap-2 overflow-hidden">
               <svg className="w-4 h-4 text-brand-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
               </svg>
               <span className="text-[11px] truncate text-gray-700 dark:text-gray-300 dark:text-gray-200 font-medium">{node.mediaFile.name}</span>
            </div>
            <button onMouseDown={() => onChange({ mediaFile: null })} className="p-1 text-gray-400 hover:text-red-500 transition cursor-pointer" title="Remove file">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        ) : (
          <div 
            onClick={() => fileInputRef.current?.click()} 
            className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-4 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-800/30 hover:border-brand-300 transition"
          >
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600" accept={getAcceptList()} />
            <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            <span className="text-[10px] dark:text-gray-300">Drag and Drop file or Browse</span>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Enter Caption</span>
          <input className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white outline-none focus:ring-2 focus:ring-brand-500/50 transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600" value={node.caption || ''} onChange={(e) => onChange({ caption: e.target.value })} />
          <span className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">Enter caption text here.</span>
        </div>

        {node.buttons && node.buttons.length > 0 && (
          <div className="mt-2 flex flex-col gap-1.5">
            {node.buttons.map((b: any) => (
              <div key={b.id} className="relative group w-full py-1.5 flex justify-center items-center text-[12px] font-bold text-brand-600 bg-brand-50 border border-brand-100 rounded-lg">
                <span>{b.name}</span>
                <button
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    onChange({ buttons: node.buttons.filter((btn: any) => btn.id !== b.id) });
                  }}
                  className="absolute right-2 text-brand-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                  title="Remove button"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <div className="absolute -right-4 top-1/2 -translate-y-1/2 flex items-center justify-center p-1 group-hover:scale-110 transition-transform opacity-0 group-hover:opacity-100 z-10">
                  <div 
                    id={`port-${id}-${b.id}`}
                    onMouseDown={(e) => { e.stopPropagation(); onStartEdge(id, b.id, e.clientX, e.clientY); }}
                    className="w-3.5 h-3.5 rounded-full border-[2.5px] bg-white dark:bg-gray-900 cursor-crosshair hover:bg-brand-50 shadow-sm"
                    style={{ borderColor: '#059669' }}
                    title="Connect Button"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        <button 
          onMouseDown={(e) => { e.stopPropagation(); setShowButtonModal(true); }}
          className="w-full mt-1 py-1.5 flex justify-center items-center gap-1 text-[12px] font-bold text-brand-600 border border-brand-200 rounded-lg hover:bg-brand-50 transition cursor-pointer"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>
          Add Button
        </button>
      </div>

      {showButtonModal && <ButtonConfigModal node={node} onChange={onChange} onClose={() => setShowButtonModal(false)} />}
    </div>
  );
}

export function ListNodeBody({ id, node, onChange, onStartEdge, color }: BodyProps) {
  const [errorField, setErrorField] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [customFields, setCustomFields] = React.useState<any[]>([]);
  const [loadingFields, setLoadingFields] = React.useState(false);

  React.useEffect(() => {
    const fetchCustomFields = async () => {
      setLoadingFields(true);
      try {
        const token = sessionStorage.getItem('crm_token');
        const res = await fetch('/openwa-api/crm/custom-fields', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCustomFields(data);
        }
      } catch (e) {
        console.error("Failed to load custom fields", e);
      } finally {
        setLoadingFields(false);
      }
    };
    fetchCustomFields();
  }, []);

  const validateAndSetError = (val: string, fieldId: string, msg: string) => {
    if (!val.trim()) {
      setErrorField(fieldId);
      setToastMessage(msg);
      setTimeout(() => setToastMessage(''), 3000);
    }
  };

  const addSection = () => {
    const newSection = { id: Math.random().toString(36).substr(2, 9), title: '', items: [] };
    onChange({ sections: [...(node.sections || []), newSection] });
  };

  const updateSection = (sId: string, patch: any) => {
    onChange({
      sections: (node.sections || []).map((s: any) => s.id === sId ? { ...s, ...patch } : s)
    });
  };

  const removeSection = (sId: string) => {
    onChange({ sections: (node.sections || []).filter((s: any) => s.id !== sId) });
  };

  const addItem = (sId: string) => {
    const newItem = { id: Math.random().toString(36).substr(2, 9), title: '', description: '' };
    onChange({
      sections: (node.sections || []).map((s: any) => 
        s.id === sId ? { ...s, items: [...(s.items || []), newItem] } : s
      )
    });
  };

  const updateItem = (sId: string, iId: string, patch: any) => {
    onChange({
      sections: (node.sections || []).map((s: any) => 
        s.id === sId ? { ...s, items: s.items.map((i: any) => i.id === iId ? { ...i, ...patch } : i) } : s
      )
    });
  };

  const removeItem = (sId: string, iId: string) => {
    onChange({
      sections: (node.sections || []).map((s: any) => 
        s.id === sId ? { ...s, items: s.items.filter((i: any) => i.id !== iId) } : s
      )
    });
  };

  return (
    <div className="px-3 py-1.5 flex flex-col gap-2">
      <div className="relative border border-red-400 dark:border-red-500/40 dark:border-red-500/30 rounded-lg p-2.5 flex flex-col gap-3">
        {toastMessage && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[12px] font-bold px-4 py-2 rounded-lg shadow-lg whitespace-nowrap z-50 animate-bounce">
            {toastMessage}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Enter Body</span>
          <textarea 
            className={`text-[12px] text-gray-800 dark:text-gray-200 dark:text-gray-100 border rounded p-1.5 bg-white dark:bg-gray-900/50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-900 transition outline-none resize-none ${errorField === 'body' ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 dark:border-gray-700 focus:border-brand-500'}`} 
            rows={3} 
            value={node.message || ''} 
            onChange={(e) => { onChange({ message: e.target.value }); setErrorField(null); }}
            onBlur={(e) => validateAndSetError(e.target.value, 'body', 'Body is required')}
          />
          <span className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">Enter body here, only {(node.message || '').length}/1024 characters allowed.</span>
        </div>
        
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Enter Button Text</span>
          <input 
            className={`text-[12px] text-gray-800 dark:text-gray-200 dark:text-gray-100 border rounded p-1.5 bg-white dark:bg-gray-900/50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-900 transition outline-none ${errorField === 'buttonText' ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 dark:border-gray-700 focus:border-brand-500'}`} 
            value={node.buttonText || ''} 
            placeholder="e.g. View Services"
            onChange={(e) => { onChange({ buttonText: e.target.value }); setErrorField(null); }}
            onBlur={(e) => validateAndSetError(e.target.value, 'buttonText', 'Button Text is required')}
          />
          <span className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">Enter button text here, only {(node.buttonText || '').length}/20 characters allowed.</span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Save Answer to Contact Custom Field (Optional)</span>
          <select className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white focus:ring-2 focus:ring-brand-500/50 outline-none transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600" value={node.saveAs || ''} onChange={(e) => onChange({ saveAs: e.target.value })}>
            <option value="">Default (answer)</option>
            {loadingFields ? (
              <option disabled>Loading...</option>
            ) : (
              customFields.map((f: any) => (
                <option key={f.id} value={f.name}>{f.name}</option>
              ))
            )}
          </select>
          <span className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">Select contact custom field to store reply.</span>
        </div>

        {(node.sections || []).map((s: any) => (
          <div key={s.id} className="border border-red-400 dark:border-red-500/40 dark:border-red-500/30 rounded-lg p-2.5 flex flex-col gap-3 mt-1 relative bg-white dark:bg-gray-900 dark:bg-white/50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-900 outline-none focus:ring-2 focus:ring-brand-500/50 transition-all">
             <div className="flex items-center gap-2">
               <input 
                 className={`flex-1 text-[12px] text-gray-800 dark:text-gray-200 dark:text-gray-100 border rounded p-1.5 bg-white dark:bg-gray-900/50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-900 transition outline-none ${errorField === s.id ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 dark:border-gray-700 focus:border-brand-500'}`}
                 placeholder="Section Title"
                 value={s.title}
                 onChange={(e) => { updateSection(s.id, { title: e.target.value }); setErrorField(null); }}
                 onBlur={(e) => validateAndSetError(e.target.value, s.id, 'Section Title is required')}
               />
               <button onMouseDown={() => removeSection(s.id)} className="p-1 text-gray-400 hover:text-red-500 transition cursor-pointer" title="Remove section">
                 <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
               </button>
             </div>
             <span className="text-[9px] text-gray-500 dark:text-gray-400 -mt-2 dark:text-gray-500">Enter section title here, only {(s.title || '').length}/20 characters allowed.</span>

              {(s.items || []).map((item: any) => (
                <div key={item.id} className="border border-gray-100 dark:border-gray-800 dark:border-gray-700/50 rounded-lg p-2 flex flex-col gap-2 relative bg-gray-50 dark:bg-gray-800/30">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="flex flex-col gap-1">
                        <input 
                          className={`w-full text-[12px] text-gray-800 dark:text-gray-200 dark:text-gray-100 border rounded p-1.5 bg-white dark:bg-gray-900 outline-none transition ${errorField === item.id+'-t' ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 dark:border-gray-700 focus:border-brand-500'}`}
                          placeholder="Enter Title"
                          value={item.title}
                          onChange={(e) => { updateItem(s.id, item.id, { title: e.target.value }); setErrorField(null); }}
                          onBlur={(e) => validateAndSetError(e.target.value, item.id+'-t', 'Item Title is required')}
                        />
                        <span className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">Enter title here, only {(item.title || '').length}/24 characters allowed.</span>
                      </div>
                    </div>
                   
                   <div className="flex flex-col items-center justify-between gap-4 py-1">
                     <button onMouseDown={() => removeItem(s.id, item.id)} className="text-gray-400 hover:text-red-500 transition cursor-pointer" title="Remove item">
                       <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                     </button>
                     <button id={`port-${id}-${item.id}`} onMouseDown={(e) => { e.stopPropagation(); onStartEdge(id, item.id, e.clientX, e.clientY); }} className="w-3.5 h-3.5 rounded-full border-2 bg-white dark:bg-gray-900 cursor-pointer hover:scale-110 transition-transform" style={{ borderColor: '#059669' }} title="Connect Item" />
                   </div>
                 </div>
               </div>
             ))}

             <button onMouseDown={() => addItem(s.id)} className="w-full mt-1 py-1.5 flex justify-center items-center gap-1 text-[12px] font-bold text-brand-600 border border-brand-200 rounded-lg hover:bg-brand-50 transition cursor-pointer">
               <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>
               Add Items
             </button>
          </div>
        ))}

        <button onMouseDown={addSection} className="w-full py-1.5 text-[12px] font-bold text-brand-600 border border-brand-200 rounded-lg hover:bg-brand-50 transition cursor-pointer">Add Section</button>
        <button className="w-full py-1.5 text-[12px] font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition">Open List</button>
      </div>
    </div>
  );
}

export function CatalogNodeBody({ id, node, onChange, onStartEdge, color }: BodyProps) {
  return (
    <div className="px-3 py-1.5 flex flex-col gap-2">
      <div className="relative border border-red-400 dark:border-red-500/40 dark:border-red-500/30 rounded-lg p-2.5 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Catalog ID (Optional)</span>
          <input className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white outline-none focus:ring-2 focus:ring-brand-500/50 transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600" placeholder="Leave empty to use default" value={node.catalogId || ''} onChange={(e) => onChange({ catalogId: e.target.value })} />
          <span className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">Paste your Catalog ID here if you have multiple catalogs.</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Enter Body</span>
          <textarea className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white outline-none focus:ring-2 focus:ring-brand-500/50 transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600" rows={3} value={node.message || ''} onChange={(e) => onChange({ message: e.target.value })} />
          <span className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">Enter body here, only {(node.message || '').length}/1024 characters allowed.</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Enter Footer</span>
          <input className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white outline-none focus:ring-2 focus:ring-brand-500/50 transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600" value={node.footer || ''} onChange={(e) => onChange({ footer: e.target.value })} />
          <span className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">Enter footer here, only {(node.footer || '').length}/60 characters allowed.</span>
        </div>
      </div>
      
    </div>
  );
}

export function SingleProductNodeBody({ id, node, onChange, onStartEdge, color }: BodyProps) {
  return (
    <div className="px-3 py-1.5 flex flex-col gap-2">
      <div className="relative border border-red-400 dark:border-red-500/40 dark:border-red-500/30 rounded-lg p-2.5 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Product ID</span>
          <input className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white outline-none focus:ring-2 focus:ring-brand-500/50 transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600" placeholder="Enter Product ID" value={node.productId || ''} onChange={(e) => onChange({ productId: e.target.value })} />
          <span className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">Paste the specific Product ID from your catalog.</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Enter Body</span>
          <textarea className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white outline-none focus:ring-2 focus:ring-brand-500/50 transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600" rows={3} value={node.message || ''} onChange={(e) => onChange({ message: e.target.value })} />
          <span className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">Enter body here, only {(node.message || '').length}/1024 characters allowed.</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Enter Footer</span>
          <input className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white outline-none focus:ring-2 focus:ring-brand-500/50 transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600" value={node.footer || ''} onChange={(e) => onChange({ footer: e.target.value })} />
          <span className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">Enter footer here, only {(node.footer || '').length}/60 characters allowed.</span>
        </div>
      </div>
    </div>
  );
}

export function MultiProductNodeBody({ id, node, onChange, onStartEdge, color }: BodyProps) {
  return (
    <div className="px-3 py-1.5 flex flex-col gap-2">
      <div className="relative border border-red-400 dark:border-red-500/40 dark:border-red-500/30 rounded-lg p-2.5 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Enter Header</span>
          <input className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white outline-none focus:ring-2 focus:ring-brand-500/50 transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600" value={node.header || ''} onChange={(e) => onChange({ header: e.target.value })} />
          <span className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">Enter header here, only {(node.header || '').length}/20 characters allowed.</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Enter Body</span>
          <textarea className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white outline-none focus:ring-2 focus:ring-brand-500/50 transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600" rows={3} value={node.message || ''} onChange={(e) => onChange({ message: e.target.value })} />
          <span className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">Enter body here, only {(node.message || '').length}/1024 characters allowed.</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Enter Footer</span>
          <input className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white outline-none focus:ring-2 focus:ring-brand-500/50 transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600" value={node.footer || ''} onChange={(e) => onChange({ footer: e.target.value })} />
          <span className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">Enter footer here, only {(node.footer || '').length}/60 characters allowed.</span>
        </div>

        {(node.sections || []).map((s: any, idx: number) => (
          <div key={s.id} className="border border-red-400 dark:border-red-500/40 dark:border-red-500/30 rounded-lg p-2 flex flex-col gap-2 mt-1 relative bg-white dark:bg-gray-900 dark:bg-white/50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-900 outline-none focus:ring-2 focus:ring-brand-500/50 transition-all">
             <input className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white outline-none focus:ring-2 focus:ring-brand-500/50 transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600" placeholder="Section Title" value={s.title} onChange={(e) => {
               const newSections = [...node.sections];
               newSections[idx].title = e.target.value;
               onChange({ sections: newSections });
             }} />
             <div className="flex flex-col gap-1">
                {(s.products || []).map((pid: string, pidx: number) => (
                  <div key={pidx} className="flex gap-1 items-center">
                    <input className="flex-1 text-[11px] border border-gray-200 dark:border-gray-700 rounded p-1 bg-white dark:bg-gray-900/50 focus:bg-white outline-none focus:ring-2 focus:ring-brand-500/50 transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600" placeholder="Product ID" value={pid} onChange={(e) => {
                       const newSections = [...node.sections];
                       newSections[idx].products[pidx] = e.target.value;
                       onChange({ sections: newSections });
                    }} />
                    <button onMouseDown={() => {
                       const newSections = [...node.sections];
                       newSections[idx].products.splice(pidx, 1);
                       onChange({ sections: newSections });
                    }} className="text-red-500 hover:bg-red-50 p-1 rounded">X</button>
                  </div>
                ))}
             </div>
             <button onMouseDown={() => {
                const newSections = [...(node.sections || [])];
                newSections[idx].products = [...(newSections[idx].products || []), ''];
                onChange({ sections: newSections });
             }} className="w-full text-[11px] font-bold text-brand-600 border border-brand-200 rounded py-1 hover:bg-brand-50">Add Product ID</button>
             <button onMouseDown={() => {
                onChange({ sections: node.sections.filter((_: any, i: number) => i !== idx) });
             }} className="absolute -top-2 -right-2 w-5 h-5 bg-white dark:bg-gray-900 border border-red-200 rounded-full text-red-500 text-[10px] flex items-center justify-center cursor-pointer hover:bg-red-50">X</button>
          </div>
        ))}
        
        <button onMouseDown={() => {
          onChange({ sections: [...(node.sections || []), { id: Math.random().toString(), title: '', products: [] }] });
        }} className="w-full py-1.5 text-[12px] font-bold text-brand-600 border border-brand-200 rounded-lg hover:bg-brand-50 transition">Add Section</button>
      </div>
    </div>
  );
}

export function TemplateSelectorModal({ onSelect, onClose }: { onSelect: (template: any) => void, onClose: () => void }) {
  const [templates, setTemplates] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const token = sessionStorage.getItem('crm_token');
        const res = await fetch('/openwa-api/crm/templates', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setTemplates(data.map((t: any) => ({
            id: t.id,
            name: t.name,
            type: t.type,
            header: t.header || t.content?.header,
            body: t.body || t.content?.body,
            footer: t.footer || t.content?.footer,
            mediaUrl: t.content?.mediaUrl,
            locationName: t.content?.locationName,
            locationAddress: t.content?.locationAddress,
            carouselCards: t.content?.carouselCards,
            catalogId: t.content?.catalogId,
            catalogThumbnail: t.content?.catalogThumbnail,
            buttons: t.content?.buttons?.map((b: any, i: number) => ({ id: `btn_${i}`, name: b.text, type: b.type })) || []
          })));
        }
      } catch (e) {
        console.error("Failed to load templates", e);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl rounded-xl z-50 p-4 max-h-[400px] flex flex-col">
      <div className="flex justify-between items-center mb-4 shrink-0">
        <div className="text-[14px] font-bold text-gray-800 dark:text-gray-200 dark:text-gray-100">Select Template</div>
        <button onMouseDown={(e) => { e.stopPropagation(); onClose(); }} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200">
           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="flex flex-col gap-3 overflow-y-auto pr-1">
        {loading ? (
           <div className="text-[12px] text-center text-gray-500 dark:text-gray-400 py-4">Loading templates...</div>
        ) : templates.length === 0 ? (
           <div className="text-[12px] text-center text-gray-500 dark:text-gray-400 py-4">No templates found.</div>
        ) : (
          templates.map(t => (
            <div key={t.id} onMouseDown={(e) => { e.stopPropagation(); onSelect(t); }} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:border-brand-500 cursor-pointer transition shrink-0">
              <div className="font-bold text-[13px] text-gray-800 dark:text-gray-200 mb-1">{t.name}</div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-400 font-medium dark:text-gray-500">{t.type}</span>
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 whitespace-pre-wrap">{t.body}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function TemplateNodeBody({ id, node, onChange, onStartEdge, color }: BodyProps) {
  const [showModal, setShowModal] = useState(false);
  const t = node.selectedTemplate;

  return (
    <div className="px-3 py-1.5 flex flex-col gap-2 relative">
      {!t ? (
        <div className="relative border border-red-400 dark:border-red-500/40 dark:border-red-500/30 rounded-lg p-2.5">
          <button 
            onMouseDown={(e) => { e.stopPropagation(); setShowModal(true); }}
            className="w-full py-1.5 flex justify-center items-center gap-1 text-[12px] font-bold text-brand-600 border border-brand-200 rounded-lg hover:bg-brand-50 transition cursor-pointer"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>
            Add Template
          </button>
        </div>
      ) : (
        <div className="relative bg-[#e0f2fe] dark:bg-sky-900/30 border border-sky-100 dark:border-sky-800 rounded-lg p-3 text-sky-900 dark:text-sky-100 flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <div className="font-bold text-[13px]">{t.name}</div>
            <button 
              onMouseDown={(e) => { e.stopPropagation(); onChange({ selectedTemplate: null }); }}
              className="text-sky-500 hover:text-red-500 transition cursor-pointer"
              title="Remove template"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
          
          <div className="flex flex-col gap-2 text-[12px]">
            {t.type === 'Catalog' && (
              <div className="flex items-center gap-2 bg-white dark:bg-gray-900/50 dark:bg-black/20 p-2 rounded">
                 {t.catalogThumbnail && <img src={t.catalogThumbnail} className="w-10 h-10 object-cover rounded" />}
                 <div>
                   <div className="font-semibold">Catalog</div>
                   <div className="text-[10px] opacity-80">ID: {t.catalogId}</div>
                 </div>
              </div>
            )}

            {(t.type === 'Image' || t.type === 'image') && t.mediaUrl && (
              <img src={t.mediaUrl} className="w-full h-24 object-cover rounded bg-black/10" />
            )}
            
            {(t.type === 'Video' || t.type === 'video') && t.mediaUrl && (
              <video src={t.mediaUrl} className="w-full h-24 object-cover rounded bg-black/80" />
            )}
            
            {(t.type === 'Document' || t.type === 'document' || t.type === 'file') && t.mediaUrl && (
              <div className="flex items-center gap-2 bg-white dark:bg-gray-900/50 dark:bg-black/20 p-2 rounded overflow-hidden">
                <svg className="w-6 h-6 shrink-0 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                <span className="truncate">{t.mediaUrl.split('/').pop()}</span>
              </div>
            )}

            {t.type === 'Location' && (
              <div className="flex flex-col gap-1 bg-white dark:bg-gray-900/50 dark:bg-black/20 p-2 rounded">
                <div className="font-semibold text-[11px]">{t.locationName || 'Location'}</div>
                <div className="text-[10px] opacity-80">{t.locationAddress}</div>
              </div>
            )}

            {t.type === 'Carousel' && t.carouselCards && t.carouselCards.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar snap-x">
                {t.carouselCards.map((card: any, idx: number) => (
                  <div key={idx} className="shrink-0 w-32 bg-white dark:bg-gray-900/50 dark:bg-black/20 rounded p-1.5 snap-center flex flex-col gap-1">
                     {card.mediaUrl && <img src={card.mediaUrl} className="w-full h-16 object-cover rounded" />}
                     <div className="text-[10px] line-clamp-2">{card.body}</div>
                  </div>
                ))}
              </div>
            )}

            {t.header && <div className="font-bold">{t.header}</div>}
            {t.body && <div className="whitespace-pre-wrap">{t.body}</div>}
            {t.footer && <div className="text-[10px] opacity-70">{t.footer}</div>}
          </div>

          {t.buttons && t.buttons.length > 0 && (
            <div className="mt-2 flex flex-col gap-1.5">
              {t.buttons.map((b: any) => (
                <div key={b.id} className="relative group w-full py-1.5 flex justify-center items-center text-[12px] font-bold text-sky-700 bg-sky-100 dark:bg-sky-800 dark:text-sky-200 rounded-lg border border-sky-200 dark:border-sky-700">
                  <span>{b.name}</span>
                  <div className="absolute -right-4 top-1/2 -translate-y-1/2 flex items-center justify-center p-1 group-hover:scale-110 transition-transform opacity-0 group-hover:opacity-100 z-10">
                    <div 
                      id={`port-${id}-${b.id}`}
                      onMouseDown={(e) => { e.stopPropagation(); onStartEdge(id, b.id, e.clientX, e.clientY); }}
                      className="w-3.5 h-3.5 rounded-full border-[2.5px] bg-white dark:bg-gray-900 cursor-crosshair hover:bg-sky-50 shadow-sm"
                      style={{ borderColor: '#0ea5e9' }}
                      title="Connect Button"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showModal && (
        <TemplateSelectorModal 
          onSelect={(temp) => {
            onChange({ selectedTemplate: temp });
            setShowModal(false);
          }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

// ── Action Nodes ──────────────────────────────────────────────────────────

export function ConditionNodeBody({ id, node, onChange, onStartEdge, color }: BodyProps) {
  const [customFields, setCustomFields] = React.useState<any[]>([]);
  const [loadingFields, setLoadingFields] = React.useState(false);

  React.useEffect(() => {
    if (node.conditionOn === 'contact_custom_field') {
      fetchCustomFields();
    }
  }, [node.conditionOn]);

  const fetchCustomFields = async () => {
    setLoadingFields(true);
    try {
      const token = sessionStorage.getItem('crm_token');
      const res = await fetch('/openwa-api/crm/custom-fields', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCustomFields(data);
      }
    } catch (e) {
      console.error("Failed to load custom fields", e);
    } finally {
      setLoadingFields(false);
    }
  };

  const handleKeywordChange = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      e.preventDefault();
      const words = e.currentTarget.value.split(',').map(w => w.trim()).filter(Boolean);
      const currentKws = node.keywords || [];
      const newKeywords = [...currentKws];
      words.forEach(newKw => {
        if (!newKeywords.includes(newKw)) {
          newKeywords.push(newKw);
        }
      });
      if (newKeywords.length !== currentKws.length) {
        onChange({ keywords: newKeywords });
      }
      e.currentTarget.value = '';
    }
  };

  const removeKeyword = (kw: string) => {
    onChange({ keywords: (node.keywords || []).filter((k: string) => k !== kw) });
  };

  return (
    <div className="px-3 py-1.5 flex flex-col gap-2">
      <div className="relative border border-red-400 dark:border-red-500/40 dark:border-red-500/30 rounded-lg p-2.5 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">Condition On</span>
          <select 
            className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white outline-none focus:ring-2 focus:ring-brand-500/50 transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600" 
            value={node.conditionOn || ''} 
            onChange={(e) => onChange({ conditionOn: e.target.value, op: '', valueToCompare: '', customFieldId: '' })}
          >
            <option value="">Select Condition</option>
            <option value="user_message">User Message</option>
            <option value="contact_custom_field">Contact Custom Field</option>
          </select>
          <span className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">Select the condition to apply before proceeding with the flow.</span>
        </div>

        {node.conditionOn === 'user_message' && (
          <>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">Select Condition</span>
              <select className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white outline-none focus:ring-2 focus:ring-brand-500/50 transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600" value={node.op || ''} onChange={(e) => onChange({ op: e.target.value })}>
                <option value="">Select condition here.</option>
                <option value="eq">Equal</option>
                <option value="contains">Contains</option>
                <option value="exists">Exists</option>
              </select>
            </div>
            
            {(node.op === 'eq' || node.op === 'contains') && (
              <div className="flex flex-col gap-1 mt-1">
                <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">Enter Keywords</span>
                {node.keywords && node.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1">
                    {node.keywords.map((kw: string, idx: number) => (
                      <span key={idx} className="text-[10px] bg-brand-100 text-brand-800 px-1.5 py-0.5 rounded flex items-center gap-1 border border-brand-200 dark:text-gray-300">
                        {kw}
                        <button onMouseDown={(e) => { e.stopPropagation(); removeKeyword(kw); }} className="hover:text-red-500 text-[10px] cursor-pointer">✕</button>
                      </span>
                    ))}
                  </div>
                )}
                <input 
                  className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white outline-none focus:ring-2 focus:ring-brand-500/50 transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600" 
                  placeholder="Type keyword and press Enter"
                  onKeyDown={handleKeywordChange}
                />
                
                <div className="flex items-center gap-2 mt-1">
                  <input type="checkbox" id={`cs-${id}`} checked={node.caseSensitive || false} onChange={(e) => onChange({ caseSensitive: e.target.checked })} />
                  <label htmlFor={`cs-${id}`} className="text-[10px] font-medium text-gray-700 dark:text-gray-300 dark:text-gray-200 dark:text-gray-300">Case Sensitive</label>
                </div>
              </div>
            )}
          </>
        )}

        {node.conditionOn === 'contact_custom_field' && (
          <>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">Select Condition</span>
              <select className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white outline-none focus:ring-2 focus:ring-brand-500/50 transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600" value={node.op || ''} onChange={(e) => onChange({ op: e.target.value })}>
                <option value="">Select condition here.</option>
                <option value="eq">Equal</option>
                <option value="exists">Exists</option>
                <option value="time_in">Time In</option>
                <option value="date_in">Date In</option>
              </select>
            </div>

            <div className="flex flex-col gap-1 mt-1">
              {node.op === 'time_in' || node.op === 'date_in' ? (
                <>
                  <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">Compare with</span>
                  <select className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white outline-none focus:ring-2 focus:ring-brand-500/50 transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600" value="now" disabled>
                    <option value="now">Now</option>
                  </select>
                  <span className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">Pick a contact custom field to apply this condition.</span>
                </>
              ) : (
                <>
                  <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">Select Contact Custom Field</span>
                  <select className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white outline-none focus:ring-2 focus:ring-brand-500/50 transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600" value={node.customFieldId || ''} onChange={(e) => onChange({ customFieldId: e.target.value })}>
                    <option value="">Pick a contact custom field...</option>
                    {loadingFields ? (
                      <option disabled>Loading...</option>
                    ) : (
                      customFields.map((f: any) => (
                        <option key={f.id} value={f.name}>{f.name}</option>
                      ))
                    )}
                  </select>
                </>
              )}
            </div>

            {node.op === 'eq' && (
              <div className="flex flex-col gap-1 mt-1">
                <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">Enter Value to Compare</span>
                <input className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white outline-none focus:ring-2 focus:ring-brand-500/50 transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600" placeholder="Value..." value={node.valueToCompare || ''} onChange={(e) => onChange({ valueToCompare: e.target.value })} />
              </div>
            )}

            {node.op === 'time_in' && (
              <div className="flex flex-col gap-2 mt-1">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">Start Time</span>
                  <input type="time" className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white w-full dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600" value={node.startTime || ''} onChange={(e) => onChange({ startTime: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">End Time</span>
                  <input type="time" className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white w-full dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600" value={node.endTime || ''} onChange={(e) => onChange({ endTime: e.target.value })} />
                </div>
              </div>
            )}

            {node.op === 'date_in' && (
              <div className="flex flex-col gap-2 mt-1">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">Start Date</span>
                  <input type="date" className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white w-full dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600" value={node.startDate || ''} onChange={(e) => onChange({ startDate: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">End Date</span>
                  <input type="date" className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white w-full dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600" value={node.endDate || ''} onChange={(e) => onChange({ endDate: e.target.value })} />
                </div>
              </div>
            )}
          </>
        )}

        <div className="flex items-center justify-between border border-green-200 rounded p-2 mt-2 bg-green-50/50">
          <span className="text-[11px] font-bold text-green-700">True</span>
          <button id={`port-${id}-true`} onMouseDown={(e) => { e.stopPropagation(); onStartEdge(id, 'true', e.clientX, e.clientY); }} className="w-3 h-3 rounded-full border-[2.5px] bg-white dark:bg-gray-900 cursor-crosshair hover:scale-125 transition-transform shadow-sm" style={{ borderColor: '#10b981' }} title="Connect True path" />
        </div>
        <div className="flex items-center justify-between border border-red-200 rounded p-2 bg-red-50/50">
          <span className="text-[11px] font-bold text-red-700">False</span>
          <button id={`port-${id}-false`} onMouseDown={(e) => { e.stopPropagation(); onStartEdge(id, 'false', e.clientX, e.clientY); }} className="w-3 h-3 rounded-full border-[2.5px] bg-white dark:bg-gray-900 cursor-crosshair hover:scale-125 transition-transform shadow-sm" style={{ borderColor: '#ef4444' }} title="Connect False path" />
        </div>
      </div>
    </div>
  );
}

export function QuestionNodeBody({ id, node, onChange, onStartEdge, color }: BodyProps) {
  const [customFields, setCustomFields] = React.useState<any[]>([]);
  const [loadingFields, setLoadingFields] = React.useState(false);

  React.useEffect(() => {
    const fetchCustomFields = async () => {
      setLoadingFields(true);
      try {
        const token = sessionStorage.getItem('crm_token');
        const res = await fetch('/openwa-api/crm/custom-fields', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCustomFields(data);
        }
      } catch (e) {
        console.error("Failed to load custom fields", e);
      } finally {
        setLoadingFields(false);
      }
    };
    fetchCustomFields();
  }, []);

  return (
    <div className="px-3 py-1.5 flex flex-col gap-2">
      <div className="relative border border-red-400 dark:border-red-500/40 dark:border-red-500/30 rounded-lg p-2.5 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Enter Message</span>
          <textarea className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white focus:ring-2 focus:ring-brand-500/50 outline-none transition-all resize-none dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600" rows={3} value={node.prompt || ''} onChange={(e) => onChange({ prompt: e.target.value })} />
          <span className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">Enter message here, only {(node.prompt || '').length}/1024 characters allowed.</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Select Contact Custom Field</span>
          <select className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white focus:ring-2 focus:ring-brand-500/50 outline-none transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600" value={node.saveAs || ''} onChange={(e) => onChange({ saveAs: e.target.value })}>
            <option value="">Select contact custom field...</option>
            {loadingFields ? (
              <option disabled>Loading...</option>
            ) : (
              customFields.map((f: any) => (
                <option key={f.id} value={f.name}>{f.name}</option>
              ))
            )}
          </select>
          <span className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">Select contact custom field to store reply.</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Select Format</span>
          <select className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white focus:ring-2 focus:ring-brand-500/50 outline-none transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600" value={node.format || 'any'} onChange={(e) => onChange({ format: e.target.value })}>
            <option value="any">Any</option>
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="date">Date</option>
            <option value="boolean">True/False</option>
            <option value="email">Email</option>
            <option value="regex">Regex</option>
          </select>
          <span className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">Select format of the reply.</span>
        </div>

        {node.format === 'number' && (
          <div className="flex gap-2">
            <div className="flex-1 flex flex-col gap-1">
              <input type="number" className="w-full text-[12px] border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white focus:ring-2 focus:ring-brand-500/50 outline-none transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600" placeholder="min" value={node.min ?? ''} onChange={(e) => onChange({ min: e.target.value ? Number(e.target.value) : undefined })} />
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <input type="number" className="w-full text-[12px] border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white focus:ring-2 focus:ring-brand-500/50 outline-none transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600" placeholder="max" value={node.max ?? ''} onChange={(e) => onChange({ max: e.target.value ? Number(e.target.value) : undefined })} />
            </div>
          </div>
        )}
        {node.format === 'number' && (
          <span className="text-[9px] text-gray-500 dark:text-gray-400 -mt-2 dark:text-gray-500">Enter min and max value here.</span>
        )}

        {node.format === 'regex' && (
          <div className="flex flex-col gap-1">
            <input type="text" className="w-full text-[12px] border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white focus:ring-2 focus:ring-brand-500/50 outline-none transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600" placeholder="Enter Regex" value={node.regex || ''} onChange={(e) => onChange({ regex: e.target.value })} />
            <span className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">Enter or paste regex.</span>
          </div>
        )}

        {(!node.format || node.format === 'any') ? null : (
          <>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Enter Number</span>
              <input type="number" className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white focus:ring-2 focus:ring-brand-500/50 outline-none transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600" value={node.attempts ?? 0} onChange={(e) => onChange({ attempts: e.target.value ? Number(e.target.value) : 0 })} />
              <span className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">Number of Attempt.</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Enter validation message</span>
              <textarea className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white focus:ring-2 focus:ring-brand-500/50 outline-none transition-all resize-none dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600" rows={3} placeholder="Please enter a valid format!" value={node.validationMessage || ''} onChange={(e) => onChange({ validationMessage: e.target.value })} />
              <span className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">Enter validation error message here, only {(node.validationError || '').length}/1024 characters allowed.</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function MediaQuestionNodeBody({ id, node, onChange, onStartEdge, color }: BodyProps) {
  const [customFields, setCustomFields] = React.useState<any[]>([]);
  const [loadingFields, setLoadingFields] = React.useState(false);

  React.useEffect(() => {
    const fetchCustomFields = async () => {
      setLoadingFields(true);
      try {
        const token = sessionStorage.getItem('crm_token');
        const res = await fetch('/openwa-api/crm/custom-fields', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCustomFields(data);
        }
      } catch (e) {
        console.error("Failed to load custom fields", e);
      } finally {
        setLoadingFields(false);
      }
    };
    fetchCustomFields();
  }, []);

  return (
    <div className="px-3 py-1.5 flex flex-col gap-2">
      <div className="relative border border-red-400 dark:border-red-500/40 dark:border-red-500/30 rounded-lg p-2.5 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Enter Message</span>
          <textarea className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white focus:ring-2 focus:ring-brand-500/50 outline-none transition-all resize-none dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600" rows={3} value={node.prompt || ''} onChange={(e) => onChange({ prompt: e.target.value })} />
          <span className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">Enter message here, only {(node.prompt || '').length}/1024 characters allowed.</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Select Contact Custom Field</span>
          <select className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white focus:ring-2 focus:ring-brand-500/50 outline-none transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600" value={node.saveAs || ''} onChange={(e) => onChange({ saveAs: e.target.value })}>
            <option value="">Select contact custom field...</option>
            {loadingFields ? (
              <option disabled>Loading...</option>
            ) : (
              customFields.map((f: any) => (
                <option key={f.id} value={f.name}>{f.name}</option>
              ))
            )}
          </select>
          <span className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">Select contact custom field to store media.</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Select Media Type</span>
          <select className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white focus:ring-2 focus:ring-brand-500/50 outline-none transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600" value={node.format || 'any'} onChange={(e) => onChange({ format: e.target.value })}>
            <option value="any">Any</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="document">Document</option>
            <option value="audio">Audio</option>
          </select>
          <span className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">Select media type of the reply.</span>
        </div>
        {(!node.format || node.format === 'any') ? null : (
          <>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Enter Number</span>
              <input type="number" className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white focus:ring-2 focus:ring-brand-500/50 outline-none transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600" value={node.attempts ?? 0} onChange={(e) => onChange({ attempts: e.target.value ? Number(e.target.value) : 0 })} />
              <span className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">Number of Attempt.</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Enter validation message</span>
              <textarea className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white focus:ring-2 focus:ring-brand-500/50 outline-none transition-all resize-none dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600" rows={3} placeholder="Please enter a valid format!" value={node.validationMessage || ''} onChange={(e) => onChange({ validationMessage: e.target.value })} />
              <span className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">Enter validation error message here, only {(node.validationError || '').length}/1024 characters allowed.</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function ContactCustomFieldNodeBody({ id, node, onChange, onStartEdge, color }: BodyProps) {
  const [customFields, setCustomFields] = React.useState<any[]>([]);
  const [loadingFields, setLoadingFields] = React.useState(false);

  React.useEffect(() => {
    const fetchCustomFields = async () => {
      setLoadingFields(true);
      try {
        const token = sessionStorage.getItem('crm_token');
        const res = await fetch('/openwa-api/crm/custom-fields', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCustomFields(data);
        }
      } catch (e) {
        console.error("Failed to load custom fields", e);
      } finally {
        setLoadingFields(false);
      }
    };
    fetchCustomFields();
  }, []);

  return (
    <div className="px-3 py-1.5 flex flex-col gap-2">
      <div className="relative border border-red-400 dark:border-red-500/40 dark:border-red-500/30 rounded-lg p-2.5 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Select Contact Custom Field</span>
          <select className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white focus:ring-2 focus:ring-brand-500/50 outline-none transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600" value={node.field || ''} onChange={(e) => onChange({ field: e.target.value })}>
            <option value="">Select contact custom field...</option>
            {loadingFields ? (
              <option disabled>Loading...</option>
            ) : (
              customFields.map((f: any) => (
                <option key={f.id} value={f.name}>{f.name}</option>
              ))
            )}
          </select>
          <span className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">Select contact custom field to store value.</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Enter Value</span>
          <input className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white focus:ring-2 focus:ring-brand-500/50 outline-none transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600" placeholder="Value..." value={node.value || ''} onChange={(e) => onChange({ value: e.target.value })} />
          <span className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">Enter or paste value.</span>
        </div>
      </div>
    </div>
  );
}

export function AddressNodeBody({ id, node, onChange, onStartEdge, color }: BodyProps) {
  const [customFields, setCustomFields] = React.useState<any[]>([]);
  const [loadingFields, setLoadingFields] = React.useState(false);

  React.useEffect(() => {
    const fetchCustomFields = async () => {
      setLoadingFields(true);
      try {
        const token = sessionStorage.getItem('crm_token');
        const res = await fetch('/openwa-api/crm/custom-fields', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCustomFields(data);
        }
      } catch (e) {
        console.error("Failed to load custom fields", e);
      } finally {
        setLoadingFields(false);
      }
    };
    fetchCustomFields();
  }, []);

  return (
    <div className="px-3 py-1.5 flex flex-col gap-2">
      <div className="relative border border-red-400 dark:border-red-500/40 dark:border-red-500/30 rounded-lg p-2.5 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Question Message</span>
          <textarea className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white focus:ring-2 focus:ring-brand-500/50 outline-none transition-all resize-none dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600" rows={3} placeholder="Enter question message here." value={node.prompt || ''} onChange={(e) => onChange({ prompt: e.target.value })} />
          <span className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">Enter question message here.</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Select Contact Custom Field</span>
          <select className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white focus:ring-2 focus:ring-brand-500/50 outline-none transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600" value={node.saveAs || ''} onChange={(e) => onChange({ saveAs: e.target.value })}>
            <option value="">Select field...</option>
            {loadingFields ? (
              <option disabled>Loading...</option>
            ) : (
              customFields.map((f: any) => (
                <option key={f.id} value={f.name}>{f.name}</option>
              ))
            )}
          </select>
          <span className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">Select contact custom field to store address.</span>
        </div>
      </div>
    </div>
  );
}

export function LocationNodeBody({ id, node, onChange, onStartEdge, color }: BodyProps) {
  const [customFields, setCustomFields] = React.useState<any[]>([]);
  const [loadingFields, setLoadingFields] = React.useState(false);

  React.useEffect(() => {
    const fetchCustomFields = async () => {
      setLoadingFields(true);
      try {
        const token = sessionStorage.getItem('crm_token');
        const res = await fetch('/openwa-api/crm/custom-fields', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCustomFields(data);
        }
      } catch (e) {
        console.error("Failed to load custom fields", e);
      } finally {
        setLoadingFields(false);
      }
    };
    fetchCustomFields();
  }, []);

  return (
    <div className="px-3 py-1.5 flex flex-col gap-2">
      <div className="relative border border-red-400 dark:border-red-500/40 dark:border-red-500/30 rounded-lg p-2.5 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Question Message</span>
          <textarea className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white outline-none focus:ring-2 focus:ring-brand-500/50 transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600" rows={3} value={node.prompt || ''} onChange={(e) => onChange({ prompt: e.target.value })} />
          <span className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">Enter question message here.</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Save As (Custom Field)</span>
          <select
            className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white outline-none focus:ring-2 focus:ring-brand-500/50 transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600"
            value={node.saveAs || ''}
            onChange={(e) => onChange({ saveAs: e.target.value })}
          >
            <option value="">Default (answer)</option>
            {loadingFields ? (
              <option disabled>Loading...</option>
            ) : (
              customFields.map((f: any) => (
                <option key={f.id} value={f.name}>{f.name}</option>
              ))
            )}
          </select>
          <span className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">Select contact custom field to store location reply.</span>
        </div>
      </div>
    </div>
  );
}

export function DelayNodeBody({ id, node, onChange, onStartEdge, color }: BodyProps) {
  return (
    <div className="px-3 py-1.5 flex flex-col gap-2">
      <div className="relative border border-red-400 dark:border-red-500/40 dark:border-red-500/30 rounded-lg p-2.5 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Delay Type</span>
          <select className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white outline-none focus:ring-2 focus:ring-brand-500/50 transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600" value={node.delayType || 'time'} onChange={(e) => onChange({ delayType: e.target.value as any })}>
            <option value="time">Specific Time</option>
          </select>
          <span className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">Set a specific duration to pause the flow.</span>
        </div>
        <div className="flex flex-col gap-1 mt-1">
          <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Delay Value (Seconds)</span>
          <input type="number" className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white outline-none focus:ring-2 focus:ring-brand-500/50 transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600" value={node.seconds || 0} onChange={(e) => onChange({ seconds: parseInt(e.target.value) || 0 })} />
        </div>
      </div>
    </div>
  );
}

export function APIRequestNodeBody({ id, node, onChange, onStartEdge, color }: BodyProps) {
  const [customFields, setCustomFields] = React.useState<any[]>([]);
  const [loadingFields, setLoadingFields] = React.useState(false);

  React.useEffect(() => {
    const fetchCustomFields = async () => {
      setLoadingFields(true);
      try {
        const token = sessionStorage.getItem('crm_token');
        const res = await fetch('/openwa-api/crm/custom-fields', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCustomFields(data);
        }
      } catch (e) {
        console.error("Failed to load custom fields", e);
      } finally {
        setLoadingFields(false);
      }
    };
    fetchCustomFields();
  }, []);

  const updateBodyParams = (newParams: any[]) => {
    // Generate the JSON body under the hood
    const bodyObj: Record<string, string> = {};
    newParams.forEach(p => {
      if (p.key && p.value) {
        bodyObj[p.key] = `{{${p.value}}}`;
      }
    });
    
    onChange({ 
      bodyParams: newParams, 
      body: Object.keys(bodyObj).length > 0 ? JSON.stringify(bodyObj, null, 2) : '' 
    });
  };

  const addParam = () => {
    const newParams = [...(node.bodyParams || []), { id: Date.now().toString(), key: '', value: '' }];
    updateBodyParams(newParams);
  };

  const removeParam = (paramId: string) => {
    const newParams = (node.bodyParams || []).filter((p: any) => p.id !== paramId);
    updateBodyParams(newParams);
  };

  const updateParam = (paramId: string, updates: any) => {
    const newParams = (node.bodyParams || []).map((p: any) => p.id === paramId ? { ...p, ...updates } : p);
    updateBodyParams(newParams);
  };

  return (
    <div className="px-3 py-1.5 flex flex-col gap-2">
      <div className="relative border border-red-400 dark:border-red-500/40 dark:border-red-500/30 rounded-lg p-2.5 flex flex-col gap-3">
        
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Method</span>
          <select className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white outline-none focus:ring-2 focus:ring-brand-500/50 transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900" value={node.method || 'POST'} onChange={(e) => onChange({ method: e.target.value })}>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
          </select>
          <span className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">Select HTTP Method.</span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Endpoint URL</span>
          <input className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white outline-none focus:ring-2 focus:ring-brand-500/50 transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600" placeholder="https://" value={node.webhookUrl || ''} onChange={(e) => onChange({ webhookUrl: e.target.value })} />
          <span className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">API Request or Webhook URL.</span>
        </div>

        {node.method !== 'GET' && node.method !== 'DELETE' && (
          <div className="flex flex-col gap-2 mt-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Body Parameters</span>
              <button onMouseDown={addParam} className="text-[10px] font-medium text-brand-600 dark:text-brand-400 hover:underline cursor-pointer">+ Add Parameter</button>
            </div>
            
            <div className="flex flex-col gap-2">
              {(node.bodyParams || []).map((param: any) => (
                <div key={param.id} className="flex gap-2 items-start bg-gray-50 dark:bg-gray-800/30 p-2 rounded border border-gray-100 dark:border-gray-800 dark:border-gray-700/50">
                  <div className="flex-1 flex flex-col gap-1">
                    <input 
                      className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900 focus:bg-white outline-none focus:ring-1 focus:ring-brand-500/50 transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:placeholder-gray-500" 
                      placeholder="e.g. email" 
                      value={param.key} 
                      onChange={(e) => updateParam(param.id, { key: e.target.value })} 
                    />
                    <span className="text-[8px] text-gray-500 dark:text-gray-400">Key (Use lowercase letters)</span>
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <select 
                      className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900 focus:bg-white outline-none focus:ring-1 focus:ring-brand-500/50 transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900" 
                      value={param.value} 
                      onChange={(e) => updateParam(param.id, { value: e.target.value })}
                    >
                      <option value="">Select Field...</option>
                      {loadingFields ? (
                        <option disabled>Loading...</option>
                      ) : (
                        customFields.map((f: any) => (
                          <option key={f.id} value={`contact.${f.name}`}>{f.name}</option>
                        ))
                      )}
                    </select>
                    <span className="text-[8px] text-gray-500 dark:text-gray-400">Value (Custom Field)</span>
                  </div>
                  <button onMouseDown={() => removeParam(param.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors mt-0.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))}
              
              {(!node.bodyParams || node.bodyParams.length === 0) && (
                <div className="text-[10px] text-center text-gray-400 dark:text-gray-500 py-2 italic border border-dashed border-gray-200 dark:border-gray-700 rounded">
                  No parameters added. Click + Add Parameter to send custom fields.
                </div>
              )}
            </div>
            
            <span className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">JSON payload is automatically generated.</span>
          </div>
        )}

        <div className="flex items-center justify-between border border-brand-200 dark:border-brand-500/30 rounded-lg p-1.5 px-3 mt-1 bg-brand-50/30 dark:bg-brand-900/10">
          <span className="text-[12px] font-bold text-brand-600 dark:text-brand-400">Status Fallback</span>
          <button id={`port-${id}-fallback`} onMouseDown={(e) => { e.stopPropagation(); onStartEdge(id, 'fallback', e.clientX, e.clientY); }} className="w-3.5 h-3.5 rounded-full border-2 bg-white dark:bg-gray-900 cursor-pointer hover:scale-125 transition-transform" style={{ borderColor: color }} title="Connect Fallback path" />
        </div>
      </div>
    </div>
  );
}

export function SingleAIMessageNodeBody({ id, node, onChange, onStartEdge, color }: BodyProps) {
  return (
    <div className="px-3 py-1.5 flex flex-col gap-2">
      <div className="relative border border-red-400 dark:border-red-500/40 dark:border-red-500/30 rounded-lg p-2.5 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Select AI Assistant</span>
          <select className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white outline-none focus:ring-2 focus:ring-brand-500/50 transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600">
            <option value="">Select AI Assistant...</option>
          </select>
          <span className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">Select AI Assistant.</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Assistant Input</span>
          <select className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white outline-none focus:ring-2 focus:ring-brand-500/50 transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600">
            <option value="">Select input...</option>
          </select>
          <span className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">Select how the AI Assistant should respond.</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Select Contact Custom Field</span>
          <select className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white outline-none focus:ring-2 focus:ring-brand-500/50 transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600">
            <option value="">Select field...</option>
          </select>
          <span className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">Select contact custom field to store value.</span>
        </div>
      </div>
    </div>
  );
}

export function AssignAIAssistantNodeBody({ id, node, onChange, onStartEdge, color }: BodyProps) {
  return (
    <div className="px-3 py-1.5 flex flex-col gap-2">
      <div className="relative border border-red-400 dark:border-red-500/40 dark:border-red-500/30 rounded-lg p-2.5 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Select AI Assistant</span>
          <select className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white outline-none focus:ring-2 focus:ring-brand-500/50 transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600">
            <option value="">Select AI Assistant...</option>
          </select>
          <span className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">Select AI Assistant.</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Start With</span>
          <select className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white outline-none focus:ring-2 focus:ring-brand-500/50 transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600">
            <option value="">Select...</option>
          </select>
          <span className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">Select how the AI Assistant should start the conversation.</span>
        </div>
      </div>
    </div>
  );
}

export function ConnectFlowNodeBody({ id, node, onChange, onStartEdge, color }: BodyProps) {
  const [flows, setFlows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const fetchFlows = async () => {
      setLoading(true);
      try {
        const token = sessionStorage.getItem('crm_token');
        const res = await fetch('/openwa-api/crm/flows', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setFlows(data);
        }
      } catch (e) {
        console.error("Failed to load flows", e);
      } finally {
        setLoading(false);
      }
    };
    fetchFlows();
  }, []);

  return (
    <div className="px-3 py-1.5 flex flex-col gap-2">
      <div className="relative border border-red-400 dark:border-red-500/40 dark:border-red-500/30 rounded-lg p-2.5 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Select Flow</span>
          <select 
            className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white outline-none focus:ring-2 focus:ring-brand-500/50 transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900" 
            value={node.targetFlowId || ''} 
            onChange={(e) => onChange({ targetFlowId: e.target.value })}
          >
            <option value="">Select your existing flow to connect.</option>
            {loading ? (
              <option disabled>Loading flows...</option>
            ) : (
              flows.map((f: any) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))
            )}
          </select>
          <span className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-500">The customer will jump to the start of this flow.</span>
        </div>
      </div>
    </div>
  );
}

export function DefaultNodeBody({ id, node, onChange, onStartEdge, color }: BodyProps) {
  return (
    <div className="px-3 py-1.5">
      <div className="px-3 py-3 text-center border border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/30">
        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Node details configuration</p>
      </div>
    </div>
  );
}

export function WebhookMessageNodeBody({ id, node, onChange, onStartEdge, color, flowId }: BodyProps & { flowId?: string }) {
  const [detectedFields, setDetectedFields] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const getToken = () => sessionStorage.getItem('crm_token');
  const headers = () => ({ Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' });

  const loadFields = useCallback(() => {
    if (flowId) {
      fetch(`/openwa-api/crm/flows/${flowId}/trigger`, { headers: headers() })
        .then(res => res.json())
        .then(data => {
          if (data.detectedFields) {
            const allFields = new Set<string>();
            Object.values(data.detectedFields).forEach((fields: any) => {
              fields.forEach((f: string) => allFields.add(f));
            });
            setDetectedFields(Array.from(allFields));
          }
        })
        .catch(() => {});
    }
  }, [flowId]);

  useEffect(() => {
    loadFields();
  }, [loadFields]);

  const insertVariable = (variable: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = node.message || '';
    const newText = currentText.substring(0, start) + `{{${variable}}}` + currentText.substring(end);
    onChange({ message: newText });
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length + 4, start + variable.length + 4);
    }, 10);
  };

  const handleTestMessage = async () => {
    if (!flowId) return;
    alert("Test message preview ready! (Backend sending logic can be connected here)");
  };

  return (
    <div className="px-3 py-1.5 flex flex-col gap-2">
      <div className="relative border border-brand-400 dark:border-brand-500/40 dark:border-brand-500/30 rounded-lg p-2.5 flex flex-col gap-3">
        <div className="flex flex-col gap-1 mb-2">
          <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">To (Phone Number)</span>
          <input
            type="text"
            className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white outline-none focus:ring-2 focus:ring-brand-500/50 transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600 font-mono"
            placeholder="{{customer.phone}}"
            value={node.toPhone || ''}
            onChange={(e) => onChange({ toPhone: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Message Text</span>
          <textarea
            ref={textareaRef}
            className="w-full text-[12px] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-1.5 bg-white dark:bg-gray-900/50 focus:bg-white outline-none focus:ring-2 focus:ring-brand-500/50 transition-all dark:text-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:focus:bg-gray-900 dark:placeholder-gray-600 font-mono"
            rows={4}
            placeholder="Hi {{order.customer.name}}, your order..."
            value={node.message || ''}
            onChange={(e) => onChange({ message: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Insert Variable</label>
            <button onClick={loadFields} className="text-[9px] text-brand-500 hover:underline flex items-center gap-1">
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Refresh
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {detectedFields.map(f => (
              <button
                key={f}
                onClick={() => insertVariable(f)}
                className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 dark:text-gray-300 rounded text-[9px] font-mono transition-colors border border-gray-200 dark:border-gray-700"
              >
                {`{{${f}}}`}
              </button>
            ))}
            {detectedFields.length === 0 && (
              <span className="text-[9px] text-gray-400 italic">No variables detected yet. Test your webhook first.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

