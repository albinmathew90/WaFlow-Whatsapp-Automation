import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router';
import { AdminAPI } from '../../api/admin';
import { ConfirmDeleteModal } from '../../components/ui/ConfirmDeleteModal';

type MediaData = {
  id: number;
  fileName: string;
  thumbnail: string;
  alt: string;
  url: string;
  thumbnailUrl: string;
  fileSize: string;
  updatedAt: string;
  createdAt: string;
};

type FilterRule = {
  id: string;
  logic: 'and' | 'or';
  column: keyof MediaData;
  operator: string;
  value: string;
};

const INITIAL_MEDIA: MediaData[] = [];

const MediaPage: React.FC = () => {
  const [media, setMedia] = useState<MediaData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'none' | 'columns' | 'filters'>('none');
  const [filters, setFilters] = useState<FilterRule[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  
  // Modal states
  const [createFile, setCreateFile] = useState<File | null>(null);
  const [createUrl, setCreateUrl] = useState('');
  const [createAlt, setCreateAlt] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const [previewMedia, setPreviewMedia] = useState<MediaData | null>(null);
  
  const [visibleColumns, setVisibleColumns] = useState({
      fileName: true,
      alt: true,
      createdAt: true,
      updatedAt: true,
      id: false,
      url: false,
      thumbnailUrl: false,
      fileSize: false,
  });

  const toggleTab = (tab: 'columns' | 'filters') => {
    setActiveTab(prev => prev === tab ? 'none' : tab);
  };

  const fetchMedia = async () => {
    try {
      const data = await AdminAPI.getMedia();
      setMedia(data);
    } catch (err) {
      console.error('Error fetching media:', err);
    }
  };

  const fetchSettings = async () => {
    try {
      const data = await AdminAPI.getSettings();
      if (data.uiPreferences?.mediaTableColumns) {
        setVisibleColumns(prev => ({ ...prev, ...data.uiPreferences.mediaTableColumns }));
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  useEffect(() => {
    fetchMedia();
    fetchSettings();
  }, []);

  const addFilter = (logic: 'and' | 'or' = 'and') => {
    setFilters([...filters, { id: Math.random().toString(), logic, column: 'fileName', operator: 'contains', value: '' }]);
  };

  const updateFilter = (id: string, field: keyof FilterRule, value: string) => {
    setFilters(filters.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter(f => f.id !== id));
  };

  const filteredMedia = useMemo(() => {
    let result = media.filter(m => m.fileName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (filters.length === 0) return result;

    result = result.filter(m => {
      let finalResult = false;
      let currentAndResult = true;
      let hasValidFilters = false;

      for (let i = 0; i < filters.length; i++) {
        const filter = filters[i];
        if (!filter.value && filter.operator !== 'exists') {
          continue;
        }
        hasValidFilters = true;

        const cellValue = String(m[filter.column]).toLowerCase();
        const filterValue = filter.value.toLowerCase();
        
        let matched = false;
        switch (filter.operator) {
          case 'equals': matched = (cellValue === filterValue); break;
          case 'is not equal to': matched = (cellValue !== filterValue); break;
          case 'contains': matched = cellValue.includes(filterValue); break;
          case 'is in': matched = filterValue.split(',').map(s=>s.trim()).includes(cellValue); break;
          case 'is not in': matched = !filterValue.split(',').map(s=>s.trim()).includes(cellValue); break;
          case 'exists': matched = (cellValue !== '' && cellValue !== 'null'); break;
          case 'is greater than': matched = (cellValue > filterValue); break;
          case 'is less than': matched = (cellValue < filterValue); break;
          case 'is less than or equal to': matched = (cellValue <= filterValue); break;
          case 'is greater than or equal to': matched = (cellValue >= filterValue); break;
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
  }, [media, searchQuery, filters]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedMedia(filteredMedia.map(m => m.id));
    } else {
      setSelectedMedia([]);
    }
  };

  const handleSelectMedia = (id: number) => {
    if (selectedMedia.includes(id)) {
      setSelectedMedia(selectedMedia.filter(mediaId => mediaId !== id));
    } else {
      setSelectedMedia([...selectedMedia, id]);
    }
  };

  const executeDeleteSelected = async () => {
    for (const id of selectedMedia) {
      await AdminAPI.deleteMedia(id);
    }
    fetchMedia();
    setSelectedMedia([]);
  };

  const handleDeleteSelected = () => {
    if (selectedMedia.length === 0) return;
    setIsDeleteModalOpen(true);
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
            mediaTableColumns: newCols
         }
      });
    } catch (err) {
      console.error('Error saving column preferences:', err);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    
    if (!createFile && !createUrl) {
      setCreateError('Please upload a file or provide an image URL.');
      return;
    }
    
    if (createFile && createFile.size > 150 * 1024 * 1024) {
      setCreateError('File size exceeds the 150 MB limit.');
      return;
    }
    
    if (createUrl) {
      try {
        new URL(createUrl);
      } catch {
        setCreateError('Please provide a valid URL.');
        return;
      }
    }

    const payload = {
      fileName: createFile ? createFile.name : createUrl.split('/').pop() || 'url-image',
      thumbnail: createUrl || (createFile && createFile.type.startsWith('image/') ? URL.createObjectURL(createFile) : 'https://via.placeholder.com/40?text=File'),
      alt: createAlt || (createFile ? createFile.name : 'Uploaded Media'),
      url: createUrl || (createFile ? URL.createObjectURL(createFile) : ''),
      thumbnailUrl: createUrl || (createFile && createFile.type.startsWith('image/') ? URL.createObjectURL(createFile) : ''),
      fileSize: createFile ? `${(createFile.size / (1024 * 1024)).toFixed(2)} MB` : 'Unknown',
    };
    
    await AdminAPI.createMedia(payload);
    fetchMedia();
    
    setIsCreateModalOpen(false);
    setCreateFile(null);
    setCreateUrl('');
    setCreateAlt('');
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkError(null);
    
    if (bulkFiles.length === 0) {
      setBulkError('Please select files to upload.');
      return;
    }
    
    if (bulkFiles.length > 10) {
      setBulkError('You can only upload a maximum of 10 files at once.');
      return;
    }
    
    for (const file of bulkFiles) {
      if (file.size > 150 * 1024 * 1024) {
        setBulkError(`File "${file.name}" exceeds the 150 MB limit.`);
        return;
      }
    }
    
    for (const file of bulkFiles) {
      const payload = {
        fileName: file.name,
        thumbnail: file.type.startsWith('image/') ? URL.createObjectURL(file) : 'https://via.placeholder.com/40?text=File',
        alt: file.name,
        url: URL.createObjectURL(file),
        thumbnailUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
        fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      };
      await AdminAPI.createMedia(payload);
    }
    
    fetchMedia();
    setIsBulkModalOpen(false);
    setBulkFiles([]);
  };

  const hasSelection = selectedMedia.length > 0;

  return (
    <div className="w-full h-full relative">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden flex flex-col">
        
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-3 py-1.5 bg-gray-50 dark:bg-gray-800/50 min-h-[44px]">
          
          {hasSelection ? (
            <div className="flex items-center flex-1 gap-3 animate-in fade-in slide-in-from-left-2 duration-200">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{selectedMedia.length} selected</span>
              <div className="flex items-center gap-1.5">
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
                placeholder="Search by File Name"
              />
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => {
                setCreateUrl('');
                setCreateAlt('');
                setCreateFile(null);
                setIsCreateModalOpen(true);
              }}
              className="px-2 py-1 border border-gray-200 dark:border-gray-700 rounded text-xs font-medium flex items-center gap-1 shadow-sm transition-colors bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Create New
            </button>
            <button 
              onClick={() => setIsBulkModalOpen(true)}
              className="px-2 py-1 border border-gray-200 dark:border-gray-700 rounded text-xs font-medium flex items-center gap-1 shadow-sm transition-colors bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 mr-2"
            >
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              Bulk Upload
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
                {key === 'id' ? 'ID' : key === 'url' ? 'URL' : key === 'thumbnailUrl' ? 'Thumbnail URL' : key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
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
                <span className="text-[11px] text-gray-700 dark:text-gray-300 font-semibold mb-0.5">Filter Media where</span>
                
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
                        <option value="fileName">File Name</option>
                        <option value="alt">Alt Text</option>
                        <option value="id">ID</option>
                        <option value="url">URL</option>
                        <option value="thumbnailUrl">Thumbnail URL</option>
                        <option value="fileSize">File Size</option>
                        <option value="updatedAt">Updated At</option>
                        <option value="createdAt">Created At</option>
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
                          type={filter.column.includes('At') ? 'date' : 'text'}
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
                    checked={filteredMedia.length > 0 && selectedMedia.length === filteredMedia.length}
                    onChange={handleSelectAll}
                    className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 text-admin-primary focus:ring-admin-primary bg-white dark:bg-gray-900 cursor-pointer" 
                  />
                </th>
                {visibleColumns.fileName && (
                  <th scope="col" className="px-3 py-2 cursor-pointer hover:text-gray-700 group">
                    <div className="flex items-center gap-1">
                      File Name
                      <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
                      </div>
                    </div>
                  </th>
                )}
                {visibleColumns.alt && (
                  <th scope="col" className="px-3 py-2 cursor-pointer hover:text-gray-700 group">
                    <div className="flex items-center gap-1">
                      Alt
                      <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
                      </div>
                    </div>
                  </th>
                )}
                {visibleColumns.createdAt && (
                  <th scope="col" className="px-3 py-2 cursor-pointer hover:text-gray-700 group">
                    <div className="flex items-center gap-1">
                      Created At
                      <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
                      </div>
                    </div>
                  </th>
                )}
                {visibleColumns.updatedAt && (
                  <th scope="col" className="px-3 py-2 cursor-pointer hover:text-gray-700 group">
                    <div className="flex items-center gap-1">
                      Updated At
                      <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
                      </div>
                    </div>
                  </th>
                )}
                {visibleColumns.id && (
                  <th scope="col" className="px-3 py-2 cursor-pointer hover:text-gray-700 group">
                    <div className="flex items-center gap-1">ID<div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity"><svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg></div></div>
                  </th>
                )}
                {visibleColumns.url && (
                  <th scope="col" className="px-3 py-2 cursor-pointer hover:text-gray-700 group">
                    <div className="flex items-center gap-1">URL<div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity"><svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg></div></div>
                  </th>
                )}
                {visibleColumns.thumbnailUrl && (
                  <th scope="col" className="px-3 py-2 cursor-pointer hover:text-gray-700 group">
                    <div className="flex items-center gap-1">Thumbnail URL<div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity"><svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg></div></div>
                  </th>
                )}
                {visibleColumns.fileSize && (
                  <th scope="col" className="px-3 py-2 cursor-pointer hover:text-gray-700 group">
                    <div className="flex items-center gap-1">File Size<div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity"><svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg></div></div>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
              {filteredMedia.length > 0 ? (
                filteredMedia.map(item => (
                  <tr key={item.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group ${selectedMedia.includes(item.id) ? 'bg-blue-50/30' : ''}`}>
                    <td className="px-3 py-2 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedMedia.includes(item.id)}
                        onChange={() => handleSelectMedia(item.id)}
                        className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 text-admin-primary focus:ring-admin-primary bg-white dark:bg-gray-900 cursor-pointer" 
                      />
                    </td>
                    {visibleColumns.fileName && (
                      <td className="px-3 py-2 flex items-center gap-3">
                        <div className="w-8 h-8 rounded border border-gray-200 dark:border-gray-700 overflow-hidden flex-shrink-0 bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                          {item.fileName.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) || item.thumbnail.startsWith('blob:') || (item.thumbnail.startsWith('http') && !item.thumbnail.includes('via.placeholder.com')) ? (
                            <img src={item.thumbnail} alt={item.fileName} className="w-full h-full object-cover" />
                          ) : item.fileName.match(/\.(mp4|webm|mkv|avi|mov)$/i) ? (
                            <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                          ) : item.fileName.match(/\.(pdf)$/i) ? (
                            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6M9 14h6M9 18h4" /></svg>
                          ) : item.fileName.match(/\.(doc|docx)$/i) ? (
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          ) : (
                            <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                          )}
                        </div>
                        <button 
                          onClick={(e) => { e.preventDefault(); setPreviewMedia(item); }} 
                          className="text-xs font-medium text-black dark:text-white hover:underline decoration-black dark:decoration-white underline-offset-2 text-left bg-transparent border-none p-0 cursor-pointer"
                        >
                          {item.fileName}
                        </button>
                      </td>
                    )}
                    {visibleColumns.alt && (
                      <td className="px-3 py-2 text-xs text-black dark:text-white">
                        {item.alt}
                      </td>
                    )}
                    {visibleColumns.createdAt && (
                      <td className="px-3 py-2 text-xs text-black dark:text-white">
                        {new Date(item.createdAt).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    )}
                    {visibleColumns.updatedAt && (
                      <td className="px-3 py-2 text-xs text-black dark:text-white">
                        {new Date(item.updatedAt).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    )}
                    {visibleColumns.id && <td className="px-3 py-2 text-xs text-black dark:text-white">{item.id}</td>}
                    {visibleColumns.url && <td className="px-3 py-2 text-xs text-black dark:text-white truncate max-w-[150px]" title={item.url}>{item.url}</td>}
                    {visibleColumns.thumbnailUrl && <td className="px-3 py-2 text-xs text-black dark:text-white truncate max-w-[150px]" title={item.thumbnailUrl}>{item.thumbnailUrl}</td>}
                    {visibleColumns.fileSize && <td className="px-3 py-2 text-xs text-black dark:text-white">{item.fileSize}</td>}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">No media found matching your criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        
      </div>

      {/* Modals */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">Upload New Media</h3>
              <button onClick={() => { setIsCreateModalOpen(false); setCreateError(null); setCreateFile(null); setCreateUrl(''); setCreateAlt(''); }} className="text-gray-400 hover:text-gray-900 transition-colors flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {createError && (
              <div className="mx-5 mt-5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {createError}
              </div>
            )}
            <form onSubmit={handleCreateSubmit} className="p-5 flex flex-col gap-5">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">File Upload</label>
                <label className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-6 flex flex-col items-center justify-center text-center bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer group relative">
                  <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => { setCreateFile(e.target.files?.[0] || null); setCreateUrl(''); }} />
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-sm">
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-admin-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  </div>
                  {createFile ? (
                    <span className="text-sm font-medium text-admin-primary">{createFile.name}</span>
                  ) : (
                    <>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Click to upload or drag and drop</span>
                      <span className="text-xs text-gray-400 mt-1">Any media file up to 150MB</span>
                    </>
                  )}
                </label>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="h-px bg-gray-200 flex-1"></div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">OR</span>
                <div className="h-px bg-gray-200 flex-1"></div>
              </div>
              
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">Image URL</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                  </div>
                  <input type="url" value={createUrl} onChange={(e) => { setCreateUrl(e.target.value); setCreateFile(null); }} placeholder="https://example.com/image.jpg" className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-primary/50 focus:border-admin-primary" disabled={!!createFile} />
                </div>
              </div>
              
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">Alt Text <span className="text-red-500">*</span></label>
                <input type="text" value={createAlt} onChange={(e) => setCreateAlt(e.target.value)} placeholder="e.g. Hero Banner" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-primary/50 focus:border-admin-primary" required />
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">Used for screen readers and SEO.</p>
              </div>
              
              <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-admin-primary hover:bg-admin-primary-hover rounded-lg transition-colors shadow-sm flex items-center gap-2">
                  Upload Media
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
              <h3 className="font-semibold text-gray-900 dark:text-white">Bulk Upload Media</h3>
              <button onClick={() => { setIsBulkModalOpen(false); setBulkError(null); setBulkFiles([]); }} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {bulkError && (
              <div className="mx-5 mt-5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {bulkError}
              </div>
            )}
            <form onSubmit={handleBulkSubmit} className="p-5 flex flex-col gap-4">
              <div>
                <label className="border-2 border-dashed border-admin-primary/30 rounded-xl p-12 flex flex-col items-center justify-center text-center bg-blue-50/30 hover:bg-blue-50 transition-colors cursor-pointer group relative">
                  <input type="file" multiple className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => setBulkFiles(Array.from(e.target.files || []))} />
                  <div className="w-16 h-16 rounded-full bg-white dark:bg-gray-900 border border-blue-100 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-sm">
                    <svg className="w-8 h-8 text-admin-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  </div>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">{bulkFiles.length > 0 ? `${bulkFiles.length} files selected` : 'Select multiple files to upload'}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">or drag and drop them anywhere in this area</span>
                  <div className="mt-6 flex flex-wrap gap-2 justify-center">
                     <span className="px-2.5 py-1 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 text-[11px] font-medium rounded-md border border-gray-200 dark:border-gray-700 shadow-sm">Supports up to 10 files at once</span>
                     <span className="px-2.5 py-1 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 text-[11px] font-medium rounded-md border border-gray-200 dark:border-gray-700 shadow-sm">Max 150MB per file</span>
                  </div>
                </label>
              </div>
              
              <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button type="button" onClick={() => setIsBulkModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-admin-primary hover:bg-admin-primary-hover rounded-lg transition-colors shadow-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  Upload All Files
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate pr-4">{previewMedia.fileName}</h3>
              <button onClick={() => setPreviewMedia(null)} className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-0 flex-1 overflow-auto bg-gray-100 dark:bg-gray-800/50 flex items-center justify-center min-h-[300px]">
              {previewMedia.fileName.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) || (previewMedia.url.startsWith('blob:') && !previewMedia.fileName.match(/\.(mp4|webm|mkv|avi|mov|pdf|doc|docx)$/i)) ? (
                <img src={previewMedia.url} alt={previewMedia.alt} className="max-w-full max-h-[70vh] object-contain" />
              ) : previewMedia.fileName.match(/\.(mp4|webm|mkv|avi|mov)$/i) ? (
                <video src={previewMedia.url} controls className="max-w-full max-h-[70vh] w-full bg-black dark:bg-white" />
              ) : previewMedia.fileName.match(/\.(pdf)$/i) ? (
                <iframe src={previewMedia.url} className="w-full h-[70vh] border-none" title={previewMedia.fileName} />
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <p className="text-gray-900 dark:text-white font-medium mb-1">Preview not available</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">No interactive preview is available for this file type.</p>
                  <a href={previewMedia.url} target="_blank" rel="noopener noreferrer" download={previewMedia.fileName} className="px-4 py-2 bg-admin-primary text-white text-sm font-medium rounded-lg hover:bg-admin-primary-hover transition-colors shadow-sm">
                    Download File
                  </a>
                </div>
              )}
            </div>
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-600 dark:text-gray-400">
              <div><span className="font-semibold text-gray-900 dark:text-white">Size:</span> {previewMedia.fileSize}</div>
              <div><span className="font-semibold text-gray-900 dark:text-white">Uploaded:</span> {previewMedia.createdAt}</div>
              {previewMedia.url && <div className="truncate flex-1 min-w-[200px]"><span className="font-semibold text-gray-900 dark:text-white">URL:</span> <a href={previewMedia.url} target="_blank" rel="noopener noreferrer" className="text-admin-primary hover:underline">{previewMedia.url}</a></div>}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={executeDeleteSelected}
        itemCount={selectedMedia.length}
      />
    </div>
  );
};

export default MediaPage;
