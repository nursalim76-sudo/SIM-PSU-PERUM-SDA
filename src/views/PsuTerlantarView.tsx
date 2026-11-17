import React, { useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, Plus, X } from 'lucide-react';
import {
  ABANDONED_STAGES,
  ADMIN_DOC_TEMPLATES,
  AbandonedStage,
  HousingProject,
  SIDOARJO_KECAMATAN,
  UserRole,
} from '../types/psu';
import { formatAreaM2, formatDateId } from '../utils/formatters';

interface PsuTerlantarViewProps {
  projects: HousingProject[];
  role: UserRole;
  onAdvanceAbandonedStage: (
    projectId: string,
    nextStage: AbandonedStage,
    notes: string,
    skNumber?: string
  ) => void;
  onAddAbandonedProject: (project: HousingProject) => void;
}

export const PsuTerlantarView: React.FC<PsuTerlantarViewProps> = ({
  projects,
  role,
  onAdvanceAbandonedStage,
  onAddAbandonedProject,
}) => {
  const abandonedProjects = projects.filter((p) => p.status === 'TERLANTAR_PAILIT' || p.abandonedInfo);
  const [showAddModal, setShowAddModal] = useState(false);
  const [skInput, setSkInput] = useState<Record<string, string>>({});
  const [noteInput, setNoteInput] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    namaPerumahan: '',
    pengembang: 'Pengembang Tidak Diketahui / Pailit',
    kecamatan: 'Porong',
    desa: '',
    luasWajibPsuM2: 14500,
    reason: '',
  });

  const canManage = role === 'ADMIN_DP2CKTR' || role === 'VERIFIKATOR_BPKAD';
  const canReport = canManage || role === 'ADMIN_KECAMATAN';

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.namaPerumahan.trim()) return;
    const id = `prj-ab-${Date.now()}`;
    const baseChecklist = projects[0].stages[0].physicalChecklist.map((i) => ({
      ...i,
      actualVolume: i.siteplanVolume,
      condition: 'Perlu Perbaikan' as const,
    }));

    const newProj: HousingProject = {
      id,
      namaPerumahan: form.namaPerumahan.trim(),
      pengembang: form.pengembang.trim(),
      kecamatan: form.kecamatan,
      desa: form.desa.trim() || 'Kota',
      nomorSiteplan: '650/EX-PAILIT/438.5.4/2018',
      tanggalPengesahanSiteplan: '2018-04-10',
      luasTotalM2: Math.round(form.luasWajibPsuM2 * 2.5),
      luasKavlingEfektifM2: Math.round(form.luasWajibPsuM2 * 1.5),
      luasWajibPsuM2: Number(form.luasWajibPsuM2),
      skemaPenyerahan: 'Sekaligus',
      activeStageIndex: 0,
      status: 'TERLANTAR_PAILIT',
      ewsFlag: true,
      ewsReason: 'Usulan penyerahan sepihak Pemda — Jalur Khusus PSU Terlantar',
      targetPenyerahanDate: '2027-03-31',
      coordinates: { lat: -7.535, lng: 112.695, mapX: 355, mapY: 482 },
      estimasiNilaiAsetRp: Number(form.luasWajibPsuM2) * 1100000,
      abandonedInfo: {
        currentStage: 'Laporan Kecamatan/Warga',
        reason:
          form.reason.trim() ||
          'Laporan warga & Camat setempat terkait fasilitas umum terbengkalai dan pengembang tidak aktif.',
        lastUpdated: '2026-11-16',
        notes: 'Verifikasi awal berkas laporan warga dan penelusuran status badan hukum pengembang.',
      },
      stages: [
        {
          id: `${id}-s1`,
          stageName: 'Jalur Khusus PSU Terlantar',
          luasPsuM2: Number(form.luasWajibPsuM2),
          status: 'TERLANTAR_PAILIT',
          adminDocs: ADMIN_DOC_TEMPLATES.map((t) => ({ ...t, status: 'Menunggu Verifikasi' })),
          maintenanceDaysTotal: 0,
          physicalChecklist: baseChecklist,
          defects: [],
          surveyLogs: [],
          bmdAssets: [],
        },
      ],
    };

    onAddAbandonedProject(newProj);
    setShowAddModal(false);
    setForm({
      namaPerumahan: '',
      pengembang: 'Pengembang Tidak Diketahui / Pailit',
      kecamatan: 'Porong',
      desa: '',
      luasWajibPsuM2: 14500,
      reason: '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Jalur Khusus PSU Terlantar / Pengembang Pailit
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Fasilitasi penyerahan sepihak oleh Pemerintah Daerah sesuai Permendagri No. 15 Tahun 2026
          </p>
        </div>

        <button
          type="button"
          disabled={!canReport}
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#DC2626] rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Catat Usulan PSU Terlantar
        </button>
      </div>

      {/* Pipeline Explanation */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <p className="text-xs font-semibold text-slate-700 mb-3">
          Alur Tahapan Penyerahan Sepihak Pemerintah Kabupaten Sidoarjo
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {ABANDONED_STAGES.map((st, idx) => (
            <div key={st} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <p className="font-mono text-[11px] font-semibold text-[#0F294A]">Tahap 0{idx + 1}</p>
              <p className="text-xs font-semibold text-slate-900 mt-0.5">{st}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cases List */}
      <div className="space-y-4">
        {abandonedProjects.map((project) => {
          const info = project.abandonedInfo!;
          const stageIdx = ABANDONED_STAGES.indexOf(info.currentStage);
          const nextStage =
            stageIdx >= 0 && stageIdx < ABANDONED_STAGES.length - 1
              ? ABANDONED_STAGES[stageIdx + 1]
              : null;

          return (
            <div
              key={project.id}
              className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 space-y-5"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#DC2626] font-semibold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Jalur Khusus Penyerahan Sepihak Pemda</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">
                    {project.namaPerumahan}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {project.pengembang} · Desa {project.desa}, Kec. {project.kecamatan} · Luas PSU:{' '}
                    <span className="font-mono font-semibold text-slate-900">
                      {formatAreaM2(project.luasWajibPsuM2)}
                    </span>
                  </p>
                </div>

                <div className="text-xs text-left lg:text-right">
                  <p className="text-slate-500">Tahap Saat Ini</p>
                  <p className="font-semibold text-[#0F294A] mt-0.5">{info.currentStage}</p>
                  <p className="font-mono text-[11px] text-slate-500 mt-0.5">
                    Diperbarui: {formatDateId(info.lastUpdated)}
                  </p>
                </div>
              </div>

              {/* 5-Stage Stepper */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {ABANDONED_STAGES.map((st, idx) => {
                  const done = idx < stageIdx;
                  const current = idx === stageIdx;
                  return (
                    <div
                      key={st}
                      className={`p-3 rounded-lg border text-xs ${
                        done
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : current
                            ? 'bg-blue-50 border-blue-300 text-blue-950 font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[11px]">0{idx + 1}</span>
                        {done && <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />}
                      </div>
                      <p className="leading-snug">{st}</p>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div>
                  <p className="font-semibold text-slate-800">Latar Belakang & Dasar Kelalaian</p>
                  <p className="text-slate-600 mt-1">{info.reason}</p>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-slate-800">Rekam Dokumen Legalitas Pemda</p>
                  <p className="text-slate-600">
                    Pengumuman Media: <span className="font-mono">{formatDateId(info.mediaAnnouncementDate)}</span>
                  </p>
                  <p className="text-slate-600">
                    No. BA Kelalaian: <span className="font-mono">{info.baKelalaianNumber || 'Belum terbit'}</span>
                  </p>
                  <p className="text-slate-600">
                    No. SK Bupati: <span className="font-mono">{info.skBupatiNumber || 'Belum terbit'}</span>
                  </p>
                </div>
                <div className="md:col-span-2 pt-2 border-t border-slate-200">
                  <p className="text-slate-700">
                    <span className="font-semibold">Catatan Perkembangan: </span>
                    {info.notes}
                  </p>
                </div>
              </div>

              {nextStage && canManage && (
                <div className="flex flex-col md:flex-row gap-3 pt-2">
                  <input
                    type="text"
                    value={noteInput[project.id] || ''}
                    onChange={(e) => setNoteInput({ ...noteInput, [project.id]: e.target.value })}
                    placeholder={`Catatan progres menuju tahap ${nextStage}...`}
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                  {nextStage === 'Penetapan SK Bupati' && (
                    <input
                      type="text"
                      value={skInput[project.id] || ''}
                      onChange={(e) => setSkInput({ ...skInput, [project.id]: e.target.value })}
                      placeholder="Nomor SK Bupati (misal: 188/412/438.1.1.3/2026)"
                      className="w-full md:w-72 px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      onAdvanceAbandonedStage(
                        project.id,
                        nextStage,
                        noteInput[project.id]?.trim() ||
                          `Tahap ${nextStage} telah diverifikasi dan ditetapkan sesuai Permendagri 15/2026.`,
                        skInput[project.id]?.trim()
                      );
                      setNoteInput({ ...noteInput, [project.id]: '' });
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0F294A] rounded-lg hover:bg-[#163a66] whitespace-nowrap cursor-pointer"
                  >
                    Lanjutkan ke: {nextStage}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Abandoned Estate Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                Catat Kasus PSU Terlantar / Pengembang Pailit
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nama Perumahan Lama *
                </label>
                <input
                  required
                  type="text"
                  value={form.namaPerumahan}
                  onChange={(e) => setForm({ ...form, namaPerumahan: e.target.value })}
                  placeholder="Contoh: Perumahan Taman Porong Indah"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Kecamatan</label>
                  <select
                    value={form.kecamatan}
                    onChange={(e) => setForm({ ...form, kecamatan: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    {SIDOARJO_KECAMATAN.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Desa</label>
                  <input
                    type="text"
                    value={form.desa}
                    onChange={(e) => setForm({ ...form, desa: e.target.value })}
                    placeholder="Contoh: Juwetkenongo"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Estimasi Luas Bidang PSU Terlantar (m²)
                </label>
                <input
                  type="number"
                  min={500}
                  value={form.luasWajibPsuM2}
                  onChange={(e) => setForm({ ...form, luasWajibPsuM2: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Kronologi Laporan Kecamatan / Status Pailit
                </label>
                <textarea
                  rows={3}
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Jelaskan kondisi PSU dan status keberadaan pengembang..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#DC2626] rounded-lg hover:bg-red-700 cursor-pointer"
                >
                  Simpan Kasus Jalur Khusus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
