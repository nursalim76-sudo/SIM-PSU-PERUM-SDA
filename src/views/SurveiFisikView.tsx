import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock,
  Lock,
  MapPin,
  Plus,
  Unlock,
  Upload,
} from 'lucide-react';
import {
  DefectItem,
  HousingProject,
  InfraCategory,
  MenuId,
  SurveyLog,
  UserRole,
} from '../types/psu';
import {
  formatDateId,
  getActiveStage,
  getMaintenanceCountdown,
  getMeasurementRatio,
} from '../utils/formatters';
import { SURVEY_PHOTOS } from '../data/initialData';
import { StatusLabel } from '../components/StatusLabel';

interface SurveiFisikViewProps {
  projects: HousingProject[];
  selectedProjectId: string;
  onSelectProject: (id: string) => void;
  onChangeStage: (projectId: string, stageIndex: number) => void;
  role: UserRole;
  onUpdateMeasurement: (
    projectId: string,
    stageIndex: number,
    itemId: string,
    actualVolume: number
  ) => void;
  onAddSurveyLog: (projectId: string, stageIndex: number, log: SurveyLog) => void;
  onAddDefect: (projectId: string, stageIndex: number, defect: DefectItem) => void;
  onSubmitDefectRepair: (
    projectId: string,
    stageIndex: number,
    defectId: string,
    repairNote: string,
    repairPhoto: string
  ) => void;
  onCloseDefect: (projectId: string, stageIndex: number, defectId: string) => void;
  onNavigateModule: (menu: MenuId) => void;
  minPhysicalRatioPct?: number;
  maintenanceAlertDays?: number;
}

export const SurveiFisikView: React.FC<SurveiFisikViewProps> = ({
  projects,
  selectedProjectId,
  onSelectProject,
  onChangeStage,
  role,
  onUpdateMeasurement,
  onAddSurveyLog,
  onAddDefect,
  onSubmitDefectRepair,
  onCloseDefect,
  onNavigateModule,
  minPhysicalRatioPct = 95,
  maintenanceAlertDays = 14,
}) => {
  const project = projects.find((p) => p.id === selectedProjectId) || projects[0];
  const stage = getActiveStage(project);

  const canInspect = role === 'TIM_LAPANGAN' || role === 'ADMIN_DP2CKTR';
  const canSubmitRepair = role === 'PENGEMBANG' || role === 'ADMIN_DP2CKTR';

  const [activeCategory, setActiveCategory] = useState<'ALL' | InfraCategory>('ALL');

  // Geotagging & Photo Capture State
  const [gpsLat, setGpsLat] = useState<string>(project.coordinates.lat.toFixed(6));
  const [gpsLng, setGpsLng] = useState<string>(project.coordinates.lng.toFixed(6));
  const [gpsTime, setGpsTime] = useState<string>('Siap diambil');
  const [surveyCaption, setSurveyCaption] = useState<string>('');
  const [selectedPhoto, setSelectedPhoto] = useState<string>(SURVEY_PHOTOS.jalan);

  // Add Defect Form State
  const [showDefectForm, setShowDefectForm] = useState(false);
  const [defectForm, setDefectForm] = useState({
    category: 'Prasarana' as InfraCategory,
    location: '',
    description: '',
    severity: 'Mayor' as 'Mayor' | 'Minor',
    dueDate: '2026-12-05',
  });

  // Repair Proof Input State
  const [repairNotes, setRepairNotes] = useState<Record<string, string>>({});
  const [activeRepairId, setActiveRepairId] = useState<string | null>(null);
  const [offlineSavedAt, setOfflineSavedAt] = useState<string | null>(() => {
    try {
      return localStorage.getItem(`sim_psu_draft_${project.id}_${stage.id}`);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    setGpsLat(project.coordinates.lat.toFixed(6));
    setGpsLng(project.coordinates.lng.toFixed(6));
    setGpsTime('Siap diambil');
    setShowDefectForm(false);
    setActiveRepairId(null);
    try {
      setOfflineSavedAt(localStorage.getItem(`sim_psu_draft_${project.id}_${stage.id}`));
    } catch {
      setOfflineSavedAt(null);
    }
  }, [project.id, stage.id, project.coordinates.lat, project.coordinates.lng]);

  const handleSaveOfflineDraft = () => {
    const stamp = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const val = `Tersimpan lokal (${stamp} WIB)`;
    try {
      localStorage.setItem(`sim_psu_draft_${project.id}_${stage.id}`, val);
    } catch {
      // ignore
    }
    setOfflineSavedAt(val);
  };

  const openDefects = stage.defects.filter((d) => d.status !== 'Closed');
  const isLockedByDefect = openDefects.length > 0;
  const countdown = getMaintenanceCountdown(stage);

  const filteredItems =
    activeCategory === 'ALL'
      ? stage.physicalChecklist
      : stage.physicalChecklist.filter((i) => i.category === activeCategory);

  const lowRatioCount = stage.physicalChecklist.filter(
    (i) => i.actualVolume > 0 && getMeasurementRatio(i.siteplanVolume, i.actualVolume) < minPhysicalRatioPct
  ).length;

  const handleCaptureGps = () => {
    const jitterLat = (Math.random() - 0.5) * 0.0008;
    const jitterLng = (Math.random() - 0.5) * 0.0008;
    const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    setGpsLat((project.coordinates.lat + jitterLat).toFixed(6));
    setGpsLng((project.coordinates.lng + jitterLng).toFixed(6));
    setGpsTime(`2026-11-16 ${now} WIB`);
  };

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedPhoto(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSurveyLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canInspect) return;
    const log: SurveyLog = {
      id: `log-${Date.now()}`,
      timestamp:
        gpsTime === 'Siap diambil'
          ? `2026-11-16 ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`
          : gpsTime,
      surveyor:
        role === 'TIM_LAPANGAN'
          ? 'Tim Verifikasi Lapangan (OPD Teknis)'
          : 'Admin Sekretariat PSU (DP2CKTR)',
      latitude: Number(gpsLat),
      longitude: Number(gpsLng),
      photoUrl: selectedPhoto,
      caption: surveyCaption.trim() || 'Dokumentasi verifikasi fisik lapangan PSU Sidoarjo.',
    };
    onAddSurveyLog(project.id, project.activeStageIndex, log);
    setSurveyCaption('');
  };

  const handleAddDefectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canInspect || !defectForm.location.trim() || !defectForm.description.trim()) return;
    const newDefect: DefectItem = {
      id: `def-${Date.now()}`,
      category: defectForm.category,
      location: defectForm.location.trim(),
      description: defectForm.description.trim(),
      severity: defectForm.severity,
      dueDate: defectForm.dueDate,
      status: 'Open',
      reportedAt: '2026-11-16',
    };
    onAddDefect(project.id, project.activeStageIndex, newDefect);
    setDefectForm({
      category: 'Prasarana',
      location: '',
      description: '',
      severity: 'Mayor',
      dueDate: '2026-12-05',
    });
    setShowDefectForm(false);
  };

  const handleRepairSubmit = (defectId: string) => {
    const note =
      repairNotes[defectId]?.trim() ||
      'Perbaikan fisik telah selesai dikerjakan di lapangan sesuai standar teknis DP2CKTR.';
    onSubmitDefectRepair(
      project.id,
      project.activeStageIndex,
      defectId,
      note,
      SURVEY_PHOTOS.jalan
    );
    setRepairNotes((prev) => {
      const next = { ...prev };
      delete next[defectId];
      return next;
    });
    setActiveRepairId(null);
  };

  return (
    <div className="space-y-6">
      {/* Project Header & Lock Status */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1">
            <label htmlFor="fisik-project-select" className="block text-xs font-medium text-slate-500 mb-1">
              Pilih Proyek Perumahan
            </label>
            <select
              id="fisik-project-select"
              value={project.id}
              onChange={(e) => onSelectProject(e.target.value)}
              className="w-full max-w-xl px-3 py-2 text-sm font-semibold text-slate-900 border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#0F294A]"
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

        {/* Countdown Masa Pemeliharaan & Lock Indicator */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-3 border-t border-slate-200">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <Clock className="w-4 h-4 text-[#2563EB]" />
                Countdown Masa Pemeliharaan Fisik ({countdown.totalDays} Hari)
              </span>
              <span className="font-mono text-xs font-semibold text-[#2563EB] tabular-nums">
                {countdown.active
                  ? countdown.daysRemaining === 0
                    ? 'Masa Pemeliharaan Selesai'
                    : `Sisa ${countdown.daysRemaining} Hari`
                  : 'Menunggu BA Administrasi'}
              </span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2563EB] rounded-full transition-all"
                style={{ width: `${countdown.percentComplete}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 font-mono tabular-nums">
              {countdown.active
                ? `Mulai: ${formatDateId(stage.maintenanceStartDate)} · Berjalan ${countdown.daysElapsed} / ${countdown.totalDays} hari`
                : 'Countdown otomatis aktif setelah BA Penyerahan Administrasi diterbitkan.'}
            </p>
            {countdown.active && countdown.daysRemaining <= maintenanceAlertDays && (
              <p className="text-[11px] font-semibold text-[#D97706] mt-1">
                Pengingat SLA H-{maintenanceAlertDays}: Masa pemeliharaan segera/telah berakhir — jadwalkan pemeriksaan akhir BAPL/BAST.
              </p>
            )}
          </div>

          <div
            className={`p-4 rounded-lg border flex items-center justify-between gap-4 ${
              isLockedByDefect
                ? 'bg-red-50 border-red-200 text-red-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            <div className="flex items-start gap-3">
              {isLockedByDefect ? (
                <Lock className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
              ) : (
                <Unlock className="w-5 h-5 text-[#059669] shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-xs font-bold">
                  {isLockedByDefect
                    ? `Penerbitan BAPL & BAST Akhir Terkunci (${openDefects.length} Defect Aktif)`
                    : 'Tidak Ada Defect Aktif — Siap Lanjut ke BAPL & BAST Akhir'}
                </p>
                <p className="text-[11px] mt-0.5 opacity-90">
                  {isLockedByDefect
                    ? 'Seluruh temuan pada Defect List wajib diperbaiki pengembang dan diverifikasi selesai sebelum BAPL/BAST dapat diterbitkan.'
                    : 'Seluruh pemeriksaan teknis lapangan tanpa temuan terbuka.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateModule('bast-bmd')}
              className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 text-slate-800 rounded-lg hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Ke Modul BAST
            </button>
          </div>
        </div>
      </div>

      {/* Komparasi Siteplan vs Aktual Lapangan */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Komparasi Teknis PSU: Siteplan vs Hasil Ukur Aktual Lapangan
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Mengacu 3 kategori Permendagri 15/2026 (Prasarana, Sarana, Utilitas). Peringatan otomatis muncul jika capaian &lt;{minPhysicalRatioPct}%.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canInspect && (
              <button
                type="button"
                onClick={handleSaveOfflineDraft}
                className="px-3 py-1.5 text-xs font-medium text-[#0F294A] bg-slate-100 hover:bg-slate-200 rounded-lg whitespace-nowrap cursor-pointer"
              >
                {offlineSavedAt ? `Draf Offline: ${offlineSavedAt}` : 'Simpan Draf Offline (PWA)'}
              </button>
            )}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
            {(['ALL', 'Prasarana', 'Sarana', 'Utilitas'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat === 'ALL' ? 'Semua (12)' : cat}
              </button>
            ))}
            </div>
          </div>
        </div>

        {lowRatioCount > 0 && (
          <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0" />
            <span>
              Terdapat <strong className="font-mono">{lowRatioCount}</strong> komponen PSU dengan realisasi aktual di bawah <strong>{minPhysicalRatioPct}%</strong> dari luasan/volume siteplan.
            </span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Komponen PSU</th>
                <th className="py-3 px-4 text-right">Volume Siteplan</th>
                <th className="py-3 px-4 text-right">Hasil Ukur Aktual</th>
                <th className="py-3 px-4 text-right">Rasio Capaian</th>
                <th className="py-3 px-4">Status Teknis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filteredItems.map((item) => {
                const ratio = getMeasurementRatio(item.siteplanVolume, item.actualVolume);
                const isLow = item.actualVolume > 0 && ratio < minPhysicalRatioPct;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-medium text-slate-600 whitespace-nowrap">
                      {item.category}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">{item.name}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap">
                      {item.siteplanVolume.toLocaleString('id-ID')} {item.unit}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {canInspect ? (
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <input
                            type="number"
                            min={0}
                            value={item.actualVolume}
                            onChange={(e) =>
                              onUpdateMeasurement(
                                project.id,
                                project.activeStageIndex,
                                item.id,
                                Math.max(0, Number(e.target.value))
                              )
                            }
                            className="w-24 px-2 py-1 text-right font-mono text-xs border border-slate-300 rounded bg-white tabular-nums focus:outline-none focus:border-[#0F294A]"
                          />
                          <span className="text-slate-500">{item.unit}</span>
                        </div>
                      ) : (
                        <span className="font-mono tabular-nums text-slate-800">
                          {item.actualVolume.toLocaleString('id-ID')} {item.unit}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums whitespace-nowrap">
                      {item.actualVolume === 0 ? (
                        <span className="text-slate-400">0%</span>
                      ) : (
                        <span
                          className={`font-semibold ${
                            isLow ? 'text-[#DC2626]' : 'text-[#059669]'
                          }`}
                        >
                          {ratio.toFixed(1)}%
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {item.actualVolume === 0 ? (
                        <span className="text-slate-500">Belum Diukur</span>
                      ) : isLow ? (
                        <span className="inline-flex items-center gap-1 text-[#DC2626] font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Kurang (&lt;{minPhysicalRatioPct}%)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[#059669] font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Sesuai Siteplan
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Defect List & Geotagging Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Defect List Manager */}
        <div className="xl:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Manajemen Defect List Lapangan
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Temuan kerusakan prasarana/sarana/utilitas beserta bukti perbaikan pengembang
              </p>
            </div>
            {canInspect && (
              <button
                type="button"
                onClick={() => setShowDefectForm(!showDefectForm)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#0F294A] rounded-lg hover:bg-[#163a66] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Temuan
              </button>
            )}
          </div>

          {showDefectForm && canInspect && (
            <form
              onSubmit={handleAddDefectSubmit}
              className="p-5 bg-slate-50 border-b border-slate-200 space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Kategori</label>
                  <select
                    value={defectForm.category}
                    onChange={(e) =>
                      setDefectForm({ ...defectForm, category: e.target.value as InfraCategory })
                    }
                    className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Prasarana">Prasarana</option>
                    <option value="Sarana">Sarana</option>
                    <option value="Utilitas">Utilitas</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Tingkat</label>
                  <select
                    value={defectForm.severity}
                    onChange={(e) =>
                      setDefectForm({
                        ...defectForm,
                        severity: e.target.value as 'Mayor' | 'Minor',
                      })
                    }
                    className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Mayor">Mayor</option>
                    <option value="Minor">Minor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Tenggat Perbaikan
                  </label>
                  <input
                    type="date"
                    value={defectForm.dueDate}
                    onChange={(e) => setDefectForm({ ...defectForm, dueDate: e.target.value })}
                    className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg font-mono bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Lokasi Spesifik (Blok / Jalan)
                </label>
                <input
                  required
                  type="text"
                  value={defectForm.location}
                  onChange={(e) => setDefectForm({ ...defectForm, location: e.target.value })}
                  placeholder="Contoh: Saluran Drainase Blok B No. 12"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Deskripsi Kerusakan / Temuan
                </label>
                <textarea
                  required
                  rows={2}
                  value={defectForm.description}
                  onChange={(e) => setDefectForm({ ...defectForm, description: e.target.value })}
                  placeholder="Contoh: Penutup U-ditch retak dan terdapat genangan sedimen..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDefectForm(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#DC2626] rounded-lg hover:bg-red-700 cursor-pointer"
                >
                  Catat Defect (Kunci BAST)
                </button>
              </div>
            </form>
          )}

          <div className="divide-y divide-slate-200">
            {stage.defects.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Tidak ada temuan defect pada tahapan ini.
              </div>
            ) : (
              stage.defects.map((defect) => (
                <div key={defect.id} className="p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-semibold text-slate-900">{defect.location}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-600">{defect.category}</span>
                        <span className="text-slate-400">·</span>
                        <span
                          className={`font-semibold ${
                            defect.severity === 'Mayor' ? 'text-[#DC2626]' : 'text-[#D97706]'
                          }`}
                        >
                          {defect.severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 mt-1">{defect.description}</p>
                      <p className="text-[11px] font-mono text-slate-500 mt-1 tabular-nums">
                        Dilaporkan: {formatDateId(defect.reportedAt)} · Tenggat:{' '}
                        {formatDateId(defect.dueDate)}
                      </p>
                    </div>

                    <span
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded border whitespace-nowrap self-start ${
                        defect.status === 'Closed'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : defect.status === 'Menunggu Verifikasi'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-red-50 text-red-800 border-red-200'
                      }`}
                    >
                      {defect.status}
                    </span>
                  </div>

                  {defect.repairProofNote && (
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-3">
                      {defect.repairProofPhoto && (
                        <img
                          src={defect.repairProofPhoto}
                          alt="Bukti perbaikan"
                          referrerPolicy="no-referrer"
                          className="w-16 h-12 object-cover rounded border border-slate-300 shrink-0"
                        />
                      )}
                      <div className="text-xs">
                        <p className="font-semibold text-slate-800">
                          Laporan Perbaikan Pengembang ({formatDateId(defect.repairSubmittedAt)})
                        </p>
                        <p className="text-slate-600 mt-0.5">{defect.repairProofNote}</p>
                      </div>
                    </div>
                  )}

                  {activeRepairId === defect.id && (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={repairNotes[defect.id] || ''}
                        onChange={(e) =>
                          setRepairNotes({ ...repairNotes, [defect.id]: e.target.value })
                        }
                        placeholder="Jelaskan tindakan perbaikan yang telah dilakukan..."
                        className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRepairSubmit(defect.id)}
                        className="px-3 py-2 text-xs font-semibold text-white bg-[#0D6E5B] rounded-lg hover:bg-emerald-800 whitespace-nowrap cursor-pointer"
                      >
                        Kirim Bukti Perbaikan
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    {canSubmitRepair && defect.status === 'Open' && (
                      <button
                        type="button"
                        onClick={() =>
                          setActiveRepairId(activeRepairId === defect.id ? null : defect.id)
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0F294A] bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Unggah Bukti Perbaikan
                      </button>
                    )}

                    {canInspect && defect.status !== 'Closed' && (
                      <button
                        type="button"
                        onClick={() =>
                          onCloseDefect(project.id, project.activeStageIndex, defect.id)
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#059669] rounded-lg hover:bg-emerald-700 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verifikasi Selesai (Tutup Defect)
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Mobile-Friendly Geotagging & Foto Survei */}
        <div className="xl:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-200">
            <h3 className="text-base font-semibold text-slate-900">
              Geotagging GPS & Dokumentasi Lapangan
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Perekaman titik koordinat lapangan, timestamp, dan foto objek PSU
            </p>
          </div>

          {canInspect && (
            <form onSubmit={handleSaveSurveyLog} className="p-5 border-b border-slate-200 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-700">Koordinat GPS & Timestamp</span>
                <button
                  type="button"
                  onClick={handleCaptureGps}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0F294A] bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  Ambil GPS Sekarang
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 font-mono text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 tabular-nums">
                <div>
                  <span className="text-slate-500 block text-[11px]">Latitude</span>
                  <span className="font-semibold text-slate-900">{gpsLat}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Longitude</span>
                  <span className="font-semibold text-slate-900">{gpsLng}</span>
                </div>
                <div className="col-span-2 pt-1 border-t border-slate-200 text-[11px] text-slate-600">
                  Timestamp: {gpsTime}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Pilih / Unggah Foto Dokumentasi
                </label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {[
                    { label: 'Jalan & Drainase', url: SURVEY_PHOTOS.jalan },
                    { label: 'Taman RTH', url: SURVEY_PHOTOS.rth },
                    { label: 'Temuan Defect', url: SURVEY_PHOTOS.defect },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setSelectedPhoto(opt.url)}
                      className={`p-1 rounded-lg border text-left cursor-pointer ${
                        selectedPhoto === opt.url
                          ? 'border-[#0F294A] ring-1 ring-[#0F294A]'
                          : 'border-slate-200'
                      }`}
                    >
                      <img
                        src={opt.url}
                        alt={opt.label}
                        referrerPolicy="no-referrer"
                        className="w-full h-14 object-cover rounded"
                      />
                      <p className="text-[10px] font-medium text-slate-700 mt-1 truncate">
                        {opt.label}
                      </p>
                    </button>
                  ))}
                </div>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <Camera className="w-3.5 h-3.5" />
                  Unggah Foto dari Perangkat
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <input
                  type="text"
                  value={surveyCaption}
                  onChange={(e) => setSurveyCaption(e.target.value)}
                  placeholder="Catatan hasil inspeksi lapangan..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 text-xs font-semibold text-white bg-[#0D6E5B] rounded-lg hover:bg-emerald-800 cursor-pointer"
              >
                Simpan Log Geotagging Survei
              </button>
            </form>
          )}

          <div className="p-5 space-y-3 max-h-[380px] overflow-y-auto">
            <p className="text-xs font-semibold text-slate-700">
              Riwayat Dokumentasi Lapangan ({stage.surveyLogs.length})
            </p>
            {stage.surveyLogs.length === 0 ? (
              <p className="text-xs text-slate-500">Belum ada log geotagging lapangan.</p>
            ) : (
              stage.surveyLogs.map((log) => (
                <div
                  key={log.id}
                  className="border border-slate-200 rounded-lg p-3 flex items-start gap-3"
                >
                  <img
                    src={log.photoUrl}
                    alt={log.caption}
                    referrerPolicy="no-referrer"
                    className="w-20 h-16 object-cover rounded border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0 text-xs">
                    <p className="font-semibold text-slate-900">{log.surveyor}</p>
                    <p className="font-mono text-[11px] text-[#0D6E5B] tabular-nums mt-0.5">
                      {log.latitude.toFixed(6)}, {log.longitude.toFixed(6)} · {log.timestamp}
                    </p>
                    <p className="text-slate-600 mt-1">{log.caption}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
