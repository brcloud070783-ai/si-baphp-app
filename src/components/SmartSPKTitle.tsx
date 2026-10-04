import React, { useState, useRef } from 'react';
import { ProjectContract } from '../types';
import { formatTanggalIndonesia, formatRupiah } from '../utils/terbilang';
import { FileText, Calendar, Clock, ShieldCheck, Hash } from 'lucide-react';

interface SmartSPKTitleProps {
  nomorSPK: string;
  tanggalSPK: string;
  project?: ProjectContract;
  showHoverCard?: boolean;
}

export const SmartSPKTitle: React.FC<SmartSPKTitleProps> = ({
  nomorSPK,
  tanggalSPK,
  project,
  showHoverCard = true
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [cardPos, setCardPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const cardWidth = 320;
      let left = rect.left;
      if (left + cardWidth > window.innerWidth - 20) {
        left = Math.max(10, window.innerWidth - cardWidth - 20);
      }
      let top = rect.bottom + 8;
      if (top + 180 > window.innerHeight) {
        top = Math.max(10, rect.top - 180);
      }
      setCardPos({ top, left });
    }
    setIsHovered(true);
  };

  const formattedDate = formatTanggalIndonesia(tanggalSPK);

  return (
    <div 
      ref={containerRef}
      className="relative group/spk cursor-pointer select-none"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Option 2: Badge Sub-Header First (Tipe Surat & Tanggal) */}
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 mb-0.5 tracking-tight">
        <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200/80 font-bold uppercase text-[9px] shrink-0 flex items-center gap-1">
          <FileText className="w-2.5 h-2.5 text-blue-600" />
          <span>SPK / Kontrak</span>
        </span>
        <span className="text-slate-300 font-normal">·</span>
        <span className="text-slate-600 font-medium flex items-center gap-1 shrink-0">
          <Calendar className="w-2.5 h-2.5 text-slate-400" />
          <span>{formattedDate}</span>
        </span>
      </div>

      {/* Option 1: Monospace SPK Number (Stable height, no layout jump) */}
      <div className="min-h-[18px]">
        <h5 
          className="font-mono font-bold text-slate-900 text-[11.5px] leading-snug group-hover/spk:text-blue-700 transition-colors truncate max-w-[220px]"
          title={nomorSPK}
        >
          {nomorSPK}
        </h5>
      </div>

      {/* Option 3: Rich Hover Popover Card (Fixed Viewport Pos, No Vibration) */}
      {showHoverCard && isHovered && (
        <div 
          style={{ top: `${cardPos.top}px`, left: `${cardPos.left}px` }}
          className="no-print fixed z-[9999] w-80 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-3.5 pointer-events-none text-xs animate-in fade-in duration-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold shrink-0 border border-blue-100">
                <Hash className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-blue-600 block">
                  Surat Perintah Kerja (SPK)
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Dokumen Utama Pengadaan</span>
              </div>
            </div>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9.5px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Valid 100%</span>
            </span>
          </div>

          {/* Details */}
          <div className="py-2.5 space-y-2 text-slate-700 text-[11px]">
            <div>
              <span className="text-[10px] text-slate-400 font-medium block">Nomor Resmi SPK:</span>
              <span className="font-mono font-bold text-slate-900 text-xs block bg-slate-50 p-1.5 rounded border border-slate-200/80 break-all select-all">
                {nomorSPK}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 font-medium block">Tanggal SPK:</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>{formattedDate}</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-medium block">Masa Pelaksanaan:</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{project?.jangkaWaktuHari || 90} Hari Kalender</span>
                </span>
              </div>
            </div>

            {project && (
              <div className="pt-2 border-t border-slate-100 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Paket:</span>
                  <span className="font-bold text-slate-900 truncate max-w-[180px]">{project.namaPaket}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Nilai Kontrak:</span>
                  <span className="font-mono font-bold text-blue-700">{formatRupiah(project.nilaiSPK)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
