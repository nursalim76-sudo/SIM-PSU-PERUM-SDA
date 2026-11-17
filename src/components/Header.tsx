import React from 'react';
import { History, Menu, RotateCcw, UserCheck } from 'lucide-react';
import { MenuId, ROLE_META, UserRole } from '../types/psu';
import { canPerformAction } from '../services/rbacPolicy';

interface HeaderProps {
  activeMenu: MenuId;
  role: UserRole;
  onChangeRole: (role: UserRole) => void;
  onOpenMobileMenu: () => void;
  onResetDemoData: () => void;
  onOpenAuditTrail: () => void;
  auditCount: number;
}

const MENU_TITLES: Record<MenuId, string> = {
  dashboard: 'Dashboard Eksekutif',
  perumahan: 'Data Perumahan & Baseline Siteplan',
  'verifikasi-admin': 'Verifikasi Administrasi (Tahap 1)',
  'survei-fisik': 'Survei Fisik, Geotagging & Defect List (Tahap 2)',
  'bast-bmd': 'BAST Akhir & Pencatatan Aset BMD (BPKAD)',
  webgis: 'WebGIS Sebaran PSU 18 Kecamatan',
  'psu-terlantar': 'Jalur Khusus PSU Terlantar / Pailit',
  analytics: 'Analytics & Smart Recommendation',
  'laporan-brief': 'Laporan & Management Brief',
  pengaturan: 'Pengaturan, RBAC & Panduan SOP',
};

export const Header: React.FC<HeaderProps> = ({
  activeMenu,
  role,
  onChangeRole,
  onOpenMobileMenu,
  onResetDemoData,
  onOpenAuditTrail,
  auditCount,
}) => {
  const canViewAudit = canPerformAction(role, 'VIEW_AUDIT_TRAIL');

  return (
    <header className="no-print sticky top-0 z-30 bg-white border-b border-slate-200 px-4 md:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200 cursor-pointer"
            aria-label="Buka menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 truncate">
              SIM-PSU Sidoarjo · {ROLE_META[role].unit}
            </p>
            <h1 className="text-sm md:text-base font-semibold text-slate-900 truncate">
              {MENU_TITLES[activeMenu]}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 border border-slate-300 rounded-lg bg-slate-50 px-2.5 py-1.5">
            <UserCheck className="w-4 h-4 text-[#0F294A] shrink-0 hidden sm:block" />
            <label htmlFor="role-switcher" className="sr-only">
              Simulasi Peran Pengguna
            </label>
            <select
              id="role-switcher"
              value={role}
              onChange={(e) => onChangeRole(e.target.value as UserRole)}
              className="bg-transparent text-xs font-medium text-slate-800 focus:outline-none max-w-[160px] sm:max-w-[240px] cursor-pointer"
            >
              {(Object.keys(ROLE_META) as UserRole[]).map((roleKey) => (
                <option key={roleKey} value={roleKey}>
                  {ROLE_META[roleKey].label}
                </option>
              ))}
            </select>
          </div>

          {canViewAudit && (
            <button
              type="button"
              onClick={onOpenAuditTrail}
              title="Lihat Log Audit RBAC"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#0F294A] bg-white border border-slate-300 rounded-lg hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Audit Log</span>
              <span className="font-mono text-[11px] tabular-nums text-slate-500">({auditCount})</span>
            </button>
          )}

          <button
            type="button"
            onClick={onResetDemoData}
            title="Kembalikan Data Awal Simulasi"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset Data</span>
          </button>
        </div>
      </div>
    </header>
  );
};
