import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router';
import BlockEditor from '../../components/form/BlockEditor';
import MediaPickerModal, { MediaData } from '../../components/ui/MediaPickerModal';

type BlogData = {
  id: number;
  title: string;
  topic: string;
  author: string;
  date: string;
  readMinutes: string;
  slug: string;
  description: string;
  content: string;
  image: string;
  updatedAt: string;
  createdAt: string;
};

const CustomDatePicker = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'days' | 'years'>('days');
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleSelectDate = (day: number) => {
    setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    setIsOpen(false);
  };
  
  const handleSelectYear = (year: number) => {
    setCurrentDate(new Date(year, currentDate.getMonth(), 1));
    setViewMode('days');
  };

  const formatDate = (d: Date | null) => {
    if (!d) return "";
    return `${String(d.getDate()).padStart(2, '0')} / ${String(d.getMonth() + 1).padStart(2, '0')} / ${d.getFullYear()}`;
  };

  const days = [];
  
  // Fill previous month empty days
  const prevMonthDays = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(
      <div key={`empty-${i}`} className="text-center text-gray-300 text-sm py-1.5 font-medium">
        {prevMonthDays - firstDayOfMonth + i + 1}
      </div>
    );
  }
  
  for (let i = 1; i <= daysInMonth; i++) {
    const isSelected = selectedDate?.getDate() === i && selectedDate?.getMonth() === currentDate.getMonth() && selectedDate?.getFullYear() === currentDate.getFullYear();
    const isToday = new Date().getDate() === i && new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();
    days.push(
      <div 
        key={i} 
        onClick={() => handleSelectDate(i)}
        className={`text-center text-sm cursor-pointer rounded-full flex items-center justify-center w-8 h-8 mx-auto transition-colors ${isSelected ? 'bg-admin-primary text-white shadow-md' : isToday ? 'bg-blue-50 text-admin-primary font-bold' : 'text-gray-700 hover:bg-gray-100 font-medium'}`}
      >
        {i}
      </div>
    );
  }
  
  // Generate years from 2024 to 2060
  const years = Array.from({length: 2060 - 2024 + 1}, (_, i) => 2024 + i);

  return (
    <div className="relative">
      <div className="relative" onClick={() => setIsOpen(!isOpen)}>
        <input 
          readOnly
          value={formatDate(selectedDate)}
          placeholder="dd / mm / yyyy" 
          className="w-full px-3 py-2 bg-white text-gray-700 border border-gray-200 text-sm focus:outline-none focus:border-gray-300 rounded-sm transition-colors pr-10 cursor-pointer shadow-sm placeholder-gray-400 font-medium" 
          required 
        />
        <span className="absolute text-gray-400 -translate-y-1/2 pointer-events-none right-3 top-1/2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        </span>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 z-50 p-4 bg-white rounded-xl shadow-xl border border-gray-100 w-[310px]">
          <div className="flex justify-between items-center mb-4">
            <h4 
              className="text-gray-800 font-bold text-sm flex items-center cursor-pointer hover:bg-gray-100 px-2 py-1 rounded-md transition-colors"
              onClick={() => setViewMode(viewMode === 'days' ? 'years' : 'days')}
            >
              {viewMode === 'days' ? (
                <>{currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}</>
              ) : (
                <>Select Year</>
              )}
              <svg className={`w-4 h-4 ml-1 text-gray-500 transition-transform ${viewMode === 'years' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </h4>
            
            {viewMode === 'days' && (
              <div className="flex gap-1">
                <button type="button" onClick={handlePrevMonth} className="text-gray-500 hover:bg-gray-100 hover:text-gray-800 rounded-md transition-colors p-1"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                <button type="button" onClick={handleNextMonth} className="text-gray-500 hover:bg-gray-100 hover:text-gray-800 rounded-md transition-colors p-1"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
              </div>
            )}
          </div>
          
          {viewMode === 'days' ? (
            <>
              <div className="grid grid-cols-7 gap-y-2 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                  <div key={d} className="text-center text-[11px] font-bold text-gray-400 uppercase">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-y-1 gap-x-1">
                {days}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-4 gap-2 max-h-[220px] overflow-y-auto pr-1">
              {years.map(year => (
                <div 
                  key={year}
                  onClick={() => handleSelectYear(year)}
                  className={`text-center py-2 text-sm cursor-pointer rounded-lg font-medium transition-colors ${year === currentDate.getFullYear() ? 'bg-admin-primary text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  {year}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

type FilterRule = {
  id: string;
  logic: 'and' | 'or';
  column: keyof BlogData;
  operator: string;
  value: string;
};

const INITIAL_BLOGS: BlogData[] = [
  { 
    id: 1, 
    title: 'How to use WhatsApp API', 
    topic: 'API', 
    author: 'Admin', 
    date: 'August 12th 2026', 
    readMinutes: '5', 
    slug: 'how-to-use-whatsapp-api',
    description: 'Learn how to integrate WhatsApp API in your app.',
    content: 'Full content goes here...',
    image: 'https://via.placeholder.com/150',
    updatedAt: 'August 12th 2026, 11:13 PM', 
    createdAt: 'August 12th 2026, 7:50 AM' 
  },
];

const BlogsPage: React.FC = () => {
  const [blogs, setBlogs] = useState<BlogData[]>(INITIAL_BLOGS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBlogs, setSelectedBlogs] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'none' | 'columns' | 'filters'>('none');
  const [filters, setFilters] = useState<FilterRule[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateTopicModalOpen, setIsCreateTopicModalOpen] = useState(false);
  const [topics, setTopics] = useState([
    { id: 'api', name: 'API' },
    { id: 'updates', name: 'Updates' },
    { id: 'tutorials', name: 'Tutorials' }
  ]);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  
  const [visibleColumns, setVisibleColumns] = useState({
    title: true,
    topic: true,
    author: true,
    date: true,
    readMinutes: true,
    id: false,
    slug: false,
    description: false,
    content: false,
    image: false,
    updatedAt: false,
    createdAt: false,
  });

  const toggleTab = (tab: 'columns' | 'filters') => {
    setActiveTab(prev => prev === tab ? 'none' : tab);
  };

  const addFilter = (logic: 'and' | 'or' = 'and') => {
    setFilters([...filters, { id: Math.random().toString(), logic, column: 'title', operator: 'contains', value: '' }]);
  };

  const updateFilter = (id: string, field: keyof FilterRule, value: string) => {
    setFilters(filters.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter(f => f.id !== id));
  };

  const filteredBlogs = useMemo(() => {
    let result = blogs.filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (filters.length === 0) return result;

    result = result.filter(b => {
      let finalResult = false;
      let currentAndResult = true;
      let hasValidFilters = false;

      for (let i = 0; i < filters.length; i++) {
        const filter = filters[i];
        if (!filter.value && filter.operator !== 'exists') {
          continue; 
        }
        hasValidFilters = true;

        const cellValue = String(b[filter.column]).toLowerCase();
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
  }, [blogs, searchQuery, filters]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedBlogs(filteredBlogs.map(b => b.id));
    } else {
      setSelectedBlogs([]);
    }
  };

  const handleSelectBlog = (id: number) => {
    if (selectedBlogs.includes(id)) {
      setSelectedBlogs(selectedBlogs.filter(blogId => blogId !== id));
    } else {
      setSelectedBlogs([...selectedBlogs, id]);
    }
  };

  const handleDeleteSelected = () => {
    setBlogs(blogs.filter(b => !selectedBlogs.includes(b.id)));
    setSelectedBlogs([]);
  };

  const handleEditSelected = () => {
    alert(`Editing mode would activate for Blog IDs: ${selectedBlogs.join(', ')}`);
  };

  const toggleColumn = (key: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const hasSelection = selectedBlogs.length > 0;

  return (
    <div className="w-full h-full">
      {/* Table Container */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
        
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-gray-200 px-3 py-1.5 bg-gray-50/50 min-h-[44px]">
          
          {hasSelection ? (
            <div className="flex items-center flex-1 gap-3 animate-in fade-in slide-in-from-left-2 duration-200">
              <span className="text-xs font-medium text-gray-700">{selectedBlogs.length} selected</span>
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={handleEditSelected}
                  className="px-2 py-1 bg-white border border-gray-200 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1 shadow-sm transition-colors"
                >
                  <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  Edit
                </button>
                <button 
                  onClick={handleDeleteSelected}
                  className="px-2 py-1 bg-white border border-red-100 rounded text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-1 shadow-sm transition-colors"
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
                className="bg-transparent border-none text-xs focus:ring-0 w-full outline-none placeholder-gray-400 text-gray-900"
                placeholder="Search by Title"
              />
            </div>
          )}

          <div className="flex items-center gap-1.5 ml-4">
            <button onClick={() => setIsCreateModalOpen(true)} className="px-3 py-1 bg-admin-primary text-white border border-transparent rounded text-xs font-medium hover:bg-admin-primary-hover flex items-center gap-1.5 shadow-sm transition-colors mr-2">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Create New
            </button>

            <button 
              onClick={() => toggleTab('columns')}
              className={`px-2 py-1 border rounded text-xs font-medium flex items-center gap-1 shadow-sm transition-colors ${activeTab === 'columns' ? 'bg-gray-100 border-gray-300 text-gray-900' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
            >
              Columns
              <svg className={`w-3 h-3 text-gray-400 transition-transform ${activeTab === 'columns' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            <button 
              onClick={() => toggleTab('filters')}
              className={`px-2 py-1 border rounded text-xs font-medium flex items-center gap-1 shadow-sm transition-colors ${activeTab === 'filters' ? 'bg-gray-100 border-gray-300 text-gray-900' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
            >
              Filters
              <svg className={`w-3 h-3 text-gray-400 transition-transform ${activeTab === 'filters' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
          </div>
        </div>

        {/* Expandable Sections */}
        {activeTab === 'columns' && (
          <div className="bg-gray-50/80 border-b border-gray-200 px-3 py-2 flex items-center gap-1.5 flex-wrap animate-in slide-in-from-top-1 fade-in duration-150">
            {Object.entries(visibleColumns).map(([key, isVisible]) => (
              <div 
                key={key} 
                onClick={() => toggleColumn(key as keyof typeof visibleColumns)}
                className={`flex items-center gap-1 px-2 py-0.5 border rounded text-[11px] font-medium shadow-sm cursor-pointer transition-colors ${isVisible ? 'bg-white border-gray-200 text-gray-700 hover:border-gray-300' : 'bg-gray-100 border-gray-200 text-gray-400'}`}
              >
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={isVisible ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} /></svg>
                {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'filters' && (
          <div className="bg-gray-50/80 border-b border-gray-200 px-3 py-3 flex flex-col items-start gap-3 animate-in slide-in-from-top-1 fade-in duration-150 w-full">
            {filters.length === 0 ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-500 font-medium">No filters set</span>
                <button 
                  onClick={() => addFilter('and')}
                  className="flex items-center gap-1 text-[11px] font-medium text-admin-text border border-gray-200 bg-white shadow-sm px-2 py-1 rounded hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add Filter
                </button>
              </div>
            ) : (
              <div className="flex flex-col w-full gap-2">
                <span className="text-[11px] text-gray-700 font-semibold mb-0.5">Filter Blogs where</span>
                
                {filters.map((filter, index) => (
                  <React.Fragment key={filter.id}>
                    {index > 0 && filter.logic === 'or' && (
                      <span className="text-[11px] text-gray-800 font-semibold my-1 uppercase tracking-wider">Or</span>
                    )}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 w-full">
                      {index > 0 && filter.logic === 'and' && (
                        <span className="text-[11px] text-gray-500 font-medium w-5 text-center sm:block hidden">and</span>
                      )}
                      
                      <select 
                        value={filter.column}
                        onChange={(e) => updateFilter(filter.id, 'column', e.target.value)}
                        className="bg-white border border-gray-300 text-[11px] rounded px-1.5 py-1 outline-none focus:border-admin-primary focus:ring-1 focus:ring-admin-primary w-full sm:w-32"
                      >
                        {Object.keys(visibleColumns).map(col => (
                           <option key={col} value={col}>{col.charAt(0).toUpperCase() + col.slice(1).replace(/([A-Z])/g, ' $1')}</option>
                        ))}
                      </select>

                      <select
                        value={filter.operator}
                        onChange={(e) => updateFilter(filter.id, 'operator', e.target.value)}
                        className="bg-white border border-gray-300 text-[11px] rounded px-1.5 py-1 outline-none focus:border-admin-primary focus:ring-1 focus:ring-admin-primary w-full sm:w-40"
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
                          type={filter.column.includes('At') || filter.column === 'date' ? 'date' : 'text'}
                          value={filter.value}
                          onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                          placeholder="Enter a value"
                          className="bg-white border border-gray-300 text-[11px] rounded px-2 py-1 outline-none focus:border-admin-primary focus:ring-1 focus:ring-admin-primary w-full"
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
            <thead className="bg-gray-100/75 border-b border-gray-200 text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
              <tr>
                <th scope="col" className="px-3 py-2 w-10 text-center">
                  <input 
                    type="checkbox" 
                    checked={filteredBlogs.length > 0 && selectedBlogs.length === filteredBlogs.length}
                    onChange={handleSelectAll}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-admin-primary focus:ring-admin-primary bg-white cursor-pointer" 
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
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredBlogs.length > 0 ? (
                filteredBlogs.map(blog => (
                  <tr key={blog.id} className={`hover:bg-gray-50/50 transition-colors group ${selectedBlogs.includes(blog.id) ? 'bg-blue-50/30' : ''}`}>
                    <td className="px-3 py-2 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedBlogs.includes(blog.id)}
                        onChange={() => handleSelectBlog(blog.id)}
                        className="w-3.5 h-3.5 rounded border-gray-300 text-admin-primary focus:ring-admin-primary bg-white cursor-pointer" 
                      />
                    </td>
                    {visibleColumns.title && (
                      <td className="px-3 py-2 min-w-[200px]">
                        <Link to="#" className="text-xs font-medium text-black hover:underline decoration-black underline-offset-2">
                          {blog.title}
                        </Link>
                      </td>
                    )}
                    {visibleColumns.topic && (
                      <td className="px-3 py-2 text-xs text-black">
                        {blog.topic}
                      </td>
                    )}
                    {visibleColumns.author && (
                      <td className="px-3 py-2 text-xs text-black">
                        {blog.author}
                      </td>
                    )}
                    {visibleColumns.date && (
                      <td className="px-3 py-2 text-xs text-black whitespace-nowrap">
                        {blog.date}
                      </td>
                    )}
                    {visibleColumns.readMinutes && (
                      <td className="px-3 py-2 text-xs text-black">
                        {blog.readMinutes} min
                      </td>
                    )}
                    {visibleColumns.id && (
                      <td className="px-3 py-2 text-[11px] text-gray-500 font-mono">
                        {blog.id}
                      </td>
                    )}
                    {visibleColumns.slug && (
                      <td className="px-3 py-2 text-[11px] text-gray-500">
                        /{blog.slug}
                      </td>
                    )}
                    {visibleColumns.description && (
                      <td className="px-3 py-2 text-[11px] text-gray-500 truncate max-w-[150px]">
                        {blog.description}
                      </td>
                    )}
                    {visibleColumns.content && (
                      <td className="px-3 py-2 text-[11px] text-gray-500 truncate max-w-[150px]">
                        {blog.content}
                      </td>
                    )}
                    {visibleColumns.image && (
                      <td className="px-3 py-2 text-[11px] text-blue-600 truncate max-w-[150px] hover:underline cursor-pointer">
                        {blog.image}
                      </td>
                    )}
                    {visibleColumns.updatedAt && (
                      <td className="px-3 py-2 text-[11px] text-gray-500 whitespace-nowrap">
                        {blog.updatedAt}
                      </td>
                    )}
                    {visibleColumns.createdAt && (
                      <td className="px-3 py-2 text-[11px] text-gray-500 whitespace-nowrap">
                        {blog.createdAt}
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={13} className="px-3 py-8 text-center">
                    <p className="text-xs text-gray-500 font-medium">No blogs found matching your criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
      </div>
      
      {/* Create New Blog Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white shadow-2xl w-full max-w-5xl flex flex-col my-8 rounded-md overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <h3 className="font-bold text-gray-900 text-lg tracking-tight">Creating new Blog</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-8 overflow-y-auto">
              <form className="flex flex-col gap-6" onSubmit={(e) => { e.preventDefault(); setIsCreateModalOpen(false); }}>
                
                {/* Title */}
                <div className="flex flex-col">
                  <label className="text-[11px] font-bold text-gray-900 mb-1.5 flex items-center">
                    Title <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input type="text" className="w-full px-3 py-2 bg-white border border-gray-200 text-sm focus:outline-none focus:border-gray-300 rounded-sm transition-colors" required />
                </div>

                {/* Slug */}
                <div className="flex flex-col">
                  <label className="text-[11px] font-bold text-gray-900 mb-1.5 flex items-center">
                    Slug <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input type="text" className="w-full px-3 py-2 bg-white border border-gray-200 text-sm focus:outline-none focus:border-gray-300 rounded-sm transition-colors" required />
                  <p className="text-[11px] text-gray-500 mt-1.5">URL-friendly identifier. Must be unique.</p>
                </div>

                {/* Description */}
                <div className="flex flex-col">
                  <label className="text-[11px] font-bold text-gray-900 mb-1.5 flex items-center">
                    Description <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input type="text" className="w-full px-3 py-2 bg-white border border-gray-200 text-sm focus:outline-none focus:border-gray-300 rounded-sm transition-colors" required />
                </div>

                {/* Content */}
                <div className="flex flex-col">
                  <label className="text-[11px] font-bold text-gray-900 mb-1.5 flex items-center">
                    Content <span className="text-red-500 ml-1">*</span>
                  </label>
                  <BlockEditor 
                    value="" 
                    onChange={(val) => { console.log(val); }} 
                  />
                </div>

                {/* Topic */}
                <div className="flex flex-col">
                  <label className="text-[11px] font-bold text-gray-900 mb-1.5 flex items-center">
                    Topic <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="flex">
                    <select className="flex-1 px-3 py-2 bg-white border border-gray-200 border-r-0 text-sm focus:outline-none focus:border-gray-300 rounded-l-sm transition-colors appearance-none" required>
                      <option value="">Select a value</option>
                      {topics.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => setIsCreateTopicModalOpen(true)} className="px-4 border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center rounded-r-sm text-gray-500 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                    </button>
                  </div>
                </div>

                {/* Date */}
                <div className="flex flex-col">
                  <label className="text-[11px] font-bold text-gray-900 mb-1.5 flex items-center">
                    Date <span className="text-red-500 ml-1">*</span>
                  </label>
                  <CustomDatePicker />
                </div>

                {/* Read Minutes */}
                <div className="flex flex-col">
                  <label className="text-[11px] font-bold text-gray-900 mb-1.5 flex items-center">
                    Read Minutes <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input type="number" min="1" className="w-full px-3 py-2 bg-white border border-gray-200 text-sm focus:outline-none focus:border-gray-300 rounded-sm transition-colors" required />
                  <p className="text-[11px] text-gray-500 mt-1.5">Estimated reading time in minutes</p>
                </div>

                {/* Author */}
                <div className="flex flex-col">
                  <label className="text-[11px] font-bold text-gray-900 mb-1.5 flex items-center">
                    Author <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input type="text" className="w-full px-3 py-2 bg-white border border-gray-200 text-sm focus:outline-none focus:border-gray-300 rounded-sm transition-colors" required />
                </div>

                {/* Image */}
                <div className="flex flex-col">
                  <label className="text-[11px] font-bold text-gray-900 mb-1.5 flex items-center">
                    Image
                  </label>
                  {coverImage ? (
                    <div className="relative group rounded-sm overflow-hidden border border-gray-200 w-full h-40">
                      <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => setCoverImage(null)} className="px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded shadow-sm hover:bg-red-600 transition-colors">
                          Remove Image
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed border-gray-300 rounded-sm p-3 bg-gray-50/30 flex items-center justify-between transition-colors">
                      <button 
                        type="button" 
                        onClick={() => setIsMediaPickerOpen(true)}
                        className="px-4 py-1.5 bg-gray-900 text-white text-[11px] font-medium rounded-sm shadow-sm hover:bg-black transition-colors"
                      >
                        Upload Media
                      </button>
                      <div className="text-[11px] text-gray-400 font-medium mr-2">
                        or drag and drop a file
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Save Button */}
                <div className="mt-4 flex">
                  <button type="submit" className="px-6 py-2 bg-gray-900 text-white font-medium rounded-sm hover:bg-black transition-colors text-[13px] shadow-sm">
                    Save
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      )}
      {/* Create New Topic Modal */}
      {isCreateTopicModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white shadow-2xl w-full max-w-5xl flex flex-col my-8 rounded-md overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-white">
              <h3 className="font-bold text-gray-900 text-lg tracking-tight">Creating new Blog Topic</h3>
              <button onClick={() => setIsCreateTopicModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-8">
              <form 
                className="flex flex-col gap-6" 
                onSubmit={(e) => { 
                  e.preventDefault(); 
                  if (newTopicTitle.trim()) {
                    setTopics([...topics, { id: newTopicTitle.toLowerCase().replace(/\s+/g, '-'), name: newTopicTitle.trim() }]);
                    setNewTopicTitle('');
                    setIsCreateTopicModalOpen(false);
                  }
                }}
              >
                {/* Title */}
                <div className="flex flex-col">
                  <label className="text-[11px] font-bold text-gray-900 mb-1.5 flex items-center">
                    Title <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={newTopicTitle}
                    onChange={(e) => setNewTopicTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 text-sm focus:outline-none focus:border-gray-300 rounded-sm transition-colors" 
                    required 
                  />
                </div>
                
                {/* Save Button */}
                <div className="mt-4 flex">
                  <button type="submit" className="px-6 py-2 bg-gray-900 text-white font-medium rounded-sm hover:bg-black transition-colors text-[13px] shadow-sm">
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      <MediaPickerModal 
        isOpen={isMediaPickerOpen} 
        onClose={() => setIsMediaPickerOpen(false)} 
        onSelect={(media) => {
          setCoverImage(media.url);
          setIsMediaPickerOpen(false);
        }} 
      />
    </div>
  );
};

export default BlogsPage;
