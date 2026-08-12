import { useState } from 'react';
import { NODE_TYPES } from '../types/flow.types';
import type { NodeKind } from '../types/flow.types';

interface Props {
  onAddNode: (kind: NodeKind) => void;
}

export default function NodePalette({ onAddNode }: Props) {
  const [activeTab, setActiveTab] = useState<'message' | 'action'>('message');
  const [isOpen, setIsOpen] = useState(true);

  const messageNodes = NODE_TYPES.filter((n) => n.category === 'message');
  const actionNodes = NODE_TYPES.filter((n) => n.category === 'action');
  const currentNodes = activeTab === 'message' ? messageNodes : actionNodes;

  return (
    <div className={`relative bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 h-full flex-shrink-0 shadow-sm transition-all duration-300 z-20 ${isOpen ? 'w-[252px]' : 'w-0'}`}>
      
      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="absolute top-1/2 -translate-y-1/2 w-6 h-9 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-r-lg flex items-center justify-center shadow-md z-50 text-gray-500 hover:text-brand-500 transition-colors cursor-pointer"
        style={{ right: '-25px' }}
        title={isOpen ? 'Collapse panel' : 'Expand panel'}
      >
        <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div className="w-[252px] h-full flex flex-col overflow-hidden opacity-100 transition-opacity duration-300" style={{ opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'auto' : 'none' }}>
        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <button
            onClick={() => setActiveTab('message')}
            className={`flex-1 py-3 text-[12px] font-semibold transition-colors border-b-2 ${
              activeTab === 'message'
                ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            Messages
          </button>
          <button
            onClick={() => setActiveTab('action')}
            className={`flex-1 py-3 text-[12px] font-semibold transition-colors border-b-2 ${
              activeTab === 'action'
                ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            Actions
          </button>
        </div>

        {/* Grid of Nodes */}
        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
          <div className="grid grid-cols-2 gap-2">
            {currentNodes.map((node) => (
              <button
                key={node.kind}
                onClick={() => onAddNode(node.kind)}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 hover:border-brand-200 hover:shadow-md hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all group"
              >
                <div className="w-8 h-8 mb-1.5 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center group-hover:bg-brand-100 dark:group-hover:bg-brand-900/40 transition-colors">
                  <svg className="w-4 h-4 text-gray-500 group-hover:text-brand-600 dark:text-gray-400 dark:group-hover:text-brand-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={node.icon} />
                  </svg>
                </div>
                <span className="text-[11px] font-medium text-gray-600 dark:text-gray-300 group-hover:text-brand-700 dark:group-hover:text-brand-300 text-center leading-tight transition-colors">
                  {node.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

