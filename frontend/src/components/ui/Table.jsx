import React from 'react';
import { ArrowUpDown } from 'lucide-react';

export function Table({
  columns = [],
  data = [],
  keyField = '_id',
  selectedId = null,
  onRowClick = null,
  emptyMessage = 'No records found.',
  className = ''
}) {
  return (
    <div className={`table-container ${className}`.trim()}>
      <table>
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th
                key={col.key || idx}
                style={{ textAlign: col.align || 'left', width: col.width }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span>{col.label}</span>
                  {col.sortable && <ArrowUpDown size={12} strokeWidth={1.75} aria-hidden="true" />}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: '32px' }}>
                <span style={{ color: 'var(--text-muted)' }}>{emptyMessage}</span>
              </td>
            </tr>
          ) : (
            data.map((row, rIdx) => {
              const rowKey = row[keyField] || rIdx;
              const isSelected = selectedId && row[keyField] === selectedId;

              return (
                <tr
                  key={rowKey}
                  className={isSelected ? 'selected' : ''}
                  onClick={() => onRowClick && onRowClick(row)}
                  style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {columns.map((col, cIdx) => (
                    <td
                      key={col.key || cIdx}
                      style={{ textAlign: col.align || 'left' }}
                      className={col.numeric ? 'num-cell' : ''}
                    >
                      {col.render ? col.render(row[col.key], row, rIdx) : row[col.key]}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
