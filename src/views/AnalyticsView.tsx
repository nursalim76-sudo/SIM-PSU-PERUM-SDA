import React, { useMemo } from 'react';
import { AlertTriangle, ArrowRight, Calculator, ShieldAlert, TrendingUp } from 'lucide-react';
import { HousingProject, MenuId, ProjectStatus } from '../types/psu';
import {
  formatAreaHa,
  formatAreaM2,
  formatCompactRupiah,
  getActiveStage,
  getMeasurementRatio,
  getStatusMeta,
} from '../utils/formatters';

interface AnalyticsViewProps {
  projects: HousingProject[];
  onNavigateModule: (menu: MenuId) => void;
  onSelectProjectModule?: (projectId: string, menu: MenuId) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  projects,
  onNavigateModule,
  onSelectProjectModule,
}) => {
  const insight = useMemo(() => {
    const totalPsuM2 = projects.reduce((acc, p) => acc + p.luasWajibPsuM2, 0);
    const diserahkanM2 = projects.reduce(
      (acc, p) =>
        acc +
        p.stages
          .filter((s) => s.status === 'BAST_SELESAI_BMD')
          .reduce((sAcc, st) => sAcc + st.luasPsuM2, 0),
      0
    );
    const serahRatio = totalPsuM2 > 0 ? Math.round((diserahkanM2 / totalPsuM2) * 100) : 0;

    const kecArrears: Record<string, number> = {};
    projects.forEach((p) => {
      if (p.status === 'BELUM_AJUKAN' || p.status === 'PERBAIKAN_DEFECT' || p.status === 'TERLANTAR_PAILIT') {
        kecArrears[p.kecamatan] = (kecArrears[p.kecamatan] || 0) + 1;
      }
    });
    const topArrearKec = Object.entries(kecArrears).sort((a, b) => b[1] - a[1]);

    const defectByCategory: Record<string, number> = { Prasarana: 0, Sarana: 0, Utilitas: 0 };
    projects.forEach((p) => {
      p.stages.forEach((s) => {
        s.defects.forEach((d) => {
          defectByCategory[d.category] = (defectByCategory[d.category] || 0) + 1;
        });
      });
    });
    const topDefectCat = Object.entries(defectByCategory).sort((a, b) => b[1] - a[1]);

    const statusCounts: Record<ProjectStatus, number> = {
      BAST_SELESAI_BMD: 0,
      BA_ADMIN_PEMELIHARAAN: 0,
      PROSES_ADMIN: 0,
      PERBAIKAN_DEFECT: 0,
      BELUM_AJUKAN: 0,
      TERLANTAR_PAILIT: 0,
    };
    projects.forEach((p) => {
      statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
    });

    const totalBmdVal = projects.reduce(
      (acc, p) =>
        acc +
        p.stages.reduce(
          (sAcc, st) => sAcc + st.bmdAssets.reduce((bAcc, b) => bAcc + b.nilaiPerolehanRp, 0),
          0
        ),
      0
    );

    // Anomaly Detection (PRD Section 6): <95% physical ratio OR PSU proportion <35%
    const anomalies = projects
      .map((p) => {
        const st = getActiveStage(p);
        const lowItems = st.physicalChecklist.filter(
          (i) => i.actualVolume > 0 && getMeasurementRatio(i.siteplanVolume, i.actualVolume) < 95
        );
        const psuPct = p.luasTotalM2 > 0 ? Math.round((p.luasWajibPsuM2 / p.luasTotalM2) * 100) : 0;
        const bmdBacklog = Boolean(st.bastNumber) && st.bmdAssets.length === 0;
        const reasons: string[] = [];
        if (lowItems.length > 0) {
          reasons.push(`${lowItems.length} komponen PSU aktual <95% dari siteplan`);
        }
        if (psuPct < 35) {
          reasons.push(`Proporsi PSU ${psuPct}% di bawah rekomendasi tata ruang 35-40%`);
        }
        if (bmdBacklog) {
          reasons.push('BAST Akhir terbit namun belum tercatat KIB BPKAD');
        }
        return { project: p, reasons, psuPct };
      })
      .filter((x) => x.reasons.length > 0);

    // Predictive Risk & Smart Prioritization Ranking (PRD Section 6 & 8.4)
    const prioritizedQueue = projects
      .filter((p) => p.status !== 'BAST_SELESAI_BMD')
      .map((p) => {
        const st = getActiveStage(p);
        const openDefects = st.defects.filter((d) => d.status !== 'Closed').length;
        let riskScore = 20;
        if (p.status === 'BELUM_AJUKAN') riskScore += 45;
        if (p.status === 'TERLANTAR_PAILIT') riskScore += 55;
        if (p.ewsFlag) riskScore += 20;
        riskScore += openDefects * 12;
        if (p.luasWajibPsuM2 >= 25000) riskScore += 10;
        riskScore = Math.min(99, riskScore);

        const recommendation =
          p.status === 'TERLANTAR_PAILIT'
            ? 'Ajukan penetapan SK Bupati penyerahan sepihak & pengamanan aset BMD.'
            : p.status === 'BELUM_AJUKAN'
              ? 'Terbitkan Surat Teguran & jadwalkan pemanggilan pengembang oleh Sekretariat DP2CKTR.'
              : openDefects > 0
                ? `Tagih penyelesaian ${openDefects} defect terbuka sebelum batas masa pemeliharaan.`
                : 'Lanjutkan evaluasi dokumen pelepasan hak tanah atau verifikasi akhir BAPL.';

        return { project: p, riskScore, recommendation };
      })
      .sort((a, b) => b.riskScore - a.riskScore);

    // Asset Valuation Estimator (PRD Section 6): estimated remaining unrealized PSU value
    const unrealizedValueRp = projects
      .filter((p) => p.status !== 'BAST_SELESAI_BMD')
      .reduce((acc, p) => acc + p.estimasiNilaiAsetRp, 0);

    return {
      totalPsuM2,
      diserahkanM2,
      serahRatio,
      topArrearKec,
      defectByCategory,
      topDefectCat,
      statusCounts,
      totalBmdVal,
      anomalies,
      prioritizedQueue,
      unrealizedValueRp,
    };
  }, [projects]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Analytics, Anomaly Detection & Smart Recommendation
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sintesis otomatis capaian triwulanan, deteksi anomali selisih luas, skor risiko kepatuhan, dan estimasi nilai aset BMD
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigateModule('laporan-brief')}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0F294A] rounded-lg hover:bg-[#163a66] whitespace-nowrap shrink-0 cursor-pointer"
        >
          Buka Management Brief
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Executive Narrative Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-[#0D6E5B]">
          <TrendingUp className="w-5 h-5" />
          <h3 className="text-base font-bold text-slate-900">
            Ringkasan Narasi Eksekutif (Triwulan IV — 2026)
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 text-sm text-slate-700 leading-relaxed pt-2">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-xs font-semibold text-[#0F294A] mb-1.5">
              01. Capaian Serah Terima & BMD
            </p>
            <p className="text-xs leading-relaxed">
              Total luas wajib PSU terdata mencapai{' '}
              <strong className="font-mono">{formatAreaHa(insight.totalPsuM2)}</strong>. Sebanyak{' '}
              <strong className="font-mono text-[#059669]">
                {formatAreaHa(insight.diserahkanM2)} ({insight.serahRatio}%)
              </strong>{' '}
              telah selesai BAST Akhir dengan nilai tercatat{' '}
              <strong className="font-mono">{formatCompactRupiah(insight.totalBmdVal)}</strong>.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-xs font-semibold text-[#DC2626] mb-1.5">
              02. Kecamatan Risiko Tertinggi
            </p>
            <p className="text-xs leading-relaxed">
              Prioritas penertiban berada pada{' '}
              <strong>
                {insight.topArrearKec.length > 0
                  ? insight.topArrearKec
                      .slice(0, 3)
                      .map(([k, n]) => `Kec. ${k} (${n})`)
                      .join(', ')
                  : 'tidak ada tunggakan aktif'}
              </strong>
              . Perlu pemanggilan pengembang penunggak & penetapan SK Bupati jalur khusus.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-xs font-semibold text-[#D97706] mb-1.5">
              03. Pola Defect Dominan
            </p>
            <p className="text-xs leading-relaxed">
              Temuan terbanyak berasal dari kategori{' '}
              <strong>{insight.topDefectCat[0]?.[0] || 'Prasarana'}</strong> (
              <strong className="font-mono">{insight.topDefectCat[0]?.[1] || 0} temuan</strong>),
              didominasi drainase U-ditch, penyusutan RTH (&lt;95%), dan PJU mati.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-xs font-semibold text-[#0D6E5B] mb-1.5 flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5" />
              04. Potensi Nilai Aset Dalam Proses
            </p>
            <p className="text-xs leading-relaxed">
              Estimasi nilai taksiran PSU yang berpotensi masuk neraca BMD setelah proses selesai:{' '}
              <strong className="font-mono text-[#0F294A]">
                {formatCompactRupiah(insight.unrealizedValueRp)}
              </strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Anomaly Detection & Smart Prioritization Engine (PRD Section 6) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#0F294A]" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Smart Prioritization Engine & Skor Risiko Kepatuhan
                </h3>
                <p className="text-xs text-slate-500">
                  Urutan prioritas penagihan dan rekomendasi tindak lanjut per kawasan
                </p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                  <th className="py-2.5 px-4">Perumahan & Kecamatan</th>
                  <th className="py-2.5 px-4 text-right">Wajib PSU</th>
                  <th className="py-2.5 px-4 text-center">Skor Risiko</th>
                  <th className="py-2.5 px-4">Rekomendasi Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {insight.prioritizedQueue.slice(0, 6).map(({ project, riskScore, recommendation }) => (
                  <tr key={project.id} className="hover:bg-slate-50/70 align-top">
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() =>
                          onSelectProjectModule?.(
                            project.id,
                            project.status === 'TERLANTAR_PAILIT'
                              ? 'psu-terlantar'
                              : project.status === 'PERBAIKAN_DEFECT'
                                ? 'survei-fisik'
                                : 'verifikasi-admin'
                          )
                        }
                        className="font-semibold text-[#0F294A] hover:underline text-left cursor-pointer"
                      >
                        {project.namaPerumahan}
                      </button>
                      <p className="text-[11px] text-slate-500">Kec. {project.kecamatan}</p>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums whitespace-nowrap">
                      {formatAreaM2(project.luasWajibPsuM2)}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold tabular-nums">
                      <span
                        className={
                          riskScore >= 75
                            ? 'text-[#DC2626]'
                            : riskScore >= 50
                              ? 'text-[#D97706]'
                              : 'text-[#2563EB]'
                        }
                      >
                        {riskScore}/100
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{recommendation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="xl:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#D97706]" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Anomaly & Discrepancy Detection
              </h3>
              <p className="text-xs text-slate-500">
                Deteksi otomatis selisih luas &lt;95% atau backlog pencatatan BMD
              </p>
            </div>
          </div>
          <div className="divide-y divide-slate-200">
            {insight.anomalies.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                Tidak ditemukan anomali selisih luas atau backlog BMD pada data saat ini.
              </div>
            ) : (
              insight.anomalies.map(({ project, reasons }) => (
                <div key={project.id} className="p-4 text-xs space-y-1">
                  <p className="font-semibold text-slate-900">
                    {project.namaPerumahan} · Kec. {project.kecamatan}
                  </p>
                  {reasons.map((r) => (
                    <p key={r} className="text-[#DC2626]">
                      · {r}
                    </p>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Distribution Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">
            Distribusi Status Proyek Perumahan ({projects.length} Kawasan)
          </h3>
          <div className="space-y-3">
            {(Object.keys(insight.statusCounts) as ProjectStatus[]).map((st) => {
              const count = insight.statusCounts[st];
              const pct = projects.length > 0 ? Math.round((count / projects.length) * 100) : 0;
              const meta = getStatusMeta(st);
              return (
                <div key={st} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800">{meta.label}</span>
                    <span className="font-mono font-semibold text-slate-900 tabular-nums">
                      {count} proyek ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: meta.hex }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">
            Rekap Temuan Defect Berdasarkan Kategori Permendagri 15/2026
          </h3>
          <div className="space-y-3">
            {(['Prasarana', 'Sarana', 'Utilitas'] as const).map((cat) => {
              const count = insight.defectByCategory[cat] || 0;
              const totalDef = Object.values(insight.defectByCategory).reduce((a, b) => a + b, 0);
              const pct = totalDef > 0 ? Math.round((count / totalDef) * 100) : 0;
              return (
                <div key={cat} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-900">{cat}</span>
                    <span className="font-mono font-semibold text-[#0F294A] tabular-nums">
                      {count} Temuan ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#D97706] rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
