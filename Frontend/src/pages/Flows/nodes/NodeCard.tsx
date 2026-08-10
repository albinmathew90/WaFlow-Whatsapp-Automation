import React, { useState } from 'react';
import { getNodeTypeDef, NODE_TYPES } from '../types/flow.types';
import type { FlowNode, NodeKind } from '../types/flow.types';

interface Props {
  id: string;
  node: FlowNode;
  isSelected: boolean;
  isStart: boolean;
  onSelect: (id: string) => void;
  onStartEdge: (fromId: string, branch?: string, startClientX?: number, startClientY?: number) => void;
  onDragStart: (e: React.MouseEvent) => void;
  dragging: boolean;
  onChange: (id: string, patch: Partial<FlowNode>) => void;
  onChangeBlock: (blockId: string, patch: Record<string, any>) => void;
  onAddBlock: (kind: NodeKind) => void;
  onDeleteBlock: (blockId: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

import { 
  TextButtonNodeBody, MediaButtonNodeBody, ListNodeBody, 
  SingleProductNodeBody, TemplateNodeBody, ConditionNodeBody, 
  DelayNodeBody, DefaultNodeBody, CatalogNodeBody, MultiProductNodeBody,
  QuestionNodeBody, MediaQuestionNodeBody, ContactCustomFieldNodeBody,
  AddressNodeBody, LocationNodeBody, APIRequestNodeBody,
  SingleAIMessageNodeBody, AssignAIAssistantNodeBody, ConnectFlowNodeBody
} from './NodeBodies';

const NodeCardComponent = ({ id, node, isSelected, isStart, onSelect, onStartEdge, onDragStart, dragging, onChange, onChangeBlock, onAddBlock, onDeleteBlock, onDelete, onDuplicate }: Props) => {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const typeDef = getNodeTypeDef(node.kind);
  const isMessage = typeDef?.category === 'message';
  const color = isMessage ? '#10b981' : '#3b82f6';
  const isCondition = node.kind === 'condition';
  const isTerminal = node.kind === 'end_flow';

  const renderBody = (kind: NodeKind, bodyProps: any) => {
    switch (kind) {
      case 'text_button': return <TextButtonNodeBody {...bodyProps} />;
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
      default: return <DefaultNodeBody {...bodyProps} />;
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: node.x,
        top: node.y,
        zIndex: isSelected ? 20 : 10,
      }}
      className={`group`}
      data-nodeid={id}
      onMouseUp={() => {
        onSelect(id);
      }}
    >
      <div
        id={`node-${id}`}
        className={`
          relative w-[320px] rounded-xl shadow-lg border transition-all duration-150
          ${isSelected
            ? 'border-brand-500 shadow-brand-500/20 shadow-xl scale-[1.02]'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 hover:shadow-xl'
          }
          bg-white dark:bg-gray-900 flex flex-col
        `}
        style={{ borderTopColor: color, borderTopWidth: 4 }}
      >

        {/* Header (Drag Handle) */}
        <div 
          className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 cursor-grab active:cursor-grabbing select-none"
          onMouseDown={(e) => {
            if ((e.target as HTMLElement).tagName.toLowerCase() !== 'button' && !(e.target as HTMLElement).closest('button')) {
              onDragStart(e);
            }
          }}
        >
          <div className="flex items-center justify-center text-gray-400 mr-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5a2 2 0 100-4 2 2 0 000 4zm0 8a2 2 0 100-4 2 2 0 000 4zm0 8a2 2 0 100-4 2 2 0 000 4zm8-16a2 2 0 100-4 2 2 0 000 4zm0 8a2 2 0 100-4 2 2 0 000 4zm0 8a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
          </div>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={typeDef?.icon} />
          </svg>
          <span className="text-[13px] font-bold text-gray-800 dark:text-gray-100 flex-1">
            {node.label || typeDef?.label}
          </span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onMouseDown={(e) => { e.stopPropagation(); onDuplicate(id); }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition cursor-pointer"
              title="Duplicate node"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button 
              onMouseDown={(e) => { e.stopPropagation(); onDelete(id); }}
              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-gray-400 hover:text-red-500 transition cursor-pointer"
              title="Delete node"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body Forms */}
        {node.blocks && node.blocks.length > 0 ? (
          <div className="flex flex-col">
            {node.blocks.map((block, index) => (
              <div key={block.id} className="relative group/block">
                {renderBody(block.kind, { 
                  id, 
                  node: block.data, 
                  onStartEdge, 
                  color, 
                  onChange: (patch: Record<string, any>) => onChangeBlock(block.id, patch) 
                })}
                {index > 0 && (
                  <button 
                    onMouseDown={(e) => { e.stopPropagation(); onDeleteBlock(block.id); }}
                    className="absolute top-4 right-4 p-1 bg-white dark:bg-gray-900 rounded text-gray-400 hover:bg-red-100 hover:text-red-500 opacity-0 group-hover/block:opacity-100 transition z-10 shadow-sm border border-gray-100 dark:border-gray-800 cursor-pointer"
                    title="Delete block"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col">
            {renderBody(node.kind, { id, node, onStartEdge, color, onChange: (patch: Partial<FlowNode>) => onChange(id, patch) })}
          </div>
        )}

        {/* Add Content Button */}
        {isMessage && (
          <div className="px-3 pb-3 relative">
            <button
              onMouseDown={(e) => { e.stopPropagation(); setShowAddMenu(!showAddMenu); }}
              className="w-full py-1.5 flex justify-center items-center gap-1 text-[12px] font-bold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition cursor-pointer bg-white dark:bg-gray-800"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>
              Add Content
            </button>
            
            {showAddMenu && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="p-2 border-b border-gray-100 dark:border-gray-800 text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  Choose Content Type
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {NODE_TYPES.filter(t => t.category === 'message').map(t => (
                    <button
                      key={t.kind}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        onAddBlock(t.kind);
                        setShowAddMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-brand-50 dark:hover:bg-brand-500/10 hover:text-brand-600 text-left transition text-[13px] text-gray-700 dark:text-gray-300 cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={t.icon} />
                      </svg>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Generic Output Port for non-terminal, non-condition nodes */}
        {!isTerminal && !isCondition && (
          <div className="px-3 pb-3 relative">
            <div className="w-full py-2 px-3 flex justify-between items-center border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <span className="text-[12px] font-bold text-gray-700 dark:text-gray-300">Continue Flow</span>
            </div>
            {/* The actual port handle (on the right edge of the card) */}
            <button
              id={`port-${id}-output`}
              onMouseDown={(e) => { e.stopPropagation(); onStartEdge(id, undefined, e.clientX, e.clientY); }}
              className="absolute right-[-7px] bottom-[26px] w-4 h-4 rounded-full border-[2.5px] bg-white hover:scale-125 transition-transform shadow-sm cursor-crosshair z-20"
              style={{ borderColor: color }}
              title="Drag to connect"
            />
          </div>
        )}

        {/* Input port */}
        {!isStart && (
          <div
            className="absolute top-8 -left-2 w-4 h-4 rounded-full border-[2.5px] bg-white shadow-sm z-20 pointer-events-none"
            style={{ borderColor: color }}
          />
        )}
      </div>
    </div>
  );
};

export default React.memo(NodeCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.id === nextProps.id &&
    prevProps.node === nextProps.node &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isStart === nextProps.isStart &&
    prevProps.dragging === nextProps.dragging
  );
});
