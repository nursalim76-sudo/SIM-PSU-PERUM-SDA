import React, { useMemo, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, ArrowRight, MapPin } from 'lucide-react';
import { HousingProject, MenuId, ProjectStatus, SIDOARJO_KECAMATAN } from '../types/psu';
import { SIDOARJO_MAP_POLYGONS } from '../data/initialData';
import {
  formatAreaM2,
  formatCompactRupiah,
  getActiveStage,
  getStatusMeta,
} from '../utils/formatters';
import { StatusLabel } from '../components/StatusLabel';

interface WebGisViewProps {
  projects: HousingProject[];
  onSelectProjectModule: (projectId: string, menu: MenuId) => void;
}

export const WebGisView: React.FC<WebGisViewProps> = ({ projects, onSelectProjectModule }) => {
  const [kecFilter, setKecFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ProjectStatus>('ALL');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projects[0]?.id || null);
  const [zoom, setZoom] = useState<number>(1);
  const [showPolygons, setShowPolygons] = useState<boolean>(true);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const okKec = kecFilter === 'ALL' || p.kecamatan === kecFilter;
      const okStatus = statusFilter === 'ALL' || p.status === statusFilter;
      return okKec && okStatus;
    });
  }, [projects, kecFilter, statusFilter]);

  const handleExportGeoJson = () => {
    const fc = {
      type: 'FeatureCollection',
      crs: { type: 'name', properties: { name: 'EPSG:4326' } },
      features: filteredProjects.map((p) => ({
        type: 'Feature',
        properties: {
          id: p.id,
          namaPerumahan: p.namaPerumahan,
          pengembang: p.pengembang,
          kecamatan: p.kecamatan,
          desa: p.desa,
          nomorSiteplan: p.nomorSiteplan,
          luasWajibPsuM2: p.luasWajibPsuM2,
          status: p.status,
        },
        geometry: {
          type: 'Point',
          coordinates: [p.coordinates.lng, p.coordinates.lat],
        },
      })),
    };
    const blob = new Blob([JSON.stringify(fc, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Sebaran_PSU_Sidoarjo_WGS84.geojson';
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedProject =
    filteredProjects.find((p) => p.id === selectedProjectId) ||
    filteredProjects[0] ||
    null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            WebGIS Sebaran PSU 18 Kecamatan Kabupaten Sidoarjo
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Peta interaktif poligon kawasan & titik proyek perumahan (Proyeksi WGS84 / EPSG:4326)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={kecFilter}
            onChange={(e) => setKecFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-700"
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
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | ProjectStatus)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-700"
          >
            <option value="ALL">Semua Status</option>
            <option value="BAST_SELESAI_BMD">BAST Akhir & BMD (Hijau)</option>
            <option value="BA_ADMIN_PEMELIHARAAN">Masa Pemeliharaan (Biru)</option>
            <option value="PERBAIKAN_DEFECT">Perbaikan Defect (Kuning)</option>
            <option value="PROSES_ADMIN">Proses Verifikasi (Kuning)</option>
            <option value="BELUM_AJUKAN">Menunggak (Merah)</option>
            <option value="TERLANTAR_PAILIT">PSU Terlantar / Pailit (Merah)</option>
          </select>

          <button
            type="button"
            onClick={handleExportGeoJson}
            className="px-3 py-2 text-xs font-medium text-[#0F294A] bg-white border border-slate-300 rounded-lg hover:bg-slate-50 whitespace-nowrap cursor-pointer"
          >
            Ekspor GeoJSON
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Map Canvas */}
        <div className="xl:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#059669]" /> BAST & BMD
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#2563EB]" /> BA Admin / Pemeliharaan
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#D97706]" /> Verifikasi / Defect
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#DC2626]" /> Menunggak / Terlantar
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowPolygons((v) => !v)}
                className={`px-2.5 py-1 text-xs font-medium rounded border cursor-pointer ${
                  showPolygons
                    ? 'bg-[#0F294A] text-white border-[#0F294A]'
                    : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                Layer Poligon PSU
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(1.6, Number((z + 0.15).toFixed(2))))}
                aria-label="Perbesar peta"
                className="p-1.5 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.85, Number((z - 0.15).toFixed(2))))}
                aria-label="Perkecil peta"
                className="p-1.5 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(1)}
                aria-label="Reset zoom"
                className="p-1.5 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="relative bg-[#EFF6FA] overflow-auto p-3 flex items-center justify-center min-h-[460px]">
            <svg
              viewBox="0 0 680 570"
              className="w-full max-w-[760px] h-auto transition-transform duration-200"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
              role="img"
              aria-label="Peta WebGIS 18 Kecamatan Kabupaten Sidoarjo"
            >
              {/* Surrounding Geography Context */}
              <rect x="0" y="0" width="680" height="570" fill="#EFF6FA" />
              <path d="M 550,0 L 680,0 L 680,570 L 520,570 Q 590,340 610,180 Z" fill="#DCEEF8" />
              <text x="615" y="300" fill="#477A9B" fontSize="11" fontWeight="600" textAnchor="middle">
                Selat Madura
              </text>
              <text x="340" y="42" fill="#64748B" fontSize="11" fontWeight="600" textAnchor="middle">
                Kota Surabaya
              </text>
              <text x="120" y="92" fill="#64748B" fontSize="10" textAnchor="middle">
                Kab. Gresik / Mojokerto
              </text>
              <text x="350" y="550" fill="#64748B" fontSize="10" textAnchor="middle">
                Kab. Pasuruan
              </text>

              {/* 18 Kecamatan Polygons */}
              {SIDOARJO_MAP_POLYGONS.map((kec) => {
                const isSelectedKec = kecFilter === kec.name;
                const countInKec = projects.filter((p) => p.kecamatan === kec.name).length;
                return (
                  <g
                    key={kec.name}
                    onClick={() => setKecFilter(kecFilter === kec.name ? 'ALL' : kec.name)}
                    className="cursor-pointer"
                  >
                    <path
                      d={kec.path}
                      fill={
                        isSelectedKec
                          ? '#D1FAE5'
                          : countInKec > 0
                            ? '#FFFFFF'
                            : '#F8FAFC'
                      }
                      stroke={isSelectedKec ? '#0D6E5B' : '#94A3B8'}
                      strokeWidth={isSelectedKec ? 2 : 1.1}
                      className="hover:fill-slate-100 transition-colors"
                    />
                    <text
                      x={kec.labelX}
                      y={kec.labelY}
                      textAnchor="middle"
                      fontSize="9.5"
                      fontWeight={countInKec > 0 ? '600' : '500'}
                      fill="#334155"
                      pointerEvents="none"
                    >
                      {kec.name}
                    </text>
                  </g>
                );
              })}

              {/* Project Markers & PSU Polygons */}
              {filteredProjects.map((project) => {
                const meta = getStatusMeta(project.status);
                const isSelected = selectedProject?.id === project.id;
                const parcelSize = Math.max(12, Math.min(24, Math.round(Math.sqrt(project.luasWajibPsuM2) / 11)));
                return (
                  <g
                    key={project.id}
                    transform={`translate(${project.coordinates.mapX}, ${project.coordinates.mapY})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProjectId(project.id);
                    }}
                    className="cursor-pointer"
                  >
                    {showPolygons && (
                      <polygon
                        points={`${-parcelSize},${-parcelSize * 0.6} ${parcelSize * 0.8},${-parcelSize * 0.85} ${parcelSize},${parcelSize * 0.55} ${-parcelSize * 0.7},${parcelSize * 0.8}`}
                        fill={meta.markerFill}
                        fillOpacity={isSelected ? 0.34 : 0.18}
                        stroke={meta.markerFill}
                        strokeWidth={isSelected ? 1.6 : 1}
                      />
                    )}
                    {isSelected && (
                      <circle r="15" fill={meta.markerFill} fillOpacity="0.22" />
                    )}
                    <circle
                      r={isSelected ? 8.5 : 6.5}
                      fill={meta.markerFill}
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                    <title>
                      {project.namaPerumahan} ({meta.shortLabel})
                    </title>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Popup / Inspector Panel */}
        <div className="xl:col-span-4 space-y-4">
          {selectedProject ? (
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Kec. {selectedProject.kecamatan} · Desa {selectedProject.desa}
                  </p>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">
                    {selectedProject.namaPerumahan}
                  </h3>
                  <p className="text-xs text-slate-600">{selectedProject.pengembang}</p>
                </div>
                <MapPin className="w-5 h-5 text-[#0F294A] shrink-0" />
              </div>

              <StatusLabel status={selectedProject.status} />

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200 text-xs">
                <div>
                  <p className="text-slate-500">Luas Wajib PSU</p>
                  <p className="font-mono font-semibold text-slate-900 tabular-nums mt-0.5">
                    {formatAreaM2(selectedProject.luasWajibPsuM2)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Estimasi Nilai Aset</p>
                  <p className="font-mono font-semibold text-[#0D6E5B] tabular-nums mt-0.5">
                    {formatCompactRupiah(selectedProject.estimasiNilaiAsetRp)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">No. Siteplan</p>
                  <p className="font-mono text-slate-800 mt-0.5 truncate">
                    {selectedProject.nomorSiteplan}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Koordinat GPS</p>
                  <p className="font-mono text-slate-800 tabular-nums mt-0.5">
                    {selectedProject.coordinates.lat.toFixed(4)}, {selectedProject.coordinates.lng.toFixed(4)}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <p className="font-medium text-slate-700">Tahap Aktif ({selectedProject.skemaPenyerahan})</p>
                <p className="text-slate-900 font-semibold mt-0.5">
                  {getActiveStage(selectedProject).stageName}
                </p>
                <p className="text-slate-500 mt-1">
                  BAST Akhir: {getActiveStage(selectedProject).bastNumber || 'Belum Terbit'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onSelectProjectModule(selectedProject.id, 'verifikasi-admin')}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#0F294A] rounded-lg hover:bg-[#163a66] cursor-pointer"
                >
                  Cek Administrasi
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onSelectProjectModule(selectedProject.id, 'survei-fisik')}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#0F294A] bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
                >
                  Survei Lapangan
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-xs text-slate-500">
              Tidak ada titik perumahan yang cocok dengan filter peta.
            </div>
          )}

          {/* Quick Directory */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-800">
                Daftar Titik Terfilter ({filteredProjects.length})
              </p>
              {kecFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setKecFilter('ALL')}
                  className="text-[11px] font-medium text-[#0F294A] hover:underline cursor-pointer"
                >
                  Tampilkan Semua
                </button>
              )}
            </div>
            <div className="divide-y divide-slate-200 max-h-[260px] overflow-y-auto">
              {filteredProjects.map((p) => {
                const meta = getStatusMeta(p.status);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedProjectId(p.id)}
                    className={`w-full px-4 py-2.5 text-left flex items-center justify-between gap-2 hover:bg-slate-50 cursor-pointer ${
                      selectedProject?.id === p.id ? 'bg-slate-100' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {p.namaPerumahan}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Kec. {p.kecamatan} · {formatAreaM2(p.luasWajibPsuM2)}
                      </p>
                    </div>
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: meta.markerFill }}
                      title={meta.label}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
