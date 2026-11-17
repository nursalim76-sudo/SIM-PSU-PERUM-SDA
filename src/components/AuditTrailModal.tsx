import React, { useMemo, useState } from 'react';
import { Download, History, ShieldCheck, X } from 'lucide-react';
import { AuditLogEntry } from '../types/psu';

interface AuditTrailModalProps {
  isOpen: boolean;
  logs: AuditLogEntry[];
  onClose: () => void;
}

export const AuditTrailModal: React.FC<AuditTrailModalProps> = ({ isOpen, logs, onClose }) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        l.detail.toLowerCase().includes(q) ||
        l.actorLabel.toLowerCase().includes(q) ||
        (l.projectName && l.projectName.toLowerCase().includes(q))
    );
  }, [logs, search]);

  if (!isOpen) return null;

  const handleExportCsv = () => {
    const headers = ['Waktu', 'Peran Aktor', 'Unit Kerja', 'Aksi', 'Perumahan', 'Rincian'];
    const rows = filtered.map((l) => [
      `"${l.timestamp}"`,
      `"${l.actorLabel}"`,
      `"${l.actorUnit}"`,
      `"${l.action}"`,
      `"${l.projectName || '-'}"`,
      `"${l.detail.replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Audit_Trail_SIM_PSU_Sidoarjo.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Log Audit Trail Kepatuhan RBAC"
    >
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5 min-w-0">
            <ShieldCheck className="w-5 h-5 text-[#0F294A] shrink-0" />
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 truncate">
                Audit Trail & Log Kepatuhan RBAC SIM-PSU Sidoarjo
              </h3>
              <p className="text-xs text-slate-500">
                Rekam jejak kronologis setiap perubahan status administrasi, defect list, BAST, dan pencatatan BMD
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Ekspor CSV
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup log audit"
              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-6 py-3 border-b border-slate-200 bg-white flex items-center justify-between gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari aktivitas, nama perumahan, atau aktor peran..."
            className="w-full max-w-md px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F294A]"
          />
          <span className="text-xs font-mono text-slate-500 tabular-nums whitespace-nowrap">
            {filtered.length} Entri Log
          </span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
              <History className="w-6 h-6 text-slate-400" />
              <p>Belum ada entri audit trail yang cocok.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="py-2.5 px-4">Waktu</th>
                  <th className="py-2.5 px-4">Aktor & Peran</th>
                  <th className="py-2.5 px-4">Aksi Domain</th>
                  <th className="py-2.5 px-4">Perumahan</th>
                  <th className="py-2.5 px-4">Rincian Perubahan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {filtered.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap tabular-nums">
                      {entry.timestamp}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <p className="font-semibold text-slate-900">{entry.actorLabel}</p>
                      <p className="text-[11px] text-slate-500">{entry.actorUnit}</p>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px] font-semibold text-[#0F294A] whitespace-nowrap">
                      {entry.action}
                    </td>
                    <td className="py-2.5 px-4 text-slate-800 whitespace-nowrap">
                      {entry.projectName || '—'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700">{entry.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
