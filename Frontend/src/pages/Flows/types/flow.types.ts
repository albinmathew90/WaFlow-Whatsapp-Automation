// ─── Flow Type Definitions ────────────────────────────────────────────────────
// These mirror the backend CrmFlow entity / FlowRunnerService node kinds.

export type TriggerEvent = 'keyword' | 'any' | 'template_selected' | 'payment_capture';

export interface FlowTrigger {
  event: TriggerEvent;
  keywords?: string[];
  caseSensitive?: boolean;
  regex?: string;
  skipTrigger?: boolean;
  selectedTemplate?: any;
}

// ─── Node Kinds ───────────────────────────────────────────────────────────────

// ─── Node Kinds ───────────────────────────────────────────────────────────────

export type NodeKind =
  | 'send_text'
  | 'text_button'
  | 'media_button'
  | 'list'
  | 'catalog'
  | 'single_product'
  | 'multi_product'
  | 'template'
  | 'whatsapp_pay'
  | 'condition'
  | 'ask_address'
  | 'ask_location'
  | 'ask_question'
  | 'ask_media'
  | 'set_custom_field'
  | 'api_request'
  | 'connect_flow'
  | 'end_flow';

export interface ButtonDef {
  id: string;
  name: string;
  type: 'quick_reply' | 'link';
  url?: string;
}

export interface FlowBlock {
  id: string;
  kind: NodeKind;
  data: Record<string, any>;
}

export interface FlowNodeBase {
  kind: NodeKind;
  label?: string;
  x: number;
  y: number;
  blocks?: FlowBlock[];
}

export type FlowNode = FlowNodeBase & Record<string, any>; // Relaxed typing for new nodes for now

// ─── Edge ─────────────────────────────────────────────────────────────────────

export interface FlowEdge {
  from: string;
  to: string;
  branch?: 'true' | 'false' | string; // for condition/list nodes
}

// ─── Full Flow ────────────────────────────────────────────────────────────────

export interface Flow {
  id: string;
  name: string;
  enabled: boolean;
  trigger: FlowTrigger;
  nodes: Record<string, FlowNode>;
  edges: FlowEdge[];
  createdAt: string;
  updatedAt: string;
}

// ─── Node Metadata (for UI palette) ──────────────────────────────────────────

export interface NodeTypeDef {
  kind: NodeKind;
  label: string;
  description: string;
  category: 'message' | 'action';
  icon: string;
  defaultData: Partial<FlowNode>;
}

export const NODE_TYPES: NodeTypeDef[] = [
  // MESSAGES TAB
  { kind: 'text_button', label: 'Text Button', description: 'Send text with buttons', category: 'message', icon: 'M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.773 2.897M5.136 7.965l-2.898-.772M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122', defaultData: { message: '' } },
  { kind: 'media_button', label: 'Media Button', description: 'Send image/video/audio', category: 'message', icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z', defaultData: {} },
  { kind: 'list', label: 'List', description: 'Interactive list menu', category: 'message', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16', defaultData: {} },
  { kind: 'catalog', label: 'Catalog Message', description: 'Send full catalog', category: 'message', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', defaultData: {} },
  { kind: 'single_product', label: 'Single Product', description: 'Send one product', category: 'message', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', defaultData: {} },
  { kind: 'multi_product', label: 'Multi Product', description: 'Send multiple products', category: 'message', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z', defaultData: {} },
  { kind: 'template', label: 'Template', description: 'Send approved template', category: 'message', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15', defaultData: {} },
  { kind: 'whatsapp_pay', label: 'WhatsApp Pay', description: 'Payment request', category: 'message', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z', defaultData: {} },

  // ACTIONS TAB
  { kind: 'condition', label: 'Condition', description: 'If/Else routing', category: 'action', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4', defaultData: {} },
  { kind: 'ask_address', label: 'Ask Address', description: 'Request shipping address', category: 'action', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z', defaultData: {} },
  { kind: 'ask_location', label: 'Ask Location', description: 'Request live location', category: 'action', icon: 'M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9', defaultData: {} },
  { kind: 'ask_question', label: 'Ask Question', description: 'Custom text input', category: 'action', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', defaultData: {} },
  { kind: 'ask_media', label: 'Ask Media', description: 'Request file upload', category: 'action', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12', defaultData: {} },
  { kind: 'set_custom_field', label: 'Set Custom Field', description: 'Save data to contact', category: 'action', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', defaultData: {} },
  { kind: 'api_request', label: 'API Request', description: 'Call external webhook', category: 'action', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1', defaultData: {} },
  { kind: 'connect_flow', label: 'Connect Flow', description: 'Jump to another flow', category: 'action', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1', defaultData: {} },
  { kind: 'end_flow', label: 'End Flow', description: 'Stop the conversation flow', category: 'action', icon: 'M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM12 10.5h.008v3.75H12V10.5z', defaultData: {} },
];

export function getNodeTypeDef(kind: NodeKind): NodeTypeDef | undefined {
  return NODE_TYPES.find((n) => n.kind === kind);
}
