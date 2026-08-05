'use client';

import React, { useState, useEffect } from 'react';
import { Quote, Transaction, DisplayViewMode } from '@/lib/types';
import { DataFilterExportToolbar } from '../common/DataFilterExportToolbar';
import { ExportDataPayload } from '@/lib/exportUtils';
import { FileText, Table, Download, Calendar, Filter, BarChart3, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

interface AnalyticsViewProps {
  quotes: Quote[];
  transactions: Transaction[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ quotes = [], transactions = [] }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<DisplayViewMode>('medium');
  const [filterDate, setFilterDate] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [financeScope, setFinanceScope] = useState('Todas Movimentações');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const safeQuotes = Array.isArray(quotes) ? quotes : [];
  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  // Quotes Approval Rate Data
  const quotesChartData = [
    { month: 'Jun', Aprovados: 10, Pendentes: 4 },
    { month: 'Jul', Aprovados: 14, Pendentes: 3 },
    { month: 'Ago', Aprovados: 18, Pendentes: 5 },
    { month: 'Set', Aprovados: 15, Pendentes: 2 },
    { month: 'Out', Aprovados: 22, Pendentes: 3 },
  ];

  // Cash Flow Data
  const cashFlowData = [
    { month: 'Jun', Entradas: 3200, Saidas: 1500, Saldo: 1700 },
    { month: 'Jul', Entradas: 4100, Saidas: 1800, Saldo: 2300 },
    { month: 'Ago', Entradas: 3800, Saidas: 2100, Saldo: 1700 },
    { month: 'Set', Entradas: 5200, Saidas: 1900, Saldo: 3300 },
    { month: 'Out', Entradas: 4250, Saidas: 1850, Saldo: 2400 },
  ];

  const approvedQuotes = safeQuotes.filter(q => q && q.status === 'Aprovado').length;
  const totalQuotes = safeQuotes.length || 1;
  const approvalPercentage = Math.round((approvedQuotes / totalQuotes) * 100);

  const filteredQuotes = safeQuotes.filter(q => {
    if (!q) return false;
    const qStr = searchQuery ? searchQuery.toLowerCase() : '';
    const qId = q.id ? q.id.toLowerCase() : '';
    const qClientName = q.clientName ? q.clientName.toLowerCase() : '';
    const qStatus = q.status ? q.status.toLowerCase() : '';

    const matchesSearch = !searchQuery || qId.includes(qStr) || qClientName.includes(qStr) || qStatus.includes(qStr);
    const matchesClient = !filterClient || qClientName.includes(filterClient.toLowerCase());
    return matchesSearch && matchesClient;
  });

  const analyticsExportPayload: ExportDataPayload = {
    title: 'Relatório Consolidado de Análises e Indicadores (KPIs)',
    subtitle: 'Ateliê de Bordados - Desempenho e Saúde Financeira',
    activeFiltersSummary: [
      searchQuery ? `Busca: "${searchQuery}"` : null,
      filterClient ? `Cliente: "${filterClient}"` : null,
      financeScope !== 'Todas Movimentações' ? `Escopo: ${financeScope}` : null
    ].filter(Boolean).join(' | ') || 'Dados gerais do sistema',
    headers: ['Mês / Período', 'Orçamentos Aprovados', 'Orçamentos Pendentes', 'Entradas (R$)', 'Saídas (R$)', 'Saldo Resultante (R$)'],
    rows: quotesChartData.map((d) => [
      d.month,
      d.Aprovados,
      d.Pendentes,
      'R$ 4.250,00',
      'R$ 1.850,00',
      'R$ 2.400,00'
    ]),
    totals: [
      { label: 'Taxa Méd. Aprovação', value: `${approvalPercentage}%` },
      { label: 'Orçamentos Aprovados', value: `${approvedQuotes}` },
      { label: 'Total Orçamentos', value: `${safeQuotes.length}` }
    ]
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Análises & KPIs</h2>
          <p className="text-xs text-slate-300">Desempenho comercial e gráficos de fluxo financeiro.</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/15 shadow-2xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300">Taxa de Aprovação</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white">{approvalPercentage}%</p>
          <p className="text-[10px] text-emerald-300 font-semibold mt-1">
            {approvedQuotes} de {safeQuotes.length} orçamentos aprovados
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/15 shadow-2xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300">Entradas Mês Atual</span>
            <BarChart3 className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-black text-cyan-300">R$ 4.250,00</p>
          <p className="text-[10px] text-cyan-300 font-semibold mt-1">+12% vs mês anterior</p>
        </div>

        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/15 shadow-2xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300">Saldo Líquido</span>
            <PieChartIcon className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-purple-300">R$ 2.400,00</p>
          <p className="text-[10px] text-slate-300 font-medium mt-1">Margem positiva mantida</p>
        </div>
      </div>

      {/* Data Filter Export Toolbar */}
      <DataFilterExportToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Filtrar métricas por cliente, código ou descrição..."
        filterOptions={[
          {
            key: 'scope',
            label: 'Escopo Financeiro',
            value: financeScope,
            options: [
              { label: 'Todas Movimentações', value: 'Todas Movimentações' },
              { label: 'Apenas Entradas', value: 'Apenas Entradas' },
              { label: 'Apenas Saídas', value: 'Apenas Saídas' }
            ],
            onChange: setFinanceScope
          }
        ]}
        onResetFilters={() => {
          setSearchQuery('');
          setFilterClient('');
          setFinanceScope('Todas Movimentações');
        }}
        exportPayload={analyticsExportPayload}
        totalFilteredCount={filteredQuotes.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Gráfico 1: Orçamentos Aprovados vs Pendentes */}
      <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/15 shadow-2xl p-4 sm:p-5 text-white space-y-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-cyan-400" /> Orçamentos: Aprovados vs Pendentes
        </h3>

        <div className="h-60 w-full pt-2">
          {isMounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={quotesChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#cbd5e1' }} />
                <YAxis tick={{ fontSize: 11, fill: '#cbd5e1' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#cbd5e1' }} />
                <Bar dataKey="Aprovados" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Pendentes" fill="rgba(255, 255, 255, 0.25)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">Carregando gráfico...</div>
          )}
        </div>
      </div>

      {/* Gráfico 2: Fluxo de Caixa Integrado */}
      <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/15 shadow-2xl p-4 sm:p-5 text-white space-y-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-purple-400" /> Fluxo de Caixa (Entradas, Saídas e Saldo)
        </h3>

        <div className="h-60 w-full pt-2">
          {isMounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#cbd5e1' }} />
                <YAxis tick={{ fontSize: 11, fill: '#cbd5e1' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#cbd5e1' }} />
                <Area type="monotone" dataKey="Entradas" stroke="#34d399" fill="rgba(52, 211, 153, 0.2)" />
                <Area type="monotone" dataKey="Saidas" stroke="#f43f5e" fill="rgba(244, 63, 94, 0.2)" />
                <Area type="monotone" dataKey="Saldo" stroke="#c084fc" fill="rgba(192, 132, 252, 0.2)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">Carregando gráfico...</div>
          )}
        </div>
      </div>
    </div>
  );
};
