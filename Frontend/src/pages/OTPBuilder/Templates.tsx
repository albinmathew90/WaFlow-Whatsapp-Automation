import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import ConfirmDeleteModal from "../../components/common/ConfirmDeleteModal";

export interface OtpTemplate {
  id: string;
  applicationId: string;
  name: string;
  language: string;
  status: 'active' | 'draft' | 'archived';
  version: number;
  createdAt: string;
  updatedAt: string;
}

export default function Templates() {
  const [templates, setTemplates] = useState<OtpTemplate[]>([]);
  const [applications, setApplications] = useState<{id: string, name: string}[]>([]);
  const [selectedApp, setSelectedApp] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const [deleteModalConfig, setDeleteModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    itemName: string;
    onConfirm: () => void;
  } | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchApplications();
  }, []);

  // When applications load, if we have apps, fetch templates for the first app by default, or all if we want to loop.
  // Since the API requires appId to get templates, we need to load templates per app.
  const fetchApplications = async () => {
    try {
      const token = sessionStorage.getItem('crm_token');
      const res = await fetch('/openwa-api/otp-management/applications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
        fetchTemplates(selectedApp, data);
      }
    } catch (e) { console.error(e); }
  };

  const fetchTemplates = async (appId: string, appsList = applications) => {
    const token = sessionStorage.getItem('crm_token');
    if (appId === 'All') {
      try {
        const allTemplates: OtpTemplate[] = [];
        for (const app of appsList) {
          const res = await fetch(`/openwa-api/otp-management/applications/${app.id}/templates`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            allTemplates.push(...data);
          }
        }
        allTemplates.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setTemplates(allTemplates);
      } catch (e) { console.error(e); }
      return;
    }
    
    try {
      const res = await fetch(`/openwa-api/otp-management/applications/${appId}/templates`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (selectedApp) fetchTemplates(selectedApp);
  }, [selectedApp]);

  const duplicateTemplate = async (templateId: string, appId: string) => {
    try {
      const token = sessionStorage.getItem('crm_token');
      const res = await fetch(`/openwa-api/otp-management/applications/${appId}/templates/${templateId}/duplicate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchTemplates(selectedApp);
      }
    } catch (e) { console.error(e); }
  };

  const deleteTemplate = async (templateId: string, appId: string) => {
    try {
      const token = sessionStorage.getItem('crm_token');
      const res = await fetch(`/openwa-api/otp-management/applications/${appId}/templates/${templateId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchTemplates(selectedApp);
      }
    } catch (e) { console.error(e); }
  };

  const filteredTemplates = templates.filter(t => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = t.name.toLowerCase().includes(searchLower);
    const matchesStatus = filterStatus === 'All' || t.status === filterStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const totalTemplates = templates.length;
  const activeTemplates = templates.filter(t => t.status === 'active').length;
  const draftTemplates = templates.filter(t => t.status === 'draft').length;
  const archivedTemplates = templates.filter(t => t.status === 'archived').length;

  return (
    <>
      <PageMeta title="OTP Templates | Waflow" description="Manage dynamic WhatsApp OTP templates" />

      {deleteModalConfig && (
        <ConfirmDeleteModal
          isOpen={deleteModalConfig.isOpen}
          title={deleteModalConfig.title}
          itemName={deleteModalConfig.itemName}
          onClose={() => setDeleteModalConfig(null)}
          onConfirm={() => {
            deleteModalConfig.onConfirm();
            setDeleteModalConfig(null);
          }}
        />
      )}

      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">OTP Templates</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Design and manage dynamic WhatsApp message templates.
          </p>
        </div>
        <button
          onClick={() => {
            if (selectedApp && selectedApp !== 'All') {
              navigate(`/otp-builder/templates/create?appId=${selectedApp}`);
            } else {
              navigate(`/otp-builder/templates/create`);
            }
          }}
          className="flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-600 disabled:opacity-50"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
          Create Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Templates</p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{totalTemplates}</h3>
        </div>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active</p>
          <h3 className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{activeTemplates}</h3>
        </div>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Drafts</p>
          <h3 className="text-3xl font-bold text-gray-600 dark:text-gray-400 mt-2">{draftTemplates}</h3>
        </div>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Archived</p>
          <h3 className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">{archivedTemplates}</h3>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="Search templates..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <select 
                value={selectedApp} 
                onChange={e => setSelectedApp(e.target.value)}
                className="appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-10 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                {applications.length > 0 && <option value="All">All Applications</option>}
                {applications.length === 0 && <option value="All">No Applications</option>}
                {applications.map(app => (
                  <option key={app.id} value={app.id}>{app.name}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
            <div className="relative">
              <select 
                value={filterStatus} 
                onChange={e => setFilterStatus(e.target.value)}
                className="appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-10 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
                <option value="Archived">Archived</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50/80 px-6 py-4 dark:bg-gray-800/50">
          <div className="grid grid-cols-12 gap-4 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            <div className="col-span-3">Template Name</div>
            <div className="col-span-3">Application</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Last Updated</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
        </div>

        {filteredTemplates.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center bg-gray-50/20 dark:bg-gray-900/30">
            <div className="flex flex-col items-center opacity-50">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No templates found.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredTemplates.map(t => (
              <div key={t.id} className="group grid grid-cols-12 gap-4 px-6 py-5 items-center transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-800/30">
                <div className="col-span-3 flex items-center gap-3">
                  <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center dark:bg-gray-800 dark:text-gray-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{t.name}</p>
                  </div>
                </div>
                <div className="col-span-3 flex flex-col justify-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {applications.find(a => a.id === t.applicationId)?.name || 'Unknown'}
                  </span>
                </div>
                <div className="col-span-2 flex items-center">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    t.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                    t.status === 'draft' ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' :
                    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                  }`}>
                    {t.status}
                  </span>
                </div>
                <div className="col-span-2 flex flex-col gap-0.5">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(t.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <button 
                    onClick={() => navigate(`/otp-builder/templates/edit/${t.id}?appId=${t.applicationId}`)}
                    className="rounded-lg p-2 text-gray-500 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 transition"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button 
                    onClick={() => duplicateTemplate(t.id, t.applicationId)}
                    className="rounded-lg p-2 text-gray-500 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 transition"
                    title="Duplicate"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  </button>
                  <button 
                    onClick={() => setDeleteModalConfig({
                      isOpen: true,
                      title: 'Delete Template',
                      itemName: t.name,
                      onConfirm: () => deleteTemplate(t.id, t.applicationId)
                    })} 
                    className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition" 
                    title="Delete"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
