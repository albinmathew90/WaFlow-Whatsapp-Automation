import React, { useState, useMemo, useEffect } from 'react';
import { AdminAPI } from '../../api/admin';
import { ConfirmDeleteModal } from '../../components/ui/ConfirmDeleteModal';

type TopicData = {
  id: number;
  title: string;
  updatedAt: string;
  createdAt: string;
};

type FilterRule = {
  id: string;
  logic: 'and' | 'or';
  column: keyof TopicData;
  operator: string;
  value: string;
};

const INITIAL_TOPICS: TopicData[] = [];

const BlogTopicsPage: React.FC = () => {
  const [topics, setTopics] = useState<TopicData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'none' | 'columns' | 'filters'>('none');
  const [filters, setFilters] = useState<FilterRule[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [editingTopicId, setEditingTopicId] = useState<number | null>(null);
  const [warningMessage, setWarningMessage] = useState('');
  const [title, setTitle] = useState('');
  
  const [visibleColumns, setVisibleColumns] = useState({
      title: true,
      createdAt: true,
      updatedAt: true,
      id: true,
  });

  const toggleTab = (tab: 'columns' | 'filters') => {
    setActiveTab(prev => prev === tab ? 'none' : tab);
  };

  const fetchTopics = async () => {
    try {
      const data = await AdminAPI.getTopics();
      setTopics(data);
    } catch (err) {
      console.error('Error fetching topics:', err);
    }
  };

  const fetchSettings = async () => {
    try {
      const data = await AdminAPI.getSettings();
      if (data.uiPreferences?.blogTopicsTableColumns) {
        setVisibleColumns(prev => ({ ...prev, ...data.uiPreferences.blogTopicsTableColumns }));
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  useEffect(() => {
    fetchTopics();
    fetchSettings();
  }, []);

  const addFilter = (logic: 'and' | 'or' = 'and') => {
    setFilters([...filters, { id: Math.random().toString(), logic, column: 'title', operator: 'contains', value: '' }]);
  };

  const updateFilter = (id: string, field: keyof FilterRule, value: string) => {
    setFilters(filters.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter(f => f.id !== id));
  };

  const filteredTopics = useMemo(() => {
    let result = topics.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (filters.length === 0) return result;

    result = result.filter(t => {
      let finalResult = false;
      let currentAndResult = true;
      let hasValidFilters = false;

      for (let i = 0; i < filters.length; i++) {
        const filter = filters[i];
        if (!filter.value && filter.operator !== 'exists') {
          continue; 
        }
        hasValidFilters = true;

        const cellValue = String(t[filter.column]).toLowerCase();
        const filterValue = filter.value.toLowerCase();
        
        let matched = false;
        switch (filter.operator) {
          case 'equals': matched = (cellValue === filterValue); break;
          case 'is not equal to': matched = (cellValue !== filterValue); break;
          case 'contains': matched = cellValue.includes(filterValue); break;
          case 'exists': matched = (cellValue !== '' && cellValue !== 'null'); break;
          default: matched = true;
        }

        if (i === 0 || filter.logic === 'or') {
           if (i > 0) {
              finalResult = finalResult || currentAndResult;
           }
           currentAndResult = matched;
        } else {
           currentAndResult = currentAndResult && matched;
        }
      }

      if (!hasValidFilters) return true;
      finalResult = finalResult || currentAndResult;
      return finalResult;
    });

    return result;
  }, [topics, searchQuery, filters]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedTopics(filteredTopics.map(t => t.id));
    } else {
      setSelectedTopics([]);
    }
  };

  const handleSelectTopic = (id: number) => {
    if (selectedTopics.includes(id)) {
      setSelectedTopics(selectedTopics.filter(topicId => topicId !== id));
    } else {
      setSelectedTopics([...selectedTopics, id]);
    }
  };

  const executeDeleteSelected = async () => {
    for (const id of selectedTopics) {
      await AdminAPI.deleteTopic(id);
    }
    fetchTopics();
    setSelectedTopics([]);
  };

  const handleDeleteSelected = () => {
    if (selectedTopics.length === 0) return;
    setIsDeleteModalOpen(true);
  };

  const handleEditSelected = () => {
    if (selectedTopics.length > 1) {
      setWarningMessage('Only 1 item can be edited at once.');
      return;
    }
    if (selectedTopics.length === 1) {
      const topicToEdit = topics.find(t => t.id === selectedTopics[0]);
      if (topicToEdit) {
        setEditingTopicId(topicToEdit.id);
        setTitle(topicToEdit.title);
        setIsCreateModalOpen(true);
      }
    }
  };

  const toggleColumn = async (key: keyof typeof visibleColumns) => {
    const newCols = { ...visibleColumns, [key]: !visibleColumns[key] };
    setVisibleColumns(newCols);
    try {
      const currentSettings = await AdminAPI.getSettings();
      await AdminAPI.updateSettings({
         ...currentSettings,
         uiPreferences: {
            ...currentSettings.uiPreferences,
            blogTopicsTableColumns: newCols
         }
      });
    } catch (err) {
      console.error('Error saving column preferences:', err);
    }
  };

  const hasSelection = selectedTopics.length > 0;

  return (
    <div className="w-full h-full">
      {warningMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black dark:bg-white/50 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white dark:bg-gray-900 p-6 rounded shadow-xl max-w-sm w-full text-center border border-gray-100 dark:border-gray-800">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Warning</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{warningMessage}</p>
              <button onClick={() => setWarningMessage('')} className="px-6 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-black rounded text-sm hover:bg-black transition-colors shadow-sm font-medium">OK</button>
           </div>
        </div>
      )}
      {/* Table Container */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden flex flex-col">
        
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-3 py-1.5 bg-gray-50 dark:bg-gray-800/50 min-h-[44px]">
          
          {hasSelection ? (
            <div className="flex items-center flex-1 gap-3 animate-in fade-in slide-in-from-left-2 duration-200">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{selectedTopics.length} selected</span>
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={handleEditSelected}
                  className="px-2 py-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-1 shadow-sm transition-colors"
                >
                  <svg className="w-3 h-3 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  Edit
                </button>
                <button 
                  onClick={handleDeleteSelected}
                  className="px-2 py-1 bg-white dark:bg-gray-900 border border-red-100 rounded text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-1 shadow-sm transition-colors"
                >
                  <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center flex-1 gap-2">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none text-xs focus:ring-0 w-full outline-none placeholder-gray-400 text-gray-900 dark:text-white"
                placeholder="Search by Title"
              />
            </div>
          )}

          <div className="flex items-center gap-1.5 ml-4">
            <button 
              onClick={() => {
                setEditingTopicId(null);
                setTitle('');
                setIsCreateModalOpen(true);
              }} 
              className="px-2 py-1 border border-gray-200 dark:border-gray-700 rounded text-xs font-medium flex items-center gap-1 shadow-sm transition-colors bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 mr-2"
            >
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Create New
            </button>

            <button 
              onClick={() => toggleTab('columns')}
              className={`px-2 py-1 border rounded text-xs font-medium flex items-center gap-1 shadow-sm transition-colors ${activeTab === 'columns' ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              Columns
              <svg className={`w-3 h-3 text-gray-400 transition-transform ${activeTab === 'columns' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            <button 
              onClick={() => toggleTab('filters')}
              className={`px-2 py-1 border rounded text-xs font-medium flex items-center gap-1 shadow-sm transition-colors ${activeTab === 'filters' ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              Filters
              <svg className={`w-3 h-3 text-gray-400 transition-transform ${activeTab === 'filters' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
          </div>
        </div>

        {/* Expandable Sections */}
        {activeTab === 'columns' && (
          <div className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 px-3 py-2 flex items-center gap-1.5 flex-wrap animate-in slide-in-from-top-1 fade-in duration-150">
            {Object.entries(visibleColumns).map(([key, isVisible]) => (
              <div 
                key={key} 
                onClick={() => toggleColumn(key as keyof typeof visibleColumns)}
                className={`flex items-center gap-1 px-2 py-0.5 border rounded text-[11px] font-medium shadow-sm cursor-pointer transition-colors ${isVisible ? 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300' : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400'}`}
              >
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={isVisible ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} /></svg>
                {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'filters' && (
          <div className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 px-3 py-3 flex flex-col items-start gap-3 animate-in slide-in-from-top-1 fade-in duration-150 w-full">
            {filters.length === 0 ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">No filters set</span>
                <button 
                  onClick={() => addFilter('and')}
                  className="flex items-center gap-1 text-[11px] font-medium text-admin-text border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add Filter
                </button>
              </div>
            ) : (
              <div className="flex flex-col w-full gap-2">
                <span className="text-[11px] text-gray-700 dark:text-gray-300 font-semibold mb-0.5">Filter Topics where</span>
                
                {filters.map((filter, index) => (
                  <React.Fragment key={filter.id}>
                    {index > 0 && filter.logic === 'or' && (
                      <span className="text-[11px] text-gray-800 dark:text-gray-200 font-semibold my-1 uppercase tracking-wider">Or</span>
                    )}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 w-full">
                      {index > 0 && filter.logic === 'and' && (
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium w-5 text-center sm:block hidden">and</span>
                      )}
                      
                      <select 
                        value={filter.column}
                        onChange={(e) => updateFilter(filter.id, 'column', e.target.value)}
                        className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-[11px] rounded px-1.5 py-1 outline-none focus:border-admin-primary focus:ring-1 focus:ring-admin-primary w-full sm:w-32"
                      >
                        {Object.keys(visibleColumns).map(col => (
                           <option key={col} value={col}>{col.charAt(0).toUpperCase() + col.slice(1).replace(/([A-Z])/g, ' $1')}</option>
                        ))}
                      </select>

                      <select
                        value={filter.operator}
                        onChange={(e) => updateFilter(filter.id, 'operator', e.target.value)}
                        className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-[11px] rounded px-1.5 py-1 outline-none focus:border-admin-primary focus:ring-1 focus:ring-admin-primary w-full sm:w-40"
                      >
                        <option value="equals">equals</option>
                        <option value="is not equal to">is not equal to</option>
                        <option value="contains">contains</option>
                        <option value="is in">is in</option>
                        <option value="is not in">is not in</option>
                        <option value="exists">exists</option>
                        <option value="is greater than">is greater than</option>
                        <option value="is less than">is less than</option>
                        <option value="is less than or equal to">is less than or equal to</option>
                        <option value="is greater than or equal to">is greater than or equal to</option>
                      </select>

                      <div className="relative w-full sm:w-56 flex-1 sm:flex-none">
                        <input 
                          type={String(filter.column).includes('At') || String(filter.column) === 'date' ? 'date' : 'text'}
                          value={filter.value}
                          onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                          placeholder="Enter a value"
                          className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-[11px] rounded px-2 py-1 outline-none focus:border-admin-primary focus:ring-1 focus:ring-admin-primary w-full"
                        />
                      </div>

                      <div className="flex items-center gap-1 mt-1 sm:mt-0">
                        <button 
                          onClick={() => removeFilter(filter.id)}
                          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Remove filter"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <button 
                          onClick={() => addFilter('and')}
                          className="p-1 text-gray-400 hover:text-admin-primary hover:bg-blue-50 rounded transition-colors"
                          title="Add 'and' condition"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        </button>
                      </div>
                    </div>
                  </React.Fragment>
                ))}
                
                <div className="flex items-center gap-1.5 mt-2">
                  <button 
                    onClick={() => addFilter('or')}
                    className="flex items-center gap-0.5 text-[11px] font-medium text-admin-primary hover:text-admin-primary-hover transition-colors px-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Or
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100 dark:bg-gray-800/75 border-b border-gray-200 dark:border-gray-700 text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">
              <tr>
                <th scope="col" className="px-3 py-2 w-10 text-center">
                  <input 
                    type="checkbox" 
                    checked={filteredTopics.length > 0 && selectedTopics.length === filteredTopics.length}
                    onChange={handleSelectAll}
                    className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 text-admin-primary focus:ring-admin-primary bg-white dark:bg-gray-900 cursor-pointer" 
                  />
                </th>
                {Object.entries(visibleColumns).map(([key, isVisible]) => (
                  isVisible && (
                    <th key={key} scope="col" className="px-3 py-2 cursor-pointer hover:text-gray-700 group whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                        <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
                        </div>
                      </div>
                    </th>
                  )
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
              {filteredTopics.length > 0 ? (
                filteredTopics.map(topic => (
                  <tr key={topic.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group ${selectedTopics.includes(topic.id) ? 'bg-blue-50/30' : ''}`}>
                    <td className="px-3 py-2 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedTopics.includes(topic.id)}
                        onChange={() => handleSelectTopic(topic.id)}
                        className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 text-admin-primary focus:ring-admin-primary bg-white dark:bg-gray-900 cursor-pointer" 
                      />
                    </td>
                    {visibleColumns.title && (
                      <td className="px-3 py-2 min-w-[200px]">
                        <span className="text-xs font-medium text-black dark:text-white">{topic.title}</span>
                      </td>
                    )}
                    {visibleColumns.createdAt && (
                      <td className="px-3 py-2 text-[11px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {new Date(topic.createdAt).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    )}
                    {visibleColumns.updatedAt && (
                      <td className="px-3 py-2 text-[11px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {new Date(topic.updatedAt).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    )}
                    {visibleColumns.id && (
                      <td className="px-3 py-2 text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                        {topic.id}
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">No topics found matching your criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
      </div>

      {/* Create New Topic Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 shadow-2xl w-full max-w-2xl flex flex-col my-8 rounded-md overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-8 py-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">{editingTopicId ? 'Edit Topic' : 'Create New Topic'}</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-8">
              <form className="flex flex-col gap-6" onSubmit={async (e) => {
                e.preventDefault();
                if (!title) return;

                if (editingTopicId) {
                  await AdminAPI.updateTopic(editingTopicId, { title });
                } else {
                  await AdminAPI.createTopic({ title });
                }
                
                fetchTopics();
                setIsCreateModalOpen(false);
                setTitle('');
                setEditingTopicId(null);
              }}>
                {/* Title */}
                <div className="flex flex-col">
                  <label className="text-[11px] font-bold text-gray-900 dark:text-white mb-1.5 flex items-center">
                    Title <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input type="text" className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:border-gray-300 rounded-sm transition-colors" required value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                
                {/* Save Button */}
                <div className="mt-4 flex">
                  <button type="submit" className="px-6 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-black font-medium rounded-sm hover:bg-black transition-colors text-[13px] shadow-sm">
                    Save Topic
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={executeDeleteSelected}
        itemCount={selectedTopics.length}
      />
    </div>
  );
};

export default BlogTopicsPage;
