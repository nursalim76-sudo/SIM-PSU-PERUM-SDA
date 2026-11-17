import React from 'react';
import {
  LayoutDashboard,
  Building2,
  FileCheck2,
  ClipboardCheck,
  Landmark,
  Map as MapIcon,
  AlertTriangle,
  BarChart3,
  FileText,
  Settings,
  X,
} from 'lucide-react';
import { MenuId } from '../types/psu';

interface SidebarProps {
  activeMenu: MenuId;
  onSelectMenu: (menu: MenuId) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  ewsCount: number;
  abandonedCount: number;
}

const MENU_ITEMS: Array<{
  id: MenuId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'dashboard', label: 'Dashboard Eksekutif', icon: LayoutDashboard },
  { id: 'perumahan', label: 'Data Perumahan', icon: Building2 },
  { id: 'verifikasi-admin', label: 'Verifikasi Administrasi', icon: FileCheck2 },
  { id: 'survei-fisik', label: 'Survei Fisik & Defect List', icon: ClipboardCheck },
  { id: 'bast-bmd', label: 'BAST & Aset BMD (BPKAD)', icon: Landmark },
  { id: 'webgis', label: 'WebGIS 18 Kecamatan', icon: MapIcon },
  { id: 'psu-terlantar', label: 'PSU Terlantar / Pailit', icon: AlertTriangle },
  { id: 'analytics', label: 'Analytics & Insight', icon: BarChart3 },
  { id: 'laporan-brief', label: 'Laporan & Management Brief', icon: FileText },
  { id: 'pengaturan', label: 'Pengaturan & Hak Akses', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeMenu,
  onSelectMenu,
  mobileOpen,
  onCloseMobile,
  ewsCount,
  abandonedCount,
}) => {
  const navContent = (
    <div className="flex flex-col h-full bg-[#0F294A] text-slate-100">
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0D6E5B] flex items-center justify-center font-bold text-white text-sm shrink-0">
              PSU
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold tracking-tight text-white truncate">SIM-PSU Sidoarjo</p>
              <p className="text-[11px] text-slate-300 truncate">DP2CKTR Kab. Sidoarjo</p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 text-slate-300 hover:text-white rounded-md cursor-pointer"
          aria-label="Tutup menu navigasi"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Menu Utama">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeMenu === item.id;
          const countHint =
            item.id === 'dashboard' && ewsCount > 0
              ? ewsCount
              : item.id === 'psu-terlantar' && abandonedCount > 0
                ? abandonedCount
                : null;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectMenu(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg text-left text-[13px] font-medium transition-colors cursor-pointer ${
                active
                  ? 'bg-[#0D6E5B] text-white'
                  : 'text-slate-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Icon className="w-4 h-4 shrink-0 opacity-90" />
                <span className="truncate">{item.label}</span>
              </span>
              {countHint !== null && (
                <span className="font-mono text-[11px] tabular-nums text-slate-200/90 shrink-0">
                  {countHint}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-white/10 text-[11px] text-slate-300 leading-relaxed space-y-1">
        <p className="font-medium text-white">Permendagri No. 15 Tahun 2026</p>
        <p className="text-slate-300/90">
          Tertib Administrasi, Terukur Fisiknya, Pasti Aset Daerahnya.
        </p>
      </div>
    </div>
  );

  return (
    <>
      <aside className="no-print hidden lg:block w-[264px] shrink-0 border-r border-slate-200 min-h-screen">
        <div className="sticky top-0 h-screen">{navContent}</div>
      </aside>

      {mobileOpen && (
        <div className="no-print fixed inset-0 z-40 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-900/50" onClick={onCloseMobile} />
          <aside className="relative z-50 w-[272px] max-w-[82vw] h-full shadow-xl">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
};
