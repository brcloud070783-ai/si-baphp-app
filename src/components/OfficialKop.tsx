import React from 'react';
import { KopDinasConfig } from '../types';

interface OfficialKopProps {
  config?: KopDinasConfig;
}

export const OfficialKop: React.FC<OfficialKopProps> = () => {
  // Kop surat ditiadakan di semua dokumen agar user membuat secara manual di Google Docs / Word
  return null;
};
