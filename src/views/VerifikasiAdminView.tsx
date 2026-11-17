import React, { useState } from 'react';
import {
  CheckCircle2,
  FileCheck2,
  FileText,
  Lock,
  Upload,
  XCircle,
  Eye,
} from 'lucide-react';
import { DocStatus, HousingProject, UserRole } from '../types/psu';
import {
  formatAreaM2,
  formatDateId,
  generateDocNumber,
  getActiveStage,
  getAdminProgress,
} from '../utils/formatters';
import { StatusLabel } from '../components/StatusLabel';
import { BeritaAcaraModal } from '../components/BeritaAcaraModal';

interface VerifikasiAdminViewProps {
  projects: HousingProject[];
  selectedProjectId: string;
  onSelectProject: (id: string) => void;
  onChangeStage: (projectId: string, stageIndex: number) => void;
  role: UserRole;
  onUpdateDocStatus: (
    projectId: string,
    stageIndex: number,
    docId: string,
    status: DocStatus,
    revisionNote?: string,
    fileName?: string
  ) => void;
  onIssueBaAdmin: (projectId: string, stageIndex: number, baNumber: string, baDate: string) => void;
}

export const VerifikasiAdminView: React.FC<VerifikasiAdminViewProps> = ({
  projects,
  selectedProjectId,
  onSelectProject,
  onChangeStage,
  role,
  onUpdateDocStatus,
  onIssueBaAdmin,
}) => {
  const project = projects.find((p) => p.id === selectedProjectId) || projects[0];
  const stage = getActiveStage(project);
  const projectIdx = projects.findIndex((p) => p.id === project.id);

  const [revisionInputs, setRevisionInputs] = useState<Record<string, string>>({});
  const [activeRevisionDocId, setActiveRevisionDocId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const canVerify = role === 'ADMIN_DP2CKTR' || role === 'TIM_ADMIN';
  const canUpload = role === 'PENGEMBANG' || role === 'ADMIN_DP2CKTR';

  const allValid = stage.adminDocs.every((d) => d.status === 'Valid');
  const adminPct = getAdminProgress(stage);

  const handleMarkValid = (docId: string) => {
    onUpdateDocStatus(project.id, project.activeStageIndex, docId, 'Valid', '');
    if (activeRevisionDocId === docId) setActiveRevisionDocId(null);
  };

  const handleSubmitRevision = (docId: string) => {
    const note =
      revisionInputs[docId]?.trim() ||
      'Dokumen belum memenuhi ketentuan teknis Permendagri No. 15 Tahun 2026. Mohon dilengkapi.';
    onUpdateDocStatus(project.id, project.activeStageIndex, docId, 'Perlu Revisi', note);
    setActiveRevisionDocId(null);
  };

  const handleDeveloperUpload = (docId: string, docCode: number) => {
    const fakeName = `berkas_pasal11_${docCode}_${project.id}.pdf`;
    onUpdateDocStatus(
      project.id,
      project.activeStageIndex,
      docId,
      'Menunggu Verifikasi',
      undefined,
      fakeName
    );
  };

  const handleGenerateBaAdmin = () => {
    if (!allValid || !canVerify) return;
    if (!stage.baAdminNumber) {
      const number = generateDocNumber('BA-ADM', projectIdx);
      const today = '2026-11-16';
      onIssueBaAdmin(project.id, project.activeStageIndex, number, today);
    }
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Selector & Context Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1">
            <label htmlFor="admin-project-select" className="block text-xs font-medium text-slate-500 mb-1">
              Pilih Proyek Perumahan
            </label>
            <select
              id="admin-project-select"
              value={project.id}
              onChange={(e) => onSelectProject(e.target.value)}
              className="w-full max-w-xl px-3 py-2 text-sm font-semibold text-slate-900 border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#0F294A]"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.namaPerumahan} — Kec. {p.kecamatan} ({p.pengembang})
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
                    className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer ${
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-slate-200 text-xs">
          <div>
            <p className="text-slate-500">Nomor Pengesahan Siteplan</p>
            <p className="font-mono font-semibold text-slate-900 mt-0.5">{project.nomorSiteplan}</p>
          </div>
          <div>
            <p className="text-slate-500">Tahapan Aktif & Luas PSU</p>
            <p className="font-semibold text-slate-900 mt-0.5">
              {stage.stageName} ({formatAreaM2(stage.luasPsuM2)})
            </p>
          </div>
          <div>
            <p className="text-slate-500">Kelengkapan Verifikasi (Pasal 11)</p>
            <p className="font-mono font-semibold text-[#0F294A] tabular-nums mt-0.5">
              {stage.adminDocs.filter((d) => d.status === 'Valid').length} / 6 Dokumen Valid ({adminPct}%)
            </p>
          </div>
          <div>
            <p className="text-slate-500">Nomor BA Administrasi</p>
            <p className="font-mono font-semibold text-[#2563EB] mt-0.5">
              {stage.baAdminNumber ? `${stage.baAdminNumber} (${formatDateId(stage.baAdminDate)})` : 'Belum Terbit'}
            </p>
          </div>
        </div>
      </div>

      {/* Role notice */}
      {!canVerify && (
        <div className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-700 flex items-center justify-between gap-3">
          <span>
            {role === 'PENGEMBANG'
              ? 'Mode Pengembang aktif: Anda dapat mengunggah berkas atau mengirim ulang perbaikan revisi dokumen.'
              : 'Mode Baca: Persetujuan validasi dokumen & penerbitan BA Penyerahan Administrasi hanya dapat dilakukan oleh Admin Sekretariat PSU (DP2CKTR).'}
          </span>
        </div>
      )}

      {/* Checklist 6 Dokumen Permendagri No. 15 Tahun 2026 */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Checklist Persyaratan Administrasi — Permendagri No. 15 Tahun 2026
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Seluruh 6 dokumen wajib berstatus Valid sebelum BA Penyerahan Administrasi dapat diterbitkan
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {stage.baAdminNumber ? (
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] rounded-lg hover:bg-blue-700 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                Pratinjau BA Administrasi
              </button>
            ) : (
              <button
                type="button"
                disabled={!allValid || !canVerify}
                onClick={handleGenerateBaAdmin}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0F294A] rounded-lg hover:bg-[#163a66] disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed whitespace-nowrap shrink-0 cursor-pointer"
              >
                {allValid ? <FileCheck2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                Generate BA Penyerahan Administrasi
              </button>
            )}
          </div>
        </div>

        <div className="divide-y divide-slate-200">
          {stage.adminDocs.map((doc) => {
            const statusColor =
              doc.status === 'Valid'
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                : doc.status === 'Perlu Revisi'
                  ? 'text-red-700 bg-red-50 border-red-200'
                  : doc.status === 'Menunggu Verifikasi'
                    ? 'text-amber-800 bg-amber-50 border-amber-200'
                    : 'text-slate-600 bg-slate-100 border-slate-200';

            return (
              <div key={doc.id} className="p-5 hover:bg-slate-50/50 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-[#0F294A]">
                        0{doc.code}.
                      </span>
                      <h4 className="text-sm font-semibold text-slate-900">{doc.label}</h4>
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded border ${statusColor}`}
                      >
                        {doc.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {doc.legalBasis}
                      {doc.opdReviewer && (
                        <>
                          {' · '}
                          <span className="font-medium text-slate-700">OPD Penelaah: {doc.opdReviewer}</span>
                        </>
                      )}
                    </p>

                    {doc.fileName && (
                      <p className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-mono mt-1">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        {doc.fileName} · Diunggah {formatDateId(doc.uploadedAt)}
                      </p>
                    )}

                    {doc.status === 'Perlu Revisi' && doc.revisionNote && (
                      <div className="mt-2 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-900">
                        <span className="font-semibold">Catatan Revisi Verifikator: </span>
                        {doc.revisionNote}
                      </div>
                    )}

                    {activeRevisionDocId === doc.id && (
                      <div className="mt-3 flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={revisionInputs[doc.id] || ''}
                          onChange={(e) =>
                            setRevisionInputs({ ...revisionInputs, [doc.id]: e.target.value })
                          }
                          placeholder="Tulis catatan kekurangan berkas untuk pengembang..."
                          className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSubmitRevision(doc.id)}
                            className="px-3 py-2 text-xs font-semibold text-white bg-[#DC2626] rounded-lg hover:bg-red-700 whitespace-nowrap cursor-pointer"
                          >
                            Simpan Revisi
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveRevisionDocId(null)}
                            className="px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {canUpload && doc.status !== 'Valid' && (
                      <button
                        type="button"
                        onClick={() => handleDeveloperUpload(doc.id, doc.code)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#0F294A] bg-white border border-slate-300 rounded-lg hover:bg-slate-50 whitespace-nowrap cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {doc.fileName ? 'Unggah Ulang Berkas' : 'Unggah Berkas'}
                      </button>
                    )}

                    {canVerify && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleMarkValid(doc.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer ${
                            doc.status === 'Valid'
                              ? 'bg-[#059669] text-white'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Valid
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveRevisionDocId(doc.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 whitespace-nowrap cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Perlu Revisi
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {stage.baAdminNumber && (
        <BeritaAcaraModal
          isOpen={modalOpen}
          docType="BA_ADMIN"
          project={project}
          stage={stage}
          docNumber={stage.baAdminNumber}
          docDate={stage.baAdminDate || '2026-11-16'}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
};
