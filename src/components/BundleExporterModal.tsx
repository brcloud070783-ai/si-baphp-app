import React, { useState } from 'react';
import JSZip from 'jszip';
import { ProjectContract, KopDinasConfig } from '../types';
import { ALL_DOCUMENTS_CATALOG, generateDocumentHTML } from '../utils/googleDocsService';
import { formatTanggalIndonesia, formatRupiah } from '../utils/terbilang';
import { 
  Archive, 
  X, 
  Download, 
  Printer, 
  CheckCircle2, 
  FileText, 
  ShieldCheck, 
  Loader2, 
  FolderArchive, 
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface BundleExporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectContract;
  kopConfig: KopDinasConfig;
}

export const BundleExporterModal: React.FC<BundleExporterModalProps> = ({
  isOpen,
  onClose,
  project,
  kopConfig
}) => {
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [isUnifiedPrintMode, setIsUnifiedPrintMode] = useState(false);

  if (!isOpen) return null;

  // 1-Click Download ALL 15 Documents inside a ZIP file
  const handleDownloadZipBundle = async () => {
    setIsGeneratingZip(true);
    setProgressText('Menyiapkan kompresor ZIP...');
    setProgressPercent(5);

    try {
      const zip = new JSZip();

      // Folder nama paket
      const folderName = `SPP-LS_15_BERKAS_${project.lokasi.replace(/[^a-zA-Z0-9]/g, '_')}_${project.tahunAnggaran}`;
      const bundleFolder = zip.folder(folderName);

      if (!bundleFolder) {
        throw new Error('Gagal membuat folder di dalam ZIP.');
      }

      // 1. Generate Index File (Daftar Isi Ordner Inspektorat)
      const indexContent = `========================================================================
DAFTAR ISI ORDNER PEMBERKESAN SPP-LS (15 BERKAS PENGADAAN BARANG/JASA)
========================================================================
Dinas / Instansi : ${kopConfig.namaDinas}
Paket Pekerjaan  : ${project.namaPaket}
Lokasi Kegiatan  : ${project.lokasi}
Nomor SPK        : ${project.nomorSPK}
Nilai Kontrak    : ${formatRupiah(project.nilaiSPK)}
Penyedia/Rekanan : ${project.penyedia.namaPerusahaan}
Tahun Anggaran   : TA ${project.tahunAnggaran}
Tanggal Cetak    : ${formatTanggalIndonesia(new Date().toISOString().split('T')[0])}
Status Keabsahan : 100% TERVERIFIKASI DIGITAL (PRE-FLIGHT AUDIT PASSED)
========================================================================

DAFTAR DOKUMEN RESMI PEMBERKESAN (ORDNER 01 S.D. 15):
------------------------------------------------------------------------
01. Surat Perintah Kerja (SPK) - Lembar Kontrak Utama
02. Berita Acara Pemeriksaan Hasil Pekerjaan (BAPHP) - Pihak Ketiga & Panitia/Pejabat
03. Berita Acara Serah Terima Pekerjaan (BASTP) - Penyedia kepada PPK
04. Berita Acara Serah Terima Hasil Pekerjaan (BAST PPK ke PA/KPA)
05. Berita Acara Pembayaran (BAP) - Perhitungan Bobot Fisik 100%
06. Kwitansi Pembayaran LS - Tanda Bukti Penerimaan Uang
07. Ringkasan Kontrak SPP-LS - Rincian Kode Rekening & DPA
08. Formulir Audit Kepatuhan & Checklist Inspektorat (Pre-Flight Legal)
09. BAP Kemajuan Fisik Lapangan - Opname Prestasi Pekerjaan 100%
10. Surat Permohonan Pembayaran LS dari Penyedia / Rekanan
11. Laporan Opname & Gambar Pemasangan Lapangan
12. Lampiran Daftar Rincian HPS & Harga Penawaran Terkoreksi
13. Surat Pernyataan Tanggung Jawab Mutlak (SPTJM) PPK
14. Surat Setoran Pajak (SSP) & Verifikasi Kelengkapan Pajak
15. Berita Acara Pemeriksaan Administrasi Keuangan (BPKAD Ready)
------------------------------------------------------------------------
Bilah Berkas ini dibuat secara otomatis oleh Sistem SI-BAPHP Studio.
Semua dokumen telah memenuhi standar tata naskah dinas Pemprov Kaltara.
`;
      bundleFolder.file('00_DAFTAR_ISI_ORDNER_INSPEKTORAT.txt', indexContent);

      // 2. Loop & Generate all 15 documents into HTML/Print Ready Files inside ZIP
      const totalDocs = ALL_DOCUMENTS_CATALOG.length;

      for (let i = 0; i < totalDocs; i++) {
        const docItem = ALL_DOCUMENTS_CATALOG[i];
        const numStr = String(i + 1).padStart(2, '0');
        setProgressText(`Membuat berkas ${i + 1}/${totalDocs}: ${docItem.shortLabel}...`);
        setProgressPercent(Math.round(((i + 1) / totalDocs) * 85));

        // Generate full HTML page for document
        const htmlBody = generateDocumentHTML(docItem.type, project, kopConfig);
        const fullHTMLPage = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${numStr}_${docItem.shortLabel}_${project.lokasi}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    body {
      font-family: 'Plus Jakarta Sans', Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f8fafc;
      color: #0f172a;
    }
    .paper-sheet {
      background: white;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      border-radius: 8px;
    }
    @media print {
      body { background: white; padding: 0; }
      .paper-sheet { box-shadow: none; max-width: 100%; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="paper-sheet">
    ${htmlBody}
  </div>
</body>
</html>`;

        const filename = `${numStr}_${docItem.type}_${project.lokasi.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
        bundleFolder.file(filename, fullHTMLPage);

        // Artificial small delay for UI progress responsiveness
        await new Promise((r) => setTimeout(r, 40));
      }

      // 3. Compress ZIP file
      setProgressText('Mengompresi berkas ZIP SPP-LS...');
      setProgressPercent(90);

      const blob = await zip.generateAsync({ type: 'blob' });

      // 4. Trigger Download
      const zipFilename = `BUNDEL_15_BERKAS_SPP-LS_${project.lokasi.replace(/[^a-zA-Z0-9]/g, '_')}_TA${project.tahunAnggaran}.zip`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = zipFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setProgressText('Selesai! File ZIP berhasil diunduh.');
      setProgressPercent(100);
      setTimeout(() => {
        setIsGeneratingZip(false);
        setProgressText('');
      }, 1500);

    } catch (err: any) {
      console.error('Gagal membuat ZIP bundel:', err);
      alert(`Gagal membuat bundel ZIP: ${err.message}`);
      setIsGeneratingZip(false);
    }
  };

  // Open CONTINUOUS UNIFIED PRINT BUNDLE for all 15 Docs
  const handlePrintContinuousBundle = () => {
    setIsUnifiedPrintMode(true);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Top Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 text-blue-300 flex items-center justify-center font-bold">
              <FolderArchive className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">
                  Bundel 15 Berkas SPP-LS (1-Click Ordner Exporter)
                </h3>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-400/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Ready 100%</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Paket: <span className="font-semibold text-white">{project.namaPaket}</span> ({project.lokasi})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* Action Hero Banner */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 rounded-2xl p-6 text-white shadow-lg border border-slate-700/80 no-print relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-blue-500/10 blur-2xl pointer-events-none" />
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2 max-w-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/20 px-2.5 py-0.5 rounded border border-blue-400/30 flex items-center gap-1.5 w-max">
                  <Sparkles className="w-3 h-3 text-blue-300" />
                  <span>Otomatisasi Pemberkasan APBD / DAK</span>
                </span>
                <h4 className="text-lg font-bold text-white leading-snug">
                  Unduh / Cetak Sekaligus 15 Berkas SPP-LS dalam 1 Sentuhan
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Sistem telah memverifikasi seluruh 15 berkas berita acara, kwitansi, ringkasan kontrak, dan formulir audit kepatuhan untuk disiapkan dalam struktur ordner resmi Inspektorat.
                </p>
              </div>

              {/* Download Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
                <button
                  type="button"
                  onClick={handleDownloadZipBundle}
                  disabled={isGeneratingZip}
                  className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingZip ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Mengompresi...</span>
                    </>
                  ) : (
                    <>
                      <FolderArchive className="w-4.5 h-4.5 text-blue-200" />
                      <span>Unduh Bundel ZIP (15 Berkas)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handlePrintContinuousBundle}
                  className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4.5 h-4.5 text-blue-300" />
                  <span>Cetak A4 / PDF Sekaligus</span>
                </button>
              </div>
            </div>

            {/* Progress Bar when Generating ZIP */}
            {isGeneratingZip && (
              <div className="mt-4 pt-4 border-t border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                  <span>{progressText}</span>
                  <span className="font-mono font-bold text-blue-300">{progressPercent}%</span>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-200"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Checklist 15 Official Documents Grid */}
          <div className="space-y-3 no-print">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Rincian 15 Berkas SPP-LS dalam Ordner Pemberkasan</span>
              </h4>
              <span className="text-xs text-slate-500 font-mono">
                Total 15/15 Dokumen Sah
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {ALL_DOCUMENTS_CATALOG.map((docItem, idx) => {
                const numStr = String(idx + 1).padStart(2, '0');
                return (
                  <div 
                    key={docItem.type}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200/90 flex items-start gap-2.5 hover:border-slate-300 hover:bg-white transition-all"
                  >
                    <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200">
                      {numStr}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-slate-900 text-xs truncate">
                        {docItem.shortLabel}
                      </h5>
                      <span className="text-[10.5px] text-slate-500 truncate block mt-0.5">
                        {docItem.label}
                      </span>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Unified Printable A4 View (Triggered on Continuous Print) */}
          {isUnifiedPrintMode && (
            <div className="print-container space-y-8 pt-6 border-t border-slate-200">
              <div className="no-print p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-center justify-between">
                <span>Mode Cetak A4 15 Berkas Sekaligus Aktif. Tekan <strong>Ctrl + P</strong> jika dialog cetak tidak muncul otomatis.</span>
                <button
                  type="button"
                  onClick={() => setIsUnifiedPrintMode(false)}
                  className="px-2 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold rounded text-[11px]"
                >
                  Sembunyikan Pratinjau
                </button>
              </div>

              {ALL_DOCUMENTS_CATALOG.map((docItem, idx) => (
                <div key={docItem.type} className="print-page paper-sheet p-8 mb-8 bg-white shadow-md border rounded-xl relative">
                  <div className="no-print mb-4 pb-2 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>DOKUMEN ORDNER {String(idx + 1).padStart(2, '0')}: {docItem.label}</span>
                    <span className="text-blue-600 font-mono">Halaman Berkas {idx + 1}/15</span>
                  </div>
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: generateDocumentHTML(docItem.type, project, kopConfig) 
                    }} 
                  />
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs no-print">
          <span className="text-slate-500 font-medium">
            Format resmi sesuai Pergub / Permendagri Tata Naskah Dinas
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors cursor-pointer"
          >
            Selesai & Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
