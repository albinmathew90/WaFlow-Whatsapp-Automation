import { useState, useRef, useCallback, useEffect } from 'react';
import type { Flow, FlowNode, FlowEdge, NodeKind } from './types/flow.types';
import { NODE_TYPES, getNodeTypeDef } from './types/flow.types';
import NodePalette from './nodes/NodePalette';
import NodeCard from './nodes/NodeCard';
import EdgeLayer from './edges/EdgeLayer';
import TriggerNode from './nodes/TriggerNode';

const API = '/openwa-api/crm/flows';
const getToken = () => sessionStorage.getItem('crm_token') || localStorage.getItem('crm_token');
const headers = () => ({ Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' });

interface Props {
  initialFlow?: Flow | null;
  onSaved: (flow: Flow) => void;
  onCancel: () => void;
}

let nodeIdCounter = 0;
const genId = () => `node_${Date.now()}_${nodeIdCounter++}`;

export default function FlowCanvas({ initialFlow, onSaved, onCancel }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);

  // ── Flow State ──────────────────────────────────────────────────────────────
  const [flowName, setFlowName] = useState(initialFlow?.name || 'New Flow');
  const [trigger, setTrigger] = useState<Flow['trigger']>(
    initialFlow?.trigger || { event: 'keyword', keywords: [], caseSensitive: false }
  );
  const [triggerPos, setTriggerPos] = useState({ x: 100, y: 50 });
  const [nodes, setNodes] = useState<Record<string, FlowNode>>(initialFlow?.nodes || {});
  const [edges, setEdges] = useState<FlowEdge[]>(initialFlow?.edges || []);

  // ── UI State ────────────────────────────────────────────────────────────────
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savedFlowId, setSavedFlowId] = useState<string | undefined>(initialFlow?.id);
  const [triggerRefreshKey, setTriggerRefreshKey] = useState(0);
  const [templates, setTemplates] = useState<{ id: string; name: string }[]>([]);

  // Canvas Pan & Zoom
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panRef = useRef(pan);
  const scaleRef = useRef(scale);
  const triggerPosRef = useRef(triggerPos);

  useEffect(() => { panRef.current = pan; }, [pan]);
  useEffect(() => { scaleRef.current = scale; }, [scale]);
  useEffect(() => { triggerPosRef.current = triggerPos; }, [triggerPos]);
  const canvasDragRef = useRef<{ startX: number; startY: number; startPanX: number; startPanY: number } | null>(null);

  // Drag state
  const dragRef = useRef<{ nodeId: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Edge drawing state
  const [drawingEdge, setDrawingEdge] = useState<{ from: string; branch?: string; mouseX: number; mouseY: number; startX?: number; startY?: number } | null>(null);
  const edgeDrawingRef = useRef<typeof drawingEdge>(null);

  // Edge Drop Context Menu state
  const [edgeDropMenu, setEdgeDropMenu] = useState<{ x: number; y: number; from: string; branch?: string } | null>(null);

  useEffect(() => {
    fetch('/openwa-api/crm/templates', { headers: headers() })
      .then((r) => r.json())
      .then((data: any[]) => setTemplates(data.map((t) => ({ id: t.id, name: t.name }))))
      .catch(() => { });
  }, []);

  // ── First node detection ────────────────────────────────────────────────────
  const getStartNodeId = useCallback(() => {
    const targets = new Set(edges.map((e) => e.to));
    return Object.keys(nodes).find((id) => !targets.has(id));
  }, [nodes, edges]);

  // ── Add Node ─────────────────────────────────────────────────────────────────
  const addNode = useCallback((kind: NodeKind) => {
    const typeDef = NODE_TYPES.find((n) => n.kind === kind);
    const id = genId();
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    const nodeCount = Object.keys(nodes).length;
    // Spread them out across the view, wrapping every 3 nodes
    const col = nodeCount % 3;
    const row = Math.floor(nodeCount / 3);
    const canvasCenterX = rect ? rect.width / 2 : 500;
    const canvasCenterY = rect ? rect.height / 2 : 300;

    const x = (canvasCenterX - pan.x - 140 + (col * 300)) / scale;
    const y = (canvasCenterY - pan.y - 100 + (row * 200)) / scale;
    const blockId = genId();
    setNodes((prev) => ({
      ...prev,
      [id]: { kind, x, y, blocks: [{ id: blockId, kind, data: { ...typeDef?.defaultData } }] } as FlowNode,
    }));
    setSelectedNodeId(id);
  }, [nodes]);

  // ── Node Drag ────────────────────────────────────────────────────────────────
  const onMouseDownCanvas = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-nodeid]')) return;

    // Middle click or Left click on background to pan
    if (e.button === 1 || e.button === 0) {
      // Prevent browser text-selection while panning
      e.preventDefault();
      canvasDragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startPanX: pan.x,
        startPanY: pan.y
      };
    }

    setSelectedNodeId(null);
    setDrawingEdge(null);
  };

  const startDrag = useCallback((nodeId: string, e: React.MouseEvent) => {
    // Prevent browser text-selection while dragging nodes
    e.preventDefault();
    setNodes((currentNodes) => {
      if (nodeId === 'trigger_node') {
        dragRef.current = {
          nodeId,
          startX: e.clientX,
          startY: e.clientY,
          origX: triggerPosRef.current.x,
          origY: triggerPosRef.current.y,
        };
        return currentNodes;
      } else {
        dragRef.current = {
          nodeId,
          startX: e.clientX,
          startY: e.clientY,
          origX: currentNodes[nodeId].x,
          origY: currentNodes[nodeId].y,
        };
        return currentNodes;
      }
    });
    setDraggingId(nodeId);
    setSelectedNodeId(nodeId);
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      // Node Dragging
      if (dragRef.current) {
        const { nodeId, startX, startY, origX, origY } = dragRef.current;
        const dx = (e.clientX - startX) / scaleRef.current;
        const dy = (e.clientY - startY) / scaleRef.current;
        if (nodeId === 'trigger_node') {
          setTriggerPos({ x: Math.max(0, origX + dx), y: Math.max(0, origY + dy) });
        } else {
          setNodes((prev) => ({
            ...prev,
            [nodeId]: { ...prev[nodeId], x: Math.max(0, origX + dx), y: Math.max(0, origY + dy) },
          }));
        }
      }
      // Canvas Panning
      if (canvasDragRef.current) {
        const { startX, startY, startPanX, startPanY } = canvasDragRef.current;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        setPan({ x: startPanX + dx, y: startPanY + dy });
      }
      // Edge Drawing
      if (edgeDrawingRef.current) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const rawX = e.clientX - rect.left;
          const rawY = e.clientY - rect.top;
          const mouseX = (rawX - panRef.current.x) / scaleRef.current;
          const mouseY = (rawY - panRef.current.y) / scaleRef.current;
          
          const livePath = document.getElementById('live-edge-path');
          if (livePath) {
            const { startX, startY, from } = edgeDrawingRef.current;
            if (startX !== undefined && startY !== undefined) {
              const dx = Math.abs(mouseX - startX);
              const offset = Math.max(dx / 2, 50);
              const pathStr = `M${startX},${startY} C${startX + offset},${startY} ${mouseX - offset},${mouseY} ${mouseX},${mouseY}`;
              livePath.setAttribute('d', pathStr);
            }
          }
        }
      }
    };
    const onMouseUp = () => {
      dragRef.current = null;
      canvasDragRef.current = null;
      setDraggingId(null);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); };
  }, []);

  // ── Edge Drawing ─────────────────────────────────────────────────────────────
  const startEdge = useCallback((fromId: string, branch?: string) => {
    const portElId = fromId === 'trigger_node' ? 'port-trigger_node-output' : `port-${fromId}-${branch || 'output'}`;
    const portEl = document.getElementById(portElId);
    const rect = canvasRef.current?.getBoundingClientRect();
    
    let initialX = 0;
    let initialY = 0;
    
    if (portEl && rect) {
      const portRect = portEl.getBoundingClientRect();
      const portCenterX = portRect.left + portRect.width / 2;
      const portCenterY = portRect.top + portRect.height / 2;
      
      initialX = (portCenterX - rect.left - panRef.current.x) / scaleRef.current;
      initialY = (portCenterY - rect.top - panRef.current.y) / scaleRef.current;
    }
    
    const newEdge = { from: fromId, branch, mouseX: initialX, mouseY: initialY, startX: initialX, startY: initialY };
    setDrawingEdge(newEdge);
    edgeDrawingRef.current = newEdge;
  }, []);

  const handleNodeSelectForEdge = useCallback((toId: string) => {
    const current = edgeDrawingRef.current;
    if (!current) {
      setSelectedNodeId(toId);
      return;
    }
    if (current.from !== toId) {
      const newEdge: FlowEdge = { from: current.from, to: toId, branch: current.branch as any };
      setEdges((prev) => [...prev.filter((e) => !(e.from === newEdge.from && e.branch === newEdge.branch)), newEdge]);
    }
    setDrawingEdge(null);
    edgeDrawingRef.current = null;
    setSelectedNodeId(toId);
  }, []);

  const deleteEdge = useCallback((edge: FlowEdge) => {
    setEdges((prev) => prev.filter((e) => !(e.from === edge.from && e.to === edge.to && e.branch === edge.branch)));
  }, []);

  // Cancel edge drawing on canvas click and open Edge Drop Menu
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (edgeDrawingRef.current) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setEdgeDropMenu({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          from: edgeDrawingRef.current.from,
          branch: edgeDrawingRef.current.branch
        });
      }
      setDrawingEdge(null);
      edgeDrawingRef.current = null;
    } else {
      setEdgeDropMenu(null);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    // Check if the scroll originated from inside a scrollable element or input
    let curr = e.target as HTMLElement | null;
    let isScrollable = false;

    while (curr && curr !== e.currentTarget) {
      const tag = curr.tagName.toLowerCase();
      if (tag === 'textarea' || tag === 'input' || tag === 'select') {
        isScrollable = true;
        break;
      }
      const style = window.getComputedStyle(curr);
      if (style.overflowY === 'auto' || style.overflowY === 'scroll' || style.overflowX === 'auto' || style.overflowX === 'scroll') {
        // Only count as scrollable if it actually has overflow
        if (curr.scrollHeight > curr.clientHeight || curr.scrollWidth > curr.clientWidth) {
          isScrollable = true;
          break;
        }
      }
      curr = curr.parentElement;
    }

    if (isScrollable) {
      // Let the browser handle the scroll natively for the element, don't zoom the canvas
      return;
    }

    e.preventDefault();
    const zoomSensitivity = 0.001;
    // Pabbly typically zooms IN on scroll UP (negative deltaY).
    const newScale = Math.min(Math.max(scale - e.deltaY * zoomSensitivity, 0.2), 2);

    // Zoom relative to pointer
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const localX = (mouseX - pan.x) / scale;
      const localY = (mouseY - pan.y) / scale;

      const newPanX = mouseX - localX * newScale;
      const newPanY = mouseY - localY * newScale;

      setScale(newScale);
      setPan({ x: newPanX, y: newPanY });
    }
  };

  const handleEdgeDropAddNode = (kind: NodeKind) => {
    if (!edgeDropMenu) return;
    // Calculate local canvas coords for the new node based on the drop menu screen coords
    const localX = (edgeDropMenu.x - pan.x) / scale;
    const localY = (edgeDropMenu.y - pan.y) / scale;

    const id = genId();
    const typeDef = NODE_TYPES.find((t) => t.kind === kind);

    // Add Node
    setNodes((prev) => ({
      ...prev,
      [id]: { kind, x: localX, y: localY, ...typeDef?.defaultData } as FlowNode,
    }));

    // Add connecting edge
    const newEdge: FlowEdge = { from: edgeDropMenu.from, to: id, branch: edgeDropMenu.branch as any };
    setEdges((prev) => [...prev, newEdge]);

    setEdgeDropMenu(null);
    setSelectedNodeId(id);
  };

  // ── Node Config ──────────────────────────────────────────────────────────────
  const updateNode = useCallback((id: string, patch: Partial<FlowNode>) => {
    setNodes((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }, []);

  const handleNodeChange = useCallback((id: string, patch: any) => {
    setNodes((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }, []);

  const handleDuplicateNode = useCallback((id: string) => {
    setNodes(prev => {
      const nodeToDuplicate = prev[id];
      if (!nodeToDuplicate) return prev;
      const newId = genId();
      return {
        ...prev,
        [newId]: {
          ...nodeToDuplicate,
          x: nodeToDuplicate.x + 40,
          y: nodeToDuplicate.y + 40,
        },
      };
    });
  }, []);

  const handleDeleteNode = useCallback((id: string) => {
    setNodes((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setEdges((prev) => prev.filter((e) => e.from !== id && e.to !== id));
    setSelectedNodeId((prev) => (prev === id ? null : prev));
  }, []);

  const updateBlock = useCallback((nodeId: string, blockId: string, patch: Record<string, any>) => {
    setNodes((prev) => {
      const node = prev[nodeId];
      if (!node || !node.blocks) return prev;
      return {
        ...prev,
        [nodeId]: {
          ...node,
          blocks: node.blocks.map(b => b.id === blockId ? { ...b, data: { ...b.data, ...patch } } : b)
        }
      };
    });
  }, []);

  const addBlock = useCallback((nodeId: string, kind: NodeKind) => {
    const typeDef = NODE_TYPES.find((t) => t.kind === kind);
    setNodes((prev) => {
      const node = prev[nodeId];
      if (!node) return prev;

      let currentBlocks = node.blocks;
      if (!currentBlocks) {
        // Migrate old flat data to the first block so it isn't lost
        currentBlocks = [{ id: genId(), kind: node.kind, data: { ...node } }];
      }

      return {
        ...prev,
        [nodeId]: {
          ...node,
          blocks: [...currentBlocks, { id: genId(), kind, data: { ...typeDef?.defaultData } }]
        }
      };
    });
  }, []);

  const deleteBlock = useCallback((nodeId: string, blockId: string) => {
    setNodes((prev) => {
      const node = prev[nodeId];
      if (!node || !node.blocks) return prev;
      return {
        ...prev,
        [nodeId]: {
          ...node,
          blocks: node.blocks.filter((b) => b.id !== blockId)
        }
      };
    });
  }, []);

  const deleteNode = useCallback((id: string) => {
    setNodes((prev) => { const n = { ...prev }; delete n[id]; return n; });
    setEdges((prev) => prev.filter((e) => e.from !== id && e.to !== id));
    setSelectedNodeId(null);
  }, []);

  const duplicateNode = useCallback((id: string) => {
    const nodeToCopy = nodes[id];
    if (!nodeToCopy) return;
    const newId = genId();
    setNodes((prev) => ({
      ...prev,
      [newId]: {
        ...nodeToCopy,
        x: nodeToCopy.x + 30, // Offset the copied node slightly
        y: nodeToCopy.y + 30
      }
    }));
    setSelectedNodeId(newId);
  }, [nodes]);

  // ── Save ─────────────────────────────────────────────────────────────────────
  const save = async () => {
    if (!flowName.trim()) { setSaveError('Flow name is required'); return; }
    setSaving(true);
    setSaveError('');
    try {
      const payload = { name: flowName, trigger, nodes, edges };
      const currentFlowId = savedFlowId ?? initialFlow?.id;
      const url = currentFlowId ? `${API}/${currentFlowId}` : API;
      const method = currentFlowId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: headers(), body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(await res.text());
      const savedRes: Flow = await res.json();
      const newFlowId = savedRes.id;
      // Store the returned flow ID so subsequent saves use PUT and
      // webhook generation becomes available immediately (no page reload needed).
      if (newFlowId) setSavedFlowId(newFlowId);

      if (trigger.event === 'webhook' && newFlowId) {
        await fetch(`${API}/${newFlowId}/trigger`, {
          method: 'PATCH',
          headers: headers(),
          body: JSON.stringify({
            trigger_type: 'webhook',
            trigger_event_names: trigger.triggerEventNames || []
          })
        });
        setTriggerRefreshKey(prev => prev + 1);
      }

      onSaved(savedRes);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      setSaveError(e.message || 'Failed to save flow');
    } finally {
      setSaving(false);
    }
  };


  const startNodeId = getStartNodeId();
  const selectedNode = selectedNodeId ? nodes[selectedNodeId] : null;
  const keywordStr = (trigger.keywords || []).join(', ');

  return (
    <div className="flex flex-col h-full w-full">
      {/* ── Top bar ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 dark:bg-gray-950 flex-shrink-0">
        <button onClick={onCancel} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:bg-gray-800 transition">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex-1 flex items-center gap-2">
          <div className="relative group flex items-center">
            <input
              className="text-[15px] font-bold bg-gray-50 dark:bg-gray-800 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-brand-300 focus:border-brand-500 focus:bg-white dark:focus:bg-gray-800 rounded-lg outline-none text-gray-900 dark:text-white placeholder-gray-400 transition-all w-64 px-3 py-1.5 pr-8 shadow-sm"
              value={flowName}
              onChange={(e) => setFlowName(e.target.value)}
              placeholder="Flow name..."
              title="Click to rename flow"
            />
            <svg className="w-4 h-4 text-gray-400 absolute right-2.5 pointer-events-none group-hover:text-brand-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
        </div>
        {saveError && <span className="text-xs text-error-500">{saveError}</span>}
        <button
          onClick={save}
          disabled={saving || saved}
          className={`inline-flex items-center gap-2 text-white px-4 py-2 rounded-xl text-sm font-medium transition shadow-md ${saved ? 'bg-green-500 shadow-green-500/20' : 'bg-brand-500 hover:bg-brand-600 shadow-brand-500/20 disabled:opacity-60'}`}
        >
          {saving ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : saved ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
          )}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Flow'}
        </button>
      </div>

      {/* ── Main canvas area ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Node palette */}
        <NodePalette onAddNode={addNode} />

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="flex-1 relative overflow-hidden bg-gray-50 dark:bg-gray-800 dark:bg-gray-950 canvas-dots"
          style={{
            backgroundImage: 'radial-gradient(circle, var(--dot-color) 1px, transparent 1px)',
            backgroundSize: `${28 * scale}px ${28 * scale}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
            cursor: (canvasDragRef.current || draggingId) ? 'grabbing' : 'auto',
            // Always prevent text selection on the canvas — inputs/textareas inside nodes
            // override this naturally so they remain fully functional.
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
          onMouseDown={onMouseDownCanvas}
          onClick={handleCanvasClick}
          onWheel={handleWheel}
        >
          {/* Zoom/Pan Workspace Container */}
          <div
            className="absolute inset-0 transform-gpu origin-top-left"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
          >
            {/* Edge SVG layer */}
            <EdgeLayer
          nodes={nodes}
          edges={edges}
          drawingEdge={drawingEdge}
          onClickEdge={deleteEdge}
          triggerPos={triggerPos}
        />

            {/* Trigger Node */}
            <TriggerNode
            key={`trigger-${triggerRefreshKey}`}
            flowId={savedFlowId ?? initialFlow?.id}
            trigger={trigger}
            x={triggerPos.x}
            y={triggerPos.y}
            dragging={draggingId === 'trigger_node'}
            onDragStart={(e) => startDrag('trigger_node', e)}
            onChange={setTrigger}
            onStartEdge={startEdge}
        />

            {/* Nodes */}
            {Object.entries(nodes).map(([id, node]) => (
              <NodeCard
                key={id}
                id={id}
                node={node}
                flowId={initialFlow?.id}
                isSelected={selectedNodeId === id}
                isStart={id === startNodeId}
                dragging={draggingId === id}
                onSelect={handleNodeSelectForEdge}
                onStartEdge={startEdge}
                onDragStart={(e) => startDrag(id, e)}
                onChange={updateNode}
                onChangeBlock={(blockId, patch) => updateBlock(id, blockId, patch)}
                onAddBlock={(kind) => addBlock(id, kind)}
                onDeleteBlock={(blockId) => deleteBlock(id, blockId)}
                onDelete={deleteNode}
                onDuplicate={duplicateNode}
              />
            ))}

            {/* Empty state hint */}
            {Object.keys(nodes).length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
                <div className="text-4xl opacity-20">⚡</div>
                <p className="text-sm text-gray-400 dark:text-gray-600 text-center max-w-xs">
                  Click a node type in the left panel to add it to the canvas, then connect them by clicking the port buttons.
                </p>
              </div>
            )}

            {/* Edge drawing hint */}
            {drawingEdge && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs px-3 py-1.5 rounded-full shadow-lg animate-pulse pointer-events-none">
                Click another node to connect, or click the canvas to cancel
              </div>
            )}
          </div>

          {/* Zoom Controls Overlay */}
          <div className="absolute bottom-4 left-4 flex bg-white dark:bg-gray-900 shadow-md rounded-lg border border-gray-200 dark:border-gray-700 dark:border-gray-800 p-1 gap-1">
            <button onClick={() => setScale(s => Math.max(0.2, s - 0.1))} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:bg-gray-800 rounded text-gray-500 dark:text-gray-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
            </button>
            <div className="w-12 text-center text-xs font-medium text-gray-600 dark:text-gray-400 dark:text-gray-300 flex items-center justify-center select-none">
              {Math.round(scale * 100)}%
            </div>
            <button onClick={() => setScale(s => Math.min(2, s + 0.1))} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:bg-gray-800 rounded text-gray-500 dark:text-gray-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>

          {/* Edge Drop Context Menu */}
          {edgeDropMenu && (
            <div
              className="absolute bg-white dark:bg-gray-900 shadow-xl border border-gray-100 dark:border-gray-800 rounded-xl py-2 w-64 z-50 overflow-hidden text-sm"
              style={{ left: edgeDropMenu.x, top: edgeDropMenu.y }}
            >
              <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-50 dark:border-gray-800 mb-1">
                Choose Content Type
              </div>
              <div className="max-h-64 overflow-y-auto">
                {NODE_TYPES.map((t) => (
                  <button
                    key={t.kind}
                    onClick={(e) => { e.stopPropagation(); handleEdgeDropAddNode(t.kind); }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-brand-50 dark:hover:bg-brand-500/10 hover:text-brand-600 text-left transition text-gray-700 dark:text-gray-300"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon} />
                    </svg>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
