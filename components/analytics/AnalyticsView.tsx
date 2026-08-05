'use client';

import React, { useState } from 'react';
import { Quote, Transaction, DisplayViewMode } from '@/lib/types';
import { DataFilterExportToolbar } from '../common/DataFilterExportToolbar';
import { ExportDataPayload } from '@/lib/exportUtils';
import { FileText, Table, Download, Calendar, Filter, BarChart3, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

interface AnalyticsViewProps {
  quotes: Quote[];
  transactions: Transaction[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ quotes, transactions }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<DisplayViewMode>('medium');
  const [filterDate, setFilterDate] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [financeScope, setFinanceScope] = useState('Todas Movimentações');

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

  const approvedQuotes = quotes.filter(q => q.status === 'Aprovado').length;
  const totalQuotes = quotes.length || 1;
  const approvalPercentage = Math.round((approvedQuotes / totalQuotes) * 100);

  const filteredQuotes = quotes.filter(q => {
    const qStr = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || q.id.toLowerCase().includes(qStr) || q.clientName.toLowerCase().includes(qStr) || q.status.toLowerCase().includes(qStr);
    const matchesClient = !filterClient || q.clientName.toLowerCase().includes(filterClient.toLowerCase());
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
    rows: quotesChartData.map((d, i) => [
      d.month,
      `${d.Aprovados}`,
      `${d.Pendentes}`,
      `R$ ${cashFlowData[i].Entradas.toFixed(2)}`,
      `R$ ${cashFlowData[i].Saidas.toFixed(2)}`,
      `R$ ${cashFlowData[i].Saldo.toFixed(2)}`
    ]),
    totals: [
      { label: 'Taxa de Aprovação de Orçamentos', value: `${approvalPercentage}%` },
      { label: 'Total Orçamentos no Sistema', value: `${quotes.length}` }
    ]
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Análises</h2>
        <p className="text-xs text-slate-300">Relatórios de desempenho do ateliê, conversão e saúde financeira.</p>
      </div>

      {/* Dynamic Filter & Export Toolbar */}
      <DataFilterExportToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Filtrar dados analíticos por cliente, status ou período..."
        onResetFilters={() => {
          setSearchQuery('');
          setFilterClient('');
          setFilterDate('');
          setFinanceScope('Todas Movimentações');
        }}
        exportPayload={analyticsExportPayload}
        totalFilteredCount={quotesChartData.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Card 1: Orçamentos */}
      <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/15 shadow-2xl p-4 sm:p-5 space-y-4 text-white">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Orçamentos</h3>
            <span className="text-xs text-emerald-300 font-bold">Taxa de Aprovação: {approvalPercentage}%</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => alert('Exportando relatório de orçamentos em PDF...')}
              className="p-2 border border-white/20 bg-white/10 rounded-xl hover:bg-white/20 text-cyan-300 transition backdrop-blur-md"
              title="Exportar PDF"
            >
              <FileText className="w-4 h-4 text-cyan-300" />
            </button>
            <button
              onClick={() => alert('Exportando dados em formato planilha...')}
              className="p-2 border border-white/20 bg-white/10 rounded-xl hover:bg-white/20 text-cyan-300 transition backdrop-blur-md"
              title="Exportar Planilha"
            >
              <Table className="w-4 h-4 text-cyan-300" />
            </button>
          </div>
        </div>

        {/* Date & Client Filters */}
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="dd/mm/aaaa"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full text-xs px-3 py-2 pr-8 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 backdrop-blur-md focus:outline-none focus:border-cyan-400"
            />
            <Calendar className="w-3.5 h-3.5 absolute right-3 top-2.5 text-cyan-400" />
          </div>
          <input
            type="text"
            placeholder="Cliente"
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 backdrop-blur-md focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Chart Box */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2 backdrop-blur-md">
          <p className="text-xs font-semibold text-cyan-200 text-center">[Taxa de Aprovação de Orçamentos]</p>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={quotesChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#cbd5e1' }} />
                <YAxis tick={{ fontSize: 11, fill: '#cbd5e1' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.2)', borderRadius: '12px', color: '#fff' }} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#cbd5e1' }} />
                <Bar dataKey="Aprovados" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Pendentes" fill="#38bdf8" fillOpacity={0.3} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Table summary */}
        <div className="overflow-x-auto pt-1">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-white/15 text-slate-300 font-bold">
                <th className="py-2 px-1">ID</th>
                <th className="py-2 px-1">Valor</th>
                <th className="py-2 px-1">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {quotes.slice(0, 3).map((q) => (
                <tr key={q.id}>
                  <td className="py-2 px-1 font-bold text-white">{q.id}</td>
                  <td className="py-2 px-1 font-medium text-slate-200">R$ {q.estimatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className="py-2 px-1 font-extrabold text-cyan-300">{q.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Card 2: Financeiro */}
      <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/15 shadow-2xl p-4 sm:p-5 space-y-4 text-white">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-lg font-bold text-white tracking-tight">Financeiro</h3>
          <button
            onClick={() => alert('Download do relatório de fluxo de caixa em andamento!')}
            className="w-9 h-9 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-300/40 hover:brightness-110 transition"
            title="Download Relatório"
          >
            <Download className="w-4 h-4 text-slate-950" />
          </button>
        </div>

        {/* Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select
            value={financeScope}
            onChange={(e) => setFinanceScope(e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-xl border border-white/20 bg-slate-900 text-white backdrop-blur-md focus:outline-none focus:border-cyan-400"
          >
            <option value="Todas Movimentações">Todas Movimentações</option>
            <option value="Apenas Receitas">Apenas Receitas (Entradas)</option>
            <option value="Apenas Despesas">Apenas Despesas (Saídas)</option>
          </select>

          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="01/10/2026 - 31/10/2026"
              className="w-full text-xs px-3 py-2 pr-8 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 backdrop-blur-md focus:outline-none focus:border-cyan-400"
            />
            <Calendar className="w-3.5 h-3.5 absolute right-3 text-cyan-400" />
          </div>
        </div>

        {/* Cash Flow Chart Box */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2 backdrop-blur-md">
          <p className="text-xs font-semibold text-cyan-200 text-center">[Gráfico de Fluxo de Caixa]</p>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#cbd5e1' }} />
                <YAxis tick={{ fontSize: 11, fill: '#cbd5e1' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.2)', borderRadius: '12px', color: '#fff' }} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#cbd5e1' }} />
                <Area type="monotone" dataKey="Entradas" stroke="#22d3ee" fillOpacity={1} fill="url(#colorEntradas)" />
                <Area type="monotone" dataKey="Saidas" stroke="#f43f5e" fillOpacity={1} fill="url(#colorSaidas)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
