import React, { useState, useRef, useEffect, useCallback } from 'react';
import './BlockEditor.css';
import MediaPickerModal, { MediaData } from '../ui/MediaPickerModal';

type BlockType = 'paragraph' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'quote' | 'checklist' | 'ordered' | 'unordered' | 'hr' | 'image';

interface Block {
  id: string;
  type: BlockType;
  html: string;
  checked?: boolean;
  image?: string | null;
  imageWidth?: number;
  caption?: string;
}

const BLOCK_TYPES = [
  { type: "checklist", label: "Check List", group: "Lists", icon: "☑" },
  { type: "ordered", label: "Ordered List", group: "Lists", icon: "1." },
  { type: "unordered", label: "Unordered List", group: "Lists", icon: "•" },
  { type: "hr", label: "Horizontal Rule", group: "Basic", icon: "—" },
  { type: "image", label: "Media / Upload", group: "Basic", icon: "⬆" },
  { type: "quote", label: "Blockquote", group: "Basic", icon: "❝" },
  { type: "h1", label: "Heading 1", group: "Basic", icon: "H1" },
  { type: "h2", label: "Heading 2", group: "Basic", icon: "H2" },
  { type: "h3", label: "Heading 3", group: "Basic", icon: "H3" },
  { type: "h4", label: "Heading 4", group: "Basic", icon: "H4" },
  { type: "h5", label: "Heading 5", group: "Basic", icon: "H5" },
  { type: "h6", label: "Heading 6", group: "Basic", icon: "H6" },
  { type: "paragraph", label: "Paragraph", group: "Basic", icon: "¶" },
];

const PLACEHOLDERS: Record<string, string> = {
  paragraph: "Start typing, or press '/' for commands...",
  h1: "Heading 1", h2: "Heading 2", h3: "Heading 3",
  h4: "Heading 4", h5: "Heading 5", h6: "Heading 6",
  quote: "Quote", checklist: "To-do", ordered: "List item", unordered: "List item",
};

let idCounter = 1;
function newId() { return "b" + (idCounter++); }
function makeBlock(type: BlockType = 'paragraph', html: string = ''): Block {
  return { id: newId(), type, html, checked: false, image: null, imageWidth: 100, caption: "" };
}

// Wrapper for contentEditable to prevent cursor jumping
const ContentEditable = React.forwardRef<HTMLDivElement, any>(({ html, onInput, ...rest }, ref) => {
  const elRef = useRef<HTMLDivElement>(null);
  
  React.useImperativeHandle(ref, () => elRef.current);
  
  useEffect(() => {
    if (elRef.current && elRef.current.innerHTML !== (html || '')) {
      elRef.current.innerHTML = html || '';
    }
  }, [html]);

  return (
    <div
      ref={elRef}
      contentEditable
      onInput={(e) => {
        if (onInput) onInput(e.currentTarget.innerHTML);
      }}
      {...rest}
    />
  );
});

export default function BlockEditor({ value, onChange }: { value?: string, onChange?: (val: string) => void }) {
  const [blocks, setBlocks] = useState<Block[]>(() => {
    if (!value) return [makeBlock('paragraph', '')];
    return [makeBlock('paragraph', value)];
  });

  const editorRef = useRef<HTMLDivElement>(null);
  const slashMenuRef = useRef<HTMLDivElement>(null);
  const bubbleBarRef = useRef<HTMLDivElement>(null);
  
  const [slashState, setSlashState] = useState<{ active: boolean, blockId: string | null, query: string, top: number, left: number }>({
    active: false, blockId: null, query: "", top: 0, left: 0
  });
  
  const [bubbleState, setBubbleState] = useState<{ active: boolean, top: number, left: number }>({
    active: false, top: 0, left: 0
  });

  const [activeItemIdx, setActiveItemIdx] = useState(0);

  // Drag and Drop State
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [dragOverBlockId, setDragOverBlockId] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<'top' | 'bottom' | null>(null);

  // Media Picker State
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [mediaTargetBlockId, setMediaTargetBlockId] = useState<string | null>(null);

  // Sync to HTML
  const getEditorHTML = useCallback((currentBlocks: Block[]) => {
    let html = "";
    let i = 0;
    while(i < currentBlocks.length){
      const b = currentBlocks[i];
      if(b.type === "unordered" || b.type === "ordered"){
        const tag = b.type === "ordered" ? "ol" : "ul";
        let items = "";
        while(i < currentBlocks.length && currentBlocks[i].type === b.type){
          items += `<li>${currentBlocks[i].html}</li>`;
          i++;
        }
        html += `<${tag}>${items}</${tag}>`;
        continue;
      }
      if(b.type === "checklist"){
        let items = "";
        while(i < currentBlocks.length && currentBlocks[i].type === "checklist"){
          const c = currentBlocks[i];
          items += `<li class="checklist-item${c.checked ? " checked":""}"><input type="checkbox" disabled ${c.checked?"checked":""}> ${c.html}</li>`;
          i++;
        }
        html += `<ul class="checklist">${items}</ul>`;
        continue;
      }
      if(b.type.startsWith("h")){
        html += `<${b.type}>${b.html}</${b.type}>`;
      } else if(b.type === "quote"){
        html += `<blockquote>${b.html}</blockquote>`;
      } else if(b.type === "hr"){
        html += `<hr>`;
      } else if(b.type === "image"){
        if(b.image){
          const wStyle = b.imageWidth ? ` style="width: ${b.imageWidth}%"` : '';
          html += `<figure${wStyle}><img src="${b.image}" alt="">` +
                  (b.caption ? `<figcaption>${b.caption}</figcaption>` : "") + `</figure>`;
        }
      } else {
        if(b.html && b.html.trim() !== "") html += `<p>${b.html}</p>`;
      }
      i++;
    }
    return html;
  }, []);

  const updateBlocks = (newBlocks: Block[]) => {
    if (newBlocks.length === 0) {
      newBlocks = [makeBlock('paragraph', '')];
    }
    setBlocks(newBlocks);
    if (onChange) onChange(getEditorHTML(newBlocks));
  };

  const getBlockIndex = (id: string) => blocks.findIndex(b => b.id === id);

  const focusBlock = (id: string, atStart = false) => {
    setTimeout(() => {
      if (!editorRef.current) return;
      const el = editorRef.current.querySelector(`[data-id="${id}"] .block-content, [data-id="${id}"] .image-caption`) as HTMLElement;
      if (!el) return;
      el.focus();
      
      const range = document.createRange();
      const sel = window.getSelection();
      if (!sel) return;
      
      range.selectNodeContents(el);
      range.collapse(!!atStart);
      sel.removeAllRanges();
      sel.addRange(range);
    }, 10);
  };

  const handleInput = (id: string, html: string) => {
    const idx = getBlockIndex(id);
    if (idx === -1) return;
    
    const match = /^\/([a-zA-Z0-9 ]*)$/.exec(html.replace(/&nbsp;/g, ' '));
    if (match) {
      const el = editorRef.current?.querySelector(`[data-id="${id}"] .block-content`);
      if (el) {
        const rect = el.getBoundingClientRect();
        const shellRect = editorRef.current?.getBoundingClientRect() || { top: 0, left: 0 };
        setSlashState({
          active: true,
          blockId: id,
          query: match[1],
          left: rect.left - shellRect.left,
          top: rect.bottom - shellRect.top + 6
        });
        setActiveItemIdx(0);
      }
    } else if (slashState.active && slashState.blockId === id) {
      setSlashState(s => ({ ...s, active: false }));
    }

    const newBlocks = [...blocks];
    newBlocks[idx] = { ...newBlocks[idx], html };
    updateBlocks(newBlocks);
  };

  const applySlashSelection = (type: string) => {
    if (!slashState.blockId) return;
    const id = slashState.blockId;
    const idx = getBlockIndex(id);
    if (idx === -1) return;
    
    const newBlocks = [...blocks];
    newBlocks[idx] = { ...newBlocks[idx], type: type as BlockType, html: '', checked: false };
    
    if (type === 'hr') {
      const p = makeBlock('paragraph', '');
      newBlocks.splice(idx + 1, 0, p);
      updateBlocks(newBlocks);
      focusBlock(p.id);
    } else {
      updateBlocks(newBlocks);
      if (type !== 'image') {
        focusBlock(id);
      }
    }
    
    setSlashState(s => ({ ...s, active: false }));
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (slashState.active && slashState.blockId === id) {
      const q = (slashState.query || "").toLowerCase();
      const filtered = BLOCK_TYPES.filter(t => t.label.toLowerCase().includes(q) || t.type.includes(q));
      
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveItemIdx((prev) => (prev + 1) % filtered.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveItemIdx((prev) => (prev - 1 + filtered.length) % filtered.length);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const active = filtered[activeItemIdx] || filtered[0];
        if (active) applySlashSelection(active.type);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setSlashState(s => ({ ...s, active: false }));
        return;
      }
    }

    if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
      const key = e.key.toLowerCase();
      if (key === "b") { e.preventDefault(); toggleInlineFormat("strong"); return; }
      if (key === "i") { e.preventDefault(); toggleInlineFormat("em"); return; }
      if (key === "u") { e.preventDefault(); toggleInlineFormat("u"); return; }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEnter(id);
      return;
    }

    if (e.key === "Backspace") {
      const el = e.currentTarget as HTMLElement;
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      const range = sel.getRangeAt(0).cloneRange();
      range.selectNodeContents(el);
      range.setEnd(sel.getRangeAt(0).startContainer, sel.getRangeAt(0).startOffset);
      const isAtStart = range.toString().length === 0;

      if (isAtStart) {
        e.preventDefault();
        handleBackspaceAtStart(id);
      }
    }
  };

  const handleEnter = (id: string) => {
    const idx = getBlockIndex(id);
    if (idx === -1) return;
    const block = blocks[idx];
    
    const sel = window.getSelection();
    let beforeHtml = block.html;
    let afterHtml = "";
    
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      const el = editorRef.current?.querySelector(`[data-id="${id}"] .block-content`);
      if (el && el.contains(range.commonAncestorContainer)) {
        const afterRange = range.cloneRange();
        afterRange.selectNodeContents(el);
        afterRange.setStart(range.endContainer, range.endOffset);
        const afterFrag = afterRange.extractContents();
        const afterDiv = document.createElement("div");
        afterDiv.appendChild(afterFrag);
        afterHtml = afterDiv.innerHTML;
        beforeHtml = el.innerHTML;
      }
    }
    
    const isEmpty = beforeHtml.replace(/<[^>]*>?/gm, '').trim().length === 0;
    
    if (isEmpty && ["ordered", "unordered", "checklist", "quote"].includes(block.type)) {
      const newBlocks = [...blocks];
      newBlocks[idx] = { ...newBlocks[idx], type: 'paragraph' };
      updateBlocks(newBlocks);
      focusBlock(id);
      return;
    }

    let nextType: BlockType = 'paragraph';
    if (["ordered", "unordered", "checklist", "quote"].includes(block.type)) {
      nextType = block.type as BlockType;
    }

    const newBlock = makeBlock(nextType, afterHtml);
    const newBlocks = [...blocks];
    newBlocks[idx] = { ...newBlocks[idx], html: beforeHtml };
    newBlocks.splice(idx + 1, 0, newBlock);
    
    updateBlocks(newBlocks);
    focusBlock(newBlock.id, true);
  };

  const handleBackspaceAtStart = (id: string) => {
    const idx = getBlockIndex(id);
    if (idx === -1) return;
    const block = blocks[idx];
    const isEmpty = block.html.replace(/<[^>]*>?/gm, '').trim().length === 0;

    if (block.type !== "paragraph" && isEmpty) {
      const newBlocks = [...blocks];
      newBlocks[idx] = { ...newBlocks[idx], type: 'paragraph' };
      updateBlocks(newBlocks);
      focusBlock(id);
      return;
    }

    if (idx === 0) return; 

    const prevBlock = blocks[idx - 1];
    if (["hr", "image"].includes(prevBlock.type)) {
      if (isEmpty) {
        const newBlocks = [...blocks];
        newBlocks.splice(idx, 1);
        updateBlocks(newBlocks);
      }
      return;
    }

    const newBlocks = [...blocks];
    newBlocks[idx - 1] = { ...newBlocks[idx - 1], html: prevBlock.html + block.html };
    newBlocks.splice(idx, 1);
    
    updateBlocks(newBlocks);
    focusBlock(prevBlock.id);
  };

  const toggleInlineFormat = (cmd: string) => {
    document.execCommand(cmd, false);
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const node = sel.anchorNode;
      const el = node?.nodeType === 3 ? node.parentElement : node;
      const contentEl = (el as Element)?.closest('.block-content');
      if (contentEl) {
        const blockEl = contentEl.closest('.block') as HTMLElement;
        const id = blockEl?.dataset.id;
        if (id) {
          handleInput(id, contentEl.innerHTML);
        }
      }
    }
  };

  useEffect(() => {
    const handleSelection = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
        setBubbleState(s => s.active ? { ...s, active: false } : s);
        return;
      }
      const node = sel.anchorNode;
      const el = node?.nodeType === 3 ? node.parentElement : node;
      if (!(el as Element)?.closest('.block-content')) {
        setBubbleState(s => s.active ? { ...s, active: false } : s);
        return;
      }
      
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;
      
      const shellRect = editorRef.current?.getBoundingClientRect() || { top: 0, left: 0 };
      setBubbleState({
        active: true,
        left: rect.left - shellRect.left + rect.width / 2 - 70,
        top: rect.top - shellRect.top - 44
      });
    };
    
    document.addEventListener("selectionchange", handleSelection);
    return () => document.removeEventListener("selectionchange", handleSelection);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!slashMenuRef.current?.contains(e.target as Node) && !(e.target as Element).closest('.block-content')) {
        setSlashState(s => s.active ? { ...s, active: false } : s);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const openMediaPicker = (blockId: string) => {
    setMediaTargetBlockId(blockId);
    setIsMediaPickerOpen(true);
  };

  const handleMediaSelect = (media: MediaData) => {
    if (mediaTargetBlockId) {
      const idx = getBlockIndex(mediaTargetBlockId);
      if (idx !== -1) {
        const newBlocks = [...blocks];
        newBlocks[idx] = { ...newBlocks[idx], image: media.url, imageWidth: 100 };
        updateBlocks(newBlocks);
      }
    }
    setIsMediaPickerOpen(false);
  };

  // Image Resizer Logic
  const startResizing = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const startX = e.pageX;
    const idx = getBlockIndex(id);
    if (idx === -1) return;
    
    const startWidth = blocks[idx].imageWidth || 100;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const diffX = moveEvent.pageX - startX;
      // Convert pixel diff to percentage (roughly assuming container is ~800px)
      const diffPercent = (diffX / 800) * 100;
      let newWidth = startWidth + diffPercent;
      if (newWidth < 10) newWidth = 10;
      if (newWidth > 100) newWidth = 100;

      setBlocks(prev => prev.map(b => b.id === id ? { ...b, imageWidth: newWidth } : b));
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      // We rely on the parent blocks state from earlier, we should fire onChange
      setBlocks(current => {
        if (onChange) onChange(getEditorHTML(current));
        return current;
      });
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // Drag and Drop Logic
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedBlockId(id);
    e.dataTransfer.effectAllowed = 'move';
    // Small delay to allow the styling to apply correctly to the drag ghost
    setTimeout(() => {
       const el = document.querySelector(`[data-id="${id}"]`);
       if(el) el.classList.add('dragging');
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedBlockId === id || !draggedBlockId) return;

    const el = document.querySelector(`[data-id="${id}"]`);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const pos = e.clientY < midpoint ? 'top' : 'bottom';
    
    setDragOverBlockId(id);
    setDragPosition(pos);
  };

  const handleDragLeave = (e: React.DragEvent, id: string) => {
    if (dragOverBlockId === id) {
      setDragOverBlockId(null);
      setDragPosition(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedBlockId || draggedBlockId === targetId) {
      cleanupDrag();
      return;
    }

    const sourceIdx = getBlockIndex(draggedBlockId);
    let targetIdx = getBlockIndex(targetId);

    if (sourceIdx !== -1 && targetIdx !== -1) {
      const newBlocks = [...blocks];
      const [movedBlock] = newBlocks.splice(sourceIdx, 1);
      
      // If we removed an item before the target, the target index shifts
      if (sourceIdx < targetIdx) {
        targetIdx--;
      }

      if (dragPosition === 'bottom') {
        targetIdx++;
      }

      newBlocks.splice(targetIdx, 0, movedBlock);
      updateBlocks(newBlocks);
    }

    cleanupDrag();
  };

  const handleDragEnd = () => {
    cleanupDrag();
  };

  const cleanupDrag = () => {
    if (draggedBlockId) {
      const el = document.querySelector(`[data-id="${draggedBlockId}"]`);
      if(el) el.classList.remove('dragging');
    }
    setDraggedBlockId(null);
    setDragOverBlockId(null);
    setDragPosition(null);
  };

  let listCount = 0;
  let prevWasOrdered = false;

  return (
    <>
      <div className="editor-shell bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 shadow-sm" ref={editorRef} onClick={(e) => {
        if (e.target === editorRef.current) {
          const last = blocks[blocks.length - 1];
          if (last) focusBlock(last.id);
        }
      }}>
        {/* Editor Content */}
        <div id="editor">
          {blocks.map((block, index) => {
            if (block.type === 'ordered') {
              listCount = prevWasOrdered ? listCount + 1 : 1;
              prevWasOrdered = true;
            } else {
              prevWasOrdered = false;
            }
            
            const isChecklist = block.type === 'checklist';
            const isOrdered = block.type === 'ordered';
            const isUnordered = block.type === 'unordered';

            const isDragOver = dragOverBlockId === block.id;
            const dragClass = isDragOver ? (dragPosition === 'top' ? 'drag-over-top' : 'drag-over-bottom') : '';

            return (
              <div 
                key={block.id} 
                className={`block group ${block.checked ? 'checked' : ''} ${dragClass}`} 
                data-id={block.id} 
                data-type={block.type}
                draggable={!!draggedBlockId} // Only allow dragging when handle is grabbed
                onDragOver={(e) => handleDragOver(e, block.id)}
                onDragLeave={(e) => handleDragLeave(e, block.id)}
                onDrop={(e) => handleDrop(e, block.id)}
                onDragEnd={handleDragEnd}
              >
                <div className="block-controls opacity-0 group-hover:opacity-100 transition-opacity">
                  <button title="Options" onClick={(e) => {
                    const el = editorRef.current?.querySelector(`[data-id="${block.id}"] .block-content`);
                    if (el) {
                      const rect = el.getBoundingClientRect();
                      const shellRect = editorRef.current?.getBoundingClientRect() || { top: 0, left: 0 };
                      setSlashState({
                        active: true,
                        blockId: block.id,
                        query: "",
                        left: rect.left - shellRect.left,
                        top: rect.bottom - shellRect.top + 6
                      });
                      setActiveItemIdx(0);
                    }
                  }}>+</button>
                </div>
                
                <div className="block-body flex items-start gap-2 flex-1 relative">
                  {block.type === 'hr' ? (
                    <div className="w-full py-2.5"><hr className="border-gray-200 dark:border-gray-700 m-0" /></div>
                  ) : block.type === 'image' ? (
                    <div className="w-full">
                      {block.image ? (
                        <div className="image-wrap relative" style={{ width: `${block.imageWidth || 100}%` }}>
                          <img src={block.image} alt="" className="w-full rounded-lg block" />
                          
                          {/* Resizer Handle */}
                          <div 
                            className="resize-handle"
                            onMouseDown={(e) => startResizing(e, block.id)}
                          />

                          <div className="image-actions mt-1.5 flex gap-2">
                            <button onClick={() => openMediaPicker(block.id)} className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">Replace</button>
                            <button onClick={() => {
                              const newBlocks = [...blocks];
                              newBlocks.splice(index, 1);
                              updateBlocks(newBlocks);
                            }} className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-red-500">Remove</button>
                          </div>
                          <ContentEditable 
                            className="image-caption mt-1.5 text-xs text-gray-400 italic outline-none" 
                            html={block.caption}
                            data-placeholder="Add a caption (optional)"
                            data-empty={!block.caption}
                            onInput={(html: string) => {
                              const newBlocks = [...blocks];
                              newBlocks[index] = { ...block, caption: html };
                              updateBlocks(newBlocks);
                            }}
                            onKeyDown={(e: any) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const newBlocks = [...blocks];
                                const p = makeBlock('paragraph', '');
                                newBlocks.splice(index + 1, 0, p);
                                updateBlocks(newBlocks);
                                focusBlock(p.id);
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <div className="image-dropzone-wrap w-full">
                          <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 flex items-center justify-between bg-white dark:bg-gray-900">
                            <button 
                              onClick={() => openMediaPicker(block.id)}
                              className="bg-[#1c2434] text-white px-4 py-2 rounded text-sm font-medium hover:bg-opacity-90"
                            >
                              Upload Media
                            </button>
                            <span className="text-gray-400 text-sm">or drag and drop a file</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {(isChecklist || isOrdered || isUnordered) && (
                        <div className="flex-none pt-1">
                          {isChecklist ? (
                            <div 
                              className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer ${block.checked ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300 dark:border-gray-600'}`}
                              onClick={() => {
                                const newBlocks = [...blocks];
                                newBlocks[index] = { ...block, checked: !block.checked };
                                updateBlocks(newBlocks);
                              }}
                            >
                              {block.checked && <span className="text-[10px]">✓</span>}
                            </div>
                          ) : isOrdered ? (
                            <span className="text-gray-500 dark:text-gray-400">{listCount}.</span>
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">•</span>
                          )}
                        </div>
                      )}
                      
                      <ContentEditable 
                        className={`block-content flex-1 min-h-[1.5em] outline-none ${block.checked ? 'line-through text-gray-400' : ''}`}
                        html={block.html}
                        data-placeholder={PLACEHOLDERS[block.type] || "Type something..."}
                        data-empty={!block.html}
                        onInput={(html: string) => handleInput(block.id, html)}
                        onKeyDown={(e: any) => handleKeyDown(e, block.id)}
                      />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Slash Menu */}
        {slashState.active && (
          <div 
            ref={slashMenuRef}
            className="float-menu open" 
            style={{ top: slashState.top, left: slashState.left }}
          >
            {(() => {
              const q = (slashState.query || "").toLowerCase();
              const filtered = BLOCK_TYPES.filter(t => t.label.toLowerCase().includes(q) || t.type.includes(q));
              
              if (filtered.length === 0) {
                return <div className="empty-state">No matching block type</div>;
              }

              let lastGroup: string | null = null;
              return filtered.map((t, i) => {
                const showGroup = t.group !== lastGroup;
                lastGroup = t.group;
                return (
                  <React.Fragment key={t.type}>
                    {showGroup && <div className="group-label">{t.group}</div>}
                    <div 
                      className={`menu-item ${i === activeItemIdx ? 'active' : ''}`}
                      onClick={(e) => { e.preventDefault(); applySlashSelection(t.type); }}
                      onMouseEnter={() => setActiveItemIdx(i)}
                    >
                      <div className="ico">{t.icon}</div>
                      <div>{t.label}</div>
                    </div>
                  </React.Fragment>
                );
              });
            })()}
          </div>
        )}

        {/* Bubble Toolbar */}
        {bubbleState.active && (
          <div 
            ref={bubbleBarRef}
            className="bubble-toolbar open"
            style={{ top: bubbleState.top, left: bubbleState.left }}
            onMouseDown={(e) => e.preventDefault()}
          >
            <button className="b" onClick={() => toggleInlineFormat("bold")} title="Bold (Ctrl+B)">B</button>
            <button className="i" onClick={() => toggleInlineFormat("italic")} title="Italic (Ctrl+I)">I</button>
            <button className="u" onClick={() => toggleInlineFormat("underline")} title="Underline (Ctrl+U)">U</button>
            <button className="s" onClick={() => toggleInlineFormat("strikeThrough")} title="Strikethrough">S</button>
          </div>
        )}
      </div>
      
      <MediaPickerModal 
        isOpen={isMediaPickerOpen} 
        onClose={() => setIsMediaPickerOpen(false)} 
        onSelect={handleMediaSelect} 
      />
    </>
  );
}
