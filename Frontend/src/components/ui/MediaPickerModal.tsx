import React, { useState } from 'react';
import { Search, X, Upload } from 'lucide-react';

export type MediaData = {
  id: number | string;
  fileName: string;
  thumbnail: string;
  alt: string;
  url: string;
};

// Mock data based on MediaPage
const MOCK_MEDIA: MediaData[] = [
  { id: 1, fileName: 'logo.png', thumbnail: 'https://via.placeholder.com/150?text=Logo', alt: 'Logo', url: 'https://via.placeholder.com/600?text=Logo' },
  { id: 2, fileName: 'hero-banner.jpg', thumbnail: 'https://via.placeholder.com/150?text=Hero', alt: 'Hero Banner', url: 'https://via.placeholder.com/1200x400?text=Hero+Banner' },
  { id: 3, fileName: 'placeholder-1.jpg', thumbnail: 'https://via.placeholder.com/150?text=Image+1', alt: 'Image 1', url: 'https://via.placeholder.com/800x600?text=Image+1' },
];

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: MediaData) => void;
}

export default function MediaPickerModal({ isOpen, onClose, onSelect }: MediaPickerModalProps) {
  const [mediaList, setMediaList] = useState<MediaData[]>(MOCK_MEDIA);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library');
  const [selectedItem, setSelectedItem] = useState<MediaData | null>(null);
  
  if (!isOpen) return null;

  const filteredMedia = mediaList.filter(m => m.fileName.toLowerCase().includes(search.toLowerCase()));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const newMedia: MediaData = {
        id: Date.now().toString(),
        fileName: file.name,
        thumbnail: url,
        url: url,
        alt: file.name
      };
      setMediaList([newMedia, ...mediaList]);
      setActiveTab('library');
      setSelectedItem(newMedia);
    }
  };

  const handleSelectConfirm = () => {
    if (selectedItem) {
      onSelect(selectedItem);
      setSelectedItem(null);
    }
  };

  const handleClose = () => {
    setSelectedItem(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white w-full h-full max-h-[85vh] max-w-[1100px] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-8">
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Select Media</h2>
            
            <div className="flex bg-gray-100/80 p-1 rounded-lg">
              <button 
                type="button"
                onClick={() => setActiveTab('library')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'library' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Media Library
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'upload' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Upload Files
              </button>
            </div>
          </div>
          
          <button type="button" onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0 bg-white">
          
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 border-r border-gray-100">
            {activeTab === 'library' ? (
              <>
                {/* Toolbar */}
                <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between gap-4 shrink-0">
                  <select className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-emerald-500 bg-white">
                    <option>Images</option>
                    <option>Documents</option>
                    <option>Videos</option>
                  </select>
                  
                  <div className="relative w-64">
                    <input 
                      type="text" 
                      placeholder="Search media..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-3 pr-4 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 text-gray-700 placeholder:text-gray-400"
                    />
                  </div>
                </div>

                {/* Grid */}
                <div className="p-6 overflow-y-auto flex-1">
                  {filteredMedia.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center text-sm text-gray-500">
                      <div>
                        No media found. Switch to "Upload Files" to add items.
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                      {filteredMedia.map(media => (
                        <div 
                          key={media.id}
                          onClick={() => setSelectedItem(media)}
                          className={`group cursor-pointer rounded-lg overflow-hidden transition-all border-2 ${selectedItem?.id === media.id ? 'border-emerald-500 shadow-md' : 'border-transparent hover:border-gray-300 bg-gray-50'}`}
                        >
                          <div className="aspect-square bg-gray-100 overflow-hidden relative">
                            <img src={media.thumbnail} alt={media.alt} className="w-full h-full object-cover" />
                            {selectedItem?.id === media.id && (
                              <div className="absolute top-2 right-2 bg-emerald-500 text-white p-1 rounded-full shadow-sm">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              // Upload Tab
              <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50/50">
                <div className="w-full max-w-md bg-white border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-emerald-500 transition-colors">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload size={28} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Upload Media</h3>
                  <p className="text-sm text-gray-500 mb-6">Drag and drop files here, or click to select files</p>
                  <label className="inline-flex items-center justify-center px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 cursor-pointer transition-colors shadow-sm">
                    Select Files
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                  </label>
                </div>
              </div>
            )}
          </div>
          
          {/* Right Sidebar */}
          <div className="w-[300px] shrink-0 bg-gray-50/50 flex flex-col relative border-l border-gray-100">
            {selectedItem ? (
              <div className="p-6 overflow-y-auto flex-1">
                <div className="text-[11px] font-bold text-gray-900 uppercase tracking-wider mb-4">Attachment Details</div>
                <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden mb-4 border border-gray-200 flex items-center justify-center">
                  <img src={selectedItem.thumbnail} alt={selectedItem.alt} className="max-w-full max-h-full object-contain bg-white" />
                </div>
                <div className="text-sm text-gray-900 font-bold truncate mb-1" title={selectedItem.fileName}>
                  {selectedItem.fileName}
                </div>
                <div className="text-xs text-gray-500 mb-6 font-medium">
                  August 13, 2026<br/>
                  1.2 MB
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">URL</label>
                    <input type="text" readOnly value={selectedItem.url} className="w-full px-2 py-1.5 bg-gray-100 border border-gray-200 rounded text-xs text-gray-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Alt Text</label>
                    <input type="text" defaultValue={selectedItem.alt} className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm" />
                  </div>
                  <div className="pt-4 mt-4 border-t border-gray-200">
                    <button type="button" className="text-xs text-red-600 hover:text-red-700 font-medium transition-colors">Delete permanently</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 p-8 flex items-center justify-center text-center">
                <p className="text-sm text-gray-400 font-medium">Select an item from the library to view details and insert it.</p>
              </div>
            )}
            
            {/* Sidebar Footer */}
            <div className="p-4 bg-white border-t border-gray-200 flex justify-end gap-3 shrink-0">
              <button 
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-transparent hover:border-gray-200 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleSelectConfirm}
                disabled={!selectedItem}
                className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors shadow-sm ${selectedItem ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                Select Item
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
