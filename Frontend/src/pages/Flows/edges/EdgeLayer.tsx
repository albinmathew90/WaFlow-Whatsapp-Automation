import type { FlowEdge, FlowNode } from '../types/flow.types';

const NODE_WIDTH = 320;
const TRIGGER_NODE = { width: 320, height: 180 };

interface Props {
  nodes: Record<string, FlowNode>;
  edges: FlowEdge[];
  drawingEdge: { from: string; branch?: string; mouseX: number; mouseY: number; startX?: number; startY?: number } | null;
  onClickEdge: (edge: FlowEdge) => void;
  triggerPos: { x: number; y: number };
}

function getPortPos(nodeId: string, node: FlowNode | undefined, side: string, triggerPos?: { x: number; y: number }) {
  if (nodeId === 'trigger_node' && triggerPos) {
    return { x: triggerPos.x + TRIGGER_NODE.width - 20, y: triggerPos.y + 26 };
  }

  if (!node) return { x: 0, y: 0 };

  // Try exact DOM lookup
  const portEl = document.getElementById(`port-${nodeId}-${side}`);
  const nodeEl = document.getElementById(`node-${nodeId}`);
  if (portEl && nodeEl) {
    const portRect = portEl.getBoundingClientRect();
    const nodeRect = nodeEl.getBoundingClientRect();
    // Calculate the ratio because nodeRect might be scaled by FlowCanvas zoom
    const scale = nodeRect.width / NODE_WIDTH;
    const dx = (portRect.left - nodeRect.left + portRect.width / 2) / scale;
    const dy = (portRect.top - nodeRect.top + portRect.height / 2) / scale;
    return { x: node.x + dx, y: node.y + dy };
  }

  // Fallback to estimation
  const nodeHeight = estimateNodeHeight(node);
  if (side === 'input') return { x: node.x, y: node.y + (nodeHeight / 2) };
  return { x: node.x + NODE_WIDTH, y: node.y + (nodeHeight / 2) }; // Default to right edge
}

function estimateNodeHeight(node: FlowNode): number {
  if (node.kind === 'condition') return 180;
  if (node.kind === 'send_text' || node.kind === 'ask_question') return 240;
  if (node.kind === 'send_media') return 400;
  if (node.kind === 'list') return 360;
  if (node.kind === 'multi_product') return 380;
  return 200;
}

function bezierPath(x1: number, y1: number, x2: number, y2: number, isVertical = false): string {
  if (isVertical) {
    const dy = Math.abs(y2 - y1);
    const cp = Math.max(dy * 0.5, 80);
    return `M ${x1} ${y1} C ${x1} ${y1 + cp}, ${x2} ${y2 - cp}, ${x2} ${y2}`;
  } else {
    const dx = x2 - x1;
    if (dx < 0) {
      // Dragging backwards: large fixed control point to create a nice loop
      const cp = 120;
      return `M ${x1} ${y1} C ${x1 + cp} ${y1}, ${x2 - cp} ${y2}, ${x2} ${y2}`;
    }
    // Forward drag: large multiplier for a long straight start
    const cp = Math.max(dx * 0.6, 100);
    return `M ${x1} ${y1} C ${x1 + cp} ${y1}, ${x2 - cp} ${y2}, ${x2} ${y2}`;
  }
}

function getBezierMidpoint(x1: number, y1: number, x2: number, y2: number, isVertical = false) {
  let cp1x, cp1y, cp2x, cp2y;
  if (isVertical) {
    const dy = Math.abs(y2 - y1);
    const cp = Math.max(dy * 0.5, 80);
    cp1x = x1; cp1y = y1 + cp;
    cp2x = x2; cp2y = y2 - cp;
  } else {
    const dx = x2 - x1;
    const cp = dx < 0 ? 120 : Math.max(dx * 0.6, 100);
    cp1x = x1 + cp; cp1y = y1;
    cp2x = x2 - cp; cp2y = y2;
  }
  // Cubic Bezier at t=0.5
  return {
    x: 0.125 * x1 + 0.375 * cp1x + 0.375 * cp2x + 0.125 * x2,
    y: 0.125 * y1 + 0.375 * cp1y + 0.375 * cp2y + 0.125 * y2
  };
}

export default function EdgeLayer({ nodes, edges, drawingEdge, onClickEdge, triggerPos }: Props) {
  return (
    <svg
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none', zIndex: 1 }}
    >
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="#94a3b8" />
        </marker>
        <marker id="arrow-true" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="#10b981" />
        </marker>
        <marker id="arrow-false" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="#ef4444" />
        </marker>
      </defs>

      {edges.map((edge, i) => {
        const fromNode = nodes[edge.from];
        const toNode = nodes[edge.to];

        // Trigger node isn't in 'nodes' record, it's rendered separately
        if (edge.from !== 'trigger_node' && !fromNode) return null;
        if (!toNode) return null;

        const fromPort = getPortPos(edge.from, fromNode, (edge.branch as any) || 'output', triggerPos);
        const toPort = getPortPos(edge.to, toNode, 'input');
        const isTrigger = edge.from === 'trigger_node';
        const path = bezierPath(fromPort.x, fromPort.y, toPort.x, toPort.y, isTrigger);
        const mid = getBezierMidpoint(fromPort.x, fromPort.y, toPort.x, toPort.y, isTrigger);

        const isTrue = edge.branch === 'true';
        const isFalse = edge.branch === 'false';
        const marker = isTrue ? 'url(#arrow-true)' : isFalse ? 'url(#arrow-false)' : 'url(#arrow)';
        const strokeColor = isTrue ? '#10b981' : isFalse ? '#ef4444' : '#94a3b8';

        return (
          <g key={i} className="group cursor-pointer" style={{ pointerEvents: 'all' }}>
            {/* Invisible thick path for easier hovering/clicking */}
            <path
              d={path}
              fill="none"
              stroke="transparent"
              strokeWidth={30}
              onClick={() => onClickEdge(edge)}
            />
            {/* The visible line */}
            <path d={path} fill="none" stroke={strokeColor} strokeWidth={2} markerEnd={marker} className="group-hover:stroke-brand-500 transition-colors pointer-events-none" />

            {/* Branch Label */}
            {edge.branch && (() => {
              const mx = (fromPort.x + toPort.x) / 2;
              const my = (fromPort.y + toPort.y) / 2;
              return (
                <text x={mx} y={my - 4} textAnchor="middle" fontSize={9} fill={strokeColor} fontWeight="bold" style={{ userSelect: 'none', pointerEvents: 'none' }}>
                  {edge.branch.toUpperCase()}
                </text>
              );
            })()}

            {/* Delete Cross Icon (visible on hover of the edge) */}
            <g
              transform={`translate(${mid.x}, ${mid.y})`}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => { e.stopPropagation(); onClickEdge(edge); }}
              style={{ cursor: 'pointer' }}
            >
              <circle r="8" fill="white" stroke="#ef4444" strokeWidth="1.5" />
              <path d="M-3 -3 L3 3 M-3 3 L3 -3" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
            </g>
          </g>
        );
      })}

      {/* Live drawing edge */}
      {drawingEdge && (drawingEdge.from === 'trigger_node' || nodes[drawingEdge.from]) && (() => {
        let startX = drawingEdge.startX;
        let startY = drawingEdge.startY;

        if (startX === undefined || startY === undefined) {
          const fromNode = nodes[drawingEdge.from];
          const fromPort = getPortPos(drawingEdge.from, fromNode, (drawingEdge.branch as any) || 'output', triggerPos);
          startX = fromPort.x;
          startY = fromPort.y;
        }

        const path = bezierPath(startX, startY, drawingEdge.mouseX, drawingEdge.mouseY, drawingEdge.from === 'trigger_node');
        return (
          <path
            id="live-edge-path"
            d={path}
            stroke="#059669"
            strokeWidth={2}
            fill="none"
            strokeDasharray="6,3"
            opacity={0.85}
          />
        );
      })()}
    </svg>
  );
}

