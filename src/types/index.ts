export type DocumentType = 
  | 'BAPHP'          // Berita Acara Pemeriksaan Hasil Pekerjaan (2 Halaman)
  | 'BAST'           // Berita Acara Serah Terima Pertama (Penyedia ke PPK)
  | 'BAST_PA'        // Berita Acara Serah Terima PPK ke Pengguna Anggaran (PA/KPA) - Perpres 12/2021
  | 'BAP'            // Berita Acara Pembayaran
  | 'BAKP'           // Berita Acara Kemajuan Prestasi Pekerjaan (Opname Lapangan)
  | 'BA_STL'         // Berita Acara Serah Terima Lapangan (Awal Kontrak)
  | 'BA_MC0'         // Berita Acara Mutual Check 0% (MC-0)
  | 'BA_UM'          // Berita Acara Pembayaran Uang Muka
  | 'BAST_FHO'       // Berita Acara Serah Terima Akhir & Retensi 5% (FHO)
  | 'KUITANSI'       // Kuitansi Pembayaran Resmi Bermeterai Rp 10.000
  | 'CHECKLIST'      // Lembar Verifikasi Kelengkapan Dokumen SPP-LS
  | 'SURAT_REKANAN'  // Surat Permohonan Pembayaran dari Penyedia
  | 'LAMPIRAN_FOTO'  // Lembar Dokumentasi Foto Fisik Sekolah
  | 'SPMK'           // Surat Perintah Mulai Kerja (Perpres 12/2021 Pasal 50 ayat 6)
  | 'LEMBAR_KENDALI'; // Lembar Kendali & Rekapitulasi Realisasi Pembayaran Bertahap/Termin (Permendagri 77/2020)

export interface PaymentTermin {
  id: string;
  nomorTermin: number;         // 1, 2, 3, ...
  namaTermin: string;          // e.g. "Termin I (35%)"
  bobotPersen: number;         // e.g. 35
  bobotKumulatif: number;      // e.g. 35, 70, 100
  nilaiBruto: number;          // Rp
  potonganUangMuka: number;    // Rp
  potonganRetensi: number;     // Rp
  pphNilai: number;            // Rp
  nilaiNetto: number;          // Rp
  tanggalBAP?: string;         // YYYY-MM-DD
  nomorBAP?: string;
  status: 'draf' | 'diajukan' | 'diverifikasi' | 'cair';
}

export interface DocumentMeta {
  type: DocumentType;
  label: string;
  nomor: string;
  tanggal: string; // YYYY-MM-DD
  enabled: boolean;
  keterangan?: string;
}

export interface OfficialOfficer {
  id: string;
  nama: string;
  nip: string;
  jabatan: string;
  pangkatGolongan?: string;
  role: 'PPK' | 'PPTK' | 'PA_KPA' | 'BENDAHARA';
}

export interface ContractorVendor {
  id: string;
  namaPerusahaan: string;
  bentukUsaha: 'CV' | 'PT' | 'Koperasi' | 'Perorangan';
  namaDirektur: string;
  jabatan: string; // e.g. "DIREKTUR"
  alamatPerusahaan: string;
  npwp: string;
  bankNama: string;
  nomorRekening: string;
  atasNamaRekening: string;
}

export interface KopDinasConfig {
  tampilkanKop?: boolean;               // default false (Kop ditiadakan agar user buat manual)
  kopMode?: 'none' | 'text_logo' | 'full_image'; // 'none' (default), 'text_logo', 'full_image'
  fullHeaderImageUrl?: string;          // base64 data URL or HTTP URL for full header image
  fullHeaderImageHeight?: number;       // custom height in px (optional)
  pemerintahTingkat: string; // "PEMERINTAH PROVINSI KALIMANTAN UTARA"
  namaDinas: string;         // "DINAS PENDIDIKAN DAN KEBUDAYAAN"
  alamat: string;            // "Jalan Kolonel Soetadji No. 1, Gedung Gadis II Lt. 1, Tanjung Selor 77212"
  teleponFax: string;        // "Tel./Faks: (0552) 2020530"
  email: string;             // "Surel: kaltara.pendidikan@gmail.com"
  website?: string;          // "Website: http://disdikbud.kaltaraprov.go.id"
  kotaKedudukan?: string;    // "TANJUNG SELOR"
  barisKontakGabungan?: string; // e.g. "Tel./Faks: (0552) 2020530 | Surel: kaltara.pendidikan@gmail.com"
  logoType: 'kaltara' | 'custom';
  customLogoUrl?: string;    // base64 data URL or HTTP URL
  
  // Font & Typography Controls
  fontFamilyKop?: string;        // 'Plus Jakarta Sans', 'Arial', 'Times New Roman', 'Calibri', 'Inter', 'Roboto'
  fontSizePemerintah?: number;   // default ~13.5pt
  fontSizeDinas?: number;        // default ~16pt
  fontSizeAlamat?: number;       // default ~9.5pt
  fontSizeKontak?: number;       // default ~9.5pt
  isBoldPemerintah?: boolean;    // default true
  isBoldDinas?: boolean;         // default true
  logoSize?: number;             // default ~85px
  formatGarisKop?: 'ganda' | 'tunggal_tebal' | 'tunggal_tipis';
  tampilkanKotaKedudukan?: boolean;
  tampilkanWebsite?: boolean;
}

export interface ProjectContract {
  id: string;
  kodePaket: string;
  namaPaket: string;
  jenisPekerjaan: 'Perencanaan' | 'Pengawasan' | 'Fisik / Konstruksi' | 'Pengadaan Sarana';
  lokasi: string;            // e.g. "SMAN 5 Tarakan"
  kabupatenKota: string;     // e.g. "Kota Tarakan"
  
  // Program & Anggaran
  program: string;           // e.g. "PROGRAM PENGELOLAAN PENDIDIKAN"
  kegiatan: string;          // e.g. "PENGELOLAAN PENDIDIKAN SEKOLAH MENENGAH ATAS"
  subKegiatan?: string;
  nomorDPA?: string;
  sumberDana: string;        // e.g. "APBD PROVINSI KALIMANTAN UTARA"
  tahunAnggaran: number;     // e.g. 2026

  // Kontrak / SPK
  nomorSPK: string;          // e.g. "000.4.3/64514226/PPK-SPK-PL/DIKBUD/V/2026"
  tanggalSPK: string;        // YYYY-MM-DD
  nilaiSPK: number;          // e.g. 99911544
  jangkaWaktuHari: number;   // e.g. 30
  tipeHari: 'Hari Kalender' | 'Hari Kerja';
  tanggalMulai: string;      // YYYY-MM-DD
  tanggalSelesai: string;    // YYYY-MM-DD

  // SPMK (Surat Perintah Mulai Kerja)
  nomorSPMK?: string;
  tanggalSPMK?: string;

  // Skema Pembayaran & Multi-Termin (Perpres 12/2021 Pasal 53)
  skemaPembayaran?: 'sekaligus' | 'termin';
  persenUangMuka?: number;     // e.g. 20 or 30 (%)
  retensiPersen?: number;      // e.g. 5 (%)
  daftarTermin?: PaymentTermin[];
  activeTerminIndex?: number;  // 0, 1, 2...

  // Nomor & Tanggal Berita Acara Utama
  nomorBAPHP: string;
  tanggalBAPHP: string;
  nomorBAST?: string;
  tanggalBAST?: string;
  nomorBAST_PA?: string;
  tanggalBAST_PA?: string;
  nomorBAP?: string;
  tanggalBAP?: string;

  // Kalkulasi Rincian Pembayaran BAP (Berita Acara Pembayaran)
  bapKemajuanFisikPersen?: number;   // e.g. 70 atau 100 (%)
  bapBrutoTagihan?: number;          // e.g. Rp 63.857.500
  bapPotonganUangMuka?: number;      // e.g. Rp 12.771.500
  bapPotonganRetensiPersen?: number; // e.g. 5 (%)
  bapPotonganRetensiNilai?: number;  // e.g. Rp 3.192.875
  bapPotonganPPhPersen?: number;     // e.g. 2.65 (%)
  bapPotonganPPhNilai?: number;      // e.g. Rp 1.269.222
  bapPotonganLainnya?: number;       // Rp
  bapNilaiNetto?: number;            // e.g. Rp 46.623.903

  nomorBAKP?: string;
  tanggalBAKP?: string;
  nomorBA_STL?: string;
  tanggalBA_STL?: string;
  nomorBA_MC0?: string;
  tanggalBA_MC0?: string;
  nomorBA_UM?: string;
  tanggalBA_UM?: string;
  nomorBAST_FHO?: string;
  tanggalBAST_FHO?: string;
  nomorKuitansi?: string;
  tanggalKuitansi?: string;
  nomorSuratRekanan?: string;
  tanggalSuratRekanan?: string;
  nomorChecklist?: string;
  tanggalChecklist?: string;

  // Daftar Dokumen Aktif yang dipilih untuk paket ini
  selectedDocTypes?: DocumentType[];

  // Personel & Rekanan
  ppk: OfficialOfficer;
  pptk: OfficialOfficer;
  paKpa?: OfficialOfficer;
  penyedia: ContractorVendor;

  // Status & Verifikasi
  statusVerifikasi: 'diverifikasi' | 'perlu_tinjauan' | 'draf';
  catatanPemeriksaan?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  
  // Foto Dokumentasi
  fotoDokumentasi?: {
    kondisi0?: string;
    kondisi50?: string;
    kondisi100?: string;
    keterangan?: string;
  };

  // Google Docs & Drive Integration Links
  googleDocs?: Partial<Record<DocumentType, {
    documentId: string;
    webViewLink: string;
    updatedAt: string;
    pdfDriveId?: string;
    pdfDriveLink?: string;
  }>>;

  updatedAt?: string;
}

export interface VerificationIssue {
  id: string;
  field: string;
  severity: 'error' | 'warning' | 'info';
  category?: 'kronologi' | 'pajak_keuangan' | 'rekanan_rekening' | 'pejabat_legalitas' | 'kelengkapan_berkas';
  message: string;
  description: string;
  legalBasis?: string;
  recommendation?: string;
}

export interface VerificationResult {
  isValid: boolean;
  score: number; // 0 to 100
  issues: VerificationIssue[];
  checksPassed: number;
  totalChecks: number;
}

export interface AuditChangeItem {
  field: string;
  fieldLabel: string;
  oldValue?: string | number | null;
  newValue?: string | number | null;
}

export interface AuditLog {
  id: string;
  projectId: string;
  actionType: 
    | 'STATUS_CHANGE'
    | 'CONTRACT_UPDATE'
    | 'DOCUMENT_EDIT'
    | 'VERIFICATION_AUDIT'
    | 'INSPECTION_NOTE'
    | 'BATCH_EXPORT'
    | 'INITIAL_CREATION';
  title: string;
  description: string;
  authorName: string;
  authorEmail?: string;
  authorRole?: string;
  timestamp: string; // ISO 8601
  previousStatus?: string;
  newStatus?: string;
  version?: number;
  changes?: AuditChangeItem[];
}

