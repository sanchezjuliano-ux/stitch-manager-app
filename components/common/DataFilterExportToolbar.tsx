'use client';

import React, { useState } from 'react';
import { Search, Filter, Download, X, Calendar, RefreshCw, LayoutGrid, Grid, Grip, List } from 'lucide-react';
import { ExportDataModal } from './ExportDataModal';
import { ExportDataPayload } from '@/lib/exportUtils';
import { DisplayViewMode } from '@/lib/types';

export interface FilterOption {
  key: string;
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}

interface DataFilterExportToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  filterOptions?: FilterOption[];
  startDate?: string;
  onStartDateChange?: (date: string) => void;
  endDate?: string;
  onEndDateChange?: (date: string) => void;
  onResetFilters?: () => void;
  exportPayload: ExportDataPayload;
  totalFilteredCount: number;
  containerIdToExport?: string;
  viewMode?: DisplayViewMode;
  onViewModeChange?: (mode: DisplayViewMode) => void;
}

export const DataFilterExportToolbar: React.FC<DataFilterExportToolbarProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Filtrar dados da guia...',
  filterOptions = [],
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onResetFilters,
  exportPayload,
  totalFilteredCount,
  containerIdToExport,
  viewMode = 'medium',
  onViewModeChange
}) => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    filterOptions.some((f) => f.value && f.value !== 'todos' && f.value !== 'Todas' && f.value !== 'Todos' && f.value !== '') ||
    Boolean(startDate) ||
    Boolean(endDate);

  const finalPayload: ExportDataPayload = {
    ...exportPayload,
    containerId: containerIdToExport || exportPayload.containerId
  };

  return (
    <div className="space-y-2.5 my-3">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Dynamic Search Box */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-cyan-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full text-xs pl-10 pr-8 py-2.5 rounded-2xl border border-white/20 bg-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 backdrop-blur-md transition"
          />
          {searchQuery ? (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition"
              title="Limpar busca"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>

        {/* View Mode & Action Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {/* View Mode Toggle Controls */}
          {onViewModeChange && (
            <div className="flex items-center gap-0.5 p-1 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shrink-0">
              <button
                type="button"
                onClick={() => onViewModeChange('large')}
                className={`p-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                  viewMode === 'large'
                    ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                title="Ícones Grandes"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[10px]">Grandes</span>
              </button>

              <button
                type="button"
                onClick={() => onViewModeChange('medium')}
                className={`p-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                  viewMode === 'medium'
                    ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                title="Ícones Médios"
              >
                <Grid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[10px]">Médios</span>
              </button>

              <button
                type="button"
                onClick={() => onViewModeChange('small')}
                className={`p-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                  viewMode === 'small'
                    ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                title="Miniaturas"
              >
                <Grip className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[10px]">Miniaturas</span>
              </button>

              <button
                type="button"
                onClick={() => onViewModeChange('list')}
                className={`p-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                  viewMode === 'list'
                    ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                title="Modo Lista"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[10px]">Lista</span>
              </button>
            </div>
          )}

          {filterOptions.length > 0 || onStartDateChange ? (
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-3 py-2.5 rounded-2xl border text-xs font-bold transition flex items-center gap-1.5 backdrop-blur-md shrink-0 ${
                showAdvancedFilters || hasActiveFilters
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/20'
                  : 'bg-white/10 border-white/15 text-slate-300 hover:bg-white/20'
              }`}
            >
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              <span>Filtros {hasActiveFilters && '•'}</span>
            </button>
          ) : null}

          {/* Export Button */}
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 font-black text-xs hover:brightness-110 active:scale-95 transition shadow-lg shadow-cyan-500/20 border border-cyan-300/40 flex items-center gap-1.5 shrink-0"
            title="Exportar dados filtrados"
          >
            <Download className="w-4 h-4 text-slate-950" />
            <span>Exportar ({totalFilteredCount})</span>
          </button>
        </div>
      </div>

      {/* Advanced Dynamic Filter Drawer */}
      {showAdvancedFilters && (
        <div className="p-3.5 rounded-2xl border border-white/15 bg-slate-900/90 backdrop-blur-xl text-xs space-y-3 animate-fade-in shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="font-extrabold text-cyan-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <Filter className="w-3.5 h-3.5 text-cyan-400" /> Filtros Dinâmicos
            </span>
            {onResetFilters && hasActiveFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="text-[11px] text-rose-300 hover:text-rose-200 flex items-center gap-1 font-bold transition"
              >
                <RefreshCw className="w-3 h-3" /> Limpar Filtros
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filterOptions.map((opt) => (
              <div key={opt.key} className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-300 truncate" title={opt.label}>
                  {opt.label}
                </label>
                <select
                  value={opt.value}
                  onChange={(e) => opt.onChange(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-white/20 bg-slate-800 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition cursor-pointer"
                >
                  {opt.options.map((o) => (
                    <option key={o.value} value={o.value} className="bg-slate-900 text-white">
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            {onStartDateChange && (
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-300 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-cyan-400 shrink-0" /> Data Inicial
                </label>
                <input
                  type="date"
                  value={startDate || ''}
                  onChange={(e) => onStartDateChange(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-xl border border-white/20 bg-slate-800 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition"
                />
              </div>
            )}

            {onEndDateChange && (
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-300 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-cyan-400 shrink-0" /> Data Final
                </label>
                <input
                  type="date"
                  value={endDate || ''}
                  onChange={(e) => onEndDateChange(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-xl border border-white/20 bg-slate-800 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Export Modal */}
      <ExportDataModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        payload={finalPayload}
      />
    </div>
  );
};
