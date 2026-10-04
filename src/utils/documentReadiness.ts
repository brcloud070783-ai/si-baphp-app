import { ProjectContract, DocumentType } from '../types';

export interface DocumentReadinessInfo {
  isReady: boolean;
  statusLabel: string;
  missingFields: string[];
  humanSummary: string;
}

export const checkDocumentReadiness = (
  project: ProjectContract,
  docType: DocumentType
): DocumentReadinessInfo => {
  const missing: string[] = [];

  // Common baseline checks
  if (!project.namaPaket) missing.push('Nama paket pekerjaan');
  if (!project.nomorSPK) missing.push('Nomor SPK dinas');
  if (!project.nilaiSPK || project.nilaiSPK <= 0) missing.push('Nilai kontrak');
  if (!project.penyedia?.namaPerusahaan) missing.push('Nama perusahaan rekanan');
  if (!project.ppk?.nama) missing.push('Nama & NIP PPK');
  if (!project.pptk?.nama) missing.push('Nama & NIP PPTK');

  switch (docType) {
    case 'BAPHP':
      if (!project.nomorBAPHP) missing.push('Nomor register BAPHP');
      if (!project.tanggalBAPHP) missing.push('Tanggal pemeriksaan fisik BAPHP');
      break;

    case 'BAST':
      if (!project.nomorBAST) missing.push('Nomor surat BAST rekanan');
      if (!project.tanggalBAST && !project.tanggalBAPHP) missing.push('Tanggal serah terima BAST');
      break;

    case 'BAST_PA':
      if (!project.nomorBAST_PA) missing.push('Nomor surat BAST ke PA');
      if (!project.tanggalBAST_PA && !project.tanggalBAST) missing.push('Tanggal BAST ke PA/KPA');
      break;

    case 'BAP':
      if (!project.nomorBAP) missing.push('Nomor berita acara pembayaran (BAP)');
      if (!project.tanggalBAP && !project.tanggalBAPHP) missing.push('Tanggal BAP');
      break;

    case 'BAKP':
      if (!project.nomorBAKP && !project.nomorBAPHP) missing.push('Nomor BAKP kemajuan fisik');
      break;

    case 'BA_STL':
      if (!project.nomorBA_STL) missing.push('Nomor BA penyerahan lapangan');
      if (!project.tanggalBA_STL && !project.tanggalMulai) missing.push('Tanggal serah terima lapangan');
      break;

    case 'BA_MC0':
      if (!project.nomorBA_MC0) missing.push('Nomor berita acara Mutual Check (MC-0)');
      if (!project.tanggalBA_MC0 && !project.tanggalMulai) missing.push('Tanggal MC-0');
      break;

    case 'BA_UM':
      if (!project.nomorBA_UM) missing.push('Nomor BA uang muka');
      break;

    case 'BAST_FHO':
      if (!project.nomorBAST_FHO) missing.push('Nomor BAST akhir masa pemeliharaan (FHO)');
      break;

    case 'KUITANSI':
      if (!project.nomorKuitansi) missing.push('Nomor register kuitansi dinas');
      if (!project.penyedia?.nomorRekening) missing.push('Nomor rekening bank penyedia');
      break;

    case 'CHECKLIST':
      if (!project.nomorChecklist && !project.nomorBAP) missing.push('Nomor lembar verifikasi');
      break;

    case 'SURAT_REKANAN':
      if (!project.nomorSuratRekanan) missing.push('Nomor surat permohonan rekanan');
      if (!project.tanggalSuratRekanan && !project.tanggalBAPHP) missing.push('Tanggal surat rekanan');
      break;

    case 'LAMPIRAN_FOTO':
      if (!project.fotoDokumentasi?.kondisi100 && !project.fotoDokumentasi?.kondisi50) {
        missing.push('Foto bukti fisik lapangan');
      }
      break;

    case 'SPMK':
      if (!project.nomorSPMK) missing.push('Nomor surat perintah mulai kerja (SPMK)');
      if (!project.tanggalSPMK && !project.tanggalMulai) missing.push('Tanggal SPMK');
      break;

    case 'LEMBAR_KENDALI':
      if (!project.nomorBAP) missing.push('Nomor BAP pencairan');
      break;
  }

  const isReady = missing.length === 0;

  return {
    isReady,
    statusLabel: isReady ? 'Siap Cetak' : `${missing.length} Data Kurang`,
    missingFields: missing,
    humanSummary: isReady 
      ? 'Semua data lengkap & valid' 
      : `Perlu dilengkapi: ${missing.slice(0, 2).join(', ')}${missing.length > 2 ? ` (+${missing.length - 2} lainnya)` : ''}`
  };
};

// Preset filters for different procurement workflows
export type DossierPreset = 'all' | 'spp_ls' | 'konstruksi' | 'termin';

export const DOSSIER_PRESETS: Array<{ id: DossierPreset; label: string; shortLabel: string; description: string; docTypes: DocumentType[] }> = [
  {
    id: 'all',
    label: 'Semua Berkas (15)',
    shortLabel: 'Semua (15)',
    description: 'Seluruh 15 berkas lengkap siklus pengadaan dinas',
    docTypes: [
      'BAPHP', 'BAST', 'BAST_PA', 'BAP', 'BAKP', 'BA_STL', 'BA_MC0', 
      'BA_UM', 'BAST_FHO', 'KUITANSI', 'CHECKLIST', 'SURAT_REKANAN', 
      'LAMPIRAN_FOTO', 'SPMK', 'LEMBAR_KENDALI'
    ]
  },
  {
    id: 'spp_ls',
    label: 'Berkas SPP-LS Kasda (7)',
    shortLabel: 'SPP-LS (7)',
    description: 'Syarat wajib pengajuan pencairan dana ke BPKAD',
    docTypes: ['BAPHP', 'BAST', 'BAST_PA', 'BAP', 'KUITANSI', 'CHECKLIST', 'SURAT_REKANAN']
  },
  {
    id: 'konstruksi',
    label: 'Fisik & Lapangan (10)',
    shortLabel: 'Fisik (10)',
    description: 'Dokumen teknis opname lapangan, foto, dan serah terima',
    docTypes: ['SPMK', 'BA_STL', 'BA_MC0', 'BAKP', 'BAPHP', 'BAST', 'BAST_PA', 'LAMPIRAN_FOTO', 'BAP', 'KUITANSI']
  },
  {
    id: 'termin',
    label: 'Pencairan Termin (6)',
    shortLabel: 'Termin (6)',
    description: 'Dokumen penagihan progres fisik tahapan antara',
    docTypes: ['BAKP', 'BAP', 'KUITANSI', 'SURAT_REKANAN', 'LAMPIRAN_FOTO', 'LEMBAR_KENDALI']
  }
];
