import React, { useState, useEffect } from 'react';
import { ProjectContract, KopDinasConfig, DocumentType } from '../types';
import { 
  createGoogleDocFromProject, 
  exportGoogleDocAsPdf, 
  savePdfToGoogleDrive, 
  downloadBlobLocally,
  ALL_DOCUMENTS_CATALOG,
  DocumentCatalogItem
} from '../utils/googleDocsService';
import { getAccessToken, googleSignIn } from '../lib/firebase';
import { 
  FileText, 
  Download, 
  ExternalLink, 
  Cloud, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  ArrowUpRight,
  Printer,
  Check,
  FolderSync
} from 'lucide-react';

interface GoogleDocsPreviewProps {
  project: ProjectContract;
  kopConfig: KopDinasConfig;
  selectedDoc: DocumentType;
  onDocChange: (doc: DocumentType) => void;
  onUpdateProjectDocs?: (updatedProject: ProjectContract) => void;
  hideInternalDocSelector?: boolean;
}

export const GoogleDocsPreview: React.FC<GoogleDocsPreviewProps> = ({
  project,
  kopConfig,
  selectedDoc,
  onDocChange,
  onUpdateProjectDocs,
  hideInternalDocSelector = false
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isSavingToDrive, setIsSavingToDrive] = useState<boolean>(false);
  const [isBatchSyncing, setIsBatchSyncing] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<string>('');
  const [activeStageFilter, setActiveStageFilter] = useState<'all' | 'Awal Kontrak' | 'Pelaksanaan' | 'Serah Terima' | 'Pencairan Kasda'>('all');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string; link?: string } | null>(null);

  // Check current doc info from project.googleDocs
  const currentDocInfo = project.googleDocs?.[selectedDoc];
  const activeCatalogItem = ALL_DOCUMENTS_CATALOG.find(d => d.type === selectedDoc) || ALL_DOCUMENTS_CATALOG[0];

  useEffect(() => {
    getAccessToken().then(tok => {
      setToken(tok);
    });
  }, []);

  const handleSignIn = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const res = await googleSignIn();
      if (res?.accessToken) {
        setToken(res.accessToken);
        setStatusMessage({
          type: 'success',
          text: `Berhasil terhubung dengan akun Google: ${res.user.email}`
        });
      }
    } catch (err: any) {
      console.warn('Google Sign In handle error:', err);
      let text = `Gagal menghubungkan akun Google: ${err.message || 'Perizinan dibatalkan'}`;
      if (err?.code === 'auth/unauthorized-domain') {
        text = 'Aplikasi berjalan dalam Mode Pratinjau Cetak Lokal. Seluruh 15 berkas SPP-LS tetap dapat dicetak dan diunduh langsung tanpa perlu login Google.';
      } else if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        text = 'Proses login Google dibatalkan oleh pengguna.';
      }
      setStatusMessage({
        type: 'info',
        text
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrSyncGoogleDoc = async (docTypeToSync: DocumentType = selectedDoc) => {
    let activeToken = token;
    if (!activeToken) {
      activeToken = await getAccessToken();
    }
    if (!activeToken) {
      try {
        const res = await googleSignIn();
        if (!res) return;
        activeToken = res.accessToken;
        setToken(activeToken);
      } catch (err) {
        return;
      }
    }

    setIsLoading(true);
    setStatusMessage(null);

    try {
      const result = await createGoogleDocFromProject(activeToken, project, kopConfig, docTypeToSync);
      
      const updatedGoogleDocs = {
        ...(project.googleDocs || {}),
        [docTypeToSync]: {
          documentId: result.documentId,
          webViewLink: result.webViewLink,
          updatedAt: new Date().toISOString()
        }
      };

      const updatedProject: ProjectContract = {
        ...project,
        googleDocs: updatedGoogleDocs,
        updatedAt: new Date().toISOString()
      };

      if (onUpdateProjectDocs) {
        onUpdateProjectDocs(updatedProject);
      }

      setStatusMessage({
        type: 'success',
        text: `Dokumen "${docTypeToSync}" berhasil dibuat dan disimpan di Google Drive Anda.`,
        link: result.webViewLink
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: `Terjadi kendala saat menyinkronkan ke Google Docs: ${err.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Batch generate ALL documents into Google Drive
  const handleBatchSyncAllDocs = async () => {
    let activeToken = token || (await getAccessToken());
    if (!activeToken) {
      try {
        const res = await googleSignIn();
        if (!res) return;
        activeToken = res.accessToken;
        setToken(activeToken);
      } catch (err) {
        return;
      }
    }

    setIsBatchSyncing(true);
    setStatusMessage(null);

    let updatedDocs = { ...(project.googleDocs || {}) };
    let successCount = 0;

    const docsToGenerate = ALL_DOCUMENTS_CATALOG.slice(0, 11); // Main official minutes & receipts

    for (let i = 0; i < docsToGenerate.length; i++) {
      const docItem = docsToGenerate[i];
      setBatchProgress(`Menyinkronkan dokumen ${i + 1}/${docsToGenerate.length}: ${docItem.shortLabel}...`);

      try {
        const res = await createGoogleDocFromProject(activeToken, project, kopConfig, docItem.type);
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

    const updatedProject: ProjectContract = {
      ...project,
      googleDocs: updatedDocs,
      updatedAt: new Date().toISOString()
    };

    if (onUpdateProjectDocs) {
      onUpdateProjectDocs(updatedProject);
    }

    setIsBatchSyncing(false);
    setBatchProgress('');
    setStatusMessage({
      type: 'success',
      text: `Selesai! ${successCount} dari ${docsToGenerate.length} Berita Acara berhasil dibuat sekaligus di Google Drive.`
    });
  };

  const handleDownloadPdfLocal = async () => {
    if (!currentDocInfo?.documentId) {
      await handleCreateOrSyncGoogleDoc(selectedDoc);
    }

    const docId = currentDocInfo?.documentId;
    if (!docId) return;

    let activeToken = token || (await getAccessToken());
    if (!activeToken) {
      const res = await googleSignIn();
      if (!res) return;
      activeToken = res.accessToken;
      setToken(activeToken);
    }

    setIsExportingPdf(true);
    setStatusMessage(null);

    try {
      const pdfBlob = await exportGoogleDocAsPdf(activeToken, docId);
      const filename = `${selectedDoc}_${project.lokasi.replace(/[^a-zA-Z0-9]/g, '_')}_${project.tahunAnggaran}.pdf`;
      downloadBlobLocally(pdfBlob, filename);

      setStatusMessage({
        type: 'success',
        text: `File PDF "${filename}" berhasil diunduh ke penyimpanan lokal Anda.`
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: `Gagal mengunduh PDF: ${err.message}`
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleSavePdfToGoogleDrive = async () => {
    if (!currentDocInfo?.documentId) {
      await handleCreateOrSyncGoogleDoc(selectedDoc);
    }

    const docId = currentDocInfo?.documentId;
    if (!docId) return;

    let activeToken = token || (await getAccessToken());
    if (!activeToken) {
      const res = await googleSignIn();
      if (!res) return;
      activeToken = res.accessToken;
      setToken(activeToken);
    }

    setIsSavingToDrive(true);
    setStatusMessage(null);

    try {
      const pdfBlob = await exportGoogleDocAsPdf(activeToken, docId);
      const filename = `${selectedDoc}_${project.lokasi.replace(/[^a-zA-Z0-9]/g, '_')}_${project.tahunAnggaran}.pdf`;
      const driveFile = await savePdfToGoogleDrive(activeToken, pdfBlob, filename);

      const updatedGoogleDocs = {
        ...(project.googleDocs || {}),
        [selectedDoc]: {
          ...currentDocInfo,
          pdfDriveId: driveFile.fileId,
          pdfDriveLink: driveFile.webViewLink,
          updatedAt: new Date().toISOString()
        }
      };

      const updatedProject: ProjectContract = {
        ...project,
        googleDocs: updatedGoogleDocs,
        updatedAt: new Date().toISOString()
      };

      if (onUpdateProjectDocs) {
        onUpdateProjectDocs(updatedProject);
      }

      setStatusMessage({
        type: 'success',
        text: `Salinan file PDF "${filename}" berhasil disimpan ke Google Drive Anda!`,
        link: driveFile.webViewLink
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: `Gagal menyimpan PDF ke Google Drive: ${err.message}`
      });
    } finally {
      setIsSavingToDrive(false);
    }
  };

  const embedUrl = currentDocInfo?.documentId
    ? `https://docs.google.com/document/d/${currentDocInfo.documentId}/edit?embedded=true`
    : null;

  const filteredCatalog = ALL_DOCUMENTS_CATALOG.filter(d => {
    if (activeStageFilter === 'all') return true;
    return d.stage === activeStageFilter;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col h-full min-h-[750px]">
      {/* 1. DOCUMENT SELECTOR TABS (SEMUA 13 DOKUMEN RESMI) - Only when not in Studio layout */}
      {!hideInternalDocSelector && (
        <div className="bg-slate-900 text-white p-4 border-b border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Katalog Dokumen Berita Acara
                </span>
                <span className="text-xs text-slate-400">
                  Pilih dokumen di bawah untuk langsung dibuka dan diedit di Google Docs:
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white mt-1">
                {activeCatalogItem.label}
              </h3>
            </div>

            {/* Batch Generate Button */}
            <button
              onClick={handleBatchSyncAllDocs}
              disabled={isBatchSyncing || isLoading}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors shrink-0 cursor-pointer self-start sm:self-auto"
              title="Buat seluruh dokumen Berita Acara sekaligus ke Google Drive"
            >
              <FolderSync className={`w-3.5 h-3.5 ${isBatchSyncing ? 'animate-spin' : ''}`} />
              <span>{isBatchSyncing ? (batchProgress || 'Menyinkronkan...') : 'Buat Semua Dokumen ke Drive'}</span>
            </button>
          </div>

          {/* Stage Filter Buttons */}
          <div className="flex items-center gap-1.5 text-xs overflow-x-auto pb-1 pt-1 border-t border-slate-800">
            {(['all', 'Awal Kontrak', 'Pelaksanaan', 'Serah Terima', 'Pencairan Kasda'] as const).map((stage) => (
              <button
                key={stage}
                type="button"
                onClick={() => setActiveStageFilter(stage)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ${
                  activeStageFilter === stage
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {stage === 'all' ? 'Semua Tahapan (13 Dokumen)' : stage}
              </button>
            ))}
          </div>

          {/* Horizontal Document Switcher Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-1">
            {filteredCatalog.map((item) => {
              const isSelected = selectedDoc === item.type;
              const hasDriveDoc = Boolean(project.googleDocs?.[item.type]?.documentId);

              return (
                <button
                  key={item.type}
                  onClick={() => onDocChange(item.type)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-md ring-2 ring-blue-500'
                      : 'bg-slate-800/90 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/80'
                  }`}
                >
                  <span>{item.shortLabel}</span>
                  {hasDriveDoc ? (
                    <span className={`flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-950 text-emerald-400'
                    }`}>
                      <Check className="w-2.5 h-2.5" />
                      <span>Drive</span>
                    </span>
                  ) : (
                    <span className={`text-[9px] px-1.5 py-0.2 rounded ${
                      isSelected ? 'bg-slate-200 text-slate-700' : 'bg-slate-700 text-slate-400'
                    }`}>
                      Belum Dibuat
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Top Toolbar & Google Actions (Compact Minimalist) */}
      <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          {currentDocInfo?.documentId ? (
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <Cloud className="w-2.5 h-2.5 text-emerald-600" />
              <span>Google Docs Aktif</span>
            </span>
          ) : (
            <span className="text-[10px] bg-amber-50 text-amber-800 font-semibold px-2 py-0.5 rounded-full border border-amber-200">
              Belum Tersinkron ke Drive
            </span>
          )}
          {currentDocInfo?.updatedAt && (
            <span className="text-[10px] text-slate-400 hidden sm:inline">
              Terakhir diperbarui: {new Date(currentDocInfo.updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          {!token ? (
            <button
              onClick={handleSignIn}
              disabled={isLoading}
              className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Sambungkan Google Workspace</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleCreateOrSyncGoogleDoc(selectedDoc)}
                disabled={isLoading}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                title="Perbarui atau buat dokumen ini di Google Docs"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{currentDocInfo?.documentId ? 'Perbarui di Drive' : 'Buat di Drive'}</span>
              </button>

              {currentDocInfo?.documentId && (
                <>
                  <button
                    onClick={handleDownloadPdfLocal}
                    disabled={isExportingPdf}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Unduh file PDF ke komputer lokal"
                  >
                    <Download className={`w-3 h-3 ${isExportingPdf ? 'animate-bounce' : ''}`} />
                    <span>PDF</span>
                  </button>

                  <a
                    href={currentDocInfo.webViewLink}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                    title="Buka dokumen di tab Google Docs baru"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Buka Tab Baru</span>
                  </a>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div className={`px-4 py-2 text-xs flex items-center justify-between border-b ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : statusMessage.type === 'error'
            ? 'bg-red-50 text-red-800 border-red-200'
            : 'bg-blue-50 text-blue-800 border-blue-200'
        }`}>
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          {statusMessage.link && (
            <a
              href={statusMessage.link}
              target="_blank"
              rel="noreferrer"
              className="font-semibold underline flex items-center gap-1 hover:text-emerald-950 shrink-0 ml-4"
            >
              <span>Buka di Google Drive</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* Document View / Iframe */}
      <div className="flex-1 bg-slate-100 relative min-h-[600px] flex flex-col">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={`Google Docs Editor - ${selectedDoc}`}
            className="w-full h-full flex-1 border-0 min-h-[680px]"
            allow="clipboard-read; clipboard-write"
          />
        ) : (
          <div className="m-auto max-w-lg p-8 bg-white rounded-2xl border border-slate-200 shadow-sm text-center space-y-4 my-10">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-7 h-7" />
            </div>

            <div>
              <h4 className="font-bold text-slate-900 text-base">
                {activeCatalogItem.label}
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Dokumen ini siap dibuat ke Google Docs untuk paket <strong>{project.namaPaket}</strong> di {project.lokasi}.
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-left text-xs space-y-2 text-slate-600">
              <div className="flex items-center gap-2 text-slate-800 font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Karakteristik Dokumen Ini:</span>
              </div>
              <p>• <strong>Tahapan</strong>: {activeCatalogItem.stage}</p>
              <p>• <strong>Klausul</strong>: {activeCatalogItem.description}</p>
              <p>• <strong>Penyimpanan</strong>: Otomatis tersimpan dan dapat diedit langsung di Google Drive Anda.</p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => handleCreateOrSyncGoogleDoc(selectedDoc)}
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sedang Membuat di Google Docs...</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-4 h-4" />
                    <span>Buat & Edit {activeCatalogItem.shortLabel} di Google Docs</span>
                  </>
                )}
              </button>

              <button
                onClick={handleBatchSyncAllDocs}
                disabled={isBatchSyncing || isLoading}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Buat Semua Dokumen (Batch)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer bar */}
      {currentDocInfo && (
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Google Doc ID ({selectedDoc}): <code className="font-mono text-slate-700">{currentDocInfo.documentId}</code></span>
          </div>

          <div className="flex items-center gap-3">
            {currentDocInfo.pdfDriveLink && (
              <a 
                href={currentDocInfo.pdfDriveLink}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-700 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Lihat PDF di Drive</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <a 
              href={currentDocInfo.webViewLink}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>Buka Editor Tab Penuh</span>
              <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
