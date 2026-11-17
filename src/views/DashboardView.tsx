import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  FileCheck2,
  Landmark,
  Wrench,
} from 'lucide-react';
import { HousingProject, MenuId, SIDOARJO_KECAMATAN, UserRole } from '../types/psu';
import {
  formatAreaHa,
  formatAreaM2,
  formatCompactRupiah,
  formatDateId,
  getActiveStage,
  getAdminProgress,
  getPhysicalProgress,
} from '../utils/formatters';
import { StatusLabel } from '../components/StatusLabel';

interface DashboardViewProps {
  projects: HousingProject[];
  role: UserRole;
  onSelectProjectModule: (projectId: string, menu: MenuId) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects,
  role,
  onSelectProjectModule,
}) => {
  const [chartFilter, setChartFilter] = useState<'ALL' | 'ACTIVE'>('ALL');
  const [hoveredKecamatan, setHoveredKecamatan] = useState<string | null>(null);

  const metrics = useMemo(() => {
    let baAdminCount = 0;
    let bastCount = 0;
    let defectCount = 0;
    let abandonedCount = 0;
    let totalLuasDiserahkanM2 = 0;
    let totalNilaiBmdRp = 0;

    projects.forEach((p) => {
      if (p.status === 'TERLANTAR_PAILIT') abandonedCount += 1;
      if (p.status === 'PERBAIKAN_DEFECT') defectCount += 1;

      const hasBaAdmin = p.stages.some((s) => Boolean(s.baAdminNumber));
      if (hasBaAdmin) baAdminCount += 1;

      const hasBast = p.stages.some((s) => s.status === 'BAST_SELESAI_BMD');
      if (hasBast) bastCount += 1;

      p.stages.forEach((s) => {
        if (s.status === 'BAST_SELESAI_BMD') {
          totalLuasDiserahkanM2 += s.luasPsuM2;
          totalNilaiBmdRp += s.bmdAssets.reduce((acc, b) => acc + b.nilaiPerolehanRp, 0);
        }
      });
    });

    const totalEstimasiSemua = projects.reduce((acc, p) => acc + p.estimasiNilaiAsetRp, 0);

    return {
      totalProjects: projects.length,
      baAdminCount,
      bastCount,
      defectCount,
      abandonedCount,
      totalLuasDiserahkanM2,
      totalNilaiBmdRp,
      totalEstimasiSemua,
    };
  }, [projects]);

  const kecamatanStats = useMemo(() => {
    return SIDOARJO_KECAMATAN.map((kec) => {
      const inKec = projects.filter((p) => p.kecamatan === kec);
      if (inKec.length === 0) {
        return { kecamatan: kec, count: 0, adminAvg: 0, physicalAvg: 0 };
      }
      const adminAvg = Math.round(
        inKec.reduce((acc, p) => acc + getAdminProgress(getActiveStage(p)), 0) / inKec.length
      );
      const physicalAvg = Math.round(
        inKec.reduce((acc, p) => acc + getPhysicalProgress(getActiveStage(p)), 0) / inKec.length
      );
      return { kecamatan: kec, count: inKec.length, adminAvg, physicalAvg };
    });
  }, [projects]);

  const displayedChartData =
    chartFilter === 'ACTIVE' ? kecamatanStats.filter((d) => d.count > 0) : kecamatanStats;

  const ewsProjects = useMemo(() => {
    return projects.filter(
      (p) =>
        p.ewsFlag ||
        p.status === 'BELUM_AJUKAN' ||
        p.status === 'TERLANTAR_PAILIT' ||
        getActiveStage(p).defects.some((d) => d.status === 'Open')
    );
  }, [projects]);

  return (
    <div className="space-y-6">
      {/* Executive Welcome Context */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <p className="text-xs font-medium text-[#0D6E5B]">
            DP2CKTR Kabupaten Sidoarjo · Permendagri No. 15 Tahun 2026
          </p>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 mt-1">
            Ringkasan Eksekutif Penyerahan PSU Perumahan
          </h2>
        </div>
        <div className="text-xs text-slate-500 font-mono tabular-nums">
          Total Portofolio Terpantau: {projects.length} Kawasan · 18 Kecamatan
        </div>
      </div>

      {/* 6 Kartu KPI Utama */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Perumahan Terdata</p>
            <p className="text-2xl font-bold text-[#0F294A] font-mono tabular-nums mt-1.5">
              {metrics.totalProjects} <span className="text-sm font-normal text-slate-500">Kawasan</span>
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Baseline siteplan aktif lintas kecamatan Sidoarjo
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-100 text-[#0F294A] shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">BA Administrasi Terbit</p>
            <p className="text-2xl font-bold text-[#2563EB] font-mono tabular-nums mt-1.5">
              {metrics.baAdminCount} <span className="text-sm font-normal text-slate-500">Proyek</span>
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Memenuhi 6 syarat dokumen Pasal 11 Permendagri 15/2026
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-50 text-[#2563EB] shrink-0">
            <FileCheck2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">BAST Akhir Selesai</p>
            <p className="text-2xl font-bold text-[#059669] font-mono tabular-nums mt-1.5">
              {metrics.bastCount} <span className="text-sm font-normal text-slate-500">Proyek</span>
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Termasuk klaster selesai pada skema bertahap
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50 text-[#059669] shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">Dalam Perbaikan (Defect)</p>
            <p className="text-2xl font-bold text-[#D97706] font-mono tabular-nums mt-1.5">
              {metrics.defectCount} <span className="text-sm font-normal text-slate-500">Proyek</span>
            </p>
            <p className="text-xs text-slate-500 mt-2">
              BAPL & BAST terkunci selama defect belum tuntas
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-50 text-[#D97706] shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">PSU Terlantar / Pailit</p>
            <p className="text-2xl font-bold text-[#DC2626] font-mono tabular-nums mt-1.5">
              {metrics.abandonedCount} <span className="text-sm font-normal text-slate-500">Kawasan</span>
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Jalur khusus penyerahan sepihak Pemerintah Daerah
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-red-50 text-[#DC2626] shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">Luas PSU Diserahkan & Nilai BMD</p>
            <p className="text-2xl font-bold text-[#0D6E5B] font-mono tabular-nums mt-1.5">
              {formatAreaHa(metrics.totalLuasDiserahkanM2)}
            </p>
            <p className="text-xs text-slate-600 font-mono tabular-nums mt-2">
              Tercatat BMD: {formatCompactRupiah(metrics.totalNilaiBmdRp)} · Potensi: {formatCompactRupiah(metrics.totalEstimasiSemua)}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50 text-[#0D6E5B] shrink-0">
            <Landmark className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Grafik Komparasi 18 Kecamatan */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Progres Penyerahan Administrasi vs Fisik per Kecamatan
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cakupan seluruh 18 kecamatan di Kabupaten Sidoarjo (persentase rata-rata kesiapan)
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#0F294A]" />
                Administrasi
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#0D6E5B]" />
                Fisik Lapangan
              </span>
            </div>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setChartFilter('ALL')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  chartFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                18 Kecamatan
              </button>
              <button
                type="button"
                onClick={() => setChartFilter('ACTIVE')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  chartFilter === 'ACTIVE'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ada Proyek
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="min-w-[780px]">
            <div
              className="grid gap-2 items-end h-52 border-b border-slate-200 px-2 pb-2"
              style={{
                gridTemplateColumns: `repeat(${Math.max(1, displayedChartData.length)}, minmax(0, 1fr))`,
              }}
            >
              {displayedChartData.map((row) => {
                const isHovered = hoveredKecamatan === row.kecamatan;
                return (
                  <div
                    key={row.kecamatan}
                    onMouseEnter={() => setHoveredKecamatan(row.kecamatan)}
                    onMouseLeave={() => setHoveredKecamatan(null)}
                    className="relative flex flex-col items-center h-full justify-end group"
                  >
                    {isHovered && (
                      <div className="absolute -top-2 z-10 bg-slate-900 text-white text-[11px] px-2.5 py-1.5 rounded-md shadow-md whitespace-nowrap pointer-events-none">
                        <p className="font-semibold">{row.kecamatan} ({row.count} proyek)</p>
                        <p className="font-mono tabular-nums">Adm: {row.adminAvg}% · Fisik: {row.physicalAvg}%</p>
                      </div>
                    )}
                    <div className="flex items-end gap-1 w-full justify-center h-40">
                      <div
                        className="w-2.5 sm:w-3 bg-[#0F294A] rounded-t transition-all duration-200"
                        style={{ height: `${Math.max(4, (row.adminAvg / 100) * 100)}%`, opacity: row.count === 0 ? 0.15 : 1 }}
                        title={`${row.kecamatan} Administrasi: ${row.adminAvg}%`}
                      />
                      <div
                        className="w-2.5 sm:w-3 bg-[#0D6E5B] rounded-t transition-all duration-200"
                        style={{ height: `${Math.max(4, (row.physicalAvg / 100) * 100)}%`, opacity: row.count === 0 ? 0.15 : 1 }}
                        title={`${row.kecamatan} Fisik: ${row.physicalAvg}%`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div
              className="grid gap-2 px-2 pt-2"
              style={{
                gridTemplateColumns: `repeat(${Math.max(1, displayedChartData.length)}, minmax(0, 1fr))`,
              }}
            >
              {displayedChartData.map((row) => (
                <div key={`${row.kecamatan}-lbl`} className="text-center">
                  <p className="text-[10px] font-medium text-slate-600 truncate" title={row.kecamatan}>
                    {row.kecamatan}
                  </p>
                  <p className="text-[10px] font-mono text-slate-400 tabular-nums">
                    {row.count > 0 ? `${row.count} prj` : '0'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Early Warning System (EWS) */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-200">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Early Warning System (EWS) — Prioritas Penanganan
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Proyek menunggak penyerahan, melewati tenggat perbaikan defect, atau berstatus pailit/terlantar
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-[#DC2626] tabular-nums">
            {ewsProjects.length} Perumahan Perlu Atensi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4">Perumahan & Pengembang</th>
                <th className="py-3 px-4">Kecamatan</th>
                <th className="py-3 px-4 text-right">Wajib PSU</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Indikator Peringatan</th>
                <th className="py-3 px-4 text-right">Target / Tindak Lanjut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {ewsProjects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Seluruh kawasan perumahan dalam pantauan saat ini berada dalam kondisi aman (0 peringatan EWS aktif).
                  </td>
                </tr>
              ) : (
                ewsProjects.map((project) => {
                  const targetMenu: MenuId =
                    project.status === 'TERLANTAR_PAILIT'
                      ? 'psu-terlantar'
                      : project.status === 'PERBAIKAN_DEFECT'
                        ? 'survei-fisik'
                        : 'verifikasi-admin';

                return (
                  <tr key={project.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{project.namaPerumahan}</p>
                      <p className="text-slate-500 mt-0.5">{project.pengembang}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                      Kec. {project.kecamatan}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800 whitespace-nowrap">
                      {formatAreaM2(project.luasWajibPsuM2)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusLabel status={project.status} compact />
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-xs">
                      {project.ewsReason || 'Terdapat temuan defect fisik terbuka di lapangan.'}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-3">
                        <span className="font-mono text-slate-500 tabular-nums">
                          {formatDateId(project.targetPenyerahanDate)}
                        </span>
                        <button
                          type="button"
                          onClick={() => onSelectProjectModule(project.id, targetMenu)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#0F294A] bg-slate-100 hover:bg-slate-200 rounded-md whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          {role === 'PIMPINAN_DAERAH' ? 'Lihat Detail' : 'Tindak Lanjuti'}
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
