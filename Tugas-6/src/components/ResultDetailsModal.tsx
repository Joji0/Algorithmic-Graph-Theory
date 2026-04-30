import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ResultDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  details: string[];
  algorithm?: string;
  timestamp?: number;
}

export function ResultDetailsModal({
  isOpen,
  onClose,
  title,
  message,
  details,
  algorithm,
  timestamp,
}: ResultDetailsModalProps) {
  // Parse timetabling ASCII table and convert to HTML table
  const renderTimetableTable = () => {
    const tableLines = details.filter((d) => d.includes('│') || d.includes('─'));
    if (tableLines.length === 0) return null;

    // Find header and data rows
    const headerIdx = tableLines.findIndex((line) => line.includes('Periode'));
    if (headerIdx === -1) return null;

    const headerLine = tableLines[headerIdx];
    // Parse header cells
    const headerCells = headerLine
      .split('│')
      .map((cell) => cell.trim())
      .filter((cell) => cell.length > 0);

    // Parse data rows (skip separator lines)
    const dataRows: string[][] = [];
    for (let i = headerIdx + 2; i < tableLines.length; i++) {
      const line = tableLines[i];
      if (line.includes('└') || line.includes('┘')) break;
      if (line.includes('├') || line.includes('┤')) continue;

      const cells = line
        .split('│')
        .map((cell) => cell.trim())
        .filter((cell) => cell.length > 0);
      if (cells.length > 0) {
        dataRows.push(cells);
      }
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-neon-purple/10 border-b border-neon-purple/30">
              {headerCells.map((cell, idx) => (
                <th
                  key={idx}
                  className="px-4 py-3 text-left font-semibold text-neon-cyan border-r border-white/10 last:border-r-0"
                >
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className="border-b border-white/5 hover:bg-white/[0.03] transition-colors"
              >
                {row.map((cell, cellIdx) => (
                  <td
                    key={cellIdx}
                    className="px-4 py-3 text-gray-300 border-r border-white/5 last:border-r-0"
                  >
                    {cell === '-' ? (
                      <span className="text-gray-600">—</span>
                    ) : (
                      <span>{cell}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-4 z-50 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/10 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex-shrink-0 p-6 border-b border-white/10 bg-gradient-to-r from-white/[0.02] to-transparent">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-1">{title}</h2>
                  <p className="text-base font-mono text-neon-cyan/80">{message}</p>
                  {timestamp && (
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(timestamp).toLocaleString()}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="flex-shrink-0 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Render timetable as HTML table if applicable */}
                {algorithm === 'timetabling' && renderTimetableTable() && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-200 mb-4 uppercase tracking-wider">
                      Jadwal Kelas
                    </h3>
                    {renderTimetableTable()}
                  </div>
                )}

                {/* Statistics and details */}
                {details.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-200 mb-3 uppercase tracking-wider">
                      {algorithm === 'timetabling' ? 'Analisis & Statistik' : 'Detail Hasil'}
                    </h3>
                    <div className="space-y-2 bg-white/[0.02] rounded-lg p-4 border border-white/5">
                      {details.map((detail, idx) => {
                        // Skip table lines
                        if (
                          detail.includes('│') ||
                          detail.includes('─') ||
                          detail.includes('┌') ||
                          detail.includes('┐') ||
                          detail.includes('└') ||
                          detail.includes('┘') ||
                          detail.includes('├') ||
                          detail.includes('┤') ||
                          detail.includes('┬') ||
                          detail.includes('┴') ||
                          detail === ''
                        ) {
                          return null;
                        }

                        const isHeader = detail.match(/^[A-Z][a-z]+.*:?$/);
                        const isBold =
                          detail.includes('Jadwal') ||
                          detail.includes('Statistik') ||
                          detail.includes('Analisis');

                        return (
                          <div
                            key={idx}
                            className={`text-sm ${
                              isBold
                                ? 'font-semibold text-gray-100'
                                : isHeader
                                  ? 'font-medium text-gray-300 mt-3 pt-2 border-t border-white/10'
                                  : 'text-gray-400'
                            }`}
                          >
                            {detail}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
