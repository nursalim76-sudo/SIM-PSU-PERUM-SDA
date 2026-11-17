import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'Terjadi gangguan pada tampilan aplikasi.',
    };
  }

  private handleResetAndReload = () => {
    try {
      localStorage.removeItem('sim_psu_sidoarjo_projects_v1');
      localStorage.removeItem('sim_psu_sidoarjo_role_v1');
      localStorage.removeItem('sim_psu_sidoarjo_audit_v1');
      localStorage.removeItem('sim_psu_sidoarjo_config_v1');
      Object.keys(localStorage)
        .filter((k) => k.startsWith('sim_psu_draft_'))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore storage errors
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-[#DC2626] uppercase tracking-wider">
                SIM-PSU Sidoarjo · Pemulihan Sistem
              </p>
              <h1 className="text-base font-bold text-slate-900">
                Terjadi Kesalahan Pemrosesan Halaman
              </h1>
              <p className="text-xs text-slate-600 leading-relaxed">
                Aplikasi mendeteksi gangguan tampilan atau data lokal yang tidak sesuai. Anda dapat memuat ulang halaman atau mengembalikan data simulasi awal.
              </p>
            </div>
            {this.state.message && (
              <p className="text-[11px] font-mono text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-2.5 break-words">
                {this.state.message}
              </p>
            )}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Muat Ulang
              </button>
              <button
                type="button"
                onClick={this.handleResetAndReload}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-[#0F294A] rounded-lg hover:bg-[#163a66] cursor-pointer"
              >
                Reset Data & Muat Ulang
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
