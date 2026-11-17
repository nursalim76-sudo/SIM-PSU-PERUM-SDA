import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AbandonedStage,
  AuditLogEntry,
  BmdAssetRecord,
  DEFAULT_SYSTEM_CONFIG,
  DefectItem,
  DocStatus,
  HousingProject,
  MenuId,
  ProjectStatus,
  ROLE_META,
  SurveyLog,
  SystemConfig,
  UserRole,
} from './types/psu';
import { INITIAL_PROJECTS } from './data/initialData';
import { assertPermission, canPerformAction, DomainAction } from './services/rbacPolicy';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { AuditTrailModal } from './components/AuditTrailModal';
import { DashboardView } from './views/DashboardView';
import { PerumahanView } from './views/PerumahanView';
import { VerifikasiAdminView } from './views/VerifikasiAdminView';
import { SurveiFisikView } from './views/SurveiFisikView';
import { BastBmdView } from './views/BastBmdView';
import { WebGisView } from './views/WebGisView';
import { PsuTerlantarView } from './views/PsuTerlantarView';
import { AnalyticsView } from './views/AnalyticsView';
import { LaporanBriefView } from './views/LaporanBriefView';
import { PengaturanView } from './views/PengaturanView';
import { getActiveStage, getMeasurementRatio } from './utils/formatters';

const STORAGE_KEY = 'sim_psu_sidoarjo_projects_v1';
const ROLE_STORAGE_KEY = 'sim_psu_sidoarjo_role_v1';
const AUDIT_STORAGE_KEY = 'sim_psu_sidoarjo_audit_v1';
const CONFIG_STORAGE_KEY = 'sim_psu_sidoarjo_config_v1';

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud-01',
    timestamp: '2026-02-18 14:20 WIB',
    actorRole: 'VERIFIKATOR_BPKAD',
    actorLabel: ROLE_META.VERIFIKATOR_BPKAD.shortLabel,
    actorUnit: ROLE_META.VERIFIKATOR_BPKAD.unit,
    action: 'RECORD_BMD_ASSET',
    projectId: 'prj-01',
    projectName: 'Kahuripan Nirwana Village',
    detail: 'Registrasi KIB A & KIB D (No. Register REG-3515-2026-0041/0042) pasca BAST Akhir.',
  },
  {
    id: 'aud-02',
    timestamp: '2026-10-14 11:25 WIB',
    actorRole: 'TIM_LAPANGAN',
    actorLabel: ROLE_META.TIM_LAPANGAN.shortLabel,
    actorUnit: ROLE_META.TIM_LAPANGAN.unit,
    action: 'ADD_DEFECT',
    projectId: 'prj-05',
    projectName: 'Griya Bhayangkara Permai',
    detail: 'Pencatatan 2 defect (drainase Blok B & 3 titik PJU); penerbitan BAPL/BAST otomatis terkunci.',
  },
  {
    id: 'aud-03',
    timestamp: '2026-10-30 10:05 WIB',
    actorRole: 'ADMIN_DP2CKTR',
    actorLabel: ROLE_META.ADMIN_DP2CKTR.shortLabel,
    actorUnit: ROLE_META.ADMIN_DP2CKTR.unit,
    action: 'MANAGE_ABANDONED_TRACK',
    projectId: 'prj-10',
    projectName: 'Graha Asri Sedati (Eks PT Graha Pailit)',
    detail: 'Penetapan Berita Acara Pembuktian Kelalaian (600.2/166/BA-LALAI/438.5.4/2026).',
  },
  {
    id: 'aud-04',
    timestamp: '2026-11-12 15:40 WIB',
    actorRole: 'PENGEMBANG',
    actorLabel: ROLE_META.PENGEMBANG.shortLabel,
    actorUnit: ROLE_META.PENGEMBANG.unit,
    action: 'SUBMIT_DEFECT_REPAIR',
    projectId: 'prj-06',
    projectName: 'Alam Mutiara Regency',
    detail: 'Unggah bukti perbaikan penataan zona RTH Blok C; menunggu verifikasi tim lapangan.',
  },
];

function computeOverallProjectStatus(project: HousingProject): ProjectStatus {
  if (project.abandonedInfo && project.status === 'TERLANTAR_PAILIT') {
    if (project.abandonedInfo.currentStage === 'Pencatatan Aset BMD') {
      return 'BAST_SELESAI_BMD';
    }
    return 'TERLANTAR_PAILIT';
  }
  const activeStage = getActiveStage(project);
  return activeStage.status;
}

export default function App() {
  const [projects, setProjects] = useState<HousingProject[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return INITIAL_PROJECTS;
  });

  const [role, setRole] = useState<UserRole>(() => {
    try {
      const saved = localStorage.getItem(ROLE_STORAGE_KEY) as UserRole | null;
      if (saved && ROLE_META[saved]) return saved;
    } catch {
      // ignore
    }
    return 'ADMIN_DP2CKTR';
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_AUDIT_LOGS;
  });

  const [config, setConfig] = useState<SystemConfig>(() => {
    try {
      const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (raw) {
        return { ...DEFAULT_SYSTEM_CONFIG, ...JSON.parse(raw) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_SYSTEM_CONFIG;
  });

  const [activeDeveloperName, setActiveDeveloperName] = useState<string>('ALL');
  const [activeMenu, setActiveMenu] = useState<MenuId>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(INITIAL_PROJECTS[0].id);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch {
      // ignore quota errors
    }
  }, [projects]);

  useEffect(() => {
    try {
      localStorage.setItem(ROLE_STORAGE_KEY, role);
    } catch {
      // ignore
    }
  }, [role]);

  useEffect(() => {
    try {
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(auditLogs));
    } catch {
      // ignore
    }
  }, [auditLogs]);

  useEffect(() => {
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    } catch {
      // ignore
    }
  }, [config]);

  const visibleProjects = useMemo(() => {
    if (role === 'PENGEMBANG' && activeDeveloperName !== 'ALL') {
      const owned = projects.filter((p) => p.pengembang === activeDeveloperName);
      return owned.length > 0 ? owned : projects;
    }
    return projects;
  }, [projects, role, activeDeveloperName]);

  const effectiveSelectedProjectId = useMemo(() => {
    if (visibleProjects.some((p) => p.id === selectedProjectId)) {
      return selectedProjectId;
    }
    return visibleProjects[0]?.id || projects[0].id;
  }, [visibleProjects, selectedProjectId, projects]);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 3200);
  };

  const appendAudit = (
    action: string,
    detail: string,
    project?: { id: string; name: string }
  ) => {
    const nowTime = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const entry: AuditLogEntry = {
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: `2026-11-16 ${nowTime} WIB`,
      actorRole: role,
      actorLabel: ROLE_META[role].shortLabel,
      actorUnit: ROLE_META[role].unit,
      action,
      projectId: project?.id,
      projectName: project?.name,
      detail,
    };
    setAuditLogs((prev) => [entry, ...prev]);
  };

  const guardAction = (action: DomainAction): boolean => {
    const err = assertPermission(role, action);
    if (err) {
      showToast(err);
      return false;
    }
    return true;
  };

  const handleResetDemoData = () => {
    setProjects(INITIAL_PROJECTS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setConfig(DEFAULT_SYSTEM_CONFIG);
    setActiveDeveloperName('ALL');
    setSelectedProjectId(INITIAL_PROJECTS[0].id);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(AUDIT_STORAGE_KEY);
      localStorage.removeItem(CONFIG_STORAGE_KEY);
      Object.keys(localStorage)
        .filter((k) => k.startsWith('sim_psu_draft_'))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore
    }
    showToast('Data simulasi SIM-PSU Sidoarjo berhasil dikembalikan ke kondisi awal.');
  };

  const handleSelectProjectModule = (projectId: string, menu: MenuId) => {
    setSelectedProjectId(projectId);
    setActiveMenu(menu);
  };

  const handleAddProject = (project: HousingProject) => {
    if (!guardAction('CREATE_SITEPLAN')) return;
    setProjects((prev) => [project, ...prev]);
    setSelectedProjectId(project.id);
    appendAudit(
      'CREATE_SITEPLAN',
      `Registrasi baseline siteplan (${project.nomorSiteplan}), skema ${project.skemaPenyerahan}.`,
      { id: project.id, name: project.namaPerumahan }
    );
    showToast(`Proyek ${project.namaPerumahan} berhasil ditambahkan ke baseline siteplan.`);
  };

  const handleChangeStage = (projectId: string, stageIndex: number) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const updated = { ...p, activeStageIndex: stageIndex };
        return { ...updated, status: computeOverallProjectStatus(updated) };
      })
    );
  };

  const handleUpdateDocStatus = (
    projectId: string,
    stageIndex: number,
    docId: string,
    status: DocStatus,
    revisionNote?: string,
    fileName?: string
  ) => {
    const actionNeeded: DomainAction =
      status === 'Menunggu Verifikasi' ? 'UPLOAD_ADMIN_DOC' : 'VERIFY_ADMIN_DOC';
    if (!guardAction(actionNeeded)) return;

    const targetProj = projects.find((p) => p.id === projectId);
    const targetStage = targetProj?.stages[stageIndex];
    if (targetStage?.baAdminNumber) {
      showToast('Dokumen administrasi terkunci karena BA Penyerahan Administrasi sudah diterbitkan.');
      return;
    }
    const targetDoc = targetStage?.adminDocs.find((d) => d.id === docId);

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const nextStages = p.stages.map((st, idx) => {
          if (idx !== stageIndex) return st;
          const nextDocs = st.adminDocs.map((doc) => {
            if (doc.id !== docId) return doc;
            return {
              ...doc,
              status,
              revisionNote: status === 'Perlu Revisi' ? revisionNote : undefined,
              fileName: fileName || doc.fileName || `dokumen_${doc.id}.pdf`,
              uploadedAt: fileName ? '2026-11-16' : doc.uploadedAt || '2026-11-16',
              verifiedBy: status === 'Valid' ? ROLE_META[role].shortLabel : undefined,
            };
          });
          const nextStageStatus: ProjectStatus = st.bastNumber
            ? 'BAST_SELESAI_BMD'
            : st.baAdminNumber
              ? st.defects.some((d) => d.status !== 'Closed')
                ? 'PERBAIKAN_DEFECT'
                : 'BA_ADMIN_PEMELIHARAAN'
              : 'PROSES_ADMIN';
          return { ...st, adminDocs: nextDocs, status: nextStageStatus };
        });
        const updated = { ...p, stages: nextStages };
        const hasOpenDefects = nextStages.some((st) => st.defects.some((d) => d.status !== 'Closed'));
        return {
          ...updated,
          status: computeOverallProjectStatus(updated),
          ewsFlag: hasOpenDefects || status === 'Perlu Revisi',
        };
      })
    );

    if (targetProj) {
      appendAudit(
        actionNeeded,
        `Dokumen "${targetDoc?.label || docId}" diubah statusnya menjadi ${status}${
          revisionNote ? ` (Catatan: ${revisionNote})` : ''
        }.`,
        { id: targetProj.id, name: targetProj.namaPerumahan }
      );
    }
    showToast(`Status dokumen administrasi diperbarui menjadi "${status}".`);
  };

  const handleIssueBaAdmin = (
    projectId: string,
    stageIndex: number,
    baNumber: string,
    baDate: string
  ) => {
    if (!guardAction('ISSUE_BA_ADMIN')) return;

    const targetProj = projects.find((p) => p.id === projectId);
    const targetStage = targetProj?.stages[stageIndex];
    if (!targetStage || !targetStage.adminDocs.every((d) => d.status === 'Valid')) {
      showToast('Gagal menerbitkan BA Administrasi: seluruh 6 dokumen wajib berstatus Valid.');
      return;
    }

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const nextStages = p.stages.map((st, idx) => {
          if (idx !== stageIndex) return st;
          return {
            ...st,
            baAdminNumber: baNumber,
            baAdminDate: baDate,
            maintenanceStartDate: st.maintenanceStartDate || baDate,
            status: st.defects.some((d) => d.status !== 'Closed')
              ? ('PERBAIKAN_DEFECT' as ProjectStatus)
              : ('BA_ADMIN_PEMELIHARAAN' as ProjectStatus),
          };
        });
        const updated = { ...p, stages: nextStages };
        return { ...updated, status: computeOverallProjectStatus(updated) };
      })
    );

    if (targetProj) {
      appendAudit(
        'ISSUE_BA_ADMIN',
        `Penerbitan BA Penyerahan Administrasi No. ${baNumber} untuk ${targetStage.stageName}.`,
        { id: targetProj.id, name: targetProj.namaPerumahan }
      );
    }
    showToast(`BA Penyerahan Administrasi ${baNumber} resmi diterbitkan.`);
  };

  const handleUpdateMeasurement = (
    projectId: string,
    stageIndex: number,
    itemId: string,
    actualVolume: number
  ) => {
    if (!guardAction('UPDATE_MEASUREMENT')) return;
    const safeVolume = Number.isFinite(actualVolume) ? Math.max(0, actualVolume) : 0;
    const targetProj = projects.find((p) => p.id === projectId);
    if (targetProj?.stages[stageIndex]?.bastNumber) {
      showToast('Data ukur fisik terkunci karena BAST Akhir telah diterbitkan.');
      return;
    }
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const nextStages = p.stages.map((st, idx) => {
          if (idx !== stageIndex) return st;
          const nextChecklist = st.physicalChecklist.map((item) => {
            if (item.id !== itemId) return item;
            const ratioPct = getMeasurementRatio(item.siteplanVolume, safeVolume);
            return {
              ...item,
              actualVolume: safeVolume,
              condition:
                safeVolume === 0
                  ? ('Belum Diperiksa' as const)
                  : ratioPct < config.minPhysicalRatioPct
                    ? ('Perlu Perbaikan' as const)
                    : ('Baik' as const),
            };
          });
          return { ...st, physicalChecklist: nextChecklist };
        });
        return { ...p, stages: nextStages };
      })
    );
  };

  const handleAddSurveyLog = (projectId: string, stageIndex: number, log: SurveyLog) => {
    if (!guardAction('ADD_SURVEY_LOG')) return;
    const targetProj = projects.find((p) => p.id === projectId);
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const nextStages = p.stages.map((st, idx) =>
          idx === stageIndex ? { ...st, surveyLogs: [log, ...st.surveyLogs] } : st
        );
        return { ...p, stages: nextStages };
      })
    );
    if (targetProj) {
      appendAudit(
        'ADD_SURVEY_LOG',
        `Geotagging GPS (${log.latitude.toFixed(5)}, ${log.longitude.toFixed(5)}): ${log.caption}`,
        { id: targetProj.id, name: targetProj.namaPerumahan }
      );
    }
    showToast('Log geotagging GPS & foto dokumentasi berhasil disimpan.');
  };

  const handleAddDefect = (projectId: string, stageIndex: number, defect: DefectItem) => {
    if (!guardAction('ADD_DEFECT')) return;
    const targetProj = projects.find((p) => p.id === projectId);
    if (targetProj?.stages[stageIndex]?.bastNumber) {
      showToast('Tidak dapat menambah defect karena BAST Akhir sudah diterbitkan.');
      return;
    }
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const nextStages = p.stages.map((st, idx) => {
          if (idx !== stageIndex) return st;
          return {
            ...st,
            defects: [defect, ...st.defects],
            status: 'PERBAIKAN_DEFECT' as ProjectStatus,
          };
        });
        const updated = { ...p, stages: nextStages, ewsFlag: true };
        return { ...updated, status: computeOverallProjectStatus(updated) };
      })
    );
    if (targetProj) {
      appendAudit(
        'ADD_DEFECT',
        `Temuan ${defect.severity} (${defect.category}) di ${defect.location}: ${defect.description}`,
        { id: targetProj.id, name: targetProj.namaPerumahan }
      );
    }
    showToast('Temuan defect dicatat — penerbitan BAPL & BAST Akhir otomatis dikunci.');
  };

  const handleSubmitDefectRepair = (
    projectId: string,
    stageIndex: number,
    defectId: string,
    repairNote: string,
    repairPhoto: string
  ) => {
    if (!guardAction('SUBMIT_DEFECT_REPAIR')) return;
    const targetProj = projects.find((p) => p.id === projectId);
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const nextStages = p.stages.map((st, idx) => {
          if (idx !== stageIndex) return st;
          const nextDefects = st.defects.map((d) =>
            d.id === defectId
              ? {
                  ...d,
                  status: 'Menunggu Verifikasi' as const,
                  repairProofNote: repairNote,
                  repairProofPhoto: repairPhoto,
                  repairSubmittedAt: '2026-11-16',
                }
              : d
          );
          return { ...st, defects: nextDefects };
        });
        return { ...p, stages: nextStages };
      })
    );
    if (targetProj) {
      appendAudit(
        'SUBMIT_DEFECT_REPAIR',
        `Unggah bukti perbaikan defect ${defectId}: ${repairNote}`,
        { id: targetProj.id, name: targetProj.namaPerumahan }
      );
    }
    showToast('Bukti perbaikan pengembang diunggah, menunggu verifikasi tim lapangan.');
  };

  const handleCloseDefect = (projectId: string, stageIndex: number, defectId: string) => {
    if (!guardAction('CLOSE_DEFECT')) return;
    const targetProj = projects.find((p) => p.id === projectId);
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const nextStages = p.stages.map((st, idx) => {
          if (idx !== stageIndex) return st;
          const nextDefects = st.defects.map((d) =>
            d.id === defectId
              ? { ...d, status: 'Closed' as const, closedAt: '2026-11-16' }
              : d
          );
          const stillHasOpen = nextDefects.some((d) => d.status !== 'Closed');
          const nextStageStatus: ProjectStatus = stillHasOpen
            ? 'PERBAIKAN_DEFECT'
            : st.bastNumber
              ? 'BAST_SELESAI_BMD'
              : 'BA_ADMIN_PEMELIHARAAN';
          return { ...st, defects: nextDefects, status: nextStageStatus };
        });
        const updated = {
          ...p,
          stages: nextStages,
          ewsFlag: nextStages[stageIndex].defects.some((d) => d.status !== 'Closed'),
        };
        return { ...updated, status: computeOverallProjectStatus(updated) };
      })
    );
    if (targetProj) {
      appendAudit(
        'CLOSE_DEFECT',
        `Verifikasi perbaikan selesai & penutupan defect ${defectId}.`,
        { id: targetProj.id, name: targetProj.namaPerumahan }
      );
    }
    showToast('Defect diverifikasi selesai. Cek status pembukaan kunci BAPL & BAST Akhir.');
  };

  const handleIssueBapl = (
    projectId: string,
    stageIndex: number,
    baplNumber: string,
    baplDate: string
  ) => {
    if (!guardAction('ISSUE_BAPL')) return;

    const targetProj = projects.find((p) => p.id === projectId);
    const targetStage = targetProj?.stages[stageIndex];
    if (!targetProj || !targetStage) return;

    const openDefects = targetStage.defects.filter((d) => d.status !== 'Closed');
    if (openDefects.length > 0) {
      showToast(
        `Defect Lock Rule aktif: terdapat ${openDefects.length} defect belum Closed sehingga BAPL ditolak.`
      );
      return;
    }
    const lowItems = targetStage.physicalChecklist.filter(
      (i) => i.actualVolume > 0 && getMeasurementRatio(i.siteplanVolume, i.actualVolume) < config.minPhysicalRatioPct
    );
    if (lowItems.length > 0) {
      showToast(
        `Anomali Luas (<${config.minPhysicalRatioPct}%): ${lowItems.length} komponen PSU belum memenuhi rasio siteplan.`
      );
      return;
    }
    if (!targetStage.baAdminNumber && !targetProj.abandonedInfo) {
      showToast('BAPL ditolak: BA Penyerahan Administrasi harus terbit terlebih dahulu.');
      return;
    }

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const nextStages = p.stages.map((st, idx) =>
          idx === stageIndex ? { ...st, baplNumber, baplDate } : st
        );
        return { ...p, stages: nextStages };
      })
    );
    appendAudit('ISSUE_BAPL', `Penerbitan BAPL No. ${baplNumber} pada ${targetStage.stageName}.`, {
      id: targetProj.id,
      name: targetProj.namaPerumahan,
    });
    showToast(`BAPL ${baplNumber} berhasil diterbitkan.`);
  };

  const handleIssueBast = (
    projectId: string,
    stageIndex: number,
    bastNumber: string,
    bastDate: string
  ) => {
    if (!guardAction('ISSUE_BAST_AKHIR')) return;

    const targetProj = projects.find((p) => p.id === projectId);
    const targetStage = targetProj?.stages[stageIndex];
    if (!targetProj || !targetStage) return;

    const openDefects = targetStage.defects.filter((d) => d.status !== 'Closed');
    const lowItems = targetStage.physicalChecklist.filter(
      (i) => i.actualVolume > 0 && getMeasurementRatio(i.siteplanVolume, i.actualVolume) < config.minPhysicalRatioPct
    );
    if (openDefects.length > 0 || lowItems.length > 0 || !targetStage.baplNumber) {
      showToast(
        'BAST Akhir ditolak: pastikan BAPL sudah terbit, 0 defect Open, dan rasio fisik memenuhi ambang batas.'
      );
      return;
    }

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const nextStages = p.stages.map((st, idx) =>
          idx === stageIndex
            ? {
                ...st,
                bastNumber,
                bastDate,
                status: 'BAST_SELESAI_BMD' as ProjectStatus,
              }
            : st
        );
        const updated = { ...p, stages: nextStages, ewsFlag: false };
        return { ...updated, status: computeOverallProjectStatus(updated) };
      })
    );
    appendAudit(
      'ISSUE_BAST_AKHIR',
      `Penerbitan BAST Akhir No. ${bastNumber} untuk ${targetStage.stageName}.`,
      { id: targetProj.id, name: targetProj.namaPerumahan }
    );
    showToast(`BAST Akhir ${bastNumber} resmi diterbitkan. Siap dicatat oleh BPKAD.`);
  };

  const handleAddBmdAsset = (
    projectId: string,
    stageIndex: number,
    record: BmdAssetRecord
  ) => {
    if (!guardAction('RECORD_BMD_ASSET')) return;
    const targetProj = projects.find((p) => p.id === projectId);
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const nextStages = p.stages.map((st, idx) =>
          idx === stageIndex
            ? {
                ...st,
                bmdAssets: [...st.bmdAssets, record],
                status: st.bastNumber ? ('BAST_SELESAI_BMD' as ProjectStatus) : st.status,
              }
            : st
        );
        const updated = { ...p, stages: nextStages };
        return { ...updated, status: computeOverallProjectStatus(updated) };
      })
    );
    if (targetProj) {
      appendAudit(
        'RECORD_BMD_ASSET',
        `Pencatatan ${record.jenisKib} kode ${record.kodeBarangBmd} (${record.nomorRegister}) — ${record.opdPengelolaTeknis}.`,
        { id: targetProj.id, name: targetProj.namaPerumahan }
      );
    }
    showToast(`Aset ${record.jenisKib} (${record.kodeBarangBmd}) tercatat pada BPKAD.`);
  };

  const handleAdvanceAbandonedStage = (
    projectId: string,
    nextStage: AbandonedStage,
    notes: string,
    skNumber?: string
  ) => {
    if (!guardAction('MANAGE_ABANDONED_TRACK')) return;
    const targetProj = projects.find((p) => p.id === projectId);
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId || !p.abandonedInfo) return p;
        const updatedAbandoned = {
          ...p.abandonedInfo,
          currentStage: nextStage,
          lastUpdated: '2026-11-16',
          notes,
          mediaAnnouncementDate:
            nextStage === 'Pengumuman Media'
              ? '2026-11-16'
              : p.abandonedInfo.mediaAnnouncementDate,
          baKelalaianNumber:
            nextStage === 'Berita Acara Pembuktian Kelalaian'
              ? '600.2/192/BA-LALAI/438.5.4/2026'
              : p.abandonedInfo.baKelalaianNumber,
          skBupatiNumber:
            nextStage === 'Penetapan SK Bupati'
              ? skNumber || '188/418/438.1.1.3/2026'
              : p.abandonedInfo.skBupatiNumber,
          skBupatiDate:
            nextStage === 'Penetapan SK Bupati' ? '2026-11-16' : p.abandonedInfo.skBupatiDate,
        };
        const nextStatus: ProjectStatus =
          nextStage === 'Pencatatan Aset BMD' ? 'BAST_SELESAI_BMD' : 'TERLANTAR_PAILIT';
        return {
          ...p,
          abandonedInfo: updatedAbandoned,
          status: nextStatus,
          ewsFlag: nextStage !== 'Pencatatan Aset BMD',
          stages: p.stages.map((st, idx) =>
            idx === 0
              ? {
                  ...st,
                  status: nextStatus,
                  bastNumber:
                    nextStage === 'Pencatatan Aset BMD'
                      ? st.bastNumber || updatedAbandoned.skBupatiNumber || '188/418/438.1.1.3/2026'
                      : st.bastNumber,
                  bastDate: nextStage === 'Pencatatan Aset BMD' ? st.bastDate || '2026-11-16' : st.bastDate,
                }
              : st
          ),
        };
      })
    );
    if (targetProj) {
      appendAudit(
        'MANAGE_ABANDONED_TRACK',
        `Jalur khusus diperbarui ke tahap "${nextStage}". ${notes}`,
        { id: targetProj.id, name: targetProj.namaPerumahan }
      );
    }
    showToast(`Jalur khusus diperbarui ke tahap: ${nextStage}.`);
  };

  const handleAddAbandonedProject = (project: HousingProject) => {
    if (!guardAction('REPORT_ABANDONED_PSU')) return;
    setProjects((prev) => [project, ...prev]);
    appendAudit(
      'REPORT_ABANDONED_PSU',
      `Pelaporan kasus baru PSU terlantar di Kec. ${project.kecamatan}.`,
      { id: project.id, name: project.namaPerumahan }
    );
    showToast(`Kasus PSU terlantar ${project.namaPerumahan} ditambahkan.`);
  };

  const handleUpdateConfig = (nextCfg: SystemConfig) => {
    if (!guardAction('CONFIGURE_SYSTEM')) return;
    setConfig(nextCfg);
    appendAudit(
      'CONFIGURE_SYSTEM',
      `Pembaruan parameter SLA: Rasio min ${nextCfg.minPhysicalRatioPct}%, Pemeliharaan ${nextCfg.defaultMaintenanceDays} hari, Batas BMD ${nextCfg.bmdBacklogMaxDays} hari.`
    );
    showToast('Parameter SLA & Early Warning System berhasil disimpan.');
  };

  const ewsCount = projects.filter(
    (p) =>
      p.ewsFlag ||
      p.status === 'BELUM_AJUKAN' ||
      p.status === 'TERLANTAR_PAILIT' ||
      getActiveStage(p).defects.some((d) => d.status === 'Open')
  ).length;

  const abandonedCount = projects.filter((p) => p.status === 'TERLANTAR_PAILIT').length;

  return (
    <div id="app-shell-wrapper" className="min-h-screen flex bg-slate-50 text-slate-900">
      <Sidebar
        activeMenu={activeMenu}
        onSelectMenu={setActiveMenu}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        ewsCount={ewsCount}
        abandonedCount={abandonedCount}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          activeMenu={activeMenu}
          role={role}
          onChangeRole={(r) => {
            setRole(r);
            showToast(`Simulasi peran beralih ke: ${ROLE_META[r].label}`);
          }}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onResetDemoData={handleResetDemoData}
          onOpenAuditTrail={() => {
            if (canPerformAction(role, 'VIEW_AUDIT_TRAIL')) {
              setAuditModalOpen(true);
            }
          }}
          auditCount={auditLogs.length}
        />

        <main className="flex-1 p-4 md:p-6 max-w-[1440px] w-full mx-auto">
          {role === 'PENGEMBANG' && activeDeveloperName !== 'ALL' && (
            <div className="no-print mb-4 px-4 py-2.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center justify-between gap-3">
              <span>
                <strong>Isolasi Akun Pengembang Aktif:</strong> Menampilkan data proyek milik{' '}
                <strong>{activeDeveloperName}</strong>.
              </span>
              <button
                type="button"
                onClick={() => setActiveMenu('pengaturan')}
                className="font-semibold underline cursor-pointer shrink-0"
              >
                Ubah di Pengaturan
              </button>
            </div>
          )}

          {activeMenu === 'dashboard' && (
            <DashboardView
              projects={visibleProjects}
              role={role}
              onSelectProjectModule={handleSelectProjectModule}
            />
          )}

          {activeMenu === 'perumahan' && (
            <PerumahanView
              projects={visibleProjects}
              role={role}
              onAddProject={handleAddProject}
              onChangeStage={handleChangeStage}
              onSelectProjectModule={handleSelectProjectModule}
              defaultMaintenanceDays={config.defaultMaintenanceDays}
            />
          )}

          {activeMenu === 'verifikasi-admin' && (
            <VerifikasiAdminView
              projects={visibleProjects}
              selectedProjectId={effectiveSelectedProjectId}
              onSelectProject={setSelectedProjectId}
              onChangeStage={handleChangeStage}
              role={role}
              onUpdateDocStatus={handleUpdateDocStatus}
              onIssueBaAdmin={handleIssueBaAdmin}
            />
          )}

          {activeMenu === 'survei-fisik' && (
            <SurveiFisikView
              projects={visibleProjects}
              selectedProjectId={effectiveSelectedProjectId}
              onSelectProject={setSelectedProjectId}
              onChangeStage={handleChangeStage}
              role={role}
              onUpdateMeasurement={handleUpdateMeasurement}
              onAddSurveyLog={handleAddSurveyLog}
              onAddDefect={handleAddDefect}
              onSubmitDefectRepair={handleSubmitDefectRepair}
              onCloseDefect={handleCloseDefect}
              onNavigateModule={setActiveMenu}
              minPhysicalRatioPct={config.minPhysicalRatioPct}
              maintenanceAlertDays={config.maintenanceAlertDays}
            />
          )}

          {activeMenu === 'bast-bmd' && (
            <BastBmdView
              projects={visibleProjects}
              selectedProjectId={effectiveSelectedProjectId}
              onSelectProject={setSelectedProjectId}
              onChangeStage={handleChangeStage}
              role={role}
              onIssueBapl={handleIssueBapl}
              onIssueBast={handleIssueBast}
              onAddBmdAsset={handleAddBmdAsset}
              minPhysicalRatioPct={config.minPhysicalRatioPct}
            />
          )}

          {activeMenu === 'webgis' && (
            <WebGisView
              projects={visibleProjects}
              onSelectProjectModule={handleSelectProjectModule}
            />
          )}

          {activeMenu === 'psu-terlantar' && (
            <PsuTerlantarView
              projects={projects}
              role={role}
              onAdvanceAbandonedStage={handleAdvanceAbandonedStage}
              onAddAbandonedProject={handleAddAbandonedProject}
            />
          )}

          {activeMenu === 'analytics' && (
            <AnalyticsView
              projects={projects}
              onNavigateModule={setActiveMenu}
              onSelectProjectModule={handleSelectProjectModule}
              minPhysicalRatioPct={config.minPhysicalRatioPct}
            />
          )}

          {activeMenu === 'laporan-brief' && <LaporanBriefView projects={projects} />}

          {activeMenu === 'pengaturan' && (
            <PengaturanView
              role={role}
              projects={projects}
              activeDeveloperName={activeDeveloperName}
              onChangeActiveDeveloper={(dev) => {
                setActiveDeveloperName(dev);
                showToast(
                  dev === 'ALL'
                    ? 'Isolasi pengembang menampilkan seluruh proyek simulasi.'
                    : `Isolasi data pengembang aktif untuk: ${dev}`
                );
              }}
              config={config}
              onUpdateConfig={handleUpdateConfig}
              auditLogs={auditLogs}
              onOpenAuditModal={() => setAuditModalOpen(true)}
            />
          )}
        </main>
      </div>

      <AuditTrailModal
        isOpen={auditModalOpen}
        logs={auditLogs}
        onClose={() => setAuditModalOpen(false)}
      />

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="no-print fixed bottom-5 right-5 z-50 max-w-sm bg-[#0F294A] text-white text-xs font-medium px-4 py-3 rounded-lg shadow-lg border border-white/10"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
