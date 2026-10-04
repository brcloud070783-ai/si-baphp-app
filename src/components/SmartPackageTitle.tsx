import React, { useState, useRef } from 'react';
import { ProjectContract } from '../types';
import { formatRupiah, formatTanggalIndonesia } from '../utils/terbilang';
import { Building2, MapPin, ShieldCheck, ExternalLink, Calendar, FileText } from 'lucide-react';

interface SmartPackageTitleProps {
  project: ProjectContract;
  showHoverCard?: boolean;
  layout?: 'table-cell' | 'sidebar-card' | 'compact-header';
  onSelect?: () => void;
}

export const SmartPackageTitle: React.FC<SmartPackageTitleProps> = ({
  project,
  showHoverCard = true,
  layout = 'table-cell',
  onSelect
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [cardPos, setCardPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const cardWidth = 380;
      let left = rect.left;
      if (left + cardWidth > window.innerWidth - 16) {
        left = Math.max(12, window.innerWidth - cardWidth - 16);
      }
      let top = rect.bottom + 6;
      if (top + 250 > window.innerHeight) {
        top = Math.max(12, rect.top - 250);
      }
      setCardPos({ top, left });
    }
    setIsHovered(true);
  };

  return (
    <div 
      ref={containerRef}
      className="relative group/pkg cursor-pointer select-none min-w-0"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
    >
      {/* Option 2: Sub-Header Pembeda Lokasi / Sekolah First */}
      <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-blue-700 mb-1 tracking-tight flex-wrap">
        <span className="bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded border border-blue-200/80 font-bold uppercase text-[9.5px] shrink-0 flex items-center gap-1">
          <MapPin className="w-2.5 h-2.5 text-blue-600 shrink-0" />
          <span>{project.lokasi}</span>
        </span>
        <span className="text-slate-300 font-normal">·</span>
        <span className="text-slate-600 font-medium truncate max-w-[160px]">{project.jenisPekerjaan}</span>
      </div>

      {/* Package Title - Fixed Heights to prevent hover flickering */}
      <div className="min-h-[36px]">
        <h4 className={`font-bold text-slate-900 leading-snug transition-colors group-hover/pkg:text-blue-700 ${
          layout === 'compact-header' ? 'text-xs line-clamp-1' : 'text-[12.5px] line-clamp-2'
        }`}>
          {project.namaPaket}
        </h4>
      </div>

      {/* Option 3: Rich Popover Card with Viewport Fixed Positioning (No Clipping + No Shaking) */}
      {showHoverCard && isHovered && (
        <div 
          style={{ top: `${cardPos.top}px`, left: `${cardPos.left}px` }}
          className="no-print fixed z-[9999] w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-4 pointer-events-none text-xs animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 inline-block mb-1">
                {project.jenisPekerjaan} · {project.lokasi}
              </span>
              <h5 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug">
                {project.namaPaket}
              </h5>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 border ${
              project.statusVerifikasi === 'diverifikasi' 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {project.statusVerifikasi === 'diverifikasi' ? 'Terverifikasi' : 'Perlu Tinjauan'}
            </span>
          </div>

          {/* Details Grid */}
          <div className="py-3 space-y-2.5 text-slate-700">
            <div className="flex items-start gap-2">
              <Building2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-slate-400 font-medium block">Penyedia / Rekanan</span>
                <span className="font-bold text-slate-900">{project.penyedia.namaPerusahaan}</span>
                <span className="block text-[11px] text-slate-500 font-medium">
                  PJ: {project.penyedia.namaDirektur} ({project.penyedia.jabatan || 'Direktur'})
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 font-medium block flex items-center gap-1">
                  <FileText className="w-3 h-3 text-blue-600" />
                  <span>Nomor SPK</span>
                </span>
                <span className="font-mono font-semibold text-slate-800 text-[11px] break-all block" title={project.nomorSPK}>
                  {project.nomorSPK}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-medium block flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>Tanggal & Nilai SPK</span>
                </span>
                <span className="font-mono font-bold text-slate-900 text-[12px] block">
                  {formatRupiah(project.nilaiSPK)}
                </span>
                <span className="text-[10.5px] text-slate-500 block">
                  {formatTanggalIndonesia(project.tanggalSPK)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
              <span className="text-slate-500">Masa Pelaksanaan: <strong className="text-slate-800">{project.jangkaWaktuHari} Hari</strong></span>
              <div className="flex items-center gap-1 text-emerald-700 font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>97% Sah Legal</span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">Klik untuk buka di Studio</span>
            <span className="text-blue-600 font-bold flex items-center gap-1">
              <span>Buka Studio</span>
              <ExternalLink className="w-3 h-3" />
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

