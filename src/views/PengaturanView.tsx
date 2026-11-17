import React, { useState } from 'react';
import { BookOpen, Check, History, Lock, Save, Shield, Sliders } from 'lucide-react';
import {
  AuditLogEntry,
  DEFAULT_SYSTEM_CONFIG,
  HousingProject,
  ROLE_META,
  SystemConfig,
  UserRole,
} from '../types/psu';
import {
  canPerformAction,
  DOMAIN_ACTION_LABELS,
  DomainAction,
} from '../services/rbacPolicy';

interface PengaturanViewProps {
  role: UserRole;
  projects: HousingProject[];
  activeDeveloperName: string;
  onChangeActiveDeveloper: (devName: string) => void;
  config: SystemConfig;
  onUpdateConfig: (cfg: SystemConfig) => void;
  auditLogs: AuditLogEntry[];
  onOpenAuditModal: () => void;
}

const ALL_ROLES: UserRole[] = [
  'ADMIN_DP2CKTR',
  'TIM_ADMIN',
  'TIM_LAPANGAN',
  'VERIFIKATOR_BPKAD',
  'ADMIN_KECAMATAN',
  'PENGEMBANG',
  'PIMPINAN_DAERAH',
];

const ALL_ACTIONS = Object.keys(DOMAIN_ACTION_LABELS) as DomainAction[];

export const PengaturanView: React.FC<PengaturanViewProps> = ({
  role,
  projects,
  activeDeveloperName,
  onChangeActiveDeveloper,
  config,
  onUpdateConfig,
  auditLogs,
  onOpenAuditModal,
}) => {
  const [draftCfg, setDraftCfg] = useState<SystemConfig>(config);
  const [activeTab, setActiveTab] = useState<'RBAC' | 'SLA' | 'SOP'>('RBAC');

  const canConfigure = canPerformAction(role, 'CONFIGURE_SYSTEM');
  const developerOptions = Array.from(new Set(projects.map((p) => p.pengembang)));

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canConfigure) return;
    onUpdateConfig(draftCfg);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Pengaturan Sistem, Matriks RBAC & Panduan SOP
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi ambang batas SLA Permendagri 15/2026, simulasi isolasi akun pengembang, dan matriks hak akses 7 peran
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
          <button
            type="button"
            onClick={() => setActiveTab('RBAC')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer whitespace-nowrap ${
              activeTab === 'RBAC' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            Matriks RBAC & Isolasi
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('SLA')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer whitespace-nowrap ${
              activeTab === 'SLA' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            Parameter SLA & EWS
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('SOP')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer whitespace-nowrap ${
              activeTab === 'SOP' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            Panduan Pengguna (SOP)
          </button>
        </div>
      </div>

      {/* Role Summary & Developer Isolation Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-[#0F294A]">
            <Shield className="w-4 h-4" />
            <h3 className="text-sm font-bold text-slate-900">Peran Aktif Saat Ini</h3>
          </div>
          <p className="text-sm font-semibold text-[#0D6E5B]">{ROLE_META[role].label}</p>
          <p className="text-xs text-slate-600 leading-relaxed">{ROLE_META[role].description}</p>
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500">Total Entri Audit Trail: {auditLogs.length}</span>
            {canPerformAction(role, 'VIEW_AUDIT_TRAIL') && (
              <button
                type="button"
                onClick={onOpenAuditModal}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F294A] hover:underline cursor-pointer"
              >
                <History className="w-3.5 h-3.5" />
                Buka Log Audit Lengkap
              </button>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-[#0F294A]">
            <Lock className="w-4 h-4" />
            <h3 className="text-sm font-bold text-slate-900">
              Isolasi Data Pengembang (Keamanan Multi-Tenant)
            </h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Sesuai PRD Bagian 12, saat peran disimulasikan sebagai <strong>Pengembang</strong>, sistem mengisolasi akses sehingga pengembang hanya dapat melihat dan mengajukan proyek miliknya sendiri.
          </p>
          <div>
            <label htmlFor="dev-isolation-select" className="block text-xs font-medium text-slate-700 mb-1">
              Identitas Badan Usaha Pengembang Aktif (Untuk Mode Pengembang)
            </label>
            <select
              id="dev-isolation-select"
              value={activeDeveloperName}
              onChange={(e) => onChangeActiveDeveloper(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="ALL">Semua Pengembang (Simulasi Lintas Proyek)</option>
              {developerOptions.map((dev) => (
                <option key={dev} value={dev}>
                  {dev}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {activeTab === 'RBAC' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">
              Matriks Kewenangan 7 Peran (Role-Based Access Control)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Seluruh aksi mutasi data dikunci secara terpusat di lapisan layanan RBAC
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                  <th className="py-3 px-4 min-w-[220px]">Kewenangan / Aksi Sistem</th>
                  {ALL_ROLES.map((r) => (
                    <th
                      key={r}
                      className={`py-3 px-2.5 text-center whitespace-nowrap ${
                        r === role ? 'bg-emerald-50 text-[#0D6E5B]' : ''
                      }`}
                    >
                      {ROLE_META[r].shortLabel}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {ALL_ACTIONS.map((act) => (
                  <tr key={act} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-4 font-medium text-slate-800">
                      {DOMAIN_ACTION_LABELS[act]}
                    </td>
                    {ALL_ROLES.map((r) => {
                      const allowed = canPerformAction(r, act);
                      return (
                        <td
                          key={`${act}-${r}`}
                          className={`py-2.5 px-2.5 text-center ${
                            r === role ? 'bg-emerald-50/40' : ''
                          }`}
                        >
                          {allowed ? (
                            <Check className="w-4 h-4 text-[#059669] mx-auto" />
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'SLA' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2 text-[#0F294A]">
            <Sliders className="w-4 h-4" />
            <h3 className="text-sm font-bold text-slate-900">
              Parameter Aturan Operasional & Prioritas EWS (PRD Bagian 8.4)
            </h3>
          </div>

          <form onSubmit={handleSaveConfig} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Ambang Minimum Luas Aktual vs Siteplan (%)
              </label>
              <input
                type="number"
                min={80}
                max={100}
                disabled={!canConfigure}
                value={draftCfg.minPhysicalRatioPct}
                onChange={(e) =>
                  setDraftCfg({ ...draftCfg, minPhysicalRatioPct: Number(e.target.value) })
                }
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg disabled:bg-slate-100"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Di bawah ambang ini, BAPL ditahan & anomali luas muncul.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Durasi Masa Pemeliharaan Fisik (Hari)
              </label>
              <input
                type="number"
                min={30}
                max={365}
                disabled={!canConfigure}
                value={draftCfg.defaultMaintenanceDays}
                onChange={(e) =>
                  setDraftCfg({ ...draftCfg, defaultMaintenanceDays: Number(e.target.value) })
                }
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Pengingat Masa Pemeliharaan Berakhir (H-Hari)
              </label>
              <input
                type="number"
                min={3}
                max={30}
                disabled={!canConfigure}
                value={draftCfg.maintenanceAlertDays}
                onChange={(e) =>
                  setDraftCfg({ ...draftCfg, maintenanceAlertDays: Number(e.target.value) })
                }
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Batas SLA Pencatatan BMD Pasca-BAST (Hari Kerja)
              </label>
              <input
                type="number"
                min={3}
                max={60}
                disabled={!canConfigure}
                value={draftCfg.bmdBacklogMaxDays}
                onChange={(e) =>
                  setDraftCfg({ ...draftCfg, bmdBacklogMaxDays: Number(e.target.value) })
                }
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Ambang Unit Terbangun Pemicu EWS (%)
              </label>
              <input
                type="number"
                min={50}
                max={100}
                disabled={!canConfigure}
                value={draftCfg.ewsBuiltThresholdPct}
                onChange={(e) =>
                  setDraftCfg({ ...draftCfg, ewsBuiltThresholdPct: Number(e.target.value) })
                }
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg disabled:bg-slate-100"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3 flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                disabled={!canConfigure}
                onClick={() => {
                  setDraftCfg(DEFAULT_SYSTEM_CONFIG);
                  onUpdateConfig(DEFAULT_SYSTEM_CONFIG);
                }}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                Reset Default PRD
              </button>
              <button
                type="submit"
                disabled={!canConfigure}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0F294A] rounded-lg hover:bg-[#163a66] disabled:bg-slate-300 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                Simpan Parameter SLA
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'SOP' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-[#0D6E5B]">
            <BookOpen className="w-5 h-5" />
            <h3 className="text-sm font-bold text-slate-900">
              Panduan Ringkas Alur Operasional SIM-PSU Sidoarjo (Permendagri No. 15 Tahun 2026)
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700 leading-relaxed">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
              <p className="font-bold text-[#0F294A]">Tahap 1 · Baseline & Verifikasi Administrasi</p>
              <p>1. Sekretariat DP2CKTR menginput baseline siteplan & menetapkan skema (Sekaligus / Bertahap).</p>
              <p>2. Pengembang mengunggah 6 dokumen wajib Pasal 11 (termasuk bukti pelepasan hak/pemecahan sertifikat PSU).</p>
              <p>3. Tim Verifikasi Administrasi memeriksa paralel; apabila seluruh berkas Valid, diterbitkan BA Penyerahan Administrasi.</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
              <p className="font-bold text-[#0D6E5B]">Tahap 2 · Survei Fisik, Geotagging & Defect Lock</p>
              <p>1. Tim Verifikasi Lapangan mengukur volume aktual komponen Prasarana, Sarana, dan Utilitas serta merekam GPS.</p>
              <p>2. Bila realisasi &lt;{config.minPhysicalRatioPct}% atau ditemukan cacat mutu (Defect List), sistem otomatis mengunci BAPL & BAST.</p>
              <p>3. Pengembang mengunggah bukti perbaikan hingga diverifikasi Closed dan masa pemeliharaan {config.defaultMaintenanceDays} hari terpenuhi.</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
              <p className="font-bold text-[#059669]">Tahap 3 · BAPL, BAST Akhir & Integrasi KIB BMD</p>
              <p>1. Setelah 0 defect dan rasio fisik memenuhi syarat, diterbitkan BAPL dan BAST Akhir ber-QR Code.</p>
              <p>2. Verifikator Aset BPKAD mencatat kode barang BMD (KIB A, C, D), nomor register, dan menetapkan OPD Pengelola Teknis dalam &le;{config.bmdBacklogMaxDays} hari kerja.</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
              <p className="font-bold text-[#DC2626]">Jalur Khusus · PSU Terlantar / Pengembang Pailit</p>
              <p>1. Admin Kecamatan/Desa atau Sekretariat mencatat laporan PSU terlantar.</p>
              <p>2. Berjalan 5 tahap: Laporan Kecamatan &rarr; Pengumuman Media &rarr; BA Pembuktian Kelalaian &rarr; Penetapan SK Bupati &rarr; Pencatatan Aset BMD.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
