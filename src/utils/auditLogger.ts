import { ProjectContract, AuditLog, AuditChangeItem } from '../types';
import { db } from '../lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';

/**
 * Otomatis mendeteksi perbedaan antara versi kontrak lama dan baru
 */
export function detectContractChanges(
  oldProj: ProjectContract, 
  newProj: ProjectContract
): AuditChangeItem[] {
  const changes: AuditChangeItem[] = [];

  const fieldLabels: Record<string, string> = {
    namaPaket: 'Nama Paket Pekerjaan',
    nilaiSPK: 'Nilai Kontrak (SPK)',
    nomorSPK: 'Nomor SPK',
    tanggalSPK: 'Tanggal SPK',
    jangkaWaktuHari: 'Jangka Waktu Pelaksanaan',
    tanggalMulai: 'Tanggal Mulai',
    tanggalSelesai: 'Tanggal Selesai Kontrak',
    nomorBAPHP: 'Nomor Surat BAPHP',
    tanggalBAPHP: 'Tanggal BAPHP',
    nomorBAST: 'Nomor Surat BAST',
    tanggalBAST: 'Tanggal BAST',
    nomorBAST_PA: 'Nomor BAST PPK-PA',
    tanggalBAST_PA: 'Tanggal BAST PPK-PA',
    nomorBAP: 'Nomor Surat BAP',
    tanggalBAP: 'Tanggal BAP',
    statusVerifikasi: 'Status Verifikasi Berkas',
    lokasi: 'Lokasi Sekolah'
  };

  Object.keys(fieldLabels).forEach((key) => {
    const k = key as keyof ProjectContract;
    if (oldProj[k] !== newProj[k] && newProj[k] !== undefined) {
      changes.push({
        field: key,
        fieldLabel: fieldLabels[key] || key,
        oldValue: String(oldProj[k] ?? '-'),
        newValue: String(newProj[k] ?? '-')
      });
    }
  });

  return changes;
}

/**
 * Menyimpan catatan audit baru ke Google Cloud Firestore
 */
export async function recordAuditLog(
  log: Omit<AuditLog, 'id' | 'timestamp'>
): Promise<AuditLog> {
  const fullLog: AuditLog = {
    ...log,
    id: 'audit-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    timestamp: new Date().toISOString()
  };

  // Simpan ke Firestore subcollection
  try {
    const logRef = doc(db, 'projects', fullLog.projectId, 'audit_logs', fullLog.id);
    await setDoc(logRef, fullLog);
  } catch (err) {
    console.warn('Gagal menyimpan audit log ke Firestore, simpan ke cache lokal:', err);
  }

  // Backup ke LocalStorage
  const localKey = `si_baphp_audit_${fullLog.projectId}`;
  const existingStr = localStorage.getItem(localKey);
  const existing: AuditLog[] = existingStr ? JSON.parse(existingStr) : [];
  localStorage.setItem(localKey, JSON.stringify([fullLog, ...existing]));

  return fullLog;
}

/**
 * Mendapatkan riwayat audit awal untuk data contoh
 */
export function getInitialAuditHistory(project: ProjectContract): AuditLog[] {
  const localKey = `si_baphp_audit_${project.id}`;
  const saved = localStorage.getItem(localKey);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      console.warn('Error parsing local audit history:', e);
    }
  }

  // Generate realistic initial audit timeline for this project
  const initialLogs: AuditLog[] = [
    {
      id: 'audit-init-4',
      projectId: project.id,
      actionType: 'VERIFICATION_AUDIT',
      title: 'Pengesahan Status Dokumen BAPHP & Kelengkapan Berkas',
      description: 'Seluruh parameter tanggal, kesesuaian terbilang rupiah, nomor SPK, dan NIP pejabat dinyatakan memenuhi syarat formal.',
      authorName: project.ppk.nama,
      authorRole: 'PPK (Pejabat Pembuat Komitmen)',
      authorEmail: 'hasanuddin.ppk@kaltaraprov.go.id',
      timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      previousStatus: 'perlu_tinjauan',
      newStatus: 'diverifikasi',
      version: 3,
      changes: [
        { field: 'statusVerifikasi', fieldLabel: 'Status Verifikasi', oldValue: 'perlu_tinjauan', newValue: 'diverifikasi' }
      ]
    },
    {
      id: 'audit-init-3',
      projectId: project.id,
      actionType: 'DOCUMENT_EDIT',
      title: 'Pemeriksaan Bersama & Penomoran BAPHP (2 Halaman)',
      description: 'Penomoran surat register BAPHP 000.4.3/64514226/02-100 dan BASTP 000.4.3/64514226/02-101 diterbitkan dari buku agenda dinas.',
      authorName: project.pptk.nama,
      authorRole: 'PPTK (Pejabat Pelaksana Teknis)',
      authorEmail: 'bayu.pptk@kaltaraprov.go.id',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      version: 2,
      changes: [
        { field: 'nomorBAPHP', fieldLabel: 'Nomor BAPHP', oldValue: 'Draf', newValue: project.nomorBAPHP },
        { field: 'nomorBAST', fieldLabel: 'Nomor BAST', oldValue: 'Draf', newValue: project.nomorBAST || '-' }
      ]
    },
    {
      id: 'audit-init-2',
      projectId: project.id,
      actionType: 'INSPECTION_NOTE',
      title: 'Opname Prestasi Riil Lapangan 100%',
      description: `Pemeriksaan fisik dan dokumen teknis bersama pihak rekanan ${project.penyedia.namaPerusahaan} di lokasi ${project.lokasi} telah tuntas tanpa cacat.`,
      authorName: project.pptk.nama,
      authorRole: 'PPTK (Teknis)',
      authorEmail: 'bayu.pptk@kaltaraprov.go.id',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      version: 1
    },
    {
      id: 'audit-init-1',
      projectId: project.id,
      actionType: 'INITIAL_CREATION',
      title: 'Pendaftaran Kontrak & SPK Awal Proyek',
      description: `Paket pekerjaan ${project.namaPaket} dengan nilai Rp ${new Intl.NumberFormat('id-ID').format(project.nilaiSPK)} didaftarkan ke sistem.`,
      authorName: 'Staf Administrasi Pengadaan',
      authorRole: 'Operator Bidang SMA/SMK',
      authorEmail: 'operator.dikbud@kaltaraprov.go.id',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      previousStatus: '',
      newStatus: 'draf',
      version: 1
    }
  ];

  localStorage.setItem(localKey, JSON.stringify(initialLogs));
  return initialLogs;
}
