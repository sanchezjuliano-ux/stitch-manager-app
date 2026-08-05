'use client';

import React, { useState } from 'react';
import { Transaction, DisplayViewMode } from '@/lib/types';
import { DataFilterExportToolbar } from '../common/DataFilterExportToolbar';
import { ExportDataPayload } from '@/lib/exportUtils';
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  Search, 
  SlidersHorizontal, 
  Download, 
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface FinanceViewProps {
  transactions: Transaction[];
  onAddTransaction: (newTx: Omit<Transaction, 'id' | 'balanceAfter'>) => void;
}

export const FinanceView: React.FC<FinanceViewProps> = ({ transactions, onAddTransaction }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<DisplayViewMode>('medium');
  const [showAddModal, setShowAddModal] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'todos' | 'entrada' | 'saida'>('todos');
  const [categoryFilter, setCategoryFilter] = useState<string>('todos');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('todos');
  const [valueRangeFilter, setValueRangeFilter] = useState<string>('todos');
  const [sortByFilter, setSortByFilter] = useState<string>('recentes');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Form State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(150);
  const [type, setType] = useState<'entrada' | 'saida'>('entrada');
  const [category, setCategory] = useState<any>('Pagamento OS');
  const [isUrgent, setIsUrgent] = useState(false);

  const totalEntradas = transactions
    .filter((t) => t.type === 'entrada')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalSaidas = transactions
    .filter((t) => t.type === 'saida')
    .reduce((acc, t) => acc + t.amount, 0);

  const saldoAtual = totalEntradas - totalSaidas;

  const filteredTransactions = transactions
    .filter((t) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        t.description.toLowerCase().includes(q) ||
        (t.category && t.category.toLowerCase().includes(q)) ||
        t.date.includes(q);

      const matchesType = typeFilter === 'todos' || t.type === typeFilter;
      const matchesCategory = categoryFilter === 'todos' || t.category === categoryFilter;

      let matchesValue = true;
      if (valueRangeFilter === 'ate_100') matchesValue = t.amount <= 100;
      else if (valueRangeFilter === '100_500') matchesValue = t.amount > 100 && t.amount <= 500;
      else if (valueRangeFilter === 'acima_500') matchesValue = t.amount > 500;

      return matchesSearch && matchesType && matchesCategory && matchesValue;
    })
    .sort((a, b) => {
      if (sortByFilter === 'maior_valor') return b.amount - a.amount;
      if (sortByFilter === 'menor_valor') return a.amount - b.amount;
      if (sortByFilter === 'antigos') return a.id.localeCompare(b.id, 'pt-BR');
      return b.id.localeCompare(a.id, 'pt-BR');
    });

  const filteredEntradas = filteredTransactions.filter(t => t.type === 'entrada').reduce((a, b) => a + b.amount, 0);
  const filteredSaidas = filteredTransactions.filter(t => t.type === 'saida').reduce((a, b) => a + b.amount, 0);

  const financeExportPayload: ExportDataPayload = {
    title: 'Relatório de Movimentações Financeiras',
    subtitle: 'Ateliê de Bordados - Controle Financeiro',
    activeFiltersSummary: [
      searchQuery ? `Busca: "${searchQuery}"` : null,
      typeFilter !== 'todos' ? `Tipo: ${typeFilter}` : null,
      categoryFilter !== 'todos' ? `Categoria: ${categoryFilter}` : null
    ].filter(Boolean).join(' | ') || 'Todas as movimentações',
    headers: ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor (R$)', 'Saldo Resultante (R$)'],
    rows: filteredTransactions.map(t => [
      t.date,
      t.description,
      t.category || 'Geral',
      t.type === 'entrada' ? 'Entrada (+)' : 'Saída (-)',
      `${t.type === 'entrada' ? '+' : '-'} R$ ${t.amount.toFixed(2)}`,
      t.balanceAfter ? `R$ ${t.balanceAfter.toFixed(2)}` : '-'
    ]),
    totals: [
      { label: 'Qtd Lançamentos', value: `${filteredTransactions.length}` },
      { label: 'Soma Entradas', value: `R$ ${filteredEntradas.toFixed(2)}` },
      { label: 'Soma Saídas', value: `R$ ${filteredSaidas.toFixed(2)}` },
      { label: 'Saldo das Filtradas', value: `R$ ${(filteredEntradas - filteredSaidas).toFixed(2)}` }
    ]
  };

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    onAddTransaction({
      date: new Date().toLocaleDateString('pt-BR'),
      description,
      type,
      amount: Number(amount),
      category,
      isUrgent
    });

    setDescription('');
    setAmount(150);
    setIsUrgent(false);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-5 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Financeiro</h2>
          <p className="text-xs text-slate-300">Visão geral do fluxo de caixa e histórico de transações.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 font-extrabold text-xs rounded-xl hover:brightness-110 transition flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 border border-cyan-300/40"
        >
          <Plus className="w-4 h-4 text-slate-950" /> Adicionar Movimentação
        </button>
      </div>

      {/* KPI Cards */}
      <div className="space-y-3">
        {/* TOTAL ENTRADAS */}
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/15 shadow-2xl p-4 flex items-center justify-between text-white">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
              <ArrowUpRight className="w-4 h-4 text-emerald-400" /> TOTAL ENTRADAS
            </div>
            <p className="text-2xl font-black text-white">
              R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-emerald-300 font-semibold">+12% este mês</p>
          </div>
          <div className="w-16 h-12 text-cyan-400/40 flex items-center justify-end">
            <svg className="w-16 h-10 text-emerald-400" viewBox="0 0 100 50" fill="none" stroke="currentColor" strokeWidth="4">
              <path d="M0 40 L30 25 L60 35 L100 5" />
            </svg>
          </div>
        </div>

        {/* TOTAL SAÍDAS */}
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/15 shadow-2xl p-4 flex items-center justify-between text-white">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-rose-400 uppercase tracking-wider">
              <ArrowDownRight className="w-4 h-4 text-rose-400" /> TOTAL SAÍDAS
            </div>
            <p className="text-2xl font-black text-white">
              R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-rose-300 font-semibold">-5% este mês</p>
          </div>
          <div className="w-16 h-12 text-rose-400/40 flex items-center justify-end">
            <svg className="w-16 h-10 text-rose-400" viewBox="0 0 100 50" fill="none" stroke="currentColor" strokeWidth="4">
              <path d="M0 10 L30 20 L60 15 L100 45" />
            </svg>
          </div>
        </div>

        {/* SALDO DO DIA */}
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/15 shadow-2xl p-4 flex items-center justify-between text-white">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-cyan-300 uppercase tracking-wider">
              <Wallet className="w-4 h-4 text-cyan-400" /> SALDO DO DIA
            </div>
            <p className="text-2xl font-black text-cyan-300">
              R$ {saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-300 font-medium">Atualizado agora</p>
          </div>
        </div>
      </div>

      {/* Dynamic Filter & Export Toolbar */}
      <DataFilterExportToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Buscar lançamentos, pagamentos, compras ou clientes..."
        filterOptions={[
          {
            key: 'type',
            label: 'Tipo de Movimentação',
            value: typeFilter,
            options: [
              { label: 'Todas as Movimentações', value: 'todos' },
              { label: 'Apenas Entradas (+)', value: 'entrada' },
              { label: 'Apenas Saídas (-)', value: 'saida' }
            ],
            onChange: (val) => setTypeFilter(val as any)
          },
          {
            key: 'category',
            label: 'Categoria Financeira',
            value: categoryFilter,
            options: [
              { label: 'Todas as Categorias', value: 'todos' },
              { label: 'Pagamento OS', value: 'Pagamento OS' },
              { label: 'Venda de Material', value: 'Venda de Material' },
              { label: 'Compra de Insumo', value: 'Compra de Insumo' },
              { label: 'Manutenção / Maquinário', value: 'Manutenção / Maquinário' },
              { label: 'Retirada / Outros', value: 'Retirada / Outros' }
            ],
            onChange: setCategoryFilter
          },
          {
            key: 'valueRange',
            label: 'Faixa de Valor (R$)',
            value: valueRangeFilter,
            options: [
              { label: 'Todos os Valores', value: 'todos' },
              { label: 'Até R$ 100,00', value: 'ate_100' },
              { label: 'R$ 100,00 a R$ 500,00', value: '100_500' },
              { label: 'Acima de R$ 500,00', value: 'acima_500' }
            ],
            onChange: setValueRangeFilter
          },
          {
            key: 'sortBy',
            label: 'Ordenar Lançamentos Por',
            value: sortByFilter,
            options: [
              { label: 'Mais Recentes', value: 'recentes' },
              { label: 'Mais Antigos', value: 'antigos' },
              { label: 'Maior Valor', value: 'maior_valor' },
              { label: 'Menor Valor', value: 'menor_valor' }
            ],
            onChange: setSortByFilter
          }
        ]}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        onResetFilters={() => {
          setSearchQuery('');
          setTypeFilter('todos');
          setCategoryFilter('todos');
          setValueRangeFilter('todos');
          setSortByFilter('recentes');
          setStartDate('');
          setEndDate('');
        }}
        exportPayload={financeExportPayload}
        totalFilteredCount={filteredTransactions.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Histórico de Movimentações */}
      <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/15 shadow-2xl p-4 space-y-3 text-white">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-base font-bold text-white">Histórico de Movimentações</h3>
          <div className="flex items-center gap-2 text-cyan-300">
            <SlidersHorizontal className="w-4 h-4 cursor-pointer hover:text-cyan-200" />
            <Download className="w-4 h-4 cursor-pointer hover:text-cyan-200" />
          </div>
        </div>

        {viewMode === 'small' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {filteredTransactions.map((tx) => (
              <div key={tx.id} className="p-2.5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md flex flex-col justify-between space-y-1 hover:border-cyan-400/50 transition">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-300">{tx.date}</span>
                    {tx.type === 'entrada' ? (
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
                    )}
                  </div>
                  <p className="text-xs font-bold text-white truncate mt-1">{tx.description}</p>
                </div>
                <div className="border-t border-white/10 pt-1 flex items-center justify-between text-[10px]">
                  <span className={tx.type === 'entrada' ? 'text-emerald-400 font-extrabold' : 'text-rose-400 font-extrabold'}>
                    R$ {tx.amount.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : viewMode === 'large' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTransactions.map((tx) => (
              <div key={tx.id} className="p-4 rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl flex flex-col justify-between space-y-3 hover:border-cyan-400/50 transition">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs text-slate-300">{tx.date} • {tx.category || 'Geral'}</span>
                    <h4 className="font-bold text-sm text-white mt-0.5">{tx.description}</h4>
                  </div>
                  <div className={`p-2 rounded-xl border ${tx.type === 'entrada' ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300' : 'bg-rose-500/20 border-rose-400/30 text-rose-300'}`}>
                    {tx.type === 'entrada' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-white/10 pt-2 text-xs">
                  <span className="text-slate-300">Valor:</span>
                  <span className={`text-sm font-extrabold ${tx.type === 'entrada' ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {tx.type === 'entrada' ? '+' : '-'} R$ {tx.amount.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-white/15 text-slate-300 font-extrabold">
                  <th className="py-2 pr-2">Data</th>
                  <th className="py-2 px-2">Descrição</th>
                  <th className="py-2 px-2 text-right">Entrada</th>
                  <th className="py-2 px-2 text-right">Saída</th>
                  <th className="py-2 pl-2 text-right">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/5 transition">
                    <td className="py-3 pr-2 font-medium text-slate-300 whitespace-nowrap">{tx.date}</td>
                    <td className="py-3 px-2 font-semibold text-white">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>{tx.description}</span>
                        {tx.isUrgent && (
                          <span className="px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-400/30">
                            Urgente
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right text-emerald-300 font-medium whitespace-nowrap">
                      {tx.type === 'entrada' ? `R$ ${tx.amount.toFixed(2)}` : '-'}
                    </td>
                    <td className="py-3 px-2 text-right text-rose-300 font-medium whitespace-nowrap">
                      {tx.type === 'saida' ? `R$ ${tx.amount.toFixed(2)}` : '-'}
                    </td>
                    <td className="py-3 pl-2 text-right font-black text-cyan-300 whitespace-nowrap">
                      R$ {tx.balanceAfter.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>


      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900/90 border border-white/15 backdrop-blur-2xl rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold text-white">Nova Movimentação</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTransaction} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Tipo de Movimentação</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('entrada')}
                    className={`py-2.5 rounded-xl font-extrabold transition backdrop-blur-md ${
                      type === 'entrada' ? 'bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 shadow-md' : 'bg-white/10 text-slate-300 border border-white/15'
                    }`}
                  >
                    ↑ Entrada (Receita)
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('saida')}
                    className={`py-2.5 rounded-xl font-extrabold transition backdrop-blur-md ${
                      type === 'saida' ? 'bg-rose-500/30 border border-rose-400/40 text-rose-300 shadow-md' : 'bg-white/10 text-slate-300 border border-white/15'
                    }`}
                  >
                    ↓ Saída (Despesa)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Descrição</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Sinal OS #25004"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 backdrop-blur-md focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-white/20 bg-white/10 text-cyan-300 font-bold placeholder-slate-400 backdrop-blur-md focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="urgent"
                  checked={isUrgent}
                  onChange={(e) => setIsUrgent(e.target.checked)}
                  className="rounded text-cyan-400 focus:ring-cyan-400 bg-white/10 border-white/20"
                />
                <label htmlFor="urgent" className="text-xs font-semibold text-slate-300">Marcar como urgente</label>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 border border-white/20 bg-white/10 hover:bg-white/20 font-semibold text-slate-300 rounded-xl transition backdrop-blur-md"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-cyan-500/25 border border-cyan-300/40 hover:brightness-110 active:scale-95 transition"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
