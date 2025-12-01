import { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  Download,
  Loader2
} from 'lucide-react';

export default function DataTable({
  data,
  columns,
  pagination = true,
  pageSize = 10,
  sorting = true,
  filtering = true,
  loading = false,
  exportData = false,
  exportFormats = ['csv', 'excel'],
  onExport,
  onRowClick,
  rowClass,
  emptyMessage = "Aucune donnée disponible"
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filters, setFilters] = useState({});
  const [visibleColumns, setVisibleColumns] = useState(
    columns.reduce((acc, col) => ({ ...acc, [col.key]: true }), {})
  );

  // Filtrer les données
  const filteredData = data.filter(item => {
    return Object.entries(filters).every(([key, value]) => {
      if (!value) return true;
      const cellValue = item[key]?.toString().toLowerCase();
      return cellValue?.includes(value.toLowerCase());
    });
  });

  // Trier les données
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (aValue === bValue) return 0;
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    const comparison = aValue > bValue ? 1 : -1;
    return sortConfig.direction === 'asc' ? comparison : -comparison;
  });

  // Paginer les données
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = pagination
    ? sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sortedData;

  const handleSort = (key) => {
    if (!sorting) return;
    
    setSortConfig(current => ({
      key,
      direction:
        current.key === key && current.direction === 'asc'
          ? 'desc'
          : 'asc'
    }));
  };

  const handleFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1);
  };

  const handleExport = async (format) => {
    if (onExport) {
      await onExport(format, sortedData);
    }
  };

  const renderPagination = () => (
    <div className="flex items-center justify-between px-4 py-3 border-t">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700">
          Affichage de {((currentPage - 1) * pageSize) + 1} à{' '}
          {Math.min(currentPage * pageSize, sortedData.length)} sur{' '}
          {sortedData.length} résultats
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
          className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
        >
          <ChevronsLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <span className="px-4 py-1 text-sm text-gray-700">
          Page {currentPage} sur {totalPages}
        </span>
        
        <button
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <button
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
          className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
        >
          <ChevronsRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Toolbar */}
      <div className="px-4 py-3 border-b flex items-center justify-between">
        {/* Column visibility */}
        <div className="relative">
          <button
            onClick={() => setVisibleColumns(prev => {
              const allVisible = Object.values(prev).every(v => v);
              return columns.reduce(
                (acc, col) => ({ ...acc, [col.key]: !allVisible }),
                {}
              );
            })}
            className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Colonnes
          </button>
        </div>

        {/* Export */}
        {exportData && (
          <div className="flex items-center gap-2">
            {exportFormats.map(format => (
              <button
                key={format}
                onClick={() => handleExport(format)}
                className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {format.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map(column => (
                visibleColumns[column.key] && (
                  <th
                    key={column.key}
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      sorting ? 'cursor-pointer select-none' : ''
                    }`}
                    onClick={() => handleSort(column.key)}
                  >
                    <div className="flex items-center gap-2">
                      {column.header}
                      {sorting && sortConfig.key === column.key && (
                        sortConfig.direction === 'asc'
                          ? <ChevronUp className="w-4 h-4" />
                          : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                )
              ))}
            </tr>
            {filtering && (
              <tr>
                {columns.map(column => (
                  visibleColumns[column.key] && (
                    <th key={column.key} className="px-6 py-2">
                      <input
                        type="text"
                        value={filters[column.key] || ''}
                        onChange={e => handleFilter(column.key, e.target.value)}
                        placeholder={`Filtrer...`}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                      />
                    </th>
                  )
                ))}
              </tr>
            )}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Chargement...
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => (
                <tr
                  key={item.id || index}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={`${
                    onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''
                  } ${rowClass ? rowClass(item) : ''}`}
                >
                  {columns.map(column => (
                    visibleColumns[column.key] && (
                      <td
                        key={column.key}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                      >
                        {column.render
                          ? column.render(item[column.key], item)
                          : item[column.key]}
                      </td>
                    )
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && renderPagination()}
    </div>
  );
}
