import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Inbox,
} from 'lucide-react';

const DataTable = ({
  columns = [],
  data = [],
  searchable = true,
  pageSize = 10,
  loading = false,
  emptyMessage = 'No data found',
}) => {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter
  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const val = row[col.key];
        return val !== undefined && val !== null && String(val).toLowerCase().includes(q);
      })
    );
  }, [data, search, columns]);

  // Sort
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey] ?? '';
      const bVal = b[sortKey] ?? '';
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const compare = String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? compare : -compare;
    });
  }, [filteredData, sortKey, sortDir]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const clampedPage = Math.min(currentPage, totalPages);
  const paginatedData = sortedData.slice(
    (clampedPage - 1) * pageSize,
    clampedPage * pageSize
  );

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const getSortIcon = (key) => {
    if (sortKey !== key) return <ChevronsUpDown className="w-3.5 h-3.5 opacity-40" />;
    return sortDir === 'asc' ? (
      <ChevronUp className="w-3.5 h-3.5 text-indigo-400" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 text-indigo-400" />
    );
  };

  // Page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, clampedPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  // Skeleton rows
  const SkeletonRow = () => (
    <tr>
      {columns.map((col, i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-4 bg-white/5 rounded-md animate-pulse w-3/4" />
        </td>
      ))}
    </tr>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl bg-white/5 dark:bg-white/5 bg-gray-100/80 backdrop-blur-xl border border-white/10 dark:border-white/10 border-gray-200/50 overflow-hidden shadow-lg"
    >
      {/* Search Bar */}
      {searchable && (
        <div className="p-4 border-b border-white/5 dark:border-white/5 border-gray-200/30">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={handleSearch}
              placeholder="Search records..."
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-white/5 dark:bg-white/5 bg-gray-50/60 border border-white/10 dark:border-white/10 border-gray-300/30 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all duration-300 backdrop-blur-md"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5 dark:border-white/5 border-gray-200/30">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`
                    px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider
                    text-gray-500 dark:text-gray-400
                    ${col.sortable !== false ? 'cursor-pointer hover:text-indigo-400 transition-colors select-none' : ''}
                  `}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1.5">
                    {col.label}
                    {col.sortable !== false && getSortIcon(col.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 dark:divide-white/5 divide-gray-200/20">
            {loading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <SkeletonRow key={i} />
              ))
            ) : paginatedData.length > 0 ? (
              <AnimatePresence mode="popLayout">
                {paginatedData.map((row, rowIndex) => (
                  <motion.tr
                    key={row.id || rowIndex}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2, delay: rowIndex * 0.03 }}
                    className="hover:bg-white/5 dark:hover:bg-white/5 hover:bg-gray-50/60 transition-colors duration-200"
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap"
                      >
                        {col.render
                          ? col.render(row[col.key], row)
                          : row[col.key] ?? '—'}
                      </td>
                    ))}
                  </motion.tr>
                ))}
              </AnimatePresence>
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-16 text-center"
                >
                  <div className="flex flex-col items-center gap-3">
                    <Inbox className="w-12 h-12 text-gray-600 dark:text-gray-700" />
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      {emptyMessage}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && sortedData.length > pageSize && (
        <div className="flex items-center justify-between px-5 py-4 border-t border-white/5 dark:border-white/5 border-gray-200/30">
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Showing{' '}
            <span className="font-medium text-gray-300 dark:text-gray-400">
              {(clampedPage - 1) * pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-medium text-gray-300 dark:text-gray-400">
              {Math.min(clampedPage * pageSize, sortedData.length)}
            </span>{' '}
            of{' '}
            <span className="font-medium text-gray-300 dark:text-gray-400">
              {sortedData.length}
            </span>{' '}
            results
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={clampedPage === 1}
              className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed text-gray-400 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {getPageNumbers().map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`
                  w-8 h-8 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer
                  ${
                    page === clampedPage
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                      : 'text-gray-400 hover:bg-white/5 hover:text-gray-300'
                  }
                `}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={clampedPage === totalPages}
              className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed text-gray-400 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default DataTable;
