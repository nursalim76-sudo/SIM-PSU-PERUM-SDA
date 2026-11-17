import { HousingProject, HousingStage, ProjectStatus } from '../types/psu';

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompactRupiah(value: number): string {
  if (value >= 1_000_000_000_000) {
    return `Rp ${(value / 1_000_000_000_000).toFixed(2).replace('.', ',')} T`;
  }
  if (value >= 1_000_000_000) {
    return `Rp ${(value / 1_000_000_000).toFixed(2).replace('.', ',')} M`;
  }
  if (value >= 1_000_000) {
    return `Rp ${(value / 1_000_000).toFixed(1).replace('.', ',')} Jt`;
  }
  return formatRupiah(value);
}

export function formatAreaM2(value: number): string {
  return `${new Intl.NumberFormat('id-ID').format(Math.round(value))} m²`;
}

export function formatAreaHa(valueM2: number): string {
  const ha = valueM2 / 10000;
  return `${ha.toFixed(2).replace('.', ',')} Ha`;
}

export function formatDateId(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function getStatusMeta(status: ProjectStatus): {
  label: string;
  shortLabel: string;
  hex: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
  markerFill: string;
} {
  switch (status) {
    case 'BAST_SELESAI_BMD':
      return {
        label: 'BAST Akhir Selesai & Tercatat BMD',
        shortLabel: 'BAST & BMD',
        hex: '#059669',
        textClass: 'text-emerald-800',
        bgClass: 'bg-emerald-50',
        borderClass: 'border-emerald-200',
        markerFill: '#059669',
      };
    case 'BA_ADMIN_PEMELIHARAAN':
      return {
        label: 'BA Administrasi Terbit / Masa Pemeliharaan',
        shortLabel: 'Masa Pemeliharaan',
        hex: '#2563EB',
        textClass: 'text-blue-800',
        bgClass: 'bg-blue-50',
        borderClass: 'border-blue-200',
        markerFill: '#2563EB',
      };
    case 'PROSES_ADMIN':
      return {
        label: 'Proses Verifikasi / Revisi Berkas',
        shortLabel: 'Verifikasi Berkas',
        hex: '#D97706',
        textClass: 'text-amber-800',
        bgClass: 'bg-amber-50',
        borderClass: 'border-amber-200',
        markerFill: '#D97706',
      };
    case 'PERBAIKAN_DEFECT':
      return {
        label: 'Perbaikan Defect List Lapangan',
        shortLabel: 'Perbaikan Defect',
        hex: '#D97706',
        textClass: 'text-amber-800',
        bgClass: 'bg-amber-50',
        borderClass: 'border-amber-200',
        markerFill: '#D97706',
      };
    case 'TERLANTAR_PAILIT':
      return {
        label: 'Jalur Khusus PSU Terlantar / Pailit',
        shortLabel: 'PSU Terlantar',
        hex: '#DC2626',
        textClass: 'text-red-800',
        bgClass: 'bg-red-50',
        borderClass: 'border-red-200',
        markerFill: '#DC2626',
      };
    case 'BELUM_AJUKAN':
    default:
      return {
        label: 'Belum Ajukan / Menunggak',
        shortLabel: 'Menunggak',
        hex: '#DC2626',
        textClass: 'text-red-800',
        bgClass: 'bg-red-50',
        borderClass: 'border-red-200',
        markerFill: '#DC2626',
      };
  }
}

export function getActiveStage(project: HousingProject): HousingStage {
  return project.stages[project.activeStageIndex] || project.stages[0];
}

export function getAdminProgress(stage: HousingStage): number {
  if (stage.baAdminNumber) return 100;
  const total = stage.adminDocs.length;
  if (total === 0) return 0;
  const score = stage.adminDocs.reduce((acc, doc) => {
    if (doc.status === 'Valid') return acc + 1;
    if (doc.status === 'Menunggu Verifikasi') return acc + 0.5;
    if (doc.status === 'Perlu Revisi') return acc + 0.25;
    return acc;
  }, 0);
  return Math.round((score / total) * 100);
}

export function getPhysicalProgress(stage: HousingStage): number {
  if (stage.bastNumber) return 100;
  const items = stage.physicalChecklist;
  if (items.length === 0) return 0;
  const checkedCount = items.filter((i) => i.condition !== 'Belum Diperiksa' && i.actualVolume > 0).length;
  const openDefects = stage.defects.filter((d) => d.status !== 'Closed').length;
  const baseRatio = checkedCount / items.length;
  if (checkedCount === 0) return 0;
  const penalty = Math.min(0.35, openDefects * 0.12);
  const raw = Math.round(Math.max(10, (baseRatio - penalty) * 90));
  return stage.baplNumber ? 95 : Math.min(92, raw);
}

export function getMeasurementRatio(siteplan: number, actual: number): number {
  if (siteplan <= 0) return 100;
  return (actual / siteplan) * 100;
}

export function getMaintenanceCountdown(stage: HousingStage): {
  active: boolean;
  daysElapsed: number;
  daysRemaining: number;
  totalDays: number;
  percentComplete: number;
} {
  const totalDays = stage.maintenanceDaysTotal || 180;
  if (!stage.maintenanceStartDate) {
    return {
      active: false,
      daysElapsed: 0,
      daysRemaining: totalDays,
      totalDays,
      percentComplete: 0,
    };
  }
  const start = new Date(stage.maintenanceStartDate).getTime();
  const now = new Date('2026-11-16T00:00:00Z').getTime();
  const daysElapsed = Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
  const daysRemaining = Math.max(0, totalDays - daysElapsed);
  const percentComplete = Math.min(100, Math.round((daysElapsed / totalDays) * 100));
  return {
    active: true,
    daysElapsed,
    daysRemaining,
    totalDays,
    percentComplete,
  };
}

export function generateDocNumber(prefix: 'BA-ADM' | 'BAPL' | 'BAST', projectIndex: number): string {
  const num = String(100 + projectIndex * 7 + 14).padStart(3, '0');
  return `600.2/${num}/438.5.4/2026`;
}
