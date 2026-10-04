import React from 'react';
import { X, Command, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl + K / ⌘K', action: 'Buka Pencarian & Lompat Cepat Dokumen' },
    { key: 'Alt + M', action: 'Buka Matriks Penomoran & Tanggal Masal (15 Dok)' },
    { key: 'Alt + S', action: 'Buka / Tutup Bilah Berkas (Mode Fokus)' },
    { key: 'Alt + E', action: 'Buka Panel Edit Cepat (Inspector Data)' },
    { key: 'Alt + →', action: 'Pindah ke Dokumen Berikutnya' },
    { key: 'Alt + ←', action: 'Kembali ke Dokumen Sebelumnya' },
    { key: 'Ctrl + P / ⌘P', action: 'Cetak Lembar Dokumen Aktif (A4)' },
    { key: '?', action: 'Buka Bantuan Pintasan Keyboard' },
    { key: 'Esc', action: 'Tutup Modal / Dialog yang Aktif' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Pintasan Keyboard (Shortcuts)</h3>
              <p className="text-[10.5px] text-slate-500">Navigasi dan olah dokumen dengan cepat layaknya power user</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 divide-y divide-slate-100 max-h-[60vh] overflow-y-auto text-xs">
          {shortcuts.map((item, idx) => (
            <div key={idx} className="py-2.5 flex items-center justify-between gap-4">
              <span className="text-slate-700 font-medium">{item.action}</span>
              <kbd className="px-2 py-1 bg-slate-100 border border-slate-300 rounded font-mono text-[10.5px] font-bold text-slate-800 shadow-2xs shrink-0">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
