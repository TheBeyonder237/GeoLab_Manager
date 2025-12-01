import { useState } from 'react';
import { Plus, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';

export default function TableEditor({ data, onChange }) {
  const [headers, setHeaders] = useState(data.headers || ['']);
  const [rows, setRows] = useState(data.rows || [['']]);

  const addColumn = () => {
    setHeaders([...headers, '']);
    setRows(rows.map(row => [...row, '']));
    updateParent([...headers, ''], rows.map(row => [...row, '']));
  };

  const addRow = () => {
    const newRow = new Array(headers.length).fill('');
    setRows([...rows, newRow]);
    updateParent(headers, [...rows, newRow]);
  };

  const removeColumn = (index) => {
    const newHeaders = headers.filter((_, i) => i !== index);
    const newRows = rows.map(row => row.filter((_, i) => i !== index));
    setHeaders(newHeaders);
    setRows(newRows);
    updateParent(newHeaders, newRows);
  };

  const removeRow = (index) => {
    const newRows = rows.filter((_, i) => i !== index);
    setRows(newRows);
    updateParent(headers, newRows);
  };

  const updateHeader = (index, value) => {
    const newHeaders = headers.map((h, i) => i === index ? value : h);
    setHeaders(newHeaders);
    updateParent(newHeaders, rows);
  };

  const updateCell = (rowIndex, colIndex, value) => {
    const newRows = rows.map((row, i) =>
      i === rowIndex
        ? row.map((cell, j) => j === colIndex ? value : cell)
        : row
    );
    setRows(newRows);
    updateParent(headers, newRows);
  };

  const moveColumn = (index, direction) => {
    if (
      (direction === -1 && index === 0) ||
      (direction === 1 && index === headers.length - 1)
    ) return;

    const newIndex = index + direction;
    const newHeaders = [...headers];
    [newHeaders[index], newHeaders[newIndex]] = [newHeaders[newIndex], newHeaders[index]];

    const newRows = rows.map(row => {
      const newRow = [...row];
      [newRow[index], newRow[newIndex]] = [newRow[newIndex], newRow[index]];
      return newRow;
    });

    setHeaders(newHeaders);
    setRows(newRows);
    updateParent(newHeaders, newRows);
  };

  const updateParent = (newHeaders, newRows) => {
    onChange({
      headers: newHeaders,
      rows: newRows
    });
  };

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={addColumn}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Ajouter colonne
        </button>
        <button
          onClick={addRow}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Ajouter ligne
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th key={index} className="border border-gray-300 p-2 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={header}
                      onChange={(e) => updateHeader(index, e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="En-tête"
                    />
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => moveColumn(index, -1)}
                        disabled={index === 0}
                        className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveColumn(index, 1)}
                        disabled={index === headers.length - 1}
                        className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeColumn(index)}
                      className="p-1 text-red-600 hover:text-red-700"
                      title="Supprimer la colonne"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, colIndex) => (
                  <td key={colIndex} className="border border-gray-300 p-2">
                    <input
                      type="text"
                      value={cell}
                      onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                ))}
                <td className="border border-gray-300 p-2">
                  <button
                    onClick={() => removeRow(rowIndex)}
                    className="p-1 text-red-600 hover:text-red-700"
                    title="Supprimer la ligne"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
