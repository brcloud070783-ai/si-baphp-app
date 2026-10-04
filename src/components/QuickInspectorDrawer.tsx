import React from 'react';
import { ProjectContract, DocumentType } from '../types';
import { ALL_DOCUMENTS_CATALOG } from '../utils/googleDocsService';
import { formatRupiah, formatTanggalIndonesia } from '../utils/terbilang';
import { BAPFinancialCalculator } from './BAPFinancialCalculator';
import { 
  X, 
  SlidersHorizontal, 
  Calendar, 
  Hash, 
  Coins, 
  Building, 
  UserCheck, 
  CheckCircle2,
  Sparkles,
  Camera,
  UploadCloud,
  FileCheck,
  Calculator
} from 'lucide-react';

interface QuickInspectorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectContract;
  selectedDoc: DocumentType;
  onUpdateProject: (updated: ProjectContract) => void;
}

export const QuickInspectorDrawer: React.FC<QuickInspectorDrawerProps> = ({
  isOpen,
  onClose,
  project,
  selectedDoc,
  onUpdateProject
}) => {
  if (!isOpen) return null;

  const activeDocItem = ALL_DOCUMENTS_CATALOG.find(d => d.type === selectedDoc) || ALL_DOCUMENTS_CATALOG[0];

  // Map DocumentType to project field keys
  const getDocKeys = (type: DocumentType): { numKey: keyof ProjectContract; dateKey: keyof ProjectContract; label: string } => {
    switch (type) {
      case 'BAPHP':
        return { numKey: 'nomorBAPHP', dateKey: 'tanggalBAPHP', label: 'BAPHP' };
      case 'BAST':
        return { numKey: 'nomorBAST', dateKey: 'tanggalBAST', label: 'BAST Rekanan ke PPK' };
      case 'BAST_PA':
        return { numKey: 'nomorBAST_PA', dateKey: 'tanggalBAST_PA', label: 'BAST PPK ke PA' };
      case 'BAP':
        return { numKey: 'nomorBAP', dateKey: 'tanggalBAP', label: 'BA Pembayaran' };
      case 'BAKP':
        return { numKey: 'nomorBAKP', dateKey: 'tanggalBAKP', label: 'BA Kemajuan Prestasi' };
      case 'BA_STL':
        return { numKey: 'nomorBA_STL', dateKey: 'tanggalBA_STL', label: 'BA Serah Terima Lapangan' };
      case 'BA_MC0':
        return { numKey: 'nomorBA_MC0', dateKey: 'tanggalBA_MC0', label: 'BA Mutual Check (MC-0)' };
      case 'BA_UM':
        return { numKey: 'nomorBA_UM', dateKey: 'tanggalBA_UM', label: 'BA Uang Muka' };
      case 'BAST_FHO':
        return { numKey: 'nomorBAST_FHO', dateKey: 'tanggalBAST_FHO', label: 'BAST-FHO Retensi' };
      case 'KUITANSI':
        return { numKey: 'nomorKuitansi', dateKey: 'tanggalKuitansi', label: 'Kuitansi Dinas' };
      case 'CHECKLIST':
        return { numKey: 'nomorChecklist', dateKey: 'tanggalChecklist', label: 'Lembar Verifikasi SPP' };
      case 'SURAT_REKANAN':
        return { numKey: 'nomorSuratRekanan', dateKey: 'tanggalSuratRekanan', label: 'Surat Permohonan Rekanan' };
      case 'SPMK':
        return { numKey: 'nomorSPMK', dateKey: 'tanggalSPMK', label: 'SPMK Resmi' };
      default:
        return { numKey: 'nomorBAPHP', dateKey: 'tanggalBAPHP', label: activeDocItem.shortLabel };
    }
  };

  const { numKey, dateKey, label } = getDocKeys(selectedDoc);
  const currentNumValue = (project[numKey] as string) || '';
  const currentDateValue = (project[dateKey] as string) || '';

  const isTerminMode = project.skemaPembayaran === 'termin' && Boolean(project.daftarTermin?.length);
  const activeTermin = isTerminMode 
    ? (project.daftarTermin![project.activeTerminIndex ?? 0] || project.daftarTermin![0])
    : null;

  const handleFieldChange = (key: keyof ProjectContract, value: any) => {
    onUpdateProject({
      ...project,
      [key]: value
    });
  };

  const handleActiveTerminChange = (field: 'nomorBAP' | 'tanggalBAP' | 'status', value: string) => {
    if (!isTerminMode || !project.daftarTermin) return;
    const tIdx = project.activeTerminIndex ?? 0;
    const updatedTermins = [...project.daftarTermin];
    if (updatedTermins[tIdx]) {
      updatedTermins[tIdx] = {
        ...updatedTermins[tIdx],
        [field]: value
      };
      onUpdateProject({
        ...project,
        daftarTermin: updatedTermins
      });
    }
  };

  const handlePhotoUpload = (field: 'kondisi0' | 'kondisi50' | 'kondisi100', file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      onUpdateProject({
        ...project,
        fotoDokumentasi: {
          ...(project.fotoDokumentasi || {}),
          [field]: dataUrl
        }
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200 text-xs">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Inspektor Cepat</h3>
            <p className="text-[11px] text-slate-500">Ubah register & tanggal tanpa meninggalkan dokumen</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Drawer Body Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Active Document Context Card */}
        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-blue-800 tracking-wider">
              Dokumen yang Sedang Dilihat:
            </span>
            <span className="px-1.5 py-0.5 rounded bg-blue-200/70 text-blue-900 font-bold text-[9px] uppercase">
              {activeDocItem.stage}
            </span>
          </div>
          <h4 className="font-bold text-slate-900 text-xs leading-snug">
            {activeDocItem.label}
          </h4>
          <p className="text-[11px] text-slate-600">
            {activeDocItem.description}
          </p>
        </div>

        {/* Section 1: Nomor & Tanggal Dokumen Ini */}
        <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b pb-1.5">
            <Hash className="w-3.5 h-3.5 text-blue-600" />
            <span>1. Register Dokumen ({label})</span>
          </h4>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Nomor Surat Dinas
            </label>
            <input
              type="text"
              value={currentNumValue}
              onChange={(e) => handleFieldChange(numKey, e.target.value)}
              placeholder="Contoh: 000.4.3/64514226/02-100/DISDIKBUD/KU/VI/2026"
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-[11px] focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Tanggal Berita Acara
            </label>
            <input
              type="date"
              value={currentDateValue}
              onChange={(e) => handleFieldChange(dateKey, e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
            {currentDateValue && (
              <span className="text-[10px] text-slate-400 mt-1 block">
                Format resmi: {formatTanggalIndonesia(currentDateValue)}
              </span>
            )}
          </div>
        </div>

        {/* Section 1.B: Kalkulator Rincian Keuangan Khusus BAP */}
        {selectedDoc === 'BAP' && (
          <div className="space-y-2">
            <BAPFinancialCalculator
              project={project}
              onUpdateProject={onUpdateProject}
            />
          </div>
        )}

        {/* Section 2: Data Keuangan & Termin Aktif */}
        {isTerminMode && activeTermin && (
          <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between border-b pb-1.5">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-blue-600" />
                <span>2. Parameter {activeTermin.namaTermin}</span>
              </h4>
              <span className="font-mono font-bold text-blue-700 text-[11px]">
                {activeTermin.bobotKumulatif}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Bruto Tahap</span>
                <span className="font-mono font-bold text-slate-900">{formatRupiah(activeTermin.nilaiBruto)}</span>
              </div>
              <div className="p-2 bg-emerald-50 rounded border border-emerald-200">
                <span className="text-[10px] text-emerald-800 block font-semibold uppercase">Netto Kasda</span>
                <span className="font-mono font-bold text-emerald-700">{formatRupiah(activeTermin.nilaiNetto)}</span>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                No. BAP Termin Ini
              </label>
              <input
                type="text"
                value={activeTermin.nomorBAP || ''}
                onChange={(e) => handleActiveTerminChange('nomorBAP', e.target.value)}
                placeholder="Contoh: 000.4.3/64514226/BAP-TERM-II/DIKBUD/VI/2026"
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Status Tagihan Termin
              </label>
              <select
                value={activeTermin.status}
                onChange={(e) => handleActiveTerminChange('status', e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-medium"
              >
                <option value="draf">Draf Usulan</option>
                <option value="diajukan">Diajukan Rekanan</option>
                <option value="diverifikasi">Diverifikasi Teknis PPTK</option>
                <option value="cair">Cair Kas Daerah</option>
              </select>
            </div>
          </div>
        )}

        {/* Section 3: Rekening Bank & Rekanan */}
        <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b pb-1.5">
            <Building className="w-3.5 h-3.5 text-blue-600" />
            <span>3. Rekening Transfer Rekanan</span>
          </h4>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Nama Bank Rekanan
            </label>
            <input
              type="text"
              value={project.penyedia.bankNama}
              onChange={(e) => {
                onUpdateProject({
                  ...project,
                  penyedia: { ...project.penyedia, bankNama: e.target.value }
                });
              }}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Nomor Rekening Kasda
            </label>
            <input
              type="text"
              value={project.penyedia.nomorRekening}
              onChange={(e) => {
                onUpdateProject({
                  ...project,
                  penyedia: { ...project.penyedia, nomorRekening: e.target.value }
                });
              }}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-bold"
            />
          </div>
        </div>

        {/* Section 4: Quick Photo Uploader (For Lampiran Foto) */}
        {selectedDoc === 'LAMPIRAN_FOTO' && (
          <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b pb-1.5">
              <Camera className="w-3.5 h-3.5 text-blue-600" />
              <span>4. Unggah Foto Bukti Fisik Lapangan</span>
            </h4>

            {/* Foto 0% */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Foto Progres 0% (Awal Kerja)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handlePhotoUpload('kondisi0', e.target.files[0]);
                  }}
                  className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
              </div>
              {project.fotoDokumentasi?.kondisi0 && (
                <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">✓ Foto 0% Terlampir</span>
              )}
            </div>

            {/* Foto 50% */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Foto Progres 50% (Pelaksanaan)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files?.[0]) handlePhotoUpload('kondisi50', e.target.files[0]);
                }}
                className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
              {project.fotoDokumentasi?.kondisi50 && (
                <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">✓ Foto 50% Terlampir</span>
              )}
            </div>

            {/* Foto 100% */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Foto Progres 100% (Selesai Tuntas)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files?.[0]) handlePhotoUpload('kondisi100', e.target.files[0]);
                }}
                className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
              {project.fotoDokumentasi?.kondisi100 && (
                <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">✓ Foto 100% Terlampir</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Drawer Footer */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <span className="text-[11px] text-slate-500 flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Perubahan tersimpan otomatis</span>
        </span>
        <button
          type="button"
          onClick={onClose}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-2xs cursor-pointer"
        >
          Selesai
        </button>
      </div>
    </div>
  );
};
