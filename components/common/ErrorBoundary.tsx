'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-5 bg-slate-900/90 border border-rose-500/30 backdrop-blur-2xl rounded-3xl text-center space-y-3 my-4 text-white max-w-md mx-auto shadow-2xl">
          <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              {this.props.fallbackTitle || 'Ocorreu um erro no componente'}
            </h3>
            {this.state.error && (
              <p className="text-[11px] font-mono text-rose-300 bg-slate-950/80 p-2 rounded-xl border border-rose-500/20 mt-2 text-left overflow-x-auto whitespace-pre-wrap">
                {this.state.error.message || String(this.state.error)}
              </p>
            )}
          </div>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Tentar Novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
