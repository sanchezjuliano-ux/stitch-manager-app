'use client';

import React, { useState, useEffect } from 'react';
import { Menu, Sparkles } from 'lucide-react';
import { ViewTab } from '@/lib/types';
import { getStoredCompanyConfig } from '@/lib/logoConfig';

interface HeaderProps {
  currentTab: ViewTab;
  onOpenDrawer: () => void;
  onSelectTab: (tab: ViewTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onOpenDrawer, onSelectTab }) => {
  const [companyConfig, setCompanyConfig] = useState(getStoredCompanyConfig());

  useEffect(() => {
    const updateConfig = () => {
      setCompanyConfig(getStoredCompanyConfig());
    };
    updateConfig();

    window.addEventListener('company-config-updated', updateConfig);
    window.addEventListener('storage', updateConfig);
    return () => {
      window.removeEventListener('company-config-updated', updateConfig);
      window.removeEventListener('storage', updateConfig);
    };
  }, []);

  const getTabTitle = (tab: ViewTab) => {
    switch (tab) {
      case 'quotes':
        return 'Orçamentos';
      case 'orders':
        return 'Ordens de Serviço (OS)';
      case 'clients':
        return 'Clientes';
      case 'inventory':
        return 'Estoque de Materiais';
      case 'finance':
        return 'Financeiro';
      case 'analytics':
        return 'Análises';
      case 'services':
        return 'Guia de Serviços Executados';
      default:
        return 'Clientes';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-2xl border-b border-white/10 px-4 py-2.5 flex items-center justify-between text-white shadow-lg">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenDrawer}
          className="p-2 rounded-xl text-slate-200 hover:text-white bg-white/5 hover:bg-white/15 border border-white/10 transition active:scale-95 backdrop-blur-md cursor-pointer"
          title="Menu Principal"
        >
          <Menu className="w-5 h-5 text-cyan-400" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-white border-2 border-red-600 p-0.5 overflow-hidden shadow-md shadow-red-500/20 shrink-0 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={companyConfig.logoDataUrl}
              alt={companyConfig.name}
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black text-white tracking-tight flex items-center gap-1.5 drop-shadow-sm leading-tight">
              {getTabTitle(currentTab)}
            </h1>
            <p className="text-[10px] text-cyan-300/90 font-bold hidden sm:block">
              {companyConfig.name}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onSelectTab('analytics')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-400/10 text-cyan-300 font-semibold text-xs border border-cyan-400/30 hover:bg-cyan-400/20 transition backdrop-blur-md shadow-[0_0_12px_rgba(34,211,238,0.2)] cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> IA & Análises
        </button>

        {/* User Profile Avatar */}
        <div className="relative group cursor-pointer">
          <div className="w-9 h-9 rounded-full border-2 border-cyan-400/60 p-0.5 overflow-hidden shadow-md shadow-cyan-500/20 bg-white/10 backdrop-blur-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
              alt="Ateliê - Usuário"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
