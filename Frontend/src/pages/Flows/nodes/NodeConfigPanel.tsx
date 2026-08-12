import { useState, useEffect } from 'react';
import type { FlowNode, NodeKind } from '../types/flow.types';
import { getNodeTypeDef } from '../types/flow.types';
import { 
  TextButtonNodeBody, MediaButtonNodeBody, ListNodeBody, 
  SingleProductNodeBody, TemplateNodeBody, ConditionNodeBody, 
  DelayNodeBody, DefaultNodeBody, CatalogNodeBody, MultiProductNodeBody,
  QuestionNodeBody, MediaQuestionNodeBody, ContactCustomFieldNodeBody,
  AddressNodeBody, LocationNodeBody, APIRequestNodeBody,
  SingleAIMessageNodeBody, AssignAIAssistantNodeBody, ConnectFlowNodeBody
} from './NodeBodies';

interface Props {
  nodeId: string | null;
  node: FlowNode | null;
  templates: { id: string; name: string }[];
  onChange: (id: string, updated: Partial<FlowNode>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export default function NodeConfigPanel({ nodeId, node, templates, onChange, onDelete, onClose }: Props) {
  const [local, setLocal] = useState<Partial<FlowNode>>({});

  useEffect(() => {
    setLocal(node ? { ...node } : {});
  }, [nodeId, node]);

  if (!node || !nodeId) {
    return (
      <div className="w-64 bg-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-2xl">🔍</div>
        <p className="text-sm text-gray-400 dark:text-gray-500">Select a node on the canvas to configure it</p>
      </div>
    );
  }

  const typeDef = getNodeTypeDef(node.kind);
  const color = typeDef?.category === 'message' ? '#10b981' : '#059669';

  const update = (patch: Partial<FlowNode>) => {
    const updated = { ...local, ...patch };
    setLocal(updated);
    onChange(nodeId, updated);
  };

  const renderFields = () => {
    const bodyProps = { 
      id: nodeId, 
      node, 
      color, 
      onStartEdge: () => {}, // unused in config panel
      onChange: (patch: Partial<FlowNode>) => update(patch) 
    };

    switch (node.kind) {
      case 'text_button': return <TextButtonNodeBody {...bodyProps} />;
      case 'send_text': return <TextButtonNodeBody {...bodyProps} />;
      case 'media_button': return <MediaButtonNodeBody {...bodyProps} />;
      case 'list': return <ListNodeBody {...bodyProps} />;
      case 'single_product': return <SingleProductNodeBody {...bodyProps} />;
      case 'multi_product': return <MultiProductNodeBody {...bodyProps} />;
      case 'catalog': return <CatalogNodeBody {...bodyProps} />;
      case 'template': return <TemplateNodeBody {...bodyProps} />;
      case 'condition': return <ConditionNodeBody {...bodyProps} />;
      case 'delay': return <DelayNodeBody {...bodyProps} />;
      case 'ask_question': return <QuestionNodeBody {...bodyProps} />;
      case 'ask_media': return <MediaQuestionNodeBody {...bodyProps} />;
      case 'set_custom_field': return <ContactCustomFieldNodeBody {...bodyProps} />;
      case 'ask_address': return <AddressNodeBody {...bodyProps} />;
      case 'ask_location': return <LocationNodeBody {...bodyProps} />;
      case 'api_request': return <APIRequestNodeBody {...bodyProps} />;
      case 'single_ai_message': return <SingleAIMessageNodeBody {...bodyProps} />;
      case 'assign_ai': return <AssignAIAssistantNodeBody {...bodyProps} />;
      case 'connect_flow': return <ConnectFlowNodeBody {...bodyProps} />;
      case 'assign_team_member':
        return (
          <div className="rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 p-3 text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
            This node will stop the automated flow and mark the conversation as needing a human reply.
          </div>
        );
      case 'end_flow':
        return (
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-3 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            The flow ends here. No further messages will be sent automatically.
          </div>
        );
      default: return <DefaultNodeBody {...bodyProps} />;
    }
  };

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:border-brand-400 dark:focus:border-brand-500 transition resize-none';

  return (
    <div className="w-80 bg-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-800" style={{ borderLeftColor: color, borderLeftWidth: 4 }}>
        <div className="w-8 h-8 rounded flex items-center justify-center bg-gray-50 dark:bg-gray-800" style={{ color }}>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={typeDef?.icon} />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">{typeDef?.label}</h3>
          <p className="text-[10px] text-gray-400 truncate">{typeDef?.description}</p>
        </div>
        <button onClick={onClose} className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Custom Label */}
      <div className="px-3 pt-3">
        <Field label="Node label (optional)">
          <input
            className={inputCls}
            value={(local as any).label || ''}
            onChange={(e) => update({ label: e.target.value } as any)}
            placeholder={typeDef?.label}
          />
        </Field>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-3">
        {renderFields()}
      </div>

      {/* Delete */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={() => onDelete(nodeId)}
          className="w-full py-2 rounded-lg border border-error-200 dark:border-error-800 text-error-600 dark:text-error-400 text-xs font-medium hover:bg-error-50 dark:hover:bg-error-900/20 transition"
        >
          Delete Node
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

