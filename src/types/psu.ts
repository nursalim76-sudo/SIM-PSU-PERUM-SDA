export type UserRole =
  | 'ADMIN_DP2CKTR'
  | 'TIM_ADMIN'
  | 'TIM_LAPANGAN'
  | 'VERIFIKATOR_BPKAD'
  | 'ADMIN_KECAMATAN'
  | 'PENGEMBANG'
  | 'PIMPINAN_DAERAH';

export type MenuId =
  | 'dashboard'
  | 'perumahan'
  | 'verifikasi-admin'
  | 'survei-fisik'
  | 'bast-bmd'
  | 'webgis'
  | 'psu-terlantar'
  | 'analytics'
  | 'laporan-brief'
  | 'pengaturan';

export type ProjectStatus =
  | 'BELUM_AJUKAN'
  | 'PROSES_ADMIN'
  | 'BA_ADMIN_PEMELIHARAAN'
  | 'PERBAIKAN_DEFECT'
  | 'BAST_SELESAI_BMD'
  | 'TERLANTAR_PAILIT';

export type HandoverScheme = 'Sekaligus' | 'Bertahap per Klaster/Blok';

export type DocStatus = 'Belum Unggah' | 'Menunggu Verifikasi' | 'Valid' | 'Perlu Revisi';

export interface AdminDocItem {
  id: string;
  code: number;
  label: string;
  legalBasis: string;
  opdReviewer?: string;
  status: DocStatus;
  fileName?: string;
  uploadedAt?: string;
  revisionNote?: string;
  verifiedBy?: string;
}

export type InfraCategory = 'Prasarana' | 'Sarana' | 'Utilitas';

export interface PhysicalChecklistItem {
  id: string;
  category: InfraCategory;
  name: string;
  unit: string;
  siteplanVolume: number;
  actualVolume: number;
  condition: 'Baik' | 'Perlu Perbaikan' | 'Belum Diperiksa';
  notes?: string;
}

export interface DefectItem {
  id: string;
  category: InfraCategory;
  location: string;
  description: string;
  severity: 'Mayor' | 'Minor';
  dueDate: string;
  status: 'Open' | 'Menunggu Verifikasi' | 'Closed';
  reportedAt: string;
  repairProofNote?: string;
  repairProofPhoto?: string;
  repairSubmittedAt?: string;
  closedAt?: string;
}

export interface SurveyLog {
  id: string;
  timestamp: string;
  surveyor: string;
  latitude: number;
  longitude: number;
  photoUrl: string;
  caption: string;
}

export type KibType =
  | 'KIB A - Tanah'
  | 'KIB C - Gedung/Bangunan'
  | 'KIB D - Jalan, Irigasi & Jaringan';

export interface BmdAssetRecord {
  id: string;
  kodeBarangBmd: string;
  jenisKib: KibType;
  nomorRegister: string;
  nomorSertifikatHakPakai: string;
  nilaiPerolehanRp: number;
  opdPengelolaTeknis: string;
  recordedAt: string;
  verifiedBy: string;
}

export type AbandonedStage =
  | 'Laporan Kecamatan/Warga'
  | 'Pengumuman Media'
  | 'Berita Acara Pembuktian Kelalaian'
  | 'Penetapan SK Bupati'
  | 'Pencatatan Aset BMD';

export interface AbandonedTrackInfo {
  currentStage: AbandonedStage;
  reason: string;
  mediaAnnouncementDate?: string;
  baKelalaianNumber?: string;
  skBupatiNumber?: string;
  skBupatiDate?: string;
  lastUpdated: string;
  notes: string;
}

export interface HousingStage {
  id: string;
  stageName: string;
  luasPsuM2: number;
  status: ProjectStatus;
  adminDocs: AdminDocItem[];
  baAdminNumber?: string;
  baAdminDate?: string;
  baplNumber?: string;
  baplDate?: string;
  bastNumber?: string;
  bastDate?: string;
  maintenanceStartDate?: string;
  maintenanceDaysTotal: number;
  physicalChecklist: PhysicalChecklistItem[];
  defects: DefectItem[];
  surveyLogs: SurveyLog[];
  bmdAssets: BmdAssetRecord[];
}

export interface HousingProject {
  id: string;
  namaPerumahan: string;
  pengembang: string;
  kecamatan: string;
  desa: string;
  nomorSiteplan: string;
  tanggalPengesahanSiteplan: string;
  luasTotalM2: number;
  luasKavlingEfektifM2: number;
  luasWajibPsuM2: number;
  unitTerbangunPct?: number;
  skemaPenyerahan: HandoverScheme;
  activeStageIndex: number;
  stages: HousingStage[];
  status: ProjectStatus;
  ewsFlag: boolean;
  ewsReason?: string;
  targetPenyerahanDate: string;
  coordinates: {
    lat: number;
    lng: number;
    mapX: number;
    mapY: number;
  };
  abandonedInfo?: AbandonedTrackInfo;
  estimasiNilaiAsetRp: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorRole: UserRole;
  actorLabel: string;
  actorUnit: string;
  action: string;
  projectId?: string;
  projectName?: string;
  detail: string;
}

export interface SystemConfig {
  minPhysicalRatioPct: number;
  defaultMaintenanceDays: number;
  maintenanceAlertDays: number;
  bmdBacklogMaxDays: number;
  ewsBuiltThresholdPct: number;
}

export const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  minPhysicalRatioPct: 95,
  defaultMaintenanceDays: 180,
  maintenanceAlertDays: 14,
  bmdBacklogMaxDays: 14,
  ewsBuiltThresholdPct: 80,
};

export const SIDOARJO_KECAMATAN = [
  'Sidoarjo',
  'Buduran',
  'Candi',
  'Porong',
  'Krembung',
  'Tulangan',
  'Tanggulangin',
  'Jabon',
  'Krian',
  'Balongbendo',
  'Wonoayu',
  'Tarik',
  'Prambon',
  'Taman',
  'Waru',
  'Gedangan',
  'Sedati',
  'Sukodono',
] as const;

export const ADMIN_DOC_TEMPLATES: Omit<AdminDocItem, 'status'>[] = [
  {
    id: 'doc-1',
    code: 1,
    label: 'Surat Permohonan Pengembang',
    legalBasis: 'Permendagri 15/2026 Pasal 11 ayat (1) huruf a',
    opdReviewer: 'Sekretariat PSU (DP2CKTR)',
  },
  {
    id: 'doc-2',
    code: 2,
    label: 'Legalitas Perusahaan (Akta, NIB, NPWP)',
    legalBasis: 'Permendagri 15/2026 Pasal 11 ayat (1) huruf b',
    opdReviewer: 'DPMPTSP & Bagian Hukum',
  },
  {
    id: 'doc-3',
    code: 3,
    label: 'Bukti Penguasaan & Pelepasan Hak / Pemecahan Sertifikat Bidang PSU (HGB/HM Induk)',
    legalBasis: 'Permendagri 15/2026 Pasal 11 ayat (1) huruf c',
    opdReviewer: 'Tim Pertanahan DP2CKTR & BPN Sidoarjo',
  },
  {
    id: 'doc-4',
    code: 4,
    label: 'Rencana Tapak (Siteplan) yang Disahkan',
    legalBasis: 'Permendagri 15/2026 Pasal 11 ayat (1) huruf d',
    opdReviewer: 'Bidang Tata Ruang (DP2CKTR)',
  },
  {
    id: 'doc-5',
    code: 5,
    label: 'Persetujuan Bangunan Gedung (PBG) / SLF',
    legalBasis: 'Permendagri 15/2026 Pasal 11 ayat (1) huruf e',
    opdReviewer: 'DPMPTSP & Bidang Bangunan Gedung',
  },
  {
    id: 'doc-6',
    code: 6,
    label: 'Dokumen Persetujuan Lingkungan (AMDAL / UKL-UPL / SPPL)',
    legalBasis: 'Permendagri 15/2026 Pasal 11 ayat (1) huruf f',
    opdReviewer: 'Dinas Lingkungan Hidup & Kebersihan (DLHK)',
  },
];

export const ABANDONED_STAGES: AbandonedStage[] = [
  'Laporan Kecamatan/Warga',
  'Pengumuman Media',
  'Berita Acara Pembuktian Kelalaian',
  'Penetapan SK Bupati',
  'Pencatatan Aset BMD',
];

export const OPD_PENGELOLA_OPTIONS = [
  'Dinas PUBMSDA (Pekerjaan Umum Bina Marga & SDA)',
  'Dinas Perumahan, Permukiman, Cipta Karya & Tata Ruang (DP2CKTR)',
  'Dinas Lingkungan Hidup dan Kebersihan (DLHK)',
  'Dinas Perhubungan (Dishub)',
  'BPKAD Kabupaten Sidoarjo (Pengelola BMD)',
];

export const ROLE_META: Record<
  UserRole,
  { label: string; shortLabel: string; unit: string; description: string }
> = {
  ADMIN_DP2CKTR: {
    label: 'Super Admin / Sekretariat PSU (DP2CKTR)',
    shortLabel: 'Admin DP2CKTR',
    unit: 'Sekretariat Tim Verifikasi PSU',
    description:
      'Akses penuh konfigurasi sistem, baseline perumahan, verifikasi berkas, penerbitan BA Administrasi, BAPL, BAST Akhir, dan Jalur Khusus PSU Terlantar.',
  },
  TIM_ADMIN: {
    label: 'Tim Verifikasi Administrasi (Lintas OPD)',
    shortLabel: 'Tim Admin OPD',
    unit: 'DP2CKTR · DPMPTSP · Bagian Hukum',
    description:
      'Review berkas legalitas perusahaan, sertifikat pelepasan hak tanah PSU, siteplan, PBG/SLF, serta pemberian catatan revisi dan paraf tahap administrasi.',
  },
  TIM_LAPANGAN: {
    label: 'Tim Verifikasi Teknis Lapangan (OPD Teknis)',
    shortLabel: 'Tim Lapangan',
    unit: 'PUBMSDA · DLHK · Dishub · DP2CKTR',
    description:
      'Input hasil ukur fisik lapangan, geotagging GPS, foto dokumentasi, temuan defect list, dan verifikasi penyelesaian perbaikan.',
  },
  VERIFIKATOR_BPKAD: {
    label: 'Verifikator Aset (BPKAD)',
    shortLabel: 'Verifikator BPKAD',
    unit: 'Bidang Pengelolaan BMD',
    description:
      'Registrasi Kode Barang BMD, jenis KIB (A/C/D), nomor register aset, hak pakai Pemkab, penetapan OPD pengelola teknis, dan ekspor KIB.',
  },
  ADMIN_KECAMATAN: {
    label: 'Verifikator Wilayah (Kecamatan / Desa)',
    shortLabel: 'Admin Kecamatan',
    unit: 'Pemerintah Kecamatan Kab. Sidoarjo',
    description:
      'Pemantauan status PSU perumahan di wilayahnya dan pelaporan awal perumahan terlantar / pengembang pailit ke jalur khusus Pemda.',
  },
  PENGEMBANG: {
    label: 'Pengembang (Developer)',
    shortLabel: 'Pengembang',
    unit: 'Badan Usaha Pengembang (Terisolasi)',
    description:
      'Pengajuan permohonan PSU, unggah/revisi berkas administrasi, dan unggah bukti perbaikan defect list khusus untuk proyek perumahannya sendiri.',
  },
  PIMPINAN_DAERAH: {
    label: 'Pimpinan Daerah (Bupati / Sekda / Kadis)',
    shortLabel: 'Bupati / Sekda',
    unit: 'Pemerintah Kabupaten Sidoarjo',
    description:
      'Akses baca eksekutif ke Dashboard 18 Kecamatan, WebGIS, Analytics & Smart Recommendation, Management Brief, dan Audit Log.',
  },
};
