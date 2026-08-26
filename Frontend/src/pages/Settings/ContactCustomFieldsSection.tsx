import React, { useState, useEffect } from 'react';
import ConfirmDeleteModal from '../../components/common/ConfirmDeleteModal';

export interface CustomField {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export default function ContactCustomFieldsSection() {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);

  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldDesc, setNewFieldDesc] = useState('');

  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editFieldName, setEditFieldName] = useState('');
  const [editFieldDesc, setEditFieldDesc] = useState('');

  const [deleteModalConfig, setDeleteModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    itemName: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    setLoading(true);
    try {
      const token = (sessionStorage.getItem('crm_token') || localStorage.getItem('crm_token'));
      const res = await fetch('/openwa-api/crm/custom-fields', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFields(data.map((f: any) => ({
          id: f.id,
          name: f.name,
          description: f.description || '',
          createdAt: new Date(f.createdAt).toLocaleDateString()
        })));
      }
    } catch (e) {
      console.error("Failed to load custom fields", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddField = async () => {
    if (!newFieldName.trim()) return;
    
    // Check for spaces
    if (newFieldName.includes(' ')) {
      alert("Field Name cannot contain spaces.");
      return;
    }

    try {
      const token = (sessionStorage.getItem('crm_token') || localStorage.getItem('crm_token'));
      const res = await fetch('/openwa-api/crm/custom-fields', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name: newFieldName.trim(),
          description: newFieldDesc.trim() 
        })
      });

      if (res.ok) {
        const data = await res.json();
        setFields([...fields, {
          id: data.id,
          name: data.name,
          description: data.description || '',
          createdAt: new Date(data.createdAt).toLocaleDateString()
        }]);
        setNewFieldName('');
        setNewFieldDesc('');
      }
    } catch (e) {
      console.error("Failed to create custom field", e);
    }
  };

  const handleDeleteField = async (id: string) => {
    try {
      const token = (sessionStorage.getItem('crm_token') || localStorage.getItem('crm_token'));
      const res = await fetch(`/openwa-api/crm/custom-fields/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setFields(fields.filter(f => f.id !== id));
      }
    } catch (e) {
      console.error("Failed to delete custom field", e);
    }
  };

  const startEditing = (field: CustomField) => {
    setEditingFieldId(field.id);
    setEditFieldName(field.name);
    setEditFieldDesc(field.description);
  };

  const cancelEditing = () => {
    setEditingFieldId(null);
    setEditFieldName('');
    setEditFieldDesc('');
  };

  const handleUpdateField = async (id: string) => {
    if (!editFieldName.trim()) return;
    
    if (editFieldName.includes(' ')) {
      alert("Field Name cannot contain spaces.");
      return;
    }

    try {
      const token = (sessionStorage.getItem('crm_token') || localStorage.getItem('crm_token'));
      const res = await fetch(`/openwa-api/crm/custom-fields/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editFieldName.trim(),
          description: editFieldDesc.trim()
        })
      });

      if (res.ok) {
        setFields(fields.map(f => f.id === id ? {
          ...f,
          name: editFieldName.trim(),
          description: editFieldDesc.trim()
        } : f));
        cancelEditing();
      }
    } catch (e) {
      console.error("Failed to update custom field", e);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col border-b border-gray-200 px-6 py-5 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Contact Custom Fields</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Fields store custom values from the Contacts page and dynamic variables. These custom fields can be used in your flows for advanced routing and data capture.
          </p>
        </div>

        <div className="p-6">
          <div className="flex flex-col gap-4">
            {loading ? (
              <div className="text-sm text-gray-500">Loading fields...</div>
            ) : fields.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">No custom fields created yet.</p>
              </div>
            ) : (
              fields.map(field => (
                <div key={field.id} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/30">
                  {editingFieldId === field.id ? (
                    <>
                      <div className="flex-1 w-full">
                        <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Field Name</label>
                        <input
                          type="text"
                          value={editFieldName}
                          onChange={(e) => setEditFieldName(e.target.value.replace(/\s/g, ''))}
                          className="w-full text-sm px-3 py-2 border border-brand-500 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none"
                        />
                      </div>
                      <div className="flex-1 w-full">
                        <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Field Description</label>
                        <input
                          type="text"
                          value={editFieldDesc}
                          onChange={(e) => setEditFieldDesc(e.target.value)}
                          className="w-full text-sm px-3 py-2 border border-brand-500 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none"
                        />
                      </div>
                      <div className="mt-6 sm:mt-0 pt-1 flex items-center gap-2">
                        <button 
                          onClick={() => handleUpdateField(field.id)}
                          disabled={!editFieldName.trim()}
                          className="text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 p-2 rounded-lg transition disabled:opacity-50"
                          title="Save Field"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </button>
                        <button 
                          onClick={cancelEditing}
                          className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-2 rounded-lg transition"
                          title="Cancel"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 w-full">
                        <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Field Name</label>
                        <div className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 font-mono">
                          {field.name}
                        </div>
                      </div>
                      <div className="flex-1 w-full">
                        <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Field Description</label>
                        <div className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 truncate">
                          {field.description || '-'}
                        </div>
                      </div>
                      <div className="mt-6 sm:mt-0 pt-1 flex items-center gap-2">
                        <button 
                          onClick={() => startEditing(field)}
                          className="text-gray-400 hover:text-gray-900 p-2 transition"
                          title="Edit Field"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button 
                          onClick={() => setDeleteModalConfig({
                            isOpen: true,
                            title: 'Delete Field',
                            itemName: field.name,
                            onConfirm: () => handleDeleteField(field.id)
                          })}
                          className="text-gray-400 hover:text-red-500 p-2 transition"
                          title="Delete Field"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}

            {/* Add New Field Form */}
            <div className="mt-4 flex flex-col gap-3 p-4 border border-brand-100 dark:border-brand-900/30 rounded-xl bg-brand-50/30 dark:bg-brand-900/10">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">Add New Custom Field</h3>
              <p className="text-[11px] text-gray-500 mb-2">Note: Field Name should be written without spaces (e.g., LeadSource, PreferredProduct).</p>
              
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="flex-1 w-full">
                  <input
                    type="text"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value.replace(/\s/g, ''))} // Prevent spaces
                    placeholder="Field Name (no spaces)"
                    className="w-full text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 outline-none focus:border-brand-500"
                  />
                </div>
                <div className="flex-1 w-full">
                  <input
                    type="text"
                    value={newFieldDesc}
                    onChange={(e) => setNewFieldDesc(e.target.value)}
                    placeholder="Field Description"
                    className="w-full text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 outline-none focus:border-brand-500"
                  />
                </div>
                <button 
                  onClick={handleAddField}
                  disabled={!newFieldName.trim()}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Save Field
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

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

