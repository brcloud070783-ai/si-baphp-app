import { ProjectContract, KopDinasConfig, DocumentType } from '../types';
import { 
  formatRupiah, 
  terbilangRupiah, 
  formatTanggalIndonesia, 
  getTerbilangTanggal, 
  formatJangkaWaktu,
  terbilang
} from './terbilang';

export interface DocumentCatalogItem {
  type: DocumentType;
  label: string;
  shortLabel: string;
  stage: 'Awal Kontrak' | 'Pelaksanaan' | 'Serah Terima' | 'Pencairan Kasda';
  description: string;
}

export const ALL_DOCUMENTS_CATALOG: DocumentCatalogItem[] = [
  {
    type: 'BAPHP',
    label: '1. BA Pemeriksaan Hasil Pekerjaan (BAPHP)',
    shortLabel: 'BAPHP',
    stage: 'Serah Terima',
    description: 'Pemeriksaan fisik & mutu 100% bersama Konsultan, PPTK, dan Rekanan (2 Halaman)'
  },
  {
    type: 'BAST',
    label: '2. BA Serah Terima Pertama (BASTP Rekanan ke PPK)',
    shortLabel: 'BAST Rekanan',
    stage: 'Serah Terima',
    description: 'Penyerahan hasil pekerjaan dari Rekanan Penyedia kepada PPK'
  },
  {
    type: 'BAST_PA',
    label: '3. BAST PPK ke Pengguna Anggaran (PA/KPA)',
    shortLabel: 'BAST PA/KPA',
    stage: 'Serah Terima',
    description: 'Penyerahan hasil pekerjaan dari PPK ke PA/KPA (Amanat Perpres No. 12/2021)'
  },
  {
    type: 'BAP',
    label: '4. BA Pembayaran (BAP 100% / SPP-LS)',
    shortLabel: 'BA Pembayaran',
    stage: 'Pencairan Kasda',
    description: 'Perhitungan nilai bruto, potongan pajak PPh, dan nilai bersih dibayarkan'
  },
  {
    type: 'BAKP',
    label: '5. BA Kemajuan Prestasi Pekerjaan (100%)',
    shortLabel: 'Prestasi Fisik',
    stage: 'Pelaksanaan',
    description: 'Laporan opname kemajuan progres fisik 100% di lokasi sekolah'
  },
  {
    type: 'BA_STL',
    label: '6. BA Serah Terima Lapangan (BA-STL)',
    shortLabel: 'Serah Lapangan',
    stage: 'Awal Kontrak',
    description: 'Penyerahan tapak lokasi pekerjaan sekolah kepada rekanan saat awal kontrak'
  },
  {
    type: 'BA_MC0',
    label: '7. BA Rekayasa Lapangan / Mutual Check (MC-0)',
    shortLabel: 'MC-0 Lapangan',
    stage: 'Awal Kontrak',
    description: 'Penyelarasan volume dan gambar kerja di awal pelaksanaan pekerjaan'
  },
  {
    type: 'BA_UM',
    label: '8. BA Pembayaran Uang Muka Kontrak',
    shortLabel: 'Uang Muka',
    stage: 'Pelaksanaan',
    description: 'Pembayaran uang muka 20%-30% dengan jaminan bank/asuransi'
  },
  {
    type: 'BAST_FHO',
    label: '9. BAST Akhir (FHO) & Retensi 5%',
    shortLabel: 'BAST-FHO',
    stage: 'Pencairan Kasda',
    description: 'Penyerahan akhir setelah masa pemeliharaan & pengembalian jaminan retensi'
  },
  {
    type: 'KUITANSI',
    label: '10. Kuitansi Pembayaran Resmi Dinas',
    shortLabel: 'Kuitansi Dinas',
    stage: 'Pencairan Kasda',
    description: 'Format kuitansi bermeterai Rp 10.000 dengan kode rekening DPA'
  },
  {
    type: 'CHECKLIST',
    label: '11. Lembar Verifikasi Kelengkapan Dokumen SPP-LS',
    shortLabel: 'Lembar Verifikasi',
    stage: 'Pencairan Kasda',
    description: 'Checklist audit kelengkapan berkas pencairan (Permendagri 77/2020)'
  },
  {
    type: 'SURAT_REKANAN',
    label: '12. Surat Permohonan Pembayaran dari Rekanan',
    shortLabel: 'Surat Rekanan',
    stage: 'Serah Terima',
    description: 'Surat permohonan resmi penagihan 100% dari rekanan kepada PPK'
  },
  {
    type: 'LAMPIRAN_FOTO',
    label: '13. Lembar Dokumentasi Foto Fisik Sekolah',
    shortLabel: 'Dokumentasi Foto',
    stage: 'Pelaksanaan',
    description: 'Laporan visual progres fisik 0%, 50%, dan 100% di lokasi sekolah'
  },
  {
    type: 'SPMK',
    label: '14. Surat Perintah Mulai Kerja (SPMK)',
    shortLabel: 'SPMK Resmi',
    stage: 'Awal Kontrak',
    description: 'Surat resmi penetapan dimulainya pekerjaan lapangan (Pasal 50 Perpres 12/2021)'
  },
  {
    type: 'LEMBAR_KENDALI',
    label: '15. Lembar Kendali & Rekapitulasi Realisasi Termin',
    shortLabel: 'Kendali Kasda',
    stage: 'Pencairan Kasda',
    description: 'Progressive Payment Certificate / Lembar Kontrol Kasda (Permendagri 77/2020)'
  }
];

/**
 * Generate semantic HTML specifically formatted for conversion to Google Docs
 */
export function generateDocumentHtml(
  project: ProjectContract, 
  kop: KopDinasConfig, 
  docType: DocumentType
): { title: string; html: string } {
  const tglSPKIndo = formatTanggalIndonesia(project.tanggalSPK);
  const durasiText = formatJangkaWaktu(project.jangkaWaktuHari, project.tipeHari);

  let docTitle = 'BERITA ACARA';
  let docNumber = project.nomorBAPHP;
  let docDate = project.tanggalBAPHP || project.tanggalSelesai;

  // Determine doc metadata
  const isTerminMode = project.skemaPembayaran === 'termin' && Boolean(project.daftarTermin?.length);
  const activeTermin = isTerminMode 
    ? (project.daftarTermin![project.activeTerminIndex ?? 0] || project.daftarTermin![0])
    : null;

  switch (docType) {
    case 'BAPHP':
      docTitle = 'BERITA ACARA PEMERIKSAAN HASIL PEKERJAAN (BAPHP)';
      docNumber = project.nomorBAPHP;
      docDate = project.tanggalBAPHP || project.tanggalSelesai;
      break;
    case 'BAST':
      docTitle = 'BERITA ACARA SERAH TERIMA PERTAMA PEKERJAAN (BASTP)';
      docNumber = project.nomorBAST || project.nomorBAPHP;
      docDate = project.tanggalBAST || project.tanggalBAPHP;
      break;
    case 'BAST_PA':
      docTitle = 'BERITA ACARA SERAH TERIMA HASIL PEKERJAAN DARI PPK KEPADA PA/KPA';
      docNumber = project.nomorBAST_PA || project.nomorBAST || project.nomorBAPHP;
      docDate = project.tanggalBAST_PA || project.tanggalBAST || project.tanggalBAPHP;
      break;
    case 'BAP':
      docTitle = activeTermin 
        ? `BERITA ACARA PEMBAYARAN ${activeTermin.namaTermin.toUpperCase()} (BAP)`
        : 'BERITA ACARA PEMBAYARAN 100% (BAP)';
      docNumber = activeTermin?.nomorBAP || project.nomorBAP || project.nomorBAPHP;
      docDate = activeTermin?.tanggalBAP || project.tanggalBAP || project.tanggalBAPHP;
      break;
    case 'BAKP':
      docTitle = activeTermin 
        ? `BERITA ACARA KEMAJUAN PRESTASI PEKERJAAN (${activeTermin.bobotKumulatif}%)`
        : 'BERITA ACARA KEMAJUAN PRESTASI PEKERJAAN (100%)';
      docNumber = project.nomorBAKP || project.nomorBAPHP;
      docDate = activeTermin?.tanggalBAP || project.tanggalBAKP || project.tanggalBAPHP;
      break;
    case 'BA_STL':
      docTitle = 'BERITA ACARA SERAH TERIMA LAPANGAN (BA-STL)';
      docNumber = project.nomorBA_STL || project.nomorBAPHP;
      docDate = project.tanggalBA_STL || project.tanggalSPK;
      break;
    case 'BA_MC0':
      docTitle = 'BERITA ACARA REKAYASA LAPANGAN / MUTUAL CHECK (MC-0)';
      docNumber = project.nomorBA_MC0 || project.nomorBAPHP;
      docDate = project.tanggalBA_MC0 || project.tanggalSPK;
      break;
    case 'BA_UM':
      docTitle = 'BERITA ACARA PEMBAYARAN UANG MUKA KONTRAK (20%-30%)';
      docNumber = project.nomorBA_UM || project.nomorBAPHP;
      docDate = project.tanggalBA_UM || project.tanggalSPK;
      break;
    case 'BAST_FHO':
      docTitle = 'BERITA ACARA SERAH TERIMA AKHIR (FINAL HAND OVER - FHO)';
      docNumber = project.nomorBAST_FHO || project.nomorBAPHP;
      docDate = project.tanggalBAST_FHO || project.tanggalBAPHP;
      break;
    case 'KUITANSI':
      docTitle = activeTermin
        ? `KUITANSI PEMBAYARAN ${activeTermin.namaTermin.toUpperCase()}`
        : 'KUITANSI PEMBAYARAN RESMI BERMETERAI';
      docNumber = project.nomorKuitansi || project.nomorBAPHP;
      docDate = activeTermin?.tanggalBAP || project.tanggalKuitansi || project.tanggalBAP || project.tanggalBAPHP;
      break;
    case 'CHECKLIST':
      docTitle = 'LEMBAR VERIFIKASI KELENGKAPAN DOKUMEN SPP-LS BELANJA';
      docNumber = project.nomorChecklist || project.nomorBAPHP;
      docDate = project.tanggalChecklist || project.tanggalBAPHP;
      break;
    case 'SURAT_REKANAN':
      docTitle = activeTermin
        ? `SURAT PERMOHONAN PEMBAYARAN ${activeTermin.namaTermin.toUpperCase()}`
        : 'SURAT PERMOHONAN PEMBAYARAN PEKERJAAN 100%';
      docNumber = project.nomorSuratRekanan || '012/TAG-KONTRAK/VI/2026';
      docDate = activeTermin?.tanggalBAP || project.tanggalSuratRekanan || project.tanggalBAPHP;
      break;
    case 'LAMPIRAN_FOTO':
      docTitle = 'LEMBAR DOKUMENTASI VISUAL HASIL PEKERJAAN';
      docNumber = project.nomorBAPHP;
      docDate = project.tanggalBAPHP;
      break;
    case 'SPMK':
      docTitle = 'SURAT PERINTAH MULAI KERJA (SPMK)';
      docNumber = project.nomorSPMK || project.nomorSPK.replace('PPK-SPK-PL', 'SPMK');
      docDate = project.tanggalSPMK || project.tanggalMulai || project.tanggalSPK;
      break;
    case 'LEMBAR_KENDALI':
      docTitle = 'LEMBAR KENDALI REALISASI PEMBAYARAN BERTAHAP (KASDA BPKAD)';
      docNumber = project.nomorBAP || project.nomorBAPHP;
      docDate = project.tanggalBAP || project.tanggalBAPHP;
      break;
  }

  const dateObj = getTerbilangTanggal(docDate);
  const formattedDocDate = formatTanggalIndonesia(docDate);

  // Financial calculations (supporting multi-termin & custom BAP calculator)
  const kemajuanFisikPersen = project.bapKemajuanFisikPersen ?? (activeTermin ? activeTermin.bobotKumulatif : 100);
  const nilaiPrestasiFisik = Math.round((kemajuanFisikPersen / 100) * project.nilaiSPK);
  const nilaiKotor = project.bapBrutoTagihan ?? (activeTermin ? activeTermin.nilaiBruto : project.nilaiSPK);
  const pphPercent = project.bapPotonganPPhPersen ?? (project.jenisPekerjaan === 'Fisik / Konstruksi' ? 2.65 : 2.0);
  const pphNilai = project.bapPotonganPPhNilai ?? (activeTermin ? activeTermin.pphNilai : Math.round(nilaiKotor * (pphPercent / 100)));
  const potonganUM = project.bapPotonganUangMuka ?? (activeTermin ? activeTermin.potonganUangMuka : 0);
  const retensiPersen = project.bapPotonganRetensiPersen ?? (activeTermin && activeTermin.potonganRetensi > 0 ? 5 : 0);
  const potonganRetensi = project.bapPotonganRetensiNilai ?? (activeTermin ? activeTermin.potonganRetensi : (retensiPersen > 0 ? Math.round(nilaiKotor * (retensiPersen / 100)) : 0));
  const potonganLain = project.bapPotonganLainnya ?? 0;
  const nilaiBersih = project.bapNilaiNetto ?? Math.max(0, nilaiKotor - (potonganUM + potonganRetensi + pphNilai + potonganLain));
  const bobotAktif = kemajuanFisikPersen;
  const sisaKontrak = activeTermin 
    ? Math.max(0, project.nilaiSPK - Math.round((activeTermin.bobotKumulatif / 100) * project.nilaiSPK))
    : 0;

  // Build specific body text and signature blocks based on document type
  let specificBodyContent = '';
  let specificSignatures = '';

  if (docType === 'BAPHP') {
    specificBodyContent = `
      <p class="clause">
        Pada hari ini <strong>${dateObj.hari}</strong>, tanggal <strong>${dateObj.tanggal}</strong>, bulan <strong>${dateObj.bulan}</strong>, tahun <strong>${dateObj.tahun}</strong> (${formattedDocDate}), bertempat di Kantor Dinas Pendidikan dan Kebudayaan Provinsi Kalimantan Utara, kami yang bertanda tangan di bawah ini:
      </p>
      <ol class="parties-list">
        <li><strong>${project.penyedia.namaDirektur}</strong>, Jabatan : <strong>${project.penyedia.jabatan} ${project.penyedia.namaPerusahaan}</strong>, bertindak untuk dan atas nama <strong>${project.penyedia.namaPerusahaan}</strong>, selanjutnya disebut sebagai <strong>PIHAK PERTAMA (PENYEDIA)</strong>.</li>
        <li><strong>${project.pptk.nama}</strong>, NIP. ${project.pptk.nip}, Jabatan : <strong>Pejabat Pelaksana Teknis Kegiatan (PPTK)</strong>, selanjutnya disebut sebagai <strong>PIHAK KEDUA (PPTK)</strong>.</li>
        <li><strong>${project.ppk.nama}</strong>, NIP. ${project.ppk.nip}, Jabatan : <strong>Pejabat Pembuat Komitmen (PPK)</strong>, selanjutnya disebut sebagai <strong>PIHAK KETIGA (PPK)</strong>.</li>
      </ol>
      <p class="normal">Menyatakan bersama dengan sebenarnya bahwa:</p>
      <p class="clause">1. Telah melakukan pemeriksaan bersama atas hasil pelaksanaan pekerjaan <strong>${project.namaPaket}</strong> yang berlokasi di <strong>${project.lokasi}</strong>.</p>
      <p class="clause">2. Seluruh pekerjaan telah diselesaikan dengan baik, lengkap, dan memenuhi standar teknis yang dipersyaratkan dengan tingkat kemajuan fisik mencapai <strong>100% (seratus persen)</strong>.</p>
      <p class="clause">3. PIHAK PERTAMA bertanggung jawab penuh terhadap segala cacat mutu dan kewajiban revisi/garansi sesuai ketentuan kontrak.</p>
    `;
    specificSignatures = `
      <table class="sig-table">
        <tr>
          <td>
            <div>PIHAK PERTAMA (PENYEDIA)</div>
            <div class="font-bold">${project.penyedia.namaPerusahaan}</div>
            <div class="sig-spacer"></div>
            <div class="sig-name">${project.penyedia.namaDirektur}</div>
            <div>${project.penyedia.jabatan}</div>
          </td>
          <td>
            <div>PIHAK KEDUA (PPTK)</div>
            <div class="font-bold">Dinas Pendidikan & Kebudayaan</div>
            <div class="sig-spacer"></div>
            <div class="sig-name">${project.pptk.nama}</div>
            <div>NIP. ${project.pptk.nip}</div>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding-top: 24px;">
            <div>Mengetahui / Menyetujui :</div>
            <div class="font-bold">PEJABAT PEMBUAT KOMITMEN (PPK)</div>
            <div class="sig-spacer"></div>
            <div class="sig-name">${project.ppk.nama}</div>
            <div>NIP. ${project.ppk.nip}</div>
          </td>
        </tr>
      </table>
    `;
  } else if (docType === 'BAST') {
    specificBodyContent = `
      <p class="clause">
        Pada hari ini <strong>${dateObj.hari}</strong>, tanggal <strong>${dateObj.tanggal}</strong>, bulan <strong>${dateObj.bulan}</strong>, tahun <strong>${dateObj.tahun}</strong> (${formattedDocDate}), kami yang bertanda tangan di bawah ini:
      </p>
      <ol class="parties-list">
        <li><strong>${project.penyedia.namaDirektur}</strong>, Jabatan : <strong>${project.penyedia.jabatan} ${project.penyedia.namaPerusahaan}</strong>, bertindak atas nama <strong>${project.penyedia.namaPerusahaan}</strong>, selanjutnya disebut <strong>PIHAK PERTAMA (YANG MENYERAHKAN)</strong>.</li>
        <li><strong>${project.ppk.nama}</strong>, NIP. ${project.ppk.nip}, Jabatan : <strong>Pejabat Pembuat Komitmen (PPK)</strong>, selanjutnya disebut <strong>PIHAK KEDUA (YANG MENERIMA)</strong>.</li>
      </ol>
      <p class="normal">Berdasarkan Berita Acara Pemeriksaan Hasil Pekerjaan (BAPHP) Nomor: <strong>${project.nomorBAPHP}</strong>, kedua belah pihak sepakat:</p>
      <p class="clause">1. <strong>PIHAK PERTAMA</strong> dengan ini menyerahkan hasil pelaksanaan pekerjaan <strong>${project.namaPaket}</strong> kepada <strong>PIHAK KEDUA</strong>.</p>
      <p class="clause">2. <strong>PIHAK KEDUA</strong> menerima penyerahan hasil pekerjaan tersebut dalam keadaan baik, lengkap, dan memenuhi syarat sesuai dokumen kontrak.</p>
      <p class="clause">3. Dengan ditandatanganinya Berita Acara ini, maka hak pembayaran atas prestasi pekerjaan 100% dapat diproses sesuai ketentuan peraturan keuangan daerah.</p>
    `;
    specificSignatures = `
      <table class="sig-table">
        <tr>
          <td>
            <div>PIHAK PERTAMA (PENYEDIA)</div>
            <div class="font-bold">${project.penyedia.namaPerusahaan}</div>
            <div class="sig-spacer"></div>
            <div class="sig-name">${project.penyedia.namaDirektur}</div>
            <div>${project.penyedia.jabatan}</div>
          </td>
          <td>
            <div>PIHAK KEDUA (PPK)</div>
            <div class="font-bold">Pejabat Pembuat Komitmen</div>
            <div class="sig-spacer"></div>
            <div class="sig-name">${project.ppk.nama}</div>
            <div>NIP. ${project.ppk.nip}</div>
          </td>
        </tr>
      </table>
    `;
  } else if (docType === 'BAST_PA') {
    const paName = project.paKpa?.nama || 'Drs. H. MUSTAFA, M.Pd';
    const paNip = project.paKpa?.nip || '19680512 199303 1 005';
    specificBodyContent = `
      <p class="clause">
        Sesuai dengan ketentuan <strong>Pasal 57 & Pasal 58 Peraturan Presiden Nomor 12 Tahun 2021</strong> tentang Perubahan Atas Perpres No. 16 Tahun 2018 tentang Pengadaan Barang/Jasa Pemerintah, pada hari ini <strong>${dateObj.hari}</strong> tanggal <strong>${dateObj.tanggal}</strong> bulan <strong>${dateObj.bulan}</strong> tahun <strong>${dateObj.tahun}</strong> (${formattedDocDate}), kami yang bertanda tangan di bawah ini:
      </p>
      <ol class="parties-list">
        <li><strong>${project.ppk.nama}</strong>, NIP. ${project.ppk.nip}, Jabatan: <strong>Pejabat Pembuat Komitmen (PPK)</strong>, selanjutnya disebut <strong>PIHAK PERTAMA</strong>.</li>
        <li><strong>${paName}</strong>, NIP. ${paNip}, Jabatan: <strong>Pengguna Anggaran (PA) / Kepala Dinas Pendidikan dan Kebudayaan</strong>, selanjutnya disebut <strong>PIHAK KEDUA</strong>.</li>
      </ol>
      <p class="normal">Menyatakan bahwa:</p>
      <p class="clause">1. <strong>PIHAK PERTAMA</strong> menyerahkan hasil pengadaan pekerjaan <strong>${project.namaPaket}</strong> yang telah selesai 100% dan diterima dari penyedia berdasarkan BAST Nomor ${project.nomorBAST || project.nomorBAPHP}.</p>
      <p class="clause">2. <strong>PIHAK KEDUA</strong> menerima hasil pengadaan tersebut untuk dicatat ke dalam Daftar Barang / Aset Milik Daerah serta diproses administrasi pembayarannya.</p>
    `;
    specificSignatures = `
      <table class="sig-table">
        <tr>
          <td>
            <div>PIHAK PERTAMA (PPK)</div>
            <div class="font-bold">Pejabat Pembuat Komitmen</div>
            <div class="sig-spacer"></div>
            <div class="sig-name">${project.ppk.nama}</div>
            <div>NIP. ${project.ppk.nip}</div>
          </td>
          <td>
            <div>PIHAK KEDUA (PA / KPA)</div>
            <div class="font-bold">Pengguna Anggaran</div>
            <div class="sig-spacer"></div>
            <div class="sig-name">${paName}</div>
            <div>NIP. ${paNip}</div>
          </td>
        </tr>
      </table>
    `;
  } else if (docType === 'BAP') {
    specificBodyContent = `
      <p class="clause">
        Berdasarkan BAST Nomor <strong>${project.nomorBAST || project.nomorBAPHP}</strong> tanggal ${formattedDocDate}, dengan ini disetujui pembayaran ${isTerminMode ? `atas <strong>${activeTermin?.namaTermin}</strong>` : 'atas penyelesaian pekerjaan 100%'} dengan rincian administrasi keuangan sebagai berikut:
      </p>
      <table class="meta-table" style="border: 1px solid #000; margin: 14px 0;">
        <tr style="background-color: #f2f2f2; font-weight: bold;">
          <td style="border: 1px solid #000; padding: 6px;">Uraian Rincian Pembayaran</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: right;">Jumlah (Rupiah)</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 6px;">1. Nilai Total Kontrak / SPK</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: right; font-family: monospace;">${formatRupiah(project.nilaiSPK)}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 6px;">2. Prestasi Kemajuan Fisik Kumulatif (${bobotAktif}%)</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: right; font-family: monospace;"><strong>${formatRupiah(Math.round((bobotAktif / 100) * project.nilaiSPK))}</strong></td>
        </tr>
        <tr style="background-color: #fafafa;">
          <td style="border: 1px solid #000; padding: 6px;">3. Jumlah Bruto Tagihan ${isTerminMode ? (activeTermin?.namaTermin || '') : 'Pekerjaan (100%)'}</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: right; font-family: monospace;"><strong>${formatRupiah(nilaiKotor)}</strong></td>
        </tr>
        ${potonganUM > 0 ? `
        <tr>
          <td style="border: 1px solid #000; padding: 6px;">4. Potongan Angsuran Pengembalian Uang Muka</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: right; font-family: monospace; color: #900;">(${formatRupiah(potonganUM)})</td>
        </tr>
        ` : ''}
        ${potonganRetensi > 0 ? `
        <tr>
          <td style="border: 1px solid #000; padding: 6px;">5. Potongan Jaminan Retensi Pemeliharaan (5%)</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: right; font-family: monospace; color: #900;">(${formatRupiah(potonganRetensi)})</td>
        </tr>
        ` : ''}
        <tr>
          <td style="border: 1px solid #000; padding: 6px;">6. Potongan Pajak Penghasilan (PPh ${pphPercent}%)</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: right; font-family: monospace; color: #900;">(${formatRupiah(pphNilai)})</td>
        </tr>
        <tr style="background-color: #e6f2ff; font-weight: bold;">
          <td style="border: 1px solid #000; padding: 6px;">7. Jumlah Pembayaran Bersih (Netto) yang Ditransfer</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: right; font-family: monospace; font-size: 11pt;"><strong>${formatRupiah(nilaiBersih)}</strong></td>
        </tr>
        ${isTerminMode ? `
        <tr>
          <td style="border: 1px solid #000; padding: 6px; font-style: italic;">8. Sisa Pembayaran Kontrak Belum Ditagihkan</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: right; font-family: monospace;">${formatRupiah(sisaKontrak)}</td>
        </tr>
        ` : ''}
      </table>
      <p class="normal">
        Terbilang Bersih : <strong>${terbilangRupiah(nilaiBersih)}</strong>
      </p>
      <p class="clause">
        Pembayaran ditransfer langsung ke Rekening <strong>${project.penyedia.bankNama}</strong> Nomor: <strong>${project.penyedia.nomorRekening}</strong> atas nama <strong>${project.penyedia.atasNamaRekening}</strong> (NPWP: ${project.penyedia.npwp}).
      </p>
    `;
    specificSignatures = `
      <table class="sig-table">
        <tr>
          <td>
            <div>Yang Menerima Pembayaran:</div>
            <div class="font-bold">${project.penyedia.namaPerusahaan}</div>
            <div class="sig-spacer"></div>
            <div class="sig-name">${project.penyedia.namaDirektur}</div>
            <div>${project.penyedia.jabatan}</div>
          </td>
          <td>
            <div>Disetujui untuk Dibayar:</div>
            <div class="font-bold">PEJABAT PEMBUAT KOMITMEN (PPK)</div>
            <div class="sig-spacer"></div>
            <div class="sig-name">${project.ppk.nama}</div>
            <div>NIP. ${project.ppk.nip}</div>
          </td>
        </tr>
      </table>
    `;
  } else if (docType === 'KUITANSI') {
    specificBodyContent = `
      <div style="border: 2px solid #000; padding: 16px; margin: 16px 0;">
        <table class="meta-table">
          <tr>
            <td style="width: 25%;">Sudah Terima Dari</td>
            <td style="width: 3%;">:</td>
            <td><strong>Pengguna Anggaran / Bendahara Pengeluaran Dinas Pendidikan dan Kebudayaan Provinsi Kalimantan Utara</strong></td>
          </tr>
          <tr>
            <td>Banyaknya Uang</td>
            <td>:</td>
            <td><strong style="background: #f0f0f0; padding: 4px 8px; display: inline-block;">${terbilangRupiah(nilaiBersih)}</strong></td>
          </tr>
          <tr>
            <td>Untuk Pembayaran</td>
            <td>:</td>
            <td>${isTerminMode ? `Pembayaran <strong>${activeTermin?.namaTermin}</strong>` : 'Pembayaran 100%'} atas pekerjaan <strong>${project.namaPaket}</strong> di ${project.lokasi} berdasarkan SPK Nomor ${project.nomorSPK} tanggal ${tglSPKIndo}.</td>
          </tr>
          <tr>
            <td>Jumlah Uang Bersih</td>
            <td>:</td>
            <td style="font-size: 14pt; font-weight: bold; font-family: monospace;">${formatRupiah(nilaiBersih)}</td>
          </tr>
        </table>
      </div>
    `;
    specificSignatures = `
      <table class="sig-table">
        <tr>
          <td>
            <div>Setuju Dibayar:</div>
            <div class="font-bold">PEJABAT PEMBUAT KOMITMEN</div>
            <div class="sig-spacer"></div>
            <div class="sig-name">${project.ppk.nama}</div>
            <div>NIP. ${project.ppk.nip}</div>
          </td>
          <td>
            <div style="border: 1px dashed #666; width: 100px; height: 50px; margin: 0 auto 10px auto; font-size: 8pt; line-height: 50px; color: #666;">METERAI 10000</div>
            <div class="font-bold">${project.penyedia.namaPerusahaan}</div>
            <div class="sig-spacer" style="height: 30px;"></div>
            <div class="sig-name">${project.penyedia.namaDirektur}</div>
            <div>${project.penyedia.jabatan}</div>
          </td>
        </tr>
      </table>
    `;
  } else if (docType === 'BAKP') {
    specificBodyContent = `
      <p class="clause">
        Pada hari ini <strong>${dateObj.hari}</strong>, tanggal <strong>${dateObj.tanggal}</strong>, bulan <strong>${dateObj.bulan}</strong>, tahun <strong>${dateObj.tahun}</strong> (${formattedDocDate}), bertempat di lokasi <strong>${project.lokasi}</strong>, kami yang bertanda tangan di bawah ini telah mengadakan pemeriksaan bersama terhadap kemajuan fisik pekerjaan:
      </p>
      <ol class="parties-list">
        <li><strong>${project.penyedia.namaDirektur}</strong>, selaku ${project.penyedia.jabatan} ${project.penyedia.namaPerusahaan}.</li>
        <li><strong>${project.pptk.nama}</strong>, selaku Pejabat Pelaksana Teknis Kegiatan (PPTK).</li>
      </ol>
      <p class="normal">Menyatakan dengan sesungguhnya bahwa:</p>
      <p class="clause">1. Berdasarkan hasil pemeriksaan dan opname pengukuran lapangan secara seksama, kemajuan prestasi fisik pekerjaan <strong>${project.namaPaket}</strong> pada tahap ini telah mencapai <strong>${bobotAktif}%</strong> (${terbilangRupiah(bobotAktif).replace('Rupiah', 'persen')}).</p>
      <p class="clause">2. Seluruh rincian volume dan mutu bahan/pekerjaan yang terpasang telah sesuai dengan Gambar Kerja dan Rencana Kerja dan Syarat (RKS).</p>
      <p class="clause">3. Berita Acara ini dibuat sebagai dasar pemenuhan persyaratan pengajuan ${isTerminMode ? activeTermin?.namaTermin : 'Berita Acara Pembayaran (BAP)'}.</p>
    `;
    specificSignatures = `
      <table class="sig-table">
        <tr>
          <td>
            <div>PIHAK PENYEDIA</div>
            <div class="font-bold">${project.penyedia.namaPerusahaan}</div>
            <div class="sig-spacer"></div>
            <div class="sig-name">${project.penyedia.namaDirektur}</div>
            <div>${project.penyedia.jabatan}</div>
          </td>
          <td>
            <div>PEJABAT PELAKSANA TEKNIS KEGIATAN</div>
            <div class="font-bold">Dinas Pendidikan & Kebudayaan</div>
            <div class="sig-spacer"></div>
            <div class="sig-name">${project.pptk.nama}</div>
            <div>NIP. ${project.pptk.nip}</div>
          </td>
        </tr>
      </table>
    `;
  } else if (docType === 'SPMK') {
    specificBodyContent = `
      <p class="clause">
        Berdasarkan Surat Perintah Kerja (SPK) Nomor <strong>${project.nomorSPK}</strong> tanggal ${tglSPKIndo}, dengan ini Pejabat Pembuat Komitmen (PPK) memerintahkan kepada:
      </p>
      <div style="margin: 12px 0 12px 20px;">
        <table class="meta-table">
          <tr><td style="width: 25%;">Nama Penyedia</td><td>: <strong>${project.penyedia.namaPerusahaan}</strong></td></tr>
          <tr><td>Pimpinan / Direktur</td><td>: <strong>${project.penyedia.namaDirektur}</strong></td></tr>
          <tr><td>Alamat Perusahaan</td><td>: ${project.penyedia.alamatPerusahaan}</td></tr>
        </table>
      </div>
      <p class="normal">Untuk segera memulai pelaksanaan pekerjaan pengadaan dengan ketentuan:</p>
      <p class="clause">1. Paket Pekerjaan: <strong>${project.namaPaket}</strong>, berlokasi di <strong>${project.lokasi}</strong>.</p>
      <p class="clause">2. Tanggal Mulai Kerja: <strong>${formatTanggalIndonesia(project.tanggalMulai)}</strong>.</p>
      <p class="clause">3. Waktu Penyelesaian: <strong>${durasiText}</strong> dan pekerjaan harus selesai selambat-lambatnya tanggal <strong>${formatTanggalIndonesia(project.tanggalSelesai)}</strong>.</p>
      <p class="clause">4. Syarat-syarat Pekerjaan: Sesuai dengan spesifikasi teknis dan ketentuan yang tercantum dalam dokumen SPK.</p>
      <p class="clause">5. Sanksi: Apabila terjadi keterlambatan penyelesaian yang diakibatkan kelalaian penyedia, akan dikenakan denda keterlambatan sebesar 1/1000 (satu permil) per hari dari nilai kontrak sebelum PPN sesuai Perpres No. 12/2021.</p>
    `;
    specificSignatures = `
      <table class="sig-table">
        <tr>
          <td>
            <div>Menerima dan Menyetujui:</div>
            <div class="font-bold">${project.penyedia.namaPerusahaan}</div>
            <div class="sig-spacer"></div>
            <div class="sig-name">${project.penyedia.namaDirektur}</div>
            <div>${project.penyedia.jabatan}</div>
          </td>
          <td>
            <div>Dikeluarkan Oleh:</div>
            <div class="font-bold">PEJABAT PEMBUAT KOMITMEN (PPK)</div>
            <div class="sig-spacer"></div>
            <div class="sig-name">${project.ppk.nama}</div>
            <div>NIP. ${project.ppk.nip}</div>
          </td>
        </tr>
      </table>
    `;
  } else if (docType === 'LEMBAR_KENDALI') {
    specificBodyContent = `
      <p class="clause">
        Lembar kendali ini mencatat rekaman realisasi progres fisik dan keuangan atas paket <strong>${project.namaPaket}</strong> (SPK Nomor: ${project.nomorSPK}) sesuai ketentuan Permendagri No. 77 Tahun 2020:
      </p>
      <table class="meta-table" style="border: 1px solid #000; margin: 14px 0; font-size: 9.5pt;">
        <tr style="background-color: #f2f2f2; font-weight: bold; text-align: center;">
          <td style="border: 1px solid #000; padding: 5px;">Tahap Termin</td>
          <td style="border: 1px solid #000; padding: 5px;">Progres Fisik</td>
          <td style="border: 1px solid #000; padding: 5px;">Nilai Bruto (Rp)</td>
          <td style="border: 1px solid #000; padding: 5px;">Pot. Uang Muka</td>
          <td style="border: 1px solid #000; padding: 5px;">Retensi 5%</td>
          <td style="border: 1px solid #000; padding: 5px;">Pot. PPh</td>
          <td style="border: 1px solid #000; padding: 5px;">Netto Cair (Rp)</td>
          <td style="border: 1px solid #000; padding: 5px;">Status</td>
        </tr>
        ${(project.daftarTermin || []).map(t => `
        <tr>
          <td style="border: 1px solid #000; padding: 5px; font-weight: bold;">${t.namaTermin}</td>
          <td style="border: 1px solid #000; padding: 5px; text-align: center;">${t.bobotKumulatif}%</td>
          <td style="border: 1px solid #000; padding: 5px; text-align: right; font-family: monospace;">${formatRupiah(t.nilaiBruto)}</td>
          <td style="border: 1px solid #000; padding: 5px; text-align: right; font-family: monospace;">${formatRupiah(t.potonganUangMuka)}</td>
          <td style="border: 1px solid #000; padding: 5px; text-align: right; font-family: monospace;">${formatRupiah(t.potonganRetensi)}</td>
          <td style="border: 1px solid #000; padding: 5px; text-align: right; font-family: monospace;">${formatRupiah(t.pphNilai)}</td>
          <td style="border: 1px solid #000; padding: 5px; text-align: right; font-family: monospace; font-weight: bold;">${formatRupiah(t.nilaiNetto)}</td>
          <td style="border: 1px solid #000; padding: 5px; text-align: center; text-transform: uppercase; font-size: 8pt;">${t.status}</td>
        </tr>
        `).join('')}
        <tr style="background-color: #e6f2ff; font-weight: bold;">
          <td colspan="2" style="border: 1px solid #000; padding: 6px; text-align: center;">TOTAL KONTRAK</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: right; font-family: monospace;">${formatRupiah(project.nilaiSPK)}</td>
          <td colspan="5" style="border: 1px solid #000; padding: 6px; text-align: center; font-size: 9pt;">Verifikasi Penatausahaan Pengeluaran Kasda BPKAD</td>
        </tr>
      </table>
      <p class="clause">
        Sisa Alokasi Kontrak Belum Ditagihkan: <strong>${formatRupiah(sisaKontrak)}</strong>.
      </p>
    `;
    specificSignatures = `
      <table class="sig-table">
        <tr>
          <td>
            <div>Verifikator Keuangan / PPTK</div>
            <div class="sig-spacer"></div>
            <div class="sig-name">${project.pptk.nama}</div>
            <div>NIP. ${project.pptk.nip}</div>
          </td>
          <td>
            <div>Pejabat Pembuat Komitmen (PPK)</div>
            <div class="sig-spacer"></div>
            <div class="sig-name">${project.ppk.nama}</div>
            <div>NIP. ${project.ppk.nip}</div>
          </td>
        </tr>
      </table>
    `;
  } else if (docType === 'BA_STL') {
    specificBodyContent = `
      <p class="clause">
        Pada hari ini <strong>${dateObj.hari}</strong>, tanggal <strong>${dateObj.tanggal}</strong>, bulan <strong>${dateObj.bulan}</strong>, tahun <strong>${dateObj.tahun}</strong> (${formattedDocDate}), bertempat di lokasi <strong>${project.lokasi}</strong>, kami yang bertanda tangan di bawah ini:
      </p>
      <ol class="parties-list">
        <li><strong>${project.ppk.nama}</strong>, NIP. ${project.ppk.nip}, Jabatan: Pejabat Pembuat Komitmen (PPK), selanjutnya disebut <strong>PIHAK PERTAMA</strong>.</li>
        <li><strong>${project.penyedia.namaDirektur}</strong>, Jabatan: ${project.penyedia.jabatan} ${project.penyedia.namaPerusahaan}, selanjutnya disebut <strong>PIHAK KEDUA</strong>.</li>
      </ol>
      <p class="normal">Menyatakan bahwa:</p>
      <p class="clause">1. <strong>PIHAK PERTAMA</strong> dengan ini secara resmi menyerahkan tapak/lokasi kerja <strong>${project.namaPaket}</strong> di <strong>${project.lokasi}</strong> kepada <strong>PIHAK KEDUA</strong> dalam keadaan bebas sengketa dan siap dikerjakan.</p>
      <p class="clause">2. <strong>PIHAK KEDUA</strong> menerima penyerahan tapak kerja tersebut dan bertanggung jawab penuh atas keamanan lokasi, keselamatan kerja (K3), serta ketertiban lingkungan selama masa kontrak berlangsung.</p>
    `;
    specificSignatures = `
      <table class="sig-table">
        <tr>
          <td>
            <div>PIHAK KEDUA (PENYEDIA)</div>
            <div class="font-bold">${project.penyedia.namaPerusahaan}</div>
            <div class="sig-spacer"></div>
            <div class="sig-name">${project.penyedia.namaDirektur}</div>
            <div>${project.penyedia.jabatan}</div>
          </td>
          <td>
            <div>PIHAK PERTAMA (PPK)</div>
            <div class="font-bold">Pejabat Pembuat Komitmen</div>
            <div class="sig-spacer"></div>
            <div class="sig-name">${project.ppk.nama}</div>
            <div>NIP. ${project.ppk.nip}</div>
          </td>
        </tr>
      </table>
    `;
  } else if (docType === 'BA_MC0') {
    specificBodyContent = `
      <p class="clause">
        Pada hari ini <strong>${dateObj.hari}</strong>, tanggal <strong>${dateObj.tanggal}</strong>, bulan <strong>${dateObj.bulan}</strong>, tahun <strong>${dateObj.tahun}</strong> (${formattedDocDate}), telah dilaksanakan Rekayasa Lapangan / Mutual Check Awal (MC-0) terhadap pekerjaan <strong>${project.namaPaket}</strong> di <strong>${project.lokasi}</strong>.
      </p>
      <p class="normal">Hasil pemeriksaan bersama:</p>
      <p class="clause">1. Telah dilakukan pengukuran ulang dan penyelarasan antara gambar rencana DED dengan kondisi riil di lapangan.</p>
      <p class="clause">2. Volume pekerjaan awal dinyatakan sesuai dan disetujui sebagai acuan mutual check pelaksanaan tanpa mengubah nilai total kontrak.</p>
    `;
    specificSignatures = `
      <table class="sig-table">
        <tr>
          <td>
            <div>Penyedia Jasa</div>
            <div class="font-bold">${project.penyedia.namaPerusahaan}</div>
            <div class="sig-spacer"></div>
            <div class="sig-name">${project.penyedia.namaDirektur}</div>
          </td>
          <td>
            <div>Tim Teknis / PPTK</div>
            <div class="font-bold">Dinas Pendidikan & Kebudayaan</div>
            <div class="sig-spacer"></div>
            <div class="sig-name">${project.pptk.nama}</div>
          </td>
        </tr>
      </table>
    `;
  } else if (docType === 'BA_UM') {
    const nilaiUM = Math.round(project.nilaiSPK * ((project.persenUangMuka || 20) / 100));
    specificBodyContent = `
      <p class="clause">
        Sesuai ketentuan Perpres No. 12 Tahun 2021 dan dokumen SPK Nomor ${project.nomorSPK}, dengan ini disetujui pemberian Uang Muka Kerja sebesar <strong>${project.persenUangMuka || 20}%</strong> atas pekerjaan <strong>${project.namaPaket}</strong> dengan rincian:
      </p>
      <div style="margin: 12px 0 12px 20px;">
        <table class="meta-table">
          <tr><td style="width: 35%;">1. Nilai Total SPK</td><td>: <strong>${formatRupiah(project.nilaiSPK)}</strong></td></tr>
          <tr><td>2. Besaran Uang Muka (${project.persenUangMuka || 20}%)</td><td>: <strong>${formatRupiah(nilaiUM)}</strong></td></tr>
          <tr><td>3. Terbilang</td><td>: <em>${terbilangRupiah(nilaiUM)}</em></td></tr>
          <tr><td>4. Jaminan Uang Muka</td><td>: Telah diserahkan Jaminan Bank / Asuransi yang sah dan berkekuatan hukum penuh.</td></tr>
        </table>
      </div>
      <p class="clause">
        Pengembalian uang muka akan diperhitungkan secara bertahap dan proporsional melalui pemotongan pada setiap pengajuan pembayaran termin prestasi pekerjaan.
      </p>
    `;
    specificSignatures = `
      <table class="sig-table">
        <tr>
          <td>
            <div>Penyedia Penerima Uang Muka</div>
            <div class="font-bold">${project.penyedia.namaPerusahaan}</div>
            <div class="sig-spacer"></div>
            <div class="sig-name">${project.penyedia.namaDirektur}</div>
          </td>
          <td>
            <div>Pejabat Pembuat Komitmen (PPK)</div>
            <div class="sig-spacer"></div>
            <div class="sig-name">${project.ppk.nama}</div>
            <div>NIP. ${project.ppk.nip}</div>
          </td>
        </tr>
      </table>
    `;
  } else if (docType === 'BAST_FHO') {
    const nilaiRetensi = Math.round(project.nilaiSPK * 0.05);
    specificBodyContent = `
      <p class="clause">
        Pada hari ini <strong>${dateObj.hari}</strong>, tanggal <strong>${dateObj.tanggal}</strong>, bulan <strong>${dateObj.bulan}</strong>, tahun <strong>${dateObj.tahun}</strong> (${formattedDocDate}), telah dilaksanakan Serah Terima Akhir (Final Hand Over - FHO) atas paket <strong>${project.namaPaket}</strong>.
      </p>
      <p class="normal">Menyatakan bahwa:</p>
      <p class="clause">1. Masa pemeliharaan pekerjaan konstruksi/fisik selama 180 (seratus delapan puluh) hari kalender telah berakhir dengan baik tanpa cacat mutu.</p>
      <p class="clause">2. Jaminan pemeliharaan (retensi 5% sebesar <strong>${formatRupiah(nilaiRetensi)}</strong>) dapat dikembalikan secara penuh kepada penyedia sesuai ketentuan peraturan perundang-undangan.</p>
    `;
    specificSignatures = `
      <table class="sig-table">
        <tr>
          <td>
            <div>PIHAK PENYEDIA</div>
            <div class="font-bold">${project.penyedia.namaPerusahaan}</div>
            <div class="sig-spacer"></div>
            <div class="sig-name">${project.penyedia.namaDirektur}</div>
          </td>
          <td>
            <div>PEJABAT PEMBUAT KOMITMEN (PPK)</div>
            <div class="sig-spacer"></div>
            <div class="sig-name">${project.ppk.nama}</div>
            <div>NIP. ${project.ppk.nip}</div>
          </td>
        </tr>
      </table>
    `;
  } else if (docType === 'CHECKLIST') {
    specificBodyContent = `
      <p class="clause">
        Lembar verifikasi kelengkapan berkas penatausahaan SPP-LS Barang dan Jasa berdasarkan Peraturan Menteri Dalam Negeri Nomor 77 Tahun 2020:
      </p>
      <table class="meta-table" style="border: 1px solid #000; margin: 12px 0; font-size: 9.5pt;">
        <tr style="background-color: #f2f2f2; font-weight: bold;">
          <td style="border: 1px solid #000; padding: 5px; width: 5%;">No</td>
          <td style="border: 1px solid #000; padding: 5px;">Nama Dokumen Verifikasi Keuangan</td>
          <td style="border: 1px solid #000; padding: 5px; width: 12%; text-align: center;">Status</td>
          <td style="border: 1px solid #000; padding: 5px;">Keterangan</td>
        </tr>
        <tr><td style="border: 1px solid #000; padding: 5px; text-align: center;">1</td><td style="border: 1px solid #000; padding: 5px;">Surat Permohonan Pembayaran dari Rekanan</td><td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold; color: green;">ADA</td><td style="border: 1px solid #000; padding: 5px;">Asli bermeterai & stempel</td></tr>
        <tr><td style="border: 1px solid #000; padding: 5px; text-align: center;">2</td><td style="border: 1px solid #000; padding: 5px;">Surat Perintah Kerja (SPK) & SPMK</td><td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold; color: green;">ADA</td><td style="border: 1px solid #000; padding: 5px;">Nomor: ${project.nomorSPK}</td></tr>
        <tr><td style="border: 1px solid #000; padding: 5px; text-align: center;">3</td><td style="border: 1px solid #000; padding: 5px;">BA Kemajuan Prestasi Pekerjaan (BAKP)</td><td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold; color: green;">ADA</td><td style="border: 1px solid #000; padding: 5px;">Progres: ${bobotAktif}%</td></tr>
        <tr><td style="border: 1px solid #000; padding: 5px; text-align: center;">4</td><td style="border: 1px solid #000; padding: 5px;">BA Pemeriksaan Hasil Pekerjaan (BAPHP)</td><td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold; color: green;">ADA</td><td style="border: 1px solid #000; padding: 5px;">Ditandatangani PPK & PPTK</td></tr>
        <tr><td style="border: 1px solid #000; padding: 5px; text-align: center;">5</td><td style="border: 1px solid #000; padding: 5px;">BA Serah Terima Pertama (BAST)</td><td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold; color: green;">ADA</td><td style="border: 1px solid #000; padding: 5px;">Pasal 57 Perpres 12/2021</td></tr>
        <tr><td style="border: 1px solid #000; padding: 5px; text-align: center;">6</td><td style="border: 1px solid #000; padding: 5px;">BAST PPK ke Pengguna Anggaran (PA/KPA)</td><td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold; color: green;">ADA</td><td style="border: 1px solid #000; padding: 5px;">Pencatatan Aset Daerah (BMD)</td></tr>
        <tr><td style="border: 1px solid #000; padding: 5px; text-align: center;">7</td><td style="border: 1px solid #000; padding: 5px;">Berita Acara Pembayaran (BAP)</td><td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold; color: green;">ADA</td><td style="border: 1px solid #000; padding: 5px;">Rincian PPh & Netto</td></tr>
        <tr><td style="border: 1px solid #000; padding: 5px; text-align: center;">8</td><td style="border: 1px solid #000; padding: 5px;">Kuitansi Dinas Bermeterai Rp 10.000</td><td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold; color: green;">ADA</td><td style="border: 1px solid #000; padding: 5px;">Netto: ${formatRupiah(nilaiBersih)}</td></tr>
        <tr><td style="border: 1px solid #000; padding: 5px; text-align: center;">9</td><td style="border: 1px solid #000; padding: 5px;">Fotokopi Buku Rekening Bank & NPWP Rekanan</td><td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold; color: green;">ADA</td><td style="border: 1px solid #000; padding: 5px;">${project.penyedia.bankNama}</td></tr>
        <tr><td style="border: 1px solid #000; padding: 5px; text-align: center;">10</td><td style="border: 1px solid #000; padding: 5px;">Foto Dokumentasi Fisik Berwarna</td><td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold; color: green;">ADA</td><td style="border: 1px solid #000; padding: 5px;">Kondisi 0%, 50%, 100%</td></tr>
      </table>
      <div style="border: 1px solid #000; padding: 8px; background-color: #f9f9f9; margin-top: 10px; font-size: 9.5pt;">
        <strong>KESIMPULAN VERIFIKASI:</strong> Seluruh berkas telah diverifikasi dan dinyatakan <strong>LENGKAP DAN SAH</strong> untuk diajukan penerbitan Surat Perintah Pencairan Dana (SP2D) Kas Daerah.
      </div>
    `;
    specificSignatures = `
      <table class="sig-table">
        <tr>
          <td>
            <div>Verifikator Keuangan / PPTK</div>
            <div class="sig-spacer"></div>
            <div class="sig-name">${project.pptk.nama}</div>
            <div>NIP. ${project.pptk.nip}</div>
          </td>
          <td>
            <div>Disetujui Oleh (PPK)</div>
            <div class="sig-spacer"></div>
            <div class="sig-name">${project.ppk.nama}</div>
            <div>NIP. ${project.ppk.nip}</div>
          </td>
        </tr>
      </table>
    `;
  } else if (docType === 'SURAT_REKANAN') {
    specificBodyContent = `
      <div style="margin-bottom: 16px;">
        <table class="meta-table">
          <tr><td style="width: 15%;">Nomor</td><td>: <strong>${project.nomorSuratRekanan || '012/TAG-KONTRAK/VI/2026'}</strong></td></tr>
          <tr><td>Tanggal</td><td>: <strong>${formattedDocDate}</strong></td></tr>
          <tr><td>Lampiran</td><td>: 1 (Satu) Berkas Lengkap</td></tr>
          <tr><td>Perihal</td><td>: <strong>Permohonan Pembayaran ${isTerminMode ? activeTermin?.namaTermin : 'Pekerjaan (100%)'}</strong></td></tr>
        </table>
      </div>
      <p>Kepada Yth.<br><strong>Pejabat Pembuat Komitmen (PPK)</strong><br>Dinas Pendidikan dan Kebudayaan Provinsi Kalimantan Utara<br>di - Tanjung Selor</p>
      <p class="clause">Dengan hormat,</p>
      <p class="clause">Sehubungan dengan telah diselesaikannya pekerjaan <strong>${project.namaPaket}</strong> di ${project.lokasi} sesuai SPK Nomor <strong>${project.nomorSPK}</strong> tanggal ${tglSPKIndo}, dengan ini kami mengajukan permohonan pembayaran sebesar <strong>${formatRupiah(nilaiBersih)}</strong> (<em>${terbilangRupiah(nilaiBersih)}</em>).</p>
      <p class="clause">Pembayaran mohon ditransfer ke Rekening Giro <strong>${project.penyedia.bankNama}</strong> Nomor: <strong>${project.penyedia.nomorRekening}</strong> atas nama <strong>${project.penyedia.atasNamaRekening}</strong>.</p>
      <p class="clause">Demikian surat permohonan ini kami sampaikan, atas kerja samanya diucapkan terima kasih.</p>
    `;
    specificSignatures = `
      <div style="float: right; width: 45%; text-align: center; margin-top: 20px;">
        <div>Hormat kami,</div>
        <div class="font-bold">${project.penyedia.namaPerusahaan}</div>
        <div class="sig-spacer" style="height: 40px;"></div>
        <div class="sig-name">${project.penyedia.namaDirektur}</div>
        <div>${project.penyedia.jabatan}</div>
      </div>
      <div style="clear: both;"></div>
    `;
  } else {
    // LAMPIRAN_FOTO
    specificBodyContent = `
      <p class="clause">
        Lembar dokumentasi visual pelaksanaan pekerjaan <strong>${project.namaPaket}</strong> di <strong>${project.lokasi}</strong> (SPK Nomor: ${project.nomorSPK}):
      </p>
      <table class="meta-table" style="border: 1px solid #000; margin: 14px 0; text-align: center;">
        <tr style="background-color: #f2f2f2; font-weight: bold;">
          <td style="border: 1px solid #000; padding: 6px; width: 33%;">Kondisi Awal (0%)</td>
          <td style="border: 1px solid #000; padding: 6px; width: 33%;">Kondisi Antara (50%)</td>
          <td style="border: 1px solid #000; padding: 6px; width: 33%;">Kondisi Selesai (100%)</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; height: 140px; vertical-align: middle; background: #fafafa; font-size: 9pt; color: #666;">[Foto Fisik 0% - Sebelum Dikerjakan]</td>
          <td style="border: 1px solid #000; height: 140px; vertical-align: middle; background: #fafafa; font-size: 9pt; color: #666;">[Foto Fisik 50% - Progres Lapangan]</td>
          <td style="border: 1px solid #000; height: 140px; vertical-align: middle; background: #fafafa; font-size: 9pt; color: #666;">[Foto Fisik 100% - Selesai & Berfungsi]</td>
        </tr>
      </table>
      <p class="normal">
        Foto dokumentasi di atas diambil pada sudut pandang (*angle*) yang konsisten sebagai bukti otentik serah terima pekerjaan.
      </p>
    `;
    specificSignatures = `
      <table class="sig-table">
        <tr>
          <td>
            <div>Penyedia Jasa</div>
            <div class="font-bold">${project.penyedia.namaPerusahaan}</div>
            <div class="sig-spacer"></div>
            <div class="sig-name">${project.penyedia.namaDirektur}</div>
          </td>
          <td>
            <div>Pejabat Pelaksana Teknis Kegiatan (PPTK)</div>
            <div class="sig-spacer"></div>
            <div class="sig-name">${project.pptk.nama}</div>
            <div>NIP. ${project.pptk.nip}</div>
          </td>
        </tr>
      </table>
    `;
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${docTitle}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600;1,700&display=swap');

    @page {
      size: A4 portrait;
      margin: 10mm 12.7mm 10mm 12.7mm; /* Top/Bottom: 10mm, Left/Right: 12.7mm */
    }

    * {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
      font-size: 10.5pt;
      line-height: 1.15;
      color: #000000;
      margin: 10mm 12.7mm 10mm 12.7mm; /* Top/Bottom: 10mm, Left/Right: 12.7mm */
    }
    .text-center { text-align: center; }
    .text-justify { text-align: justify; }
    .text-right { text-align: right; }
    .font-bold { font-weight: bold; }
    .uppercase { text-transform: uppercase; }
    .italic { font-style: italic; }

    /* Judul & Nomor */
    .doc-title-box {
      text-align: center;
      margin: 14px 0 12px 0;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .doc-title {
      font-size: 12pt;
      font-weight: bold;
      text-decoration: underline;
      margin: 0;
      text-transform: uppercase;
      line-height: 1.15;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .doc-number {
      font-size: 10pt;
      margin-top: 3px;
      line-height: 1.15;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }

    /* Meta Table */
    table.meta-table {
      width: 100%;
      border-collapse: collapse;
      border: none !important;
      margin: 12px 0;
      font-size: 10pt;
      line-height: 1.15;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    table.meta-table td {
      border: none !important;
      padding: 3px 4px;
      vertical-align: top;
      line-height: 1.15;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    table.meta-table td.label-col {
      width: 25%;
    }
    table.meta-table td.sep-col {
      width: 3%;
      text-align: center;
    }

    /* Clauses and Body Text: line-height 1.15 & paragraph spacing 1.25 */
    p, p.clause, p.normal {
      text-align: justify;
      line-height: 1.15;
      margin-top: 0;
      margin-bottom: 1.25em;
      font-size: 10.5pt;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    p.clause {
      text-indent: 2.5em;
    }

    /* Parties listing */
    ol.parties-list {
      margin: 6px 0 10px 0;
      padding-left: 20px;
      font-size: 10.5pt;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    ol.parties-list li {
      margin-bottom: 6px;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }

    /* Signatures Table */
    table.sig-table {
      width: 100%;
      border-collapse: collapse;
      border: none !important;
      margin-top: 24px;
      font-size: 10pt;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    table.sig-table td {
      border: none !important;
      text-align: center;
      vertical-align: top;
      padding: 6px;
      width: 50%;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .sig-spacer {
      height: 60px;
    }
    .sig-name {
      font-weight: bold;
      text-decoration: underline;
      margin-bottom: 2px;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
  </style>
</head>
<body>

  <!-- JUDUL DOKUMEN & NOMOR REGISTRASI & TANGGAL (KOP SURAT DIBUAT MANUAL OLEH USER) -->
  <div class="doc-title-box">
    <div class="doc-title">${docTitle}</div>
    <div class="doc-number">Nomor : ${docNumber || '...'}</div>
    <div class="doc-number">Tanggal : ${formattedDocDate || '...'}</div>
  </div>

  <!-- TABEL DATA KONTRAK DASAR -->
  <table class="meta-table">
    <tr>
      <td class="label-col">Paket Pekerjaan</td>
      <td class="sep-col">:</td>
      <td><strong>${project.namaPaket}</strong></td>
    </tr>
    <tr>
      <td class="label-col">Lokasi</td>
      <td class="sep-col">:</td>
      <td>${project.lokasi} (${project.kabupatenKota})</td>
    </tr>
    <tr>
      <td class="label-col">Surat Perintah Kerja (SPK)</td>
      <td class="sep-col">:</td>
      <td>Nomor ${project.nomorSPK} tanggal ${tglSPKIndo}</td>
    </tr>
    <tr>
      <td class="label-col">Nilai Kontrak / SPK</td>
      <td class="sep-col">:</td>
      <td><strong>${formatRupiah(project.nilaiSPK)}</strong> (${terbilangRupiah(project.nilaiSPK)})</td>
    </tr>
    <tr>
      <td class="label-col">Waktu Pelaksanaan</td>
      <td class="sep-col">:</td>
      <td>${durasiText}</td>
    </tr>
    <tr>
      <td class="label-col">Penyedia / Rekanan</td>
      <td class="sep-col">:</td>
      <td>${project.penyedia.namaPerusahaan} (Direktur: ${project.penyedia.namaDirektur})</td>
    </tr>
  </table>

  <!-- KONTEN KHUSUS BERDASARKAN JENIS DOKUMEN -->
  ${specificBodyContent}

  <p class="normal" style="margin-top: 14px;">
    Demikian Berita Acara ini dibuat dalam rangkap secukupnya untuk dipergunakan sebagaimana mestinya.
  </p>

  <!-- KOLOM TANDA TANGAN (SIGNATURES) -->
  ${specificSignatures}

</body>
</html>`;

  const cleanDocName = `${docType}_${project.lokasi.replace(/[^a-zA-Z0-9]/g, '_')}_${project.tahunAnggaran}`;

  return {
    title: cleanDocName,
    html
  };
}

/**
 * Create a new Google Document from formatted HTML in the user's Google Drive.
 */
export async function createGoogleDocFromProject(
  accessToken: string,
  project: ProjectContract,
  kop: KopDinasConfig,
  docType: DocumentType
): Promise<{ documentId: string; webViewLink: string; title: string }> {
  const { title, html } = generateDocumentHtml(project, kop, docType);

  const metadata = {
    name: `${title} [SI-BAPHP]`,
    mimeType: 'application/vnd.google-apps.document',
    description: `Berita Acara resmi pengadaan ${project.namaPaket} (${project.lokasi}) diterbitkan otomatis oleh SI-BAPHP.`
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: text/html; charset=UTF-8\r\n\r\n' +
    html +
    closeDelimiter;

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartRequestBody
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gagal membuat Google Doc: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const documentId = data.id;
  const webViewLink = data.webViewLink || `https://docs.google.com/document/d/${documentId}/edit`;

  return {
    documentId,
    webViewLink,
    title
  };
}

/**
 * Export a Google Doc file as PDF directly from Google Drive API
 */
export async function exportGoogleDocAsPdf(
  accessToken: string,
  documentId: string
): Promise<Blob> {
  const url = `https://www.googleapis.com/drive/v3/files/${documentId}/export?mimeType=application/pdf`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gagal mengekspor PDF dari Google Docs: ${response.status} - ${errorText}`);
  }

  return await response.blob();
}

/**
 * Save an exported PDF directly to user's Google Drive
 */
export async function savePdfToGoogleDrive(
  accessToken: string,
  pdfBlob: Blob,
  filename: string
): Promise<{ fileId: string; webViewLink: string }> {
  const metadata = {
    name: filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
    mimeType: 'application/pdf'
  };

  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json; charset=UTF-8' })
  );
  form.append('file', pdfBlob);

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    body: form
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gagal menyimpan PDF ke Google Drive: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  return {
    fileId: data.id,
    webViewLink: data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`
  };
}

/**
 * Download a Blob to the local computer file system
 */
export function downloadBlobLocally(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Generates official formatted HTML representation for any of the 15 SPP-LS procurement documents
 */
export function generateDocumentHTML(
  docType: DocumentType,
  project: ProjectContract,
  kopConfig: KopDinasConfig
): string {
  const docCatalog = ALL_DOCUMENTS_CATALOG.find(d => d.type === docType) || ALL_DOCUMENTS_CATALOG[0];
  const tglFormatted = formatTanggalIndonesia(project.tanggalSPK);
  const nilaiFormatted = formatRupiah(project.nilaiSPK);

  return `
    <div style="font-family: Arial, sans-serif; font-size: 11pt; color: #000; line-height: 1.4;">
      <!-- Kop Surat -->
      <div style="text-align: center; border-bottom: 3px double #000; padding-bottom: 12px; margin-bottom: 20px;">
        <h3 style="margin: 0; font-size: 13pt; text-transform: uppercase;">${kopConfig.pemerintahTingkat}</h3>
        <h2 style="margin: 2px 0; font-size: 15pt; text-transform: uppercase; font-weight: bold;">${kopConfig.namaDinas}</h2>
        <p style="margin: 0; font-size: 9pt; font-style: italic;">${kopConfig.alamat}</p>
        <p style="margin: 0; font-size: 9pt;">Telepon/Fax: ${kopConfig.teleponFax} · Email: ${kopConfig.email}</p>
      </div>

      <!-- Document Title -->
      <div style="text-align: center; margin-bottom: 24px;">
        <h3 style="margin: 0; font-size: 13pt; text-transform: uppercase; text-decoration: underline; font-weight: bold;">
          ${docCatalog.label.split('. ')[1] || docCatalog.label}
        </h3>
        <p style="margin: 4px 0 0 0; font-size: 10pt; font-family: monospace;">
          Nomor: ${docType === 'BAPHP' ? project.nomorBAPHP : docType === 'BAST' ? (project.nomorBAST || '000.4.3/64514226/02-101') : '000.4.3/64514226/02-' + docType}
        </p>
      </div>

      <!-- Content Paragraphs -->
      <p style="text-align: justify; text-indent: 30px;">
        Pada hari ini, <strong>${formatTanggalIndonesia(project.tanggalBAPHP || project.tanggalSPK)}</strong>, kami yang bertanda tangan di bawah ini telah melaksanakan verifikasi, pemeriksaan fisik, dan administrasi keuangan untuk paket pekerjaan:
      </p>

      <!-- Table Details -->
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 10.5pt;">
        <tr>
          <td style="width: 25%; padding: 4px; font-weight: bold; vertical-align: top;">Nama Paket</td>
          <td style="width: 2%; padding: 4px; vertical-align: top;">:</td>
          <td style="padding: 4px; font-weight: bold;">${project.namaPaket}</td>
        </tr>
        <tr>
          <td style="padding: 4px; font-weight: bold; vertical-align: top;">Lokasi Sekolah</td>
          <td style="padding: 4px; vertical-align: top;">:</td>
          <td style="padding: 4px;">${project.lokasi} (${project.kabupatenKota})</td>
        </tr>
        <tr>
          <td style="padding: 4px; font-weight: bold; vertical-align: top;">Nomor & Tgl SPK</td>
          <td style="padding: 4px; vertical-align: top;">:</td>
          <td style="padding: 4px; font-family: monospace;">${project.nomorSPK} (${tglFormatted})</td>
        </tr>
        <tr>
          <td style="padding: 4px; font-weight: bold; vertical-align: top;">Nilai SPK (Kontrak)</td>
          <td style="padding: 4px; vertical-align: top;">:</td>
          <td style="padding: 4px; font-weight: bold;">${nilaiFormatted} (${terbilangRupiah(project.nilaiSPK)})</td>
        </tr>
        <tr>
          <td style="padding: 4px; font-weight: bold; vertical-align: top;">Penyedia / Rekanan</td>
          <td style="padding: 4px; vertical-align: top;">:</td>
          <td style="padding: 4px;"><strong>${project.penyedia.namaPerusahaan}</strong> (PJ: ${project.penyedia.namaDirektur})</td>
        </tr>
        <tr>
          <td style="padding: 4px; font-weight: bold; vertical-align: top;">Masa Pelaksanaan</td>
          <td style="padding: 4px; vertical-align: top;">:</td>
          <td style="padding: 4px;">${project.jangkaWaktuHari} Hari Kalender (${formatTanggalIndonesia(project.tanggalMulai)} s.d ${formatTanggalIndonesia(project.tanggalSelesai)})</td>
        </tr>
      </table>

      <p style="text-align: justify; text-indent: 30px;">
        Berdasarkan hasil pemeriksaan bersama di lokasi pekerjaan, seluruh spesifikasi teknis, volume, dan kualitas hasil pekerjaan dinyatakan <strong>100% LENGKAP & MEMENUHI SYARAT FORMAL LEGAL</strong> sesuai ketentuan Perpres No. 12 Tahun 2021 dan Pergub Tata Naskah Dinas.
      </p>

      <!-- Signatures Block -->
      <div style="margin-top: 40px; display: flex; justify-content: space-between; page-break-inside: avoid;">
        <div style="text-align: center; width: 45%;">
          <p style="margin: 0;">Penyedia Jasa / Rekanan</p>
          <p style="margin: 0; font-weight: bold;">${project.penyedia.namaPerusahaan}</p>
          <div style="height: 60px;"></div>
          <p style="margin: 0; font-weight: bold; text-decoration: underline;">${project.penyedia.namaDirektur}</p>
          <p style="margin: 0; font-size: 9pt;">${project.penyedia.jabatan || 'Direktur'}</p>
        </div>

        <div style="text-align: center; width: 45%;">
          <p style="margin: 0;">Pejabat Pembuat Komitmen (PPK)</p>
          <p style="margin: 0; font-weight: bold;">Bidang Pembinaan SMA/SMK</p>
          <div style="height: 60px;"></div>
          <p style="margin: 0; font-weight: bold; text-decoration: underline;">${project.ppk.nama}</p>
          <p style="margin: 0; font-size: 9pt;">NIP. ${project.ppk.nip}</p>
        </div>
      </div>
    </div>
  `;
}
