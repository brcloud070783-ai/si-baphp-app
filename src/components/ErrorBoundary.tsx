import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ShieldCheck, Database, Trash2 } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCache = () => {
    try {
      // Clear corrupt cache keys if any, preserve user data if possible or offer clean start
      sessionStorage.clear();
      window.location.reload();
    } catch (e) {
      window.location.reload();
    }
  };

  private handleHardReset = () => {
    if (window.confirm("Apakah Anda yakin ingin mereset cache lokal aplikasi? Data lokal akan dikembalikan ke data awal standar. Lakukan ini jika aplikasi selalu crash saat dibuka.")) {
      try {
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
      } catch (e) {
        window.location.reload();
      }
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl p-6 md:p-8">
            <div className="flex items-center gap-3 text-amber-400 mb-4">
              <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <AlertTriangle className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Sistem SPP-LS (Mode Pemulihan Diri)</h1>
                <p className="text-sm text-slate-400">Terjadi kesalahan teknis kecil saat memuat tampilan</p>
              </div>
            </div>

            <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-700/80 mb-6 text-slate-300 text-sm space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <ShieldCheck className="w-4 h-4" />
                <span>Data Kontrak & Berkas Anda Tetap Aman di Penyimpanan Lokal</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Aplikasi secara otomatis melindungi data Anda agar tidak hilang. Anda dapat melakukan muat ulang (*refresh*) halaman atau mereset cache jika kendala berlanjut.
              </p>
            </div>

            {/* Error Message Snippet */}
            {this.state.error && (
              <div className="mb-6 bg-red-950/40 border border-red-800/40 rounded-xl p-3 text-xs font-mono text-red-300 overflow-x-auto">
                <div className="font-semibold text-red-400 mb-1">Rincian Kendala:</div>
                {this.state.error.toString()}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition shadow-lg shadow-blue-600/20 text-sm cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Muat Ulang Halaman
              </button>

              <button
                onClick={this.handleResetCache}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-xl transition text-sm cursor-pointer"
              >
                <Database className="w-4 h-4" />
                Bersihkan Sesi
              </button>

              <button
                onClick={this.handleHardReset}
                title="Gunakan jika aplikasi terus error"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-red-900/40 hover:bg-red-800/50 text-red-300 border border-red-800/50 font-medium rounded-xl transition text-sm cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Reset Total
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700/60 text-center text-xs text-slate-500">
              Aplikasi Pengelolaan Berkas SPP-LS 15 Dokumen APBD/DAK • Dinas Kepemudaan & Olahraga
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
