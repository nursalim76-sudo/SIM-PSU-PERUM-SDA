import { UserRole } from '../types/psu';

export type DomainAction =
  | 'CREATE_SITEPLAN'
  | 'UPLOAD_ADMIN_DOC'
  | 'VERIFY_ADMIN_DOC'
  | 'ISSUE_BA_ADMIN'
  | 'UPDATE_MEASUREMENT'
  | 'ADD_SURVEY_LOG'
  | 'ADD_DEFECT'
  | 'SUBMIT_DEFECT_REPAIR'
  | 'CLOSE_DEFECT'
  | 'ISSUE_BAPL'
  | 'ISSUE_BAST_AKHIR'
  | 'RECORD_BMD_ASSET'
  | 'REPORT_ABANDONED_PSU'
  | 'MANAGE_ABANDONED_TRACK'
  | 'CONFIGURE_SYSTEM'
  | 'VIEW_AUDIT_TRAIL';

const ROLE_PERMISSIONS: Record<UserRole, ReadonlySet<DomainAction>> = {
  ADMIN_DP2CKTR: new Set<DomainAction>([
    'CREATE_SITEPLAN',
    'UPLOAD_ADMIN_DOC',
    'VERIFY_ADMIN_DOC',
    'ISSUE_BA_ADMIN',
    'UPDATE_MEASUREMENT',
    'ADD_SURVEY_LOG',
    'ADD_DEFECT',
    'SUBMIT_DEFECT_REPAIR',
    'CLOSE_DEFECT',
    'ISSUE_BAPL',
    'ISSUE_BAST_AKHIR',
    'RECORD_BMD_ASSET',
    'REPORT_ABANDONED_PSU',
    'MANAGE_ABANDONED_TRACK',
    'CONFIGURE_SYSTEM',
    'VIEW_AUDIT_TRAIL',
  ]),
  TIM_ADMIN: new Set<DomainAction>([
    'VERIFY_ADMIN_DOC',
    'ISSUE_BA_ADMIN',
    'VIEW_AUDIT_TRAIL',
  ]),
  TIM_LAPANGAN: new Set<DomainAction>([
    'UPDATE_MEASUREMENT',
    'ADD_SURVEY_LOG',
    'ADD_DEFECT',
    'CLOSE_DEFECT',
    'VIEW_AUDIT_TRAIL',
  ]),
  VERIFIKATOR_BPKAD: new Set<DomainAction>([
    'RECORD_BMD_ASSET',
    'MANAGE_ABANDONED_TRACK',
    'VIEW_AUDIT_TRAIL',
  ]),
  ADMIN_KECAMATAN: new Set<DomainAction>([
    'REPORT_ABANDONED_PSU',
    'VIEW_AUDIT_TRAIL',
  ]),
  PENGEMBANG: new Set<DomainAction>([
    'CREATE_SITEPLAN',
    'UPLOAD_ADMIN_DOC',
    'SUBMIT_DEFECT_REPAIR',
  ]),
  PIMPINAN_DAERAH: new Set<DomainAction>(['VIEW_AUDIT_TRAIL']),
};

export const DOMAIN_ACTION_LABELS: Record<DomainAction, string> = {
  CREATE_SITEPLAN: 'Registrasi Baseline Siteplan',
  UPLOAD_ADMIN_DOC: 'Unggah Berkas Administrasi',
  VERIFY_ADMIN_DOC: 'Verifikasi / Revisi Berkas Administrasi',
  ISSUE_BA_ADMIN: 'Terbitkan BA Penyerahan Administrasi',
  UPDATE_MEASUREMENT: 'Input Ukur Aktual Lapangan',
  ADD_SURVEY_LOG: 'Rekam Geotagging GPS & Foto Lapangan',
  ADD_DEFECT: 'Catat Temuan Defect List',
  SUBMIT_DEFECT_REPAIR: 'Unggah Bukti Perbaikan Defect',
  CLOSE_DEFECT: 'Verifikasi Selesai & Tutup Defect',
  ISSUE_BAPL: 'Terbitkan BAPL',
  ISSUE_BAST_AKHIR: 'Terbitkan BAST Akhir',
  RECORD_BMD_ASSET: 'Registrasi KIB BMD (BPKAD)',
  REPORT_ABANDONED_PSU: 'Laporan Awal PSU Terlantar',
  MANAGE_ABANDONED_TRACK: 'Proses Jalur Khusus & SK Bupati',
  CONFIGURE_SYSTEM: 'Konfigurasi SLA & Ambang Batas',
  VIEW_AUDIT_TRAIL: 'Akses Audit Trail RBAC',
};

export function canPerformAction(role: UserRole, action: DomainAction): boolean {
  return ROLE_PERMISSIONS[role]?.has(action) ?? false;
}

export function assertPermission(role: UserRole, action: DomainAction): string | null {
  if (canPerformAction(role, action)) return null;
  return `Akses ditolak (RBAC): Peran ${role} tidak memiliki kewenangan untuk aksi ${action}.`;
}
