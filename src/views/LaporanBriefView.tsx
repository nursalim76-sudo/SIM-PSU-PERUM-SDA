import React from 'react';
import { Download, Printer } from 'lucide-react';
import { HousingProject } from '../types/psu';
import {
  formatAreaHa,
  formatAreaM2,
  formatCompactRupiah,
  formatRupiah,
  getActiveStage,
  getStatusMeta,
} from '../utils/formatters';

interface LaporanBriefViewProps {
  projects: HousingProject[];
}

export const LaporanBriefView: React.FC<LaporanBriefViewProps> = ({ projects }) => {
  const totalPsuM2 = projects.reduce((acc, p) => acc + p.luasWajibPsuM2, 0);
  const bmdProjects = projects.filter((p) =>
    p.stages.some((s) => s.status === 'BAST_SELESAI_BMD')
  );
  const diserahkanM2 = projects.reduce(
    (acc, p) =>
      acc +
      p.stages
        .filter((s) => s.status === 'BAST_SELESAI_BMD')
        .reduce((sAcc, s) => sAcc + s.luasPsuM2, 0),
    0
  );
  const totalBmdRp = projects.reduce(
    (acc, p) =>
      acc +
      p.stages.reduce(
        (sAcc, s) => sAcc + s.bmdAssets.reduce((bAcc, b) => bAcc + b.nilaiPerolehanRp, 0),
        0
      ),
    0
  );
  const ewsList = projects.filter(
    (p) => p.ewsFlag || p.status === 'BELUM_AJUKAN' || p.status === 'TERLANTAR_PAILIT'
  );

  const handleExportBriefHtml = () => {
    const content = document.getElementById('management-brief-printable')?.innerHTML;
    if (!content) return;
    const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"/><title>Management Brief SIM-PSU Sidoarjo</title><style>body{font-family:Arial,sans-serif;padding:36px;color:#0f172a;line-height:1.5}table{width:100%;border-collapse:collapse;margin:16px 0}th,td{border:1px solid #cbd5e1;padding:8px;font-size:12px;text-align:left}th{background:#f1f5f9}</style></head><body>${content}</body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Management_Brief_SIM_PSU_Sidoarjo_2026.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const headers = [
      'Nama Perumahan',
      'Pengembang',
      'Kecamatan',
      'Desa',
      'Nomor Siteplan',
      'Skema Penyerahan',
      'Luas Total (m2)',
      'Luas Wajib PSU (m2)',
      'Status Saat Ini',
      'Estimasi Nilai Aset (Rp)',
    ];
    const rows = projects.map((p) => [
      `"${p.namaPerumahan}"`,
      `"${p.pengembang}"`,
      `"${p.kecamatan}"`,
      `"${p.desa}"`,
      `"${p.nomorSiteplan}"`,
      `"${p.skemaPenyerahan}"`,
      p.luasTotalM2,
      p.luasWajibPsuM2,
      `"${getStatusMeta(p.status).label}"`,
      p.estimasiNilaiAsetRp,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Rekap_PSU_Perumahan_Sidoarjo_2026.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const ewsKecamatans = Array.from(new Set(ewsList.map((p) => p.kecamatan))).slice(0, 3);
  const abandonedProjects = projects.filter((p) => Boolean(p.abandonedInfo));

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Laporan & Management Brief Pimpinan Daerah
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dokumen ringkasan eksekutif untuk paparan Bupati dan Sekretaris Daerah Kabupaten Sidoarjo
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Unduh Rekap CSV
          </button>
          <button
            type="button"
            onClick={handleExportBriefHtml}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0D6E5B] rounded-lg hover:bg-emerald-800 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Ekspor Management Brief
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0F294A] rounded-lg hover:bg-[#163a66] cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak Brief
          </button>
        </div>
      </div>

      {/* Printable Brief Sheet */}
      <div
        id="management-brief-printable"
        className="bg-white border border-slate-200 rounded-xl p-6 md:p-10 space-y-6"
      >
        <div className="border-b-2 border-[#0F294A] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-[#0D6E5B] uppercase tracking-wider">
              PEMERINTAH KABUPATEN SIDOARJO · DP2CKTR
            </p>
            <h3 className="text-xl font-bold text-[#0F294A] mt-1">
              MANAGEMENT BRIEF: CAPAIAN PENYERAHAN PSU PERUMAHAN
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Acuan Regulasi: Peraturan Menteri Dalam Negeri Nomor 15 Tahun 2026
            </p>
          </div>
          <div className="text-xs font-mono text-slate-600 sm:text-right">
            <p>Tanggal Laporan: 16 Nov 2026</p>
            <p>Periode: Triwulan IV TA 2026</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-xs text-slate-500">Total Kawasan Terpantau</p>
            <p className="text-xl font-bold font-mono text-[#0F294A] tabular-nums mt-1">
              {projects.length} Proyek
            </p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-xs text-slate-500">Total Wajib PSU</p>
            <p className="text-xl font-bold font-mono text-slate-900 tabular-nums mt-1">
              {formatAreaHa(totalPsuM2)}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-xs text-slate-500">Sudah BAST & BMD</p>
            <p className="text-xl font-bold font-mono text-[#059669] tabular-nums mt-1">
              {bmdProjects.length} ({formatAreaHa(diserahkanM2)})
            </p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-xs text-slate-500">Nilai Aset BMD Tercatat</p>
            <p className="text-xl font-bold font-mono text-[#0D6E5B] tabular-nums mt-1">
              {formatCompactRupiah(totalBmdRp)}
            </p>
          </div>
        </div>

        <div className="space-y-2 text-xs md:text-sm text-slate-700 leading-relaxed">
          <h4 className="text-sm font-bold text-slate-900">1. Isu Strategis & Rekomendasi Tindak Lanjut</h4>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>Penertiban Pengembang Penunggak:</strong> Terdapat{' '}
              <span className="font-mono font-semibold">{ewsList.length}</span> perumahan dalam daftar
              prioritas EWS
              {ewsKecamatans.length > 0
                ? ` (tersebar di Kec. ${ewsKecamatans.join(', ')})`
                : ''}
              . Direkomendasikan penerbitan Surat Teguran III dan penahanan persetujuan siteplan lanjutan.
            </li>
            <li>
              <strong>Akselerasi Penetapan SK Bupati Jalur Khusus:</strong>{' '}
              {abandonedProjects.length > 0 ? (
                <>
                  Tercatat <span className="font-mono font-semibold">{abandonedProjects.length}</span>{' '}
                  kawasan jalur khusus (antara lain <em>{abandonedProjects[0].namaPerumahan}</em> pada tahap{' '}
                  <strong>{abandonedProjects[0].abandonedInfo?.currentStage}</strong>) untuk pengamanan
                  aset sepihak Pemkab Sidoarjo.
                </>
              ) : (
                'Belum ada usulan kawasan jalur khusus PSU terlantar aktif saat ini.'
              )}
            </li>
            <li>
              <strong>Integrasi KIB BPKAD:</strong> Total nilai aset PSU yang telah resmi tercatat
              dalam KIB A dan KIB D sebesar{' '}
              <span className="font-mono font-semibold">{formatRupiah(totalBmdRp)}</span>, membuka
              ruang penganggaran pemeliharaan rutin jalan dan drainase oleh Dinas PUBMSDA pada APBD TA 2027.
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold text-slate-900 mb-2">
            2. Matriks Status Seluruh Kawasan Perumahan
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-slate-300">
              <thead className="bg-slate-100">
                <tr>
                  <th className="py-2 px-3 text-left border-b border-slate-300">Perumahan</th>
                  <th className="py-2 px-3 text-left border-b border-slate-300">Kecamatan</th>
                  <th className="py-2 px-3 text-right border-b border-slate-300">Wajib PSU</th>
                  <th className="py-2 px-3 text-left border-b border-slate-300">Status Terkini</th>
                  <th className="py-2 px-3 text-left border-b border-slate-300">No. BA / BAST</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {projects.map((p) => {
                  const st = getActiveStage(p);
                  return (
                    <tr key={p.id}>
                      <td className="py-2 px-3 font-medium text-slate-900">{p.namaPerumahan}</td>
                      <td className="py-2 px-3 text-slate-700">{p.kecamatan}</td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums">
                        {formatAreaM2(p.luasWajibPsuM2)}
                      </td>
                      <td className="py-2 px-3">{getStatusMeta(p.status).label}</td>
                      <td className="py-2 px-3 font-mono text-slate-700">
                        {st.bastNumber || st.baAdminNumber || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
