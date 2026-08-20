import { useState, useEffect } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import ConfirmDeleteModal from "../../components/common/ConfirmDeleteModal";
import { Pagination } from "../../components/Pagination";

export interface Template {
  id: string;
  name: string;
  category: 'Marketing' | 'Utility' | 'Authentication';
  language: string;
  type: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  content?: any; // The actual content payload
}

export default function ListTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const token = sessionStorage.getItem('crm_token');
        const res = await fetch('/openwa-api/crm/templates', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // The backend currently stores `body` and `header`/`footer` as top level fields,
          // while the frontend expects `content.header`, `content.body` etc.
          // Let's map it.
          setTemplates(data.map((t: any) => ({
            ...t,
            content: { header: t.header, body: t.body, footer: t.footer }
          })));
        }
      } catch (e) {
        console.error("Failed to load templates", e);
      }
    };
    fetchTemplates();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterType, setFilterType] = useState('All');
  
  const [deleteModalConfig, setDeleteModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    itemName: string;
    onConfirm: () => void;
  } | null>(null);

  // No longer syncing to localStorage

  // Derived state
  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'All' || t.category === filterCategory;
    const matchesType = filterType === 'All' || t.type === filterType;
    return matchesSearch && matchesCategory && matchesType;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCategory, filterType]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTemplates = filteredTemplates.slice(startIndex, startIndex + itemsPerPage);


  const deleteTemplate = async (id: string) => {
    const token = sessionStorage.getItem('crm_token');
    try {
      const res = await fetch(`/openwa-api/crm/templates/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setTemplates(prev => prev.filter(t => t.id !== id));
      }
    } catch (e) { console.error(e); }
  };



  return (
    <>
      <PageMeta title="Templates | Waflow" description="Manage your WhatsApp Templates" />
      
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

      {/* Page Header */}
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Template Library</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create and manage rich media message templates for your campaigns.
          </p>
        </div>
        <div className="flex gap-3">
          <Link 
            to="/templates/create"
            className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
            Create Template
          </Link>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        
        {/* Table Toolbar */}
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
          <div className="flex gap-3">
            <div className="relative">
              <select 
                value={filterCategory} 
                onChange={e => setFilterCategory(e.target.value)}
                className="appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2 pr-10 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                <option value="All">All Categories</option>
                <option value="Marketing">Marketing</option>
                <option value="Utility">Utility</option>
                <option value="Authentication">Authentication</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
            <div className="relative">
              <select 
                value={filterType} 
                onChange={e => setFilterType(e.target.value)}
                className="appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2 pr-10 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                <option value="All">All Types</option>
                <option value="Text">Text</option>
                <option value="Image">Image</option>
                <option value="Video">Video</option>
                <option value="Document">Document</option>
                <option value="Carousel">Carousel</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>
        </div>

        {/* Table Header */}
        <div className="bg-gray-50/80 px-5 py-3 dark:bg-gray-800/50">
          <div className="grid grid-cols-12 gap-4 text-xs font-bold text-gray-700 dark:text-gray-300">
            <div className="col-span-3">Template Name</div>
            <div className="col-span-3">Category & Type</div>
            <div className="col-span-2">Language</div>
            <div className="col-span-3">Last Updated</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>
        </div>

        {/* Table Body */}
        {filteredTemplates.length === 0 ? (
          <div className="flex h-[400px] items-center justify-center bg-gray-50/20 dark:bg-gray-900/30">
            <div className="flex flex-col items-center opacity-50">
              <svg width="160" height="120" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="40" y="30" width="80" height="60" rx="8" fill="#E2E8F0" />
                <rect x="40" y="30" width="80" height="16" rx="8" fill="#CBD5E1" />
                <path d="M45 105L49 109M49 105L45 109" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <p className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">No templates found.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {paginatedTemplates.map(template => (
              <div key={template.id} className="group grid grid-cols-12 gap-4 px-5 py-4 items-center transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-800/30">
                <div className="col-span-3">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate" title={template.name}>{template.name}</p>
                </div>
                <div className="col-span-3 flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    template.category === 'Marketing' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 
                    template.category === 'Utility' ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400' : 
                    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                  }`}>
                    {template.category}
                  </span>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{template.type}</span>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-900 dark:text-white">{template.language}</p>
                </div>
                <div className="col-span-3 flex flex-col gap-0.5">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">
                    {new Date(template.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} • {new Date(template.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {template.createdAt && (
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">
                      Created: {new Date(template.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} • {new Date(template.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
                <div className="col-span-1 flex items-center justify-end gap-2">
                  <Link to={`/templates/create?edit=${template.id}`} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white" title="Edit">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </Link>
                  <button 
                    onClick={() => setDeleteModalConfig({
                      isOpen: true,
                      title: 'Delete Template',
                      itemName: template.name,
                      onConfirm: () => deleteTemplate(template.id)
                    })} 
                    className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400" 
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
          totalItems={filteredTemplates.length}
        />
      </div>
    </>
  );
}

