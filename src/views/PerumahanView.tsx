import React, { useMemo, useState } from 'react';
import { Plus, Search, ArrowRight, X, Layers } from 'lucide-react';
import {
  ADMIN_DOC_TEMPLATES,
  HandoverScheme,
  HousingProject,
  MenuId,
  ProjectStatus,
  SIDOARJO_KECAMATAN,
  UserRole,
} from '../types/psu';
import {
  formatAreaM2,
  formatDateId,
  getActiveStage,
  getAdminProgress,
  getPhysicalProgress,
} from '../utils/formatters';
import { StatusLabel } from '../components/StatusLabel';
import { makeChecklist, SIDOARJO_MAP_POLYGONS } from '../data/initialData';

interface PerumahanViewProps {
  projects: HousingProject[];
  role: UserRole;
  onAddProject: (project: HousingProject) => void;
  onChangeStage: (projectId: string, stageIndex: number) => void;
  onSelectProjectModule: (projectId: string, menu: MenuId) => void;
  defaultMaintenanceDays?: number;
}

export const PerumahanView: React.FC<PerumahanViewProps> = ({
  projects,
  role,
  onAddProject,
  onChangeStage,
  onSelectProjectModule,
  defaultMaintenanceDays = 180,
}) => {
  const [search, setSearch] = useState('');
  const [kecFilter, setKecFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showForm, setShowForm] = useState(false);

  const [formState, setFormState] = useState({
    namaPerumahan: '',
    pengembang: '',
    kecamatan: 'Sidoarjo',
    desa: '',
    nomorSiteplan: '',
    tanggalPengesahanSiteplan: '2026-01-15',
    luasTotalM2: 40000,
    luasKavlingEfektifM2: 24000,
    skemaPenyerahan: 'Sekaligus' as HandoverScheme,
    namaTahap1: 'Tahap 1 — Klaster Utama',
    namaTahap2: 'Tahap 2 — Klaster Pengembangan',
    estimasiNilaiAsetRp: 18500000000,
  });

  const canCreate = role === 'ADMIN_DP2CKTR' || role === 'PENGEMBANG';

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchText =
        p.namaPerumahan.toLowerCase().includes(search.toLowerCase()) ||
        p.pengembang.toLowerCase().includes(search.toLowerCase()) ||
        p.nomorSiteplan.toLowerCase().includes(search.toLowerCase());
      const matchKec = kecFilter === 'ALL' || p.kecamatan === kecFilter;
      const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
      return matchText && matchKec && matchStatus;
    });
  }, [projects, search, kecFilter, statusFilter]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.namaPerumahan.trim() || !formState.pengembang.trim()) return;

    const luasTotal = Math.max(1000, Number(formState.luasTotalM2) || 1000);
    const luasKavling = Math.min(luasTotal, Math.max(0, Number(formState.luasKavlingEfektifM2) || 0));
    const luasWajibPsuM2 = Math.max(0, luasTotal - luasKavling);
    const id = `prj-${Date.now()}`;
    const scaleFactor = Math.max(0.5, luasWajibPsuM2 / 24000);

    const buildStage = (stageId: string, name: string, psuArea: number, stageScale: number) => ({
      id: stageId,
      stageName: name.trim() || 'Tahap Penyerahan',
      luasPsuM2: psuArea,
      status: 'PROSES_ADMIN' as ProjectStatus,
      adminDocs: ADMIN_DOC_TEMPLATES.map((t) => ({
        ...t,
        status: t.code === 4 ? ('Valid' as const) : ('Belum Unggah' as const),
        fileName: t.code === 4 ? 'siteplan_pengesahan.pdf' : undefined,
        uploadedAt: t.code === 4 ? '2026-11-16' : undefined,
      })),
      maintenanceDaysTotal: defaultMaintenanceDays,
      physicalChecklist: makeChecklist(stageScale, 0, false),
      defects: [],
      surveyLogs: [],
      bmdAssets: [],
    });

    const stages =
      formState.skemaPenyerahan === 'Bertahap per Klaster/Blok'
        ? [
            buildStage(
              `${id}-s1`,
              formState.namaTahap1 || 'Tahap 1 — Klaster Utama',
              Math.round(luasWajibPsuM2 * 0.5),
              scaleFactor * 0.5
            ),
            buildStage(
              `${id}-s2`,
              formState.namaTahap2 || 'Tahap 2 — Klaster Pengembangan',
              luasWajibPsuM2 - Math.round(luasWajibPsuM2 * 0.5),
              scaleFactor * 0.5
            ),
          ]
        : [buildStage(`${id}-s1`, 'Penyerahan Sekaligus', luasWajibPsuM2, scaleFactor)];

    const kecPoly = SIDOARJO_MAP_POLYGONS.find((k) => k.name === formState.kecamatan);
    const baseMapX = kecPoly ? kecPoly.labelX : 350;
    const baseMapY = kecPoly ? kecPoly.labelY : 260;

    const newProject: HousingProject = {
      id,
      namaPerumahan: formState.namaPerumahan.trim(),
      pengembang: formState.pengembang.trim(),
      kecamatan: formState.kecamatan,
      desa: formState.desa.trim() || 'Kota',
      nomorSiteplan: formState.nomorSiteplan.trim() || `650/NEW/SP/438.5.4/2026`,
      tanggalPengesahanSiteplan: formState.tanggalPengesahanSiteplan,
      luasTotalM2: luasTotal,
      luasKavlingEfektifM2: luasKavling,
      luasWajibPsuM2,
      skemaPenyerahan: formState.skemaPenyerahan,
      activeStageIndex: 0,
      stages,
      status: 'PROSES_ADMIN',
      ewsFlag: false,
      targetPenyerahanDate: '2027-06-30',
      coordinates: {
        lat: -7.42 + (Math.random() - 0.5) * 0.08,
        lng: 112.7 + (Math.random() - 0.5) * 0.12,
        mapX: baseMapX + Math.round((Math.random() - 0.5) * 24),
        mapY: baseMapY + Math.round((Math.random() - 0.5) * 20),
      },
      estimasiNilaiAsetRp:
        Number(formState.estimasiNilaiAsetRp) > 0
          ? Number(formState.estimasiNilaiAsetRp)
          : Math.round(luasWajibPsuM2 * 1450000),
    };

    onAddProject(newProject);
    setShowForm(false);
    setFormState({
      ...formState,
      namaPerumahan: '',
      pengembang: '',
      desa: '',
      nomorSiteplan: '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Data Perumahan & Baseline Siteplan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengelolaan luasan wajib PSU berdasarkan pengesahan siteplan dan skema penyerahan (Sekaligus / Bertahap)
          </p>
        </div>

        <button
          type="button"
          disabled={!canCreate}
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0F294A] rounded-lg hover:bg-[#163a66] disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tambah Data Siteplan
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama perumahan, pengembang, atau nomor siteplan..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F294A]"
          />
        </div>
        <select
          value={kecFilter}
          onChange={(e) => setKecFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-[#0F294A]"
        >
          <option value="ALL">Semua 18 Kecamatan</option>
          {SIDOARJO_KECAMATAN.map((k) => (
            <option key={k} value={k}>
              Kec. {k}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-[#0F294A]"
        >
          <option value="ALL">Semua Status</option>
          <option value="BELUM_AJUKAN">Belum Ajukan / Menunggak</option>
          <option value="PROSES_ADMIN">Verifikasi Berkas</option>
          <option value="BA_ADMIN_PEMELIHARAAN">Masa Pemeliharaan</option>
          <option value="PERBAIKAN_DEFECT">Perbaikan Defect</option>
          <option value="BAST_SELESAI_BMD">BAST Akhir & BMD</option>
          <option value="TERLANTAR_PAILIT">PSU Terlantar / Pailit</option>
        </select>
      </div>

      {/* Table with Dual-Track Progress */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4">Perumahan & Siteplan</th>
                <th className="py-3 px-4">Kecamatan / Desa</th>
                <th className="py-3 px-4 text-right">Luas Total</th>
                <th className="py-3 px-4 text-right">Kavling Efektif</th>
                <th className="py-3 px-4 text-right">Wajib PSU</th>
                <th className="py-3 px-4">Skema & Tahapan</th>
                <th className="py-3 px-4 min-w-[200px]">Dual-Track Progress</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    Tidak ada proyek perumahan yang cocok dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((project) => {
                  const stage = getActiveStage(project);
                  const adminPct = getAdminProgress(stage);
                  const physPct = getPhysicalProgress(stage);
                  const psuRatioPct =
                    project.luasTotalM2 > 0
                      ? Math.round((project.luasWajibPsuM2 / project.luasTotalM2) * 100)
                      : 0;

                  return (
                    <tr key={project.id} className="hover:bg-slate-50/70 align-top">
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900">{project.namaPerumahan}</p>
                        <p className="text-slate-500 mt-0.5">{project.pengembang}</p>
                        <p className="font-mono text-[11px] text-slate-500 mt-1">
                          {project.nomorSiteplan} · {formatDateId(project.tanggalPengesahanSiteplan)}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700">
                        <p className="font-medium">Kec. {project.kecamatan}</p>
                        <p className="text-slate-500">Desa {project.desa}</p>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap">
                        {formatAreaM2(project.luasTotalM2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap">
                        {formatAreaM2(project.luasKavlingEfektifM2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums whitespace-nowrap">
                        <p className="font-semibold text-[#0F294A]">
                          {formatAreaM2(project.luasWajibPsuM2)}
                        </p>
                        <p className="text-[11px] text-slate-500">{psuRatioPct}% lahan</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-slate-800">{project.skemaPenyerahan}</p>
                        {project.stages.length > 1 ? (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {project.stages.map((st, idx) => (
                              <button
                                key={st.id}
                                type="button"
                                onClick={() => onChangeStage(project.id, idx)}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border cursor-pointer ${
                                  project.activeStageIndex === idx
                                    ? 'bg-[#0F294A] text-white border-[#0F294A]'
                                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                                }`}
                              >
                                <Layers className="w-3 h-3" />
                                Tahap {idx + 1}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-500 mt-0.5">{stage.stageName}</p>
                        )}
                        <div className="mt-2">
                          <StatusLabel status={stage.status} compact />
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-2">
                          <div>
                            <div className="flex items-center justify-between text-[11px] mb-1">
                              <span className="text-slate-600">Administrasi</span>
                              <span className="font-mono font-semibold text-[#0F294A] tabular-nums">
                                {adminPct}%
                              </span>
                            </div>
                            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#0F294A] rounded-full transition-all"
                                style={{ width: `${adminPct}%` }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center justify-between text-[11px] mb-1">
                              <span className="text-slate-600">Fisik Lapangan</span>
                              <span className="font-mono font-semibold text-[#0D6E5B] tabular-nums">
                                {physPct}%
                              </span>
                            </div>
                            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#0D6E5B] rounded-full transition-all"
                                style={{ width: `${physPct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex flex-col items-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectProjectModule(project.id, 'verifikasi-admin')}
                            className="inline-flex items-center gap-1 text-xs font-medium text-[#0F294A] hover:underline cursor-pointer"
                          >
                            Verifikasi Adm
                            <ArrowRight className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectProjectModule(project.id, 'survei-fisik')}
                            className="inline-flex items-center gap-1 text-xs font-medium text-[#0D6E5B] hover:underline cursor-pointer"
                          >
                            Survei Fisik
                            <ArrowRight className="w-3 h-3" />
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

      {/* Add Siteplan Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                Registrasi Baseline Siteplan Perumahan Baru
              </h3>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Nama Perumahan *
                  </label>
                  <input
                    required
                    type="text"
                    value={formState.namaPerumahan}
                    onChange={(e) => setFormState({ ...formState, namaPerumahan: e.target.value })}
                    placeholder="Contoh: Puri Delta Residence"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F294A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Badan Usaha Pengembang *
                  </label>
                  <input
                    required
                    type="text"
                    value={formState.pengembang}
                    onChange={(e) => setFormState({ ...formState, pengembang: e.target.value })}
                    placeholder="Contoh: PT Delta Properti Nusantara"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F294A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Kecamatan
                  </label>
                  <select
                    value={formState.kecamatan}
                    onChange={(e) => setFormState({ ...formState, kecamatan: e.target.value })}
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
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Desa / Kelurahan
                  </label>
                  <input
                    type="text"
                    value={formState.desa}
                    onChange={(e) => setFormState({ ...formState, desa: e.target.value })}
                    placeholder="Contoh: Cemengkalang"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Nomor Pengesahan Siteplan
                  </label>
                  <input
                    type="text"
                    value={formState.nomorSiteplan}
                    onChange={(e) => setFormState({ ...formState, nomorSiteplan: e.target.value })}
                    placeholder="650/210/SP/438.5.4/2026"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Tanggal Pengesahan Siteplan
                  </label>
                  <input
                    type="date"
                    value={formState.tanggalPengesahanSiteplan}
                    onChange={(e) =>
                      setFormState({ ...formState, tanggalPengesahanSiteplan: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Luas Total Lahan (m²)
                  </label>
                  <input
                    type="number"
                    min={1000}
                    value={formState.luasTotalM2}
                    onChange={(e) =>
                      setFormState({ ...formState, luasTotalM2: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Luas Kavling Efektif (m²)
                  </label>
                  <input
                    type="number"
                    min={500}
                    max={formState.luasTotalM2}
                    value={formState.luasKavlingEfektifM2}
                    onChange={(e) =>
                      setFormState({ ...formState, luasKavlingEfektifM2: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Luas Wajib PSU (Otomatis)
                  </label>
                  <div className="px-3 py-2 text-xs font-mono font-semibold text-[#0F294A] bg-slate-100 border border-slate-200 rounded-lg tabular-nums">
                    {formatAreaM2(Math.max(0, formState.luasTotalM2 - formState.luasKavlingEfektifM2))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Skema Penyerahan
                  </label>
                  <select
                    value={formState.skemaPenyerahan}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        skemaPenyerahan: e.target.value as HandoverScheme,
                      })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Sekaligus">Sekaligus</option>
                    <option value="Bertahap per Klaster/Blok">Bertahap per Klaster/Blok</option>
                  </select>
                </div>

                {formState.skemaPenyerahan === 'Bertahap per Klaster/Blok' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Nama Tahap 1 (Klaster/Blok)
                      </label>
                      <input
                        type="text"
                        value={formState.namaTahap1}
                        onChange={(e) => setFormState({ ...formState, namaTahap1: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Nama Tahap 2 (Klaster/Blok)
                      </label>
                      <input
                        type="text"
                        value={formState.namaTahap2}
                        onChange={(e) => setFormState({ ...formState, namaTahap2: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0F294A] rounded-lg hover:bg-[#163a66] cursor-pointer"
                >
                  Simpan Data Perumahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
