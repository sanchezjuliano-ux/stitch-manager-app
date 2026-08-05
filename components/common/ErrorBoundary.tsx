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
        <div className="p-6 bg-slate-900/90 border border-rose-500/30 backdrop-blur-2xl rounded-3xl text-center space-y-4 my-6 text-white max-w-md mx-auto shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {this.props.fallbackTitle || 'Ocorreu um erro nesta sessão'}
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              O aplicativo recuperou a sessão com segurança. Clique abaixo para tentar novamente.
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="px-4 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition inline-flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> Recarregar Componente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
