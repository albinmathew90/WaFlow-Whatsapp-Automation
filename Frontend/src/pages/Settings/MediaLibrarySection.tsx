import { useState, useEffect, useRef } from 'react';
import ConfirmDeleteModal from '../../components/common/ConfirmDeleteModal';

export interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  sizeBytes: number;
  createdAt: string;
  rawCreatedAt?: string;
  url: string;
}

export default function MediaLibrarySection() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploader, setShowUploader] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteModalTarget, setDeleteModalTarget] = useState<'single' | 'bulk' | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('crm_token');
      const res = await fetch('/openwa-api/crm/media', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMediaItems(data.map((item: any) => ({
          ...item,
          url: `/openwa-api/crm/media/file/${item.filename}`,
          rawCreatedAt: item.createdAt,
          createdAt: new Date(item.createdAt).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          })
        })));
      }
    } catch (e) {
      console.error('Failed to fetch media library', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    const token = sessionStorage.getItem('crm_token');

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', '/openwa-api/crm/media/upload');
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              setUploadProgress(percent);
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(xhr.responseText);
            } else {
              let errorMsg = `Upload failed with status ${xhr.status}: ${xhr.statusText}`;
              try {
                const jsonResp = JSON.parse(xhr.responseText);
                if (jsonResp.message) errorMsg = jsonResp.message;
              } catch (e) {
                // Not JSON, fallback to default message
              }
              reject(new Error(errorMsg));
            }
          };

          xhr.onerror = () => reject(new Error('Network error during upload'));
          xhr.send(formData);
        });
      }
      await fetchMedia();
      setShowUploader(false);
    } catch (e: any) {
      console.error('Upload error', e);
      setUploadError(e.message || 'An error occurred during upload.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = (id: string) => {
    setItemToDelete(id);
    setDeleteModalTarget('single');
  };

  const executeSingleDelete = async () => {
    if (!itemToDelete) return;
    try {
      const token = sessionStorage.getItem('crm_token');
      const res = await fetch(`/openwa-api/crm/media/${itemToDelete}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMediaItems(items => items.filter(i => i.id !== itemToDelete));
        setSelectedItem(null);
      }
    } catch (e) {
      console.error('Delete error', e);
    } finally {
      setDeleteModalTarget(null);
      setItemToDelete(null);
    }
  };

  const handleItemClick = (item: MediaItem) => {
    if (bulkSelectMode) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(item.id)) {
          next.delete(item.id);
        } else {
          next.add(item.id);
        }
        return next;
       });
    } else {
      setSelectedItem(item);
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setDeleteModalTarget('bulk');
  };

  const executeBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const token = sessionStorage.getItem('crm_token');
    try {
      for (const id of Array.from(selectedIds)) {
        await fetch(`/openwa-api/crm/media/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
      setMediaItems(items => items.filter(i => !selectedIds.has(i.id)));
      setSelectedIds(new Set());
      setBulkSelectMode(false);
    } catch (e) {
      console.error('Bulk delete error', e);
    } finally {
      setDeleteModalTarget(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const copyUrl = (url: string) => {
    const fullUrl = window.location.origin + url;
    navigator.clipboard.writeText(fullUrl);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const filteredItems = mediaItems.filter(item => {
    const matchesSearch = item.originalName.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    
    if (filterType === 'image' && !item.mimetype.startsWith('image/')) return false;
    if (filterType === 'video' && !item.mimetype.startsWith('video/')) return false;
    if (filterType === 'audio' && !item.mimetype.startsWith('audio/')) return false;
    if (filterType === 'document' && (item.mimetype.startsWith('image/') || item.mimetype.startsWith('video/') || item.mimetype.startsWith('audio/'))) return false;

    if (filterDate !== 'all') {
      const itemDate = new Date(item.rawCreatedAt || item.createdAt);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - itemDate.getTime());
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (filterDate === 'today') {
        if (itemDate.toDateString() !== now.toDateString()) return false;
      } else if (filterDate === '7d') {
        if (diffDays > 7) return false;
      } else if (filterDate === '30d') {
        if (diffDays > 30) return false;
      } else if (filterDate === '90d') {
        if (diffDays > 90) return false;
      } else if (filterDate === 'year') {
        if (itemDate.getFullYear() !== now.getFullYear()) return false;
      }
    }

    return true;
  });

  const getFileBadge = (originalName: string, mimetype: string) => {
    const extMatch = originalName?.match(/\.([a-zA-Z0-9]+)$/);
    if (extMatch && extMatch[1]) {
      return extMatch[1].toUpperCase();
    }
    if (mimetype.includes('pdf')) return 'PDF';
    if (mimetype.includes('word') || mimetype.includes('document')) return 'DOCX';
    if (mimetype.includes('sheet') || mimetype.includes('excel')) return 'XLSX';
    if (mimetype.includes('presentation') || mimetype.includes('powerpoint')) return 'PPTX';
    if (mimetype.includes('zip') || mimetype.includes('archive')) return 'ZIP';
    if (mimetype.startsWith('audio/')) return 'AUDIO';
    if (mimetype.startsWith('video/')) return 'VIDEO';
    return 'DOC';
  };

  const formatFriendlyMimeType = (mimetype: string, originalName: string) => {
    if (mimetype.startsWith('image/')) {
      const sub = mimetype.split('/')[1] || 'image';
      return `Image (${sub.toUpperCase()})`;
    }
    if (mimetype.startsWith('video/')) {
      const sub = mimetype.split('/')[1] || 'video';
      return `Video (${sub.toUpperCase()})`;
    }
    if (mimetype.startsWith('audio/')) {
      const sub = mimetype.split('/')[1] || 'audio';
      return `Audio (${sub.toUpperCase()})`;
    }
    if (mimetype.includes('pdf') || originalName?.toLowerCase().endsWith('.pdf')) {
      return 'PDF Document';
    }
    if (mimetype.includes('word') || mimetype.includes('document') || originalName?.toLowerCase().endsWith('.doc') || originalName?.toLowerCase().endsWith('.docx')) {
      return 'Word Document (DOCX)';
    }
    if (mimetype.includes('sheet') || mimetype.includes('excel') || originalName?.toLowerCase().endsWith('.xls') || originalName?.toLowerCase().endsWith('.xlsx') || originalName?.toLowerCase().endsWith('.csv')) {
      return 'Spreadsheet (XLSX)';
    }
    if (mimetype.includes('presentation') || mimetype.includes('powerpoint') || originalName?.toLowerCase().endsWith('.ppt') || originalName?.toLowerCase().endsWith('.pptx')) {
      return 'Presentation (PPTX)';
    }
    if (mimetype.includes('zip') || mimetype.includes('archive') || originalName?.toLowerCase().endsWith('.zip')) {
      return 'Archive (ZIP)';
    }
    return `Document (${getFileBadge(originalName, mimetype)})`;
  };

  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith('video/')) {
      return (
        <div className="flex items-center justify-center h-full w-full bg-gray-800 text-white">
          <svg className="w-14 h-14 text-brand-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        </div>
      );
    }
    if (mimetype.startsWith('audio/')) {
      return (
        <div className="flex items-center justify-center h-full w-full bg-purple-900 text-white">
          <svg className="w-14 h-14 text-purple-300" fill="currentColor" viewBox="0 0 20 20">
            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
          </svg>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center h-full w-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
        <svg className="w-16 h-16 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm1 14H9v-2h6v2zm0-4H9v-2h6v2zm-2-5V3.5L18.5 9H13z"/>
        </svg>
      </div>
    );
  };

  return (
    <div className="flex flex-col">
      {/* Top WP-Style Title & Add Button Bar */}
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-2xl font-normal text-gray-800 dark:text-white">Media Library</h1>
        <button
          onClick={() => setShowUploader(!showUploader)}
          className="px-3 py-1 text-sm font-medium rounded border border-brand-600 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950 transition-colors bg-white dark:bg-gray-800 shadow-sm"
        >
          {showUploader ? 'Close Uploader' : 'Add Media File'}
        </button>
      </div>

      {/* WP-Style Upload Dropzone */}
      {showUploader && (
        <div className="mb-6 p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50 flex flex-col items-center justify-center text-center">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Drop files to upload</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">or</p>
          
          {uploadError && (
            <div className="max-w-md w-full mb-6 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-800/30">
              <p className="font-semibold mb-1">Upload Failed</p>
              <p>{uploadError}</p>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileUpload(e.target.files)}
            multiple
            className="hidden"
          />
          
          {uploading ? (
            <div className="max-w-md w-full space-y-2">
              <div className="flex justify-between text-xs text-gray-500 font-medium">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-brand-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg shadow-sm transition-all"
            >
              Select Files
            </button>
          )}
          <p className="text-xs text-gray-400 mt-4">Maximum upload file size: 300 MB.</p>
        </div>
      )}

      {/* WP-Style Filter & Action Toolbar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-3 px-2 border-y border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 mb-6 min-h-[52px]">
        {bulkSelectMode ? (
          <div className="flex flex-wrap items-center gap-3 w-full">
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={selectedIds.size === 0}
              className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium rounded text-sm shadow-sm transition"
            >
              Delete permanently {selectedIds.size > 0 && `(${selectedIds.size})`}
            </button>
            <button
              type="button"
              onClick={() => {
                setBulkSelectMode(false);
                setSelectedIds(new Set());
              }}
              className="px-4 py-1.5 border border-brand-600 text-brand-600 bg-white dark:bg-gray-800 hover:bg-brand-50 dark:hover:bg-brand-950 font-medium rounded text-sm shadow-sm transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const allSelected = filteredItems.length > 0 && filteredItems.every(i => selectedIds.has(i.id));
                if (allSelected) {
                  setSelectedIds(new Set());
                } else {
                  setSelectedIds(new Set(filteredItems.map(i => i.id)));
                }
              }}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 border border-gray-300 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800 transition ml-auto sm:ml-2"
            >
              {filteredItems.length > 0 && filteredItems.every(i => selectedIds.has(i.id)) ? 'Deselect All' : `Select All (${filteredItems.length})`}
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              {/* View Mode Toggle Icons */}
              <div className="flex items-center border border-gray-300 dark:border-gray-700 rounded overflow-hidden">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 transition-colors ${viewMode === 'list' ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-600 bg-white dark:bg-gray-900'}`}
                  title="List view"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-600 bg-white dark:bg-gray-900'}`}
                  title="Grid view"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                </button>
              </div>

              {/* Type filter dropdown */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded focus:outline-none focus:border-brand-500 shadow-sm"
              >
                <option value="all">All media items</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
                <option value="document">Documents</option>
                <option value="audio">Audio</option>
              </select>

              {/* Date filter dropdown */}
              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded focus:outline-none focus:border-brand-500 shadow-sm cursor-pointer"
              >
                <option value="all">All dates</option>
                <option value="today">Today (Last 24 Hours)</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 3 months</option>
                <option value="year">This Year</option>
              </select>

              {/* Bulk select button */}
              <button
                type="button"
                onClick={() => setBulkSelectMode(true)}
                className="px-3 py-1.5 text-sm font-medium border border-brand-600 text-brand-600 bg-white dark:bg-gray-800 hover:bg-brand-50 dark:hover:bg-brand-950 rounded transition shadow-sm"
              >
                Bulk select
              </button>
            </div>

            {/* Search Input with WP Label */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">Search media</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded w-full sm:w-[220px] focus:outline-none focus:border-brand-500 shadow-sm"
              />
            </div>
          </>
        )}
      </div>

      {/* Media Grid / List Content */}
      {loading ? (
        <div className="py-16 text-center text-gray-500 dark:text-gray-400">Loading media library...</div>
      ) : filteredItems.length === 0 ? (
        <div className="py-16 text-center text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
          {searchQuery || filterType !== 'all' ? 'No media files match your filter.' : 'No media items found. Click "Add Media File" to upload files.'}
        </div>
      ) : viewMode === 'list' ? (
        <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 shadow-sm">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                {bulkSelectMode && <th className="p-3.5 w-10"></th>}
                <th className="p-3.5 w-14"></th>
                <th className="p-3.5">File</th>
                <th className="p-3.5">Author</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {filteredItems.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition ${selectedIds.has(item.id) ? 'bg-brand-50/50 dark:bg-brand-950/20' : ''}`}
                >
                  {bulkSelectMode && (
                    <td className="p-3.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => {}}
                        className="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500"
                      />
                    </td>
                  )}
                  <td className="p-3.5">
                    {item.mimetype.startsWith('image/') ? (
                      <img src={item.url} alt="" className="w-10 h-10 object-cover rounded border border-gray-200 dark:border-gray-700" />
                    ) : (
                      <div className="w-10 h-10 bg-brand-50 dark:bg-brand-950/40 rounded border border-brand-200 dark:border-brand-800 flex flex-col items-center justify-center text-[10px] font-bold text-brand-600 dark:text-brand-400 shadow-2xs">
                        <svg className="w-4 h-4 mb-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm1 14H9v-2h6v2zm0-4H9v-2h6v2zm-2-5V3.5L18.5 9H13z"/></svg>
                        <span>{getFileBadge(item.originalName, item.mimetype)}</span>
                      </div>
                    )}
                  </td>
                  <td className="p-3.5 font-medium text-brand-600 dark:text-brand-400 hover:underline">{item.originalName}</td>
                  <td className="p-3.5">Admin</td>
                  <td className="p-3.5 text-gray-700 dark:text-gray-300 font-medium">{formatFriendlyMimeType(item.mimetype, item.originalName)}</td>
                  <td className="p-3.5">{item.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={`group relative aspect-square rounded-sm overflow-hidden border bg-gray-100 dark:bg-gray-800 flex flex-col justify-between cursor-pointer transition-all ${
                bulkSelectMode && selectedIds.has(item.id)
                  ? 'border-2 border-brand-600 ring-2 ring-brand-600 shadow-md'
                  : selectedItem?.id === item.id
                  ? 'border-2 border-brand-600 ring-2 ring-brand-600 shadow-md'
                  : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm'
              }`}
            >
              {/* WP Screenshot 2: Checkbox in top right corner during bulk select */}
              {bulkSelectMode && (
                <div className="absolute top-2 right-2 z-10">
                  <div
                    className={`w-6 h-6 rounded flex items-center justify-center transition-all shadow-sm ${
                      selectedIds.has(item.id)
                        ? 'bg-brand-600 text-white border border-brand-600'
                        : 'bg-white/90 dark:bg-gray-800/90 border border-gray-400 dark:border-gray-500 text-transparent hover:border-brand-600'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Upper Thumbnail Area (3/4 height) */}
              <div className="h-3/4 w-full relative overflow-hidden flex items-center justify-center bg-gray-50 dark:bg-gray-800/80">
                {item.mimetype.startsWith('image/') ? (
                  <img
                    src={item.url}
                    alt={item.originalName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  getFileIcon(item.mimetype)
                )}
              </div>

              {/* Permanent White Footer Bar (1/4 height) exactly like WP Screenshot 1! */}
              <div className="h-1/4 w-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-2.5 py-1.5 flex items-center justify-start">
                <p className="text-xs text-gray-800 dark:text-gray-200 truncate font-normal leading-tight w-full" title={item.originalName}>
                  {item.originalName.replace(/\.[^/.]+$/, "")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* WP-Style Attachment Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden">
            {/* Left Preview */}
            <div className="md:w-3/5 bg-gray-100 dark:bg-gray-950 flex items-center justify-center p-6 overflow-auto min-h-[300px]">
              {selectedItem.mimetype.startsWith('image/') ? (
                <img src={selectedItem.url} alt={selectedItem.originalName} className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm" />
              ) : selectedItem.mimetype.startsWith('video/') ? (
                <video src={selectedItem.url} controls className="max-w-full max-h-[70vh] rounded-lg shadow-sm" />
              ) : selectedItem.mimetype.startsWith('audio/') ? (
                <div className="w-full p-8 text-center">
                  <audio src={selectedItem.url} controls className="w-full mb-4" />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{selectedItem.originalName}</p>
                </div>
              ) : (
                <div className="text-center p-8">
                  {getFileIcon(selectedItem.mimetype)}
                  <a
                    href={selectedItem.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block mt-4 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
                  >
                    Download / View Document
                  </a>
                </div>
              )}
            </div>

            {/* Right Attachment Details */}
            <div className="md:w-2/5 p-6 flex flex-col justify-between overflow-y-auto border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-800">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">Attachment Details</h3>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="py-4 space-y-3 text-sm border-b border-gray-200 dark:border-gray-800">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 block text-xs uppercase font-semibold">Uploaded on:</span>
                    <span className="text-gray-800 dark:text-gray-200 font-medium">{selectedItem.createdAt}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 block text-xs uppercase font-semibold">File name:</span>
                    <span className="text-gray-800 dark:text-gray-200 font-medium break-all">{selectedItem.originalName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 block text-xs uppercase font-semibold">File type:</span>
                    <span className="text-gray-800 dark:text-gray-200 font-medium">{formatFriendlyMimeType(selectedItem.mimetype, selectedItem.originalName)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 block text-xs uppercase font-semibold">File size:</span>
                    <span className="text-gray-800 dark:text-gray-200 font-medium">{formatFileSize(selectedItem.sizeBytes)}</span>
                  </div>
                </div>

                <div className="py-4 space-y-2">
                  <label className="block text-xs uppercase font-semibold text-gray-500 dark:text-gray-400">File URL:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={window.location.origin + selectedItem.url}
                      className="w-full px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 font-mono select-all focus:outline-none"
                    />
                    <button
                      onClick={() => copyUrl(selectedItem.url)}
                      className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-xs font-medium rounded-lg shrink-0 transition-colors"
                    >
                      {copySuccess ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
                <button
                  onClick={() => handleDelete(selectedItem.id)}
                  className="text-red-600 hover:text-red-700 text-sm font-semibold hover:underline"
                >
                  Delete Permanently
                </button>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom UI Confirmation Popup Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModalTarget !== null}
        onClose={() => {
          setDeleteModalTarget(null);
          setItemToDelete(null);
        }}
        onConfirm={() => {
          if (deleteModalTarget === 'bulk') {
            executeBulkDelete();
          } else if (deleteModalTarget === 'single') {
            executeSingleDelete();
          }
        }}
        title="Permanently Delete Media?"
        message={
          deleteModalTarget === 'bulk' ? (
            <p>
              You are about to permanently delete <strong className="text-gray-900 dark:text-white font-bold">{selectedIds.size} items</strong> from your site. This action cannot be undone.
            </p>
          ) : (
            <p>
              You are about to permanently delete this item from your site. This action cannot be undone.
            </p>
          )
        }
      />
    </div>
  );
}

