import React, { useState, useEffect } from 'react';
import { ProjectContract, OfficialOfficer, ContractorVendor, DocumentType, PaymentTermin } from '../types';
import { terbilangRupiah, formatRupiah, getTerbilangTanggal } from '../utils/terbilang';
import { 
  X, 
  Save, 
  Wand2, 
  Calendar, 
  Building, 
  User, 
  FileText, 
  CheckSquare, 
  Square, 
  Hash, 
  Layers,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Percent,
  Coins,
  SplitSquareVertical
} from 'lucide-react';

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: ProjectContract) => void;
  initialProject?: ProjectContract | null;
  officersList: OfficialOfficer[];
  contractorsList: ContractorVendor[];
}

interface DocFieldConfig {
  keyNum: keyof ProjectContract;
  keyDate: keyof ProjectContract;
  type: DocumentType;
  label: string;
  stage: 'Awal Kontrak' | 'Pelaksanaan' | 'Serah Terima' | 'Pencairan Kasda';
  defaultSuffix: string;
  defaultDayOffset: number; // offset from end date (e.g. 0 = end date, -30 = start date, +2 = 2 days after)
}

const ALL_DOCUMENTS_CONFIG: DocFieldConfig[] = [
  {
    keyNum: 'nomorBA_STL',
    keyDate: 'tanggalBA_STL',
    type: 'BA_STL',
    label: '1. BA Serah Terima Lapangan (BA-STL)',
    stage: 'Awal Kontrak',
    defaultSuffix: '02-098',
    defaultDayOffset: -30 // at project start
  },
  {
    keyNum: 'nomorBA_MC0',
    keyDate: 'tanggalBA_MC0',
    type: 'BA_MC0',
    label: '2. BA Rekayasa Lapangan / Mutual Check (MC-0)',
    stage: 'Awal Kontrak',
    defaultSuffix: '02-099',
    defaultDayOffset: -27 // 3 days after start
  },
  {
    keyNum: 'nomorBA_UM',
    keyDate: 'tanggalBA_UM',
    type: 'BA_UM',
    label: '3. BA Pembayaran Uang Muka (20%-30%)',
    stage: 'Pelaksanaan',
    defaultSuffix: '02-UM',
    defaultDayOffset: -25
  },
  {
    keyNum: 'nomorBAKP',
    keyDate: 'tanggalBAKP',
    type: 'BAKP',
    label: '4. BA Kemajuan Prestasi Pekerjaan (Opname 100%)',
    stage: 'Pelaksanaan',
    defaultSuffix: '02-103',
    defaultDayOffset: 0
  },
  {
    keyNum: 'nomorSuratRekanan',
    keyDate: 'tanggalSuratRekanan',
    type: 'SURAT_REKANAN',
    label: '5. Surat Permohonan Pembayaran dari Rekanan',
    stage: 'Serah Terima',
    defaultSuffix: '012/TAG',
    defaultDayOffset: 0
  },
  {
    keyNum: 'nomorBAPHP',
    keyDate: 'tanggalBAPHP',
    type: 'BAPHP',
    label: '6. BA Pemeriksaan Hasil Pekerjaan (BAPHP - 2 Hal)',
    stage: 'Serah Terima',
    defaultSuffix: '02-100',
    defaultDayOffset: 0
  },
  {
    keyNum: 'nomorBAST',
    keyDate: 'tanggalBAST',
    type: 'BAST',
    label: '7. BA Serah Terima Pertama (BASTP Penyedia ke PPK)',
    stage: 'Serah Terima',
    defaultSuffix: '02-101',
    defaultDayOffset: 0
  },
  {
    keyNum: 'nomorBAST_PA',
    keyDate: 'tanggalBAST_PA',
    type: 'BAST_PA',
    label: '8. BAST PPK ke Pengguna Anggaran (PA/KPA)',
    stage: 'Serah Terima',
    defaultSuffix: '02-101.A',
    defaultDayOffset: 2
  },
  {
    keyNum: 'nomorBAP',
    keyDate: 'tanggalBAP',
    type: 'BAP',
    label: '9. BA Pembayaran (BAP 100% / Termin)',
    stage: 'Pencairan Kasda',
    defaultSuffix: '02-102',
    defaultDayOffset: 2
  },
  {
    keyNum: 'nomorKuitansi',
    keyDate: 'tanggalKuitansi',
    type: 'KUITANSI',
    label: '10. Kuitansi Dinas Bermeterai Rp 10.000',
    stage: 'Pencairan Kasda',
    defaultSuffix: 'KWT-01',
    defaultDayOffset: 2
  },
  {
    keyNum: 'nomorChecklist',
    keyDate: 'tanggalChecklist',
    type: 'CHECKLIST',
    label: '11. Lembar Verifikasi Kelengkapan Dokumen SPP-LS',
    stage: 'Pencairan Kasda',
    defaultSuffix: 'VERIF-01',
    defaultDayOffset: 2
  },
  {
    keyNum: 'nomorBAST_FHO',
    keyDate: 'tanggalBAST_FHO',
    type: 'BAST_FHO',
    label: '12. BAST Akhir (FHO) & Pengembalian Retensi 5%',
    stage: 'Pencairan Kasda',
    defaultSuffix: '02-FHO',
    defaultDayOffset: 180 // after 6 months maintenance
  }
];

function recalculateTerminList(
  termins: PaymentTermin[], 
  nilaiSPK: number, 
  persenUM: number = 0, 
  persenRetensi: number = 5,
  jenisPekerjaan: string = 'Fisik / Konstruksi'
): PaymentTermin[] {
  let kumulatif = 0;
  const totalUM = Math.round(nilaiSPK * (persenUM / 100));
  const pphPercent = jenisPekerjaan === 'Fisik / Konstruksi' ? 2.65 : 2.0;

  return termins.map((t, idx) => {
    kumulatif += Number(t.bobotPersen) || 0;
    const bruto = Math.round(nilaiSPK * ((Number(t.bobotPersen) || 0) / 100));
    const potUM = persenUM > 0 ? Math.round(totalUM * ((Number(t.bobotPersen) || 0) / 100)) : 0;
    const potRet = persenRetensi > 0 ? Math.round(bruto * (persenRetensi / 100)) : 0;
    const pph = Math.round(bruto * (pphPercent / 100));
    const netto = bruto - potUM - potRet - pph;

    return {
      ...t,
      nomorTermin: idx + 1,
      bobotKumulatif: Math.round(kumulatif * 100) / 100,
      nilaiBruto: bruto,
      potonganUangMuka: potUM,
      potonganRetensi: potRet,
      pphNilai: pph,
      nilaiNetto: netto
    };
  });
}

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialProject,
  officersList,
  contractorsList
}) => {
  const [formData, setFormData] = useState<Partial<ProjectContract>>({
    id: '',
    kodePaket: '',
    namaPaket: '',
    jenisPekerjaan: 'Perencanaan',
    lokasi: '',
    kabupatenKota: 'Kota Tarakan',
    program: 'PROGRAM PENGELOLAAN PENDIDIKAN',
    kegiatan: 'PENGELOLAAN PENDIDIKAN SEKOLAH MENENGAH ATAS',
    subKegiatan: '',
    nomorDPA: 'DPA/A.1/1.01.2.22.0.00.01.0000/001/2026',
    sumberDana: 'APBD PROVINSI KALIMANTAN UTARA',
    tahunAnggaran: 2026,
    nomorSPK: '',
    tanggalSPK: new Date().toISOString().split('T')[0],
    nilaiSPK: 0,
    jangkaWaktuHari: 30,
    tipeHari: 'Hari Kalender',
    tanggalMulai: new Date().toISOString().split('T')[0],
    tanggalSelesai: '',
    nomorBAPHP: '',
    tanggalBAPHP: '',
    nomorBAST: '',
    tanggalBAST: '',
    nomorBAST_PA: '',
    tanggalBAST_PA: '',
    nomorBAP: '',
    tanggalBAP: '',
    nomorBAKP: '',
    tanggalBAKP: '',
    nomorBA_STL: '',
    tanggalBA_STL: '',
    nomorBA_MC0: '',
    tanggalBA_MC0: '',
    nomorBA_UM: '',
    tanggalBA_UM: '',
    nomorBAST_FHO: '',
    tanggalBAST_FHO: '',
    nomorKuitansi: '',
    tanggalKuitansi: '',
    nomorSuratRekanan: '',
    tanggalSuratRekanan: '',
    nomorChecklist: '',
    tanggalChecklist: '',
    selectedDocTypes: ['BAPHP', 'BAST', 'BAST_PA', 'BAP', 'BAKP', 'BA_STL', 'KUITANSI', 'CHECKLIST', 'SURAT_REKANAN'],
    statusVerifikasi: 'draf',
    catatanPemeriksaan: ''
  });

  const [selectedPPKId, setSelectedPPKId] = useState<string>('');
  const [selectedPPTKId, setSelectedPPTKId] = useState<string>('');
  const [selectedPAKPAId, setSelectedPAKPAId] = useState<string>('');
  const [selectedContractorId, setSelectedContractorId] = useState<string>('');
  const [baseAgendaNumber, setBaseAgendaNumber] = useState<string>('02-100');
  const [activeDocFilter, setActiveDocFilter] = useState<'all' | 'Awal Kontrak' | 'Pelaksanaan' | 'Serah Terima' | 'Pencairan Kasda'>('all');

  useEffect(() => {
    if (initialProject) {
      setFormData(initialProject);
      setSelectedPPKId(initialProject.ppk.id);
      setSelectedPPTKId(initialProject.pptk.id);
      if (initialProject.paKpa) setSelectedPAKPAId(initialProject.paKpa.id);
      setSelectedContractorId(initialProject.penyedia.id);
    } else {
      const defaultPPK = officersList.find(o => o.role === 'PPK') || officersList[0];
      const defaultPPTK = officersList.find(o => o.role === 'PPTK') || officersList[1];
      const defaultPA = officersList.find(o => o.role === 'PA_KPA') || officersList[2] || officersList[0];
      const defaultContractor = contractorsList[0];

      const newId = 'proj-' + Date.now();
      const today = new Date().toISOString().split('T')[0];
      
      const endDateObj = new Date();
      endDateObj.setDate(endDateObj.getDate() + 30);
      const endDate = endDateObj.toISOString().split('T')[0];

      const endPlus2Obj = new Date(endDateObj);
      endPlus2Obj.setDate(endPlus2Obj.getDate() + 2);
      const endPlus2 = endPlus2Obj.toISOString().split('T')[0];

      setFormData({
        id: newId,
        kodePaket: `DIKBUD-PAKET-${Math.floor(100 + Math.random() * 900)}`,
        namaPaket: '',
        jenisPekerjaan: 'Perencanaan',
        lokasi: 'SMAN 5 Tarakan',
        kabupatenKota: 'Kota Tarakan',
        program: 'PROGRAM PENGELOLAAN PENDIDIKAN',
        kegiatan: 'PENGELOLAAN PENDIDIKAN SEKOLAH MENENGAH ATAS',
        subKegiatan: 'Penyusunan Perencanaan Prasarana Sekolah',
        nomorDPA: 'DPA/A.1/1.01.2.22.0.00.01.0000/001/2026',
        sumberDana: 'APBD PROVINSI KALIMANTAN UTARA',
        tahunAnggaran: 2026,
        nomorSPK: '000.4.3/64514226/PPK-SPK-PL/DIKBUD/V/2026',
        tanggalSPK: today,
        nilaiSPK: 99911544,
        jangkaWaktuHari: 30,
        tipeHari: 'Hari Kalender',
        tanggalMulai: today,
        tanggalSelesai: endDate,
        nomorBAPHP: '000.4.3/64514226/02-100/DISDIKBUD/KU/VI/2026',
        tanggalBAPHP: endDate,
        nomorBAST: '000.4.3/64514226/02-101/DISDIKBUD/KU/VI/2026',
        tanggalBAST: endDate,
        nomorBAST_PA: '000.4.3/64514226/02-101.A/DISDIKBUD/KU/VI/2026',
        tanggalBAST_PA: endPlus2,
        nomorBAP: '000.4.3/64514226/02-102/DISDIKBUD/KU/VI/2026',
        tanggalBAP: endPlus2,
        nomorBAKP: '000.4.3/64514226/02-103/DISDIKBUD/KU/VI/2026',
        tanggalBAKP: endDate,
        nomorBA_STL: '000.4.3/64514226/02-098/DISDIKBUD/KU/V/2026',
        tanggalBA_STL: today,
        nomorBA_MC0: '000.4.3/64514226/02-099/DISDIKBUD/KU/V/2026',
        tanggalBA_MC0: today,
        nomorBA_UM: '000.4.3/64514226/02-UM/DISDIKBUD/KU/V/2026',
        tanggalBA_UM: today,
        nomorBAST_FHO: '000.4.3/64514226/02-FHO/DISDIKBUD/KU/XII/2026',
        tanggalBAST_FHO: '',
        nomorKuitansi: '000.4.3/64514226/KWT-01/DISDIKBUD/VI/2026',
        tanggalKuitansi: endPlus2,
        nomorSuratRekanan: '012/TAG-KONTRAK/CV/VI/2026',
        tanggalSuratRekanan: endDate,
        nomorChecklist: '000.4.3/64514226/VERIF-01/DISDIKBUD/VI/2026',
        tanggalChecklist: endPlus2,
        selectedDocTypes: ['BAPHP', 'BAST', 'BAST_PA', 'BAP', 'BAKP', 'BA_STL', 'KUITANSI', 'CHECKLIST', 'SURAT_REKANAN'],
        statusVerifikasi: 'draf'
      });

      if (defaultPPK) setSelectedPPKId(defaultPPK.id);
      if (defaultPPTK) setSelectedPPTKId(defaultPPTK.id);
      if (defaultPA) setSelectedPAKPAId(defaultPA.id);
      if (defaultContractor) setSelectedContractorId(defaultContractor.id);
    }
  }, [initialProject, isOpen, officersList, contractorsList]);

  // Handler auto-generate dan mengurutkan nomor dari buku agenda dinas untuk SEMUA dokumen
  const handleAutoSequenceAgenda = () => {
    const spk = formData.nomorSPK || '000.4.3/64514226/PPK-SPK-PL/DIKBUD/V/2026';
    const parts = spk.split('/');
    const prefix = `${parts[0] || '000.4.3'}/${parts[1] || '64514226'}`;
    const year = formData.tahunAnggaran || 2026;

    const match = baseAgendaNumber.match(/\d+$/);
    const startNum = match ? parseInt(match[0]) : 100;

    const startDate = formData.tanggalMulai || formData.tanggalSPK || new Date().toISOString().split('T')[0];
    const endDate = formData.tanggalSelesai || formData.tanggalBAPHP || new Date().toISOString().split('T')[0];

    const dEnd = new Date(endDate + 'T00:00:00');
    const dPlus2 = new Date(dEnd);
    dPlus2.setDate(dPlus2.getDate() + 2);
    const datePlus2 = dPlus2.toISOString().split('T')[0];

    setFormData(prev => ({
      ...prev,
      nomorBA_STL: `${prefix}/02-${startNum - 2}/DISDIKBUD/KU/V/${year}`,
      tanggalBA_STL: startDate,

      nomorBA_MC0: `${prefix}/02-${startNum - 1}/DISDIKBUD/KU/V/${year}`,
      tanggalBA_MC0: startDate,

      nomorBAKP: `${prefix}/02-${startNum + 3}/DISDIKBUD/KU/VI/${year}`,
      tanggalBAKP: endDate,

      nomorSuratRekanan: `012/TAG-KONTRAK/CV/VI/${year}`,
      tanggalSuratRekanan: endDate,

      nomorBAPHP: `${prefix}/02-${startNum}/DISDIKBUD/KU/VI/${year}`,
      tanggalBAPHP: endDate,

      nomorBAST: `${prefix}/02-${startNum + 1}/DISDIKBUD/KU/VI/${year}`,
      tanggalBAST: endDate,

      nomorBAST_PA: `${prefix}/02-${startNum + 1}.A/DISDIKBUD/KU/VI/${year}`,
      tanggalBAST_PA: datePlus2,

      nomorBAP: `${prefix}/02-${startNum + 2}/DISDIKBUD/KU/VI/${year}`,
      tanggalBAP: datePlus2,

      nomorKuitansi: `${prefix}/KWT-${startNum}/DISDIKBUD/VI/${year}`,
      tanggalKuitansi: datePlus2,

      nomorChecklist: `${prefix}/VERIF-${startNum}/DISDIKBUD/VI/${year}`,
      tanggalChecklist: datePlus2
    }));
  };

  const handleToggleDoc = (docType: DocumentType) => {
    const current = formData.selectedDocTypes || [];
    if (current.includes(docType)) {
      setFormData({ ...formData, selectedDocTypes: current.filter(d => d !== docType) });
    } else {
      setFormData({ ...formData, selectedDocTypes: [...current, docType] });
    }
  };

  const handleSelectAllDocs = () => {
    setFormData({
      ...formData,
      selectedDocTypes: ALL_DOCUMENTS_CONFIG.map(d => d.type)
    });
  };

  const handleDurationChange = (days: number, startDateStr?: string) => {
    const start = startDateStr || formData.tanggalMulai || formData.tanggalSPK;
    if (!start) return;

    const date = new Date(start + 'T00:00:00');
    if (!isNaN(date.getTime())) {
      date.setDate(date.getDate() + days);
      const calculatedEnd = date.toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        jangkaWaktuHari: days,
        tanggalSelesai: calculatedEnd,
        tanggalBAPHP: calculatedEnd,
        tanggalBAST: calculatedEnd,
        tanggalBAST_PA: calculatedEnd,
        tanggalBAP: calculatedEnd,
        tanggalKuitansi: calculatedEnd
      }));
    }
  };

  const handleSetPaymentScheme = (scheme: 'sekaligus' | 'termin') => {
    if (scheme === 'termin') {
      const existing = formData.daftarTermin && formData.daftarTermin.length >= 2 
        ? formData.daftarTermin 
        : [
            {
              id: 'term-1',
              nomorTermin: 1,
              namaTermin: 'Termin I (35%)',
              bobotPersen: 35,
              bobotKumulatif: 35,
              nilaiBruto: 0,
              potonganUangMuka: 0,
              potonganRetensi: 0,
              pphNilai: 0,
              nilaiNetto: 0,
              status: 'diajukan' as const
            },
            {
              id: 'term-2',
              nomorTermin: 2,
              namaTermin: 'Termin II (70%)',
              bobotPersen: 35,
              bobotKumulatif: 70,
              nilaiBruto: 0,
              potonganUangMuka: 0,
              potonganRetensi: 0,
              pphNilai: 0,
              nilaiNetto: 0,
              status: 'draf' as const
            },
            {
              id: 'term-3',
              nomorTermin: 3,
              namaTermin: 'Termin III / Pelunasan (100%)',
              bobotPersen: 30,
              bobotKumulatif: 100,
              nilaiBruto: 0,
              potonganUangMuka: 0,
              potonganRetensi: 0,
              pphNilai: 0,
              nilaiNetto: 0,
              status: 'draf' as const
            }
          ];
      const recalculated = recalculateTerminList(
        existing, 
        formData.nilaiSPK || 0, 
        formData.persenUangMuka ?? 20, 
        formData.retensiPersen ?? 5,
        formData.jenisPekerjaan
      );
      setFormData(prev => ({
        ...prev,
        skemaPembayaran: 'termin',
        persenUangMuka: prev.persenUangMuka ?? 20,
        retensiPersen: prev.retensiPersen ?? 5,
        daftarTermin: recalculated,
        activeTerminIndex: prev.activeTerminIndex ?? 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        skemaPembayaran: 'sekaligus'
      }));
    }
  };

  const handleApplyPresetTermin = (count: number) => {
    let weights: number[] = [];
    if (count === 2) weights = [50, 50];
    else if (count === 3) weights = [35, 35, 30];
    else if (count === 4) weights = [25, 25, 25, 25];
    else if (count === 5) weights = [20, 20, 20, 20, 20];
    else if (count === 6) weights = [15, 15, 20, 20, 15, 15];

    let cum = 0;
    const baseList: PaymentTermin[] = weights.map((w, idx) => {
      cum += w;
      const isLast = idx === weights.length - 1;
      const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][idx] || `${idx + 1}`;
      return {
        id: `term-${idx + 1}-${Date.now()}`,
        nomorTermin: idx + 1,
        namaTermin: `Termin ${roman}${isLast ? ' / Pelunasan' : ''} (${cum}%)`,
        bobotPersen: w,
        bobotKumulatif: cum,
        nilaiBruto: 0,
        potonganUangMuka: 0,
        potonganRetensi: 0,
        pphNilai: 0,
        nilaiNetto: 0,
        status: (idx === 0 ? 'diajukan' : 'draf') as any
      };
    });

    const recalculated = recalculateTerminList(
      baseList, 
      formData.nilaiSPK || 0, 
      formData.persenUangMuka ?? 20, 
      formData.retensiPersen ?? 5,
      formData.jenisPekerjaan
    );

    setFormData(prev => ({
      ...prev,
      skemaPembayaran: 'termin',
      daftarTermin: recalculated,
      activeTerminIndex: 0
    }));
  };

  const handleAddTermin = () => {
    const list = formData.daftarTermin || [];
    const nextNum = list.length + 1;
    const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][nextNum - 1] || `${nextNum}`;
    const newTerm: PaymentTermin = {
      id: `term-${nextNum}-${Date.now()}`,
      nomorTermin: nextNum,
      namaTermin: `Termin ${roman} (Tahap Baru)`,
      bobotPersen: 10,
      bobotKumulatif: 100,
      nilaiBruto: 0,
      potonganUangMuka: 0,
      potonganRetensi: 0,
      pphNilai: 0,
      nilaiNetto: 0,
      status: 'draf'
    };
    const newList = [...list, newTerm];
    const recalculated = recalculateTerminList(
      newList, 
      formData.nilaiSPK || 0, 
      formData.persenUangMuka ?? 0, 
      formData.retensiPersen ?? 5,
      formData.jenisPekerjaan
    );
    setFormData(prev => ({
      ...prev,
      daftarTermin: recalculated
    }));
  };

  const handleRemoveTermin = (index: number) => {
    const list = formData.daftarTermin || [];
    if (list.length <= 1) return;
    const newList = list.filter((_, i) => i !== index);
    const recalculated = recalculateTerminList(
      newList, 
      formData.nilaiSPK || 0, 
      formData.persenUangMuka ?? 0, 
      formData.retensiPersen ?? 5,
      formData.jenisPekerjaan
    );
    setFormData(prev => ({
      ...prev,
      daftarTermin: recalculated,
      activeTerminIndex: Math.min(prev.activeTerminIndex || 0, newList.length - 1)
    }));
  };

  const handleUpdateTerminField = (index: number, field: keyof PaymentTermin, val: any) => {
    const list = [...(formData.daftarTermin || [])];
    if (!list[index]) return;
    list[index] = { ...list[index], [field]: val };
    
    let updatedList = list;
    if (field === 'bobotPersen') {
      updatedList = recalculateTerminList(
        list, 
        formData.nilaiSPK || 0, 
        formData.persenUangMuka ?? 0, 
        formData.retensiPersen ?? 5,
        formData.jenisPekerjaan
      );
    }
    setFormData(prev => ({
      ...prev,
      daftarTermin: updatedList
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const ppk = officersList.find(o => o.id === selectedPPKId) || officersList[0];
    const pptk = officersList.find(o => o.id === selectedPPTKId) || officersList[1];
    const paKpa = officersList.find(o => o.id === selectedPAKPAId) || officersList.find(o => o.role === 'PA_KPA');
    const penyedia = contractorsList.find(c => c.id === selectedContractorId) || contractorsList[0];

    const finalProject: ProjectContract = {
      ...formData as ProjectContract,
      id: formData.id || 'proj-' + Date.now(),
      ppk,
      pptk,
      paKpa,
      penyedia,
      updatedAt: new Date().toISOString()
    };

    onSave(finalProject);
    onClose();
  };

  const filteredDocConfigs = ALL_DOCUMENTS_CONFIG.filter(cfg => {
    if (activeDocFilter === 'all') return true;
    return cfg.stage === activeDocFilter;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {initialProject ? 'Edit Data Kontrak & Seluruh Berita Acara' : 'Tambah Paket Proyek & Kontrak Baru'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola nomor dan tanggal untuk seluruh dokumen Berita Acara (12 jenis dokumen) secara independen.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs">
          {/* Section 1: Informasi Paket Pekerjaan */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b pb-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>1. Identitas Paket & Lokasi Pekerjaan</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="font-semibold text-slate-700 block mb-1">
                  Nama Paket Pekerjaan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Perencanaan Pembangunan Siring dan Semenisasi Jalan Masuk Sekolah"
                  value={formData.namaPaket || ''}
                  onChange={(e) => setFormData({ ...formData, namaPaket: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Jenis Pekerjaan *
                </label>
                <select
                  value={formData.jenisPekerjaan}
                  onChange={(e) => setFormData({ ...formData, jenisPekerjaan: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                >
                  <option value="Perencanaan">Perencanaan (Konsultan)</option>
                  <option value="Pengawasan">Pengawasan Teknis</option>
                  <option value="Fisik / Konstruksi">Fisik / Konstruksi</option>
                  <option value="Pengadaan Sarana">Pengadaan Barang / Sarana</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Lokasi Pekerjaan / Sekolah *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: SMAN 5 Tarakan"
                  value={formData.lokasi || ''}
                  onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Kabupaten / Kota
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kota Tarakan"
                  value={formData.kabupatenKota || ''}
                  onChange={(e) => setFormData({ ...formData, kabupatenKota: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Kode / Register Paket
                </label>
                <input
                  type="text"
                  placeholder="DIKBUD-2026-001"
                  value={formData.kodePaket || ''}
                  onChange={(e) => setFormData({ ...formData, kodePaket: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Program & Anggaran */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b pb-1.5">
              <Building className="w-3.5 h-3.5 text-blue-600" />
              <span>2. Program & Sumber Anggaran</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Program</label>
                <input
                  type="text"
                  value={formData.program || ''}
                  onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg uppercase"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Kegiatan</label>
                <input
                  type="text"
                  value={formData.kegiatan || ''}
                  onChange={(e) => setFormData({ ...formData, kegiatan: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg uppercase"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Sumber Dana</label>
                <input
                  type="text"
                  value={formData.sumberDana || ''}
                  onChange={(e) => setFormData({ ...formData, sumberDana: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tahun Anggaran</label>
                  <input
                    type="number"
                    value={formData.tahunAnggaran || 2026}
                    onChange={(e) => setFormData({ ...formData, tahunAnggaran: parseInt(e.target.value) || 2026 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nomor DPA-SKPD</label>
                  <input
                    type="text"
                    value={formData.nomorDPA || ''}
                    onChange={(e) => setFormData({ ...formData, nomorDPA: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-[11px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Data Kontrak SPK & Nilai */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b pb-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>3. Data Kontrak (SPK) & Waktu Pelaksanaan</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="font-semibold text-slate-700 block mb-1">
                  Nomor SPK / Kontrak *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nomorSPK || ''}
                  onChange={(e) => setFormData({ ...formData, nomorSPK: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-[11.5px]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Tanggal SPK *
                </label>
                <input
                  type="date"
                  required
                  value={formData.tanggalSPK || ''}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    setFormData({ ...formData, tanggalSPK: newDate, tanggalMulai: newDate });
                    handleDurationChange(formData.jangkaWaktuHari || 30, newDate);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              {/* Nilai SPK & Terbilang */}
              <div className="md:col-span-3 bg-blue-50/60 p-3.5 rounded-xl border border-blue-100">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-blue-900 block mb-1">
                      Nilai Kontrak / SPK (Rp) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.nilaiSPK || ''}
                      onChange={(e) => setFormData({ ...formData, nilaiSPK: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg bg-white font-mono font-bold text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2 flex flex-col justify-center">
                    <span className="text-[10px] uppercase font-bold text-blue-800">
                      Konversi Ejaan Terbilang Otomatis:
                    </span>
                    <p className="text-xs font-semibold text-blue-950 italic mt-0.5">
                      {terbilangRupiah(formData.nilaiSPK || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Jangka Waktu (Hari)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={formData.jangkaWaktuHari || 30}
                    onChange={(e) => {
                      const days = parseInt(e.target.value) || 30;
                      handleDurationChange(days);
                    }}
                    className="w-24 px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                  <select
                    value={formData.tipeHari}
                    onChange={(e) => setFormData({ ...formData, tipeHari: e.target.value as any })}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Hari Kalender">Hari Kalender</option>
                    <option value="Hari Kerja">Hari Kerja</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={formData.tanggalMulai || ''}
                  onChange={(e) => {
                    const newStart = e.target.value;
                    setFormData({ ...formData, tanggalMulai: newStart });
                    handleDurationChange(formData.jangkaWaktuHari || 30, newStart);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Tanggal Selesai Kontrak
                </label>
                <input
                  type="date"
                  value={formData.tanggalSelesai || ''}
                  onChange={(e) => setFormData({ ...formData, tanggalSelesai: e.target.value, tanggalBAPHP: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Section 3.B: Skema Pembayaran & Konfigurasi Multi-Termin (Perpres No. 12/2021 Pasal 53) */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <div>
                <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-blue-600" />
                  <span>3.B Skema Pembayaran & Multi-Termin (Perpres 12/2021 Pasal 53)</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Mendukung pembayaran 100% sekaligus maupun bertahap (2, 3, 4, 5, atau lebih termin) sesuai SSKK.
                </p>
              </div>

              {/* Toggle Scheme */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleSetPaymentScheme('sekaligus')}
                  className={`px-3 py-1.5 rounded-md font-semibold text-[11px] transition-colors cursor-pointer ${
                    formData.skemaPembayaran !== 'termin'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Sekaligus (100%)
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPaymentScheme('termin')}
                  className={`px-3 py-1.5 rounded-md font-semibold text-[11px] transition-colors cursor-pointer ${
                    formData.skemaPembayaran === 'termin'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Termin Bertahap (Multi-Termin)
                </button>
              </div>
            </div>

            {formData.skemaPembayaran === 'termin' && (
              <div className="space-y-4 pt-1">
                {/* Uang Muka, Retensi & Presets Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-3 rounded-lg border border-slate-200 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Uang Muka Kerja (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={formData.persenUangMuka ?? 20}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        const recalculated = recalculateTerminList(
                          formData.daftarTermin || [], 
                          formData.nilaiSPK || 0, 
                          val, 
                          formData.retensiPersen ?? 5,
                          formData.jenisPekerjaan
                        );
                        setFormData({ ...formData, persenUangMuka: val, daftarTermin: recalculated });
                      }}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Maks. 30% Usaha Kecil</span>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Retensi Pemeliharaan (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={formData.retensiPersen ?? 5}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        const recalculated = recalculateTerminList(
                          formData.daftarTermin || [], 
                          formData.nilaiSPK || 0, 
                          formData.persenUangMuka ?? 0, 
                          val,
                          formData.jenisPekerjaan
                        );
                        setFormData({ ...formData, retensiPersen: val, daftarTermin: recalculated });
                      }}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Standar LKPP: 5% Konstruksi</span>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-semibold text-slate-700 block mb-1">
                      Gunakan Template Tahapan Cepat:
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleApplyPresetTermin(2)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-[11px] font-medium text-slate-700 cursor-pointer"
                      >
                        2 Termin (50%-100%)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPresetTermin(3)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-[11px] font-medium text-slate-700 cursor-pointer"
                      >
                        3 Termin (35%-70%-100%)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPresetTermin(4)}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-[11px] font-medium text-blue-700 cursor-pointer"
                      >
                        4 Termin (25%-50%-75%-100%)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPresetTermin(5)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-[11px] font-medium text-slate-700 cursor-pointer"
                      >
                        5 Termin (20% Tiap Tahap)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Termin Rows Table */}
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold text-[11px]">
                        <tr>
                          <th className="p-2.5 w-12 text-center">Tahap</th>
                          <th className="p-2.5 min-w-[140px]">Nama Termin</th>
                          <th className="p-2.5 w-20 text-center">Bobot (%)</th>
                          <th className="p-2.5 w-20 text-center">Kumulatif</th>
                          <th className="p-2.5 text-right min-w-[100px]">Bruto Tagihan</th>
                          <th className="p-2.5 text-right min-w-[90px]">Pot. UM</th>
                          <th className="p-2.5 text-right min-w-[90px]">Retensi (5%)</th>
                          <th className="p-2.5 text-right min-w-[100px]">Netto Kasda</th>
                          <th className="p-2.5 min-w-[120px]">Tgl / No. BAP</th>
                          <th className="p-2.5 w-24 text-center">Status</th>
                          <th className="p-2.5 w-10 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px]">
                        {(formData.daftarTermin || []).map((t, idx) => (
                          <tr key={t.id || idx} className="hover:bg-slate-50/80">
                            <td className="p-2 text-center font-bold text-slate-600 font-mono">
                              #{t.nomorTermin}
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={t.namaTermin}
                                onChange={(e) => handleUpdateTerminField(idx, 'namaTermin', e.target.value)}
                                className="w-full px-2 py-1 border border-slate-200 rounded font-semibold text-slate-800 bg-white"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <div className="flex items-center justify-center gap-0.5">
                                <input
                                  type="number"
                                  min="1"
                                  max="100"
                                  value={t.bobotPersen}
                                  onChange={(e) => handleUpdateTerminField(idx, 'bobotPersen', parseFloat(e.target.value) || 0)}
                                  className="w-14 px-1.5 py-1 border border-slate-300 rounded font-mono text-center bg-white"
                                />
                                <span className="text-slate-400 font-bold">%</span>
                              </div>
                            </td>
                            <td className="p-2 text-center font-mono font-bold text-blue-700">
                              {t.bobotKumulatif}%
                            </td>
                            <td className="p-2 text-right font-mono text-slate-900 font-medium">
                              {formatRupiah(t.nilaiBruto)}
                            </td>
                            <td className="p-2 text-right font-mono text-red-600 text-[10.5px]">
                              {t.potonganUangMuka > 0 ? `(${formatRupiah(t.potonganUangMuka)})` : '-'}
                            </td>
                            <td className="p-2 text-right font-mono text-red-600 text-[10.5px]">
                              {t.potonganRetensi > 0 ? `(${formatRupiah(t.potonganRetensi)})` : '-'}
                            </td>
                            <td className="p-2 text-right font-mono font-bold text-emerald-700">
                              {formatRupiah(t.nilaiNetto)}
                            </td>
                            <td className="p-2 space-y-1">
                              <input
                                type="date"
                                value={t.tanggalBAP || ''}
                                onChange={(e) => handleUpdateTerminField(idx, 'tanggalBAP', e.target.value)}
                                className="w-full px-1.5 py-0.5 border border-slate-200 rounded text-[10px] bg-white"
                              />
                              <input
                                type="text"
                                placeholder="No. BAP Termin..."
                                value={t.nomorBAP || ''}
                                onChange={(e) => handleUpdateTerminField(idx, 'nomorBAP', e.target.value)}
                                className="w-full px-1.5 py-0.5 border border-slate-200 rounded text-[10px] font-mono bg-white"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <select
                                value={t.status}
                                onChange={(e) => handleUpdateTerminField(idx, 'status', e.target.value)}
                                className="text-[10px] px-1 py-1 border border-slate-200 rounded bg-white font-medium"
                              >
                                <option value="draf">Draf</option>
                                <option value="diajukan">Diajukan</option>
                                <option value="diverifikasi">Verifikasi</option>
                                <option value="cair">Cair</option>
                              </select>
                            </td>
                            <td className="p-2 text-center">
                              {(formData.daftarTermin || []).length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTermin(idx)}
                                  className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                                  title="Hapus termin ini"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Termin Footer Toolbar & Validation Status */}
                  <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <button
                      type="button"
                      onClick={handleAddTermin}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-blue-700 border border-blue-200 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs self-start"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Tambah Termin Baru (Tahap {((formData.daftarTermin || []).length + 1)})</span>
                    </button>

                    {/* Kumulatif Percentage Health */}
                    {(() => {
                      const totalBobot = (formData.daftarTermin || []).reduce((acc, curr) => acc + (Number(curr.bobotPersen) || 0), 0);
                      const isComplete = Math.round(totalBobot) === 100;

                      return (
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-semibold ${
                          isComplete 
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : 'bg-red-50 border-red-300 text-red-800'
                        }`}>
                          {isComplete ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                          )}
                          <span>
                            Total Bobot Kumulatif: <strong>{totalBobot}%</strong> {isComplete ? '(100% Sempurna & Sah Sesuai Kontrak)' : `(Selisih ${100 - totalBobot}%, wajib genap 100%)`}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: DAFTAR BERITA ACARA LENGKAP (SEMUA DOKUMEN BISA DI-EDIT!) */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-2 gap-2">
              <div>
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-blue-600" />
                  <span>4. Penomoran & Tanggal Seluruh Berita Acara ({ALL_DOCUMENTS_CONFIG.length} Dokumen Resmi)</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Setiap dokumen dapat diatur nomor surat dan tanggalnya masing-masing.
                </p>
              </div>
              
              {/* Auto Sequence Tool */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Nomor Awal Agenda (02-100)"
                  value={baseAgendaNumber}
                  onChange={(e) => setBaseAgendaNumber(e.target.value)}
                  className="w-36 px-2.5 py-1 border border-slate-300 rounded text-[11px] font-mono bg-white"
                />
                <button
                  type="button"
                  onClick={handleAutoSequenceAgenda}
                  className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                  title="Urutkan nomor dan tanggal seluruh Berita Acara dari buku agenda dinas"
                >
                  <Wand2 className="w-3 h-3" />
                  <span>Urutkan Semua Dokumen</span>
                </button>
              </div>
            </div>

            {/* Stage Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
              {(['all', 'Awal Kontrak', 'Pelaksanaan', 'Serah Terima', 'Pencairan Kasda'] as const).map((stage) => (
                <button
                  key={stage}
                  type="button"
                  onClick={() => setActiveDocFilter(stage)}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    activeDocFilter === stage
                      ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {stage === 'all' ? 'Semua Dokumen' : stage}
                </button>
              ))}
            </div>

            {/* Grid of ALL Documents */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredDocConfigs.map((docConfig) => {
                const isSelected = formData.selectedDocTypes?.includes(docConfig.type);
                const numValue = (formData[docConfig.keyNum] as string) || '';
                const dateValue = (formData[docConfig.keyDate] as string) || '';

                return (
                  <div 
                    key={docConfig.type} 
                    className={`p-3.5 border rounded-xl transition-all space-y-2.5 ${
                      isSelected 
                        ? 'border-blue-300 bg-white shadow-2xs' 
                        : 'border-slate-200 bg-slate-50/70 opacity-75'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 text-[11px]">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleDoc(docConfig.type)}
                          className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                        />
                        <span>{docConfig.label}</span>
                      </label>
                      <span className="text-[9px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {docConfig.stage}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                          Nomor Surat
                        </label>
                        <input
                          type="text"
                          placeholder="Nomor Berita Acara..."
                          value={numValue}
                          onChange={(e) => setFormData({ ...formData, [docConfig.keyNum]: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono text-[10.5px] bg-white focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                          Tanggal Surat
                        </label>
                        <input
                          type="date"
                          value={dateValue}
                          onChange={(e) => setFormData({ ...formData, [docConfig.keyDate]: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-[10.5px] bg-white focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    {/* Kolom Perhitungan Khusus BAP */}
                    {docConfig.type === 'BAP' && (
                      <div className="mt-2 pt-2 border-t border-blue-100 bg-blue-50/50 p-2.5 rounded-lg space-y-2 text-xs">
                        <div className="font-bold text-blue-900 text-[11px] flex items-center gap-1.5">
                          <Coins className="w-3.5 h-3.5 text-blue-600" />
                          <span>Rincian Nilai Pembayaran BAP:</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div>
                            <label className="text-[9.5px] text-slate-600 font-semibold block">Kemajuan Fisik (%)</label>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={formData.bapKemajuanFisikPersen ?? 100}
                              onChange={(e) => {
                                const p = parseFloat(e.target.value) || 0;
                                const bruto = Math.round((p / 100) * (formData.nilaiSPK || 0));
                                setFormData({ ...formData, bapKemajuanFisikPersen: p, bapBrutoTagihan: bruto });
                              }}
                              className="w-full px-2 py-1 border border-slate-300 rounded font-mono text-[10.5px] bg-white font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-[9.5px] text-slate-600 font-semibold block">Pot. Retensi (5%)</label>
                            <input
                              type="number"
                              placeholder="0"
                              value={formData.bapPotonganRetensiNilai ?? 0}
                              onChange={(e) => setFormData({ ...formData, bapPotonganRetensiNilai: parseFloat(e.target.value) || 0 })}
                              className="w-full px-2 py-1 border border-slate-300 rounded font-mono text-[10.5px] bg-white text-red-600 font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-[9.5px] text-slate-600 font-semibold block">Pot. Uang Muka</label>
                            <input
                              type="number"
                              placeholder="0"
                              value={formData.bapPotonganUangMuka ?? 0}
                              onChange={(e) => setFormData({ ...formData, bapPotonganUangMuka: parseFloat(e.target.value) || 0 })}
                              className="w-full px-2 py-1 border border-slate-300 rounded font-mono text-[10.5px] bg-white text-red-600 font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-[9.5px] text-slate-600 font-semibold block">Pot. PPh (Rp)</label>
                            <input
                              type="number"
                              placeholder="0"
                              value={formData.bapPotonganPPhNilai ?? Math.round((formData.nilaiSPK || 0) * (formData.jenisPekerjaan === 'Fisik / Konstruksi' ? 0.0265 : 0.02))}
                              onChange={(e) => setFormData({ ...formData, bapPotonganPPhNilai: parseFloat(e.target.value) || 0 })}
                              className="w-full px-2 py-1 border border-slate-300 rounded font-mono text-[10.5px] bg-white text-red-600 font-bold"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 5: Para Pihak Penandatangan */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b pb-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>5. Para Pihak Penandatangan (Dinas & Rekanan)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  PPK (Komitmen) *
                </label>
                <select
                  value={selectedPPKId}
                  onChange={(e) => setSelectedPPKId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  {officersList.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.nama} ({o.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  PPTK (Teknis) *
                </label>
                <select
                  value={selectedPPTKId}
                  onChange={(e) => setSelectedPPTKId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  {officersList.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.nama} ({o.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Pengguna Anggaran (PA)
                </label>
                <select
                  value={selectedPAKPAId}
                  onChange={(e) => setSelectedPAKPAId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  {officersList.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.nama} ({o.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Penyedia Jasa *
                </label>
                <select
                  value={selectedContractorId}
                  onChange={(e) => setSelectedContractorId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  {contractorsList.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.namaPerusahaan}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Perubahan ke Google Cloud</span>
          </button>
        </div>
      </div>
    </div>
  );
};
