import React from 'react';

export interface PaginationProps {
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  itemsPerPage: number;
  setItemsPerPage: React.Dispatch<React.SetStateAction<number>>;
  totalItems: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  setCurrentPage,
  itemsPerPage,
  setItemsPerPage,
  totalItems,
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col gap-2 border-t border-gray-100 px-4 py-2 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex h-6 items-center gap-1 rounded border border-gray-200 bg-white px-2 text-[11px] font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:disabled:hover:bg-gray-800"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back
          </button>
          
          {getPageNumbers().map((page, idx) => (
            page === '...' ? (
              <span key={`dots-${idx}`} className="flex h-6 w-6 items-center justify-center text-gray-400 text-[11px]">...</span>
            ) : (
              <button
                key={page}
                onClick={() => setCurrentPage(page as number)}
                className={`flex h-6 min-w-[1.5rem] items-center justify-center rounded border text-[11px] font-medium transition-colors ${
                  currentPage === page 
                    ? 'border-gray-800 bg-gray-800 text-white dark:border-gray-600 dark:bg-gray-600' 
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {page}
              </button>
            )
          ))}

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages || totalPages === 0}
            className="flex h-6 items-center gap-1 rounded border border-gray-200 bg-white px-2 text-[11px] font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:disabled:hover:bg-gray-800"
          >
            Next
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
        <span className="text-[11px] text-gray-500 dark:text-gray-400">
          {((currentPage - 1) * itemsPerPage) + (totalItems > 0 ? 1 : 0)}-{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
        </span>
      </div>
      <div className="flex items-center gap-2 text-[11px] text-gray-600 dark:text-gray-300">
        <span>Result per page</span>
        <select
          value={itemsPerPage}
          onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
          className="rounded border border-gray-200 bg-white px-1.5 py-0.5 focus:border-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:focus:border-gray-500 dark:focus:ring-gray-500"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>
    </div>
  );
};
