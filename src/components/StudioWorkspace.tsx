import React, { useState, useEffect } from 'react';
import { 
  ProjectContract, 
  KopDinasConfig, 
  DocumentType 
} from '../types';
import { 
  ALL_DOCUMENTS_CATALOG, 
  DocumentCatalogItem,
  createGoogleDocFromProject 
} from '../utils/googleDocsService';
import { getAccessToken, googleSignIn } from '../lib/firebase';
import { formatRupiah, formatTanggalIndonesia } from '../utils/terbilang';
import { GoogleDocsPreview } from './GoogleDocsPreview';
import { DocumentRenderer } from './DocumentRenderer';
import { PreFlightAuditModal } from './PreFlightAuditModal';
import { QuickInspectorDrawer } from './QuickInspectorDrawer';
import { QuickJumpPalette } from './QuickJumpPalette';
import { QuickDockBar } from './QuickDockBar';
import { BAPFinancialCalculator } from './BAPFinancialCalculator';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { BulkRegisterMatrixModal } from './BulkRegisterMatrixModal';
import { SmartPackageTitle } from './SmartPackageTitle';
import { SmartVendorTitle } from './SmartVendorTitle';
import { SmartSPKTitle } from './SmartSPKTitle';
import { checkDocumentReadiness, DOSSIER_PRESETS, DossierPreset } from '../utils/documentReadiness';
import { validateProject } from '../utils/validator';
import { 
  FileText, 
  Printer, 
  ShieldCheck, 
  Edit, 
  Check, 
  Cloud, 
  FolderSync, 
  ChevronRight, 
  ChevronLeft,
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Download,
  AlertCircle,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowLeft,
  ArrowRight,
  SlidersHorizontal,
  Search,
  ChevronDown,
  ChevronUp,
  Calculator,
  Keyboard,
  TableProperties
} from 'lucide-react';

interface StudioWorkspaceProps {
  projects: ProjectContract[];
  selectedProject: ProjectContract;
  onSelectProject: (projectId: string) => void;
  selectedDoc: DocumentType;
  onSelectDoc: (doc: DocumentType) => void;
  previewMode: 'googledocs' | 'print';
  onSelectPreviewMode: (mode: 'googledocs' | 'print') => void;
  kopConfig: KopDinasConfig;
  onSaveProject: (updated: ProjectContract) => void;
  onEditProject: (project: ProjectContract) => void;
  onBatchPrint: () => void;
  onAudit: () => void;
  onOpenVersionHistory?: () => void;
  onOpenBundleExporter?: () => void;
}

const STAGE_ORDER: Array<{ stage: DocumentCatalogItem['stage']; label: string; count: number }> = [
  { stage: 'Awal Kontrak', label: '1. Persiapan & Lapangan', count: 2 },
  { stage: 'Pelaksanaan', label: '2. Pelaksanaan & Mutu', count: 3 },
  { stage: 'Serah Terima', label: '3. Serah Terima & BAPHP', count: 4 },
  { stage: 'Pencairan Kasda', label: '4. Keuangan & Pencairan', count: 4 }
];

export const StudioWorkspace: React.FC<StudioWorkspaceProps> = ({
  projects,
  selectedProject,
  onSelectProject,
  selectedDoc,
  onSelectDoc,
  previewMode,
  onSelectPreviewMode,
  kopConfig,
  onSaveProject,
  onEditProject,
  onBatchPrint,
  onAudit,
  onOpenVersionHistory,
  onOpenBundleExporter
}) => {
  const [isBatchSyncing, setIsBatchSyncing] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<string>('');
  const [batchSuccessMessage, setBatchSuccessMessage] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isLegalAuditOpen, setIsLegalAuditOpen] = useState<boolean>(false);
  const [isQuickInspectorOpen, setIsQuickInspectorOpen] = useState<boolean>(false);
  const [isQuickJumpOpen, setIsQuickJumpOpen] = useState<boolean>(false);
  const [activeDossierPreset, setActiveDossierPreset] = useState<DossierPreset>('all');
  const [isTerminDetailsOpen, setIsTerminDetailsOpen] = useState<boolean>(false);
  const [isPackageCardOpen, setIsPackageCardOpen] = useState<boolean>(true);
  const [isDossierCardOpen, setIsDossierCardOpen] = useState<boolean>(true);
  const [isBapCalcOpen, setIsBapCalcOpen] = useState<boolean>(true);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState<boolean>(false);
  const [isBulkMatrixOpen, setIsBulkMatrixOpen] = useState<boolean>(false);

  const isTerminMode = selectedProject.skemaPembayaran === 'termin' && Boolean(selectedProject.daftarTermin?.length);
  const activeTerminIndex = selectedProject.activeTerminIndex ?? 0;
  const activeTermin = isTerminMode ? (selectedProject.daftarTermin![activeTerminIndex] || selectedProject.daftarTermin![0]) : null;

  const handleSwitchTermin = (index: number) => {
    const updated: ProjectContract = {
      ...selectedProject,
      activeTerminIndex: index
    };
    onSaveProject(updated);
  };

  const auditResult = validateProject(selectedProject);

  const activeDocItem = ALL_DOCUMENTS_CATALOG.find(d => d.type === selectedDoc) || ALL_DOCUMENTS_CATALOG[0];

  const currentIndex = ALL_DOCUMENTS_CATALOG.findIndex(d => d.type === selectedDoc);
  const currentSafeIndex = currentIndex >= 0 ? currentIndex : 0;
  const prevDoc = currentSafeIndex > 0 ? ALL_DOCUMENTS_CATALOG[currentSafeIndex - 1] : null;
  const nextDoc = currentSafeIndex < ALL_DOCUMENTS_CATALOG.length - 1 ? ALL_DOCUMENTS_CATALOG[currentSafeIndex + 1] : null;

  // Keyboard shortcut listener: Ctrl+K (Quick Jump), Alt + Right (Next), Alt + Left (Prev), Alt + S (Toggle Focus Mode), Alt + M (Bulk Matrix), Alt + E (Inspector), ? (Shortcuts)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsQuickJumpOpen(prev => !prev);
      } else if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        if (nextDoc) onSelectDoc(nextDoc.type);
      } else if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        if (prevDoc) onSelectDoc(prevDoc.type);
      } else if (e.altKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        setIsSidebarCollapsed(prev => !prev);
      } else if (e.altKey && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        setIsBulkMatrixOpen(prev => !prev);
      } else if (e.altKey && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        setIsQuickInspectorOpen(prev => !prev);
      } else if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setIsShortcutsModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prevDoc, nextDoc, onSelectDoc]);

  // Batch generate all 13 documents into Google Drive
  const handleBatchSyncAll = async () => {
    let token = await getAccessToken();
    if (!token) {
      try {
        const res = await googleSignIn();
        if (!res) return;
        token = res.accessToken;
      } catch (err) {
        return;
      }
    }
    if (!token) return;

    setIsBatchSyncing(true);
    setBatchSuccessMessage(null);

    let updatedDocs = { ...(selectedProject.googleDocs || {}) };
    let successCount = 0;

    for (let i = 0; i < ALL_DOCUMENTS_CATALOG.length; i++) {
      const docItem = ALL_DOCUMENTS_CATALOG[i];
      setBatchProgress(`${i + 1}/${ALL_DOCUMENTS_CATALOG.length} (${docItem.shortLabel})`);

      try {
        const res = await createGoogleDocFromProject(token, selectedProject, kopConfig, docItem.type);
        updatedDocs[docItem.type] = {
          documentId: res.documentId,
          webViewLink: res.webViewLink,
          updatedAt: new Date().toISOString()
        };
        successCount++;
      } catch (e) {
        console.error(`Gagal membuat ${docItem.type}:`, e);
      }
    }

    const updatedProj: ProjectContract = {
      ...selectedProject,
      googleDocs: updatedDocs,
      updatedAt: new Date().toISOString()
    };

    onSaveProject(updatedProj);
    setIsBatchSyncing(false);
    setBatchProgress('');
    setBatchSuccessMessage(`Semua ${successCount} Berita Acara berhasil dibuat di Google Drive.`);
    setTimeout(() => setBatchSuccessMessage(null), 6000);
  };

  // Count how many docs have been created in Google Docs for the current project
  const docsCreatedCount = ALL_DOCUMENTS_CATALOG.filter(
    d => Boolean(selectedProject.googleDocs?.[d.type]?.documentId)
  ).length;

  return (
    <div className="flex flex-col lg:flex-row gap-5 items-start">
      {/* ============================================================== */}
      {/* LEFT SIDEBAR: DOSSIER DOKUMEN PENGADAAN (320px)                */}
      {/* ============================================================== */}
      {!isSidebarCollapsed && (
        <aside className="no-print w-full lg:w-80 shrink-0 flex flex-col gap-4">
          {/* 1. Paket Proyek Selector Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <button
              type="button"
              onClick={() => setIsPackageCardOpen(!isPackageCardOpen)}
              className="font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer text-left"
            >
              <span>Paket Pekerjaan Aktif</span>
              {isPackageCardOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
            </button>
            <span className="font-mono tabular-nums text-slate-400 text-[11px]">
              {projects.length} Paket
            </span>
          </div>

          {/* Option 1+2+3 Smart Package Card Title */}
          <div className="pt-1">
            <SmartPackageTitle project={selectedProject} layout="sidebar-card" />
          </div>

          <div>
            <label htmlFor="package-select" className="sr-only">Pilih Paket Proyek</label>
            <select
              id="package-select"
              value={selectedProject.id}
              onChange={(e) => onSelectProject(e.target.value)}
              className="w-full text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-600 focus:outline-hidden cursor-pointer"
            >
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.lokasi} — {proj.namaPaket}
                </option>
              ))}
            </select>
          </div>

          {/* Collapsible Context Summary */}
          {isPackageCardOpen && (
            <div className="space-y-3 pt-2 border-t border-slate-100 text-xs animate-in fade-in duration-150">
              <div className="space-y-2 text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Nilai Kontrak:</span>
                  <span className="font-bold text-slate-900 font-mono tabular-nums">
                    {formatRupiah(selectedProject.nilaiSPK)}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-400 shrink-0">Nomor & Tgl SPK:</span>
                  <div className="max-w-[170px] text-right">
                    <SmartSPKTitle 
                      nomorSPK={selectedProject.nomorSPK} 
                      tanggalSPK={selectedProject.tanggalSPK} 
                      project={selectedProject} 
                    />
                  </div>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-400 shrink-0">Rekanan:</span>
                  <div className="max-w-[170px] text-right">
                    <SmartVendorTitle vendor={selectedProject.penyedia} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Status Verifikasi:</span>
                  <span className="flex items-center gap-1 text-[11px] font-medium text-slate-700">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      selectedProject.statusVerifikasi === 'diverifikasi' ? 'bg-emerald-600' : 'bg-amber-500'
                    }`} />
                    <span>{selectedProject.statusVerifikasi === 'diverifikasi' ? 'Terverifikasi' : 'Perlu Tinjauan'}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <span className="text-slate-400">Kepatuhan Hukum:</span>
                  <button
                    type="button"
                    onClick={() => setIsLegalAuditOpen(true)}
                    className={`text-[11px] font-semibold flex items-center gap-1 hover:underline cursor-pointer ${
                      auditResult.isValid ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                    title="Klik untuk membuka rincian audit kepatuhan hukum"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{auditResult.score}% Sah</span>
                  </button>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setIsBulkMatrixOpen(true)}
                  className="w-full px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  title="Buka tabel matriks penomoran masal seluruh dokumen (Alt + M)"
                >
                  <TableProperties className="w-3.5 h-3.5 text-blue-600" />
                  <span>Matriks Nomor & Tanggal (15 Dok)</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onEditProject(selectedProject)}
                    className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="Ubah data kontrak dan Berita Acara"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Ubah Kontrak</span>
                  </button>
                  <button
                    onClick={onAudit}
                    className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="Audit akurasi dan jejak rekam data"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Audit Akurasi</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. Skema Multi-Termin Card (If project uses termin) */}
        {isTerminMode && activeTermin && (
          <div className="bg-white rounded-xl border border-slate-200 p-3.5 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                Skema Multi-Termin ({selectedProject.daftarTermin?.length} Tahap)
              </span>
              <span className="font-mono text-xs font-bold text-slate-800">
                {activeTermin.bobotKumulatif}% Aktif
              </span>
            </div>

            {/* Termin Quick Switcher Chips */}
            <div className="grid grid-cols-3 gap-1.5 pt-0.5">
              {selectedProject.daftarTermin!.map((term, tIdx) => {
                const isActive = tIdx === activeTerminIndex;
                return (
                  <button
                    key={term.id || tIdx}
                    type="button"
                    onClick={() => handleSwitchTermin(tIdx)}
                    className={`px-1.5 py-1.5 rounded-lg text-center text-xs transition-all cursor-pointer border ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-bold'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                    title={`${term.namaTermin} (${term.bobotKumulatif}%) - Status: ${term.status}`}
                  >
                    <div className="font-semibold text-[11px] truncate">{term.namaTermin.split(' ')[0]} {term.namaTermin.split(' ')[1] || ''}</div>
                    <div className={`text-[9px] uppercase font-mono ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                      {term.bobotKumulatif}%
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Netto Highlight */}
            <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200/80 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-emerald-800 uppercase font-bold block">Netto Cair Kasda:</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">{formatRupiah(activeTermin.nilaiNetto)}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsTerminDetailsOpen(!isTerminDetailsOpen)}
                className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer bg-white px-2 py-1 rounded border border-emerald-200"
              >
                <span>{isTerminDetailsOpen ? 'Tutup' : 'Rincian'}</span>
                {isTerminDetailsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {/* Collapsible Detailed Financial Breakdown & Advisory */}
            {isTerminDetailsOpen && (
              <div className="space-y-2 pt-1 border-t border-slate-100 text-xs animate-in fade-in duration-150">
                <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg text-[11px]">
                  <div className="flex justify-between text-slate-600">
                    <span>Nilai Bruto:</span>
                    <span className="font-mono font-bold text-slate-900">{formatRupiah(activeTermin.nilaiBruto)}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Potongan UM:</span>
                    <span className="font-mono font-bold">{activeTermin.potonganUangMuka > 0 ? `(${formatRupiah(activeTermin.potonganUangMuka)})` : 'Rp 0'}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Retensi (5%):</span>
                    <span className="font-mono font-bold">{activeTermin.potonganRetensi > 0 ? `(${formatRupiah(activeTermin.potonganRetensi)})` : 'Rp 0'}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>PPh Pajak:</span>
                    <span className="font-mono font-bold">({formatRupiah(activeTermin.pphNilai)})</span>
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-blue-50 text-[10px] text-blue-900 leading-relaxed border border-blue-100">
                  {activeTermin.bobotKumulatif < 100 ? (
                    <span><strong>Termin Antara ({activeTermin.bobotKumulatif}%):</strong> Dokumen cair: BAP Termin, BAKP Kemajuan Fisik, Kuitansi & Kendali.</span>
                  ) : (
                    <span><strong>Termin Akhir (100%):</strong> Terbitkan BAPHP & BAST untuk serah terima fisik & pencatatan BMD.</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. Daftar Dokumen Berita Acara (15 Dokumen Lengkap) */}
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsDossierCardOpen(!isDossierCardOpen)}
              className="text-xs font-bold uppercase tracking-wider text-slate-900 hover:text-blue-700 flex items-center gap-1.5 cursor-pointer text-left"
            >
              <span>Dossier Berita Acara</span>
              {isDossierCardOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
            </button>
            <div className="text-[11px] font-mono tabular-nums text-slate-500">
              {docsCreatedCount}/{ALL_DOCUMENTS_CATALOG.length} Siap
            </div>
          </div>

          {/* Progress bar of Google Docs synchronization */}
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-blue-600 h-full transition-all duration-300"
              style={{ width: `${(docsCreatedCount / ALL_DOCUMENTS_CATALOG.length) * 100}%` }}
            />
          </div>

          {/* Collapsible Document List */}
          {isDossierCardOpen && (
            <div className="space-y-3 pt-1 animate-in fade-in duration-150">
              {/* Grouped stages */}
              {STAGE_ORDER.map(({ stage, label }) => {
                const activePresetConfig = DOSSIER_PRESETS.find(p => p.id === activeDossierPreset) || DOSSIER_PRESETS[0];
                const stageDocs = ALL_DOCUMENTS_CATALOG.filter(d => 
                  d.stage === stage && activePresetConfig.docTypes.includes(d.type)
                );

                if (stageDocs.length === 0) return null;

                return (
                  <div key={stage} className="space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                      {label}
                    </div>
                    <div className="space-y-0.5">
                      {stageDocs.map((docItem) => {
                        const isSelected = selectedDoc === docItem.type;
                        const isCreated = Boolean(selectedProject.googleDocs?.[docItem.type]?.documentId);
                        const readiness = checkDocumentReadiness(selectedProject, docItem.type);

                        return (
                          <button
                            key={docItem.type}
                            onClick={() => onSelectDoc(docItem.type)}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                              isSelected
                                ? 'bg-slate-900 text-white font-semibold shadow-xs'
                                : 'text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="truncate font-medium text-[11.5px]">{docItem.shortLabel}</span>
                                {readiness.isReady ? (
                                  <span title="Data Lengkap (Siap Cetak)" className="shrink-0 flex items-center">
                                    <CheckCircle2 className={`w-3 h-3 ${isSelected ? 'text-emerald-300' : 'text-emerald-500'}`} />
                                  </span>
                                ) : (
                                  <span title={`${readiness.missingFields.length} Data belum lengkap: ${readiness.missingFields.join(', ')}`} className="shrink-0 flex items-center">
                                    <AlertTriangle className={`w-3 h-3 ${isSelected ? 'text-amber-300' : 'text-amber-500'}`} />
                                  </span>
                                )}
                              </div>
                              <div className={`text-[10px] truncate ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                                {docItem.label.split('. ')[1] || docItem.label}
                              </div>
                            </div>

                            <div className="shrink-0 flex items-center gap-1">
                              {isCreated ? (
                                <span 
                                  className={`flex items-center gap-1 text-[10px] font-medium ${
                                    isSelected ? 'text-emerald-300' : 'text-emerald-700'
                                  }`}
                                  title="Sudah tersinkronisasi ke Google Drive"
                                >
                                  <Check className="w-3 h-3 text-emerald-500" />
                                  <span>Drive</span>
                                </span>
                              ) : (
                                <span className={`text-[10px] ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>
                                  Draf
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Batch Sync Button & Message */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <button
              onClick={handleBatchSyncAll}
              disabled={isBatchSyncing}
              className="w-full py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Buat semua 13 dokumen Berita Acara sekaligus ke Google Drive"
            >
              <FolderSync className={`w-3.5 h-3.5 ${isBatchSyncing ? 'animate-spin text-blue-600' : ''}`} />
              <span>
                {isBatchSyncing ? `Sinkronisasi ${batchProgress}...` : 'Buat Semua 13 Dokumen ke Drive'}
              </span>
            </button>

            {batchSuccessMessage && (
              <div className="p-2 text-[11px] bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{batchSuccessMessage}</span>
              </div>
            )}
          </div>
        </div>
      </aside>
      )}

      {/* ============================================================== */}
      {/* MAIN WORKSPACE CANVAS: EDITOR & VIEWER                        */}
      {/* ============================================================== */}
      <main className="flex-1 w-full min-w-0 space-y-3.5">
        {/* Unified Studio Command Deck & Quick Dock */}
        <QuickDockBar
          project={selectedProject}
          selectedDoc={selectedDoc}
          onSelectDoc={onSelectDoc}
          onOpenQuickJump={() => setIsQuickJumpOpen(true)}
          activePreset={activeDossierPreset}
          onSelectPreset={setActiveDossierPreset}
          previewMode={previewMode}
          onSelectPreviewMode={onSelectPreviewMode}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(prev => !prev)}
          onSinglePrint={() => window.print()}
          onBatchPrint={onBatchPrint}
          onOpenQuickInspector={() => setIsQuickInspectorOpen(true)}
          onOpenBulkMatrix={() => setIsBulkMatrixOpen(true)}
          onOpenAudit={() => setIsLegalAuditOpen(true)}
          onOpenVersionHistory={onOpenVersionHistory}
          onOpenBundleExporter={onOpenBundleExporter}
          auditScore={auditResult.score}
          auditIsValid={auditResult.isValid}
          auditHasErrors={auditResult.issues.some(i => i.severity === 'error')}
        />

        {/* Dedicated BAP Financial Calculator Widget (When on BAP document) */}
        {selectedDoc === 'BAP' && (
          <div className="no-print space-y-2">
            <div className="flex items-center justify-between bg-blue-50/80 border border-blue-200 px-3.5 py-2 rounded-xl text-xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <Calculator className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">Kalkulator Pembayaran BAP Real-Time</span>
                  <span className="text-[10.5px] text-slate-500">Hitung nilai SPK, prestasi kemajuan fisik, potongan uang muka, retensi & PPh</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBapCalcOpen(prev => !prev)}
                className="px-3 py-1 bg-white hover:bg-slate-100 border border-blue-300 text-blue-700 font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>{isBapCalcOpen ? 'Sembunyikan Kalkulator' : 'Buka Kalkulator BAP'}</span>
                {isBapCalcOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {isBapCalcOpen && (
              <BAPFinancialCalculator
                project={selectedProject}
                onUpdateProject={onSaveProject}
              />
            )}
          </div>
        )}

        {/* Studio Canvas: Google Docs Live vs A4 Physical Print */}
        <div className="bg-[#edf0f4] p-3 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs transition-all">
          {previewMode === 'googledocs' ? (
            <GoogleDocsPreview
              project={selectedProject}
              kopConfig={kopConfig}
              selectedDoc={selectedDoc}
              onDocChange={onSelectDoc}
              onUpdateProjectDocs={onSaveProject}
              hideInternalDocSelector={true}
            />
          ) : (
            <DocumentRenderer
              project={selectedProject}
              kopConfig={kopConfig}
              selectedDoc={selectedDoc}
              onSelectDoc={onSelectDoc}
              onOpenVerification={onAudit}
              onSwitchToGoogleDocs={() => onSelectPreviewMode('googledocs')}
              hideDocSelector={true}
              onUpdateProject={onSaveProject}
            />
          )}
        </div>

        {/* ============================================================== */}
        {/* SEQUENTIAL DOSSIER PAGER (SLEEK & COMPACT NAVIGATOR)           */}
        {/* ============================================================== */}
        <div className="no-print bg-white rounded-xl border border-slate-200 px-4 py-2.5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          {/* Prev Document Button */}
          <div>
            {prevDoc ? (
              <button
                type="button"
                onClick={() => onSelectDoc(prevDoc.type)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer group"
                title={`Kembali ke: ${prevDoc.label}`}
              >
                <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
                <span className="truncate max-w-[150px] font-medium">{prevDoc.shortLabel}</span>
              </button>
            ) : (
              <div className="px-3 py-1.5 text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg flex items-center gap-1.5 bg-slate-50/50">
                <Check className="w-3 h-3 text-slate-400" />
                <span>Dokumen Awal (No. 1)</span>
              </div>
            )}
          </div>

          {/* Center: Stage Progress & Clickable Stepper Dots */}
          <div className="flex items-center gap-3">
            <span className="text-slate-500 font-medium hidden md:inline text-[11.5px]">
              <strong className="text-slate-800">{activeDocItem.stage}</strong> · {currentSafeIndex + 1}/{ALL_DOCUMENTS_CATALOG.length}
            </span>

            {/* Stepper Dots */}
            <div className="flex items-center gap-1">
              {ALL_DOCUMENTS_CATALOG.map((item, idx) => {
                const isCurrent = idx === currentSafeIndex;
                const isCreated = Boolean(selectedProject.googleDocs?.[item.type]?.documentId);
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => onSelectDoc(item.type)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      isCurrent
                        ? 'w-4 bg-blue-600'
                        : isCreated
                        ? 'w-1.5 bg-emerald-500 hover:bg-emerald-600'
                        : 'w-1.5 bg-slate-200 hover:bg-slate-400'
                    }`}
                    title={`${idx + 1}. ${item.label} (${isCreated ? 'Tersimpan di Drive' : 'Draf'})`}
                  />
                );
              })}
            </div>
          </div>

          {/* Next Document Button */}
          <div>
            {nextDoc ? (
              <button
                type="button"
                onClick={() => onSelectDoc(nextDoc.type)}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs group"
                title={`Lanjut ke: ${nextDoc.label}`}
              >
                <span className="truncate max-w-[150px] font-bold">{nextDoc.shortLabel}</span>
                <ArrowRight className="w-3.5 h-3.5 text-blue-200 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onBatchPrint}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Selesai (Cetak Bundel)</span>
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Pre-Flight Legal Audit Guard Modal */}
      <PreFlightAuditModal
        isOpen={isLegalAuditOpen}
        onClose={() => setIsLegalAuditOpen(false)}
        project={selectedProject}
        onEditProject={onEditProject}
        onProceedToPrint={onBatchPrint}
      />

      {/* Bulk Register Number & Date Matrix Editor Modal (Alt + M) */}
      <BulkRegisterMatrixModal
        isOpen={isBulkMatrixOpen}
        onClose={() => setIsBulkMatrixOpen(false)}
        project={selectedProject}
        onSave={onSaveProject}
      />

      {/* Quick Variable Inspector Drawer (PandaDoc Style) */}
      <QuickInspectorDrawer
        isOpen={isQuickInspectorOpen}
        onClose={() => setIsQuickInspectorOpen(false)}
        project={selectedProject}
        selectedDoc={selectedDoc}
        onUpdateProject={onSaveProject}
      />

      {/* Quick Jump Command Palette (Ctrl+K) */}
      <QuickJumpPalette
        isOpen={isQuickJumpOpen}
        onClose={() => setIsQuickJumpOpen(false)}
        project={selectedProject}
        selectedDoc={selectedDoc}
        onSelectDoc={onSelectDoc}
      />

      {/* Keyboard Shortcuts Palette (Press ?) */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      {/* Discreet Floating Keyboard Shortcut Trigger */}
      <button
        type="button"
        onClick={() => setIsShortcutsModalOpen(true)}
        className="no-print fixed bottom-4 right-4 p-2 bg-white/90 hover:bg-white text-slate-500 hover:text-slate-900 border border-slate-200 rounded-full shadow-md backdrop-blur-xs transition-all cursor-pointer z-20 flex items-center gap-1 text-[11px] font-mono group"
        title="Buka daftar pintasan keyboard (Tekan ?)"
      >
        <Keyboard className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-600" />
        <span className="hidden sm:inline font-bold pr-1">?</span>
      </button>
    </div>
  );
};
