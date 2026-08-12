import React from 'react';

const UsersPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-admin-text tracking-tight">Users</h1>
          <p className="text-sm text-admin-text-muted mt-1">Manage platform users and roles.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-4 h-4 text-admin-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input
              type="text"
              className="bg-white border border-admin-border text-sm rounded-lg focus:ring-admin-primary focus:border-admin-primary block w-full pl-9 p-2 outline-none transition-colors"
              placeholder="Search users..."
            />
          </div>
          <button className="w-full sm:w-auto px-4 py-2 bg-white border border-admin-border rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center justify-center gap-2 shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            Filter
          </button>
          <button className="w-full sm:w-auto px-4 py-2 bg-admin-primary text-white rounded-lg text-sm font-medium hover:bg-admin-primary-hover flex items-center justify-center gap-2 shadow-sm transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add User
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-admin-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-admin-text-muted uppercase bg-gray-50/50 border-b border-admin-border">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold">User</th>
                <th scope="col" className="px-6 py-4 font-semibold">Role</th>
                <th scope="col" className="px-6 py-4 font-semibold">Status</th>
                <th scope="col" className="px-6 py-4 font-semibold">Joined</th>
                <th scope="col" className="px-6 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <svg className="w-10 h-10 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    <p className="text-sm font-medium text-admin-text">No users found</p>
                    <p className="text-xs text-admin-text-muted mt-1">Get started by creating a new user.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* Pagination placeholder */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-admin-border bg-gray-50/30">
          <span className="text-sm text-admin-text-muted">Showing 1 to 3 of 12 entries</span>
          <div className="flex gap-1">
            <button className="px-3 py-1 text-sm border border-admin-border rounded-md bg-white text-admin-text-muted disabled:opacity-50">Prev</button>
            <button className="px-3 py-1 text-sm border border-admin-border rounded-md bg-white text-admin-text hover:bg-gray-50">1</button>
            <button className="px-3 py-1 text-sm border border-admin-border rounded-md bg-white text-admin-text hover:bg-gray-50">2</button>
            <button className="px-3 py-1 text-sm border border-admin-border rounded-md bg-white text-admin-text hover:bg-gray-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
