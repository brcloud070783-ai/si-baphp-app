import React, { useState, useEffect, useRef } from 'react';
import { DocumentType, ProjectContract } from '../types';
import { ALL_DOCUMENTS_CATALOG } from '../utils/googleDocsService';
import { checkDocumentReadiness } from '../utils/documentReadiness';
import { 
  Search, 
  X, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface QuickJumpPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectContract;
  selectedDoc: DocumentType;
  onSelectDoc: (doc: DocumentType) => void;
}

export const QuickJumpPalette: React.FC<QuickJumpPaletteProps> = ({
  isOpen,
  onClose,
  project,
  selectedDoc,
  onSelectDoc
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 40);
    }
  }, [isOpen]);

  // Filter documents by query (number, label, stage, or shortLabel)
  const filteredDocs = ALL_DOCUMENTS_CATALOG.filter(doc => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      doc.label.toLowerCase().includes(q) ||
      doc.shortLabel.toLowerCase().includes(q) ||
      doc.stage.toLowerCase().includes(q) ||
      doc.description.toLowerCase().includes(q) ||
      doc.type.toLowerCase().includes(q)
    );
  });

  // Handle keyboard navigation inside search (ArrowUp, ArrowDown, Enter, Esc)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < filteredDocs.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredDocs.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredDocs[selectedIndex]) {
        onSelectDoc(filteredDocs[selectedIndex].type);
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[82vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar Input */}
        <div className="p-3.5 border-b border-slate-100 flex items-center gap-3 bg-white">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Cari atau lompat ke berkas (misal: BAP, Kuitansi, 10, Foto)..."
            className="w-full bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono bg-slate-100 border border-slate-200 rounded text-slate-500">
            ESC
          </kbd>
        </div>

        {/* Quick Microcopy Header */}
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Katalog 15 Berkas Standar Pengadaan Dinas</span>
          <div className="flex items-center gap-2 font-mono text-[10px]">
            <span>↑↓ Pilih</span>
            <span>·</span>
            <span>↵ Buka</span>
          </div>
        </div>

        {/* Document Results List */}
        <div className="overflow-y-auto p-2 space-y-1 flex-1">
          {filteredDocs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Tidak ditemukan berkas yang cocok dengan kata kunci &quot;{query}&quot;.
            </div>
          ) : (
            filteredDocs.map((item, index) => {
              const readiness = checkDocumentReadiness(project, item.type);
              const isSelected = index === selectedIndex;
              const isCurrent = item.type === selectedDoc;

              return (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => {
                    onSelectDoc(item.type);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 text-blue-950 ring-1 ring-blue-200'
                      : isCurrent
                      ? 'bg-slate-50 text-slate-900'
                      : 'hover:bg-slate-50/80 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 text-xs font-mono font-bold ${
                      isCurrent 
                        ? 'bg-blue-600 text-white shadow-2xs' 
                        : isSelected 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      <FileText className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold truncate ${
                          isCurrent ? 'text-blue-700' : 'text-slate-900'
                        }`}>
                          {item.label}
                        </span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-800">
                            Aktif
                          </span>
                        )}
                      </div>
                      <p className={`text-[11px] truncate mt-0.5 ${
                        readiness.isReady ? 'text-slate-500' : 'text-amber-700'
                      }`}>
                        {readiness.humanSummary}
                      </p>
                    </div>
                  </div>

                  {/* Readiness Status Badge with Microcopy */}
                  <div className="flex items-center gap-2 shrink-0">
                    {readiness.isReady ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span className="hidden sm:inline">Siap</span>
                      </span>
                    ) : (
                      <span 
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200"
                      >
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        <span className="hidden sm:inline">{readiness.missingFields.length} Kurang</span>
                      </span>
                    )}

                    <ChevronRight className={`w-4 h-4 transition-transform ${
                      isSelected ? 'text-blue-600 translate-x-0.5' : 'text-slate-300'
                    }`} />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Pindah instan tanpa batas dan tanpa lag</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
