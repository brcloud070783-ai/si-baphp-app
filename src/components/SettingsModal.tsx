import React, { useState, useEffect } from 'react';
import { KopDinasConfig, OfficialOfficer, ContractorVendor, ProjectContract } from '../types';
import { OfficialKop } from './OfficialKop';
import { DEFAULT_KOP_DINAS } from '../data/defaultData';
import { 
  X, 
  Save, 
  Building, 
  Users, 
  Download, 
  Upload, 
  Plus, 
  Trash2, 
  Check, 
  Image as ImageIcon,
  Type,
  Sliders,
  RotateCcw,
  Sparkles,
  Bold,
  Eye,
  CheckCircle2
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  kopConfig: KopDinasConfig;
  onSaveKop: (config: KopDinasConfig) => void;
  officersList: OfficialOfficer[];
  onSaveOfficers: (officers: OfficialOfficer[]) => void;
  contractorsList: ContractorVendor[];
  onSaveContractors: (contractors: ContractorVendor[]) => void;
  projects: ProjectContract[];
  onImportProjects: (projects: ProjectContract[]) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  kopConfig,
  onSaveKop,
  officersList,
  onSaveOfficers,
  contractorsList,
  onSaveContractors,
  projects,
  onImportProjects
}) => {
  const [activeTab, setActiveTab] = useState<'kop' | 'officers' | 'contractors' | 'backup'>('kop');
  const [kopSubTab, setKopSubTab] = useState<'teks' | 'font' | 'logo'>('teks');
  const [tempKop, setTempKop] = useState<KopDinasConfig>({ ...DEFAULT_KOP_DINAS, ...kopConfig });
  const [tempOfficers, setTempOfficers] = useState<OfficialOfficer[]>([...officersList]);
  const [tempContractors, setTempContractors] = useState<ContractorVendor[]>([...contractorsList]);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setTempKop({ ...DEFAULT_KOP_DINAS, ...kopConfig });
      setTempOfficers([...officersList]);
      setTempContractors([...contractorsList]);
    }
  }, [isOpen, kopConfig, officersList, contractorsList]);

  // New Officer form state
  const [newOfficer, setNewOfficer] = useState<Partial<OfficialOfficer>>({
    nama: '',
    nip: '',
    jabatan: 'PPK (Pejabat Pembuat Komitmen)',
    role: 'PPK'
  });

  // New Contractor form state
  const [newContractor, setNewContractor] = useState<Partial<ContractorVendor>>({
    namaPerusahaan: '',
    bentukUsaha: 'CV',
    namaDirektur: '',
    jabatan: 'DIREKTUR',
    alamatPerusahaan: '',
    npwp: '',
    bankNama: 'PT. Bank Kaltimtara',
    nomorRekening: '',
    atasNamaRekening: ''
  });

  const handleSaveAll = () => {
    onSaveKop(tempKop);
    onSaveOfficers(tempOfficers);
    onSaveContractors(tempContractors);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih berkas gambar (PNG, JPG, SVG, atau WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setTempKop({
          ...tempKop,
          logoType: 'custom',
          customLogoUrl: result
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFullHeaderFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih berkas gambar kop surat (PNG, JPG, SVG, atau WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setTempKop({
          ...tempKop,
          kopMode: 'full_image',
          fullHeaderImageUrl: result
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetKopToStandard = () => {
    setTempKop({
      ...DEFAULT_KOP_DINAS
    });
  };

  const handleAddOfficer = () => {
    if (!newOfficer.nama || !newOfficer.nip) return;
    const item: OfficialOfficer = {
      id: 'off-' + Date.now(),
      nama: newOfficer.nama,
      nip: newOfficer.nip,
      jabatan: newOfficer.jabatan || 'PPK',
      role: newOfficer.role || 'PPK'
    };
    setTempOfficers([...tempOfficers, item]);
    setNewOfficer({
      nama: '',
      nip: '',
      jabatan: 'PPK (Pejabat Pembuat Komitmen)',
      role: 'PPK'
    });
  };

  const handleDeleteOfficer = (id: string) => {
    setTempOfficers(tempOfficers.filter(o => o.id !== id));
  };

  const handleAddContractor = () => {
    if (!newContractor.namaPerusahaan || !newContractor.namaDirektur) return;
    const item: ContractorVendor = {
      id: 'ctr-' + Date.now(),
      namaPerusahaan: newContractor.namaPerusahaan,
      bentukUsaha: newContractor.bentukUsaha || 'CV',
      namaDirektur: newContractor.namaDirektur,
      jabatan: newContractor.jabatan || 'DIREKTUR',
      alamatPerusahaan: newContractor.alamatPerusahaan || '',
      npwp: newContractor.npwp || '',
      bankNama: newContractor.bankNama || 'PT. Bank Kaltimtara',
      nomorRekening: newContractor.nomorRekening || '',
      atasNamaRekening: newContractor.atasNamaRekening || newContractor.namaPerusahaan
    };
    setTempContractors([...tempContractors, item]);
    setNewContractor({
      namaPerusahaan: '',
      bentukUsaha: 'CV',
      namaDirektur: '',
      jabatan: 'DIREKTUR',
      alamatPerusahaan: '',
      npwp: '',
      bankNama: 'PT. Bank Kaltimtara',
      nomorRekening: '',
      atasNamaRekening: ''
    });
  };

  const handleDeleteContractor = (id: string) => {
    setTempContractors(tempContractors.filter(c => c.id !== id));
  };

  const handleExportJSON = () => {
    const data = {
      kopConfig: tempKop,
      officers: tempOfficers,
      contractors: tempContractors,
      projects
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-si-baphp-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.kopConfig) setTempKop(parsed.kopConfig);
        if (parsed.officers) setTempOfficers(parsed.officers);
        if (parsed.contractors) setTempContractors(parsed.contractors);
        if (parsed.projects && onImportProjects) onImportProjects(parsed.projects);
        alert('Data berhasil diimpor!');
      } catch (err) {
        alert('Gagal membaca berkas JSON!');
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  const fontOptions = [
    { label: 'Plus Jakarta Sans (Standar Modern)', value: 'Plus Jakarta Sans' },
    { label: 'Arial (Standar Naskah Dinas)', value: 'Arial' },
    { label: 'Times New Roman (Klasik Resmi)', value: 'Times New Roman' },
    { label: 'Calibri (Bersih & Rapi)', value: 'Calibri' },
    { label: 'Inter (Tegas & Jelas)', value: 'Inter' },
    { label: 'Tahoma (Kompak)', value: 'Tahoma' },
    { label: 'Roboto (Google Standard)', value: 'Roboto' }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600" />
              <span>Pengaturan Kop Surat & Master Data Instansi</span>
            </h2>
            <p className="text-xs text-slate-500">
              Sesuaikan font, ukuran teks, upload logo instansi, pejabat dinas, dan rekanan.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50/70 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('kop')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'kop'
                ? 'border-blue-600 text-blue-600 bg-white/60'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Kop Surat & Logo Dinas</span>
          </button>
          <button
            onClick={() => setActiveTab('officers')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'officers'
                ? 'border-blue-600 text-blue-600 bg-white/60'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Pejabat (PPK/PPTK/PA)</span>
          </button>
          <button
            onClick={() => setActiveTab('contractors')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'contractors'
                ? 'border-blue-600 text-blue-600 bg-white/60'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Database Rekanan</span>
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'backup'
                ? 'border-blue-600 text-blue-600 bg-white/60'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Cadangan & Impor</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 text-xs space-y-4">
          {/* TAB 1: KOP SURAT & LOGO */}
          {activeTab === 'kop' && (
            <div className="space-y-4">
              {/* 1. Real-time Live Preview of Kop */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>Pratinjau Langsung Kop Surat (Live Preview)</span>
                  </span>
                  {tempKop.kopMode !== 'none' && tempKop.tampilkanKop !== false && (
                    <button
                      type="button"
                      onClick={handleResetKopToStandard}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
                      title="Kembalikan ke format baku Dinas Pendidikan Kaltara"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Terapkan Template Baku Sesuai Contoh Gambar</span>
                    </button>
                  )}
                </div>

                <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-inner overflow-x-auto min-h-[60px] flex items-center justify-center">
                  {tempKop.kopMode === 'none' || tempKop.tampilkanKop === false ? (
                    <div className="text-center py-2 text-slate-500">
                      <span className="font-bold text-xs text-slate-700 block mb-0.5">Kop Surat Dinonaktifkan (Mode Manual)</span>
                      <span className="text-[11px]">Dokumen akan langsung dimulai dari Judul Berita Acara tanpa kop otomatis.</span>
                    </div>
                  ) : (
                    <OfficialKop config={tempKop} />
                  )}
                </div>
              </div>

              {/* MODE PILIHAN KOP SURAT */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-slate-800 text-xs block">Pilihan Kop Surat Dokumen:</span>
                  <span className="text-[11px] text-slate-500">
                    Pilih apakah kop surat dibuat manual di Google Docs, atau digenerate otomatis oleh sistem.
                  </span>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg gap-1 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setTempKop({ ...tempKop, kopMode: 'none', tampilkanKop: false })}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      tempKop.kopMode === 'none' || tempKop.tampilkanKop === false
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Tanpa Kop (Buat Manual)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempKop({ ...tempKop, kopMode: 'text_logo', tampilkanKop: true })}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      tempKop.kopMode === 'text_logo' && tempKop.tampilkanKop !== false
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Teks & Logo Terpisah
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempKop({ ...tempKop, kopMode: 'full_image', tampilkanKop: true })}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      tempKop.kopMode === 'full_image' && tempKop.tampilkanKop !== false
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>1 Gambar Utuh Kop</span>
                  </button>
                </div>
              </div>

              {/* KONTEN MODE: TANPA KOP SURAT (BUAT MANUAL) */}
              {(tempKop.kopMode === 'none' || tempKop.tampilkanKop === false) && (
                <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 text-amber-900 space-y-1">
                  <div className="font-bold text-xs flex items-center gap-1.5 text-amber-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Kop Surat Dinonaktifkan (User Membuat Manual)</span>
                  </div>
                  <p className="text-[11.5px] leading-relaxed text-amber-800/90">
                    Seluruh dokumen Berita Acara dan ekspor Google Docs akan langsung diawali dengan <strong>Judul Dokumen, Nomor SPK, dan Tanggal Registrasi</strong> tanpa kop otomatis. Anda dapat menempelkan atau mendesain kop surat secara bebas langsung di lembar kerja Google Docs / Microsoft Word Anda.
                  </p>
                </div>
              )}

              {/* KONTEN MODE: 1 GAMBAR UTUH KOP SURAT */}
              {tempKop.kopMode === 'full_image' && tempKop.tampilkanKop !== false && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-xs">
                        Upload 1 File Gambar Utuh Kop Surat Resmi (Full Header Banner)
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Gambar kop surat utuh (lengkap dengan logo, teks instansi, kontak, dan garis pemisah) akan langsung diletakkan di header paling atas seluruh dokumen Berita Acara dan ekspor Google Docs.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center gap-3">
                    {tempKop.fullHeaderImageUrl ? (
                      <div className="w-full space-y-3">
                        <div className="bg-white p-3 rounded-lg border border-slate-300 shadow-inner max-w-2xl mx-auto overflow-hidden">
                          <img 
                            src={tempKop.fullHeaderImageUrl} 
                            alt="Pratinjau Kop Utuh" 
                            className="w-full object-contain mx-auto"
                            style={{ maxHeight: `${tempKop.fullHeaderImageHeight || 110}px` }}
                          />
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <label className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Ganti File Gambar</span>
                            <input 
                              type="file" 
                              accept="image/png, image/jpeg, image/webp, image/svg+xml"
                              onChange={handleFullHeaderFileUpload}
                              className="hidden" 
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setTempKop({ ...tempKop, fullHeaderImageUrl: undefined, kopMode: 'text_logo' })}
                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus & Kembali ke Mode Teks</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 flex flex-col items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-2">
                          <Upload className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-slate-800 text-xs">Belum Ada File Gambar Kop Utuh</span>
                        <span className="text-[11px] text-slate-500 max-w-sm mt-1 mb-3">
                          Pilih file gambar banner kop surat (.png, .jpg, .webp) dari komputer Anda.
                        </span>
                        <label className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm">
                          <Upload className="w-4 h-4" />
                          <span>Pilih File Gambar Kop Surat</span>
                          <input 
                            type="file" 
                            accept="image/png, image/jpeg, image/webp, image/svg+xml"
                            onChange={handleFullHeaderFileUpload}
                            className="hidden" 
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  {tempKop.fullHeaderImageUrl && (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-[11.5px]">Tinggi Skala Gambar Header:</span>
                        <span className="font-mono font-bold text-blue-600">{tempKop.fullHeaderImageHeight || 110} px</span>
                      </div>
                      <input
                        type="range"
                        min="60"
                        max="180"
                        step="5"
                        value={tempKop.fullHeaderImageHeight || 110}
                        onChange={(e) => setTempKop({ ...tempKop, fullHeaderImageHeight: parseInt(e.target.value, 10) })}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* KONTEN MODE: TEKS & LOGO TERPISAH */}
              {tempKop.kopMode !== 'full_image' && tempKop.kopMode !== 'none' && tempKop.tampilkanKop !== false && (
                <>
                  {/* 2. Sub-Tab Switcher for Kop Settings */}
                  <div className="flex gap-2 border-b border-slate-200 pb-2">
                    <button
                      type="button"
                      onClick={() => setKopSubTab('teks')}
                      className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                        kopSubTab === 'teks' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Type className="w-3.5 h-3.5" />
                      <span>1. Teks Identitas Dinas</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setKopSubTab('font')}
                      className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                        kopSubTab === 'font' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>2. Jenis & Ukuran Font</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setKopSubTab('logo')}
                      className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                        kopSubTab === 'logo' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>3. Upload & Ukuran Logo</span>
                    </button>
                  </div>
                </>
              )}

              {/* SUB-TAB A: TEKS IDENTITAS */}
              {kopSubTab === 'teks' && tempKop.kopMode !== 'full_image' && tempKop.kopMode !== 'none' && tempKop.tampilkanKop !== false && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-slate-200">
                  <div className="md:col-span-2">
                    <label className="font-semibold text-slate-700 block mb-1">
                      Pemerintah Tingkat (Header Baris 1)
                    </label>
                    <input
                      type="text"
                      value={tempKop.pemerintahTingkat}
                      onChange={(e) => setTempKop({ ...tempKop, pemerintahTingkat: e.target.value })}
                      placeholder="e.g. PEMERINTAH PROVINSI KALIMANTAN UTARA"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg uppercase font-semibold"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="font-semibold text-slate-700 block mb-1">
                      Nama Dinas / Instansi (Header Baris 2)
                    </label>
                    <input
                      type="text"
                      value={tempKop.namaDinas}
                      onChange={(e) => setTempKop({ ...tempKop, namaDinas: e.target.value })}
                      placeholder="e.g. DINAS PENDIDIKAN DAN KEBUDAYAAN"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg uppercase font-bold text-slate-900"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="font-semibold text-slate-700 block mb-1">
                      Alamat Lengkap Kantor (Header Baris 3)
                    </label>
                    <input
                      type="text"
                      value={tempKop.alamat}
                      onChange={(e) => setTempKop({ ...tempKop, alamat: e.target.value })}
                      placeholder="e.g. Jalan Kolonel Soetadji No. 1, Gedung Gadis II Lt. 1, Tanjung Selor 77212"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="font-semibold text-slate-700 block mb-1">
                      Baris Kontak & Surel (Header Baris 4)
                    </label>
                    <input
                      type="text"
                      value={tempKop.barisKontakGabungan || `${tempKop.teleponFax || ''} | ${tempKop.email || ''}`}
                      onChange={(e) => setTempKop({ ...tempKop, barisKontakGabungan: e.target.value })}
                      placeholder="e.g. Tel./Faks: (0552) 2020530 | Surel: kaltara.pendidikan@gmail.com"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Website Resmi (Opsional)
                    </label>
                    <input
                      type="text"
                      value={tempKop.website || ''}
                      onChange={(e) => setTempKop({ ...tempKop, website: e.target.value })}
                      placeholder="e.g. http://disdikbud.kaltaraprov.go.id"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                    <label className="inline-flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(tempKop.tampilkanWebsite)}
                        onChange={(e) => setTempKop({ ...tempKop, tampilkanWebsite: e.target.checked })}
                      />
                      <span>Tampilkan baris website di kop surat</span>
                    </label>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Kota Kedudukan Dinas (Opsional)
                    </label>
                    <input
                      type="text"
                      value={tempKop.kotaKedudukan || ''}
                      onChange={(e) => setTempKop({ ...tempKop, kotaKedudukan: e.target.value })}
                      placeholder="e.g. TANJUNG SELOR"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg uppercase"
                    />
                    <label className="inline-flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(tempKop.tampilkanKotaKedudukan)}
                        onChange={(e) => setTempKop({ ...tempKop, tampilkanKotaKedudukan: e.target.checked })}
                      />
                      <span>Tampilkan baris kota kedudukan di bawah alamat</span>
                    </label>
                  </div>
                </div>
              )}

              {/* SUB-TAB B: FONT & UKURAN */}
              {kopSubTab === 'font' && tempKop.kopMode !== 'full_image' && tempKop.kopMode !== 'none' && tempKop.tampilkanKop !== false && (
                <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1.5">
                      Jenis Font (Font Family) Kop Surat:
                    </label>
                    <select
                      value={tempKop.fontFamilyKop || 'Plus Jakarta Sans'}
                      onChange={(e) => setTempKop({ ...tempKop, fontFamilyKop: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium text-xs"
                    >
                      {fontOptions.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {/* Size Baris 1: Pemerintah */}
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-[11.5px]">Baris 1 (Pemerintah Tingkat):</span>
                        <span className="font-mono font-bold text-blue-600">{tempKop.fontSizePemerintah ?? 13.5} pt</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="10"
                          max="18"
                          step="0.5"
                          value={tempKop.fontSizePemerintah ?? 13.5}
                          onChange={(e) => setTempKop({ ...tempKop, fontSizePemerintah: parseFloat(e.target.value) })}
                          className="flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => setTempKop({ ...tempKop, isBoldPemerintah: tempKop.isBoldPemerintah === false })}
                          className={`px-2 py-1 rounded font-bold border text-xs cursor-pointer ${
                            tempKop.isBoldPemerintah !== false 
                              ? 'bg-blue-600 text-white border-blue-600' 
                              : 'bg-white text-slate-600 border-slate-300'
                          }`}
                          title="Tebalkan Baris 1"
                        >
                          <Bold className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Size Baris 2: Nama Dinas */}
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-[11.5px]">Baris 2 (Nama Dinas/Instansi):</span>
                        <span className="font-mono font-bold text-blue-600">{tempKop.fontSizeDinas ?? 16} pt</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="12"
                          max="22"
                          step="0.5"
                          value={tempKop.fontSizeDinas ?? 16}
                          onChange={(e) => setTempKop({ ...tempKop, fontSizeDinas: parseFloat(e.target.value) })}
                          className="flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => setTempKop({ ...tempKop, isBoldDinas: tempKop.isBoldDinas === false })}
                          className={`px-2 py-1 rounded font-bold border text-xs cursor-pointer ${
                            tempKop.isBoldDinas !== false 
                              ? 'bg-blue-600 text-white border-blue-600' 
                              : 'bg-white text-slate-600 border-slate-300'
                          }`}
                          title="Tebalkan Baris 2"
                        >
                          <Bold className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Size Baris 3: Alamat */}
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-[11.5px]">Baris 3 (Alamat Kantor):</span>
                        <span className="font-mono font-bold text-blue-600">{tempKop.fontSizeAlamat ?? 9.5} pt</span>
                      </div>
                      <input
                        type="range"
                        min="7.5"
                        max="13"
                        step="0.5"
                        value={tempKop.fontSizeAlamat ?? 9.5}
                        onChange={(e) => setTempKop({ ...tempKop, fontSizeAlamat: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                    </div>

                    {/* Size Baris 4: Kontak/Surel */}
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-[11.5px]">Baris 4 (Kontak, Telp, Surel):</span>
                        <span className="font-mono font-bold text-blue-600">{tempKop.fontSizeKontak ?? 9.5} pt</span>
                      </div>
                      <input
                        type="range"
                        min="7.5"
                        max="13"
                        step="0.5"
                        value={tempKop.fontSizeKontak ?? 9.5}
                        onChange={(e) => setTempKop({ ...tempKop, fontSizeKontak: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Format Garis Pemisah */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                    <label className="font-semibold text-slate-800 block text-[11.5px]">
                      Gaya Garis Pemisah Kop (Border Line Bawah):
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <label className={`p-2 rounded-lg border flex flex-col items-center gap-1.5 cursor-pointer text-center ${
                        (tempKop.formatGarisKop || 'ganda') === 'ganda' 
                          ? 'bg-blue-50 border-blue-500 text-blue-900 font-semibold' 
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}>
                        <input
                          type="radio"
                          name="garisKop"
                          checked={(tempKop.formatGarisKop || 'ganda') === 'ganda'}
                          onChange={() => setTempKop({ ...tempKop, formatGarisKop: 'ganda' })}
                          className="hidden"
                        />
                        <span className="text-[11px]">Garis Ganda Resmi (Standar Pemda)</span>
                        <div className="w-full mt-1">
                          <div className="w-full border-t-2 border-black"></div>
                          <div className="w-full border-t border-black mt-0.5"></div>
                        </div>
                      </label>

                      <label className={`p-2 rounded-lg border flex flex-col items-center gap-1.5 cursor-pointer text-center ${
                        tempKop.formatGarisKop === 'tunggal_tebal' 
                          ? 'bg-blue-50 border-blue-500 text-blue-900 font-semibold' 
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}>
                        <input
                          type="radio"
                          name="garisKop"
                          checked={tempKop.formatGarisKop === 'tunggal_tebal'}
                          onChange={() => setTempKop({ ...tempKop, formatGarisKop: 'tunggal_tebal' })}
                          className="hidden"
                        />
                        <span className="text-[11px]">Garis Tunggal Tebal</span>
                        <div className="w-full mt-1 border-t-[3px] border-black"></div>
                      </label>

                      <label className={`p-2 rounded-lg border flex flex-col items-center gap-1.5 cursor-pointer text-center ${
                        tempKop.formatGarisKop === 'tunggal_tipis' 
                          ? 'bg-blue-50 border-blue-500 text-blue-900 font-semibold' 
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}>
                        <input
                          type="radio"
                          name="garisKop"
                          checked={tempKop.formatGarisKop === 'tunggal_tipis'}
                          onChange={() => setTempKop({ ...tempKop, formatGarisKop: 'tunggal_tipis' })}
                          className="hidden"
                        />
                        <span className="text-[11px]">Garis Tunggal Tipis</span>
                        <div className="w-full mt-1 border-t-[1.5px] border-black"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB C: LOGO DINAS & UPLOAD */}
              {kopSubTab === 'logo' && tempKop.kopMode !== 'full_image' && tempKop.kopMode !== 'none' && tempKop.tampilkanKop !== false && (
                <div className="space-y-4 bg-white p-4 rounded-xl border border-slate-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Option 1: Preset Kaltara */}
                    <div 
                      onClick={() => setTempKop({ ...tempKop, logoType: 'kaltara' })}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center text-center gap-2 ${
                        tempKop.logoType === 'kaltara'
                          ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="w-16 h-20 flex items-center justify-center">
                        <svg className="w-14 h-18" viewBox="0 0 160 190" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <defs>
                            <linearGradient id="shieldModal" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#4A90E2" />
                              <stop offset="100%" stopColor="#2A6DB5" />
                            </linearGradient>
                            <linearGradient id="goldModal" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#FFD700" />
                              <stop offset="100%" stopColor="#DAA520" />
                            </linearGradient>
                          </defs>
                          <path d="M10 15 C10 15, 80 5, 80 5 C80 5, 150 15, 150 15 C150 85, 140 145, 80 185 C20 145, 10 85, 10 15 Z" fill="url(#goldModal)" stroke="#8B6508" strokeWidth="2" />
                          <path d="M15 20 C15 20, 80 11, 80 11 C80 11, 145 20, 145 20 C145 83, 136 138, 80 176 C24 138, 15 83, 15 20 Z" fill="url(#shieldModal)" stroke="#1B497A" strokeWidth="1.5" />
                          <polygon points="80,44 82,49 87,49 83,52 85,57 80,54 75,57 77,52 73,49 78,49" fill="#FEE75C" />
                          <polygon points="80,58 108,88 52,88" fill="#15803D" />
                        </svg>
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block text-xs">Lambang Resmi Provinsi Kaltara</span>
                        <span className="text-[11px] text-slate-500">Vektor HD Tajam (Bawaan Otentik)</span>
                      </div>
                      {tempKop.logoType === 'kaltara' && (
                        <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] rounded-full font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Terpilih
                        </span>
                      )}
                    </div>

                    {/* Option 2: Upload Custom Logo */}
                    <div 
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center text-center gap-2 ${
                        tempKop.logoType === 'custom'
                          ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="w-16 h-20 flex items-center justify-center">
                        {tempKop.customLogoUrl ? (
                          <img 
                            src={tempKop.customLogoUrl} 
                            alt="Custom Logo" 
                            className="w-14 h-18 object-contain"
                          />
                        ) : (
                          <div className="w-14 h-18 rounded-lg bg-slate-100 border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                            <Upload className="w-5 h-5 mb-1" />
                            <span className="text-[9px]">Belum Ada</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <span className="font-bold text-slate-900 block text-xs">Upload Gambar Logo Dinas</span>
                        <span className="text-[11px] text-slate-500">Pilih file logo dari laptop/komputer</span>
                      </div>

                      <div className="flex gap-2 mt-1">
                        <label className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-[11px] flex items-center gap-1.5 cursor-pointer shadow-2xs">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Pilih File Gambar</span>
                          <input 
                            type="file" 
                            accept="image/png, image/jpeg, image/webp, image/svg+xml"
                            onChange={handleLogoFileUpload}
                            className="hidden" 
                          />
                        </label>
                        {tempKop.customLogoUrl && (
                          <button
                            type="button"
                            onClick={() => setTempKop({ ...tempKop, logoType: 'kaltara', customLogoUrl: undefined })}
                            className="px-2 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[11px] cursor-pointer"
                            title="Hapus Logo Kustom"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Slider Ukuran Logo */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 text-[11.5px]">
                        Ukuran Lebar Logo di Kop Surat:
                      </span>
                      <span className="font-mono font-bold text-blue-600 text-xs">
                        {tempKop.logoSize ?? 82} px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="130"
                      step="2"
                      value={tempKop.logoSize ?? 82}
                      onChange={(e) => setTempKop({ ...tempKop, logoSize: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Kecil (50px)</span>
                      <span>Standar Resmi (82px)</span>
                      <span>Besar (130px)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PEJABAT */}
          {activeTab === 'officers' && (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b text-[11px] font-semibold text-slate-600">
                    <tr>
                      <th className="p-2.5">Nama & Gelar</th>
                      <th className="p-2.5">NIP</th>
                      <th className="p-2.5">Jabatan Dinas</th>
                      <th className="p-2.5">Peran</th>
                      <th className="p-2.5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tempOfficers.map((o) => (
                      <tr key={o.id}>
                        <td className="p-2.5 font-bold">{o.nama}</td>
                        <td className="p-2.5 font-mono text-slate-600">{o.nip}</td>
                        <td className="p-2.5 text-slate-600">{o.jabatan}</td>
                        <td className="p-2.5 font-semibold text-blue-600">{o.role}</td>
                        <td className="p-2.5 text-center">
                          <button
                            onClick={() => handleDeleteOfficer(o.id)}
                            className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add Officer Box */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 text-[11px]">Tambah Pejabat Baru:</span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    placeholder="Nama Lengkap & Gelar"
                    value={newOfficer.nama}
                    onChange={(e) => setNewOfficer({ ...newOfficer, nama: e.target.value })}
                    className="px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  />
                  <input
                    type="text"
                    placeholder="NIP (18 Digit)"
                    value={newOfficer.nip}
                    onChange={(e) => setNewOfficer({ ...newOfficer, nip: e.target.value })}
                    className="px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono"
                  />
                  <input
                    type="text"
                    placeholder="Jabatan"
                    value={newOfficer.jabatan}
                    onChange={(e) => setNewOfficer({ ...newOfficer, jabatan: e.target.value })}
                    className="px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  />
                  <div className="flex gap-2">
                    <select
                      value={newOfficer.role}
                      onChange={(e) => setNewOfficer({ ...newOfficer, role: e.target.value as any })}
                      className="px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                    >
                      <option value="PPK">PPK</option>
                      <option value="PPTK">PPTK</option>
                      <option value="PA_KPA">KPA/PA</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleAddOfficer}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: REKANAN */}
          {activeTab === 'contractors' && (
            <div className="space-y-4">
              <div className="space-y-2.5">
                {tempContractors.map((c) => (
                  <div key={c.id} className="p-3 border border-slate-200 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900 uppercase">{c.namaPerusahaan}</p>
                      <p className="text-slate-600">
                        Pimpinan: <strong>{c.namaDirektur}</strong> ({c.jabatan}) · NPWP: <span className="font-mono">{c.npwp}</span>
                      </p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Bank: {c.bankNama} · No. Rek: <span className="font-mono font-medium">{c.nomorRekening}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteContractor(c.id)}
                      className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Contractor Box */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 text-[11px]">Daftarkan Rekanan Baru:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Nama Perusahaan (e.g. CV. BORNEO ENGINEERING)"
                    value={newContractor.namaPerusahaan}
                    onChange={(e) => setNewContractor({ ...newContractor, namaPerusahaan: e.target.value })}
                    className="px-2.5 py-1.5 border border-slate-300 rounded bg-white uppercase"
                  />
                  <input
                    type="text"
                    placeholder="Nama Direktur / Pimpinan"
                    value={newContractor.namaDirektur}
                    onChange={(e) => setNewContractor({ ...newContractor, namaDirektur: e.target.value })}
                    className="px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Nama Bank (e.g. Bank Kaltimtara)"
                    value={newContractor.bankNama}
                    onChange={(e) => setNewContractor({ ...newContractor, bankNama: e.target.value })}
                    className="px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Nomor Rekening Bank"
                    value={newContractor.nomorRekening}
                    onChange={(e) => setNewContractor({ ...newContractor, nomorRekening: e.target.value })}
                    className="px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono"
                  />
                  <input
                    type="text"
                    placeholder="NPWP Perusahaan"
                    value={newContractor.npwp}
                    onChange={(e) => setNewContractor({ ...newContractor, npwp: e.target.value })}
                    className="px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono"
                  />
                  <input
                    type="text"
                    placeholder="Alamat Kantor Rekanan"
                    value={newContractor.alamatPerusahaan}
                    onChange={(e) => setNewContractor({ ...newContractor, alamatPerusahaan: e.target.value })}
                    className="px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleAddContractor}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Rekanan
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BACKUP & RESTORE */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs">Ekspor Cadangan Database (.json)</h4>
                <p className="text-slate-600">
                  Simpan seluruh data proyek, kontrak, pengaturan kop dinas, dan daftar rekanan ke dalam berkas JSON untuk dicadangkan atau dipindahkan ke komputer lain.
                </p>
                <button
                  onClick={handleExportJSON}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg flex items-center gap-2 font-medium cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Berkas Cadangan ({projects.length} Proyek)</span>
                </button>
              </div>

              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs">Pulihkan / Impor Database (.json)</h4>
                <p className="text-slate-600">
                  Pilih berkas JSON cadangan yang pernah diekspor untuk memulihkan seluruh data proyek ke dalam aplikasi.
                </p>
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>Pilih Berkas JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJSON}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{savedSuccess ? 'Tersimpan!' : 'Simpan Pengaturan'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
