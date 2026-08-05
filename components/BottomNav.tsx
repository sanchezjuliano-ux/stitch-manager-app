'use client';

import React from 'react';
import { ViewTab } from '@/lib/types';
import { 
  FileText, 
  ClipboardList, 
  Users, 
  Package, 
  Wallet, 
  BarChart3,
  Layers
} from 'lucide-react';

interface BottomNavProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const tabs = [
    { id: 'quotes' as ViewTab, label: 'Orçamentos', icon: FileText },
    { id: 'services' as ViewTab, label: 'Serviços', icon: Layers },
    { id: 'orders' as ViewTab, label: 'Ordens', icon: ClipboardList },
    { id: 'clients' as ViewTab, label: 'Clientes', icon: Users },
    { id: 'inventory' as ViewTab, label: 'Estoque', icon: Package },
    { id: 'finance' as ViewTab, label: 'Financeiro', icon: Wallet },
    { id: 'analytics' as ViewTab, label: 'Análises', icon: BarChart3 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/80 backdrop-blur-2xl border-t border-white/10 shadow-2xl px-1 py-1 sm:py-2">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-0.5 rounded-2xl transition ${
                isActive
                  ? 'text-cyan-300 font-extrabold'
                  : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-gradient-to-tr from-cyan-400 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/30 scale-105'
                    : 'bg-transparent text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className={`text-[10px] sm:text-[11px] mt-1 tracking-tight leading-none ${isActive ? 'font-bold text-cyan-300' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
