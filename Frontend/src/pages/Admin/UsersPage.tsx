import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router';
import { AdminAPI } from '../../api/admin';
import { ConfirmDeleteModal } from '../../components/ui/ConfirmDeleteModal';

type UserData = {
  id: number;
  email: string;
  name?: string;
  phoneNumber?: string;
  subscriptionStatus?: string;
  renewalDate?: string;
  lastRenewedOn?: string;
  updatedAt: string;
  createdAt: string;
};

type FilterRule = {
  id: string;
  logic: 'and' | 'or';
  column: keyof UserData;
  operator: string;
  value: string;
};

const INITIAL_USERS: UserData[] = [];

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'none' | 'columns' | 'filters'>('none');
  const [filters, setFilters] = useState<FilterRule[]>([]);
  
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [editEmail, setEditEmail] = useState('');
  
  const [visibleColumns, setVisibleColumns] = useState({
    email: true,
    name: true,
    phoneNumber: true,
    subscriptionStatus: true,
    renewalDate: false,
    lastRenewedOn: false,
    createdAt: true,
    updatedAt: false,
    id: false
  });



  const toggleTab = (tab: 'columns' | 'filters') => {
    setActiveTab(prev => prev === tab ? 'none' : tab);
  };

  const fetchUsers = async () => {
    try {
      const data = await AdminAPI.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchSettings = async () => {
    try {
      const data = await AdminAPI.getSettings();
      if (data.uiPreferences?.usersTableColumns) {
        setVisibleColumns(prev => ({ ...prev, ...data.uiPreferences.usersTableColumns }));
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchSettings();
  }, []);

  const addFilter = (logic: 'and' | 'or' = 'and') => {
    setFilters([...filters, { id: Math.random().toString(), logic, column: 'email', operator: 'contains', value: '' }]);
  };

  const updateFilter = (id: string, field: keyof FilterRule, value: string) => {
    setFilters(filters.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter(f => f.id !== id));
  };

  const filteredUsers = useMemo(() => {
    let result = users.filter(u => u.email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (filters.length === 0) return result;

    // Apply advanced AND/OR filters
    result = result.filter(u => {
      let finalResult = false;
      let currentAndResult = true;
      let hasValidFilters = false;

      for (let i = 0; i < filters.length; i++) {
        const filter = filters[i];
        if (!filter.value && filter.operator !== 'exists') {
          continue; // skip evaluation for empty rule
        }
        hasValidFilters = true;

        const cellValue = String(u[filter.column]).toLowerCase();
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
  }, [users, searchQuery, filters]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedUsers(filteredUsers.map(u => u.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (id: number) => {
    if (selectedUsers.includes(id)) {
      setSelectedUsers(selectedUsers.filter(userId => userId !== id));
    } else {
      setSelectedUsers([...selectedUsers, id]);
    }
  };

  const executeDeleteSelected = async () => {
    for (const id of selectedUsers) {
      await AdminAPI.deleteUser(id);
    }
    fetchUsers();
    setSelectedUsers([]);
  };

  const handleDeleteSelected = () => {
    if (selectedUsers.length === 0) return;
    setIsDeleteModalOpen(true);
  };

  const handleEditSelected = () => {
    if (selectedUsers.length > 1) {
      setWarningMessage('Only 1 item can be edited at once.');
      return;
    }
    if (selectedUsers.length === 1) {
      const userToEdit = users.find(u => u.id === selectedUsers[0]);
      if (userToEdit) {
        setEditingUserId(userToEdit.id);
        setEditEmail(userToEdit.email);
        setIsModalOpen(true);
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
            usersTableColumns: newCols
         }
      });
    } catch (err) {
      console.error('Error saving column preferences:', err);
    }
  };

  const hasSelection = selectedUsers.length > 0;

  return (
    <div className="w-full h-full relative">
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
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{selectedUsers.length} selected</span>
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
                placeholder="Search by Email"
              />
            </div>
          )}

          <div className="flex items-center gap-1.5">
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
                <span className="text-[11px] text-gray-700 dark:text-gray-300 font-semibold mb-0.5">Filter Users where</span>
                
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
                        <option value="email">Email</option>
                        <option value="name">Name</option>
                        <option value="phoneNumber">Phone Number</option>
                        <option value="subscriptionStatus">Subscription</option>
                        <option value="renewalDate">Renewal Date</option>
                        <option value="lastRenewedOn">Last Renewed On</option>
                        <option value="updatedAt">Updated At</option>
                        <option value="createdAt">Created At</option>
                        <option value="id">ID</option>
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
                    checked={filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length}
                    onChange={handleSelectAll}
                    className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 text-admin-primary focus:ring-admin-primary bg-white dark:bg-gray-900 cursor-pointer" 
                  />
                </th>
                {visibleColumns.email && (
                  <th scope="col" className="px-3 py-2 cursor-pointer hover:text-gray-700 group">
                    <div className="flex items-center gap-1">
                      Email
                      <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
                      </div>
                    </div>
                  </th>
                )}
                {visibleColumns.name && (
                  <th scope="col" className="px-3 py-2 cursor-pointer hover:text-gray-700 group">
                    <div className="flex items-center gap-1">
                      Name
                      <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
                      </div>
                    </div>
                  </th>
                )}
                {visibleColumns.phoneNumber && (
                  <th scope="col" className="px-3 py-2 cursor-pointer hover:text-gray-700 group">
                    <div className="flex items-center gap-1">
                      Phone Number
                      <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
                      </div>
                    </div>
                  </th>
                )}
                {visibleColumns.subscriptionStatus && (
                  <th scope="col" className="px-3 py-2 cursor-pointer hover:text-gray-700 group">
                    <div className="flex items-center gap-1">
                      Subscription
                      <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
                      </div>
                    </div>
                  </th>
                )}
                {visibleColumns.renewalDate && (
                  <th scope="col" className="px-3 py-2 cursor-pointer hover:text-gray-700 group">
                    <div className="flex items-center gap-1">
                      Renewal Date
                      <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
                      </div>
                    </div>
                  </th>
                )}
                {visibleColumns.lastRenewedOn && (
                  <th scope="col" className="px-3 py-2 cursor-pointer hover:text-gray-700 group">
                    <div className="flex items-center gap-1">
                      Last Renewed
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
                    <div className="flex items-center gap-1">
                      ID
                      <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
                      </div>
                    </div>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
              {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <tr key={user.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group ${selectedUsers.includes(user.id) ? 'bg-blue-50/30' : ''}`}>
                    <td className="px-3 py-2 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                        className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 text-admin-primary focus:ring-admin-primary bg-white dark:bg-gray-900 cursor-pointer" 
                      />
                    </td>
                    {visibleColumns.email && (
                      <td className="px-3 py-2">
                        <Link to="#" className="text-xs font-medium text-black dark:text-white hover:underline decoration-black dark:decoration-white underline-offset-2">
                          {user.email}
                        </Link>
                      </td>
                    )}
                    {visibleColumns.name && (
                      <td className="px-3 py-2 text-xs text-black dark:text-white">
                        {user.name || '-'}
                      </td>
                    )}
                    {visibleColumns.phoneNumber && (
                      <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                        {user.phoneNumber || '-'}
                      </td>
                    )}
                    {visibleColumns.subscriptionStatus && (
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          user.subscriptionStatus === 'yearly' ? 'bg-green-100 text-green-700' :
                          user.subscriptionStatus === 'monthly' ? 'bg-blue-100 text-blue-700' :
                          user.subscriptionStatus === 'trial' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}>
                          {user.subscriptionStatus || 'None'}
                        </span>
                      </td>
                    )}
                    {visibleColumns.renewalDate && (
                      <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                        {user.renewalDate ? new Date(user.renewalDate).toLocaleDateString() : '-'}
                      </td>
                    )}
                    {visibleColumns.lastRenewedOn && (
                      <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                        {user.lastRenewedOn ? new Date(user.lastRenewedOn).toLocaleDateString() : '-'}
                      </td>
                    )}
                    {visibleColumns.createdAt && (
                      <td className="px-3 py-2 text-xs text-black dark:text-white">
                        {new Date(user.createdAt).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    )}
                    {visibleColumns.updatedAt && (
                      <td className="px-3 py-2 text-xs text-black dark:text-white">
                        {new Date(user.updatedAt).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    )}
                    {visibleColumns.id && (
                      <td className="px-3 py-2 text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                        ID: <span className="text-black dark:text-white font-semibold">{user.id}</span>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">No users found matching your criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 shadow-2xl w-full max-w-md flex flex-col rounded-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">Edit User</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6">
              <form 
                className="flex flex-col gap-6" 
                onSubmit={(e) => { 
                  e.preventDefault(); 
                  const handleSaveUser = async () => {
                    if (!editEmail) return;

                    if (editingUserId) {
                      await AdminAPI.updateUser(editingUserId, { email: editEmail });
                    } else {
                      await AdminAPI.createUser({ email: editEmail });
                    }
                    
                    fetchUsers();
                    setIsModalOpen(false);
                    setEditingUserId(null);
                    setEditEmail('');
                  };
                  handleSaveUser();
                }}
              >
                <div className="flex flex-col">
                  <label className="text-[11px] font-bold text-gray-900 dark:text-white mb-1.5 flex items-center">
                    Email <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input type="email" className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:border-gray-300 rounded-sm transition-colors" required value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                </div>
                
                <div className="mt-2 flex justify-end">
                  <button type="submit" className="px-6 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-black font-medium rounded-sm hover:bg-black transition-colors text-[13px] shadow-sm">
                    Save Changes
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
        itemCount={selectedUsers.length}
      />
    </div>
  );
};

export default UsersPage;
