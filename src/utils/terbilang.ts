/**
 * Konversi angka ke ejaan terbilang Bahasa Indonesia resmi
 */
export function terbilang(bilangan: number): string {
  const angka = Math.floor(Math.abs(bilangan));
  
  if (angka === 0) return 'Nol';

  const satuan = [
    '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 
    'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'
  ];

  let hasil = '';

  if (angka < 12) {
    hasil = satuan[angka];
  } else if (angka < 20) {
    hasil = terbilang(angka - 10) + ' Belas';
  } else if (angka < 100) {
    hasil = terbilang(Math.floor(angka / 10)) + ' Puluh ' + terbilang(angka % 10);
  } else if (angka < 200) {
    hasil = 'Seratus ' + terbilang(angka - 100);
  } else if (angka < 1000) {
    hasil = terbilang(Math.floor(angka / 100)) + ' Ratus ' + terbilang(angka % 100);
  } else if (angka < 2000) {
    hasil = 'Seribu ' + terbilang(angka - 1000);
  } else if (angka < 1000000) {
    hasil = terbilang(Math.floor(angka / 1000)) + ' Ribu ' + terbilang(angka % 1000);
  } else if (angka < 1000000000) {
    hasil = terbilang(Math.floor(angka / 1000000)) + ' Juta ' + terbilang(angka % 1000000);
  } else if (angka < 1000000000000) {
    hasil = terbilang(Math.floor(angka / 1000000000)) + ' Miliar ' + terbilang(angka % 1000000000);
  } else if (angka < 1000000000000000) {
    hasil = terbilang(Math.floor(angka / 1000000000000)) + ' Triliun ' + terbilang(angka % 1000000000000);
  }

  return hasil.replace(/\s+/g, ' ').trim();
}

/**
 * Format mata uang Rupiah: Rp. 99.911.544
 */
export function formatRupiah(nilai: number): string {
  return 'Rp. ' + new Intl.NumberFormat('id-ID').format(nilai);
}

/**
 * Terbilang Rupiah lengkap dengan tanda bintang seperti pada SPK/BAP:
 * ***Sembilan Puluh Sembilan Juta Sembilan Ratus Sebelas Ribu Lima Ratus Empat Puluh Empat Rupiah***
 */
export function terbilangRupiah(nilai: number): string {
  if (!nilai && nilai !== 0) return '';
  return `***${terbilang(nilai)} Rupiah***`;
}

/**
 * Ejaan hari dalam Bahasa Indonesia
 */
const NAMA_HARI = [
  'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
];

/**
 * Ejaan bulan dalam Bahasa Indonesia
 */
const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Format tanggal standar Indonesia: 12 Juni 2026
 */
export function formatTanggalIndonesia(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  if (isNaN(date.getTime())) return dateStr;
  
  const day = date.getDate();
  const month = NAMA_BULAN[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Menghasilkan komponen terbilang tanggal resmi untuk Berita Acara:
 * Hari: "Jumat"
 * Tanggal: "Dua Belas"
 * Bulan: "Juni"
 * Tahun: "Dua Ribu Dua Puluh Enam"
 */
export function getTerbilangTanggal(dateStr: string) {
  if (!dateStr) {
    return {
      hari: '',
      tanggal: '',
      bulan: '',
      tahun: '',
      paragrafPembuka: ''
    };
  }

  const date = new Date(dateStr + 'T00:00:00');
  if (isNaN(date.getTime())) {
    return {
      hari: '',
      tanggal: '',
      bulan: '',
      tahun: '',
      paragrafPembuka: ''
    };
  }

  const hari = NAMA_HARI[date.getDay()];
  const dayNum = date.getDate();
  const tanggal = terbilang(dayNum);
  const bulan = NAMA_BULAN[date.getMonth()];
  const yearNum = date.getFullYear();
  const tahun = terbilang(yearNum);

  const paragrafPembuka = `Pada hari ini ${hari} tanggal ${tanggal} bulan ${bulan} tahun ${tahun}, kami yang bertanda tangan di bawah ini :`;

  return {
    hari,
    tanggal,
    bulan,
    tahun,
    paragrafPembuka
  };
}

/**
 * Format jangka waktu: e.g. 30 (Tiga Puluh) Hari Kalender
 */
export function formatJangkaWaktu(hari: number, tipe: string = 'Hari Kalender'): string {
  return `${hari} (${terbilang(hari)}) ${tipe}`;
}
