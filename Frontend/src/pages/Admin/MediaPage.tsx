import React from 'react';

const MediaPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-admin-text tracking-tight">Media Library</h1>
          <p className="text-sm text-admin-text-muted mt-1">Manage your uploaded images and files.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-admin-primary text-white rounded-lg text-sm font-medium hover:bg-admin-primary-hover flex items-center justify-center gap-2 shadow-sm transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Upload Media
          </button>
        </div>
      </div>

      <div className="bg-white border border-admin-border rounded-xl shadow-sm overflow-hidden flex flex-col items-center justify-center py-24 text-center">
        <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
        <h3 className="text-lg font-medium text-admin-text">No media found</h3>
        <p className="text-sm text-admin-text-muted mt-1 max-w-sm">Your uploaded files and images will appear here.</p>
      </div>
    </div>
  );
};

export default MediaPage;
