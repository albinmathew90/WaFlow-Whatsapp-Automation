import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import ConfirmDeleteModal from "../../components/common/ConfirmDeleteModal";
import { Pagination } from "../../components/Pagination";

export interface Application {
  id: string;
  applicationId: string;
  name: string;
  company: string;
  domain: string;
  description?: string;
  logo?: string;
  status: 'active' | 'inactive' | 'suspended';
  environment: 'production' | 'staging' | 'development';
  defaultWhatsappSessionId?: string;
  otpLength: number;
  expiryMinutes: number;
  maxAttempts: number;
  cooldownSeconds: number;
  maxResends: number;
  createdAt: string;
  updatedAt: string;
  webhookSecret?: string;
}

export default function Applications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  // Add Application Form State
  const [newApp, setNewApp] = useState({
    name: '',
    company: '',
    domain: '',
    description: '',
    environment: 'development' as 'production' | 'development',
    status: 'active',
  });
  const [createError, setCreateError] = useState('');

  // Edit Application State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [editError, setEditError] = useState('');

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const [deleteModalConfig, setDeleteModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    itemName: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const token = (sessionStorage.getItem('crm_token') || localStorage.getItem('crm_token'));
      const res = await fetch('/openwa-api/otp-management/applications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      }
    } catch (e) {
      console.error("Failed to load applications", e);
    }
  };

  const handleCreate = async () => {
    if (!newApp.name.trim() || !newApp.company.trim() || !newApp.domain.trim()) return;
    setIsLoading(true);
    setCreateError('');
    try {
      const token = (sessionStorage.getItem('crm_token') || localStorage.getItem('crm_token'));
      
      // Auto-assign first connected WhatsApp session if available
      let defaultWhatsappSessionId = undefined;
      try {
        const sessionsRes = await fetch('/openwa-api/crm/sessions', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (sessionsRes.ok) {
          const sessionsData = await sessionsRes.json();
          if (sessionsData && sessionsData.length > 0) {
            defaultWhatsappSessionId = sessionsData[0].id;
          }
        }
      } catch (err) {
        console.warn("Could not fetch sessions for auto-assignment", err);
      }

      const res = await fetch('/openwa-api/otp-management/applications', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newApp,
          ...(defaultWhatsappSessionId ? { defaultWhatsappSessionId } : {})
        })
      });
      if (res.ok) {
        const createdApp = await res.json();
        // The backend returns the secrets only once upon creation. We could show them here.
        // For now, we'll just close the modal and refresh.
        setIsModalOpen(false);
        setNewApp({ name: '', company: '', domain: '', description: '', environment: 'development', status: 'active' });
        fetchApplications();
        
        // Automatically navigate to integration page for the new app to show secrets
        navigate(`/otp-builder/applications/${createdApp.id}/integration`);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setCreateError(errorData.message || 'An error occurred while creating the application.');
      }
    } catch (e: any) {
      console.error(e);
      setCreateError(e.message || 'A network error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteApplication = async (id: string) => {
    const token = (sessionStorage.getItem('crm_token') || localStorage.getItem('crm_token'));
    try {
      const res = await fetch(`/openwa-api/otp-management/applications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setApplications(prev => prev.filter(a => a.id !== id));
      }
    } catch (e) { console.error(e); }
  };

  const handleUpdate = async () => {
    if (!editingApp || !editingApp.name.trim() || !editingApp.company.trim() || !editingApp.domain.trim()) return;
    setIsLoading(true);
    setEditError('');
    try {
      const token = (sessionStorage.getItem('crm_token') || localStorage.getItem('crm_token'));
      const res = await fetch(`/openwa-api/otp-management/applications/${editingApp.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingApp)
      });
      if (res.ok) {
        setIsEditModalOpen(false);
        setEditingApp(null);
        fetchApplications();
      } else {
        const errorData = await res.json().catch(() => ({}));
        setEditError(errorData.message || 'An error occurred while updating the application.');
      }
    } catch (e: any) {
      console.error(e);
      setEditError(e.message || 'A network error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredApplications = applications.filter(app => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = app.name.toLowerCase().includes(searchLower) || 
                          app.company.toLowerCase().includes(searchLower) || 
                          app.domain.toLowerCase().includes(searchLower);
    const matchesStatus = filterStatus === 'All' || app.status === filterStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedApplications = filteredApplications.slice(startIndex, startIndex + itemsPerPage);

  // Calculate Top Cards metrics
  const totalApps = applications.length;
  const activeApps = applications.filter(a => a.status === 'active').length;

  return (
    <>
      <PageMeta title="OTP Applications | Waflow" description="Manage OTP Builder Applications" />

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

      {/* Add Application Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-lg p-6 bg-white rounded-2xl dark:bg-gray-900 shadow-2xl transform transition-all">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Add Application</h3>
            <p className="text-sm text-gray-500 mt-1 mb-6">Create a new OTP builder tenant application.</p>
            
            {createError && (
              <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-lg dark:bg-red-900/30 dark:text-red-400 border border-red-100 dark:border-red-800/50">
                {createError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Application Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newApp.name}
                  onChange={(e) => setNewApp({ ...newApp, name: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 py-2.5 px-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder="e.g., DeviceDoctor Auth"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newApp.company}
                    onChange={(e) => setNewApp({ ...newApp, company: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 py-2.5 px-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    placeholder="e.g., DeviceDoctor"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Website URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={newApp.domain}
                    onChange={(e) => setNewApp({ ...newApp, domain: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 py-2.5 px-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    placeholder="https://devicedoctor.in"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Environment
                  </label>
                  <div className="relative">
                    <select
                      value={newApp.environment}
                      onChange={(e) => setNewApp({ ...newApp, environment: e.target.value as any })}
                      className="w-full rounded-xl border border-gray-200 py-2.5 px-4 pr-10 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white appearance-none"
                    >
                      <option value="development">Development</option>
                      <option value="production">Production</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </label>
                  <div className="relative">
                    <select
                      value={newApp.status}
                      onChange={(e) => setNewApp({ ...newApp, status: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 py-2.5 px-4 pr-10 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white appearance-none"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  value={newApp.description}
                  onChange={(e) => setNewApp({ ...newApp, description: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 py-2.5 px-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder="Optional application description"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={isLoading || !newApp.name.trim() || !newApp.company.trim() || !newApp.domain.trim()}
                className="px-5 py-2.5 text-sm font-medium text-white transition rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isLoading ? 'Creating...' : 'Create Application'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Application Modal */}
      {isEditModalOpen && editingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-lg p-6 bg-white rounded-2xl dark:bg-gray-900 shadow-2xl transform transition-all">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Edit Application</h3>
            <p className="text-sm text-gray-500 mt-1 mb-6">Update the details of your application.</p>
            
            {editError && (
              <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-lg dark:bg-red-900/30 dark:text-red-400 border border-red-100 dark:border-red-800/50">
                {editError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Application Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingApp.name}
                  onChange={(e) => setEditingApp({ ...editingApp, name: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 py-2.5 px-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder="e.g., DeviceDoctor Auth"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingApp.company}
                    onChange={(e) => setEditingApp({ ...editingApp, company: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 py-2.5 px-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    placeholder="e.g., DeviceDoctor"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Website URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={editingApp.domain}
                    onChange={(e) => setEditingApp({ ...editingApp, domain: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 py-2.5 px-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    placeholder="https://devicedoctor.in"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Environment
                  </label>
                  <div className="relative">
                    <select
                      value={editingApp.environment}
                      onChange={(e) => setEditingApp({ ...editingApp, environment: e.target.value as any })}
                      className="w-full rounded-xl border border-gray-200 py-2.5 px-4 pr-10 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white appearance-none"
                    >
                      <option value="development">Development</option>
                      <option value="production">Production</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </label>
                  <div className="relative">
                    <select
                      value={editingApp.status}
                      onChange={(e) => setEditingApp({ ...editingApp, status: e.target.value as any })}
                      className="w-full rounded-xl border border-gray-200 py-2.5 px-4 pr-10 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white appearance-none"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  value={editingApp.description || ''}
                  onChange={(e) => setEditingApp({ ...editingApp, description: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 py-2.5 px-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder="Optional application description"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingApp(null);
                }}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={isLoading || !editingApp.name.trim() || !editingApp.company.trim() || !editingApp.domain.trim()}
                className="px-5 py-2.5 text-sm font-medium text-white transition rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Integration Modal removed in favor of DeveloperIntegration page */}

      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Applications</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your tenant applications, credentials, and API configurations.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-600"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
          Add Application
        </button>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Applications</p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{totalApps}</h3>
        </div>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Applications</p>
          <h3 className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{activeApps}</h3>
        </div>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Today's OTP Requests</p>
          <h3 className="text-3xl font-bold text-brand-600 dark:text-brand-400 mt-2">0</h3>
        </div>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Successful Verifications</p>
          <h3 className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">0</h3>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="Search by name, company or domain..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <select 
                value={filterStatus} 
                onChange={e => setFilterStatus(e.target.value)}
                className="appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-10 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50/80 px-6 py-4 dark:bg-gray-800/50">
          <div className="grid grid-cols-12 gap-4 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            <div className="col-span-4">Application Details</div>
            <div className="col-span-2">Status & Env</div>
            <div className="col-span-2">Sender</div>
            <div className="col-span-2">Created Date</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
        </div>

        {filteredApplications.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center bg-gray-50/20 dark:bg-gray-900/30">
            <div className="flex flex-col items-center opacity-50">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No applications found.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {paginatedApplications.map(app => (
              <div key={app.id} className="group grid grid-cols-12 gap-4 px-5 py-4 items-center transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-800/30">
                <div className="col-span-4 flex items-center gap-4">
                  <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-lg dark:bg-brand-900/30 dark:text-brand-400">
                    {app.company.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{app.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{app.company}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <a href={app.domain} target="_blank" rel="noreferrer" className="text-xs text-brand-500 hover:underline truncate max-w-[120px]" title={app.domain}>{app.domain}</a>
                    </div>
                  </div>
                </div>
                <div className="col-span-2 flex flex-col items-start gap-1.5">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    app.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                    app.status === 'suspended' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {app.status}
                  </span>
                  <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">{app.environment}</span>
                </div>
                <div className="col-span-2">
                  {app.defaultWhatsappSessionId ? (
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-white">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      Connected
                    </span>
                  ) : (
                    <span className="text-xs text-orange-500 font-medium bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-lg border border-orange-100 dark:border-orange-800/50">No Sender</span>
                  )}
                </div>
                <div className="col-span-2 flex flex-col gap-0.5">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(app.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {new Date(app.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <button 
                    onClick={() => {
                      setEditingApp(app);
                      setIsEditModalOpen(true);
                    }}
                    className="rounded-lg p-2 text-gray-500 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 transition"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button 
                    onClick={() => navigate(`/otp-builder/applications/${app.id}/integration`)}
                    className="rounded-lg p-2 text-gray-500 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 transition"
                    title="Integration"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                  </button>
                  <button 
                    onClick={() => setDeleteModalConfig({
                      isOpen: true,
                      title: 'Delete Application',
                      itemName: app.name,
                      onConfirm: () => deleteApplication(app.id)
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

        <Pagination
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
          totalItems={filteredApplications.length}
        />
      </div>
    </>
  );
}

