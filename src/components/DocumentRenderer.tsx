import React, { useState } from 'react';
import { ProjectContract, KopDinasConfig, DocumentType } from '../types';
import { OfficialKop } from './OfficialKop';
import { 
  terbilang,
  formatRupiah, 
  terbilangRupiah, 
  formatTanggalIndonesia, 
  getTerbilangTanggal, 
  formatJangkaWaktu 
} from '../utils/terbilang';
import { 
  Printer, 
  Copy, 
  Check, 
  Eye, 
  Stamp, 
  ShieldCheck, 
  AlertCircle, 
  QrCode, 
  Image as ImageIcon, 
  FileText,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Users,
  CheckCircle2,
  UploadCloud
} from 'lucide-react';

interface DocumentRendererProps {
  project: ProjectContract;
  kopConfig: KopDinasConfig;
  selectedDoc: DocumentType;
  onSelectDoc?: (doc: DocumentType) => void;
  onOpenVerification?: () => void;
  onSwitchToGoogleDocs?: () => void;
  hideDocSelector?: boolean;
  onUpdateProject?: (updated: ProjectContract) => void;
}

export const DocumentRenderer: React.FC<DocumentRendererProps> = ({
  project,
  kopConfig,
  selectedDoc,
  onSelectDoc,
  onOpenVerification,
  onSwitchToGoogleDocs,
  hideDocSelector = false,
  onUpdateProject
}) => {
  const [showSignatures, setShowSignatures] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [zoomScale, setZoomScale] = useState<number>(100);
  const [showSignatoryTracker, setShowSignatoryTracker] = useState<boolean>(true);

  const tglBAPHPInfo = getTerbilangTanggal(project.tanggalBAPHP);
  const tglBASTInfo = getTerbilangTanggal(project.tanggalBAST || project.tanggalBAPHP);
  const tglBASTPAInfo = getTerbilangTanggal(project.tanggalBAST_PA || project.tanggalBAST || project.tanggalBAPHP);
  const tglBAPInfo = getTerbilangTanggal(project.tanggalBAP || project.tanggalBAPHP);
  const tglSTLInfo = getTerbilangTanggal(project.tanggalBA_STL || project.tanggalMulai || project.tanggalSPK);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const docElement = document.getElementById('printable-official-document');
    if (docElement) {
      navigator.clipboard.writeText(docElement.innerText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Perhitungan Keuangan BAP (Nilai Kontrak, PPN, PPh, Diterima Bersih, Termin & Custom Calculator)
  const isTermin = project.skemaPembayaran === 'termin' && Boolean(project.daftarTermin?.length);
  const activeTermin = isTermin ? (project.daftarTermin![project.activeTerminIndex ?? 0] || project.daftarTermin![0]) : null;

  const totalKontrak = project.nilaiSPK || 0;
  const kemajuanFisikPersen = project.bapKemajuanFisikPersen ?? (activeTermin ? activeTermin.bobotKumulatif : 100);
  const nilaiPrestasiFisik = Math.round((kemajuanFisikPersen / 100) * totalKontrak);
  const nilaiKotor = project.bapBrutoTagihan ?? (activeTermin ? activeTermin.nilaiBruto : totalKontrak);
  
  const pphPercent = project.bapPotonganPPhPersen ?? (project.jenisPekerjaan === 'Fisik / Konstruksi' ? 2.65 : 2.0);
  const pphNilai = project.bapPotonganPPhNilai ?? (activeTermin ? activeTermin.pphNilai : Math.round((nilaiKotor * (pphPercent / 100))));
  
  const potonganUM = project.bapPotonganUangMuka ?? (activeTermin ? activeTermin.potonganUangMuka : 0);
  const retensiPersen = project.bapPotonganRetensiPersen ?? (activeTermin && activeTermin.potonganRetensi > 0 ? 5 : 0);
  const potonganRetensi = project.bapPotonganRetensiNilai ?? (activeTermin ? activeTermin.potonganRetensi : (retensiPersen > 0 ? Math.round(nilaiKotor * (retensiPersen / 100)) : 0));
  const potonganLain = project.bapPotonganLainnya ?? 0;
  const nilaiBersih = project.bapNilaiNetto ?? Math.max(0, nilaiKotor - (potonganUM + potonganRetensi + pphNilai + potonganLain));
  const bobotAktif = kemajuanFisikPersen;
  const sisaKontrak = activeTermin 
    ? Math.max(0, project.nilaiSPK - Math.round((activeTermin.bobotKumulatif / 100) * project.nilaiSPK))
    : 0;

  // List of all available document types with their Indonesian display labels
  const docOptions: { type: DocumentType; label: string; badge?: string }[] = [
    { type: 'BAPHP', label: '1. BAPHP (2 Hal)', badge: 'Wajib' },
    { type: 'BAST', label: '2. BASTP (Penyedia ke PPK)', badge: 'Wajib' },
    { type: 'BAST_PA', label: '3. BAST (PPK ke PA/KPA)', badge: 'Perpres 12/21' },
    { type: 'BAP', label: isTermin ? `4. BAP (${activeTermin?.namaTermin})` : '4. BAP (Pembayaran)', badge: 'Keuangan' },
    { type: 'BAKP', label: isTermin ? `5. Kemajuan Fisik (${bobotAktif}%)` : '5. Kemajuan Fisik (100%)', badge: 'Opname' },
    { type: 'BA_STL', label: '6. Serah Terima Lapangan', badge: 'Awal SPK' },
    { type: 'BA_MC0', label: '7. Mutual Check 0% (MC-0)', badge: 'Rekayasa' },
    { type: 'BA_UM', label: '8. BA Uang Muka', badge: 'Bank' },
    { type: 'BAST_FHO', label: '9. BAST-FHO (Retensi)', badge: 'Pemeliharaan' },
    { type: 'KUITANSI', label: '10. Kuitansi Dinas', badge: 'Meterai' },
    { type: 'CHECKLIST', label: '11. Lembar Verifikasi SPP', badge: 'Permendagri 77' },
    { type: 'SURAT_REKANAN', label: '12. Surat Permohonan Rekanan', badge: 'Pengantar' },
    { type: 'LAMPIRAN_FOTO', label: '13. Lampiran Foto Fisik', badge: 'Dokumentasi' },
    { type: 'SPMK', label: '14. SPMK (Mulai Kerja)', badge: 'Resmi' },
    { type: 'LEMBAR_KENDALI', label: '15. Lembar Kendali Termin', badge: 'Kasda BPKAD' }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Control Bar: Non-printable */}
      <div className="no-print bg-white p-3.5 border border-slate-200 rounded-xl flex flex-col gap-3">
        {!hideDocSelector && (
          <>
            {/* Document Selector Header */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Pilih Jenis Dokumen Berita Acara yang Ditampilkan / Dicetak:
              </span>
              <span className="text-[11px] text-blue-600 font-medium">
                Tersinkronisasi Otomatis dengan Database Kontrak
              </span>
            </div>

            {/* Document Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5">
              {docOptions.map((item) => (
                <button
                  key={item.type}
                  onClick={() => onSelectDoc && onSelectDoc(item.type)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    selectedDoc === item.type
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-normal ${
                      selectedDoc === item.type ? 'bg-blue-700 text-blue-100' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Action Controls Bar */}
        <div className={`flex flex-wrap items-center justify-between gap-3 ${!hideDocSelector ? 'pt-2 border-t border-slate-100' : ''}`}>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showSignatures}
                onChange={(e) => setShowSignatures(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
              />
              <span>Tanda Tangan & Stempel</span>
            </label>

            <button
              type="button"
              onClick={() => setShowSignatoryTracker(!showSignatoryTracker)}
              className={`px-2 py-1 text-[11px] font-medium rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer ${
                showSignatoryTracker
                  ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold'
                  : 'bg-white text-slate-500 border-slate-200 hover:text-slate-700'
              }`}
              title="Tampilkan / Sembunyikan bilah alur otorisasi pejabat"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Alur Pejabat</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls Pill */}
            <div className="flex items-center bg-slate-100/90 p-1 rounded-lg border border-slate-200/80">
              <button
                type="button"
                onClick={() => setZoomScale(prev => Math.max(60, prev - 10))}
                className="p-1 rounded hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                title="Perkecil Kanvas (Zoom Out)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <select
                value={zoomScale}
                onChange={(e) => setZoomScale(Number(e.target.value))}
                className="text-[11px] font-semibold font-mono px-1 py-0.5 bg-transparent border-none text-slate-700 focus:outline-hidden cursor-pointer"
              >
                <option value={70}>70%</option>
                <option value={80}>80%</option>
                <option value={90}>90%</option>
                <option value={100}>100%</option>
                <option value={110}>110%</option>
                <option value={125}>125%</option>
              </select>
              <button
                type="button"
                onClick={() => setZoomScale(prev => Math.min(140, prev + 10))}
                className="p-1 rounded hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                title="Perbesar Kanvas (Zoom In)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomScale(100)}
                className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white border border-slate-200 text-slate-600 hover:text-slate-900 cursor-pointer"
                title="Kembalikan ke Ukuran Standar (100%)"
              >
                Reset
              </button>
            </div>

            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer border border-slate-200/80"
              title="Salin teks dokumen ini untuk ditempel ke Word"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin' : 'Salin Teks'}</span>
            </button>

            {!hideDocSelector && (
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-2xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak A4</span>
              </button>
            )}
          </div>
        </div>

        {/* Signatory Workflow Pipeline Bar (DocuSign/SIPD Style) */}
        {showSignatoryTracker && (
          <div className="no-print bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider text-[10.5px]">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Alur Penandatanganan & Paraf Dinas (Perpres 12/2021)</span>
              </span>
              <span className="text-[10px] text-slate-400">
                4 Tingkatan Otorisasi Pengadaan
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
              {/* Step 1: Rekanan */}
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-[11px]">1. Rekanan Penyedia</span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold text-[9px]">LENGKAP</span>
                </div>
                <p className="text-[10.5px] text-slate-600 truncate font-semibold">{project.penyedia.namaDirektur}</p>
                <p className="text-[9.5px] text-slate-400 truncate">{project.penyedia.namaPerusahaan}</p>
              </div>

              {/* Step 2: PPTK */}
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-[11px]">2. PPTK (Teknis)</span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold text-[9px]">TERVERIFIKASI</span>
                </div>
                <p className="text-[10.5px] text-slate-600 truncate font-semibold">{project.pptk.nama}</p>
                <p className="text-[9.5px] text-slate-400 truncate">Opname & BAPHP</p>
              </div>

              {/* Step 3: PPK */}
              <div className="p-2.5 rounded-lg bg-white border border-blue-200 shadow-2xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900 text-[11px]">3. PPK (Komitmen)</span>
                  <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-bold text-[9px]">PENGESAHAN</span>
                </div>
                <p className="text-[10.5px] text-slate-800 truncate font-bold">{project.ppk.nama}</p>
                <p className="text-[9.5px] text-slate-500 truncate">Persetujuan BAP & BAST</p>
              </div>

              {/* Step 4: PA / Kasda */}
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-[11px]">4. Pengguna Anggaran</span>
                  <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 font-bold text-[9px]">SPM / KASDA</span>
                </div>
                <p className="text-[10.5px] text-slate-600 truncate font-semibold">{project.paKpa?.nama || 'Kepala Dinas'}</p>
                <p className="text-[9.5px] text-slate-400 truncate">Pencatatan BMD & SP2D</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Verification Status Banner if not verified */}
      {project.statusVerifikasi !== 'diverifikasi' && (
        <div className="no-print bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between text-xs text-amber-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Dokumen paket ini berstatus <strong>{project.statusVerifikasi === 'perlu_tinjauan' ? 'Perlu Tinjauan' : 'Draf'}</strong>. Periksa kelengkapan data sebelum diterbitkan.
            </span>
          </div>
          {onOpenVerification && (
            <button
              onClick={onOpenVerification}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium cursor-pointer"
            >
              Buka Verifikasi
            </button>
          )}
        </div>
      )}

      {/* DOCUMENT PAPER CANVAS (PRINTABLE) */}
      <div className="w-full overflow-x-auto flex justify-center pb-8">
        <div 
          id="printable-official-document"
          className="print-container flex flex-col items-center justify-center gap-8 py-2 transition-transform duration-150 origin-top"
          style={{ transform: zoomScale !== 100 ? `scale(${zoomScale / 100})` : undefined }}
        >
        {/* ============================================================== */}
        {/* TEMPLATE 1: BAPHP (Exact match with user's uploaded images!)  */}
        {/* ============================================================== */}
        {selectedDoc === 'BAPHP' && (
          <>
            {/* --- HALAMAN 1 BAPHP --- */}
            <div className="print-page w-[210mm] min-h-[297mm] bg-white text-black px-[12.7mm] py-[10mm] shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-0 font-official text-[10.5pt] leading-[1.15] flex flex-col justify-between">
              <div>
                <OfficialKop config={kopConfig} />

                <div className="text-center my-3">
                  <h3 className="text-[13pt] font-bold underline uppercase tracking-wide">
                    Berita Acara Pemeriksaan Hasil Pekerjaan (BAPHP)
                  </h3>
                  <p className="text-[11pt] font-semibold mt-1">
                    Nomor : {project.nomorBAPHP}
                  </p>
                  <p className="text-[10.5pt] font-medium mt-0.5">
                    Tanggal : {formatTanggalIndonesia(project.tanggalBAPHP)}
                  </p>
                </div>

                <div className="border-t border-b border-black py-1.5 my-2">
                  <table className="w-full text-[10.5pt]">
                    <tbody>
                      <tr className="align-top">
                        <td className="w-44 font-semibold uppercase">NOMOR</td>
                        <td className="w-4 text-center">:</td>
                        <td className="font-semibold">{project.nomorBAPHP}</td>
                      </tr>
                      <tr className="align-top">
                        <td className="font-semibold uppercase">TANGGAL</td>
                        <td className="text-center">:</td>
                        <td>{formatTanggalIndonesia(project.tanggalBAPHP)}</td>
                      </tr>
                      <tr className="align-top">
                        <td className="font-semibold uppercase">PAKET PEKERJAAN</td>
                        <td className="text-center">:</td>
                        <td className="font-semibold">{project.namaPaket}</td>
                      </tr>
                      <tr className="align-top">
                        <td className="font-semibold uppercase">LOKASI</td>
                        <td className="text-center">:</td>
                        <td>{project.lokasi}</td>
                      </tr>
                      <tr className="align-top">
                        <td className="font-semibold uppercase">SUMBER DANA</td>
                        <td className="text-center">:</td>
                        <td>{project.sumberDana}</td>
                      </tr>
                      <tr className="align-top">
                        <td className="font-semibold uppercase">TAHUN ANGGARAN</td>
                        <td className="text-center">:</td>
                        <td>{project.tahunAnggaran}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="text-justify indent-0 mt-3 font-medium">
                  {tglBAPHPInfo.paragrafPembuka}
                </p>

                <div className="my-2.5 pl-6 space-y-2">
                  <div>
                    <div className="flex">
                      <span className="w-24 font-normal">Nama</span>
                      <span className="w-4 text-center">:</span>
                      <span className="font-bold">{project.ppk.nama}</span>
                    </div>
                    <div className="flex">
                      <span className="w-24 font-normal">Jabatan</span>
                      <span className="w-4 text-center">:</span>
                      <span>{project.ppk.jabatan}</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex">
                      <span className="w-24 font-normal">Nama</span>
                      <span className="w-4 text-center">:</span>
                      <span className="font-bold">{project.pptk.nama}</span>
                    </div>
                    <div className="flex">
                      <span className="w-24 font-normal">Jabatan</span>
                      <span className="w-4 text-center">:</span>
                      <span>{project.pptk.jabatan}</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex">
                      <span className="w-24 font-normal">Nama</span>
                      <span className="w-4 text-center">:</span>
                      <span className="font-bold">{project.penyedia.namaDirektur}</span>
                    </div>
                    <div className="flex">
                      <span className="w-24 font-normal">Jabatan</span>
                      <span className="w-4 text-center">:</span>
                      <span className="uppercase font-semibold">
                        {project.penyedia.jabatan} ({project.penyedia.namaPerusahaan})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <p className="font-bold mb-1">Berdasarkan :</p>
                  <table className="w-full text-[10.5pt]">
                    <tbody>
                      <tr className="align-top">
                        <td className="w-56 uppercase">PROGRAM</td>
                        <td className="w-4 text-center">:</td>
                        <td>{project.program}</td>
                      </tr>
                      <tr className="align-top">
                        <td className="uppercase">KEGIATAN</td>
                        <td className="text-center">:</td>
                        <td>{project.kegiatan}</td>
                      </tr>
                      <tr className="align-top">
                        <td className="uppercase">NOMOR SPK</td>
                        <td className="text-center">:</td>
                        <td>{project.nomorSPK}</td>
                      </tr>
                      <tr className="align-top">
                        <td className="uppercase">NILAI SPK</td>
                        <td className="text-center">:</td>
                        <td>
                          <div className="font-medium">{formatRupiah(project.nilaiSPK)}</div>
                          <div className="italic text-[9.5pt] leading-tight mt-0.5">
                            {terbilangRupiah(project.nilaiSPK)}
                          </div>
                        </td>
                      </tr>
                      <tr className="align-top">
                        <td className="uppercase">TANGGAL SPK</td>
                        <td className="text-center">:</td>
                        <td>{formatTanggalIndonesia(project.tanggalSPK)}</td>
                      </tr>
                      <tr className="align-top">
                        <td className="uppercase">JANGKA WAKTU PELAKSANAAN</td>
                        <td className="text-center">:</td>
                        <td>{formatJangkaWaktu(project.jangkaWaktuHari, project.tipeHari)}</td>
                      </tr>
                      <tr className="align-top">
                        <td className="uppercase">SUMBER DANA</td>
                        <td className="text-center">:</td>
                        <td>{project.sumberDana}</td>
                      </tr>
                      <tr className="align-top">
                        <td className="uppercase">TAHUN ANGGARAN</td>
                        <td className="text-center">:</td>
                        <td>{project.tahunAnggaran}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 space-y-2 text-justify">
                  <p className="indent-10">
                    Dengan ini menyatakan telah mengadakan pemeriksaan Bersama-sama dengan konsultan pelaksana dan diketahui pejabat pelaksana teknis kegiatan (PPTK) yang bersangkutan, terhadap paket {project.namaPaket} {project.lokasi} dan Setelah mengadakan pemeriksaan secara teliti serta mempertimbangkan segala aspek secara seksama terhadap semua hasil pekerjaan telah di laksanakan dengan baik, apabila terdapat cacat tersembunyi dan kekurangan maka pihak konsultan wajib melakukan perbaikan dan melengkapinya.
                  </p>
                  <p className="indent-10">
                    Apabila tidak ada lagi ditemukan pekerjaan yang harus diperbaiki (confirmation of the remedy of the defect and defiences) maka dibuatkan berita acara pembayaran.
                  </p>
                </div>
              </div>

              <div className="text-right text-[8.5pt] text-slate-400 print:hidden pt-4">
                [Halaman 1 dari 2 - BAPHP]
              </div>
            </div>

            {/* --- HALAMAN 2 BAPHP (Persis Halaman 2 Gambar User) --- */}
            <div className="print-page w-[210mm] min-h-[297mm] bg-white text-black px-[12.7mm] py-[10mm] shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-0 font-official text-[10.5pt] leading-[1.15] flex flex-col justify-between">
              <div>
                <p className="text-justify indent-10 mt-6 leading-relaxed">
                  Demikian berita acara pemeriksaan hasil pekerjaan ini dibuat dengan sebenarnya dan penuh rasa tanggung jawab untuk dapat dipergunakan sebagaimana mestinya dengan ketentuan yang berlaku.
                </p>

                <div className="mt-14">
                  <div className="grid grid-cols-2 gap-8 text-center">
                    <div className="flex flex-col items-center">
                      <p className="font-normal">Pelaksana</p>
                      <p className="font-bold uppercase tracking-tight">{project.penyedia.namaPerusahaan}</p>
                      
                      <div className="h-28 flex items-center justify-center relative w-full my-1">
                        {showSignatures && (
                          <div className="relative">
                            <div className="absolute -left-6 -top-2 w-24 h-24 border-2 border-blue-500 rounded-lg opacity-85 rotate-[-8deg] flex flex-col items-center justify-center p-1 text-[7pt] text-blue-700 font-bold uppercase pointer-events-none">
                              <span className="text-[6pt]">BORNEO ENG.</span>
                              <span className="text-[9pt] my-0.5">CV</span>
                              <span className="text-[5.5pt]">TARAKAN</span>
                            </div>
                            <svg className="w-36 h-20 text-blue-800" viewBox="0 0 200 100" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                              <path d="M 20 60 Q 40 20 60 70 T 100 40 Q 130 90 170 30" />
                              <path d="M 50 65 L 160 55" />
                              <path d="M 70 80 Q 120 75 180 60" />
                            </svg>
                          </div>
                        )}
                      </div>

                      <p className="font-bold underline text-[11pt] uppercase">{project.penyedia.namaDirektur}</p>
                      <p className="uppercase text-[10pt] font-semibold">{project.penyedia.jabatan}</p>
                    </div>

                    <div className="flex flex-col items-center">
                      <p className="font-normal">Pejabat Pelaksana Teknis Kegiatan</p>
                      <p className="font-normal opacity-0 select-none">-</p>
                      
                      <div className="h-28 flex items-center justify-center relative w-full my-1">
                        {showSignatures && (
                          <svg className="w-36 h-20 text-black" viewBox="0 0 200 100" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M 30 70 Q 50 10 70 80 T 110 30 Q 130 90 150 20" />
                            <path d="M 60 40 L 140 70" />
                            <circle cx="155" cy="75" r="2" fill="currentColor" />
                          </svg>
                        )}
                      </div>

                      <p className="font-bold underline text-[11pt]">{project.pptk.nama}</p>
                      <p className="text-[10pt]">NIP. {project.pptk.nip}</p>
                    </div>
                  </div>

                  <div className="mt-12 flex flex-col items-center text-center">
                    <p className="font-normal">Untuk dan atas nama</p>
                    <p className="font-bold uppercase tracking-tight">{kopConfig.namaDinas}</p>
                    <p className="font-normal">{project.ppk.jabatan}</p>

                    <div className="h-28 flex items-center justify-center relative w-64 my-1">
                      {showSignatures && (
                        <svg className="w-48 h-20 text-blue-900" viewBox="0 0 200 100" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M 15 50 Q 50 15 80 85 T 140 25 Q 165 95 190 45" />
                          <path d="M 30 50 Q 90 90 180 65" />
                          <path d="M 80 40 Q 110 20 130 60" />
                        </svg>
                      )}
                    </div>

                    <p className="font-bold underline text-[11pt]">{project.ppk.nama}</p>
                    <p className="text-[10pt]">NIP. {project.ppk.nip}</p>
                  </div>
                </div>
              </div>

              {/* QR Code Verifikasi Resmi BPK/Inspektorat */}
              <div className="pt-6 border-t border-slate-300 flex items-center justify-between text-[8pt] text-slate-600">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 border border-black p-0.5 flex flex-col items-center justify-center bg-white">
                    <QrCode className="w-10 h-10 text-black" />
                  </div>
                  <div>
                    <span className="font-bold text-black block">VERIFIKASI DIGITAL SI-BAPHP</span>
                    <span>No. Reg: {project.nomorBAPHP}</span>
                    <span className="block text-[7pt]">Dokumen ini sah & terdaftar pada Database Pengadaan Disdikbud Kaltara</span>
                  </div>
                </div>
                <div className="text-right">
                  [Halaman 2 dari 2 - BAPHP]
                </div>
              </div>
            </div>
          </>
        )}

        {/* ============================================================== */}
        {/* TEMPLATE 2: BAST (Penyedia ke PPK)                             */}
        {/* ============================================================== */}
        {selectedDoc === 'BAST' && (
          <div className="print-page w-[210mm] min-h-[297mm] bg-white text-black px-[12.7mm] py-[10mm] shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-0 font-official text-[10.5pt] leading-[1.15] flex flex-col justify-between">
            <div>
              <OfficialKop config={kopConfig} />
              
              <div className="text-center my-3">
                <h3 className="text-[13pt] font-bold underline uppercase tracking-wide">
                  Berita Acara Serah Terima Pertama Pekerjaan (BAST)
                </h3>
                <p className="text-[11pt] font-semibold mt-1">
                  Nomor : {project.nomorBAST || project.nomorBAPHP.replace('02-100', '02-101')}
                </p>
                <p className="text-[10.5pt] font-medium mt-0.5">
                  Tanggal : {formatTanggalIndonesia(project.tanggalBAST || project.tanggalBAPHP)}
                </p>
              </div>

              <p className="text-justify indent-0 mt-4 font-medium">
                {tglBASTInfo.paragrafPembuka}
              </p>

              <div className="my-3 pl-6 space-y-2">
                <div className="flex">
                  <span className="w-40 font-semibold">1. PIHAK PERTAMA</span>
                  <span className="w-4 text-center">:</span>
                  <div>
                    <span className="font-bold">{project.penyedia.namaDirektur}</span>, bertindak untuk dan atas nama <span className="font-bold">{project.penyedia.namaPerusahaan}</span> berkedudukan di {project.penyedia.alamatPerusahaan}, selanjutnya disebut <span className="font-bold">PIHAK PERTAMA (PENYEDIA)</span>.
                  </div>
                </div>

                <div className="flex">
                  <span className="w-40 font-semibold">2. PIHAK KEDUA</span>
                  <span className="w-4 text-center">:</span>
                  <div>
                    <span className="font-bold">{project.ppk.nama}</span>, NIP. {project.ppk.nip}, selaku {project.ppk.jabatan}, selanjutnya disebut <span className="font-bold">PIHAK KEDUA (PPK)</span>.
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2.5 text-justify">
                <p>
                  Berdasarkan Surat Perintah Kerja (SPK) Nomor: <strong>{project.nomorSPK}</strong> tanggal {formatTanggalIndonesia(project.tanggalSPK)} dan Berita Acara Pemeriksaan Hasil Pekerjaan (BAPHP) Nomor: <strong>{project.nomorBAPHP}</strong> tanggal {formatTanggalIndonesia(project.tanggalBAPHP)}, kedua belah pihak bersepakat:
                </p>

                <ol className="list-decimal pl-8 space-y-1.5">
                  <li>
                    <strong>PIHAK PERTAMA</strong> menyerahkan hasil pekerjaan paket: <strong>{project.namaPaket}</strong> yang berlokasi di {project.lokasi} kepada <strong>PIHAK KEDUA</strong> dalam keadaan selesai 100% dengan baik dan lengkap.
                  </li>
                  <li>
                    <strong>PIHAK KEDUA</strong> menerima penyerahan hasil pekerjaan tersebut setelah dilakukan pemeriksaan secara cermat bersama PPTK dan dinyatakan telah memenuhi seluruh spesifikasi teknis dan Kerangka Acuan Kerja (KAK).
                  </li>
                  <li>
                    Dengan ditandatanganinya Berita Acara Serah Terima ini, maka hak pembayaran atas pelaksanaan pekerjaan tersebut dapat diproses sesuai dengan ketentuan peraturan perundang-undangan.
                  </li>
                </ol>

                <p className="indent-8 mt-3">
                  Demikian Berita Acara Serah Terima Pekerjaan ini dibuat dan ditandatangani oleh kedua belah pihak dalam rangkap secukupnya untuk dipergunakan sebagaimana mestinya.
                </p>
              </div>

              <div className="mt-10 grid grid-cols-2 gap-8 text-center">
                <div className="flex flex-col items-center">
                  <p className="font-bold uppercase">PIHAK PERTAMA (PENYEDIA)</p>
                  <p className="font-semibold uppercase">{project.penyedia.namaPerusahaan}</p>
                  <div className="h-24 flex items-center justify-center">
                    {showSignatures && (
                      <svg className="w-32 h-16 text-blue-800" viewBox="0 0 200 100" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M 20 60 Q 40 20 60 70 T 100 40 Q 130 90 170 30" />
                        <path d="M 50 65 L 160 55" />
                      </svg>
                    )}
                  </div>
                  <p className="font-bold underline uppercase">{project.penyedia.namaDirektur}</p>
                  <p className="uppercase text-[10pt]">{project.penyedia.jabatan}</p>
                </div>

                <div className="flex flex-col items-center">
                  <p className="font-bold uppercase">PIHAK KEDUA (PPK)</p>
                  <p className="font-semibold">{project.ppk.jabatan}</p>
                  <div className="h-24 flex items-center justify-center">
                    {showSignatures && (
                      <svg className="w-40 h-16 text-blue-900" viewBox="0 0 200 100" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M 15 50 Q 50 15 80 85 T 140 25 Q 165 95 190 45" />
                        <path d="M 30 50 Q 90 90 180 65" />
                      </svg>
                    )}
                  </div>
                  <p className="font-bold underline">{project.ppk.nama}</p>
                  <p className="text-[10pt]">NIP. {project.ppk.nip}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-col items-center text-center">
                <p className="font-medium">Mengetahui:</p>
                <p className="font-semibold">{project.pptk.jabatan}</p>
                <div className="h-16 flex items-center justify-center">
                  {showSignatures && (
                    <svg className="w-32 h-14 text-black" viewBox="0 0 200 100" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M 30 70 Q 50 10 70 80 T 110 30" />
                      <path d="M 60 40 L 140 70" />
                    </svg>
                  )}
                </div>
                <p className="font-bold underline">{project.pptk.nama}</p>
                <p className="text-[10pt]">NIP. {project.pptk.nip}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-300 flex items-center justify-between text-[8pt] text-slate-600">
              <div className="flex items-center gap-2">
                <QrCode className="w-8 h-8 text-black" />
                <span>Verifikasi Digital: {project.nomorBAST || project.nomorBAPHP.replace('02-100', '02-101')}</span>
              </div>
              <div>[Berita Acara Serah Terima Pekerjaan]</div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TEMPLATE 3: BAST PPK KE PA/KPA (Pasal 57 ayat 4 Perpres 12/2021) */}
        {/* ============================================================== */}
        {selectedDoc === 'BAST_PA' && (
          <div className="print-page w-[210mm] min-h-[297mm] bg-white text-black px-[12.7mm] py-[10mm] shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-0 font-official text-[10.5pt] leading-[1.15] flex flex-col justify-between">
            <div>
              <OfficialKop config={kopConfig} />

              <div className="text-center my-3">
                <h3 className="text-[13pt] font-bold underline uppercase tracking-wide">
                  Berita Acara Serah Terima Hasil Pekerjaan
                </h3>
                <h4 className="text-[11pt] font-bold uppercase tracking-wide">
                  Dari Pejabat Pembuat Komitmen (PPK) Kepada Pengguna Anggaran (PA)
                </h4>
                <p className="text-[10.5pt] font-semibold mt-1">
                  Nomor : {project.nomorBAST_PA || project.nomorBAPHP.replace('02-100', '02-101.A')}
                </p>
                <p className="text-[10.5pt] font-medium mt-0.5">
                  Tanggal : {formatTanggalIndonesia(project.tanggalBAST_PA || project.tanggalBAST || project.tanggalBAPHP)}
                </p>
                <p className="text-[9pt] italic text-slate-600">
                  (Berdasarkan Pasal 57 ayat (4) Perpres No. 16 Tahun 2018 jo. Perpres No. 12 Tahun 2021)
                </p>
              </div>

              <p className="text-justify indent-0 mt-3 font-medium">
                {tglBASTPAInfo.paragrafPembuka}
              </p>

              <div className="my-3 pl-6 space-y-2">
                <div className="flex">
                  <span className="w-40 font-semibold">1. N a m a</span>
                  <span className="w-4 text-center">:</span>
                  <div>
                    <span className="font-bold">{project.ppk.nama}</span>, NIP. {project.ppk.nip}, selaku {project.ppk.jabatan}, selanjutnya disebut <span className="font-bold">PIHAK PERTAMA</span>.
                  </div>
                </div>

                <div className="flex">
                  <span className="w-40 font-semibold">2. N a m a</span>
                  <span className="w-4 text-center">:</span>
                  <div>
                    <span className="font-bold">{project.paKpa?.nama || 'Drs. H. Teguh Sumarno, M.Pd.'}</span>, NIP. {project.paKpa?.nip || '196811201994121001'}, selaku {project.paKpa?.jabatan || 'Kepala Dinas / Pengguna Anggaran (PA)'}, selanjutnya disebut <span className="font-bold">PIHAK KEDUA</span>.
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2.5 text-justify">
                <p>
                  Dengan memperhatikan:
                </p>
                <ol className="list-decimal pl-8 space-y-1 text-[10.5pt]">
                  <li>Surat Perintah Kerja (SPK) Nomor: <strong>{project.nomorSPK}</strong> tanggal {formatTanggalIndonesia(project.tanggalSPK)};</li>
                  <li>Berita Acara Pemeriksaan Hasil Pekerjaan (BAPHP) Nomor: <strong>{project.nomorBAPHP}</strong> tanggal {formatTanggalIndonesia(project.tanggalBAPHP)};</li>
                  <li>Berita Acara Serah Terima Pekerjaan dari Penyedia Nomor: <strong>{project.nomorBAST || project.nomorBAPHP.replace('02-100', '02-101')}</strong> tanggal {formatTanggalIndonesia(project.tanggalBAST || project.tanggalBAPHP)}.</li>
                </ol>

                <p className="mt-2">
                  Kedua belah pihak telah bersepakat menyatakan:
                </p>
                <ol className="list-decimal pl-8 space-y-1.5 text-[10.5pt]">
                  <li>
                    <strong>PIHAK PERTAMA</strong> menyerahkan hasil pengadaan paket: <strong>{project.namaPaket}</strong> yang berlokasi di <strong>{project.lokasi}</strong> yang dilaksanakan oleh <strong>{project.penyedia.namaPerusahaan}</strong> dengan nilai kontrak <strong>{formatRupiah(project.nilaiSPK)}</strong> kepada <strong>PIHAK KEDUA</strong> dalam keadaan selesai 100% dengan baik.
                  </li>
                  <li>
                    <strong>PIHAK KEDUA</strong> menerima penyerahan hasil pekerjaan tersebut untuk dicatatkan dalam penatausahaan Barang Milik Daerah (BMD) dan diproses pembayaran belanjanya sesuai ketentuan perundang-undangan yang berlaku.
                  </li>
                </ol>

                <p className="indent-8 mt-2">
                  Demikian Berita Acara Serah Terima Hasil Pekerjaan dari PPK kepada PA/KPA ini dibuat dalam rangkap secukupnya untuk dipergunakan sebagaimana mestinya.
                </p>
              </div>

              {/* Tanda Tangan PPK & PA/KPA */}
              <div className="mt-10 grid grid-cols-2 gap-8 text-center">
                <div className="flex flex-col items-center">
                  <p className="font-normal">Yang Menyerahkan,</p>
                  <p className="font-bold">PIHAK PERTAMA (PPK)</p>
                  <div className="h-24 flex items-center justify-center">
                    {showSignatures && (
                      <svg className="w-40 h-16 text-blue-900" viewBox="0 0 200 100" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M 15 50 Q 50 15 80 85 T 140 25 Q 165 95 190 45" />
                        <path d="M 30 50 Q 90 90 180 65" />
                      </svg>
                    )}
                  </div>
                  <p className="font-bold underline">{project.ppk.nama}</p>
                  <p className="text-[10pt]">NIP. {project.ppk.nip}</p>
                </div>

                <div className="flex flex-col items-center">
                  <p className="font-normal">Yang Menerima,</p>
                  <p className="font-bold">PIHAK KEDUA (PENGGUNA ANGGARAN)</p>
                  <div className="h-24 flex items-center justify-center">
                    {showSignatures && (
                      <svg className="w-40 h-16 text-black" viewBox="0 0 200 100" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M 25 60 Q 60 10 90 80 T 150 30" />
                        <path d="M 50 70 L 160 50" />
                      </svg>
                    )}
                  </div>
                  <p className="font-bold underline">{project.paKpa?.nama || 'Drs. H. Teguh Sumarno, M.Pd.'}</p>
                  <p className="text-[10pt]">NIP. {project.paKpa?.nip || '196811201994121001'}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-300 flex items-center justify-between text-[8pt] text-slate-600">
              <div className="flex items-center gap-2">
                <QrCode className="w-8 h-8 text-black" />
                <span>Verifikasi BMD: {project.nomorBAST_PA || project.nomorBAPHP.replace('02-100', '02-101.A')}</span>
              </div>
              <div>[BAST PPK ke Pengguna Anggaran - Pasal 57 Perpres 12/2021]</div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TEMPLATE 4: BAP (Berita Acara Pembayaran)                      */}
        {/* ============================================================== */}
        {selectedDoc === 'BAP' && (
          <div className="print-page w-[210mm] min-h-[297mm] bg-white text-black px-[12.7mm] py-[10mm] shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-0 font-official text-[10.5pt] leading-[1.15] flex flex-col justify-between">
            <div>
              <OfficialKop config={kopConfig} />

              <div className="text-center my-3">
                <h3 className="text-[13pt] font-bold underline uppercase tracking-wide">
                  {isTermin && activeTermin 
                    ? `Berita Acara Pembayaran ${activeTermin.namaTermin.toUpperCase()} (BAP)` 
                    : 'Berita Acara Pembayaran (BAP 100%)'}
                </h3>
                <p className="text-[10.5pt] font-semibold mt-1">
                  Nomor : {project.nomorBAP || project.nomorBAPHP.replace('02-100', '02-102')}
                </p>
                <p className="text-[10.5pt] font-medium mt-0.5">
                  Tanggal : {formatTanggalIndonesia(project.tanggalBAP || project.tanggalBAPHP)}
                </p>
              </div>

              <p className="text-justify indent-0 mt-3 font-medium">
                {tglBAPInfo.paragrafPembuka}
              </p>

              <div className="my-2.5 pl-4 space-y-1.5">
                <div className="flex">
                  <span className="w-36">Nama PPK</span>
                  <span className="w-4 text-center">:</span>
                  <span className="font-bold">{project.ppk.nama}</span>
                </div>
                <div className="flex">
                  <span className="w-36">Jabatan</span>
                  <span className="w-4 text-center">:</span>
                  <span>{project.ppk.jabatan}</span>
                </div>
                <div className="flex">
                  <span className="w-36">Nama Penyedia</span>
                  <span className="w-4 text-center">:</span>
                  <span className="font-bold">{project.penyedia.namaDirektur}</span>
                </div>
                <div className="flex">
                  <span className="w-36">Nama Perusahaan</span>
                  <span className="w-4 text-center">:</span>
                  <span className="font-bold uppercase">{project.penyedia.namaPerusahaan}</span>
                </div>
              </div>

              <p className="text-justify my-2">
                Berdasarkan Surat Perintah Kerja (SPK) Nomor: <strong>{project.nomorSPK}</strong> tanggal {formatTanggalIndonesia(project.tanggalSPK)}, dan {isTermin ? `BAKP Kemajuan Prestasi Fisik Nomor: ${project.nomorBAKP || project.nomorBAPHP}` : `BAPHP Nomor: ${project.nomorBAPHP}`}, sesuai ketentuan <strong>Pasal 53 Perpres No. 12 Tahun 2021</strong> dan <strong>Permendagri No. 77 Tahun 2020</strong>, dengan ini disetujui pembayaran {isTermin ? `atas ${activeTermin?.namaTermin}` : 'atas penyelesaian pekerjaan 100%'} dengan rincian administrasi keuangan:
              </p>

              <div className="border border-black my-3">
                <table className="w-full text-[10pt] border-collapse">
                  <tbody>
                    <tr className="border-b border-black">
                      <td className="p-1.5 w-8 text-center font-bold">1.</td>
                      <td className="p-1.5">Nilai Total Kontrak / SPK</td>
                      <td className="p-1.5 w-8 text-center">:</td>
                      <td className="p-1.5 w-40 text-right font-mono font-bold">{formatRupiah(project.nilaiSPK)}</td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="p-1.5 w-8 text-center font-bold">2.</td>
                      <td className="p-1.5">Prestasi Kemajuan Fisik Kumulatif ({bobotAktif}%)</td>
                      <td className="p-1.5 w-8 text-center">:</td>
                      <td className="p-1.5 text-right font-mono font-bold">{formatRupiah(Math.round((bobotAktif / 100) * project.nilaiSPK))}</td>
                    </tr>
                    <tr className="border-b border-black bg-slate-50 print:bg-transparent">
                      <td className="p-1.5 w-8 text-center font-bold">3.</td>
                      <td className="p-1.5 font-bold">Jumlah Bruto Tagihan {isTermin ? (activeTermin?.namaTermin || '') : 'Pekerjaan (100%)'}</td>
                      <td className="p-1.5 w-8 text-center">:</td>
                      <td className="p-1.5 text-right font-mono font-bold">{formatRupiah(nilaiKotor)}</td>
                    </tr>
                    {potonganUM > 0 && (
                      <tr className="border-b border-black">
                        <td className="p-1.5 w-8 text-center font-bold">4.</td>
                        <td className="p-1.5">Potongan Angsuran Pengembalian Uang Muka</td>
                        <td className="p-1.5 w-8 text-center">:</td>
                        <td className="p-1.5 text-right font-mono text-red-600 print:text-black">({formatRupiah(potonganUM)})</td>
                      </tr>
                    )}
                    {potonganRetensi > 0 && (
                      <tr className="border-b border-black">
                        <td className="p-1.5 w-8 text-center font-bold">5.</td>
                        <td className="p-1.5">Potongan Jaminan Retensi Pemeliharaan (5%)</td>
                        <td className="p-1.5 w-8 text-center">:</td>
                        <td className="p-1.5 text-right font-mono text-red-600 print:text-black">({formatRupiah(potonganRetensi)})</td>
                      </tr>
                    )}
                    <tr className="border-b border-black bg-slate-50 print:bg-transparent">
                      <td className="p-1.5 w-8 text-center font-bold">6.</td>
                      <td className="p-1.5">Potongan Pajak Penghasilan (PPh {pphPercent}%)</td>
                      <td className="p-1.5 w-8 text-center">:</td>
                      <td className="p-1.5 text-right font-mono text-red-600 print:text-black">({formatRupiah(pphNilai)})</td>
                    </tr>
                    <tr className="font-bold bg-slate-100 print:bg-transparent border-t-2 border-black">
                      <td className="p-2 text-center">7.</td>
                      <td className="p-2 uppercase">Jumlah Pembayaran Bersih (Netto) yang Ditransfer</td>
                      <td className="p-2 text-center">:</td>
                      <td className="p-2 text-right font-mono text-[11pt] text-emerald-800 print:text-black">{formatRupiah(nilaiBersih)}</td>
                    </tr>
                    {isTermin && (
                      <tr className="border-t border-black bg-slate-50/50 print:bg-transparent text-[9.5pt]">
                        <td className="p-1.5 text-center italic">8.</td>
                        <td className="p-1.5 italic">Sisa Nilai Kontrak Belum Ditagihkan</td>
                        <td className="p-1.5 text-center">:</td>
                        <td className="p-1.5 text-right font-mono italic">{formatRupiah(sisaKontrak)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-50 print:bg-transparent border border-dashed border-black p-2 my-2 text-[9.5pt]">
                <p className="font-bold">Terbilang Pembayaran Bersih:</p>
                <p className="italic">{terbilangRupiah(nilaiBersih)}</p>
              </div>

              <div className="my-2.5">
                <p className="font-bold mb-1">Pembayaran tersebut di atas disalurkan ke rekening penyedia:</p>
                <table className="w-full text-[10pt]">
                  <tbody>
                    <tr>
                      <td className="w-40">Nama Bank</td>
                      <td className="w-4 text-center">:</td>
                      <td className="font-semibold">{project.penyedia.bankNama}</td>
                    </tr>
                    <tr>
                      <td>Nomor Rekening</td>
                      <td className="w-4 text-center">:</td>
                      <td className="font-mono font-bold tracking-wider">{project.penyedia.nomorRekening}</td>
                    </tr>
                    <tr>
                      <td>Atas Nama Rekening</td>
                      <td className="w-4 text-center">:</td>
                      <td className="font-semibold">{project.penyedia.atasNamaRekening}</td>
                    </tr>
                    <tr>
                      <td>NPWP Perusahaan</td>
                      <td className="w-4 text-center">:</td>
                      <td className="font-mono">{project.penyedia.npwp}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-justify indent-6 mt-2">
                Demikian Berita Acara Pembayaran ini dibuat dengan sebenarnya dalam rangkap secukupnya untuk dipergunakan sebagai kelengkapan Surat Perintah Membayar (SPM) dan Surat Perintah Pencairan Dana (SP2D).
              </p>

              <div className="mt-8 grid grid-cols-2 gap-8 text-center">
                <div className="flex flex-col items-center">
                  <p className="font-bold uppercase">PENYEDIA JASA</p>
                  <p className="font-semibold uppercase">{project.penyedia.namaPerusahaan}</p>
                  <div className="h-20 flex items-center justify-center">
                    {showSignatures && (
                      <svg className="w-32 h-16 text-blue-800" viewBox="0 0 200 100" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M 20 60 Q 40 20 60 70 T 100 40 Q 130 90 170 30" />
                        <path d="M 50 65 L 160 55" />
                      </svg>
                    )}
                  </div>
                  <p className="font-bold underline uppercase">{project.penyedia.namaDirektur}</p>
                  <p className="text-[9.5pt]">{project.penyedia.jabatan}</p>
                </div>

                <div className="flex flex-col items-center">
                  <p className="font-bold uppercase">PEJABAT PEMBUAT KOMITMEN</p>
                  <p className="font-semibold">{project.ppk.jabatan}</p>
                  <div className="h-20 flex items-center justify-center">
                    {showSignatures && (
                      <svg className="w-40 h-16 text-blue-900" viewBox="0 0 200 100" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M 15 50 Q 50 15 80 85 T 140 25 Q 165 95 190 45" />
                        <path d="M 30 50 Q 90 90 180 65" />
                      </svg>
                    )}
                  </div>
                  <p className="font-bold underline">{project.ppk.nama}</p>
                  <p className="text-[9.5pt]">NIP. {project.ppk.nip}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-300 flex items-center justify-between text-[8pt] text-slate-600">
              <div className="flex items-center gap-2">
                <QrCode className="w-8 h-8 text-black" />
                <span>Verifikasi Kasda: {project.nomorBAP || project.nomorBAPHP.replace('02-100', '02-102')}</span>
              </div>
              <div>[Berita Acara Pembayaran]</div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TEMPLATE 5: KUITANSI DINAS RESMI                               */}
        {/* ============================================================== */}
        {selectedDoc === 'KUITANSI' && (
          <div className="print-page w-[210mm] min-h-[297mm] bg-white text-black px-[12.7mm] py-[10mm] shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-0 font-official text-[10.5pt] leading-[1.15] flex flex-col justify-between">
            <div>
              <OfficialKop config={kopConfig} />

              <div className="text-center my-3">
                <h3 className="text-[14pt] font-bold underline uppercase tracking-wider">
                  K U I T A N S I
                </h3>
                <p className="text-[10.5pt] font-semibold mt-1">
                  Nomor Bukti : {project.nomorKuitansi || project.nomorSPK.replace('PPK-SPK-PL', 'KWT-DISDIK')}
                </p>
                <p className="text-[10.5pt] font-medium mt-0.5">
                  Tanggal : {formatTanggalIndonesia(project.tanggalKuitansi || project.tanggalBAP || project.tanggalBAPHP)}
                </p>
              </div>

              <div className="border-t border-b border-black py-4 my-4 space-y-3">
                <div className="flex">
                  <span className="w-48 font-bold">Sudah Terima Dari</span>
                  <span className="w-4 text-center">:</span>
                  <span className="font-semibold uppercase">
                    PENGGUNA ANGGARAN / KUASA PENGGUNA ANGGARAN {kopConfig.namaDinas}
                  </span>
                </div>

                <div className="flex">
                  <span className="w-48 font-bold">Uang Sebesar</span>
                  <span className="w-4 text-center">:</span>
                  <div className="bg-slate-100 print:bg-transparent px-3 py-1 font-bold text-[12pt] font-mono border border-black inline-block">
                    {formatRupiah(nilaiKotor)}
                  </div>
                </div>

                <div className="flex">
                  <span className="w-48 font-bold">Terbilang</span>
                  <span className="w-4 text-center">:</span>
                  <div className="font-semibold italic flex-1">
                    {terbilangRupiah(nilaiKotor)}
                  </div>
                </div>

                <div className="flex align-top">
                  <span className="w-48 font-bold">Untuk Pembayaran</span>
                  <span className="w-4 text-center">:</span>
                  <div className="flex-1 text-justify">
                    {isTermin && activeTermin ? (
                      <>
                        Pembayaran <strong>{activeTermin.namaTermin}</strong> atas pelaksanaan pekerjaan <strong>{project.namaPaket}</strong> pada {project.lokasi} berdasarkan Surat Perintah Kerja (SPK) Nomor: <strong>{project.nomorSPK}</strong> tanggal {formatTanggalIndonesia(project.tanggalSPK)} dan BAP Nomor: <strong>{activeTermin.nomorBAP || project.nomorBAP || project.nomorBAPHP}</strong>.
                      </>
                    ) : (
                      <>
                        Pembayaran 100% (Seratus Persen) atas pekerjaan <strong>{project.namaPaket}</strong> pada {project.lokasi} Berdasarkan Surat Perintah Kerja (SPK) Nomor: <strong>{project.nomorSPK}</strong> tanggal {formatTanggalIndonesia(project.tanggalSPK)} dan BAPHP Nomor: <strong>{project.nomorBAPHP}</strong>.
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="my-3 text-[10pt]">
                <table className="w-full">
                  <tbody>
                    <tr>
                      <td className="w-48">Program</td>
                      <td className="w-4 text-center">:</td>
                      <td>{project.program}</td>
                    </tr>
                    <tr>
                      <td>Kegiatan</td>
                      <td className="w-4 text-center">:</td>
                      <td>{project.kegiatan}</td>
                    </tr>
                    <tr>
                      <td>Nomor DPA-SKPD</td>
                      <td className="w-4 text-center">:</td>
                      <td className="font-mono">{project.nomorDPA || 'DPA/A.1/1.01.2.22.0.00.01.0000/001/2026'}</td>
                    </tr>
                    <tr>
                      <td>Tahun Anggaran</td>
                      <td className="w-4 text-center">:</td>
                      <td>{project.tahunAnggaran}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-8">
                <div className="text-right text-[10pt] mb-2 font-medium">
                  {kopConfig.kotaKedudukan}, {formatTanggalIndonesia(project.tanggalKuitansi || project.tanggalBAP || project.tanggalBAPHP)}
                </div>

                <div className="grid grid-cols-2 gap-8 text-center">
                  <div className="flex flex-col items-center">
                    <p className="font-normal">Yang Menerima,</p>
                    <p className="font-bold uppercase">{project.penyedia.namaPerusahaan}</p>
                    
                    <div className="h-28 flex items-center justify-center relative w-48 border border-dashed border-slate-300 print:border-none my-1">
                      <div className="border border-black px-2 py-3 text-[7.5pt] uppercase text-center font-sans tracking-widest font-bold">
                        Meterai<br />Rp 10.000
                      </div>
                      {showSignatures && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-36 h-20 text-blue-800" viewBox="0 0 200 100" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M 20 60 Q 40 20 60 70 T 100 40 Q 130 90 170 30" />
                            <path d="M 50 65 L 160 55" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <p className="font-bold underline uppercase">{project.penyedia.namaDirektur}</p>
                    <p className="uppercase text-[9.5pt]">{project.penyedia.jabatan}</p>
                  </div>

                  <div className="flex flex-col items-center">
                    <p className="font-normal">Setuju Dibayar,</p>
                    <p className="font-bold">{project.ppk.jabatan}</p>
                    
                    <div className="h-28 flex items-center justify-center">
                      {showSignatures && (
                        <svg className="w-40 h-20 text-blue-900" viewBox="0 0 200 100" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M 15 50 Q 50 15 80 85 T 140 25 Q 165 95 190 45" />
                          <path d="M 30 50 Q 90 90 180 65" />
                        </svg>
                      )}
                    </div>

                    <p className="font-bold underline">{project.ppk.nama}</p>
                    <p className="text-[9.5pt]">NIP. {project.ppk.nip}</p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col items-center text-center">
                  <p className="font-normal">Lunas Dibayar / Telah Diuji Kebenarannya:</p>
                  <p className="font-semibold">{project.pptk.jabatan}</p>
                  <div className="h-16 flex items-center justify-center">
                    {showSignatures && (
                      <svg className="w-32 h-14 text-black" viewBox="0 0 200 100" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M 30 70 Q 50 10 70 80 T 110 30" />
                        <path d="M 60 40 L 140 70" />
                      </svg>
                    )}
                  </div>
                  <p className="font-bold underline">{project.pptk.nama}</p>
                  <p className="text-[9.5pt]">NIP. {project.pptk.nip}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-300 flex items-center justify-between text-[8pt] text-slate-600">
              <div className="flex items-center gap-2">
                <QrCode className="w-8 h-8 text-black" />
                <span>Bukti Kas: {project.nomorKuitansi || project.nomorSPK.replace('PPK-SPK-PL', 'KWT-DISDIK')}</span>
              </div>
              <div>[Kuitansi Resmi Pembayaran Proyek]</div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TEMPLATE 6: SERAH TERIMA LAPANGAN (Awal Pelaksanaan Kontrak)    */}
        {/* ============================================================== */}
        {selectedDoc === 'BA_STL' && (
          <div className="print-page w-[210mm] min-h-[297mm] bg-white text-black px-[12.7mm] py-[10mm] shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-0 font-official text-[10.5pt] leading-[1.15] flex flex-col justify-between">
            <div>
              <OfficialKop config={kopConfig} />

              <div className="text-center my-3">
                <h3 className="text-[13pt] font-bold underline uppercase tracking-wide">
                  Berita Acara Serah Terima Lapangan (BA-STL)
                </h3>
                <p className="text-[10.5pt] font-semibold mt-1">
                  Nomor : {project.nomorBA_STL || project.nomorBAPHP.replace('02-100', '02-098')}
                </p>
                <p className="text-[10.5pt] font-medium mt-0.5">
                  Tanggal : {formatTanggalIndonesia(project.tanggalBA_STL || project.tanggalMulai || project.tanggalSPK)}
                </p>
                <p className="text-[9pt] italic text-slate-600">
                  (Berdasarkan Peraturan LKPP No. 12 Tahun 2021)
                </p>
              </div>

              <p className="text-justify indent-0 mt-3 font-medium">
                {tglSTLInfo.paragrafPembuka}
              </p>

              <div className="my-3 pl-6 space-y-2">
                <div className="flex">
                  <span className="w-36 font-semibold">1. N a m a</span>
                  <span className="w-4 text-center">:</span>
                  <div>
                    <span className="font-bold">{project.ppk.nama}</span>, NIP. {project.ppk.nip}, selaku {project.ppk.jabatan}, bertindak untuk dan atas nama {kopConfig.namaDinas}, selanjutnya disebut <span className="font-bold">PIHAK PERTAMA</span>.
                  </div>
                </div>

                <div className="flex">
                  <span className="w-36 font-semibold">2. N a m a</span>
                  <span className="w-4 text-center">:</span>
                  <div>
                    <span className="font-bold">{project.penyedia.namaDirektur}</span>, selaku {project.penyedia.jabatan} {project.penyedia.namaPerusahaan}, selanjutnya disebut <span className="font-bold">PIHAK KEDUA</span>.
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-justify">
                <p>
                  Berdasarkan Surat Perintah Kerja (SPK) Nomor: <strong>{project.nomorSPK}</strong> tanggal {formatTanggalIndonesia(project.tanggalSPK)}, kedua belah pihak menyatakan:
                </p>
                <ol className="list-decimal pl-8 space-y-1.5">
                  <li>
                    <strong>PIHAK PERTAMA</strong> menyerahkan lokasi pekerjaan: <strong>{project.namaPaket}</strong> yang bertempat di <strong>{project.lokasi}</strong> kepada <strong>PIHAK KEDUA</strong> dalam kondisi bebas sengketa dan siap untuk dimulainya pelaksanaan pekerjaan.
                  </li>
                  <li>
                    <strong>PIHAK KEDUA</strong> menerima penyerahan lapangan tersebut dan bertanggung jawab penuh atas keamanan, ketertiban, kebersihan lingkungan sekolah, dan keselamatan kerja (K3) selama masa pelaksanaan berlangsung.
                  </li>
                  <li>
                    Jangka waktu pelaksanaan pekerjaan terhitung mulai tanggal {formatTanggalIndonesia(project.tanggalMulai)} selama {project.jangkaWaktuHari} ({terbilang(project.jangkaWaktuHari)}) hari kalender.
                  </li>
                </ol>

                <p className="indent-8 mt-2">
                  Demikian Berita Acara Serah Terima Lapangan ini dibuat untuk dipergunakan sebagaimana mestinya.
                </p>
              </div>

              <div className="mt-12 grid grid-cols-2 gap-8 text-center">
                <div className="flex flex-col items-center">
                  <p className="font-normal">Yang Menerima Lapangan,</p>
                  <p className="font-bold uppercase">PIHAK KEDUA (PENYEDIA)</p>
                  <p className="font-semibold uppercase text-[10pt]">{project.penyedia.namaPerusahaan}</p>
                  <div className="h-24 flex items-center justify-center">
                    {showSignatures && (
                      <svg className="w-32 h-16 text-blue-800" viewBox="0 0 200 100" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M 20 60 Q 40 20 60 70 T 100 40 Q 130 90 170 30" />
                        <path d="M 50 65 L 160 55" />
                      </svg>
                    )}
                  </div>
                  <p className="font-bold underline uppercase">{project.penyedia.namaDirektur}</p>
                  <p className="text-[10pt]">{project.penyedia.jabatan}</p>
                </div>

                <div className="flex flex-col items-center">
                  <p className="font-normal">Yang Menyerahkan Lapangan,</p>
                  <p className="font-bold uppercase">PIHAK PERTAMA (PPK)</p>
                  <p className="font-semibold text-[10pt]">{project.ppk.jabatan}</p>
                  <div className="h-24 flex items-center justify-center">
                    {showSignatures && (
                      <svg className="w-40 h-16 text-blue-900" viewBox="0 0 200 100" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M 15 50 Q 50 15 80 85 T 140 25 Q 165 95 190 45" />
                        <path d="M 30 50 Q 90 90 180 65" />
                      </svg>
                    )}
                  </div>
                  <p className="font-bold underline">{project.ppk.nama}</p>
                  <p className="text-[10pt]">NIP. {project.ppk.nip}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-300 flex items-center justify-between text-[8pt] text-slate-600">
              <div className="flex items-center gap-2">
                <QrCode className="w-8 h-8 text-black" />
                <span>Registrasi BA-STL: {project.nomorBA_STL || project.nomorBAPHP.replace('02-100', '02-098')}</span>
              </div>
              <div>[Berita Acara Serah Terima Lapangan]</div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TEMPLATE 7: SURAT PERMOHONAN PEMBAYARAN DARI REKANAN           */}
        {/* ============================================================== */}
        {selectedDoc === 'SURAT_REKANAN' && (
          <div className="print-page w-[210mm] min-h-[297mm] bg-white text-black px-[12.7mm] py-[10mm] shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-0 font-official text-[10.5pt] leading-[1.15] flex flex-col justify-between">
            <div>
              {/* Kop Perusahaan Rekanan */}
              <div className="border-b-2 border-black pb-3 text-center">
                <h2 className="text-[14pt] font-extrabold uppercase tracking-wide">
                  {project.penyedia.namaPerusahaan}
                </h2>
                <p className="text-[10pt] italic">
                  {project.penyedia.alamatPerusahaan}
                </p>
                <p className="text-[9.5pt]">
                  NPWP: {project.penyedia.npwp} · Rekening: {project.penyedia.bankNama} ({project.penyedia.nomorRekening})
                </p>
              </div>

              <div className="flex justify-between items-start my-6 text-[10.5pt]">
                <div>
                  <table>
                    <tbody>
                      <tr>
                        <td className="w-24">Nomor</td>
                        <td className="w-4 text-center">:</td>
                        <td className="font-mono">{project.nomorSuratRekanan || `012/TAG-KONTRAK/${project.penyedia.bentukUsaha}/VI/${project.tahunAnggaran}`}</td>
                      </tr>
                      <tr>
                        <td>Tanggal</td>
                        <td className="text-center">:</td>
                        <td>{formatTanggalIndonesia(project.tanggalSuratRekanan || project.tanggalBAPHP)}</td>
                      </tr>
                      <tr>
                        <td>Lampiran</td>
                        <td className="text-center">:</td>
                        <td>1 (Satu) Berkas Lengkap</td>
                      </tr>
                      <tr>
                        <td>Perihal</td>
                        <td className="text-center">:</td>
                        <td className="font-bold underline">Permohonan Pembayaran 100% (Seratus Persen)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="text-right">
                  {project.kabupatenKota}, {formatTanggalIndonesia(project.tanggalBAPHP)}
                </div>
              </div>

              <div className="my-4 text-[10.5pt]">
                <p>Kepada Yth:</p>
                <p className="font-bold">{project.ppk.jabatan}</p>
                <p className="font-semibold">{kopConfig.namaDinas}</p>
                <p>di -</p>
                <p className="font-semibold pl-4">{kopConfig.kotaKedudukan}</p>
              </div>

              <div className="space-y-3 text-justify text-[10.5pt] leading-relaxed">
                <p className="indent-8">
                  Dengan hormat, sehubungan telah selesainya seluruh rangkaian pekerjaan untuk paket:
                </p>
                
                <div className="border border-black p-3 bg-slate-50 print:bg-transparent text-[10pt]">
                  <table className="w-full">
                    <tbody>
                      <tr>
                        <td className="w-40 font-semibold">Paket Pekerjaan</td>
                        <td className="w-4 text-center">:</td>
                        <td className="font-bold">{project.namaPaket}</td>
                      </tr>
                      <tr>
                        <td className="font-semibold">Lokasi</td>
                        <td className="text-center">:</td>
                        <td>{project.lokasi}</td>
                      </tr>
                      <tr>
                        <td className="font-semibold">Nomor SPK</td>
                        <td className="text-center">:</td>
                        <td className="font-mono">{project.nomorSPK}</td>
                      </tr>
                      <tr>
                        <td className="font-semibold">Nilai SPK</td>
                        <td className="text-center">:</td>
                        <td className="font-mono font-bold">{formatRupiah(project.nilaiSPK)} ({terbilangRupiah(project.nilaiSPK)})</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="indent-8">
                  Bersama ini kami mengajukan permohonan pembayaran sebesar 100% (Seratus Persen) senilai <strong>{formatRupiah(project.nilaiSPK)}</strong>, dan kiranya pembayaran tersebut dapat ditransfer ke rekening kami:
                </p>

                <div className="pl-8 text-[10pt] space-y-0.5">
                  <p>Nama Bank : <strong>{project.penyedia.bankNama}</strong></p>
                  <p>Nomor Rekening : <strong className="font-mono">{project.penyedia.nomorRekening}</strong></p>
                  <p>Atas Nama : <strong>{project.penyedia.atasNamaRekening}</strong></p>
                </div>

                <p className="indent-8">
                  Sebagai bahan pertimbangan dan kelengkapan administrasi pengajuan Surat Perintah Membayar (SPM), bersama ini kami lampirkan:
                </p>
                <ol className="list-decimal pl-12 text-[10pt] space-y-0.5">
                  <li>Surat Perintah Kerja (SPK);</li>
                  <li>Berita Acara Pemeriksaan Hasil Pekerjaan (BAPHP);</li>
                  <li>Berita Acara Serah Terima Pekerjaan (BAST);</li>
                  <li>Berita Acara Pembayaran (BAP);</li>
                  <li>Kuitansi Bermeterai Rp 10.000;</li>
                  <li>Laporan Akhir Hasil Pekerjaan & Foto Dokumentasi;</li>
                  <li>Fotokopi NPWP dan Rekening Koran Bank.</li>
                </ol>

                <p className="indent-8">
                  Demikian surat permohonan ini kami sampaikan. Atas perhatian dan kerjasamanya kami ucapkan terima kasih.
                </p>
              </div>

              <div className="mt-8 flex justify-end text-center">
                <div className="w-72">
                  <p className="font-normal">Hormat kami,</p>
                  <p className="font-bold uppercase">{project.penyedia.namaPerusahaan}</p>
                  <div className="h-24 flex items-center justify-center">
                    {showSignatures && (
                      <svg className="w-32 h-16 text-blue-800" viewBox="0 0 200 100" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M 20 60 Q 40 20 60 70 T 100 40 Q 130 90 170 30" />
                        <path d="M 50 65 L 160 55" />
                      </svg>
                    )}
                  </div>
                  <p className="font-bold underline uppercase">{project.penyedia.namaDirektur}</p>
                  <p className="text-[10pt]">{project.penyedia.jabatan}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-300 flex items-center justify-between text-[8pt] text-slate-600">
              <div>Surat Pengantar Permohonan Pembayaran Penyedia Jasa</div>
              <div>[Lampiran Berkas Pencairan SPP-LS]</div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TEMPLATE 8: LEMBAR DOKUMENTASI FOTO FISIK                      */}
        {/* ============================================================== */}
        {selectedDoc === 'LAMPIRAN_FOTO' && (
          <div className="print-page w-[210mm] min-h-[297mm] bg-white text-black px-[12.7mm] py-[10mm] shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-0 font-official text-[10.5pt] leading-[1.15] flex flex-col justify-between">
            <div>
              <OfficialKop config={kopConfig} />

              <div className="text-center my-3">
                <h3 className="text-[13pt] font-bold underline uppercase tracking-wide">
                  Lampiran Foto Dokumentasi Hasil Pekerjaan (100%)
                </h3>
                <p className="text-[10.5pt] font-semibold mt-1">
                  Nomor : Lampiran BAPHP No. {project.nomorBAPHP}
                </p>
                <p className="text-[10.5pt] font-medium mt-0.5">
                  Tanggal : {formatTanggalIndonesia(project.tanggalBAPHP)}
                </p>
                <p className="text-[10pt] font-medium mt-0.5 text-slate-700">
                  Paket: {project.namaPaket} — {project.lokasi}
                </p>
              </div>

              {/* Grid Foto Dokumentasi */}
              <div className="grid grid-cols-2 gap-4 my-4">
                <div className="border border-black p-2 flex flex-col items-center">
                  <div className="w-full h-44 bg-slate-100 border border-slate-300 flex flex-col items-center justify-center text-slate-400 overflow-hidden relative group">
                    {project.fotoDokumentasi?.kondisi100 ? (
                      <img 
                        src={project.fotoDokumentasi.kondisi100} 
                        alt="Foto Titik 1" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <>
                        <ImageIcon className="w-10 h-10 mb-1" />
                        <span className="text-[10pt] font-bold text-slate-700">Foto Titik 1: Siring & Semenisasi</span>
                        <span className="text-[8.5pt]">Kondisi 100% Selesai Sesuai Gambar Rencana</span>
                      </>
                    )}
                  </div>
                  {onUpdateProject && (
                    <label className="no-print mt-1 cursor-pointer inline-flex items-center gap-1 text-[9pt] font-semibold text-blue-600 hover:text-blue-800">
                      <UploadCloud className="w-3 h-3" />
                      <span>{project.fotoDokumentasi?.kondisi100 ? 'Ganti Foto' : 'Unggah Foto'}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              onUpdateProject({
                                ...project,
                                fotoDokumentasi: {
                                  ...(project.fotoDokumentasi || {}),
                                  kondisi100: ev.target?.result as string
                                }
                              });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  )}
                  <p className="text-[9.5pt] font-semibold mt-1 text-center">
                    Tampak Depan Pembangunan Siring Penahan Tanah
                  </p>
                </div>

                <div className="border border-black p-2 flex flex-col items-center">
                  <div className="w-full h-44 bg-slate-100 border border-slate-300 flex flex-col items-center justify-center text-slate-400 overflow-hidden relative group">
                    {project.fotoDokumentasi?.kondisi50 ? (
                      <img 
                        src={project.fotoDokumentasi.kondisi50} 
                        alt="Foto Titik 2" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <>
                        <ImageIcon className="w-10 h-10 mb-1" />
                        <span className="text-[10pt] font-bold text-slate-700">Foto Titik 2: Jalan Masuk Sekolah</span>
                        <span className="text-[8.5pt]">Kondisi 100% Semenisasi Mutu Beton K-225</span>
                      </>
                    )}
                  </div>
                  {onUpdateProject && (
                    <label className="no-print mt-1 cursor-pointer inline-flex items-center gap-1 text-[9pt] font-semibold text-blue-600 hover:text-blue-800">
                      <UploadCloud className="w-3 h-3" />
                      <span>{project.fotoDokumentasi?.kondisi50 ? 'Ganti Foto' : 'Unggah Foto'}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              onUpdateProject({
                                ...project,
                                fotoDokumentasi: {
                                  ...(project.fotoDokumentasi || {}),
                                  kondisi50: ev.target?.result as string
                                }
                              });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  )}
                  <p className="text-[9.5pt] font-semibold mt-1 text-center">
                    Tampak Memanjang Jalan Masuk {project.lokasi}
                  </p>
                </div>
              </div>

              <div className="border border-black p-3 bg-slate-50 print:bg-transparent text-[9.5pt] my-2">
                <p className="font-bold">Keterangan Pemeriksaan Bersama di Lokasi Sekolah:</p>
                <p className="text-justify mt-1">
                  Foto dokumentasi ini diambil pada saat pemeriksaan lapangan bersama tanggal {formatTanggalIndonesia(project.tanggalBAPHP)} oleh PPK, PPTK, dan Konsultan/Pelaksana. Seluruh pekerjaan siring dan semenisasi jalan masuk {project.lokasi} telah tuntas 100% dan berfungsi dengan baik untuk akses civitas sekolah.
                </p>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-8 text-center text-[10pt]">
                <div className="flex flex-col items-center">
                  <p className="font-normal">Pelaksana Lapangan,</p>
                  <p className="font-bold uppercase">{project.penyedia.namaPerusahaan}</p>
                  <div className="h-16 flex items-center justify-center">
                    {showSignatures && (
                      <svg className="w-28 h-12 text-blue-800" viewBox="0 0 200 100" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M 20 60 Q 40 20 60 70 T 100 40" />
                      </svg>
                    )}
                  </div>
                  <p className="font-bold underline uppercase">{project.penyedia.namaDirektur}</p>
                </div>

                <div className="flex flex-col items-center">
                  <p className="font-normal">Mengetahui / Memeriksa,</p>
                  <p className="font-bold">{project.pptk.jabatan}</p>
                  <div className="h-16 flex items-center justify-center">
                    {showSignatures && (
                      <svg className="w-28 h-12 text-black" viewBox="0 0 200 100" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M 30 70 Q 50 10 70 80 T 110 30" />
                      </svg>
                    )}
                  </div>
                  <p className="font-bold underline">{project.pptk.nama}</p>
                  <p>NIP. {project.pptk.nip}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-300 flex items-center justify-between text-[8pt] text-slate-600">
              <div>[Lampiran Dokumentasi Foto Proyek Fisik Sekolah]</div>
              <div>Halaman Lampiran Visual BAPHP</div>
            </div>
          </div>
        )}

        {/* Existing: BAKP & CHECKLIST */}
        {selectedDoc === 'BAKP' && (
          <div className="print-page w-[210mm] min-h-[297mm] bg-white text-black px-[12.7mm] py-[10mm] shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-0 font-official text-[10.5pt] leading-[1.15] flex flex-col justify-between">
            <div>
              <OfficialKop config={kopConfig} />
              <div className="text-center my-3">
                <h3 className="text-[13pt] font-bold underline uppercase tracking-wide">
                  Berita Acara Kemajuan Prestasi Pekerjaan (BAKP)
                </h3>
                <p className="text-[11pt] font-semibold mt-1">
                  Nomor : {project.nomorBAKP || project.nomorBAPHP.replace('02-100', '02-103')}
                </p>
                <p className="text-[10.5pt] font-medium mt-0.5">
                  Tanggal : {formatTanggalIndonesia(project.tanggalBAKP || project.tanggalBAPHP)}
                </p>
              </div>
              <p className="text-justify indent-0 mt-4 font-medium">
                {tglBAPHPInfo.paragrafPembuka}
              </p>
              <div className="mt-4 space-y-3 text-justify">
                <p>
                  Setelah melakukan opname dan verifikasi fisik di lapangan terhadap pelaksanaan paket <strong>{project.namaPaket}</strong> pada <strong>{project.lokasi}</strong> berdasarkan Surat Perintah Kerja (SPK) Nomor <strong>{project.nomorSPK}</strong> tanggal {formatTanggalIndonesia(project.tanggalSPK)}, dengan ini menyatakan:
                </p>
                <div className="border border-black p-4 my-2 text-center bg-slate-50 print:bg-transparent">
                  <p className="text-[11pt] font-bold">PRESTASI REALISASI FISIK PEKERJAAN:</p>
                  <p className="text-[28pt] font-black font-mono my-1 text-emerald-700 print:text-black">100,00 %</p>
                  <p className="italic text-[10pt] font-semibold">(Seratus Persen Selesai Sesuai Gambar Rencana dan Syarat Teknis)</p>
                </div>
                <p className="indent-8">
                  Seluruh item pekerjaan telah diselesaikan tepat waktu dalam kurun waktu pelaksanaan {project.jangkaWaktuHari} ({terbilang(project.jangkaWaktuHari)}) hari kalender, tanpa adanya keterlambatan dan kerusakan.
                </p>
                <p className="indent-8">
                  Demikian Berita Acara Kemajuan Prestasi Pekerjaan ini dibuat untuk dipergunakan sebagai dasar penerbitan Berita Acara Pemeriksaan Hasil Pekerjaan (BAPHP) dan Berita Acara Serah Terima (BAST).
                </p>
              </div>
              <div className="mt-12 grid grid-cols-3 gap-4 text-center text-[10pt]">
                <div className="flex flex-col items-center">
                  <p className="font-normal">Pelaksana</p>
                  <p className="font-bold uppercase text-[9pt]">{project.penyedia.namaPerusahaan}</p>
                  <div className="h-16 flex items-center justify-center">
                    {showSignatures && (
                      <svg className="w-24 h-12 text-blue-800" viewBox="0 0 200 100" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M 20 60 Q 40 20 60 70 T 100 40" />
                      </svg>
                    )}
                  </div>
                  <p className="font-bold underline uppercase text-[9.5pt]">{project.penyedia.namaDirektur}</p>
                </div>
                <div className="flex flex-col items-center">
                  <p className="font-normal">Mengetahui PPTK,</p>
                  <div className="h-16 flex items-center justify-center">
                    {showSignatures && (
                      <svg className="w-24 h-12 text-black" viewBox="0 0 200 100" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M 30 70 Q 50 10 70 80 T 110 30" />
                      </svg>
                    )}
                  </div>
                  <p className="font-bold underline text-[9.5pt]">{project.pptk.nama}</p>
                  <p className="text-[8.5pt]">NIP. {project.pptk.nip}</p>
                </div>
                <div className="flex flex-col items-center">
                  <p className="font-normal">Disetujui PPK,</p>
                  <div className="h-16 flex items-center justify-center">
                    {showSignatures && (
                      <svg className="w-28 h-12 text-blue-900" viewBox="0 0 200 100" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M 15 50 Q 50 15 80 85 T 140 25" />
                      </svg>
                    )}
                  </div>
                  <p className="font-bold underline text-[9.5pt]">{project.ppk.nama}</p>
                  <p className="text-[8.5pt]">NIP. {project.ppk.nip}</p>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-300 flex items-center justify-between text-[8pt] text-slate-600">
              <div>[Berita Acara Kemajuan Prestasi Pekerjaan]</div>
            </div>
          </div>
        )}

        {selectedDoc === 'CHECKLIST' && (
          <div className="print-page w-[210mm] min-h-[297mm] bg-white text-black px-[12.7mm] py-[10mm] shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-0 font-official text-[10.5pt] leading-[1.15] flex flex-col justify-between">
            <div>
              <OfficialKop config={kopConfig} />
              <div className="text-center my-3">
                <h3 className="text-[13pt] font-bold underline uppercase tracking-wide">
                  Lembar Verifikasi Kelengkapan Dokumen Pembayaran
                </h3>
                <p className="text-[10.5pt] font-semibold mt-1">
                  Nomor : {project.nomorChecklist || project.nomorBAPHP.replace('02-100', 'VERIF-01')}
                </p>
                <p className="text-[10.5pt] font-medium mt-0.5">
                  Tanggal : {formatTanggalIndonesia(project.tanggalChecklist || project.tanggalBAP || project.tanggalBAPHP)}
                </p>
                <p className="text-[9.5pt] font-medium mt-0.5 text-slate-600">
                  Lampiran Berkas Pengajuan SPP-LS / SPM Berdasarkan Permendagri No. 77 Tahun 2020
                </p>
              </div>

              <div className="border border-black p-3 my-3 text-[10pt] space-y-1">
                <div className="flex"><span className="w-36 font-semibold">Paket Pekerjaan</span><span className="w-4">:</span><span className="font-bold">{project.namaPaket}</span></div>
                <div className="flex"><span className="w-36 font-semibold">Lokasi</span><span className="w-4">:</span><span>{project.lokasi}</span></div>
                <div className="flex"><span className="w-36 font-semibold">Penyedia Jasa</span><span className="w-4">:</span><span className="font-semibold uppercase">{project.penyedia.namaPerusahaan}</span></div>
                <div className="flex"><span className="w-36 font-semibold">Nomor SPK</span><span className="w-4">:</span><span className="font-mono">{project.nomorSPK}</span></div>
                <div className="flex"><span className="w-36 font-semibold">Nilai Kontrak</span><span className="w-4">:</span><span className="font-mono font-bold">{formatRupiah(project.nilaiSPK)}</span></div>
              </div>

              <table className="w-full border-collapse border border-black text-[9.5pt] my-3">
                <thead>
                  <tr className="bg-slate-100 print:bg-transparent border-b border-black">
                    <th className="border border-black p-1.5 w-10 text-center">NO</th>
                    <th className="border border-black p-1.5 text-left">NAMA DOKUMEN KELENGKAPAN</th>
                    <th className="border border-black p-1.5 w-24 text-center">STATUS</th>
                    <th className="border border-black p-1.5 w-48 text-left">KETERANGAN / NOMOR SURAT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black p-1.5 text-center">1</td>
                    <td className="border border-black p-1.5 font-medium">Surat Perintah Kerja (SPK) / Kontrak</td>
                    <td className="border border-black p-1.5 text-center font-bold text-emerald-700 print:text-black">ADA</td>
                    <td className="border border-black p-1.5 font-mono text-[8.5pt]">{project.nomorSPK}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-1.5 text-center">2</td>
                    <td className="border border-black p-1.5 font-medium">Berita Acara Pemeriksaan Hasil Pekerjaan (BAPHP)</td>
                    <td className="border border-black p-1.5 text-center font-bold text-emerald-700 print:text-black">ADA</td>
                    <td className="border border-black p-1.5 font-mono text-[8.5pt]">{project.nomorBAPHP}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-1.5 text-center">3</td>
                    <td className="border border-black p-1.5 font-medium">Berita Acara Serah Terima Pertama (BAST)</td>
                    <td className="border border-black p-1.5 text-center font-bold text-emerald-700 print:text-black">ADA</td>
                    <td className="border border-black p-1.5 font-mono text-[8.5pt]">{project.nomorBAST || project.nomorBAPHP.replace('02-100', '02-101')}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-1.5 text-center">4</td>
                    <td className="border border-black p-1.5 font-medium">BAST dari PPK ke Pengguna Anggaran (PA/KPA)</td>
                    <td className="border border-black p-1.5 text-center font-bold text-emerald-700 print:text-black">ADA</td>
                    <td className="border border-black p-1.5 font-mono text-[8.5pt]">{project.nomorBAST_PA || project.nomorBAPHP.replace('02-100', '02-101.A')}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-1.5 text-center">5</td>
                    <td className="border border-black p-1.5 font-medium">Berita Acara Pembayaran (BAP) 100%</td>
                    <td className="border border-black p-1.5 text-center font-bold text-emerald-700 print:text-black">ADA</td>
                    <td className="border border-black p-1.5 font-mono text-[8.5pt]">{project.nomorBAP || project.nomorBAPHP.replace('02-100', '02-102')}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-1.5 text-center">6</td>
                    <td className="border border-black p-1.5 font-medium">Kuitansi Bermeterai Rp 10.000</td>
                    <td className="border border-black p-1.5 text-center font-bold text-emerald-700 print:text-black">ADA</td>
                    <td className="border border-black p-1.5 text-[8.5pt]">Lengkap Tanda Tangan & Stempel</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-1.5 text-center">7</td>
                    <td className="border border-black p-1.5 font-medium">Fotokopi Rekening Koran Bank & NPWP Rekanan</td>
                    <td className="border border-black p-1.5 text-center font-bold text-emerald-700 print:text-black">SESUAI</td>
                    <td className="border border-black p-1.5 text-[8.5pt] font-mono">{project.penyedia.bankNama}</td>
                  </tr>
                </tbody>
              </table>

              <div className="border border-black p-3 my-3 bg-emerald-50 print:bg-transparent text-[10pt]">
                <p className="font-bold text-emerald-900 print:text-black">KESIMPULAN VERIFIKATOR:</p>
                <p className="text-justify mt-1">
                  Seluruh dokumen persyaratan pencairan SPP/SPM telah diteliti dan diverifikasi keabsahan penomoran, kesesuaian terbilang nilai rupiah, jangka waktu kalender, serta keaslian tanda tangan para pihak. Berkas dinyatakan <strong>LENGKAP, SAH, DAN MEMENUHI SYARAT</strong> untuk diterbitkan Surat Perintah Pencairan Dana (SP2D).
                </p>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-8 text-center text-[10pt]">
                <div className="flex flex-col items-center">
                  <p className="font-normal">Diverifikasi Oleh,</p>
                  <p className="font-bold">Verifikator Keuangan / PPTK</p>
                  <div className="h-16 flex items-center justify-center">
                    {showSignatures && (
                      <svg className="w-32 h-14 text-black" viewBox="0 0 200 100" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M 30 70 Q 50 10 70 80 T 110 30" />
                        <path d="M 60 40 L 140 70" />
                      </svg>
                    )}
                  </div>
                  <p className="font-bold underline">{project.pptk.nama}</p>
                  <p>NIP. {project.pptk.nip}</p>
                </div>

                <div className="flex flex-col items-center">
                  <p className="font-normal">Disetujui Untuk Pembayaran,</p>
                  <p className="font-bold">{project.ppk.jabatan}</p>
                  <div className="h-16 flex items-center justify-center">
                    {showSignatures && (
                      <svg className="w-36 h-14 text-blue-900" viewBox="0 0 200 100" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M 15 50 Q 50 15 80 85 T 140 25" />
                        <path d="M 30 50 Q 90 90 180 65" />
                      </svg>
                    )}
                  </div>
                  <p className="font-bold underline">{project.ppk.nama}</p>
                  <p>NIP. {project.ppk.nip}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-300 flex items-center justify-between text-[8pt] text-slate-600">
              <div>[Lembar Verifikasi Kelengkapan Pembayaran]</div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TEMPLATE 11: SURAT PERINTAH MULAI KERJA (SPMK)                 */}
        {/* ============================================================== */}
        {selectedDoc === 'SPMK' && (
          <div className="print-page w-[210mm] min-h-[297mm] bg-white text-black px-[12.7mm] py-[10mm] shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-0 font-official text-[10.5pt] leading-[1.15] flex flex-col justify-between">
            <div>
              <OfficialKop config={kopConfig} />
              <div className="text-center my-3">
                <h3 className="text-[13pt] font-bold underline uppercase tracking-wide">
                  Surat Perintah Mulai Kerja (SPMK)
                </h3>
                <p className="text-[10.5pt] font-semibold mt-1">
                  Nomor : {project.nomorSPK ? project.nomorSPK.replace('PPK-SPK-PL', 'SPMK') : `000.4.3/64514226/SPMK/DIKBUD/V/${project.tahunAnggaran}`}
                </p>
                <p className="text-[10.5pt] font-medium mt-0.5">
                  Tanggal : {formatTanggalIndonesia(project.tanggalMulai || project.tanggalSPK)}
                </p>
              </div>

              <div className="mt-4 space-y-3 text-justify">
                <p>
                  Berdasarkan Surat Perintah Kerja (SPK) Nomor: <strong>{project.nomorSPK}</strong> tanggal {formatTanggalIndonesia(project.tanggalSPK)}, dengan ini Pejabat Pembuat Komitmen (PPK) memerintahkan kepada:
                </p>

                <div className="border border-black p-3 bg-slate-50 print:bg-transparent text-[10pt] space-y-1">
                  <div className="flex"><span className="w-40 font-semibold">Nama Penyedia</span><span className="w-4">:</span><span className="font-bold uppercase">{project.penyedia.namaPerusahaan}</span></div>
                  <div className="flex"><span className="w-40 font-semibold">Pimpinan / Direktur</span><span className="w-4">:</span><span className="font-bold">{project.penyedia.namaDirektur}</span></div>
                  <div className="flex"><span className="w-40 font-semibold">Alamat Perusahaan</span><span className="w-4">:</span><span>{project.penyedia.alamatPerusahaan}</span></div>
                </div>

                <p>Untuk segera memulai pelaksanaan pekerjaan pengadaan dengan ketentuan sebagai berikut:</p>
                <ol className="list-decimal pl-8 space-y-1.5 text-[10.5pt]">
                  <li>Paket Pekerjaan: <strong>{project.namaPaket}</strong> yang berlokasi di <strong>{project.lokasi}</strong>.</li>
                  <li>Tanggal Mulai Kerja: <strong>{formatTanggalIndonesia(project.tanggalMulai || project.tanggalSPK)}</strong>.</li>
                  <li>Waktu Pelaksanaan: <strong>{formatJangkaWaktu(project.jangkaWaktuHari, project.tipeHari)}</strong> dan harus selesai selambat-lambatnya tanggal <strong>{formatTanggalIndonesia(project.tanggalSelesai || project.tanggalBAPHP)}</strong>.</li>
                  <li>Syarat-syarat Pekerjaan: Sesuai dengan spesifikasi teknis dan ketentuan yang tercantum dalam dokumen SPK.</li>
                  <li>Sanksi Keterlambatan: Dikenakan denda sebesar 1/1000 (satu permil) per hari kalender keterlambatan dari nilai kontrak sebelum PPN sesuai ketentuan Perpres No. 12 Tahun 2021.</li>
                </ol>

                <p className="indent-8 mt-2">
                  Demikian Surat Perintah Mulai Kerja ini dibuat untuk dilaksanakan dengan penuh rasa tanggung jawab.
                </p>
              </div>

              <div className="mt-10 grid grid-cols-2 gap-8 text-center text-[10pt]">
                <div className="flex flex-col items-center">
                  <p className="font-normal">Menerima dan Menyetujui,</p>
                  <p className="font-bold uppercase">{project.penyedia.namaPerusahaan}</p>
                  <div className="h-20 flex items-center justify-center">
                    {showSignatures && (
                      <svg className="w-32 h-14 text-blue-800" viewBox="0 0 200 100" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M 20 60 Q 40 20 60 70 T 100 40" />
                      </svg>
                    )}
                  </div>
                  <p className="font-bold underline uppercase">{project.penyedia.namaDirektur}</p>
                  <p className="text-[9pt]">{project.penyedia.jabatan}</p>
                </div>

                <div className="flex flex-col items-center">
                  <p className="font-normal">Dikeluarkan Oleh,</p>
                  <p className="font-bold">PEJABAT PEMBUAT KOMITMEN</p>
                  <div className="h-20 flex items-center justify-center">
                    {showSignatures && (
                      <svg className="w-36 h-14 text-blue-900" viewBox="0 0 200 100" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M 15 50 Q 50 15 80 85 T 140 25" />
                      </svg>
                    )}
                  </div>
                  <p className="font-bold underline">{project.ppk.nama}</p>
                  <p className="text-[9pt]">NIP. {project.ppk.nip}</p>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-300 flex items-center justify-between text-[8pt] text-slate-600">
              <div>[Surat Perintah Mulai Kerja - SPMK]</div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TEMPLATE 12: LEMBAR KENDALI REALISASI TERMIN                   */}
        {/* ============================================================== */}
        {selectedDoc === 'LEMBAR_KENDALI' && (
          <div className="print-page w-[210mm] min-h-[297mm] bg-white text-black px-[12.7mm] py-[10mm] shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-0 font-official text-[10.5pt] leading-[1.15] flex flex-col justify-between">
            <div>
              <OfficialKop config={kopConfig} />
              <div className="text-center my-3">
                <h3 className="text-[13pt] font-bold underline uppercase tracking-wide">
                  Lembar Kendali & Rekapitulasi Realisasi Pembayaran Termin
                </h3>
                <p className="text-[10.5pt] font-semibold mt-1">
                  Nomor : {project.nomorBAP || project.nomorBAPHP.replace('02-100', '02-102')}
                </p>
                <p className="text-[10.5pt] font-medium mt-0.5">
                  Tanggal : {formatTanggalIndonesia(project.tanggalBAP || project.tanggalBAPHP)}
                </p>
                <p className="text-[9pt] italic text-slate-600">
                  (Pengawasan Realisasi Belanja Modal - Permendagri No. 77 Tahun 2020)
                </p>
              </div>

              <div className="border border-black p-3 my-2 text-[10pt] space-y-1">
                <div className="flex"><span className="w-40 font-semibold">Paket Pekerjaan</span><span className="w-4">:</span><span className="font-bold">{project.namaPaket}</span></div>
                <div className="flex"><span className="w-40 font-semibold">Lokasi</span><span className="w-4">:</span><span>{project.lokasi}</span></div>
                <div className="flex"><span className="w-40 font-semibold">Penyedia Jasa</span><span className="w-4">:</span><span className="font-semibold uppercase">{project.penyedia.namaPerusahaan}</span></div>
                <div className="flex"><span className="w-40 font-semibold">Nomor & Tanggal SPK</span><span className="w-4">:</span><span className="font-mono">{project.nomorSPK} ({formatTanggalIndonesia(project.tanggalSPK)})</span></div>
                <div className="flex"><span className="w-40 font-semibold">Nilai Total Kontrak</span><span className="w-4">:</span><span className="font-mono font-bold">{formatRupiah(project.nilaiSPK)}</span></div>
              </div>

              <table className="w-full border-collapse border border-black text-[9pt] my-3">
                <thead>
                  <tr className="bg-slate-100 print:bg-transparent border-b border-black text-center font-bold">
                    <th className="border border-black p-1.5">TAHAP TERMIN</th>
                    <th className="border border-black p-1.5">PROGRES</th>
                    <th className="border border-black p-1.5">NILAI BRUTO (RP)</th>
                    <th className="border border-black p-1.5">POT. UM</th>
                    <th className="border border-black p-1.5">RETENSI (5%)</th>
                    <th className="border border-black p-1.5">PPH (PAJAK)</th>
                    <th className="border border-black p-1.5">NETTO CAIR (RP)</th>
                    <th className="border border-black p-1.5">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {(project.daftarTermin || []).map((t, idx) => (
                    <tr key={t.id || idx} className="border-b border-black">
                      <td className="border border-black p-1.5 font-bold">{t.namaTermin}</td>
                      <td className="border border-black p-1.5 text-center font-mono">{t.bobotKumulatif}%</td>
                      <td className="border border-black p-1.5 text-right font-mono">{formatRupiah(t.nilaiBruto)}</td>
                      <td className="border border-black p-1.5 text-right font-mono text-red-600 print:text-black">{t.potonganUangMuka > 0 ? `(${formatRupiah(t.potonganUangMuka)})` : '-'}</td>
                      <td className="border border-black p-1.5 text-right font-mono text-red-600 print:text-black">{t.potonganRetensi > 0 ? `(${formatRupiah(t.potonganRetensi)})` : '-'}</td>
                      <td className="border border-black p-1.5 text-right font-mono text-red-600 print:text-black">({formatRupiah(t.pphNilai)})</td>
                      <td className="border border-black p-1.5 text-right font-mono font-bold text-emerald-800 print:text-black">{formatRupiah(t.nilaiNetto)}</td>
                      <td className="border border-black p-1.5 text-center uppercase font-bold text-[8pt]">{t.status}</td>
                    </tr>
                  ))}
                  <tr className="font-bold bg-slate-100 print:bg-transparent border-t-2 border-black">
                    <td colSpan={2} className="border border-black p-2 text-center">TOTAL KONTRAK</td>
                    <td className="border border-black p-2 text-right font-mono">{formatRupiah(project.nilaiSPK)}</td>
                    <td colSpan={5} className="border border-black p-2 text-center text-[8.5pt]">Verifikasi Penatausahaan Kasda BPKAD</td>
                  </tr>
                </tbody>
              </table>

              <div className="mt-8 grid grid-cols-2 gap-8 text-center text-[10pt]">
                <div className="flex flex-col items-center">
                  <p className="font-normal">Diverifikasi PPTK,</p>
                  <div className="h-16 flex items-center justify-center">
                    {showSignatures && (
                      <svg className="w-32 h-14 text-black" viewBox="0 0 200 100" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M 30 70 Q 50 10 70 80 T 110 30" />
                      </svg>
                    )}
                  </div>
                  <p className="font-bold underline">{project.pptk.nama}</p>
                  <p>NIP. {project.pptk.nip}</p>
                </div>

                <div className="flex flex-col items-center">
                  <p className="font-normal">Disetujui PPK,</p>
                  <div className="h-16 flex items-center justify-center">
                    {showSignatures && (
                      <svg className="w-36 h-14 text-blue-900" viewBox="0 0 200 100" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M 15 50 Q 50 15 80 85 T 140 25" />
                      </svg>
                    )}
                  </div>
                  <p className="font-bold underline">{project.ppk.nama}</p>
                  <p>NIP. {project.ppk.nip}</p>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-300 flex items-center justify-between text-[8pt] text-slate-600">
              <div>[Lembar Kendali Realisasi Termin Proyek]</div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TEMPLATE 13: MUTUAL CHECK (MC-0)                               */}
        {/* ============================================================== */}
        {selectedDoc === 'BA_MC0' && (
          <div className="print-page w-[210mm] min-h-[297mm] bg-white text-black px-[12.7mm] py-[10mm] shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-0 font-official text-[10.5pt] leading-[1.15] flex flex-col justify-between">
            <div>
              <OfficialKop config={kopConfig} />
              <div className="text-center my-3">
                <h3 className="text-[13pt] font-bold underline uppercase tracking-wide">
                  Berita Acara Rekayasa Lapangan / Mutual Check (MC-0%)
                </h3>
                <p className="text-[10.5pt] font-semibold mt-1">
                  Nomor : {project.nomorBA_MC0 || project.nomorBAPHP.replace('02-100', '02-099')}
                </p>
                <p className="text-[10.5pt] font-medium mt-0.5">
                  Tanggal : {formatTanggalIndonesia(project.tanggalBA_MC0 || project.tanggalMulai || project.tanggalSPK)}
                </p>
              </div>

              <div className="mt-4 space-y-3 text-justify text-[10.5pt]">
                <p>
                  Pada hari ini tanggal {formatTanggalIndonesia(project.tanggalBA_MC0 || project.tanggalMulai || project.tanggalSPK)}, kami yang bertanda tangan di bawah ini telah melakukan pengukuran awal dan rekayasa lapangan bersama (Mutual Check 0%) terhadap pelaksanaan paket pekerjaan: <strong>{project.namaPaket}</strong> pada <strong>{project.lokasi}</strong>.
                </p>
                <p>
                  Berdasarkan hasil pengukuran dan pemeriksaan bersama di lokasi sekolah, disimpulkan bahwa:
                </p>
                <ol className="list-decimal pl-8 space-y-1.5">
                  <li>Kondisi tapak awal telah sesuai dengan gambar perencanaan dan tidak terdapat perubahan volume yang signifikan.</li>
                  <li>Pelaksanaan pekerjaan dapat segera dimulai oleh penyedia sesuai metode kerja yang telah disetujui.</li>
                  <li>Berita Acara ini menjadi acuan opname lapangan berkala (Mutual Check) sampai dengan serah terima 100%.</li>
                </ol>
              </div>

              <div className="mt-12 grid grid-cols-2 gap-8 text-center text-[10pt]">
                <div className="flex flex-col items-center">
                  <p className="font-bold uppercase">PENYEDIA JASA</p>
                  <p className="font-semibold uppercase">{project.penyedia.namaPerusahaan}</p>
                  <div className="h-20 flex items-center justify-center">
                    {showSignatures && (
                      <svg className="w-32 h-14 text-blue-800" viewBox="0 0 200 100" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M 20 60 Q 40 20 60 70 T 100 40" />
                      </svg>
                    )}
                  </div>
                  <p className="font-bold underline uppercase">{project.penyedia.namaDirektur}</p>
                </div>

                <div className="flex flex-col items-center">
                  <p className="font-bold uppercase">PEJABAT PEMBUAT KOMITMEN</p>
                  <p className="font-semibold">{project.ppk.jabatan}</p>
                  <div className="h-20 flex items-center justify-center">
                    {showSignatures && (
                      <svg className="w-36 h-14 text-blue-900" viewBox="0 0 200 100" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M 15 50 Q 50 15 80 85 T 140 25" />
                      </svg>
                    )}
                  </div>
                  <p className="font-bold underline">{project.ppk.nama}</p>
                  <p>NIP. {project.ppk.nip}</p>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-300 flex items-center justify-between text-[8pt] text-slate-600">
              <div>[Berita Acara Rekayasa Lapangan MC-0%]</div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TEMPLATE 14: BA PEMBAYARAN UANG MUKA (BA-UM)                   */}
        {/* ============================================================== */}
        {selectedDoc === 'BA_UM' && (
          <div className="print-page w-[210mm] min-h-[297mm] bg-white text-black px-[12.7mm] py-[10mm] shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-0 font-official text-[10.5pt] leading-[1.15] flex flex-col justify-between">
            <div>
              <OfficialKop config={kopConfig} />
              <div className="text-center my-3">
                <h3 className="text-[13pt] font-bold underline uppercase tracking-wide">
                  Berita Acara Pembayaran Uang Muka Kerja (BA-UM)
                </h3>
                <p className="text-[10.5pt] font-semibold mt-1">
                  Nomor : {project.nomorBA_UM || project.nomorBAPHP.replace('02-100', '02-UM')}
                </p>
                <p className="text-[10.5pt] font-medium mt-0.5">
                  Tanggal : {formatTanggalIndonesia(project.tanggalBA_UM || project.tanggalMulai || project.tanggalSPK)}
                </p>
              </div>

              <div className="mt-4 space-y-3 text-justify text-[10.5pt]">
                <p>
                  Sesuai ketentuan Perpres No. 12 Tahun 2021 Pasal 53 dan dokumen Surat Perintah Kerja (SPK) Nomor: <strong>{project.nomorSPK}</strong> tanggal {formatTanggalIndonesia(project.tanggalSPK)}, dengan ini disetujui pembayaran Uang Muka Kerja sebesar <strong>{project.persenUangMuka || 20}%</strong> senilai <strong>{formatRupiah(Math.round(project.nilaiSPK * ((project.persenUangMuka || 20) / 100)))}</strong> ({terbilangRupiah(Math.round(project.nilaiSPK * ((project.persenUangMuka || 20) / 100)))}) atas paket pekerjaan: <strong>{project.namaPaket}</strong> di <strong>{project.lokasi}</strong>.
                </p>
                <p>
                  Penyedia telah menyerahkan Jaminan Uang Muka yang sah dan pengembalian uang muka akan diperhitungkan secara bertahap melalui pemotongan pada setiap pengajuan pembayaran termin prestasi pekerjaan.
                </p>
              </div>

              <div className="mt-12 grid grid-cols-2 gap-8 text-center text-[10pt]">
                <div className="flex flex-col items-center">
                  <p className="font-bold uppercase">PENYEDIA PENERIMA UANG MUKA</p>
                  <p className="font-semibold uppercase">{project.penyedia.namaPerusahaan}</p>
                  <div className="h-20 flex items-center justify-center">
                    {showSignatures && (
                      <svg className="w-32 h-14 text-blue-800" viewBox="0 0 200 100" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M 20 60 Q 40 20 60 70 T 100 40" />
                      </svg>
                    )}
                  </div>
                  <p className="font-bold underline uppercase">{project.penyedia.namaDirektur}</p>
                </div>

                <div className="flex flex-col items-center">
                  <p className="font-bold uppercase">PEJABAT PEMBUAT KOMITMEN</p>
                  <p className="font-semibold">{project.ppk.jabatan}</p>
                  <div className="h-20 flex items-center justify-center">
                    {showSignatures && (
                      <svg className="w-36 h-14 text-blue-900" viewBox="0 0 200 100" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M 15 50 Q 50 15 80 85 T 140 25" />
                      </svg>
                    )}
                  </div>
                  <p className="font-bold underline">{project.ppk.nama}</p>
                  <p>NIP. {project.ppk.nip}</p>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-300 flex items-center justify-between text-[8pt] text-slate-600">
              <div>[Berita Acara Pembayaran Uang Muka]</div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TEMPLATE 15: BAST AKHIR / FHO (RETENSI SELESAI)                */}
        {/* ============================================================== */}
        {selectedDoc === 'BAST_FHO' && (
          <div className="print-page w-[210mm] min-h-[297mm] bg-white text-black px-[12.7mm] py-[10mm] shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-0 font-official text-[10.5pt] leading-[1.15] flex flex-col justify-between">
            <div>
              <OfficialKop config={kopConfig} />
              <div className="text-center my-3">
                <h3 className="text-[13pt] font-bold underline uppercase tracking-wide">
                  Berita Acara Serah Terima Akhir Pekerjaan (BAST - FHO)
                </h3>
                <p className="text-[10.5pt] font-semibold mt-1">
                  Nomor : {project.nomorBAST_FHO || project.nomorBAPHP.replace('02-100', '02-FHO')}
                </p>
                <p className="text-[10.5pt] font-medium mt-0.5">
                  Tanggal : {formatTanggalIndonesia(project.tanggalBAST_FHO || project.tanggalBAPHP)}
                </p>
                <p className="text-[9pt] italic text-slate-600">
                  (Final Hand Over & Pengembalian Jaminan Pemeliharaan Retensi 5%)
                </p>
              </div>

              <div className="mt-4 space-y-3 text-justify text-[10.5pt]">
                <p>
                  Pada hari ini tanggal {formatTanggalIndonesia(project.tanggalBAST_FHO || project.tanggalBAPHP)}, telah dilaksanakan pemeriksaan akhir setelah berakhirnya masa pemeliharaan selama 180 (seratus delapan puluh) hari kalender atas paket pekerjaan: <strong>{project.namaPaket}</strong> pada <strong>{project.lokasi}</strong>.
                </p>
                <p>
                  Seluruh hasil pekerjaan dalam kondisi baik tanpa cacat mutu, sehingga sisa jaminan pemeliharaan (retensi 5% senilai <strong>{formatRupiah(Math.round(project.nilaiSPK * 0.05))}</strong>) dapat dicairkan secara penuh kepada penyedia.
                </p>
              </div>

              <div className="mt-12 grid grid-cols-2 gap-8 text-center text-[10pt]">
                <div className="flex flex-col items-center">
                  <p className="font-bold uppercase">PENYEDIA JASA</p>
                  <p className="font-semibold uppercase">{project.penyedia.namaPerusahaan}</p>
                  <div className="h-20 flex items-center justify-center">
                    {showSignatures && (
                      <svg className="w-32 h-14 text-blue-800" viewBox="0 0 200 100" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M 20 60 Q 40 20 60 70 T 100 40" />
                      </svg>
                    )}
                  </div>
                  <p className="font-bold underline uppercase">{project.penyedia.namaDirektur}</p>
                </div>

                <div className="flex flex-col items-center">
                  <p className="font-bold uppercase">PEJABAT PEMBUAT KOMITMEN</p>
                  <p className="font-semibold">{project.ppk.jabatan}</p>
                  <div className="h-20 flex items-center justify-center">
                    {showSignatures && (
                      <svg className="w-36 h-14 text-blue-900" viewBox="0 0 200 100" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M 15 50 Q 50 15 80 85 T 140 25" />
                      </svg>
                    )}
                  </div>
                  <p className="font-bold underline">{project.ppk.nama}</p>
                  <p>NIP. {project.ppk.nip}</p>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-300 flex items-center justify-between text-[8pt] text-slate-600">
              <div>[Berita Acara Serah Terima Akhir - FHO]</div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
