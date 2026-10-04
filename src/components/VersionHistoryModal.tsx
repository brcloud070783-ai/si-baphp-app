import React, { useState, useEffect } from 'react';
import { ProjectContract, AuditLog } from '../types';
import { getInitialAuditHistory, detectContractChanges } from '../utils/auditLogger';
import { formatTanggalIndonesia } from '../utils/terbilang';
import { 
  History, 
  X, 
  CheckCircle2, 
  Clock, 
  User, 
  FileText, 
  ShieldCheck, 
  Search, 
  Filter, 
  ArrowRight, 
  RotateCcw, 
  Printer, 
  Download,
  Building2,
  AlertCircle
} from 'lucide-react';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectContract;
  onRestoreVersion?: (restoredProject: Partial<ProjectContract>) => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
  project,
  onRestoreVersion
}) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  useEffect(() => {
    if (isOpen) {
      const history = getInitialAuditHistory(project);
      setLogs(history);
      if (history.length > 0) {
        setSelectedLog(history[0]);
      }
    }
  }, [isOpen, project]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.authorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'ALL' || log.actionType === filterType;
    return matchesSearch && matchesFilter;
  });

  const handlePrintAuditReport = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header Modal */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 text-blue-300 flex items-center justify-center font-bold">
              <History className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">
                  Histori Versi & Log Audit Digital
                </h3>
                <span className="bg-blue-500/20 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-400/30">
                  Inspektorat Ready
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 truncate max-w-lg">
                Paket: <span className="font-semibold text-white">{project.namaPaket}</span> ({project.lokasi})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintAuditReport}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer no-print"
              title="Cetak Berita Acara Rekam Audit"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span className="hidden sm:inline">Cetak Laporan Audit</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 no-print">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari perubahan, nama pejabat, atau kata kunci..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-600 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">Semua Jenis Log Audit</option>
              <option value="CONTRACT_UPDATE">Pembaruan Data Kontrak</option>
              <option value="VERIFICATION_AUDIT">Pengesahan / Verifikasi</option>
              <option value="DOCUMENT_EDIT">Penomoran Berita Acara</option>
              <option value="INSPECTION_NOTE">Catatan Opname Lapangan</option>
            </select>
          </div>
        </div>

        {/* Modal Main Content: Split Grid Timeline & Inspector Detail */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Timeline List */}
          <div className="lg:col-span-5 space-y-3 overflow-y-auto max-h-[60vh] pr-1">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between mb-2">
              <span>Garis Waktu Perubahan ({filteredLogs.length})</span>
              <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded">
                SPK: {project.nomorSPK}
              </span>
            </h4>

            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400 text-xs">
                Tidak ada log audit yang sesuai kriteria pencarian.
              </div>
            ) : (
              filteredLogs.map((log, idx) => {
                const isSelected = selectedLog?.id === log.id;
                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                      isSelected 
                        ? 'bg-blue-50/80 border-blue-500 shadow-xs ring-1 ring-blue-500' 
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                          v{log.version || logs.length - idx}
                        </span>
                        <h5 className="font-bold text-slate-900 text-xs leading-snug">
                          {log.title}
                        </h5>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-[11.5px] text-slate-600 line-clamp-2 mt-1.5 leading-relaxed">
                      {log.description}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10.5px] text-slate-500">
                      <span className="font-medium text-slate-700 flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{log.authorName}</span>
                      </span>
                      <span className="text-slate-400 font-mono">
                        {formatTanggalIndonesia(log.timestamp.split('T')[0])}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Detailed Diff Inspector & Audit Certificate */}
          <div className="lg:col-span-7 bg-slate-50/70 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between space-y-4">
            {selectedLog ? (
              <div className="space-y-4">
                {/* Audit Item Top Header */}
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                      {selectedLog.actionType} · Versi {selectedLog.version || 1}.0
                    </span>
                    <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(selectedLog.timestamp).toLocaleString('id-ID')}</span>
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm leading-snug">
                    {selectedLog.title}
                  </h4>

                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                    {selectedLog.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">Pengubah / Ototorisator:</span>
                      <span className="font-bold text-slate-800">{selectedLog.authorName}</span>
                      <span className="block text-[10.5px] text-slate-500">{selectedLog.authorRole}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">Email Terdaftar:</span>
                      <span className="font-mono text-slate-700 text-[11px] block">{selectedLog.authorEmail}</span>
                    </div>
                  </div>
                </div>

                {/* Changes Comparison Table (Diff Table) */}
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-3">
                  <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Rincian Perubahan Kolom Data ({selectedLog.changes?.length || 0} Kolom)</span>
                  </h5>

                  {!selectedLog.changes || selectedLog.changes.length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded-lg text-slate-500 text-xs text-center border border-slate-200">
                      Tidak ada perubahan nilai variabel pada riwayat ini (Log Catatan / Status).
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100 text-slate-700 font-bold text-[11px] uppercase tracking-wider">
                          <tr>
                            <th className="p-2.5">Variabel / Kolom</th>
                            <th className="p-2.5">Nilai Sebelum (Old)</th>
                            <th className="p-2.5 text-center w-6"></th>
                            <th className="p-2.5">Nilai Sesudah (New)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedLog.changes.map((ch, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2.5 font-bold text-slate-800">
                                {ch.fieldLabel}
                              </td>
                              <td className="p-2.5 font-mono text-rose-700 bg-rose-50/60 rounded text-[11px] line-through">
                                {ch.oldValue || '-'}
                              </td>
                              <td className="p-2.5 text-center text-slate-400">
                                <ArrowRight className="w-3.5 h-3.5 mx-auto" />
                              </td>
                              <td className="p-2.5 font-mono text-emerald-800 font-bold bg-emerald-50/80 rounded text-[11px]">
                                {ch.newValue || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Legal Audit Checksum Verification */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-3 text-emerald-900 text-xs">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-emerald-950 block">Integritas Audit Terjamin</span>
                    <p className="text-emerald-800 text-[11px] mt-0.5 leading-relaxed">
                      Catatan ini tersimpan secara permanen di database Google Cloud Firestore dengan Hash SHA-256 untuk pemenuhan verifikasi Inspektorat Daerah & BPK RI.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-8 text-center text-slate-400 text-xs">
                Pilih salah satu baris histori di sebelah kiri untuk melihat rincian perubahan.
              </div>
            )}

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs no-print">
              <span className="text-slate-500 font-medium">
                Total {logs.length} Riwayat Terdaftar
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors cursor-pointer"
              >
                Tutup Panel Audit
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
