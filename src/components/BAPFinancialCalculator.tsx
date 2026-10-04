import React, { useState, useEffect } from 'react';
import { ProjectContract } from '../types';
import { formatRupiah, terbilangRupiah } from '../utils/terbilang';
import { 
  Calculator, 
  Save, 
  RotateCcw, 
  Percent, 
  Coins, 
  CheckCircle2, 
  FileText, 
  TrendingUp, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';

interface BAPFinancialCalculatorProps {
  project: ProjectContract;
  onUpdateProject: (updated: ProjectContract) => void;
  compact?: boolean;
}

export const BAPFinancialCalculator: React.FC<BAPFinancialCalculatorProps> = ({
  project,
  onUpdateProject,
  compact = false
}) => {
  const isTermin = project.skemaPembayaran === 'termin' && Boolean(project.daftarTermin?.length);
  const activeTermin = isTermin ? (project.daftarTermin![project.activeTerminIndex ?? 0] || project.daftarTermin![0]) : null;

  const totalKontrak = project.nilaiSPK || 0;

  // Form states
  const [kemajuanFisikPersen, setKemajuanFisikPersen] = useState<number>(() => {
    return project.bapKemajuanFisikPersen ?? (activeTermin ? activeTermin.bobotKumulatif : 100);
  });

  const [brutoTagihan, setBrutoTagihan] = useState<number>(() => {
    return project.bapBrutoTagihan ?? (activeTermin ? activeTermin.nilaiBruto : totalKontrak);
  });

  const [potonganUangMuka, setPotonganUangMuka] = useState<number>(() => {
    return project.bapPotonganUangMuka ?? (activeTermin ? activeTermin.potonganUangMuka : 0);
  });

  const [retensiPersen, setRetensiPersen] = useState<number>(() => {
    return project.bapPotonganRetensiPersen ?? (activeTermin && activeTermin.potonganRetensi > 0 ? 5 : 0);
  });

  const [retensiNilai, setRetensiNilai] = useState<number>(() => {
    return project.bapPotonganRetensiNilai ?? (activeTermin ? activeTermin.potonganRetensi : 0);
  });

  const [pphPersen, setPphPersen] = useState<number>(() => {
    return project.bapPotonganPPhPersen ?? (project.jenisPekerjaan === 'Fisik / Konstruksi' ? 2.65 : 2.0);
  });

  const [pphNilai, setPphNilai] = useState<number>(() => {
    return project.bapPotonganPPhNilai ?? Math.round(brutoTagihan * (pphPersen / 100));
  });

  const [potonganLainnya, setPotonganLainnya] = useState<number>(() => {
    return project.bapPotonganLainnya ?? 0;
  });

  // Calculate values
  const nilaiPrestasiFisik = Math.round((kemajuanFisikPersen / 100) * totalKontrak);
  const totalPotongan = potonganUangMuka + retensiNilai + pphNilai + potonganLainnya;
  const nettoDiterima = Math.max(0, brutoTagihan - totalPotongan);

  // Synchronize when project props change
  useEffect(() => {
    if (project.bapKemajuanFisikPersen !== undefined) {
      setKemajuanFisikPersen(project.bapKemajuanFisikPersen);
    }
    if (project.bapBrutoTagihan !== undefined) {
      setBrutoTagihan(project.bapBrutoTagihan);
    }
    if (project.bapPotonganUangMuka !== undefined) {
      setPotonganUangMuka(project.bapPotonganUangMuka);
    }
    if (project.bapPotonganRetensiPersen !== undefined) {
      setRetensiPersen(project.bapPotonganRetensiPersen);
    }
    if (project.bapPotonganRetensiNilai !== undefined) {
      setRetensiNilai(project.bapPotonganRetensiNilai);
    }
    if (project.bapPotonganPPhPersen !== undefined) {
      setPphPersen(project.bapPotonganPPhPersen);
    }
    if (project.bapPotonganPPhNilai !== undefined) {
      setPphNilai(project.bapPotonganPPhNilai);
    }
  }, [project.id]);

  // Recalculate helper
  const handleFisikPersenChange = (persen: number) => {
    setKemajuanFisikPersen(persen);
    // If not manually customized, default bruto to progress
    const newBruto = Math.round((persen / 100) * totalKontrak);
    setBrutoTagihan(newBruto);

    const newRetensi = retensiPersen > 0 ? Math.round(newBruto * (retensiPersen / 100)) : 0;
    setRetensiNilai(newRetensi);

    const newPPh = Math.round(newBruto * (pphPersen / 100));
    setPphNilai(newPPh);

    saveCalculatedValues({
      bapKemajuanFisikPersen: persen,
      bapBrutoTagihan: newBruto,
      bapPotonganRetensiNilai: newRetensi,
      bapPotonganPPhNilai: newPPh,
      bapNilaiNetto: Math.max(0, newBruto - (potonganUangMuka + newRetensi + newPPh + potonganLainnya))
    });
  };

  const handleBrutoChange = (val: number) => {
    setBrutoTagihan(val);
    const newRetensi = retensiPersen > 0 ? Math.round(val * (retensiPersen / 100)) : 0;
    setRetensiNilai(newRetensi);
    const newPPh = Math.round(val * (pphPersen / 100));
    setPphNilai(newPPh);

    saveCalculatedValues({
      bapBrutoTagihan: val,
      bapPotonganRetensiNilai: newRetensi,
      bapPotonganPPhNilai: newPPh,
      bapNilaiNetto: Math.max(0, val - (potonganUangMuka + newRetensi + newPPh + potonganLainnya))
    });
  };

  const handleRetensiPersenChange = (persen: number) => {
    setRetensiPersen(persen);
    const calculated = persen > 0 ? Math.round(brutoTagihan * (persen / 100)) : 0;
    setRetensiNilai(calculated);

    saveCalculatedValues({
      bapPotonganRetensiPersen: persen,
      bapPotonganRetensiNilai: calculated,
      bapNilaiNetto: Math.max(0, brutoTagihan - (potonganUangMuka + calculated + pphNilai + potonganLainnya))
    });
  };

  const handlePPhPersenChange = (persen: number) => {
    setPphPersen(persen);
    const calculated = Math.round(brutoTagihan * (persen / 100));
    setPphNilai(calculated);

    saveCalculatedValues({
      bapPotonganPPhPersen: persen,
      bapPotonganPPhNilai: calculated,
      bapNilaiNetto: Math.max(0, brutoTagihan - (potonganUangMuka + retensiNilai + calculated + potonganLainnya))
    });
  };

  const handlePotonganUMChange = (val: number) => {
    setPotonganUangMuka(val);
    saveCalculatedValues({
      bapPotonganUangMuka: val,
      bapNilaiNetto: Math.max(0, brutoTagihan - (val + retensiNilai + pphNilai + potonganLainnya))
    });
  };

  const saveCalculatedValues = (partial: Partial<ProjectContract>) => {
    const updated: ProjectContract = {
      ...project,
      ...partial,
      updatedAt: new Date().toISOString()
    };
    onUpdateProject(updated);
  };

  const handleResetTo100Percent = () => {
    const defaultPPh = project.jenisPekerjaan === 'Fisik / Konstruksi' ? 2.65 : 2.0;
    const defaultBruto = totalKontrak;
    const defaultPPhNilai = Math.round(defaultBruto * (defaultPPh / 100));
    
    setKemajuanFisikPersen(100);
    setBrutoTagihan(defaultBruto);
    setPotonganUangMuka(0);
    setRetensiPersen(0);
    setRetensiNilai(0);
    setPphPersen(defaultPPh);
    setPphNilai(defaultPPhNilai);
    setPotonganLainnya(0);

    saveCalculatedValues({
      bapKemajuanFisikPersen: 100,
      bapBrutoTagihan: defaultBruto,
      bapPotonganUangMuka: 0,
      bapPotonganRetensiPersen: 0,
      bapPotonganRetensiNilai: 0,
      bapPotonganPPhPersen: defaultPPh,
      bapPotonganPPhNilai: defaultPPhNilai,
      bapPotonganLainnya: 0,
      bapNilaiNetto: defaultBruto - defaultPPhNilai
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Header */}
      <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-600 text-white">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs">Kalkulator Rincian Keuangan BAP</h3>
            <p className="text-[10px] text-slate-300">
              Perhitungan Otomatis Nilai Kontrak, Prestasi Fisik, Potongan & Netto Transfer
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleResetTo100Percent}
          className="text-[10px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
          title="Reset ke Pelunasan 100%"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset 100%</span>
        </button>
      </div>

      <div className="p-4 space-y-4 text-xs">
        {/* Input Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* 1. Nilai Total Kontrak (Read-Only) */}
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              1. Nilai Total Kontrak / SPK (Pagu SPK)
            </label>
            <div className="font-mono font-bold text-slate-900 text-sm">
              {formatRupiah(totalKontrak)}
            </div>
            <span className="text-[10px] text-slate-400">Sesuai nominal Surat Perintah Kerja</span>
          </div>

          {/* 2. Prestasi Kemajuan Fisik Kumulatif */}
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-700">
                2. Prestasi Kemajuan Fisik Kumulatif (%)
              </label>
              <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs">
                {kemajuanFisikPersen}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={kemajuanFisikPersen}
                onChange={(e) => handleFisikPersenChange(parseFloat(e.target.value))}
                className="flex-1"
              />
              <input
                type="number"
                min="1"
                max="100"
                value={kemajuanFisikPersen}
                onChange={(e) => handleFisikPersenChange(parseFloat(e.target.value) || 0)}
                className="w-16 px-2 py-1 border border-slate-300 rounded font-mono text-center font-bold text-xs"
              />
            </div>
            <div className="text-[10.5px] text-slate-500 font-mono">
              = {formatRupiah(nilaiPrestasiFisik)}
            </div>
          </div>

          {/* 3. Jumlah Bruto Tagihan */}
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <label className="text-[11px] font-semibold text-slate-700 block">
              3. Jumlah Bruto Tagihan Termin / Pembayaran (Rp)
            </label>
            <input
              type="number"
              value={brutoTagihan}
              onChange={(e) => handleBrutoChange(parseFloat(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-bold text-slate-900 text-xs"
            />
            <span className="text-[10px] text-slate-400">
              {formatRupiah(brutoTagihan)}
            </span>
          </div>

          {/* 4. Potongan Pengembalian Uang Muka */}
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <label className="text-[11px] font-semibold text-slate-700 block">
              4. Potongan Angsuran Pengembalian Uang Muka (Rp)
            </label>
            <input
              type="number"
              value={potonganUangMuka}
              onChange={(e) => handlePotonganUMChange(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-bold text-red-600 text-xs"
            />
            <span className="text-[10px] text-slate-400">
              Isi jika terdapat potongan angsuran uang muka
            </span>
          </div>

          {/* 5. Potongan Jaminan Retensi Pemeliharaan */}
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-700">
                5. Potongan Jaminan Retensi Pemeliharaan
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleRetensiPersenChange(0)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                    retensiPersen === 0 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300'
                  }`}
                >
                  0%
                </button>
                <button
                  type="button"
                  onClick={() => handleRetensiPersenChange(5)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                    retensiPersen === 5 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300'
                  }`}
                >
                  5%
                </button>
              </div>
            </div>
            <input
              type="number"
              value={retensiNilai}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setRetensiNilai(val);
                saveCalculatedValues({
                  bapPotonganRetensiNilai: val,
                  bapNilaiNetto: Math.max(0, brutoTagihan - (potonganUangMuka + val + pphNilai + potonganLainnya))
                });
              }}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-bold text-red-600 text-xs"
            />
            <span className="text-[10px] text-slate-400">
              {retensiPersen > 0 ? `Retensi ${retensiPersen}% = ${formatRupiah(retensiNilai)}` : 'Tidak ada potongan retensi'}
            </span>
          </div>

          {/* 6. Potongan Pajak Penghasilan (PPh) */}
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-700">
                6. Potongan PPh (Pajak Penghasilan)
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handlePPhPersenChange(2.65)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                    pphPersen === 2.65 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300'
                  }`}
                  title="PPh Konstruksi Usaha Kecil (2.65%)"
                >
                  2.65%
                </button>
                <button
                  type="button"
                  onClick={() => handlePPhPersenChange(2.0)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                    pphPersen === 2.0 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300'
                  }`}
                  title="PPh Jasa / Konsultan (2%)"
                >
                  2.0%
                </button>
                <button
                  type="button"
                  onClick={() => handlePPhPersenChange(1.75)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                    pphPersen === 1.75 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300'
                  }`}
                  title="PPh Konstruksi Menengah (1.75%)"
                >
                  1.75%
                </button>
                <button
                  type="button"
                  onClick={() => handlePPhPersenChange(0.5)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                    pphPersen === 0.5 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300'
                  }`}
                  title="PPh Final UMKM (0.5%)"
                >
                  0.5%
                </button>
              </div>
            </div>
            <input
              type="number"
              value={pphNilai}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setPphNilai(val);
                saveCalculatedValues({
                  bapPotonganPPhNilai: val,
                  bapNilaiNetto: Math.max(0, brutoTagihan - (potonganUangMuka + retensiNilai + val + potonganLainnya))
                });
              }}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-bold text-red-600 text-xs"
            />
            <span className="text-[10px] text-slate-400">
              PPh {pphPersen}% = {formatRupiah(pphNilai)}
            </span>
          </div>
        </div>

        {/* TABEL REKAP HASIL PERHITUNGAN RESMI (Sesuai Gambar User) */}
        <div className="mt-4 border border-slate-300 rounded-lg overflow-hidden shadow-xs">
          <div className="bg-slate-100 px-3 py-2 border-b border-slate-300 flex items-center justify-between">
            <span className="font-bold text-slate-800 text-xs uppercase tracking-wide">
              Uraian Rincian Pembayaran
            </span>
            <span className="font-bold text-slate-800 text-xs uppercase tracking-wide">
              Jumlah (Rupiah)
            </span>
          </div>

          <div className="divide-y divide-slate-200 text-[11.5px]">
            <div className="px-3 py-2 flex items-center justify-between hover:bg-slate-50">
              <span className="text-slate-700">1. Nilai Total Kontrak / SPK</span>
              <span className="font-mono font-bold text-slate-900">{formatRupiah(totalKontrak)}</span>
            </div>

            <div className="px-3 py-2 flex items-center justify-between hover:bg-slate-50">
              <span className="text-slate-700">2. Prestasi Kemajuan Fisik Kumulatif ({kemajuanFisikPersen}%)</span>
              <span className="font-mono font-bold text-slate-900">{formatRupiah(nilaiPrestasiFisik)}</span>
            </div>

            <div className="px-3 py-2 flex items-center justify-between bg-slate-50/70">
              <span className="font-semibold text-slate-800">
                3. Jumlah Bruto Tagihan {isTermin ? (activeTermin?.namaTermin || '') : `(Kemajuan Fisik ${kemajuanFisikPersen}%)`}
              </span>
              <span className="font-mono font-bold text-slate-900">{formatRupiah(brutoTagihan)}</span>
            </div>

            {potonganUangMuka > 0 && (
              <div className="px-3 py-2 flex items-center justify-between hover:bg-slate-50 text-red-600">
                <span>4. Potongan Angsuran Pengembalian Uang Muka</span>
                <span className="font-mono font-bold">({formatRupiah(potonganUangMuka)})</span>
              </div>
            )}

            {retensiNilai > 0 && (
              <div className="px-3 py-2 flex items-center justify-between hover:bg-slate-50 text-red-600">
                <span>5. Potongan Jaminan Retensi Pemeliharaan ({retensiPersen}%)</span>
                <span className="font-mono font-bold">({formatRupiah(retensiNilai)})</span>
              </div>
            )}

            <div className="px-3 py-2 flex items-center justify-between hover:bg-slate-50 text-red-600">
              <span>6. Potongan Pajak Penghasilan (PPh {pphPersen}%)</span>
              <span className="font-mono font-bold">({formatRupiah(pphNilai)})</span>
            </div>

            <div className="px-3 py-2.5 flex items-center justify-between bg-blue-50 border-t-2 border-slate-400">
              <span className="font-bold text-slate-900 text-xs">
                7. Jumlah Pembayaran Bersih (Netto) yang Ditransfer
              </span>
              <span className="font-mono font-extrabold text-blue-900 text-sm">
                {formatRupiah(nettoDiterima)}
              </span>
            </div>
          </div>
        </div>

        {/* Terbilang Box */}
        <div className="p-3 bg-emerald-50/80 rounded-lg border border-emerald-200 text-emerald-950 space-y-0.5">
          <span className="font-bold text-[10.5px] uppercase tracking-wider text-emerald-800 block">
            Terbilang Jumlah Pembayaran Bersih:
          </span>
          <p className="italic font-medium text-xs text-emerald-900">
            "{terbilangRupiah(nettoDiterima)}"
          </p>
        </div>
      </div>
    </div>
  );
};
