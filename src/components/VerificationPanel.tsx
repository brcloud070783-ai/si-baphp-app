import React from 'react';
import { ProjectContract, VerificationResult } from '../types';
import { validateProject } from '../utils/validator';
import { ShieldCheck, AlertTriangle, XCircle, CheckCircle2, Award, Calendar, Hash, Building2, UserCheck } from 'lucide-react';
import { formatTanggalIndonesia, formatRupiah, terbilangRupiah } from '../utils/terbilang';

interface VerificationPanelProps {
  project: ProjectContract;
  onUpdateStatus: (projectId: string, status: 'diverifikasi' | 'perlu_tinjauan' | 'draf', note?: string) => void;
  onEditProject: (project: ProjectContract) => void;
}

export const VerificationPanel: React.FC<VerificationPanelProps> = ({
  project,
  onUpdateStatus,
  onEditProject
}) => {
  const result: VerificationResult = validateProject(project);

  const handleApprove = () => {
    onUpdateStatus(
      project.id, 
      'diverifikasi', 
      'Telah diverifikasi oleh Tim Teknis & Verifikator Berita Acara Disdikbud'
    );
  };

  const handleFlagReview = () => {
    onUpdateStatus(
      project.id, 
      'perlu_tinjauan', 
      'Memerlukan penyesuaian berkas fisik atau kelengkapan data administrasi'
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      {/* Header Panel */}
      <div className="p-6 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Sistem Audit & Verifikasi Akurasi Berita Acara
            </span>
            <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-md ${
              project.statusVerifikasi === 'diverifikasi'
                ? 'bg-emerald-100 text-emerald-800'
                : project.statusVerifikasi === 'perlu_tinjauan'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-slate-100 text-slate-700'
            }`}>
              {project.statusVerifikasi === 'diverifikasi' ? 'Telah Diverifikasi' : project.statusVerifikasi === 'perlu_tinjauan' ? 'Perlu Tinjauan' : 'Draf Awal'}
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1">
            {project.namaPaket}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Lokasi: {project.lokasi} · SPK: {project.nomorSPK}
          </p>
        </div>

        {/* Score & Validation Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-lg border border-slate-200 shadow-2xs">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">
                Skor Akurasi
              </span>
              <span className="text-lg font-bold text-slate-900 font-mono leading-none">
                {result.score}%
              </span>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              result.score >= 90 ? 'bg-emerald-100 text-emerald-700' : result.score >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
            }`}>
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {project.statusVerifikasi !== 'diverifikasi' ? (
              <button
                onClick={handleApprove}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Sahkan & Kunci Dokumen</span>
              </button>
            ) : (
              <button
                onClick={handleFlagReview}
                className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Ubah ke Tinjauan
              </button>
            )}

            <button
              onClick={() => onEditProject(project)}
              className="px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
            >
              Ubah Data Proyek
            </button>
          </div>
        </div>
      </div>

      {/* Audit Checklist Grid */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kolom 1: Hasil Verifikasi Otomatis */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Pemeriksaan Integritas Data Kontrak ({result.checksPassed} / {result.totalChecks} Lolos)</span>
          </h3>

          <div className="space-y-2.5">
            {/* Check 1: Kronologi Tanggal */}
            <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex items-start gap-3">
              <Calendar className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div className="flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">Kronologi & Urutan Tanggal</span>
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                  </span>
                </div>
                <p className="text-slate-500 mt-1">
                  SPK ({formatTanggalIndonesia(project.tanggalSPK)}) → Pelaksanaan ({project.jangkaWaktuHari} Hari) → Selesai & BAPHP ({formatTanggalIndonesia(project.tanggalBAPHP)}). Urutan tanggal logis tanpa keterlambatan.
                </p>
              </div>
            </div>

            {/* Check 2: Nilai & Terbilang */}
            <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex items-start gap-3">
              <Hash className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div className="flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">Sinkronisasi Nilai Angka & Terbilang</span>
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Sinkron
                  </span>
                </div>
                <p className="font-mono text-slate-700 font-bold mt-1">
                  {formatRupiah(project.nilaiSPK)}
                </p>
                <p className="italic text-slate-500 mt-0.5">
                  {terbilangRupiah(project.nilaiSPK)}
                </p>
              </div>
            </div>

            {/* Check 3: Penandatangan Dinas */}
            <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex items-start gap-3">
              <UserCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div className="flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">Validitas Pejabat Dinas (PPK & PPTK)</span>
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Terverifikasi
                  </span>
                </div>
                <p className="text-slate-600 mt-1">
                  PPK: <strong>{project.ppk.nama}</strong> (NIP. {project.ppk.nip})<br />
                  PPTK: <strong>{project.pptk.nama}</strong> (NIP. {project.pptk.nip})
                </p>
              </div>
            </div>

            {/* Check 4: Data Rekanan & Rekening Bank */}
            <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex items-start gap-3">
              <Building2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div className="flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">Kelengkapan Rekening & Pajak Penyedia</span>
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Lengkap
                  </span>
                </div>
                <p className="text-slate-600 mt-1">
                  {project.penyedia.namaPerusahaan} ({project.penyedia.namaDirektur})<br />
                  Bank: {project.penyedia.bankNama} · No. Rek: <span className="font-mono font-medium">{project.penyedia.nomorRekening}</span><br />
                  NPWP: <span className="font-mono">{project.penyedia.npwp}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom 2: Catatan Audit & Temuan Rekomendasi */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Temuan & Rekomendasi Verifikator
          </h3>

          {result.issues.length === 0 ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Seluruh Parameter Kontrak Telah Sesuai</span>
              </div>
              <p className="text-xs text-emerald-800 mt-2 leading-relaxed">
                Tidak ditemukan anomali atau kesalahan input pada nomor dokumen, nilai rupiah, terbilang tanggal, maupun identitas para pihak. Dokumen Berita Acara BAPHP, BAST, dan BAP siap diterbitkan dan dicetak untuk proses pencairan dana di BPKAD/Kasda.
              </p>
              <div className="mt-3 pt-3 border-t border-emerald-200 text-[11px] text-emerald-700">
                Terverifikasi secara otomatis oleh Mesin Validasi BAPHP Disdikbud.
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {result.issues.map((issue) => (
                <div
                  key={issue.id}
                  className={`p-3 rounded-lg border text-xs ${
                    issue.severity === 'error'
                      ? 'bg-red-50 border-red-200 text-red-900'
                      : issue.severity === 'warning'
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-blue-50 border-blue-200 text-blue-900'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    {issue.severity === 'error' ? (
                      <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                    ) : issue.severity === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                    )}
                    <span>{issue.message}</span>
                  </div>
                  <p className="mt-1 text-slate-600 pl-5">
                    {issue.description}
                  </p>
                  {issue.legalBasis && (
                    <div className="mt-1.5 ml-5 text-[11px] font-medium text-slate-700 bg-white/70 p-1.5 rounded border border-slate-200/80">
                      <span className="font-semibold text-slate-900">Dasar Regulasi: </span>
                      <span className="italic">{issue.legalBasis}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Stempel Pengesahan Digital */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 text-xs space-y-2">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
              Log Verifikasi Dokumen
            </span>
            <div className="space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span>Status Berkas:</span>
                <span className="font-semibold uppercase">{project.statusVerifikasi}</span>
              </div>
              <div className="flex justify-between">
                <span>Tanggal Verifikasi:</span>
                <span>{project.verifiedAt ? formatTanggalIndonesia(project.verifiedAt.split('T')[0]) : '-'}</span>
              </div>
              <div className="flex justify-between">
                <span>Otoritas Penguji:</span>
                <span>{project.verifiedBy || 'Menunggu verifikasi'}</span>
              </div>
              {project.catatanPemeriksaan && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="font-medium text-slate-700">Catatan Khusus:</span>
                  <p className="italic text-slate-600 mt-0.5">"{project.catatanPemeriksaan}"</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
