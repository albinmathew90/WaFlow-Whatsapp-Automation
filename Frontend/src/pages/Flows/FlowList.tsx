import { useState, useEffect, useCallback } from 'react';
import type { Flow } from './types/flow.types';
import ConfirmDeleteModal from '../../components/common/ConfirmDeleteModal';
import { Pagination } from '../../components/Pagination';

const API = '/openwa-api/crm/flows';
const getToken = () => sessionStorage.getItem('crm_token');
const headers = () => ({ Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' });

interface Props {
  onEdit: (flow: Flow) => void;
  onCreateNew: () => void;
  refreshKey: number;
}

export default function FlowList({ onEdit, onCreateNew, refreshKey }: Props) {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteModalConfig, setDeleteModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    itemName: string;
    onConfirm: () => void;
  } | null>(null);

  const fetchFlows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API, { headers: headers() });
      if (res.ok) setFlows(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedFlows = flows.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => { fetchFlows(); }, [fetchFlows, refreshKey]);

  const toggleEnabled = async (flow: Flow) => {
    setTogglingId(flow.id);
    try {
      const endpoint = flow.enabled ? 'disable' : 'enable';
      const res = await fetch(`${API}/${flow.id}/${endpoint}`, { method: 'POST', headers: headers() });
      if (res.ok) setFlows((prev) => prev.map((f) => f.id === flow.id ? { ...f, enabled: !f.enabled } : f));
    } finally {
      setTogglingId(null);
    }
  };

  const executeDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`${API}/${id}`, { method: 'DELETE', headers: headers() });
      setFlows((prev) => prev.filter((f) => f.id !== id));
    } finally {
      setDeletingId(null);
      setDeleteModalConfig(null);
    }
  };

  const triggerLabel = (flow: Flow) => {
    if (flow.trigger.event === 'any') return 'Any Message';
    return `Keywords: ${(flow.trigger.keywords || []).join(', ')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (flows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/30 dark:to-brand-800/20 flex items-center justify-center text-4xl shadow-inner">
          ⚡
        </div>
        <div className="text-center">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No flows yet</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
            Create your first automation flow to automatically respond to incoming WhatsApp messages.
          </p>
        </div>
        <button
          onClick={onCreateNew}
          className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl font-medium transition shadow-md shadow-brand-500/20 text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Create First Flow
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-100 dark:border-gray-800 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            <th className="py-3 px-4 font-semibold w-24">Status</th>
            <th className="py-3 px-4 font-semibold">Flow Name</th>
            <th className="py-3 px-4 font-semibold">Trigger</th>
            <th className="py-3 px-4 font-semibold">Created</th>
            <th className="py-3 px-4 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {paginatedFlows.map((flow) => {
            const nodeCount = Object.keys(flow.nodes || {}).length;
            const createdDate = flow.createdAt ? new Date(flow.createdAt).toLocaleDateString() : 'N/A';
            return (
              <tr key={flow.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group">
                <td className="py-4 px-4 align-middle">
                  {/* Enable/Disable Toggle */}
                  <button
                    onClick={() => toggleEnabled(flow)}
                    disabled={togglingId === flow.id}
                    title={flow.enabled ? 'Disable flow' : 'Enable flow'}
                    className={`relative w-10 h-5 rounded-full flex-shrink-0 transition-colors duration-200 focus:outline-none ${flow.enabled ? 'bg-success-500' : 'bg-gray-300 dark:bg-gray-700'} ${togglingId === flow.id ? 'opacity-50' : ''}`}
                  >
                    <span className={`absolute top-[2px] left-[2px] w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${flow.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </td>
                <td className="py-4 px-4 align-middle">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/30 dark:to-brand-800/20 flex items-center justify-center text-xl flex-shrink-0">
                      ⚡
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">{flow.name}</h3>
                      <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-0.5">{nodeCount} node{nodeCount !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 align-middle">
                  <span className="text-[12px] text-gray-600 dark:text-gray-400 font-medium bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
                    {triggerLabel(flow)}
                  </span>
                </td>
                <td className="py-4 px-4 align-middle">
                  <span className="text-[13px] text-gray-500 dark:text-gray-400">{createdDate}</span>
                </td>
                <td className="py-4 px-4 align-middle text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Edit */}
                    <button
                      onClick={() => onEdit(flow)}
                      className="p-2 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition"
                      title="Edit flow"
                    >
                      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    {/* Delete */}
                    <button
                      onClick={() => {
                        setDeleteModalConfig({
                          isOpen: true,
                          title: 'Delete Flow',
                          itemName: flow.name,
                          onConfirm: () => executeDelete(flow.id),
                        });
                      }}
                      disabled={deletingId === flow.id}
                      className="p-2 rounded-lg text-gray-400 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 transition"
                      title="Delete flow"
                    >
                      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {flows.length > 0 && (
        <Pagination
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
          totalItems={flows.length}
        />
      )}

      {deleteModalConfig && (
        <ConfirmDeleteModal
          isOpen={deleteModalConfig.isOpen}
          onClose={() => setDeleteModalConfig(null)}
          onConfirm={deleteModalConfig.onConfirm}
          title={deleteModalConfig.title}
          itemName={deleteModalConfig.itemName}
        />
      )}
    </div>
  );
}
