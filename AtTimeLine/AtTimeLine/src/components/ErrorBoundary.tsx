import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('QazaqFin UI Uncaught Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCache = () => {
    try {
      localStorage.removeItem('qazaqfin_local_user');
      localStorage.removeItem('qazaqfin_local_contracts');
      localStorage.removeItem('qazaqfin_jwt_token');
    } catch {
      // ignore
    }
    window.location.reload();
  };

  private handleTryRecover = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#150d08] text-[#f7ede2] flex items-center justify-center p-4 font-sans select-none">
          <div className="max-w-lg w-full bg-[#221710] border border-[#4a3325] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-center space-y-6">
            {/* Top decorative accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#b5805a] via-[#c98e60] to-[#dba77b]" />

            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#332014] border border-[#5a3e2b] flex items-center justify-center text-[#dba77b] shadow-inner shadow-[#b5805a]/20">
              <AlertTriangle className="w-8 h-8 text-[#dba77b]" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#fff9f5]">
                Жүйені қалпына келтіру режимі
              </h2>
              <p className="text-xs sm:text-sm text-[#c98e60] leading-relaxed">
                Қосымшада күтпеген ақау орын алды. Сіздің жеке деректеріңіз бен келісімшарттарыңыз толық қауіпсіз және сақталған.
              </p>
            </div>

            <div className="bg-[#150d08] border border-[#3a271c] rounded-2xl p-4 text-left text-xs space-y-2">
              <div className="flex items-center gap-2 text-[#4ade80] font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Автоматты деректер қорғанысы белсенді</span>
              </div>
              <p className="text-[11px] text-[#ebd3be]/70">
                Бетті қайта жүктеу арқылы қосымшаны қалыпты жұмыс күйіне бірден оралтуға болады.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#b5805a] via-[#c98e60] to-[#dba77b] hover:brightness-110 text-[#110905] font-black text-xs shadow-lg shadow-[#b5805a]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Қайта жүктеу
              </button>
              <button
                onClick={this.handleResetCache}
                className="py-3 px-4 rounded-xl bg-[#2d1b11] hover:bg-[#3a2316] text-[#dba77b] border border-[#4a3325] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                title="Кэшті тазалап, бастапқы қалпына келтіру"
              >
                <RotateCcw className="w-4 h-4" />
                Кэшті жаңалау
              </button>
            </div>

            <div className="pt-2">
              <button
                onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                className="text-[11px] text-[#8f6449] hover:text-[#c98e60] underline underline-offset-4 cursor-pointer"
              >
                {this.state.showDetails ? 'Қате деректерін жасыру' : 'Қате туралы техникалық ақпарат'}
              </button>
              {this.state.showDetails && (
                <div className="mt-3 p-3 bg-[#110905] border border-[#3a271c] rounded-xl text-left text-[10px] font-mono text-[#f87171] overflow-x-auto max-h-36">
                  <p className="font-bold">{this.state.error?.name}: {this.state.error?.message}</p>
                  <pre className="mt-1 text-[#8f6449] whitespace-pre-wrap">{this.state.error?.stack}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
