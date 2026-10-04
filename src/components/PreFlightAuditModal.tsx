import React, { useState } from 'react';
import { ProjectContract, VerificationIssue } from '../types';
import { validateProject } from '../utils/validator';
import { 
  ShieldCheck, 
  AlertTriangle, 
  XCircle, 
  CheckCircle2, 
  Info, 
  X, 
  Edit, 
  Scale, 
  FileCheck2, 
  Building2, 
  Calendar, 
  DollarSign, 
  ExternalLink 
} from 'lucide-react';

interface PreFlightAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectContract;
  onEditProject: (project: ProjectContract) => void;
  onProceedToPrint?: () => void;
}

export const PreFlightAuditModal: React.FC<PreFlightAuditModalProps> = ({
  isOpen,
  onClose,
  project,
  onEditProject,
  onProceedToPrint
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  if (!isOpen) return null;

  const result = validateProject(project);

  const errorCount = result.issues.filter(i => i.severity === 'error').length;
  const warningCount = result.issues.filter(i => i.severity === 'warning').length;
  const infoCount = result.issues.filter(i => i.severity === 'info').length;

  const filteredIssues = activeCategory === 'all'
    ? result.issues
    : result.issues.filter(i => i.category === activeCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl shrink-0 ${
              result.isValid 
                ? 'bg-emerald-100 text-emerald-700' 
                : errorCount > 0 
                ? 'bg-red-100 text-red-700' 
                : 'bg-amber-100 text-amber-700'
            }`}>
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <span>Pre-Flight Legal Guard</span>
                <span>·</span>
                <span className="text-slate-400">Standar LKPP & Permendagri 77/2020</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                Audit Kepatuhan Hukum & Integritas Berita Acara
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                Paket: <strong className="text-slate-700">{project.namaPaket}</strong> ({project.lokasi})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            title="Tutup (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Score & Health Summary Hero Strip */}
        <div className="p-4 sm:p-5 bg-white border-b border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Main Score Box */}
          <div className="sm:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block">
                Skor Kepatuhan Hukum
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-bold font-mono text-slate-900">
                  {result.score}%
                </span>
                <span className={`text-xs font-semibold ${
                  result.isValid ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  {result.isValid ? 'Aman untuk Kasda' : 'Perlu Penyesuaian'}
                </span>
              </div>
            </div>

            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              result.score >= 90 
                ? 'bg-emerald-100 text-emerald-700' 
                : result.score >= 70 
                ? 'bg-amber-100 text-amber-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          {/* Error & Warning Counters */}
          <div className="bg-red-50/60 border border-red-200 rounded-xl p-3 flex flex-col justify-center">
            <span className="text-[11px] font-semibold text-red-700 flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" />
              <span>Celah Kritis ({errorCount})</span>
            </span>
            <span className="text-xs text-red-600 mt-0.5">
              {errorCount === 0 ? 'Tidak ada celah fatal' : 'Wajib diperbaiki sebelum cetak'}
            </span>
          </div>

          <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3 flex flex-col justify-center">
            <span className="text-[11px] font-semibold text-amber-800 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Peringatan BPK ({warningCount})</span>
            </span>
            <span className="text-xs text-amber-700 mt-0.5">
              {warningCount === 0 ? 'Tertib administrasi' : 'Potensi catatan audit'}
            </span>
          </div>
        </div>

        {/* Category Segmented Control Tabs */}
        <div className="px-5 pt-3 border-b border-slate-200 bg-slate-50/40 flex items-center gap-1 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`pb-2.5 px-2.5 font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeCategory === 'all'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Semua Ulasan ({result.issues.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('kronologi')}
            className={`pb-2.5 px-2.5 font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeCategory === 'kronologi'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Kronologi Tanggal</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('pajak_keuangan')}
            className={`pb-2.5 px-2.5 font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeCategory === 'pajak_keuangan'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Nilai & Pajak</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('rekanan_rekening')}
            className={`pb-2.5 px-2.5 font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeCategory === 'rekanan_rekening'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Rekening Rekanan</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('pejabat_legalitas')}
            className={`pb-2.5 px-2.5 font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeCategory === 'pejabat_legalitas'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Pejabat Pengadaan</span>
          </button>
        </div>

        {/* Scrollable Issue List */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {filteredIssues.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">
                Semua Klausul pada Kategori Ini Telah Memenuhi Standar Hukum
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Tidak terdeteksi potensi temuan audit BPK atau pelanggaran tata kelola keuangan daerah pada kategori ini.
              </p>
            </div>
          ) : (
            filteredIssues.map((issue) => (
              <div
                key={issue.id}
                className={`p-4 rounded-xl border text-xs space-y-2 transition-colors ${
                  issue.severity === 'error'
                    ? 'bg-red-50/40 border-red-200'
                    : issue.severity === 'warning'
                    ? 'bg-amber-50/40 border-amber-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    {issue.severity === 'error' ? (
                      <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    ) : issue.severity === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    ) : (
                      <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {issue.message}
                      </h4>
                      <p className="text-slate-600 mt-1 leading-relaxed">
                        {issue.description}
                      </p>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                    issue.severity === 'error'
                      ? 'bg-red-100 text-red-800'
                      : issue.severity === 'warning'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {issue.severity === 'error' ? 'Kritis' : issue.severity === 'warning' ? 'Perhatian' : 'Info'}
                  </span>
                </div>

                {/* Legal Basis Callout */}
                {issue.legalBasis && (
                  <div className="mt-2 p-2 bg-white/80 border border-slate-200 rounded-lg text-[11px] text-slate-700 flex items-baseline gap-1.5">
                    <span className="font-semibold text-slate-900 shrink-0">Dasar Regulasi:</span>
                    <span className="italic text-slate-600">{issue.legalBasis}</span>
                  </div>
                )}

                {/* Actionable Advice */}
                {issue.recommendation && (
                  <div className="text-[11px] text-slate-600 pl-6 flex items-baseline gap-1.5">
                    <span className="font-semibold text-blue-700 shrink-0">Saran Mitigasi:</span>
                    <span>{issue.recommendation}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 text-center sm:text-left">
            <span>Standar audit: </span>
            <strong className="text-slate-700">Perpres 12/2021, PP 12/2019, Permendagri 77/2020</strong>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEditProject(project);
              }}
              className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Perbaiki Data Kontrak</span>
            </button>

            {onProceedToPrint && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onProceedToPrint();
                }}
                className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Lanjut Cetak Dokumen</span>
              </button>
            )}

            {!onProceedToPrint && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Tutup
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
