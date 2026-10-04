import React, { useState } from 'react';
import { ProjectContract, DocumentType } from '../types';
import { ALL_DOCUMENTS_CATALOG, DocumentCatalogItem } from '../utils/googleDocsService';
import { checkDocumentReadiness } from '../utils/documentReadiness';
import { formatTanggalIndonesia } from '../utils/terbilang';
import { 
  X, 
  TableProperties, 
  Sparkles, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Save, 
  RefreshCw, 
  Layers, 
  CheckCheck,
  FileSpreadsheet,
  Clock,
  ArrowRight,
  Filter
} from 'lucide-react';

interface BulkRegisterMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectContract;
  onSave: (updatedProject: ProjectContract) => void;
}

interface DocFieldConfig {
  type: DocumentType;
  label: string;
  shortLabel: string;
  stage: 'Awal Kontrak' | 'Pelaksanaan' | 'Serah Terima' | 'Pencairan Kasda';
  numKey: keyof ProjectContract;
  dateKey: keyof ProjectContract;
  defaultPrefix: string;
  authority: string;
}

const MATRIX_DOC_FIELDS: DocFieldConfig[] = [
  {
    type: 'SPMK',
    label: 'Surat Perintah Mulai Kerja',
    shortLabel: 'SPMK',
    stage: 'Awal Kontrak',
    numKey: 'nomorSPMK',
    dateKey: 'tanggalSPMK',
    defaultPrefix: 'SPMK',
    authority: 'PPK'
  },
  {
    type: 'BA_STL',
    label: 'Berita Acara Serah Terima Lapangan',
    shortLabel: 'BA-STL',
    stage: 'Awal Kontrak',
    numKey: 'nomorBA_STL',
    dateKey: 'tanggalBA_STL',
    defaultPrefix: 'BA-STL',
    authority: 'PPK & Penyedia'
  },
  {
    type: 'BA_MC0',
    label: 'Berita Acara Mutual Check 0% (MC-0)',
    shortLabel: 'BA-MC0',
    stage: 'Pelaksanaan',
    numKey: 'nomorBA_MC0',
    dateKey: 'tanggalBA_MC0',
    defaultPrefix: 'BA-MC0',
    authority: 'PPTK, Konsultan & Penyedia'
  },
  {
    type: 'BA_UM',
    label: 'Berita Acara Pembayaran Uang Muka',
    shortLabel: 'BA-UM',
    stage: 'Pelaksanaan',
    numKey: 'nomorBA_UM',
    dateKey: 'tanggalBA_UM',
    defaultPrefix: 'BA-UM',
    authority: 'PPK & Penyedia'
  },
  {
    type: 'BAKP',
    label: 'Berita Acara Kemajuan Prestasi Pekerjaan',
    shortLabel: 'BAKP',
    stage: 'Pelaksanaan',
    numKey: 'nomorBAKP',
    dateKey: 'tanggalBAKP',
    defaultPrefix: 'BAKP',
    authority: 'PPTK & Penyedia'
  },
  {
    type: 'BAPHP',
    label: 'BA Pemeriksaan Hasil Pekerjaan (2 Hal)',
    shortLabel: 'BAPHP',
    stage: 'Serah Terima',
    numKey: 'nomorBAPHP',
    dateKey: 'tanggalBAPHP',
    defaultPrefix: 'BAPHP',
    authority: 'PPTK & Tim Teknis'
  },
  {
    type: 'BAST',
    label: 'BA Serah Terima Pertama (Penyedia ke PPK)',
    shortLabel: 'BAST',
    stage: 'Serah Terima',
    numKey: 'nomorBAST',
    dateKey: 'tanggalBAST',
    defaultPrefix: 'BAST',
    authority: 'PPK & Penyedia'
  },
  {
    type: 'BAST_PA',
    label: 'BA Serah Terima PPK ke Pengguna Anggaran (PA)',
    shortLabel: 'BAST-PA',
    stage: 'Serah Terima',
    numKey: 'nomorBAST_PA',
    dateKey: 'tanggalBAST_PA',
    defaultPrefix: 'BAST-PA',
    authority: 'PPK & PA/KPA'
  },
  {
    type: 'SURAT_REKANAN',
    label: 'Surat Permohonan Pembayaran dari Penyedia',
    shortLabel: 'Permohonan Rekanan',
    stage: 'Pencairan Kasda',
    numKey: 'nomorSuratRekanan',
    dateKey: 'tanggalSuratRekanan',
    defaultPrefix: 'SPP-VEND',
    authority: 'Penyedia (Direktur)'
  },
  {
    type: 'BAP',
    label: 'Berita Acara Pembayaran (BAP Kasda)',
    shortLabel: 'BAP',
    stage: 'Pencairan Kasda',
    numKey: 'nomorBAP',
    dateKey: 'tanggalBAP',
    defaultPrefix: 'BAP',
    authority: 'PPK & Penyedia'
  },
  {
    type: 'KUITANSI',
    label: 'Kuitansi Pembayaran Bermeterai',
    shortLabel: 'Kuitansi',
    stage: 'Pencairan Kasda',
    numKey: 'nomorKuitansi',
    dateKey: 'tanggalKuitansi',
    defaultPrefix: 'KWT',
    authority: 'Bendahara, PPK & Rekanan'
  },
  {
    type: 'CHECKLIST',
    label: 'Lembar Verifikasi Kelengkapan SPP-LS',
    shortLabel: 'Checklist SPP',
    stage: 'Pencairan Kasda',
    numKey: 'nomorChecklist',
    dateKey: 'tanggalChecklist',
    defaultPrefix: 'CHK-LS',
    authority: 'PPK / Verifikator'
  },
  {
    type: 'BAST_FHO',
    label: 'BA Serah Terima Akhir & Retensi 5% (FHO)',
    shortLabel: 'BAST-FHO',
    stage: 'Serah Terima',
    numKey: 'nomorBAST_FHO',
    dateKey: 'tanggalBAST_FHO',
    defaultPrefix: 'BAST-FHO',
    authority: 'PPK & Penyedia'
  }
];

export const BulkRegisterMatrixModal: React.FC<BulkRegisterMatrixModalProps> = ({
  isOpen,
  onClose,
  project,
  onSave
}) => {
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const data: Record<string, string> = {};
    MATRIX_DOC_FIELDS.forEach(f => {
      data[f.numKey] = (project[f.numKey] as string) || '';
      data[f.dateKey] = (project[f.dateKey] as string) || '';
    });
    return data;
  });

  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('all');
  const [formatPattern, setFormatPattern] = useState<string>('000.4.3/{NO_SPK}/[KODE]/DIKBUD/VI/2026');
  const [notification, setNotification] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      const data: Record<string, string> = {};
      MATRIX_DOC_FIELDS.forEach(f => {
        data[f.numKey] = (project[f.numKey] as string) || '';
        data[f.dateKey] = (project[f.dateKey] as string) || '';
      });
      setFormData(data);
      setNotification(null);
    }
  }, [isOpen, project]);

  if (!isOpen) return null;

  const handleFieldChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerateSequentialNumbers = () => {
    const cleanSpk = project.nomorSPK ? project.nomorSPK.replace(/\//g, '-') : 'SPK-01';
    const updated = { ...formData };

    MATRIX_DOC_FIELDS.forEach((f, idx) => {
      const seqStr = String(idx + 1).padStart(2, '0');
      let generatedNum = formatPattern
        .replace('{NO_SPK}', cleanSpk)
        .replace('[KODE]', f.defaultPrefix)
        .replace('{SEQ}', seqStr);

      if (!formatPattern.includes('[KODE]') && !formatPattern.includes('{SEQ}')) {
        generatedNum = `000.4.3/${project.kodePaket || '64514226'}/${seqStr}-${f.defaultPrefix}/DIKBUD/VI/${project.tahunAnggaran || 2026}`;
      }

      updated[f.numKey] = generatedNum;
    });

    setFormData(updated);
    setNotification('Format nomor resmi berhasil diterapkan ke seluruh 13 dokumen Berita Acara!');
    setTimeout(() => setNotification(null), 4000);
  };

  const handleAutoAlignChronology = () => {
    const spkDate = project.tanggalSPK || '2026-05-02';
    const spmkDate = project.tanggalSPMK || spkDate;
    const endDate = project.tanggalSelesai || '2026-06-15';

    const updated = { ...formData };
    updated['tanggalSPMK'] = spmkDate;
    updated['tanggalBA_STL'] = spmkDate;
    updated['tanggalBA_MC0'] = spmkDate;
    updated['tanggalBA_UM'] = spmkDate;
    updated['tanggalBAKP'] = endDate;
    updated['tanggalBAPHP'] = endDate;
    updated['tanggalBAST'] = endDate;
    updated['tanggalBAST_PA'] = endDate;
    updated['tanggalSuratRekanan'] = endDate;
    updated['tanggalBAP'] = endDate;
    updated['tanggalKuitansi'] = endDate;
    updated['tanggalChecklist'] = endDate;

    setFormData(updated);
    setNotification('Kronologi tanggal seluruh berkas berhasil diselaraskan (Sesuai SPMK s.d. Serah Terima)!');
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSaveAll = () => {
    const updatedProject: ProjectContract = {
      ...project,
      ...formData,
      updatedAt: new Date().toISOString()
    };
    onSave(updatedProject);
    onClose();
  };

  const filteredDocs = MATRIX_DOC_FIELDS.filter(f => 
    selectedStageFilter === 'all' || f.stage === selectedStageFilter
  );

  const totalFilled = MATRIX_DOC_FIELDS.filter(f => Boolean(formData[f.numKey]?.trim())).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Header with zero-pill typography */}
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Matriks Penomoran & Tanggal Masal
                </h2>
                <span className="text-xs text-slate-500 font-medium">
                  · {totalFilled} dari {MATRIX_DOC_FIELDS.length} Berkas Terisi
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {project.namaPaket} <span className="text-slate-300">·</span> SPK: <span className="font-mono text-slate-700">{project.nomorSPK}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveAll}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4 text-emerald-400" />
              <span>Simpan Seluruh Nomor</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Toolbar & Stage Filter Tabs */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          {/* Stage Filter Segmented Buttons */}
          <div className="flex items-center p-1 bg-slate-200/70 rounded-lg border border-slate-300/60 overflow-x-auto">
            <button
              type="button"
              onClick={() => setSelectedStageFilter('all')}
              className={`px-3 py-1 rounded-md font-medium text-xs transition-colors cursor-pointer shrink-0 ${
                selectedStageFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Tahapan ({MATRIX_DOC_FIELDS.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStageFilter('Awal Kontrak')}
              className={`px-3 py-1 rounded-md font-medium text-xs transition-colors cursor-pointer shrink-0 ${
                selectedStageFilter === 'Awal Kontrak'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1. Awal Kontrak (2)
            </button>
            <button
              type="button"
              onClick={() => setSelectedStageFilter('Pelaksanaan')}
              className={`px-3 py-1 rounded-md font-medium text-xs transition-colors cursor-pointer shrink-0 ${
                selectedStageFilter === 'Pelaksanaan'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2. Pelaksanaan (3)
            </button>
            <button
              type="button"
              onClick={() => setSelectedStageFilter('Serah Terima')}
              className={`px-3 py-1 rounded-md font-medium text-xs transition-colors cursor-pointer shrink-0 ${
                selectedStageFilter === 'Serah Terima'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3. Serah Terima (4)
            </button>
            <button
              type="button"
              onClick={() => setSelectedStageFilter('Pencairan Kasda')}
              className={`px-3 py-1 rounded-md font-medium text-xs transition-colors cursor-pointer shrink-0 ${
                selectedStageFilter === 'Pencairan Kasda'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              4. Pencairan Kasda (4)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGenerateSequentialNumbers}
              className="px-3 py-1.5 bg-white hover:bg-blue-50 border border-slate-300 text-blue-700 font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
              title="Isi otomatis seluruh kolom nomor dokumen dengan format standar dinas"
            >
              <CheckCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Format Otomatis Masal</span>
            </button>

            <button
              type="button"
              onClick={handleAutoAlignChronology}
              className="px-3 py-1.5 bg-white hover:bg-emerald-50 border border-slate-300 text-emerald-800 font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
              title="Sinkronisasi tanggal seluruh dokumen agar urut secara kronologis (Anti-Backdating)"
            >
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Selaraskan Kronologi Tanggal</span>
            </button>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="px-6 py-2 bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Matrix Spreadsheet Table with Sticky Header */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs border-b border-slate-200 shadow-2xs">
                <tr className="text-slate-700 font-bold text-[11px] uppercase tracking-wider">
                  <th className="p-3 w-12 text-center border-r border-slate-200">No</th>
                  <th className="p-3 w-56 border-r border-slate-200">Nama Dokumen</th>
                  <th className="p-3 w-32 border-r border-slate-200">Tahapan</th>
                  <th className="p-3 border-r border-slate-200">Nomor Registrasi Surat Dinas</th>
                  <th className="p-3 w-48 border-r border-slate-200">Tanggal Resmi</th>
                  <th className="p-3 w-36">Penandatangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocs.map((field, idx) => {
                  const numValue = formData[field.numKey] || '';
                  const dateValue = formData[field.dateKey] || '';
                  const isFilled = Boolean(numValue.trim() && dateValue.trim());

                  return (
                    <tr 
                      key={field.type} 
                      className={`hover:bg-blue-50/30 transition-colors ${
                        idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                      }`}
                    >
                      <td className="p-3 text-center font-mono font-bold text-slate-500 border-r border-slate-100">
                        {idx + 1}
                      </td>
                      <td className="p-3 border-r border-slate-100">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${isFilled ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                          <span>{field.shortLabel}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">{field.label}</div>
                      </td>
                      <td className="p-3 border-r border-slate-100 text-slate-600 font-medium">
                        {field.stage}
                      </td>
                      <td className="p-3 border-r border-slate-100">
                        <input
                          type="text"
                          value={numValue}
                          onChange={(e) => handleFieldChange(field.numKey, e.target.value)}
                          placeholder={`Contoh: 000.4.3/.../${field.defaultPrefix}/VI/2026`}
                          className={`w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border transition-all focus:ring-2 focus:ring-blue-600 focus:outline-hidden ${
                            numValue ? 'border-slate-200 text-slate-900 bg-white font-semibold' : 'border-amber-300 bg-amber-50/20 text-slate-700'
                          }`}
                        />
                      </td>
                      <td className="p-3 border-r border-slate-100">
                        <input
                          type="date"
                          value={dateValue}
                          onChange={(e) => handleFieldChange(field.dateKey, e.target.value)}
                          className={`w-full px-2.5 py-1.5 text-xs rounded-lg border transition-all focus:ring-2 focus:ring-blue-600 focus:outline-hidden ${
                            dateValue ? 'border-slate-200 text-slate-900 bg-white font-medium' : 'border-amber-300 bg-amber-50/20 text-slate-700'
                          }`}
                        />
                        {dateValue && (
                          <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                            {formatTanggalIndonesia(dateValue)}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-600 font-medium text-[11px]">
                        {field.authority}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 text-xs flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Perubahan nomor dan tanggal langsung diperbarui pada seluruh lembar cetak A4 dan Google Docs.</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-xl font-medium transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-4 h-4 text-emerald-400" />
              <span>Simpan & Terapkan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

