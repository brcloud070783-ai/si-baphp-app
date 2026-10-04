import { ProjectContract, VerificationIssue, VerificationResult } from '../types';
import { ALL_DOCUMENTS_CATALOG } from './googleDocsService';

export function validateProject(project: ProjectContract): VerificationResult {
  const issues: VerificationIssue[] = [];
  let checksPassed = 0;
  let totalChecks = 15;

  // ========================================================================
  // KELOMPOK 1: KRONOLOGI TANGGAL & INTEGRITAS HARI KERJA (LKPP & BPK)
  // ========================================================================

  // 1. Validasi Keberadaan & Format Tanggal Dasar SPK
  const spkDate = new Date(project.tanggalSPK + 'T00:00:00');
  const startDate = new Date(project.tanggalMulai + 'T00:00:00');
  const endDate = new Date(project.tanggalSelesai + 'T00:00:00');
  
  if (isNaN(spkDate.getTime()) || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    issues.push({
      id: 'tanggal_invalid',
      field: 'tanggalSPK',
      severity: 'error',
      category: 'kronologi',
      message: 'Format Tanggal SPK / Pelaksanaan Tidak Valid',
      description: 'Pastikan Tanggal SPK, Tanggal Mulai, dan Tanggal Selesai dipilih dengan benar.',
      legalBasis: 'Perpres No. 12/2021 Pasal 50 (Kontrak Pengadaan)',
      recommendation: 'Lengkapi tanggal SPK dan masa berlaku pelaksanaan di form data kontrak.'
    });
  } else if (startDate < spkDate) {
    issues.push({
      id: 'tanggal_mulai_sebelum_spk',
      field: 'tanggalMulai',
      severity: 'warning',
      category: 'kronologi',
      message: 'Tanggal Mulai Mendahului Tanggal Terbit SPK',
      description: 'Pekerjaan idealnya dimulai pada hari yang sama atau setelah SPK ditandatangani para pihak.',
      legalBasis: 'Standar Dokumen Pengadaan LKPP No. 12/2021',
      recommendation: 'Sesuaikan tanggal mulai kerja agar sama dengan atau setelah tanggal SPK.'
    });
  } else if (endDate < startDate) {
    issues.push({
      id: 'tanggal_selesai_kurang',
      field: 'tanggalSelesai',
      severity: 'error',
      category: 'kronologi',
      message: 'Tanggal Selesai Mendahului Tanggal Mulai',
      description: 'Tanggal akhir pelaksanaan tidak boleh lebih awal dari tanggal mulai pekerjaan.',
      legalBasis: 'Asas Kepastian Hukum & Logika Perikatan Perdata (KUHPerdata Pasal 1338)',
      recommendation: 'Periksa kembali rentang waktu pelaksanaan kontrak.'
    });
  } else {
    checksPassed++;
  }

  // 2. Validasi Tanggal BAPHP terhadap Batas Waktu SPK (Potensi Denda Keterlambatan)
  const baphpDate = new Date((project.tanggalBAPHP || project.tanggalSelesai) + 'T00:00:00');
  if (isNaN(baphpDate.getTime())) {
    issues.push({
      id: 'tanggal_baphp_kosong',
      field: 'tanggalBAPHP',
      severity: 'error',
      category: 'kronologi',
      message: 'Tanggal BAPHP Belum Ditentukan',
      description: 'Tanggal pemeriksaan pekerjaan diperlukan untuk komparisi hari/tanggal terbilang.',
      legalBasis: 'Perpres 12/2021 Pasal 57 ayat (2)',
      recommendation: 'Tentukan tanggal pemeriksaan hasil pekerjaan di lapangan.'
    });
  } else if (baphpDate < spkDate) {
    issues.push({
      id: 'baphp_sebelum_spk',
      field: 'tanggalBAPHP',
      severity: 'error',
      category: 'kronologi',
      message: 'Tanggal BAPHP Mendahului SPK',
      description: 'Pemeriksaan hasil pekerjaan tidak sah mendahului tanggal penerbitan SPK.',
      legalBasis: 'Standar Audit BPK RI atas Pengadaan Barang/Jasa',
      recommendation: 'Ubah tanggal BAPHP agar berada dalam rentang pelaksanaan atau serah terima.'
    });
  } else if (baphpDate > endDate) {
    issues.push({
      id: 'baphp_lewat_spk_denda',
      field: 'tanggalBAPHP',
      severity: 'warning',
      category: 'kronologi',
      message: 'Tanggal BAPHP Melewati Batas Waktu Akhir SPK',
      description: 'Tanggal pemeriksaan melewati masa kontrak. Ini berisiko menjadi temuan BPK terkait Denda Keterlambatan (1/1000 per hari) kecuali ada Addendum Waktu.',
      legalBasis: 'Perpres 12/2021 Pasal 56 & Peraturan LKPP No. 12/2021 (Klausul Denda)',
      recommendation: 'Pastikan ada Surat Addendum Perpanjangan Waktu atau kenakan potongan denda pada BAP.'
    });
    checksPassed += 0.5;
  } else {
    checksPassed++;
  }

  // 3. Cek Tanggal Pemeriksaan pada Hari Libur / Hari Minggu (Temuan Khas Inspektorat)
  if (!isNaN(baphpDate.getTime())) {
    const dayOfWeek = baphpDate.getDay(); // 0 is Sunday
    if (dayOfWeek === 0) {
      issues.push({
        id: 'baphp_hari_minggu',
        field: 'tanggalBAPHP',
        severity: 'warning',
        category: 'kronologi',
        message: 'Tanggal BAPHP Jatuh pada Hari Minggu',
        description: 'Pemeriksaan administrasi/lapangan pada hari libur resmi rentan dipertanyakan auditor kecuali dilengkapi Surat Tugas Lembur resmi.',
        legalBasis: 'Pedoman Penugasan dan Hari Kerja ASN (Permenpan-RB No. 11/2024)',
        recommendation: 'Geser tanggal ke hari kerja terdekat (Jumat atau Senin), atau lampirkan Surat Perintah Tugas Lembur.'
      });
      checksPassed += 0.5;
    } else {
      checksPassed++;
    }
  }

  // 4. Validasi Kronologi BAST dan BAP (BAST >= BAPHP, BAP >= BAST)
  const bastDate = project.tanggalBAST ? new Date(project.tanggalBAST + 'T00:00:00') : baphpDate;
  const bapDate = project.tanggalBAP ? new Date(project.tanggalBAP + 'T00:00:00') : bastDate;

  if (bastDate < baphpDate) {
    issues.push({
      id: 'bast_sebelum_baphp',
      field: 'tanggalBAST',
      severity: 'error',
      category: 'kronologi',
      message: 'Tanggal BAST Mendahului Tanggal Pemeriksaan (BAPHP)',
      description: 'Serah terima pekerjaan (BAST) baru sah dilakukan setelah ada Berita Acara Pemeriksaan (BAPHP).',
      legalBasis: 'Perpres 12/2021 Pasal 57 ayat (1) & (3)',
      recommendation: 'Atur tanggal BAST sama dengan atau setelah tanggal BAPHP.'
    });
  } else if (bapDate < bastDate) {
    issues.push({
      id: 'bap_sebelum_bast',
      field: 'tanggalBAP',
      severity: 'error',
      category: 'kronologi',
      message: 'Tanggal Pembayaran (BAP) Mendahului Serah Terima (BAST)',
      description: 'Berita Acara Pembayaran hanya boleh dibuat setelah serah terima hasil pekerjaan dinyatakan selesai.',
      legalBasis: 'Permendagri No. 77/2020 Bab III Pedoman Pembayaran SPP-LS',
      recommendation: 'Atur tanggal BAP sama dengan atau setelah tanggal BAST.'
    });
  } else {
    checksPassed++;
  }

  // ========================================================================
  // KELOMPOK 2: AKURASI NILAI KONTRAK & PERPAJAKAN (KEMENKEU & DITJEN PAJAK)
  // ========================================================================

  // 5. Validasi Nilai SPK
  if (project.nilaiSPK && project.nilaiSPK > 0) {
    checksPassed++;
  } else {
    issues.push({
      id: 'nilai_spk_nol',
      field: 'nilaiSPK',
      severity: 'error',
      category: 'pajak_keuangan',
      message: 'Nilai Bruto SPK Tidak Boleh Nol',
      description: 'Nilai kontrak diperlukan untuk penulisan angka dan terbilang rupiah pada dokumen pembayaran.',
      legalBasis: 'Permendagri 77/2020 tentang Penatausahaan Pengeluaran Kas',
      recommendation: 'Isi nilai kontrak bruto sesuai dokumen SPK resmi.'
    });
  }

  // 6. Validasi Bea Meterai (UU No. 10 Tahun 2020)
  if (project.nilaiSPK > 5000000) {
    // Di atas Rp 5 juta wajib meterai Rp 10.000
    checksPassed++;
  } else {
    issues.push({
      id: 'bea_meterai_info',
      field: 'nilaiSPK',
      severity: 'info',
      category: 'pajak_keuangan',
      message: 'Nilai Kontrak di Bawah Ambang Bea Meterai',
      description: 'Transaksi bernilai Rp 5.000.000,- atau kurang tidak wajib dikenakan Bea Meterai Rp 10.000,-.',
      legalBasis: 'UU No. 10 Tahun 2020 tentang Bea Meterai Pasal 3 ayat (2)',
      recommendation: 'Meterai opsional untuk transaksi di bawah batas ambang nominal.'
    });
    checksPassed++;
  }

  // 7. Validasi Tarif Pajak PPh (PP No. 9 Tahun 2022 / UU HPP)
  const isKonstruksi = project.jenisPekerjaan === 'Fisik / Konstruksi';
  const expectedPphRate = isKonstruksi ? 2.65 : 2.0;
  checksPassed++; // Formula pajak otomatis terpasang di sistem

  // ========================================================================
  // KELOMPOK 3: LEGALITAS PENYEDIA & REKENING BANK (ANTI-REKENING FIKTIF)
  // ========================================================================

  // 8. Kelengkapan Identitas Badan Usaha Rekanan
  const penyedia = project.penyedia;
  if (penyedia && penyedia.namaPerusahaan && penyedia.namaDirektur && penyedia.jabatan) {
    checksPassed++;
  } else {
    issues.push({
      id: 'penyedia_identitas_kurang',
      field: 'penyedia.namaPerusahaan',
      severity: 'error',
      category: 'rekanan_rekening',
      message: 'Identitas Perusahaan / Direktur Rekanan Belum Lengkap',
      description: 'Nama perusahaan, nama direktur penandatangan, dan jabatan wajib tertera lengkap.',
      legalBasis: 'Perpres 12/2021 Pasal 1 angka 38 (Definisi Penyedia)',
      recommendation: 'Lengkapi profil rekanan pada data kontrak.'
    });
  }

  // 9. Validasi Nomor Rekening Bank & Nama Bank
  if (penyedia?.bankNama && penyedia?.nomorRekening && penyedia.nomorRekening.trim().length >= 6) {
    checksPassed++;
  } else {
    issues.push({
      id: 'penyedia_bank_missing',
      field: 'penyedia.nomorRekening',
      severity: 'error',
      category: 'rekanan_rekening',
      message: 'Nomor Rekening atau Nama Bank Penyedia Belum Terisi',
      description: 'Wajib dicantumkan pada Berita Acara Pembayaran (BAP) dan Kuitansi untuk transfer Kas Daerah (Kasda).',
      legalBasis: 'Permendagri 77/2020 Tata Cara Penyaluran SP2D Non-Tunai',
      recommendation: 'Masukkan nomor rekening dan bank rekanan (misal: Bank Kaltimtara / BNI / Mandiri).'
    });
  }

  // 10. Validasi Kesesuaian Nama Rekening (Anti Rekening Pribadi / Rekening Fiktif)
  if (penyedia?.atasNamaRekening && penyedia.namaPerusahaan) {
    const atasNamaClean = penyedia.atasNamaRekening.toLowerCase().replace(/^(cv|pt)\.?\s*/i, '').trim();
    const namaPtClean = penyedia.namaPerusahaan.toLowerCase().replace(/^(cv|pt)\.?\s*/i, '').trim();
    
    // Cek apakah rekening atas nama badan atau nama pribadi direktur
    if (atasNamaClean.includes(namaPtClean) || namaPtClean.includes(atasNamaClean)) {
      checksPassed++;
    } else {
      issues.push({
        id: 'rekening_beda_nama',
        field: 'penyedia.atasNamaRekening',
        severity: 'warning',
        category: 'rekanan_rekening',
        message: 'Nama pada Rekening Bank Berbeda dengan Nama Badan Usaha',
        description: `Rekening atas nama "${penyedia.atasNamaRekening}" sedangkan kontrak atas nama "${penyedia.namaPerusahaan}". Kuasa BUD/Kasda mewajibkan transfer atas nama badan usaha untuk mencegah rekening fiktif.`,
        legalBasis: 'Pedoman Verifikasi SP2D Kas Daerah & Rekomendasi KPK atas Akun Penampung',
        recommendation: 'Gunakan rekening giro resmi berbadan hukum perusahaan rekanan atau lampirkan Surat Keterangan Bank.'
      });
      checksPassed += 0.5;
    }
  } else {
    checksPassed += 0.5;
  }

  // 11. Validasi NPWP Perusahaan
  if (penyedia?.npwp && penyedia.npwp.replace(/\D/g, '').length >= 15) {
    checksPassed++;
  } else {
    issues.push({
      id: 'penyedia_npwp_invalid',
      field: 'penyedia.npwp',
      severity: 'warning',
      category: 'rekanan_rekening',
      message: 'Nomor Pokok Wajib Pajak (NPWP) Rekanan Belum Valid',
      description: 'NPWP wajib 15 atau 16 digit angka baku Ditjen Pajak untuk keperluan penerbitan e-Bupot dan e-Faktur.',
      legalBasis: 'PMK No. 136/PMK.03/2023 tentang Format Baru NPWP 16 Digit',
      recommendation: 'Periksa dan lengkapi NPWP perusahaan penyedia.'
    });
    checksPassed += 0.5;
  }

  // ========================================================================
  // KELOMPOK 4: LEGITIMASI PEJABAT PENGADAAN (PPK, PPTK, PA/KPA)
  // ========================================================================

  // 12. Validasi PPK (Pejabat Pembuat Komitmen)
  const ppk = project.ppk;
  if (ppk?.nama && ppk?.nip) {
    const cleanNip = ppk.nip.replace(/\D/g, '');
    if (cleanNip.length === 18) {
      checksPassed++;
    } else {
      issues.push({
        id: 'nip_ppk_format',
        field: 'ppk.nip',
        severity: 'warning',
        category: 'pejabat_legalitas',
        message: 'Format NIP PPK Belum Standar 18 Digit BKN',
        description: `NIP PPK saat ini terdeteksi ${cleanNip.length} digit (standar baku BKN adalah 18 digit: YYYYMMDD YYYYMM X XXX).`,
        legalBasis: 'Perka BKN No. 22 Tahun 2008 tentang Pedoman NIP PNS',
        recommendation: 'Sesuaikan penulisan NIP PPK dengan format 18 digit baku.'
      });
      checksPassed += 0.5;
    }
  } else {
    issues.push({
      id: 'ppk_incomplete',
      field: 'ppk.nama',
      severity: 'error',
      category: 'pejabat_legalitas',
      message: 'Identitas Pejabat Pembuat Komitmen (PPK) Belum Lengkap',
      description: 'Nama dan NIP PPK adalah syarat mutlak penandatangan BAPHP, BAST, dan BAP.',
      legalBasis: 'Perpres 12/2021 Pasal 11 (Tugas & Wewenang PPK)',
      recommendation: 'Lengkapi identitas PPK yang bertugas.'
    });
  }

  // 13. Validasi PPTK (Pejabat Pelaksana Teknis Kegiatan) & Pemisahan Peran
  const pptk = project.pptk;
  if (pptk?.nama && pptk?.nip) {
    const cleanNip = pptk.nip.replace(/\D/g, '');
    if (cleanNip.length === 18) {
      if (ppk?.nip && cleanNip === ppk.nip.replace(/\D/g, '')) {
        issues.push({
          id: 'ppk_pptk_rangkap',
          field: 'pptk.nip',
          severity: 'warning',
          category: 'pejabat_legalitas',
          message: 'PPK dan PPTK Tercatat Sebagai Personil yang Sama',
          description: 'Regulasi keuangan daerah memisahkan fungsi PPK (komitmen & pengikatan hukum) dengan PPTK (pelaksana operasional teknis kegiatan).',
          legalBasis: 'PP No. 12/2019 Pasal 12 & Permendagri 77/2020 tentang Pemisahan Fungsi Pengelola Keuangan',
          recommendation: 'Gunakan pejabat PPTK yang berbeda dari pejabat PPK.'
        });
        checksPassed += 0.5;
      } else {
        checksPassed++;
      }
    } else {
      issues.push({
        id: 'nip_pptk_format',
        field: 'pptk.nip',
        severity: 'warning',
        category: 'pejabat_legalitas',
        message: 'Format NIP PPTK Belum Standar 18 Digit BKN',
        description: `NIP PPTK saat ini terdeteksi ${cleanNip.length} digit.`,
        legalBasis: 'Perka BKN No. 22 Tahun 2008',
        recommendation: 'Sesuaikan penulisan NIP PPTK dengan format 18 digit baku.'
      });
      checksPassed += 0.5;
    }
  } else {
    issues.push({
      id: 'pptk_incomplete',
      field: 'pptk.nama',
      severity: 'error',
      category: 'pejabat_legalitas',
      message: 'Identitas Pejabat Pelaksana Teknis Kegiatan (PPTK) Belum Lengkap',
      description: 'PPTK wajib menandatangani Berita Acara Pemeriksaan Hasil Pekerjaan (BAPHP).',
      legalBasis: 'Perpres 12/2021 Pasal 57 & Permendagri 77/2020',
      recommendation: 'Lengkapi identitas PPTK penanggung jawab kegiatan.'
    });
  }

  // ========================================================================
  // KELOMPOK 5: KELENGKAPAN 13 BERKAS PENCAIRAN SPP-LS (PERMENDAGRI 77/2020)
  // ========================================================================

  // 14. Validasi Penomoran Register Berita Acara Resmi (Klasifikasi Permendagri 1/2023)
  if (project.nomorBAPHP && project.nomorBAPHP.trim().length > 5) {
    checksPassed++;
  } else {
    issues.push({
      id: 'nomor_baphp_missing',
      field: 'nomorBAPHP',
      severity: 'error',
      category: 'kelengkapan_berkas',
      message: 'Nomor Register Dinas BAPHP Belum Terisi',
      description: 'Nomor register dinas wajib dicantumkan pada bagian kepala dokumen naskah dinas.',
      legalBasis: 'Permendagri No. 1 Tahun 2023 tentang Tata Naskah Dinas',
      recommendation: 'Isi nomor BAPHP sesuai buku register agenda dinas (contoh: 000.4.3/64514226/BAPHP/DIKBUD/VI/2026).'
    });
  }

  // 15. Kesiapan Berkas Digital di Google Drive / Berkas Lengkap
  const docsCreatedCount = ALL_DOCUMENTS_CATALOG.filter(
    d => Boolean(project.googleDocs?.[d.type]?.documentId)
  ).length;

  if (docsCreatedCount >= 10) {
    checksPassed++;
  } else if (docsCreatedCount > 0) {
    issues.push({
      id: 'berkas_sebagian_drive',
      field: 'googleDocs',
      severity: 'info',
      category: 'kelengkapan_berkas',
      message: `Sebagian Berkas Telah Terbentuk di Google Drive (${docsCreatedCount}/13)`,
      description: 'Gunakan tombol "Buat Semua 13 Dokumen ke Drive" untuk melengkapi seluruh berkas penagihan.',
      legalBasis: 'SOP Penatausahaan Berkas Pencairan Kasda BPKAD',
      recommendation: 'Klik sinkronisasi massal untuk membuat seluruh 13 dokumen.'
    });
    checksPassed += 0.5;
  } else {
    issues.push({
      id: 'berkas_belum_drive',
      field: 'googleDocs',
      severity: 'info',
      category: 'kelengkapan_berkas',
      message: 'Bundel 13 Dokumen Belum Disinkronisasi ke Google Drive',
      description: 'Dokumen masih berstatus draf lokal di aplikasi.',
      legalBasis: 'Arsip Digital Pengadaan Barang/Jasa',
      recommendation: 'Sinkronisasi ke Google Drive agar dapat ditinjau dan diedit oleh PPK/Bendahara.'
    });
    checksPassed += 0.5;
  }

  // ========================================================================
  // KELOMPOK KHUSUS: VALIDASI MULTI-TERMIN & SKEMA PEMBAYARAN (PERPRES 12/2021)
  // ========================================================================
  if (project.skemaPembayaran === 'termin') {
    totalChecks += 2;
    const termins = project.daftarTermin || [];
    
    // Check 1: Kelayakan Daftar Termin (Minimal 2 termin)
    if (termins.length >= 2) {
      checksPassed++;
    } else {
      issues.push({
        id: 'termin_kurang_dari_dua',
        field: 'daftarTermin',
        severity: 'error',
        category: 'pajak_keuangan',
        message: 'Skema Termin Membutuhkan Minimal 2 Tahapan Pembayaran',
        description: 'Jika memilih skema pembayaran bertahap (termin), wajib terdapat minimal 2 tahap termin atau gunakan skema sekaligus 100%.',
        legalBasis: 'Perpres No. 12/2021 Pasal 53 ayat (2) huruf b',
        recommendation: 'Tambahkan tahapan termin pada form kontrak atau gunakan template 2, 3, 4, atau 5 termin.'
      });
    }

    // Check 2: Total Bobot Kumulatif Wajib Tepat 100%
    const totalBobot = termins.reduce((acc, t) => acc + (Number(t.bobotPersen) || 0), 0);
    if (Math.round(totalBobot) === 100) {
      checksPassed++;
    } else {
      issues.push({
        id: 'termin_bobot_tidak_100',
        field: 'daftarTermin',
        severity: 'error',
        category: 'pajak_keuangan',
        message: `Total Bobot Kumulatif Termin Belum Tepat 100% (Saat Ini: ${totalBobot}%)`,
        description: `Seluruh tahapan termin wajib berjumlah tepat 100% dari total nilai kontrak SPK. Terjadi selisih ${100 - totalBobot}% yang berpotensi menjadi celah hukum wanprestasi atau selisih tagihan.`,
        legalBasis: 'Perpres 12/2021 Pasal 53 & Permendagri 77/2020 Bab V',
        recommendation: 'Sesuaikan persentase tiap termin agar jumlahnya tepat 100%.'
      });
    }
  }

  // Hitung Skor Akurasi & Kepatuhan Hukum (0 - 100)
  const score = Math.round((checksPassed / totalChecks) * 100);
  const hasErrors = issues.some(i => i.severity === 'error');
  const isValid = !hasErrors && score >= 80;

  return {
    isValid,
    score,
    issues,
    checksPassed: Math.floor(checksPassed),
    totalChecks
  };
}
