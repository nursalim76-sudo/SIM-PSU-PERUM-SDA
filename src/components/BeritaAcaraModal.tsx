import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Printer, Download, X, ShieldCheck } from 'lucide-react';
import { HousingProject, HousingStage } from '../types/psu';
import { formatAreaM2, formatDateId, formatRupiah } from '../utils/formatters';
import { QrCodeSvg } from './QrCodeSvg';

export type DocPreviewType = 'BA_ADMIN' | 'BAPL' | 'BAST_AKHIR';

interface BeritaAcaraModalProps {
  isOpen: boolean;
  docType: DocPreviewType;
  project: HousingProject;
  stage: HousingStage;
  docNumber: string;
  docDate: string;
  onClose: () => void;
}

export const BeritaAcaraModal: React.FC<BeritaAcaraModalProps> = ({
  isOpen,
  docType,
  project,
  stage,
  docNumber,
  docDate,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add('modal-print-active');
    return () => {
      document.body.classList.remove('modal-print-active');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const titleMap: Record<DocPreviewType, string> = {
    BA_ADMIN: 'BERITA ACARA PENYERAHAN ADMINISTRASI PRASARANA, SARANA, DAN UTILITAS UMUM (PSU)',
    BAPL: 'BERITA ACARA PEMERIKSAAN LAPANGAN (BAPL) KELAYAKAN TEKNIS PSU',
    BAST_AKHIR: 'BERITA ACARA SERAH TERIMA (BAST) AKHIR PENYERAHAN PSU PERUMAHAN',
  };

  const handleDownloadHtml = () => {
    const content = document.getElementById('official-ba-printable')?.innerHTML;
    if (!content) return;
    const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"/><title>${docNumber}</title><style>body{font-family:Arial,sans-serif;padding:32px;color:#0f172a;line-height:1.5}table{width:100%;border-collapse:collapse;margin:16px 0}th,td{border:1px solid #cbd5e1;padding:8px;font-size:12px;text-align:left}th{background:#f1f5f9}</style></head><body>${content}</body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docType}_${project.namaPerumahan.replace(/\s+/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return createPortal(
    <div
      className="ba-print-overlay fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Pratinjau Dokumen Resmi"
    >
      <div className="ba-print-dialog bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="no-print flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5 min-w-0">
            <ShieldCheck className="w-5 h-5 text-[#0D6E5B] shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">
                Pratinjau Dokumen Resmi — {docNumber}
              </p>
              <p className="text-xs text-slate-500">
                Mengacu Permendagri Nomor 15 Tahun 2026
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownloadHtml}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Unduh Dokumen
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[#0F294A] rounded-lg hover:bg-[#163a66] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak / PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup pratinjau"
              className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-200/60 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-6 md:p-10 bg-white" id="official-ba-printable">
          {/* Kop Surat Pemerintah Kabupaten Sidoarjo */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6 text-center">
            <p className="text-xs font-semibold tracking-wider text-slate-700 uppercase">
              PEMERINTAH KABUPATEN SIDOARJO
            </p>
            <p className="text-base md:text-lg font-bold text-[#0F294A] mt-0.5">
              DINAS PERUMAHAN, PERMUKIMAN, CIPTA KARYA DAN TATA RUANG
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Jl. Sultan Agung No. 17, Kabupaten Sidoarjo, Jawa Timur 61211 · Sekretariat Tim Verifikasi PSU
            </p>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-sm md:text-base font-bold text-slate-900 underline underline-offset-4">
              {titleMap[docType]}
            </h2>
            <p className="text-xs font-mono text-slate-700 mt-1.5 tabular-nums">
              Nomor: {docNumber}
            </p>
          </div>

          <p className="text-xs md:text-sm text-slate-700 leading-relaxed mb-4">
            Pada hari ini tanggal <span className="font-semibold">{formatDateId(docDate)}</span>, bertempat di Kantor
            Dinas Perumahan, Permukiman, Cipta Karya dan Tata Ruang (DP2CKTR) Kabupaten Sidoarjo, mengacu pada{' '}
            <span className="font-semibold">Peraturan Menteri Dalam Negeri Nomor 15 Tahun 2026</span> tentang Pedoman
            Penyerahan Prasarana, Sarana, dan Utilitas Umum Perumahan dan Permukiman di Daerah, telah dilaksanakan
            verifikasi dan penetapan untuk proyek perumahan:
          </p>

          <div className="border border-slate-300 rounded-lg overflow-hidden mb-5">
            <table className="w-full text-xs md:text-sm">
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="px-4 py-2.5 bg-slate-50 font-medium text-slate-700 w-48">Nama Perumahan</td>
                  <td className="px-4 py-2.5 font-semibold text-slate-900">{project.namaPerumahan}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 bg-slate-50 font-medium text-slate-700">Badan Usaha Pengembang</td>
                  <td className="px-4 py-2.5 text-slate-900">{project.pengembang}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 bg-slate-50 font-medium text-slate-700">Lokasi Administratif</td>
                  <td className="px-4 py-2.5 text-slate-900">
                    Desa {project.desa}, Kecamatan {project.kecamatan}, Kabupaten Sidoarjo
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 bg-slate-50 font-medium text-slate-700">Nomor Pengesahan Siteplan</td>
                  <td className="px-4 py-2.5 font-mono text-slate-900">{project.nomorSiteplan}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 bg-slate-50 font-medium text-slate-700">Skema & Tahapan</td>
                  <td className="px-4 py-2.5 text-slate-900">
                    {project.skemaPenyerahan} — {stage.stageName}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 bg-slate-50 font-medium text-slate-700">Luas Bidang PSU Diserahkan</td>
                  <td className="px-4 py-2.5 font-mono font-semibold text-slate-900 tabular-nums">
                    {formatAreaM2(stage.luasPsuM2)} (dari total lahan {formatAreaM2(project.luasTotalM2)})
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {docType === 'BA_ADMIN' && (
            <div className="mb-6">
              <p className="text-xs font-semibold text-slate-900 mb-2">
                Rekapitulasi Kelengkapan Dokumen Administrasi (Pasal 11 Permendagri 15/2026):
              </p>
              <table className="w-full text-xs border border-slate-300">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-3 py-2 text-left border-b border-slate-300 w-10">No</th>
                    <th className="px-3 py-2 text-left border-b border-slate-300">Jenis Dokumen</th>
                    <th className="px-3 py-2 text-left border-b border-slate-300">Dasar Hukum</th>
                    <th className="px-3 py-2 text-left border-b border-slate-300">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {stage.adminDocs.map((doc) => (
                    <tr key={doc.id}>
                      <td className="px-3 py-2 font-mono">{doc.code}</td>
                      <td className="px-3 py-2 text-slate-800">{doc.label}</td>
                      <td className="px-3 py-2 text-slate-600">{doc.legalBasis}</td>
                      <td className="px-3 py-2 font-semibold text-emerald-700">{doc.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(docType === 'BAPL' || docType === 'BAST_AKHIR') && (
            <div className="mb-6">
              <p className="text-xs font-semibold text-slate-900 mb-2">
                Ringkasan Hasil Pemeriksaan Fisik Lapangan (Prasarana, Sarana & Utilitas):
              </p>
              <table className="w-full text-xs border border-slate-300">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-3 py-2 text-left border-b border-slate-300">Kategori</th>
                    <th className="px-3 py-2 text-left border-b border-slate-300">Komponen PSU</th>
                    <th className="px-3 py-2 text-right border-b border-slate-300">Siteplan</th>
                    <th className="px-3 py-2 text-right border-b border-slate-300">Aktual</th>
                    <th className="px-3 py-2 text-left border-b border-slate-300">Kondisi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {stage.physicalChecklist.slice(0, 8).map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-1.5 text-slate-600">{item.category}</td>
                      <td className="px-3 py-1.5 text-slate-900">{item.name}</td>
                      <td className="px-3 py-1.5 text-right font-mono tabular-nums">
                        {item.siteplanVolume.toLocaleString('id-ID')} {item.unit}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono tabular-nums">
                        {item.actualVolume.toLocaleString('id-ID')} {item.unit}
                      </td>
                      <td className="px-3 py-1.5 font-medium text-emerald-700">{item.condition}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {docType === 'BAST_AKHIR' && stage.bmdAssets.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-slate-900 mb-1.5">
                    Pencatatan Barang Milik Daerah (BPKAD Kabupaten Sidoarjo):
                  </p>
                  <table className="w-full text-xs border border-slate-300">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="px-3 py-2 text-left border-b border-slate-300">Kode Barang BMD</th>
                        <th className="px-3 py-2 text-left border-b border-slate-300">Jenis KIB</th>
                        <th className="px-3 py-2 text-left border-b border-slate-300">No. Register</th>
                        <th className="px-3 py-2 text-right border-b border-slate-300">Nilai Perolehan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {stage.bmdAssets.map((bmd) => (
                        <tr key={bmd.id}>
                          <td className="px-3 py-1.5 font-mono">{bmd.kodeBarangBmd}</td>
                          <td className="px-3 py-1.5">{bmd.jenisKib}</td>
                          <td className="px-3 py-1.5 font-mono">{bmd.nomorRegister}</td>
                          <td className="px-3 py-1.5 text-right font-mono tabular-nums">
                            {formatRupiah(bmd.nilaiPerolehanRp)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tanda tangan & QR Validation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-4 border-t border-slate-200">
            <div className="text-center">
              <p className="text-xs text-slate-600">PIHAK PERTAMA (Pengembang)</p>
              <p className="text-xs font-semibold text-slate-900 mt-0.5">{project.pengembang}</p>
              <div className="h-14" />
              <p className="text-xs font-medium text-slate-800 border-t border-slate-300 pt-1 inline-block px-6">
                Direktur Utama / Kuasa
              </p>
            </div>

            <div className="flex flex-col items-center justify-center text-center">
              <QrCodeSvg value={`SIMPSU-SDA|${docNumber}|${project.id}|${docDate}`} size={82} />
              <p className="text-[11px] font-mono text-slate-600 mt-1.5">
                Verifikasi Digital DP2CKTR
              </p>
            </div>

            <div className="text-center">
              <p className="text-xs text-slate-600">PIHAK KEDUA (Pemerintah Kab. Sidoarjo)</p>
              <p className="text-xs font-semibold text-slate-900 mt-0.5">
                {docType === 'BAST_AKHIR' ? 'a.n. Bupati Sidoarjo / Kepala DP2CKTR' : 'Ketua Tim Verifikasi PSU (DP2CKTR)'}
              </p>
              <div className="h-14" />
              <p className="text-xs font-medium text-slate-800 border-t border-slate-300 pt-1 inline-block px-6">
                NIP. 19760412 200212 1 008
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
