import { useState } from 'react';
import PageMeta from '../../components/common/PageMeta';
import FlowList from './FlowList';
import FlowCanvas from './FlowCanvas';
import type { Flow } from './types/flow.types';

type View = 'list' | 'canvas';

export default function FlowsPage() {
  const [view, setView] = useState<View>('list');
  const [editingFlow, setEditingFlow] = useState<Flow | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEdit = (flow: Flow) => {
    setEditingFlow(flow);
    setView('canvas');
  };

  const handleCreateNew = () => {
    setEditingFlow(null);
    setView('canvas');
  };

  const handleSaved = (flow: Flow) => {
    setEditingFlow(flow);
    setRefreshKey((k) => k + 1);
  };

  const handleCancel = () => {
    setView('list');
    setEditingFlow(null);
  };

  return (
    <>
      <PageMeta
        title="Flows | WhatsApp Automation"
        description="Build and manage WhatsApp automation flows — trigger keyword-based automated conversations."
      />
      {view === 'list' ? (
        <div className="flex flex-col gap-5">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Automation Flows</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Automatically respond to WhatsApp messages with smart, multi-step flows
              </p>
            </div>
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2.5 rounded-xl font-medium transition shadow-md shadow-brand-500/20 text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Flow
            </button>
          </div>


          {/* Flow list */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
            <FlowList onEdit={handleEdit} onCreateNew={handleCreateNew} refreshKey={refreshKey} />
          </div>
        </div>
      ) : (
        <div className="-m-4 md:-m-6 bg-white dark:bg-gray-900 border-none overflow-hidden" style={{ height: 'calc(100vh - 73px)' }}>
          <FlowCanvas
            initialFlow={editingFlow}
            onSaved={handleSaved}
            onCancel={handleCancel}
          />
        </div>
      )}
    </>
  );
}
