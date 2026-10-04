import React, { useState, useRef } from 'react';
import { ContractorVendor } from '../types';
import { Building2, UserCheck } from 'lucide-react';

interface SmartVendorTitleProps {
  vendor: ContractorVendor;
  showHoverCard?: boolean;
}

export const SmartVendorTitle: React.FC<SmartVendorTitleProps> = ({
  vendor,
  showHoverCard = true
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [cardPos, setCardPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const cardWidth = 280;
      let left = rect.left;
      if (left + cardWidth > window.innerWidth - 20) {
        left = Math.max(10, window.innerWidth - cardWidth - 20);
      }
      let top = rect.bottom + 8;
      if (top + 200 > window.innerHeight) {
        top = Math.max(10, rect.top - 200);
      }
      setCardPos({ top, left });
    }
    setIsHovered(true);
  };

  return (
    <div 
      ref={containerRef}
      className="relative group/vendor cursor-pointer select-none min-w-0"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="min-h-[18px]">
        <h5 className="font-bold text-slate-900 text-[12px] leading-snug group-hover/vendor:text-blue-700 transition-colors line-clamp-1">
          {vendor.namaPerusahaan}
        </h5>
      </div>
      
      <p className="text-[10.5px] text-slate-500 font-medium truncate mt-0.5 flex items-center gap-1">
        <UserCheck className="w-3 h-3 text-slate-400 shrink-0" />
        <span className="truncate">{vendor.namaDirektur}</span>
      </p>

      {/* Option 3: Rich Fixed Hover Card with Viewport Positioning (No Clipping + No Shaking) */}
      {showHoverCard && isHovered && (
        <div 
          style={{ top: `${cardPos.top}px`, left: `${cardPos.left}px` }}
          className="no-print fixed z-[9999] w-72 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-3.5 pointer-events-none text-xs animate-in fade-in duration-100"
        >
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold shrink-0 border border-blue-100">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h6 className="font-bold text-slate-900 text-xs leading-snug">
                {vendor.namaPerusahaan}
              </h6>
              <span className="text-[10px] text-slate-400 font-medium">Rekanan Terdaftar APBD</span>
            </div>
          </div>

          <div className="py-2.5 space-y-1.5 text-slate-700 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Pimpinan / Direktur:</span>
              <span className="font-bold text-slate-900">{vendor.namaDirektur}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Jabatan:</span>
              <span className="font-semibold text-slate-700">{vendor.jabatan || 'Direktur Utama'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Bank Rekening:</span>
              <span className="font-mono font-bold text-slate-900">{vendor.bankNama || 'Bank Kaltimtara'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">No. Rekening:</span>
              <span className="font-mono font-bold text-blue-700">{vendor.nomorRekening || '-'}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <span className="text-slate-400 font-medium">NPWP Rekanan:</span>
              <span className="font-mono text-slate-700 text-[10.5px]">{vendor.npwp || '-'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
