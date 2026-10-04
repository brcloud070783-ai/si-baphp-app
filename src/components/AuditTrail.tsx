import React, { useState, useEffect } from 'react';
import { ProjectContract, AuditLog } from '../types';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { getInitialAuditHistory, recordAuditLog } from '../utils/auditLogger';
import { 
  History, 
  ShieldCheck, 
  FileEdit, 
  CheckCircle2, 
  Clock, 
  User, 
  ArrowRight, 
  Plus, 
  Filter, 
  MessageSquare, 
  BadgeCheck, 
  Calendar,
  CloudCheck,
  ChevronDown,
  ChevronUp,
  Send,
  X,
  FileText
} from 'lucide-react';
import { formatTanggalIndonesia } from '../utils/terbilang';

interface AuditTrailProps {
  project: ProjectContract;
  currentUser?: { displayName?: string | null; email?: string | null } | null;
}

export const AuditTrail: React.FC<AuditTrailProps> = ({ project, currentUser }) => {
  const [logs, setLogs] = useState<AuditLog[]>(() => getInitialAuditHistory(project));
  const [filterType, setFilterType] = useState<string>('all');
  const [showAddNote, setShowAddNote] = useState<boolean>(false);
  const [noteTitle, setNoteTitle] = useState<string>('');
  const [noteDescription, setNoteDescription] = useState<string>('');
  const [authorRole, setAuthorRole] = useState<'PPTK' | 'PPK' | 'Verifikator Keuangan' | 'Tim Teknis'>('PPTK');
  const [expandedLogIds, setExpandedLogIds] = useState<Record<string, boolean>>({});

  // Realtime listener from Google Cloud Firestore subcollection
  useEffect(() => {
    try {
      const logsRef = collection(db, 'projects', project.id, 'audit_logs');
      const q = query(logsRef, orderBy('timestamp', 'desc'));
      const unsub = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const items: AuditLog[] = [];
          snapshot.forEach((doc) => {
            items.push(doc.data() as AuditLog);
          });
          setLogs(items);
        } else {
          // If empty in Firestore, use local initial history
          setLogs(getInitialAuditHistory(project));
        }
      }, (err) => {
        console.warn('Audit logs realtime sync fallback to local:', err);
        setLogs(getInitialAuditHistory(project));
      });

      return () => unsub();
    } catch (e) {
      setLogs(getInitialAuditHistory(project));
    }
  }, [project.id]);

  const toggleExpand = (id: string) => {
    setExpandedLogIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddManualNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle || !noteDescription) return;

    const authorName = currentUser?.displayName || (
      authorRole === 'PPK' ? project.ppk.nama : project.pptk.nama
    );
    const authorEmail = currentUser?.email || (
      authorRole === 'PPK' ? 'hasanuddin.ppk@kaltaraprov.go.id' : 'bayu.pptk@kaltaraprov.go.id'
    );

    const newLog = await recordAuditLog({
      projectId: project.id,
      actionType: 'INSPECTION_NOTE',
      title: noteTitle,
      description: noteDescription,
      authorName,
      authorEmail,
      authorRole,
      version: (logs[0]?.version || 1) + 1
    });

    setLogs(prev => [newLog, ...prev]);
    setNoteTitle('');
    setNoteDescription('');
    setShowAddNote(false);
  };

  const formatLogTimestamp = (isoStr: string) => {
    if (!isoStr) return '-';
    const date = new Date(isoStr);
    if (isNaN(date.getTime())) return isoStr;

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const dateStr = formatTanggalIndonesia(isoStr.split('T')[0]);

    return `${dateStr} pukul ${hours}:${minutes}:${seconds} WITA`;
  };

  const getRelativeTime = (isoStr: string) => {
    const diffMs = Date.now() - new Date(isoStr).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} jam lalu`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} hari lalu`;
  };

  const filteredLogs = logs.filter(l => {
    if (filterType === 'all') return true;
    if (filterType === 'status') return l.actionType === 'STATUS_CHANGE' || l.actionType === 'VERIFICATION_AUDIT';
    if (filterType === 'contract') return l.actionType === 'CONTRACT_UPDATE' || l.actionType === 'DOCUMENT_EDIT';
    if (filterType === 'notes') return l.actionType === 'INSPECTION_NOTE';
    return true;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
      {/* Header Audit Trail */}
      <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">
              Audit Trail & Riwayat Jejak Rekam Dokumen
            </h3>
            <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
              {logs.length} Perubahan Tercatat
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Merekam secara kronologis setiap perubahan status verifikasi, revisi nomor SPK/BAPHP, dan catatan paraf pemeriksaan di Google Cloud.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowAddNote(!showAddNote)}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Catatan Pemeriksaan</span>
          </button>
        </div>
      </div>

      {/* Form Tambah Catatan Pemeriksaan Lapangan */}
      {showAddNote && (
        <form onSubmit={handleAddManualNote} className="p-4 bg-blue-50/60 border-b border-blue-100 text-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-blue-900 text-xs flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span>Bubuhkan Catatan Pemeriksaan / Berita Acara Lapangan</span>
            </span>
            <button
              type="button"
              onClick={() => setShowAddNote(false)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">
                Judul Catatan / Kegiatan Pemeriksaan *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Pemeriksaan Mutu Beton dan Volume Siring SMAN 5"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Peran Penguji *
              </label>
              <select
                value={authorRole}
                onChange={(e) => setAuthorRole(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="PPTK">PPTK (Pejabat Pelaksana Teknis)</option>
                <option value="PPK">PPK (Pejabat Pembuat Komitmen)</option>
                <option value="Verifikator Keuangan">Verifikator Keuangan</option>
                <option value="Tim Teknis">Tim Teknis Lapangan</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="font-semibold text-slate-700 block mb-1">
                Uraian Hasil Pemeriksaan / Catatan Rekomendasi *
              </label>
              <textarea
                required
                rows={2}
                placeholder="Tuliskan uraian hasil pemeriksaan bersama konsultan/rekanan di lokasi..."
                value={noteDescription}
                onChange={(e) => setNoteDescription(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddNote(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 shadow-2xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Simpan Catatan ke Audit Trail</span>
            </button>
          </div>
        </form>
      )}

      {/* Filter Bar */}
      <div className="px-5 py-2.5 bg-slate-50/50 border-b border-slate-100 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-slate-400 font-medium flex items-center gap-1 shrink-0">
          <Filter className="w-3.5 h-3.5" /> Filter Log:
        </span>
        <button
          onClick={() => setFilterType('all')}
          className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer shrink-0 ${
            filterType === 'all' ? 'bg-white font-bold text-blue-700 shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Semua Riwayat ({logs.length})
        </button>
        <button
          onClick={() => setFilterType('status')}
          className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer shrink-0 ${
            filterType === 'status' ? 'bg-white font-bold text-blue-700 shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Status & Pengesahan
        </button>
        <button
          onClick={() => setFilterType('contract')}
          className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer shrink-0 ${
            filterType === 'contract' ? 'bg-white font-bold text-blue-700 shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Perubahan Data Kontrak
        </button>
        <button
          onClick={() => setFilterType('notes')}
          className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer shrink-0 ${
            filterType === 'notes' ? 'bg-white font-bold text-blue-700 shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Catatan Pemeriksaan
        </button>
      </div>

      {/* Chronological Timeline Container */}
      <div className="p-5 sm:p-6">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            Belum ada catatan riwayat audit pada kategori ini.
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {filteredLogs.map((log, idx) => {
              const isExpanded = expandedLogIds[log.id];
              const hasChanges = log.changes && log.changes.length > 0;

              return (
                <div key={log.id} className="relative group">
                  {/* Timeline Node Icon */}
                  <div className={`absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white shadow-2xs ${
                    log.actionType === 'VERIFICATION_AUDIT' || log.newStatus === 'diverifikasi'
                      ? 'bg-emerald-600 ring-4 ring-emerald-50'
                      : log.actionType === 'STATUS_CHANGE'
                      ? 'bg-amber-600 ring-4 ring-amber-50'
                      : log.actionType === 'INSPECTION_NOTE'
                      ? 'bg-indigo-600 ring-4 ring-indigo-50'
                      : log.actionType === 'INITIAL_CREATION'
                      ? 'bg-slate-600 ring-4 ring-slate-100'
                      : 'bg-blue-600 ring-4 ring-blue-50'
                  }`}>
                    {log.actionType === 'VERIFICATION_AUDIT' || log.newStatus === 'diverifikasi' ? (
                      <BadgeCheck className="w-3.5 h-3.5" />
                    ) : log.actionType === 'INSPECTION_NOTE' ? (
                      <MessageSquare className="w-3 h-3" />
                    ) : log.actionType === 'INITIAL_CREATION' ? (
                      <FileText className="w-3 h-3" />
                    ) : (
                      <FileEdit className="w-3 h-3" />
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200/90 rounded-xl p-4 transition-all space-y-2 text-xs">
                    {/* Header bar of log */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          log.actionType === 'VERIFICATION_AUDIT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.actionType === 'STATUS_CHANGE'
                            ? 'bg-amber-100 text-amber-800'
                            : log.actionType === 'INSPECTION_NOTE'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {log.actionType === 'VERIFICATION_AUDIT' && 'Pengesahan Verifikasi'}
                          {log.actionType === 'STATUS_CHANGE' && 'Perubahan Status'}
                          {log.actionType === 'CONTRACT_UPDATE' && 'Pembaruan Kontrak'}
                          {log.actionType === 'DOCUMENT_EDIT' && 'Penerbitan Dokumen'}
                          {log.actionType === 'INSPECTION_NOTE' && 'Catatan Pemeriksaan'}
                          {log.actionType === 'INITIAL_CREATION' && 'Draf Awal'}
                        </span>

                        <span className="font-bold text-slate-900 text-sm">
                          {log.title}
                        </span>

                        {log.version && (
                          <span className="text-[10px] font-mono text-slate-400">
                            v{log.version}.0
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span title={log.timestamp}>{getRelativeTime(log.timestamp)}</span>
                      </div>
                    </div>

                    {/* Author & Timestamp Info */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {log.authorName}
                      </span>
                      {log.authorRole && (
                        <>
                          <span>·</span>
                          <span className="text-slate-500 font-medium">
                            {log.authorRole}
                          </span>
                        </>
                      )}
                      <span>·</span>
                      <span className="text-slate-400">
                        {formatLogTimestamp(log.timestamp)}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-slate-700 leading-relaxed pt-0.5">
                      {log.description}
                    </p>

                    {/* Status Transition Badges if applicable */}
                    {log.previousStatus && log.newStatus && (
                      <div className="pt-2 flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 font-medium">Transisi Status:</span>
                        <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-semibold uppercase">
                          {log.previousStatus}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                          {log.newStatus}
                        </span>
                      </div>
                    )}

                    {/* Changed Fields Diff Accordion */}
                    {hasChanges && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => toggleExpand(log.id)}
                          className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                        >
                          <span>Rincian {log.changes?.length} Kolom yang Diubah</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>

                        {isExpanded && (
                          <div className="mt-2 border border-slate-200 rounded-lg overflow-hidden bg-white text-[11px]">
                            <table className="w-full text-left">
                              <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold">
                                <tr>
                                  <th className="p-2">Kolom Data</th>
                                  <th className="p-2">Nilai Semula</th>
                                  <th className="p-2">Nilai Baru</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-mono">
                                {log.changes?.map((ch, cIdx) => (
                                  <tr key={cIdx} className="hover:bg-slate-50">
                                    <td className="p-2 font-sans font-medium text-slate-800">{ch.fieldLabel}</td>
                                    <td className="p-2 text-red-600 line-through bg-red-50/30 max-w-[150px] truncate">{String(ch.oldValue || '-')}</td>
                                    <td className="p-2 text-emerald-700 font-bold bg-emerald-50/30 max-w-[200px] truncate">{String(ch.newValue || '-')}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
