import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  Eye,
  FileCheck2,
  Landmark,
  Lock,
  Plus,
} from 'lucide-react';
import {
  BmdAssetRecord,
  HousingProject,
  KibType,
  OPD_PENGELOLA_OPTIONS,
  UserRole,
} from '../types/psu';
import {
  formatAreaM2,
  formatDateId,
  formatRupiah,
  generateDocNumber,
  getActiveStage,
  getMeasurementRatio,
} from '../utils/formatters';
import { StatusLabel } from '../components/StatusLabel';
import { BeritaAcaraModal, DocPreviewType } from '../components/BeritaAcaraModal';

interface BastBmdViewProps {
  projects: HousingProject[];
  selectedProjectId: string;
  onSelectProject: (id: string) => void;
  onChangeStage: (projectId: string, stageIndex: number) => void;
  role: UserRole;
  onIssueBapl: (projectId: string, stageIndex: number, baplNumber: string, baplDate: string) => void;
  onIssueBast: (projectId: string, stageIndex: number, bastNumber: string, bastDate: string) => void;
  onAddBmdAsset: (projectId: string, stageIndex: number, record: BmdAssetRecord) => void;
}

export const BastBmdView: React.FC<BastBmdViewProps> = ({
  projects,
  selectedProjectId,
  onSelectProject,
  onChangeStage,
  role,
  onIssueBapl,
  onIssueBast,
  onAddBmdAsset,
}) => {
  const project = projects.find((p) => p.id === selectedProjectId) || projects[0];
  const stage = getActiveStage(project);
  const projectIdx = projects.findIndex((p) => p.id === project.id);

  const [previewDoc, setPreviewDoc] = useState<DocPreviewType | null>(null);
  const [bmdForm, setBmdForm] = useState({
    kodeBarangBmd: '1.3.1.01.01.04.021',
    jenisKib: 'KIB A - Tanah' as KibType,
    nomorRegister: `REG-3515-2026-0${120 + projectIdx}`,
    nomorSertifikatHakPakai: `HP No. 00${250 + projectIdx}/${project.desa}/2026`,
    nilaiPerolehanRp: Math.round(project.estimasiNilaiAsetRp * 0.65),
    opdPengelolaTeknis: OPD_PENGELOLA_OPTIONS[0],
  });

  const openDefectsCount = stage.defects.filter((d) => d.status !== 'Closed').length;
  const lowAreaItems = stage.physicalChecklist.filter(
    (item) => item.actualVolume > 0 && getMeasurementRatio(item.siteplanVolume, item.actualVolume) < 95
  );
  const hasAreaAnomaly = lowAreaItems.length > 0;
  const hasBaAdmin = Boolean(stage.baAdminNumber) || project.status === 'TERLANTAR_PAILIT';
  const isLocked = !hasBaAdmin || openDefectsCount > 0 || hasAreaAnomaly;

  const canIssueBast = role === 'ADMIN_DP2CKTR';
  const canRecordBmd = role === 'VERIFIKATOR_BPKAD' || role === 'ADMIN_DP2CKTR';

  const handleExportKibCsv = () => {
    const headers = [
      'Perumahan',
      'Kecamatan',
      'Nomor BAST',
      'Kode Barang BMD',
      'Jenis KIB',
      'Nomor Register',
      'Sertifikat Hak Pakai Pemkab',
      'Nilai Perolehan (Rp)',
      'OPD Pengelola Teknis',
      'Tanggal Catat',
    ];
    const rows = stage.bmdAssets.map((b) => [
      `"${project.namaPerumahan}"`,
      `"${project.kecamatan}"`,
      `"${stage.bastNumber || '-'}"`,
      `"${b.kodeBarangBmd}"`,
      `"${b.jenisKib}"`,
      `"${b.nomorRegister}"`,
      `"${b.nomorSertifikatHakPakai}"`,
      b.nilaiPerolehanRp,
      `"${b.opdPengelolaTeknis}"`,
      `"${b.recordedAt}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Register_KIB_BPKAD_${project.namaPerumahan.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerateBapl = () => {
    if (isLocked) return;
    if (!stage.baplNumber && canIssueBast) {
      onIssueBapl(
        project.id,
        project.activeStageIndex,
        generateDocNumber('BAPL', projectIdx),
        '2026-11-16'
      );
    }
    setPreviewDoc('BAPL');
  };

  const handleGenerateBast = () => {
    if (isLocked || !stage.baplNumber) return;
    if (!stage.bastNumber && canIssueBast) {
      onIssueBast(
        project.id,
        project.activeStageIndex,
        `030/${String(120 + projectIdx).padStart(3, '0')}/438.6.2/2026`,
        '2026-11-16'
      );
    }
    setPreviewDoc('BAST_AKHIR');
  };

  const handleSaveBmd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canRecordBmd) return;
    const record: BmdAssetRecord = {
      id: `bmd-${Date.now()}`,
      kodeBarangBmd: bmdForm.kodeBarangBmd.trim(),
      jenisKib: bmdForm.jenisKib,
      nomorRegister: bmdForm.nomorRegister.trim(),
      nomorSertifikatHakPakai: bmdForm.nomorSertifikatHakPakai.trim(),
      nilaiPerolehanRp: Number(bmdForm.nilaiPerolehanRp),
      opdPengelolaTeknis: bmdForm.opdPengelolaTeknis,
      recordedAt: '2026-11-16',
      verifiedBy:
        role === 'VERIFIKATOR_BPKAD'
          ? 'Verifikator Aset BPKAD Kab. Sidoarjo'
          : 'Admin Sekretariat PSU (DP2CKTR)',
    };
    onAddBmdAsset(project.id, project.activeStageIndex, record);
  };

  const totalBmdValue = stage.bmdAssets.reduce((acc, b) => acc + b.nilaiPerolehanRp, 0);

  return (
    <div className="space-y-6">
      {/* Selector Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1">
            <label htmlFor="bast-project-select" className="block text-xs font-medium text-slate-500 mb-1">
              Pilih Proyek Perumahan
            </label>
            <select
              id="bast-project-select"
              value={project.id}
              onChange={(e) => onSelectProject(e.target.value)}
              className="w-full max-w-xl px-3 py-2 text-sm font-semibold text-slate-900 border border-slate-300 rounded-lg bg-white"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.namaPerumahan} — Kec. {p.kecamatan}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <StatusLabel status={stage.status} />
            {project.stages.length > 1 && (
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                {project.stages.map((st, idx) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => onChangeStage(project.id, idx)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md cursor-pointer ${
                      project.activeStageIndex === idx
                        ? 'bg-white text-[#0F294A] shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Tahap {idx + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-200 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-slate-500">1. BA Penyerahan Administrasi</p>
            <p className="font-mono font-semibold text-slate-900 mt-1">
              {stage.baAdminNumber || (project.status === 'TERLANTAR_PAILIT' ? 'Jalur Khusus Pemda' : 'Belum Terbit')}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-slate-500">2. Status Defect Lapangan</p>
            <p
              className={`font-semibold mt-1 ${
                openDefectsCount > 0 ? 'text-[#DC2626]' : 'text-[#059669]'
              }`}
            >
              {openDefectsCount > 0
                ? `${openDefectsCount} Defect Masih Open (Terkunci)`
                : '0 Defect Aktif (Memenuhi Syarat)'}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-slate-500">3. Luas PSU & Estimasi Nilai</p>
            <p className="font-mono font-semibold text-[#0F294A] tabular-nums mt-1">
              {formatAreaM2(stage.luasPsuM2)} · {formatRupiah(project.estimasiNilaiAsetRp)}
            </p>
          </div>
        </div>
      </div>

      {/* BAPL & BAST Generator Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Penerbitan BAPL & Berita Acara Serah Terima (BAST) Akhir
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Dokumen diterbitkan berurutan: BAPL (Pemeriksaan Lapangan) lalu BAST Akhir yang ditandatangani Bupati/DP2CKTR.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {stage.baplNumber ? (
              <button
                type="button"
                onClick={() => setPreviewDoc('BAPL')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0F294A] bg-slate-100 rounded-lg hover:bg-slate-200 whitespace-nowrap cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                Pratinjau BAPL ({stage.baplNumber})
              </button>
            ) : (
              <button
                type="button"
                disabled={isLocked || !canIssueBast}
                onClick={handleGenerateBapl}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0F294A] rounded-lg hover:bg-[#163a66] disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
              >
                {isLocked ? <Lock className="w-4 h-4" /> : <FileCheck2 className="w-4 h-4" />}
                Terbitkan BAPL
              </button>
            )}

            {stage.bastNumber ? (
              <button
                type="button"
                onClick={() => setPreviewDoc('BAST_AKHIR')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#059669] rounded-lg hover:bg-emerald-700 whitespace-nowrap cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                Pratinjau BAST Akhir
              </button>
            ) : (
              <button
                type="button"
                disabled={isLocked || !stage.baplNumber || !canIssueBast}
                onClick={handleGenerateBast}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0D6E5B] rounded-lg hover:bg-emerald-800 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
              >
                {isLocked || !stage.baplNumber ? (
                  <Lock className="w-4 h-4" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Terbitkan BAST Akhir
              </button>
            )}
          </div>
        </div>

        {(isLocked || !canIssueBast) && (
          <p className="text-xs text-slate-600 mt-4 pt-3 border-t border-slate-200">
            {isLocked
              ? hasAreaAnomaly
                ? `Penerbitan BAPL/BAST ditahan: terdapat ${lowAreaItems.length} komponen fisik PSU dengan realisasi <95% dari siteplan.`
                : 'Penerbitan BAPL/BAST saat ini terkunci karena BA Administrasi belum terbit atau masih ada defect berstatus Open.'
              : !canIssueBast
                ? 'Hanya Admin Sekretariat PSU (DP2CKTR) yang berwenang menerbitkan BAPL dan BAST Akhir.'
                : 'BAPL telah terbit — lanjutkan dengan penerbitan BAST Akhir.'}
          </p>
        )}

        {stage.bastNumber && stage.bmdAssets.length === 0 && (
          <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
            <strong>Kewajiban Integrasi BMD:</strong> BAST Akhir ({stage.bastNumber}) telah terbit. Verifikator Aset BPKAD wajib segera mencatat objek PSU ke dalam Kartu Inventaris Barang (KIB A / C / D) dan menetapkan OPD Pengelola Teknis di bawah ini.
          </div>
        )}
      </div>

      {/* Panel Verifikator Aset BPKAD */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <Landmark className="w-5 h-5 text-[#0F294A]" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Panel Pencatatan Aset BMD (BPKAD)
              </h3>
              <p className="text-xs text-slate-500">
                Registrasi Kartu Inventaris Barang (KIB A/C/D) & OPD Pengelola
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveBmd} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Jenis Kartu Inventaris Barang (KIB)
              </label>
              <select
                disabled={!canRecordBmd}
                value={bmdForm.jenisKib}
                onChange={(e) => setBmdForm({ ...bmdForm, jenisKib: e.target.value as KibType })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white disabled:bg-slate-100"
              >
                <option value="KIB A - Tanah">KIB A - Tanah</option>
                <option value="KIB C - Gedung/Bangunan">KIB C - Gedung/Bangunan</option>
                <option value="KIB D - Jalan, Irigasi & Jaringan">
                  KIB D - Jalan, Irigasi & Jaringan
                </option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Kode Barang BMD
                </label>
                <input
                  required
                  disabled={!canRecordBmd}
                  type="text"
                  value={bmdForm.kodeBarangBmd}
                  onChange={(e) => setBmdForm({ ...bmdForm, kodeBarangBmd: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg disabled:bg-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nomor Register Aset
                </label>
                <input
                  required
                  disabled={!canRecordBmd}
                  type="text"
                  value={bmdForm.nomorRegister}
                  onChange={(e) => setBmdForm({ ...bmdForm, nomorRegister: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg disabled:bg-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nomor Sertifikat Hak Pakai Pemkab / Referensi BAST
              </label>
              <input
                required
                disabled={!canRecordBmd}
                type="text"
                value={bmdForm.nomorSertifikatHakPakai}
                onChange={(e) =>
                  setBmdForm({ ...bmdForm, nomorSertifikatHakPakai: e.target.value })
                }
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nilai Perolehan / Taksiran Aset (Rp)
              </label>
              <input
                required
                disabled={!canRecordBmd}
                type="number"
                min={0}
                value={bmdForm.nilaiPerolehanRp}
                onChange={(e) =>
                  setBmdForm({ ...bmdForm, nilaiPerolehanRp: Number(e.target.value) })
                }
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg tabular-nums disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                OPD Pengelola Teknis
              </label>
              <select
                disabled={!canRecordBmd}
                value={bmdForm.opdPengelolaTeknis}
                onChange={(e) => setBmdForm({ ...bmdForm, opdPengelolaTeknis: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white disabled:bg-slate-100"
              >
                {OPD_PENGELOLA_OPTIONS.map((opd) => (
                  <option key={opd} value={opd}>
                    {opd}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={!canRecordBmd}
              className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs font-semibold text-white bg-[#0F294A] rounded-lg hover:bg-[#163a66] disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Catat ke Buku Inventaris BMD
            </button>
          </form>
        </div>

        <div className="xl:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Daftar Aset BMD Tercatat ({stage.bmdAssets.length} Entri KIB)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Total Nilai Tercatat: <span className="font-mono font-semibold text-[#059669] tabular-nums">{formatRupiah(totalBmdValue)}</span>
              </p>
            </div>
            {stage.bmdAssets.length > 0 && (
              <button
                type="button"
                onClick={handleExportKibCsv}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0F294A] bg-white border border-slate-300 rounded-lg hover:bg-slate-50 whitespace-nowrap cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Ekspor Register KIB (CSV)
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Kode Barang & KIB</th>
                  <th className="py-3 px-4">No. Register & Sertifikat</th>
                  <th className="py-3 px-4">OPD Pengelola</th>
                  <th className="py-3 px-4 text-right">Nilai Perolehan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {stage.bmdAssets.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-slate-500">
                      Belum ada pencatatan aset BMD oleh Verifikator BPKAD untuk tahapan ini.
                    </td>
                  </tr>
                ) : (
                  stage.bmdAssets.map((bmd) => (
                    <tr key={bmd.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <p className="font-mono font-semibold text-slate-900">{bmd.kodeBarangBmd}</p>
                        <p className="text-slate-600 mt-0.5">{bmd.jenisKib}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-mono text-slate-800">{bmd.nomorRegister}</p>
                        <p className="text-slate-500 mt-0.5">{bmd.nomorSertifikatHakPakai}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <p>{bmd.opdPengelolaTeknis}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {bmd.verifiedBy} · {formatDateId(bmd.recordedAt)}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-[#059669] tabular-nums whitespace-nowrap">
                        {formatRupiah(bmd.nilaiPerolehanRp)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {previewDoc && (
        <BeritaAcaraModal
          isOpen={true}
          docType={previewDoc}
          project={project}
          stage={stage}
          docNumber={
            previewDoc === 'BAPL'
              ? stage.baplNumber || generateDocNumber('BAPL', projectIdx)
              : stage.bastNumber || `030/${String(120 + projectIdx).padStart(3, '0')}/438.6.2/2026`
          }
          docDate={
            previewDoc === 'BAPL'
              ? stage.baplDate || '2026-11-16'
              : stage.bastDate || '2026-11-16'
          }
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
};
