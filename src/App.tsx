import React, { useState, useEffect } from 'react';
import { 
  ProjectContract, 
  KopDinasConfig, 
  OfficialOfficer, 
  ContractorVendor, 
  DocumentType 
} from './types';
import { 
  DEFAULT_KOP_DINAS, 
  DEFAULT_OFFICERS, 
  DEFAULT_CONTRACTORS, 
  INITIAL_PROJECTS 
} from './data/defaultData';
import { Header } from './components/Header';
import { BottomNavBar } from './components/BottomNavBar';
import { StudioWorkspace } from './components/StudioWorkspace';
import { SmartPackageTitle } from './components/SmartPackageTitle';
import { SmartVendorTitle } from './components/SmartVendorTitle';
import { SmartSPKTitle } from './components/SmartSPKTitle';
import { DocumentRenderer } from './components/DocumentRenderer';
import { GoogleDocsPreview } from './components/GoogleDocsPreview';
import { VerificationPanel } from './components/VerificationPanel';
import { AuditTrail } from './components/AuditTrail';
import { ProjectFormModal } from './components/ProjectFormModal';
import { BatchExportModal } from './components/BatchExportModal';
import { SettingsModal } from './components/SettingsModal';
import { VersionHistoryModal } from './components/VersionHistoryModal';
import { BundleExporterModal } from './components/BundleExporterModal';
import { formatRupiah, formatTanggalIndonesia } from './utils/terbilang';
import { validateProject } from './utils/validator';
import { detectContractChanges, recordAuditLog } from './utils/auditLogger';
import { 
  auth, 
  googleProvider, 
  googleSignIn,
  logout,
  db, 
  handleFirestoreError, 
  OperationType 
} from './lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs 
} from 'firebase/firestore';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Printer, 
  Building2, 
  FolderKanban, 
  ArrowRight, 
  DollarSign,
  Edit,
  Trash2,
  ChevronRight,
  Cloud,
  QrCode,
  Smartphone,
  Laptop
} from 'lucide-react';

export default function App() {
  // Google Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(true);

  // Core Data State
  const [projects, setProjects] = useState<ProjectContract[]>(() => {
    try {
      const saved = localStorage.getItem('si_baphp_projects');
      if (!saved) return INITIAL_PROJECTS;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_PROJECTS;
    } catch (e) {
      console.warn('Error reading projects from localStorage:', e);
      return INITIAL_PROJECTS;
    }
  });

  const [kopConfig, setKopConfig] = useState<KopDinasConfig>(() => {
    try {
      const saved = localStorage.getItem('si_baphp_kop');
      return saved ? JSON.parse(saved) : DEFAULT_KOP_DINAS;
    } catch (e) {
      console.warn('Error reading kop from localStorage:', e);
      return DEFAULT_KOP_DINAS;
    }
  });

  const [officers, setOfficers] = useState<OfficialOfficer[]>(() => {
    try {
      const saved = localStorage.getItem('si_baphp_officers');
      return saved ? JSON.parse(saved) : DEFAULT_OFFICERS;
    } catch (e) {
      console.warn('Error reading officers from localStorage:', e);
      return DEFAULT_OFFICERS;
    }
  });

  const [contractors, setContractors] = useState<ContractorVendor[]>(() => {
    try {
      const saved = localStorage.getItem('si_baphp_contractors');
      return saved ? JSON.parse(saved) : DEFAULT_CONTRACTORS;
    } catch (e) {
      console.warn('Error reading contractors from localStorage:', e);
      return DEFAULT_CONTRACTORS;
    }
  });

  // Navigation & View state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'generator' | 'audit' | 'settings'>('generator');
  const [auditSubTab, setAuditSubTab] = useState<'trail' | 'verifier'>('trail');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [selectedDoc, setSelectedDoc] = useState<DocumentType>('BAPHP');
  const [previewMode, setPreviewMode] = useState<'googledocs' | 'print'>('print');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingProject, setEditingProject] = useState<ProjectContract | null>(null);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState<boolean>(false);
  const [isBundleExporterOpen, setIsBundleExporterOpen] = useState<boolean>(false);

  // Filters state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // 1. Listen to Google Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // 2. Realtime sync with Google Firestore
  useEffect(() => {
    const projectsCol = collection(db, 'projects');
    const unsub = onSnapshot(projectsCol, (snapshot) => {
      if (!snapshot.empty) {
        const loaded: ProjectContract[] = [];
        snapshot.forEach((d) => {
          loaded.push(d.data() as ProjectContract);
        });
        setProjects(loaded);
        localStorage.setItem('si_baphp_projects', JSON.stringify(loaded));
        setIsCloudSynced(true);
      } else {
        // If Firestore is empty initially, seed default projects to Firestore
        INITIAL_PROJECTS.forEach(async (p) => {
          try {
            await setDoc(doc(db, 'projects', p.id), p);
          } catch (e) {
            console.error(e);
          }
        });
      }
    }, (error) => {
      console.warn('Firestore offline fallback to local:', error.message);
      setIsCloudSynced(false);
    });

    return () => unsub();
  }, []);

  // Save changes to localStorage as local offline cache
  useEffect(() => {
    localStorage.setItem('si_baphp_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('si_baphp_kop', JSON.stringify(kopConfig));
  }, [kopConfig]);

  useEffect(() => {
    localStorage.setItem('si_baphp_officers', JSON.stringify(officers));
  }, [officers]);

  useEffect(() => {
    localStorage.setItem('si_baphp_contractors', JSON.stringify(contractors));
  }, [contractors]);

  const selectedProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  // Actions
  const handleGoogleSignIn = async () => {
    try {
      await googleSignIn();
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        return;
      }
      console.error('Google Sign In error:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Sign Out error:', err);
    }
  };

  const handleCreateNewProject = () => {
    setEditingProject(null);
    setIsFormModalOpen(true);
  };

  const handleEditProject = (proj: ProjectContract) => {
    setEditingProject(proj);
    setIsFormModalOpen(true);
  };

  const handleDeleteProject = async (projId: string) => {
    if (projects.length <= 1) {
      alert('Minimal harus ada 1 proyek di dalam database.');
      return;
    }
    if (confirm('Apakah Anda yakin ingin menghapus data paket proyek ini dari Google Cloud?')) {
      try {
        await deleteDoc(doc(db, 'projects', projId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `projects/${projId}`);
      }
      const remaining = projects.filter(p => p.id !== projId);
      setProjects(remaining);
      if (selectedProjectId === projId) {
        setSelectedProjectId(remaining[0].id);
      }
    }
  };

  const handleSaveProject = async (savedProj: ProjectContract) => {
    const oldProj = projects.find(p => p.id === savedProj.id);

    // 1. Update local state
    const exists = projects.some(p => p.id === savedProj.id);
    if (exists) {
      setProjects(projects.map(p => p.id === savedProj.id ? savedProj : p));
    } else {
      setProjects([savedProj, ...projects]);
    }
    setSelectedProjectId(savedProj.id);

    // 2. Persist directly to Google Cloud Firestore
    try {
      await setDoc(doc(db, 'projects', savedProj.id), savedProj);
      setIsCloudSynced(true);
    } catch (err) {
      console.error('Save to Firestore error:', err);
    }

    // 3. Track Audit Trail changes
    if (oldProj) {
      const diffs = detectContractChanges(oldProj, savedProj);
      if (diffs.length > 0) {
        await recordAuditLog({
          projectId: savedProj.id,
          actionType: 'CONTRACT_UPDATE',
          title: `Pembaruan ${diffs.length} Kolom Data Kontrak & Berita Acara`,
          description: `Perubahan data pada: ${diffs.map(d => d.fieldLabel).join(', ')}.`,
          authorName: currentUser?.displayName || savedProj.ppk.nama,
          authorEmail: currentUser?.email || 'hasanuddin.ppk@kaltaraprov.go.id',
          authorRole: currentUser?.displayName ? 'User Terautentikasi' : 'PPK',
          version: 2,
          changes: diffs
        });
      }
    } else {
      await recordAuditLog({
        projectId: savedProj.id,
        actionType: 'INITIAL_CREATION',
        title: 'Pendaftaran Kontrak & Paket Pekerjaan Baru',
        description: `Paket pekerjaan ${savedProj.namaPaket} berhasil didaftarkan ke sistem dengan nilai Rp ${new Intl.NumberFormat('id-ID').format(savedProj.nilaiSPK)}.`,
        authorName: currentUser?.displayName || savedProj.ppk.nama,
        authorEmail: currentUser?.email || undefined,
        authorRole: 'Operator Pengadaan',
        newStatus: savedProj.statusVerifikasi,
        version: 1
      });
    }
  };

  const handleUpdateStatus = async (
    projId: string, 
    status: 'diverifikasi' | 'perlu_tinjauan' | 'draf',
    note?: string
  ) => {
    const target = projects.find(p => p.id === projId);
    const prevStatus = target?.statusVerifikasi || 'draf';

    const updated = projects.map(p => {
      if (p.id === projId) {
        return {
          ...p,
          statusVerifikasi: status,
          verifiedAt: status === 'diverifikasi' ? new Date().toISOString() : undefined,
          verifiedBy: status === 'diverifikasi' ? (currentUser?.displayName || 'Sistem Verifikasi Otomatis Disdikbud') : undefined,
          catatanPemeriksaan: note || p.catatanPemeriksaan
        };
      }
      return p;
    });
    setProjects(updated);

    const savedTarget = updated.find(p => p.id === projId);
    if (savedTarget) {
      try {
        await setDoc(doc(db, 'projects', projId), savedTarget);
      } catch (err) {
        console.error(err);
      }
    }

    // Record Audit Trail for status change
    await recordAuditLog({
      projectId: projId,
      actionType: status === 'diverifikasi' ? 'VERIFICATION_AUDIT' : 'STATUS_CHANGE',
      title: status === 'diverifikasi' 
        ? 'Pengesahan Status Dokumen (Diverifikasi Sah)' 
        : `Perubahan Status Berkas Menjadi ${status.replace('_', ' ').toUpperCase()}`,
      description: note || `Status verifikasi berkas paket diperbarui dari ${prevStatus} menjadi ${status}.`,
      authorName: currentUser?.displayName || (target ? target.ppk.nama : 'Tim Verifikator'),
      authorEmail: currentUser?.email || 'hasanuddin.ppk@kaltaraprov.go.id',
      authorRole: status === 'diverifikasi' ? 'PPK / Verifikator' : 'PPTK',
      previousStatus: prevStatus,
      newStatus: status,
      changes: [
        { field: 'statusVerifikasi', fieldLabel: 'Status Verifikasi', oldValue: prevStatus, newValue: status }
      ]
    });
  };

  // Metrics
  const totalAnggaran = projects.reduce((acc, p) => acc + (p.nilaiSPK || 0), 0);
  const totalVerified = projects.filter(p => p.statusVerifikasi === 'diverifikasi').length;
  const totalNeedsReview = projects.filter(p => p.statusVerifikasi === 'perlu_tinjauan').length;

  // Filtered projects
  const filteredProjects = projects.filter(p => {
    const matchSearch = 
      p.namaPaket.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.lokasi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nomorSPK.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.penyedia.namaPerusahaan.toLowerCase().includes(searchQuery.toLowerCase());

    const matchCategory = categoryFilter === 'all' || p.jenisPekerjaan === categoryFilter;
    const matchStatus = statusFilter === 'all' || p.statusVerifikasi === statusFilter;

    return matchSearch && matchCategory && matchStatus;
  });

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col text-slate-800">
      {/* Top Header Navigation */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === 'settings') {
            setIsSettingsModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        onNewProject={handleCreateNewProject}
        onBatchPrint={() => setIsBatchModalOpen(true)}
        currentUser={currentUser}
        onGoogleSignIn={handleGoogleSignIn}
        onSignOut={handleSignOut}
        isCloudSynced={isCloudSynced}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-6 pb-20 md:pb-6">
        {/* ============================================================== */}
        {/* VIEW 1: DOKUMEN STUDIO (INTEGRATED WORKSPACE)                  */}
        {/* ============================================================== */}
        {activeTab === 'generator' && selectedProject && (
          <StudioWorkspace
            projects={projects}
            selectedProject={selectedProject}
            onSelectProject={setSelectedProjectId}
            selectedDoc={selectedDoc}
            onSelectDoc={setSelectedDoc}
            previewMode={previewMode}
            onSelectPreviewMode={setPreviewMode}
            kopConfig={kopConfig}
            onSaveProject={handleSaveProject}
            onEditProject={handleEditProject}
            onBatchPrint={() => setIsBatchModalOpen(true)}
            onAudit={() => setActiveTab('audit')}
            onOpenVersionHistory={() => setIsVersionHistoryOpen(true)}
            onOpenBundleExporter={() => setIsBundleExporterOpen(true)}
          />
        )}

        {/* ============================================================== */}
        {/* VIEW 2: DASHBOARD RINGKASAN                                    */}
        {/* ============================================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Metric Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold text-slate-500">Total Paket Proyek</span>
                  <FolderKanban className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                  {projects.length}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Tersimpan di Google Cloud Firestore
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold text-slate-500">Nilai Kontrak Terkelola</span>
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-lg font-bold font-mono tabular-nums text-slate-900 truncate">
                  {formatRupiah(totalAnggaran)}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Alokasi APBD & DAK Fisik
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold text-slate-500">Berkas Siap Bayar</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700">
                  {totalVerified}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  100% Lolos Verifikasi BAPHP
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold text-slate-500">Perlu Tinjauan</span>
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-bold font-mono tabular-nums text-amber-700">
                  {totalNeedsReview}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Menunggu Kelengkapan Syarat
                </p>
              </div>
            </div>

            {/* Cloud & Responsive Editorial Banner */}
            <div className="bg-slate-900 text-white p-6 sm:p-7 rounded-xl">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <Cloud className="w-3.5 h-3.5" />
                    <span>Google Cloud Realtime Sync</span>
                  </span>
                  <span>·</span>
                  <span>Akses Multi-Perangkat (PC & Ponsel Lapangan)</span>
                </div>

                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  Otomasi Berita Acara & Pencairan Dana Terintegrasi
                </h2>
                <p className="text-slate-300 text-xs sm:text-sm mt-1.5 leading-relaxed">
                  Data kontrak tersimpan secara terpusat di Google Firestore. Seluruh 13 berkas Berita Acara (BAPHP, BAST, BAP, Kuitansi, SPP-LS) dapat dibuat, diedit di Google Docs, dan diekspor ke PDF dengan verifikasi keabsahan data otomatis.
                </p>

                <div className="flex flex-wrap items-center gap-3 mt-4 pt-2">
                  <button
                    onClick={() => {
                      if (projects[0]) {
                        setSelectedProjectId(projects[0].id);
                        setSelectedDoc('BAPHP');
                        setActiveTab('generator');
                      }
                    }}
                    className="px-4 py-2 bg-white text-slate-900 font-semibold text-xs rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Buka Dokumen Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleCreateNewProject}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer border border-slate-700"
                  >
                    + Daftarkan Kontrak Baru
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Projects Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">
                  Daftar Paket Proyek Pendidikan Aktif
                </h3>
                <button
                  onClick={() => setActiveTab('projects')}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <span>Lihat Seluruh Database</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-400 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-2">
                        <span>{proj.jenisPekerjaan}</span>
                        <span className="flex items-center gap-1 font-medium">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            proj.statusVerifikasi === 'diverifikasi' ? 'bg-emerald-600' : 'bg-amber-500'
                          }`} />
                          <span className={proj.statusVerifikasi === 'diverifikasi' ? 'text-emerald-700' : 'text-amber-700'}>
                            {proj.statusVerifikasi === 'diverifikasi' ? 'Terverifikasi' : 'Perlu Tinjauan'}
                          </span>
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm line-clamp-2">
                        {proj.namaPaket}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {proj.lokasi} · {proj.kabupatenKota}
                      </p>
                      <p className="font-mono tabular-nums font-bold text-slate-900 text-sm mt-3">
                        {formatRupiah(proj.nilaiSPK)}
                      </p>
                      <p className="text-xs text-slate-600 mt-1 truncate">
                        Rekanan: <span className="font-medium text-slate-800">{proj.penyedia.namaPerusahaan}</span>
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setSelectedProjectId(proj.id);
                          setSelectedDoc('BAPHP');
                          setActiveTab('generator');
                        }}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                      >
                        <span>Buka Studio</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProjectId(proj.id);
                          setActiveTab('audit');
                        }}
                        className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        Audit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 3: DATABASE KONTRAK & MASTER PROYEK                       */}
        {/* ============================================================== */}
        {activeTab === 'projects' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">
                    Database Master Kontrak & Paket Pekerjaan
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pusat data terpadu pengadaan untuk otomasi penerbitan seluruh dokumen Berita Acara.
                  </p>
                </div>
                <button
                  onClick={handleCreateNewProject}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Paket Baru</span>
                </button>
              </div>

              {/* Filters Bar */}
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Cari nama paket, lokasi sekolah, nomor SPK, rekanan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Jenis:</span>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs cursor-pointer"
                  >
                    <option value="all">Semua Jenis</option>
                    <option value="Perencanaan">Perencanaan</option>
                    <option value="Pengawasan">Pengawasan</option>
                    <option value="Fisik / Konstruksi">Fisik / Konstruksi</option>
                    <option value="Pengadaan Sarana">Pengadaan Sarana</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs cursor-pointer"
                  >
                    <option value="all">Semua Status</option>
                    <option value="diverifikasi">Diverifikasi</option>
                    <option value="perlu_tinjauan">Perlu Tinjauan</option>
                    <option value="draf">Draf</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Table of Projects */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                    <tr>
                      <th className="p-3.5">Paket Pekerjaan & Lokasi</th>
                      <th className="p-3.5">Rekanan / Penyedia</th>
                      <th className="p-3.5">Nomor & Tanggal SPK</th>
                      <th className="p-3.5 text-right">Nilai Kontrak</th>
                      <th className="p-3.5 text-center">Durasi</th>
                      <th className="p-3.5 text-center">Status</th>
                      <th className="p-3.5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProjects.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">
                          Tidak ditemukan paket pekerjaan yang sesuai pencarian.
                        </td>
                      </tr>
                    ) : (
                      filteredProjects.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3.5 min-w-[280px] max-w-md">
                            <SmartPackageTitle 
                              project={p} 
                              onSelect={() => {
                                setSelectedProjectId(p.id);
                                setSelectedDoc('BAPHP');
                                setActiveTab('generator');
                              }} 
                            />
                          </td>
                          <td className="p-3.5 min-w-[180px] max-w-[260px]">
                            <SmartVendorTitle vendor={p.penyedia} />
                          </td>
                          <td className="p-3.5 min-w-[180px] max-w-[240px]">
                            <SmartSPKTitle nomorSPK={p.nomorSPK} tanggalSPK={p.tanggalSPK} project={p} />
                          </td>
                          <td className="p-3.5 text-right font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                            {formatRupiah(p.nilaiSPK)}
                          </td>
                          <td className="p-3.5 text-center whitespace-nowrap text-slate-600 font-mono tabular-nums">
                            {p.jangkaWaktuHari} Hari
                          </td>
                          <td className="p-3.5 text-center whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 text-[11px]">
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                p.statusVerifikasi === 'diverifikasi' ? 'bg-emerald-600' : 'bg-amber-500'
                              }`} />
                              <span className={p.statusVerifikasi === 'diverifikasi' ? 'text-emerald-700 font-medium' : 'text-amber-700 font-medium'}>
                                {p.statusVerifikasi === 'diverifikasi' ? 'Terverifikasi' : 'Perlu Tinjauan'}
                              </span>
                            </span>
                          </td>
                          <td className="p-3.5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => {
                                  setSelectedProjectId(p.id);
                                  setSelectedDoc('BAPHP');
                                  setActiveTab('generator');
                                }}
                                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-medium transition-colors cursor-pointer"
                                title="Buka berkas di Studio"
                              >
                                Studio
                              </button>
                              <button
                                onClick={() => handleEditProject(p)}
                                className="p-1 text-slate-400 hover:text-slate-800 rounded transition-colors cursor-pointer"
                                title="Edit data kontrak"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProject(p.id)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                                title="Hapus paket"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 4: VERIFIKASI & AUDIT AKURASI DOKUMEN                    */}
        {/* ============================================================== */}
        {activeTab === 'audit' && selectedProject && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Panel Verifikasi & Audit Integritas Berita Acara
                </h2>
                <p className="text-xs text-slate-500">
                  Menelusuri linimasa jejak rekam perubahan dokumen serta memvalidasi keabsahan data SPK dan BAPHP.
                </p>
              </div>

              {/* Project Switcher */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Paket:</span>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white cursor-pointer"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.namaPaket} ({p.lokasi})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sub-tab Switcher: Audit Trail vs Quality Gate */}
            <div className="flex border-b border-slate-200 gap-3 text-xs">
              <button
                type="button"
                onClick={() => setAuditSubTab('trail')}
                className={`pb-2.5 font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
                  auditSubTab === 'trail'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Audit Trail & Linimasa Jejak Rekam</span>
              </button>
              <button
                type="button"
                onClick={() => setAuditSubTab('verifier')}
                className={`pb-2.5 font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
                  auditSubTab === 'verifier'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Pemeriksaan Akurasi Dokumen (Quality Gate)</span>
              </button>
            </div>

            {auditSubTab === 'trail' ? (
              <AuditTrail
                project={selectedProject}
                currentUser={currentUser}
              />
            ) : (
              <VerificationPanel
                project={selectedProject}
                onUpdateStatus={handleUpdateStatus}
                onEditProject={handleEditProject}
              />
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <ProjectFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingProject(null);
        }}
        onSave={handleSaveProject}
        initialProject={editingProject}
        officersList={officers}
        contractorsList={contractors}
      />

      {selectedProject && (
        <BatchExportModal
          isOpen={isBatchModalOpen}
          onClose={() => setIsBatchModalOpen(false)}
          project={selectedProject}
          kopConfig={kopConfig}
        />
      )}

      {selectedProject && (
        <VersionHistoryModal
          isOpen={isVersionHistoryOpen}
          onClose={() => setIsVersionHistoryOpen(false)}
          project={selectedProject}
        />
      )}

      {selectedProject && (
        <BundleExporterModal
          isOpen={isBundleExporterOpen}
          onClose={() => setIsBundleExporterOpen(false)}
          project={selectedProject}
          kopConfig={kopConfig}
        />
      )}

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        kopConfig={kopConfig}
        onSaveKop={setKopConfig}
        officersList={officers}
        onSaveOfficers={setOfficers}
        contractorsList={contractors}
        onSaveContractors={setContractors}
        projects={projects}
        onImportProjects={setProjects}
      />

      {/* Fixed Bottom Navigation Bar (Mobile & Quick Dock) */}
      <BottomNavBar
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === 'settings') {
            setIsSettingsModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        onNewProject={handleCreateNewProject}
      />
    </div>
  );
}
