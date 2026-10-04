import React, { useState } from 'react';
import { DocumentType, ProjectContract } from '../types';
import { ALL_DOCUMENTS_CATALOG } from '../utils/googleDocsService';
import { checkDocumentReadiness, DossierPreset } from '../utils/documentReadiness';
import { SmartPackageTitle } from './SmartPackageTitle';
import { 
  ChevronDown, 
  Printer, 
  FileText, 
  SlidersHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  TableProperties,
  FolderArchive,
  History
} from 'lucide-react';

interface QuickDockBarProps {
  project: ProjectContract;
  selectedDoc: DocumentType;
  onSelectDoc: (doc: DocumentType) => void;
  onOpenQuickJump: () => void;
  activePreset: DossierPreset;
  onSelectPreset: (preset: DossierPreset) => void;
  previewMode: 'googledocs' | 'print';
  onSelectPreviewMode: (mode: 'googledocs' | 'print') => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onSinglePrint: () => void;
  onBatchPrint: () => void;
  onOpenQuickInspector: () => void;
  onOpenBulkMatrix: () => void;
  onOpenAudit: () => void;
  onOpenVersionHistory?: () => void;
  onOpenBundleExporter?: () => void;
  auditScore: number;
  auditIsValid: boolean;
  auditHasErrors: boolean;
}

export const QuickDockBar: React.FC<QuickDockBarProps> = ({
  project,
  selectedDoc,
  onSelectDoc,
  onOpenQuickJump,
  activePreset,
  onSelectPreset,
  previewMode,
  onSelectPreviewMode,
  isSidebarCollapsed,
  onToggleSidebar,
  onSinglePrint,
  onBatchPrint,
  onOpenQuickInspector,
  onOpenBulkMatrix,
  onOpenAudit,
  onOpenVersionHistory,
  onOpenBundleExporter,
  auditScore,
  auditIsValid,
  auditHasErrors
}) => {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const activeDocItem = ALL_DOCUMENTS_CATALOG.find(d => d.type === selectedDoc) || ALL_DOCUMENTS_CATALOG[0];
  const activeDocIndex = ALL_DOCUMENTS_CATALOG.findIndex(d => d.type === selectedDoc) + 1;
  const activeReadiness = checkDocumentReadiness(project, selectedDoc);

  return (
    <div className="no-print bg-white border border-slate-200/90 rounded-2xl shadow-2xs p-3 transition-all text-xs">
      {/* Sleek Single Row Command Deck */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        {/* Left: Focus Toggle + Active Document & Package Breadcrumb */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onToggleSidebar}
            className={`p-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer shrink-0 font-medium ${
              isSidebarCollapsed
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title={isSidebarCollapsed ? 'Buka daftar berkas (Alt + S)' : 'Tutup daftar berkas / Mode fokus (Alt + S)'}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-blue-600" />
            ) : (
              <PanelLeftClose className="w-4 h-4 text-slate-500" />
            )}
            <span className="hidden sm:inline text-[11px]">
              {isSidebarCollapsed ? 'Buka Berkas' : 'Fokus'}
            </span>
          </button>

          {/* Active Document Indicator (Clickable to Quick Jump) */}
          <button
            type="button"
            onClick={onOpenQuickJump}
            className="flex items-center gap-2 px-2.5 py-1 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200 rounded-lg text-left transition-colors cursor-pointer shrink-0 max-w-[240px] sm:max-w-[320px]"
            title="Klik untuk mencari atau lompat ke dokumen lain (Ctrl + K)"
          >
            <span className="w-4 h-4 rounded bg-blue-600 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
              {activeDocIndex}
            </span>
            <span className="truncate font-bold text-slate-900 text-[11.5px]">
              {activeDocItem.label}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </button>

          <div className="min-w-0 hidden xl:block max-w-[240px]">
            <SmartPackageTitle project={project} layout="compact-header" />
          </div>
        </div>

        {/* Right: View Toggle, Bulk Matrix, Audit, Edit & Print Actions */}
        <div className="flex items-center justify-between lg:justify-end gap-2 shrink-0 flex-wrap">
          {/* View Mode Toggle: Google Docs vs Cetak A4 */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200/90 text-[11px]">
            <button
              type="button"
              onClick={() => onSelectPreviewMode('googledocs')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 cursor-pointer text-left ${
                previewMode === 'googledocs'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              <FileText className={`w-4.5 h-4.5 ${previewMode === 'googledocs' ? 'text-blue-600' : 'text-slate-400'}`} />
              <div className="leading-tight">
                <span className="block text-[11.5px] font-bold">Google Docs</span>
                <span className="block text-[9.5px] text-slate-400 font-normal mt-0.5">Editor Live</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onSelectPreviewMode('print')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 cursor-pointer text-left ${
                previewMode === 'print'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              <Printer className={`w-4.5 h-4.5 ${previewMode === 'print' ? 'text-blue-600' : 'text-slate-400'}`} />
              <div className="leading-tight">
                <span className="block text-[11.5px] font-bold">Cetak A4</span>
                <span className="block text-[9.5px] text-slate-400 font-normal mt-0.5">Prinjau Fisik</span>
              </div>
            </button>
          </div>

          {/* Matriks Penomoran Masal Button */}
          <button
            type="button"
            onClick={onOpenBulkMatrix}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-[11px] flex items-center gap-2 transition-all cursor-pointer shadow-2xs text-left"
            title="Kelola seluruh nomor dan tanggal 15 berkas dalam 1 tabel spreadsheet (Alt + M)"
          >
            <TableProperties className="w-4.5 h-4.5 text-blue-600 shrink-0" />
            <div className="leading-tight">
              <span className="block font-bold text-[11.5px] text-slate-900">Matriks Nomor</span>
              <span className="block text-[9.5px] text-slate-500 font-normal mt-0.5">Masal 15 Berkas (Alt+M)</span>
            </div>
          </button>

          {/* Audit Pra-Pencairan Button */}
          <button
            type="button"
            onClick={onOpenAudit}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 transition-all flex items-center gap-2 cursor-pointer text-[11px] shadow-2xs text-left"
            title="Pemeriksaan keabsahan dokumen untuk pengajuan SPP-LS ke Kasda"
          >
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              auditIsValid ? 'bg-emerald-500 animate-pulse' : auditHasErrors ? 'bg-red-500' : 'bg-amber-400'
            }`} />
            <div className="leading-tight">
              <span className="block font-bold text-[11.5px] text-slate-900">Audit Legal</span>
              <span className={`block text-[9.5px] font-semibold mt-0.5 ${
                auditIsValid ? 'text-emerald-600' : auditHasErrors ? 'text-red-600' : 'text-amber-600'
              }`}>
                {auditScore}% Sah (Pre-Flight)
              </span>
            </div>
          </button>

          {/* 1-Click Bundel 15 Berkas ZIP Button */}
          {onOpenBundleExporter && (
            <button
              type="button"
              onClick={onOpenBundleExporter}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] flex items-center gap-2 transition-all cursor-pointer shadow-xs text-left"
              title="Unduh sekaligus 15 berkas SPP-LS dalam 1 file ZIP atau cetak ordner A4"
            >
              <FolderArchive className="w-4.5 h-4.5 text-blue-200 shrink-0" />
              <div className="leading-tight">
                <span className="block font-bold text-[11.5px] text-white">Bundel 15 Berkas</span>
                <span className="block text-[9.5px] text-blue-200 font-normal mt-0.5">ZIP & Ordner A4</span>
              </div>
            </button>
          )}

          {/* Histori Versi & Audit Log Button */}
          {onOpenVersionHistory && (
            <button
              type="button"
              onClick={onOpenVersionHistory}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-[11px] flex items-center gap-2 transition-all cursor-pointer shadow-2xs text-left"
              title="Lihat rekam histori perubahan versi dan log audit BPK/Inspektorat"
            >
              <History className="w-4.5 h-4.5 text-slate-600 shrink-0" />
              <div className="leading-tight">
                <span className="block font-bold text-[11.5px] text-slate-900">Log Audit</span>
                <span className="block text-[9.5px] text-slate-500 font-normal mt-0.5">Histori Versi</span>
              </div>
            </button>
          )}

          {/* Unified Export & Print Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11px] flex items-center gap-2 transition-all cursor-pointer shadow-2xs text-left"
            >
              <Printer className="w-4.5 h-4.5 text-blue-300 shrink-0" />
              <div className="leading-tight">
                <span className="block font-bold tracking-tight text-[11.5px] text-white">Cetak / Unduh</span>
                <span className="block text-[9.5px] text-blue-200 font-normal mt-0.5">A4 & Bundel SPP-LS</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-300 ml-0.5" />
            </button>

            {isExportMenuOpen && (
              <div 
                className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
                onClick={() => setIsExportMenuOpen(false)}
              >
                <button
                  type="button"
                  onClick={onSinglePrint}
                  className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 hover:text-slate-900 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-blue-600" />
                  <div>
                    <span className="font-semibold block">Cetak Lembar Ini</span>
                    <span className="text-[10px] text-slate-400">Format resmi A4 siap tanda tangan</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={onBatchPrint}
                  className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 hover:text-slate-900 cursor-pointer border-t border-slate-100"
                >
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="font-semibold block">Cetak 1 Bundel Lengkap</span>
                    <span className="text-[10px] text-slate-400">Seluruh dokumen berurutan untuk SPP-LS</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

