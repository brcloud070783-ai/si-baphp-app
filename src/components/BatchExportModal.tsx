import React, { useState } from 'react';
import { ProjectContract, KopDinasConfig, DocumentType } from '../types';
import { ALL_DOCUMENTS_CATALOG } from '../utils/googleDocsService';
import { DOSSIER_PRESETS, DossierPreset } from '../utils/documentReadiness';
import { formatRupiah, formatTanggalIndonesia } from '../utils/terbilang';
import { DocumentRenderer } from './DocumentRenderer';
import { OfficialKop } from './OfficialKop';
import { 
  X, 
  Printer, 
  CheckSquare, 
  Square, 
  FileStack, 
  Layers, 
  CheckCircle2,
  FileCheck2,
  Download,
  BookOpen,
  FileText
} from 'lucide-react';

interface BatchExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectContract;
  kopConfig: KopDinasConfig;
}

export const BatchExportModal: React.FC<BatchExportModalProps> = ({
  isOpen,
  onClose,
  project,
  kopConfig
}) => {
  // Default to SPP-LS preset
  const [selectedDocs, setSelectedDocs] = useState<Record<DocumentType, boolean>>(() => {
    const initial: Partial<Record<DocumentType, boolean>> = {};
    ALL_DOCUMENTS_CATALOG.forEach(d => {
      const sppPreset = DOSSIER_PRESETS.find(p => p.id === 'spp_ls');
      initial[d.type] = sppPreset ? sppPreset.docTypes.includes(d.type) : true;
    });
    return initial as Record<DocumentType, boolean>;
  });

  const [activePreset, setActivePreset] = useState<DossierPreset>('spp_ls');
  const [includeCover, setIncludeCover] = useState<boolean>(true);

  const toggleDoc = (docType: DocumentType) => {
    setSelectedDocs(prev => ({ ...prev, [docType]: !prev[docType] }));
  };

  const handleApplyPreset = (presetId: DossierPreset) => {
    setActivePreset(presetId);
    const preset = DOSSIER_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    const updated: Record<DocumentType, boolean> = {} as any;
    ALL_DOCUMENTS_CATALOG.forEach(d => {
      updated[d.type] = preset.docTypes.includes(d.type);
    });
    setSelectedDocs(updated);
  };

  const handleSelectAll = (val: boolean) => {
    const updated: Record<DocumentType, boolean> = { ...selectedDocs };
    ALL_DOCUMENTS_CATALOG.forEach(d => {
      updated[d.type] = val;
    });
    setSelectedDocs(updated);
    if (val) setActivePreset('all');
  };

  const selectedCount = ALL_DOCUMENTS_CATALOG.filter(d => selectedDocs[d.type]).length;
  // Estimate pages: Cover (1), BAPHP (2), LAMPIRAN_FOTO (2), others (1)
  const estimatedPages = (includeCover ? 1 : 0) + ALL_DOCUMENTS_CATALOG.reduce((acc, d) => {
    if (!selectedDocs[d.type]) return acc;
    if (d.type === 'BAPHP' || d.type === 'LAMPIRAN_FOTO') return acc + 2;
    return acc + 1;
  }, 0);

  const handlePrintBatch = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[95vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Header (No print) */}
        <div className="no-print px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <FileStack className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Unduh 1 Bundel Lengkap SPP-LS (One-Click Dossier)
                </h2>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full uppercase">
                  {selectedCount} Berkas Terpilih
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {project.namaPaket} — {project.lokasi}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handlePrintBatch}
              disabled={selectedCount === 0}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none rounded-xl transition-all shadow-xs cursor-pointer"
              title="Cetak/Simpan seluruh dokumen yang dicentang secara berurutan dalam 1 PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak {selectedCount} Dokumen (~{estimatedPages} Halaman)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preset & Document Selection Bar (No print) */}
        <div className="no-print px-6 py-3.5 bg-slate-50/80 border-b border-slate-200 space-y-3">
          {/* Preset Chips & Cover Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Pilih Paket Bundel:</span>
              </span>
              {DOSSIER_PRESETS.map((p) => {
                const isActive = activePreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleApplyPreset(p.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span>{p.label}</span>
                    <span className={`ml-1.5 text-[10px] font-mono px-1 py-0.2 rounded-full ${
                      isActive ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {p.docTypes.length}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  checked={includeCover}
                  onChange={(e) => setIncludeCover(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                />
                <span>Sertakan Lembar Cover Dossier SPP-LS</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectAll(true)}
                  className="text-blue-600 hover:underline font-medium text-[11px]"
                >
                  Pilih Semua
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => handleSelectAll(false)}
                  className="text-slate-500 hover:underline font-medium text-[11px]"
                >
                  Kosongkan
                </button>
              </div>
            </div>
          </div>

          {/* Individual Document Checkboxes Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-1 border-t border-slate-200/60">
            {ALL_DOCUMENTS_CATALOG.map((item, idx) => {
              const isChecked = Boolean(selectedDocs[item.type]);
              return (
                <label
                  key={item.type}
                  className={`flex items-center gap-2 p-2 rounded-lg text-[11.5px] cursor-pointer transition-colors border ${
                    isChecked
                      ? 'bg-blue-50/70 border-blue-200 text-blue-900 font-semibold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleDoc(item.type)}
                    className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                  />
                  <span className="truncate" title={item.label}>
                    {idx + 1}. {item.shortLabel}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Scrollable Container with all selected docs */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 flex flex-col items-center gap-8">
          {/* Cover Dossier Page (If enabled) */}
          {includeCover && (
            <div className="w-full flex flex-col items-center">
              <div className="no-print w-full max-w-[210mm] mb-1.5 px-2 flex items-center justify-between text-xs text-slate-500 font-mono">
                <span className="font-semibold text-slate-700">HALAMAN MUKA / COVER BUNDEL SPP-LS</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] uppercase font-bold">Cover Dossier</span>
              </div>
              <div className="print-page bg-white shadow-xl border border-slate-200 flex flex-col justify-between" style={{ width: '210mm', minHeight: '297mm', padding: '18mm 20mm' }}>
                <div>
                  <OfficialKop config={kopConfig} />

                  <div className="text-center my-6 space-y-2 border-y-2 border-slate-900 py-4">
                    <h1 className="text-lg font-bold text-slate-900 tracking-wider uppercase">
                      BERKAS ADMINISTRASI PENGAJUAN PEMBAYARAN LANGSUNG (SPP-LS)
                    </h1>
                    <p className="text-xs text-slate-600 font-medium tracking-wide">
                      Tahun Anggaran {project.tahunAnggaran || 2026} • Berdasarkan Perpres No. 12 Tahun 2021 & Permendagri No. 77 Tahun 2020
                    </p>
                  </div>

                  {/* Summary Table */}
                  <div className="mb-6">
                    <table className="w-full text-xs border border-slate-300">
                      <tbody>
                        <tr className="border-b border-slate-200">
                          <td className="w-48 bg-slate-50 p-2 font-bold text-slate-700">Nama Paket Pekerjaan</td>
                          <td className="p-2 font-bold text-slate-900">{project.namaPaket}</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="bg-slate-50 p-2 font-bold text-slate-700">Lokasi / Sekolah</td>
                          <td className="p-2 text-slate-800">{project.lokasi} ({project.kabupatenKota})</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="bg-slate-50 p-2 font-bold text-slate-700">Nomor & Tanggal SPK/Kontrak</td>
                          <td className="p-2 font-mono text-slate-900">{project.nomorSPK} (Tgl. {formatTanggalIndonesia(project.tanggalSPK)})</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="bg-slate-50 p-2 font-bold text-slate-700">Nilai Kontrak Total</td>
                          <td className="p-2 font-bold text-slate-900 font-mono">{formatRupiah(project.nilaiSPK)}</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="bg-slate-50 p-2 font-bold text-slate-700">Penyedia / Rekanan</td>
                          <td className="p-2 text-slate-900 font-semibold">{project.penyedia.namaPerusahaan} (Dir: {project.penyedia.namaDirektur})</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="bg-slate-50 p-2 font-bold text-slate-700">Pejabat Pembuat Komitmen (PPK)</td>
                          <td className="p-2 text-slate-900">{project.ppk.nama} (NIP. {project.ppk.nip})</td>
                        </tr>
                        <tr>
                          <td className="bg-slate-50 p-2 font-bold text-slate-700">Pejabat Pelaksana Teknis Kegiatan</td>
                          <td className="p-2 text-slate-900">{project.pptk.nama} (NIP. {project.pptk.nip})</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Checklist of Included Documents */}
                  <div>
                    <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                      Daftar Isi & Kelengkapan Berita Acara yang Terlampir:
                    </h2>
                    <table className="w-full text-[11px] border border-slate-300">
                      <thead>
                        <tr className="bg-slate-100 font-bold text-slate-700 border-b border-slate-300">
                          <th className="p-1.5 w-8 text-center border-r border-slate-300">No</th>
                          <th className="p-1.5 border-r border-slate-300">Nama Dokumen Berita Acara</th>
                          <th className="p-1.5 w-52 border-r border-slate-300">Nomor Surat Dinas</th>
                          <th className="p-1.5 w-24 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {ALL_DOCUMENTS_CATALOG.filter(d => selectedDocs[d.type]).map((d, idx) => (
                          <tr key={d.type}>
                            <td className="p-1.5 text-center font-mono font-bold border-r border-slate-200">{idx + 1}</td>
                            <td className="p-1.5 font-medium text-slate-800 border-r border-slate-200">{d.label}</td>
                            <td className="p-1.5 font-mono text-[10.5px] text-slate-700 border-r border-slate-200 truncate max-w-xs">
                              {(project as any)[`nomor${d.type.replace('_', '')}`] || (project as any)[`nomor${d.type}`] || '-'}
                            </td>
                            <td className="p-1.5 text-center font-bold text-emerald-700">
                              LENGKAP
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Signatures on Cover */}
                <div className="pt-6 grid grid-cols-2 text-center text-xs">
                  <div>
                    <p className="text-slate-500 mb-1">Disusun & Diperiksa oleh:</p>
                    <p className="font-bold text-slate-900">PPTK Kegiatan</p>
                    <div className="h-16"></div>
                    <p className="font-bold underline text-slate-900">{project.pptk.nama}</p>
                    <p className="text-[10.5px] text-slate-500 font-mono">NIP. {project.pptk.nip}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-1">Disetujui untuk SPP-LS oleh:</p>
                    <p className="font-bold text-slate-900">Pejabat Pembuat Komitmen (PPK)</p>
                    <div className="h-16"></div>
                    <p className="font-bold underline text-slate-900">{project.ppk.nama}</p>
                    <p className="text-[10.5px] text-slate-500 font-mono">NIP. {project.ppk.nip}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedCount === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-2">
              <FileCheck2 className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">Belum ada dokumen yang dipilih</p>
              <p className="text-xs text-slate-400">Silakan pilih preset bundel di atas atau centang dokumen yang ingin dicetak.</p>
            </div>
          ) : (
            ALL_DOCUMENTS_CATALOG.filter(d => selectedDocs[d.type]).map(d => (
              <div key={d.type} className="w-full flex flex-col items-center">
                <div className="no-print w-full max-w-[210mm] mb-1.5 px-2 flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span className="font-semibold text-slate-700">{d.label}</span>
                  <span className="bg-slate-200 px-2 py-0.5 rounded text-[10px] uppercase font-bold">{d.stage}</span>
                </div>
                <DocumentRenderer
                  project={project}
                  kopConfig={kopConfig}
                  selectedDoc={d.type}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

