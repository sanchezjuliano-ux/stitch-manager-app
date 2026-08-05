'use client';

import React, { useState, useEffect } from 'react';
import { ViewTab } from '@/lib/types';
import { getStoredCompanyConfig } from '@/lib/logoConfig';
import { 
  FileText, 
  ClipboardList, 
  Users, 
  Package, 
  Wallet, 
  BarChart3, 
  X, 
  Sparkles, 
  Download, 
  Upload, 
  RefreshCw,
  ExternalLink,
  Shirt,
  Layers
} from 'lucide-react';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  onResetData: () => void;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  currentTab,
  onSelectTab,
  onResetData
}) => {
  const [companyConfig, setCompanyConfig] = useState(getStoredCompanyConfig());

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setCompanyConfig(getStoredCompanyConfig());
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const menuItems = [
    { id: 'quotes' as ViewTab, label: 'Orçamentos & Matrizes', icon: FileText, desc: 'Novo orçamento, calculadora de pontos e aprovações' },
    { id: 'services' as ViewTab, label: 'Guia de Serviços Executados', icon: Layers, desc: 'Biblioteca e catálogo de serviços de referência' },
    { id: 'orders' as ViewTab, label: 'Ordens de Serviço (OS)', icon: ClipboardList, desc: 'Acompanhamento de produção, pagamentos e envio' },
    { id: 'clients' as ViewTab, label: 'Gestão de Clientes', icon: Users, desc: 'Cadastro completo, contatos e redes sociais' },
    { id: 'inventory' as ViewTab, label: 'Estoque & Insumos', icon: Package, desc: 'Linhas, entretelas, bastidores e agulhas' },
    { id: 'finance' as ViewTab, label: 'Fluxo de Caixa', icon: Wallet, desc: 'Entradas, saídas e controle de lançamentos' },
    { id: 'analytics' as ViewTab, label: 'Relatórios & Análises', icon: BarChart3, desc: 'Gráficos de aprovação e fluxo financeiro' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex">
      <div className="bg-slate-900/90 backdrop-blur-2xl border-r border-white/10 text-white w-full max-w-xs sm:max-w-sm h-full shadow-2xl flex flex-col justify-between p-5 overflow-y-auto animate-in slide-in-from-left duration-200">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-full bg-white border-2 border-red-600 p-0.5 overflow-hidden shadow-lg shadow-red-500/20 shrink-0 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={companyConfig.logoDataUrl}
                  alt={companyConfig.name}
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
              <div className="min-w-0">
                <h2 className="font-extrabold text-sm text-white tracking-tight leading-tight truncate">{companyConfig.name}</h2>
                <p className="text-[10px] text-cyan-300/80 font-medium truncate">{companyConfig.subtitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">Menu Principal</p>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onClose();
                  }}
                  className={`w-full text-left p-3 rounded-2xl transition flex items-start gap-3 backdrop-blur-md ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-white border border-cyan-400/40 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                      : 'hover:bg-white/10 text-slate-300 hover:text-white border border-transparent'
                  }`}
                >
                  <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <div>
                    <span className="font-bold text-xs block">{item.label}</span>
                    <span className={`text-[10px] line-clamp-1 mt-0.5 ${isActive ? 'text-cyan-200' : 'text-slate-400'}`}>
                      {item.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Direct Images Note */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-3.5 space-y-1.5 text-xs text-slate-300">
            <p className="font-bold text-cyan-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" /> Links de Imagem HTML
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Você pode inserir URLs diretas (HTTP/HTTPS) para imagens de linhas, matrizes, roupas e logos em qualquer formulário do app!
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-white/10 space-y-2">
          <button
            onClick={() => {
              if (confirm('Deseja restaurar os dados de demonstração originais?')) {
                onResetData();
                onClose();
              }
            }}
            className="w-full py-2.5 px-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition backdrop-blur-md"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            Restaurar Dados Iniciais
          </button>
        </div>
      </div>
    </div>
  );
};
