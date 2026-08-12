import React from 'react';

const GenericPagePlaceholder: React.FC<{ title: string, subtitle: string }> = ({ title, subtitle }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-admin-text tracking-tight">{title}</h1>
          <p className="text-sm text-admin-text-muted mt-1">{subtitle}</p>
        </div>
        <button className="px-4 py-2 bg-admin-primary text-white rounded-lg text-sm font-medium hover:bg-admin-primary-hover shadow-sm transition-colors">
          Add New
        </button>
      </div>

      <div className="bg-white border border-admin-border rounded-xl shadow-sm overflow-hidden flex flex-col items-center justify-center py-24 text-center">
        <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
        <h3 className="text-lg font-medium text-admin-text">No data found</h3>
        <p className="text-sm text-admin-text-muted mt-1 max-w-sm">There are no records in this collection yet. Click the "Add New" button above to get started.</p>
      </div>
    </div>
  );
};

export const BlogTopicsPage: React.FC = () => <GenericPagePlaceholder title="Blog Topics" subtitle="Manage topics for your blog content." />;
export const CategoriesPage: React.FC = () => <GenericPagePlaceholder title="Categories" subtitle="Manage case study categories." />;
export const SEOPage: React.FC = () => <GenericPagePlaceholder title="SEO Management" subtitle="Manage global SEO and metadata records." />;
export const ContactsPage: React.FC = () => <GenericPagePlaceholder title="Contacts" subtitle="View and manage user messages and inquiries." />;
export const SubscribersPage: React.FC = () => <GenericPagePlaceholder title="Subscribers" subtitle="Manage newsletter and updates subscribers." />;
