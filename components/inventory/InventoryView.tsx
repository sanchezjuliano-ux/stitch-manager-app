'use client';

import React, { useState } from 'react';
import { InventoryItem, MaterialTag, DisplayViewMode } from '@/lib/types';
import { ImageUploadOrLink } from '../common/ImageUploadOrLink';
import { DataFilterExportToolbar } from '../common/DataFilterExportToolbar';
import { ExportDataPayload } from '@/lib/exportUtils';
import { Search, Plus, Package, AlertTriangle, CheckCircle, RefreshCw, Edit, Trash2 } from 'lucide-react';

interface InventoryViewProps {
  items: InventoryItem[];
  onAddItem: (newItem: Omit<InventoryItem, 'id'>) => void;
  onUpdateStock: (id: string, delta: number) => void;
  onUpdateItem?: (updatedItem: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
}

const DEFAULT_CATEGORIES = ['Linha de Bordado', 'Entretela', 'Bastidor', 'Agulha', 'Outros'];
const DEFAULT_UNITS = ['retós', 'metros', 'unidades', 'caixas'];

export const InventoryView: React.FC<InventoryViewProps> = ({
  items,
  onAddItem,
  onUpdateStock,
  onUpdateItem,
  onDeleteItem
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<DisplayViewMode>('medium');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [selectedTag, setSelectedTag] = useState<string>('todos');
  const [stockStatusFilter, setStockStatusFilter] = useState<string>('todos');
  const [unitFilter, setUnitFilter] = useState<string>('todos');
  const [sortByFilter, setSortByFilter] = useState<string>('nome_asc');
  const [showAddModal, setShowAddModal] = useState(false);

  // Editing Item state
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editStockQuantity, setEditStockQuantity] = useState<number>(0);
  const [editUnit, setEditUnit] = useState('');
  const [editPricePerUnit, setEditPricePerUnit] = useState<number | ''>(0);
  const [editTag, setEditTag] = useState<MaterialTag>('Normal');
  const [editHasFractioning, setEditHasFractioning] = useState<boolean>(false);
  const [editFractionSize, setEditFractionSize] = useState<number | ''>(500);
  const [editFractionUnit, setEditFractionUnit] = useState<string>('m');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editColorHex, setEditColorHex] = useState('');
  const [editColorName, setEditColorName] = useState('');

  // Custom persistent categories state
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('sm_inventory_categories');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error('Error reading custom categories:', e);
      }
    }
    return [];
  });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategorySuccessMsg, setNewCategorySuccessMsg] = useState('');

  // Custom persistent units state
  const [customUnits, setCustomUnits] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('sm_inventory_units');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error('Error reading custom units:', e);
      }
    }
    return [];
  });
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitSuccessMsg, setNewUnitSuccessMsg] = useState('');

  // Dynamically compute all unique categories in system
  const itemCategories = Array.from(new Set(items.map((i) => i.category).filter(Boolean)));
  const allCategories = Array.from(
    new Set([...DEFAULT_CATEGORIES, ...customCategories, ...itemCategories])
  );

  // Dynamically compute all unique units in system
  const itemUnits = Array.from(new Set(items.map((i) => i.unit).filter(Boolean)));
  const allUnits = Array.from(
    new Set([...DEFAULT_UNITS, ...customUnits, ...itemUnits])
  );

  // Helper to save a new category
  const handleSaveNewCategory = (categoryName: string) => {
    const trimmed = categoryName.trim();
    if (!trimmed) return null;

    const exists = allCategories.some((c) => c.toLowerCase() === trimmed.toLowerCase());
    if (!exists) {
      const updated = [...customCategories, trimmed];
      setCustomCategories(updated);
      try {
        localStorage.setItem('sm_inventory_categories', JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving categories:', e);
      }
    }
    return trimmed;
  };

  // Helper to save a new unit
  const handleSaveNewUnit = (unitName: string) => {
    const trimmed = unitName.trim();
    if (!trimmed) return null;

    const exists = allUnits.some((u) => u.toLowerCase() === trimmed.toLowerCase());
    if (!exists) {
      const updated = [...customUnits, trimmed];
      setCustomUnits(updated);
      try {
        localStorage.setItem('sm_inventory_units', JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving units:', e);
      }
    }
    return trimmed;
  };

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('Linha de Bordado');
  const [imageUrl, setImageUrl] = useState('');
  const [tag, setTag] = useState<MaterialTag>('Alta Rotação');
  const [stockQuantity, setStockQuantity] = useState<number>(20);
  const [unit, setUnit] = useState<string>('retós');
  const [pricePerUnit, setPricePerUnit] = useState<number | ''>(18.50);
  
  // Fractioning State
  const [hasFractioning, setHasFractioning] = useState<boolean>(true);
  const [fractionSize, setFractionSize] = useState<number | ''>(500);
  const [fractionUnit, setFractionUnit] = useState<string>('m');

  const filteredItems = items
    .filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        (item.colorName && item.colorName.toLowerCase().includes(q));

      const matchesCat = selectedCategory === 'Todas' || item.category === selectedCategory;
      const matchesTag = selectedTag === 'todos' || item.tag === selectedTag;

      let matchesStockStatus = true;
      const isLow = item.stockQuantity <= (item.minStockLevel || 5);
      const isZero = item.stockQuantity === 0;

      if (stockStatusFilter === 'critico') matchesStockStatus = isLow && !isZero;
      else if (stockStatusFilter === 'zerado') matchesStockStatus = isZero;
      else if (stockStatusFilter === 'ok') matchesStockStatus = !isLow && !isZero;

      const matchesUnit = unitFilter === 'todos' || item.unit === unitFilter;

      return matchesSearch && matchesCat && matchesTag && matchesStockStatus && matchesUnit;
    })
    .sort((a, b) => {
      if (sortByFilter === 'estoque_asc') return a.stockQuantity - b.stockQuantity;
      if (sortByFilter === 'estoque_desc') return b.stockQuantity - a.stockQuantity;
      if (sortByFilter === 'valor_desc') return (b.stockQuantity * b.pricePerUnit) - (a.stockQuantity * a.pricePerUnit);
      return a.name.localeCompare(b.name, 'pt-BR');
    });

  const totalInventoryValue = filteredItems.reduce((acc, i) => acc + (i.stockQuantity * i.pricePerUnit), 0);

  const inventoryExportPayload: ExportDataPayload = {
    title: 'Relatório de Estoque e Insumos',
    subtitle: 'Ateliê de Bordados - Gestão de Insumos',
    activeFiltersSummary: [
      searchQuery ? `Busca: "${searchQuery}"` : null,
      selectedCategory !== 'Todas' ? `Categoria: ${selectedCategory}` : null,
      selectedTag !== 'todos' ? `Rotação/Tag: ${selectedTag}` : null
    ].filter(Boolean).join(' | ') || 'Todos os insumos',
    headers: ['Código', 'Material / Item', 'Categoria', 'Rotação / Tag', 'Qtd Estoque', 'Unidade', 'Preço Unit. (R$)', 'Valor Total (R$)'],
    rows: filteredItems.map(i => [
      i.code,
      i.name,
      i.category,
      i.tag,
      `${i.stockQuantity}`,
      i.unit,
      `R$ ${i.pricePerUnit.toFixed(2)}`,
      `R$ ${(i.stockQuantity * i.pricePerUnit).toFixed(2)}`
    ]),
    totals: [
      { label: 'Qtd Itens Filtrados', value: `${filteredItems.length}` },
      { label: 'Valor Total em Estoque', value: `R$ ${totalInventoryValue.toFixed(2)}` }
    ]
  };

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const pUnit = Number(pricePerUnit) || 15;
    const fSize = hasFractioning ? (Number(fractionSize) || 500) : undefined;
    const fUnit = hasFractioning ? (fractionUnit || 'm') : undefined;
    const pFrac = (hasFractioning && fSize && fSize > 0) ? pUnit / fSize : undefined;

    onAddItem({
      code: code || `MAT-${Math.floor(Math.random() * 900 + 100)}`,
      name,
      category,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?w=600&auto=format&fit=crop&q=80',
      tag,
      stockQuantity: Number(stockQuantity) || 10,
      unit,
      minStockLevel: 5,
      pricePerUnit: pUnit,
      hasFractioning,
      fractionSize: fSize,
      fractionUnit: fUnit,
      pricePerFractionUnit: pFrac
    });

    setCode('');
    setName('');
    setImageUrl('');
    setShowAddModal(false);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setEditName(item.name || '');
    setEditCode(item.code || '');
    setEditCategory(item.category || 'Outros');
    setEditStockQuantity(item.stockQuantity ?? 0);
    setEditUnit(item.unit || 'unidades');
    setEditPricePerUnit(item.pricePerUnit ?? 0);
    setEditTag(item.tag || 'Normal');
    setEditHasFractioning(Boolean(item.hasFractioning));
    setEditFractionSize(item.fractionSize || 500);
    setEditFractionUnit(item.fractionUnit || 'm');
    setEditImageUrl(item.imageUrl || '');
    setEditColorHex(item.colorHex || '');
    setEditColorName(item.colorName || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const pUnit = Number(editPricePerUnit) || 0;
    const fSize = editHasFractioning ? (Number(editFractionSize) || 500) : undefined;
    const fUnit = editHasFractioning ? (editFractionUnit || 'm') : undefined;
    const pFrac = (editHasFractioning && fSize && fSize > 0) ? pUnit / fSize : undefined;

    const updated: InventoryItem = {
      ...editingItem,
      name: editName,
      code: editCode,
      category: editCategory,
      stockQuantity: Number(editStockQuantity) || 0,
      unit: editUnit,
      pricePerUnit: pUnit,
      tag: editTag,
      hasFractioning: editHasFractioning,
      fractionSize: fSize,
      fractionUnit: fUnit,
      pricePerFractionUnit: pFrac,
      imageUrl: editImageUrl,
      colorHex: editColorHex,
      colorName: editColorName
    };

    if (onUpdateItem) {
      onUpdateItem(updated);
    }
    setEditingItem(null);
  };

  const getTagBadge = (tag: MaterialTag) => {
    switch (tag) {
      case 'Alta Rotação':
        return <span className="px-3 py-1 bg-cyan-500/20 backdrop-blur-md text-cyan-300 border border-cyan-400/40 rounded-full text-xs font-extrabold shadow-md">Alta Rotação</span>;
      case 'Estoque Baixo':
        return <span className="px-3 py-1 bg-amber-500/20 backdrop-blur-md text-amber-300 border border-amber-400/40 rounded-full text-xs font-bold shadow-md flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-amber-400" /> Estoque Baixo</span>;
      case 'Em Falta':
        return <span className="px-3 py-1 bg-rose-500/20 backdrop-blur-md text-rose-300 border border-rose-400/40 rounded-full text-xs font-bold shadow-md">Em Falta</span>;
      default:
        return <span className="px-3 py-1 bg-white/10 backdrop-blur-md text-slate-200 border border-white/15 rounded-full text-xs font-bold shadow-md">Normal</span>;
    }
  };

  return (
    <div className="space-y-5 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Estoque & Insumos</h2>
          <p className="text-xs text-slate-300">Linhas de bordado, entretelas e agulhas</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 text-xs font-extrabold rounded-xl hover:brightness-110 transition shadow-lg shadow-cyan-500/20 border border-cyan-300/40 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4 text-slate-950" /> Novo Insumo
        </button>
      </div>

      {/* Dynamic Filter & Export Toolbar */}
      <DataFilterExportToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Buscar por código, nome do material, cor ou especificação..."
        filterOptions={[
          {
            key: 'tag',
            label: 'Classificação de Rotação',
            value: selectedTag,
            options: [
              { label: 'Todas as Classificações', value: 'todos' },
              { label: 'Alta Rotação', value: 'Alta Rotação' },
              { label: 'Média Rotação', value: 'Média Rotação' },
              { label: 'Baixa Rotação', value: 'Baixa Rotação' }
            ],
            onChange: setSelectedTag
          },
          {
            key: 'stockStatus',
            label: 'Status do Nível de Estoque',
            value: stockStatusFilter,
            options: [
              { label: 'Todos os Status', value: 'todos' },
              { label: 'Alerta / Estoque Crítico', value: 'critico' },
              { label: 'Zerado (Em Falta)', value: 'zerado' },
              { label: 'Estoque Suficiente (OK)', value: 'ok' }
            ],
            onChange: setStockStatusFilter
          },
          {
            key: 'unit',
            label: 'Unidade de Medida',
            value: unitFilter,
            options: [
              { label: 'Todas as Unidades', value: 'todos' },
              ...allUnits.map((u) => ({ label: u, value: u }))
            ],
            onChange: setUnitFilter
          },
          {
            key: 'sortBy',
            label: 'Ordenar Insumos Por',
            value: sortByFilter,
            options: [
              { label: 'Nome (A-Z)', value: 'nome_asc' },
              { label: 'Menor Qtd de Estoque', value: 'estoque_asc' },
              { label: 'Maior Qtd de Estoque', value: 'estoque_desc' },
              { label: 'Maior Valor Total em Estoque', value: 'valor_desc' }
            ],
            onChange: setSortByFilter
          }
        ]}
        onResetFilters={() => {
          setSearchQuery('');
          setSelectedCategory('Todas');
          setSelectedTag('todos');
          setStockStatusFilter('todos');
          setUnitFilter('todos');
          setSortByFilter('nome_asc');
        }}
        exportPayload={inventoryExportPayload}
        totalFilteredCount={filteredItems.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {['Todas', ...allCategories].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition backdrop-blur-md ${
              selectedCategory === cat
                ? 'bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 font-black shadow-md shadow-cyan-500/25 border border-cyan-300/40'
                : 'bg-white/10 border border-white/15 text-slate-300 hover:bg-white/20'
            }`}
          >
            {cat}
          </button>
        ))}

        <button
          onClick={() => setShowCategoryModal(true)}
          className="px-3 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 hover:bg-cyan-500/30 flex items-center gap-1.5 shadow-sm shrink-0"
          title="Lançar Nova Categoria"
        >
          <Plus className="w-3.5 h-3.5 text-cyan-300" />
          Nova Categoria
        </button>
      </div>

      {/* Material Cards List */}
      <div className={
        viewMode === 'large' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' :
        viewMode === 'small' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5' :
        viewMode === 'list' ? 'space-y-2' :
        'space-y-4'
      }>
        {filteredItems.map((item) => {
          if (viewMode === 'small') {
            return (
              <div
                key={item.id}
                className="p-2 rounded-2xl border border-white/10 bg-white/5 space-y-2 backdrop-blur-md flex flex-col justify-between hover:border-cyan-400/50 transition"
              >
                <div className="space-y-1">
                  <div className="relative h-16 w-full rounded-xl overflow-hidden bg-slate-900/60">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <p className="text-xs font-bold text-white truncate mt-1">{item.name}</p>
                  <p className="text-[10px] text-slate-300 truncate">{item.category}</p>
                </div>
                <div className="border-t border-white/10 pt-1 flex items-center justify-between text-[10px]">
                  <span className="font-extrabold text-cyan-300">{item.stockQuantity} {item.unit}</span>
                  <span className="text-slate-300">R${item.pricePerUnit}</span>
                </div>
              </div>
            );
          }

          if (viewMode === 'list') {
            return (
              <div
                key={item.id}
                className="p-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-cyan-400/50 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900/60 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-white truncate block">{item.name}</span>
                    <p className="text-[11px] text-slate-300 truncate">{item.code} • {item.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-cyan-300 block">{item.stockQuantity} {item.unit}</span>
                    <span className="text-[11px] text-slate-300">R$ {item.pricePerUnit.toFixed(2)} / {item.unit}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-lg bg-white/5 text-slate-200 hover:text-white"
                    >
                      <Edit className="w-3.5 h-3.5 text-cyan-300" />
                    </button>
                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="p-1.5 rounded-lg bg-white/5 text-rose-300 hover:text-rose-200"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={item.id} className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/15 shadow-2xl overflow-hidden text-white flex flex-col justify-between">
              {/* Image Header with Badge Overlay */}
              <div>
                <div className="relative h-48 w-full bg-slate-900/60">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  <div className="absolute top-3 right-3">
                    {getTagBadge(item.tag)}
                  </div>
                </div>

                {/* Content & Details */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-cyan-300 tracking-wider uppercase block">
                        {item.code} • {item.category}
                      </span>
                      <h3 className="font-bold text-sm text-white mt-0.5">{item.name}</h3>
                    </div>
                    {item.colorHex && (
                      <div
                        className="w-6 h-6 rounded-full border border-white/40 shadow-md shrink-0"
                        style={{ backgroundColor: item.colorHex }}
                        title={item.colorName || 'Cor do fio'}
                      />
                    )}
                  </div>

                  {/* Stock Quantity Controls */}
                  <div className="flex items-center justify-between p-2.5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                      <span className="text-xs text-slate-300 font-medium">Quantidade:</span>
                      <span className="text-sm font-extrabold text-cyan-300">
                        {item.stockQuantity} {item.unit}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onUpdateStock(item.id, -1)}
                        className="w-7 h-7 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 text-white font-bold text-sm flex items-center justify-center transition backdrop-blur-md"
                      >
                        -
                      </button>
                      <button
                        onClick={() => onUpdateStock(item.id, 1)}
                        className="w-7 h-7 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 font-extrabold text-sm flex items-center justify-center shadow-md transition"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer row with Unit Price and Fractioned Price */}
              <div className="p-4 pt-0">
                <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-white/10 flex-wrap gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span>Preço unitário:</span>
                      <strong className="text-white font-extrabold bg-white/10 px-2 py-0.5 rounded-md border border-white/10">
                        R$ {item.pricePerUnit.toFixed(2)} / {item.unit}
                      </strong>
                    </div>

                    {item.hasFractioning && item.fractionSize && item.fractionUnit && (
                      <div className="text-[11px] text-cyan-300 font-semibold flex items-center gap-1.5 flex-wrap pt-0.5">
                        <span className="px-1.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-200 border border-cyan-400/30">
                          1 {item.unit} = {item.fractionSize} {item.fractionUnit}
                        </span>
                        <span>
                          Preço Fracionado: <strong className="text-white font-bold">R$ {(item.pricePerFractionUnit || (item.pricePerUnit / item.fractionSize)).toFixed(4)} / {item.fractionUnit}</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-auto shrink-0">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="px-2.5 py-1 text-xs font-bold text-cyan-300 hover:text-white bg-cyan-500/20 hover:bg-cyan-500/30 rounded-xl border border-cyan-400/30 transition flex items-center gap-1 shadow-sm"
                    >
                      <Edit className="w-3.5 h-3.5" /> Editar
                    </button>
                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="px-2.5 py-1 text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl border border-rose-500/20 transition flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Excluir
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900/90 border border-white/15 backdrop-blur-2xl rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold text-white">Adicionar Novo Insumo</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Nome do Insumo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Linha Madeira Dourada Art. 1234"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 backdrop-blur-md focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Código</label>
                  <input
                    type="text"
                    placeholder="Ex: L-GOLD"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 backdrop-blur-md focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-300">Categoria</label>
                    <button
                      type="button"
                      onClick={() => setShowCategoryModal(true)}
                      className="text-[11px] font-bold text-cyan-300 hover:text-cyan-200 flex items-center gap-0.5 hover:underline"
                    >
                      <Plus className="w-3 h-3 text-cyan-300" /> Nova
                    </button>
                  </div>
                  <select
                    value={category}
                    onChange={(e) => {
                      if (e.target.value === '__add_new__') {
                        setShowCategoryModal(true);
                      } else {
                        setCategory(e.target.value);
                      }
                    }}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-white/20 bg-slate-900 text-white backdrop-blur-md focus:outline-none focus:border-cyan-400"
                  >
                    {allCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="__add_new__" className="font-bold text-cyan-400 bg-slate-800">
                      + Lançar Nova Categoria...
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Quantidade</label>
                  <input
                    type="number"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 backdrop-blur-md focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-300">Unidade</label>
                    <button
                      type="button"
                      onClick={() => setShowUnitModal(true)}
                      className="text-[11px] font-bold text-cyan-300 hover:text-cyan-200 flex items-center gap-0.5 hover:underline"
                    >
                      <Plus className="w-3 h-3 text-cyan-300" /> Nova
                    </button>
                  </div>
                  <select
                    value={unit}
                    onChange={(e) => {
                      if (e.target.value === '__add_new__') {
                        setShowUnitModal(true);
                      } else {
                        setUnit(e.target.value);
                      }
                    }}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-white/20 bg-slate-900 text-white backdrop-blur-md focus:outline-none focus:border-cyan-400"
                  >
                    {allUnits.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                    <option value="__add_new__" className="font-bold text-cyan-400 bg-slate-800">
                      + Lançar Nova Unidade...
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Preço por Unidade (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Ex: 18.50"
                    value={pricePerUnit}
                    onChange={(e) => setPricePerUnit(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 backdrop-blur-md focus:outline-none focus:border-cyan-400 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Classificação / Rotação</label>
                  <select
                    value={tag}
                    onChange={(e) => setTag(e.target.value as MaterialTag)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-white/20 bg-slate-900 text-white backdrop-blur-md focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Alta Rotação">Alta Rotação</option>
                    <option value="Normal">Normal</option>
                    <option value="Estoque Baixo">Estoque Baixo</option>
                    <option value="Em Falta">Em Falta</option>
                  </select>
                </div>
              </div>

              {/* Fracionamento do Insumo */}
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-200 flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hasFractioning}
                      onChange={(e) => setHasFractioning(e.target.checked)}
                      className="w-4 h-4 rounded text-cyan-400 focus:ring-cyan-400 bg-slate-900 border-white/20 cursor-pointer"
                    />
                    <span>Habilitar Fracionamento do Item</span>
                  </label>
                  <span className="text-[10px] text-cyan-300 font-semibold">(Ex: 1 Retós = 500m)</span>
                </div>

                {hasFractioning && (
                  <div className="space-y-2 pt-1 border-t border-white/10">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-300 mb-1">Qtd/Tamanho por {unit || 'unidade'}</label>
                        <input
                          type="number"
                          min="0.001"
                          step="any"
                          value={fractionSize}
                          onChange={(e) => setFractionSize(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="Ex: 500"
                          className="w-full text-xs px-2.5 py-2 rounded-xl border border-white/20 bg-slate-900 text-white focus:outline-none focus:border-cyan-400 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-300 mb-1">Unidade da Fração</label>
                        <input
                          type="text"
                          value={fractionUnit}
                          onChange={(e) => setFractionUnit(e.target.value)}
                          placeholder="Ex: m, metros, g, un"
                          className="w-full text-xs px-2.5 py-2 rounded-xl border border-white/20 bg-slate-900 text-white focus:outline-none focus:border-cyan-400 font-bold"
                        />
                      </div>
                    </div>

                    {Number(pricePerUnit) > 0 && Number(fractionSize) > 0 && (
                      <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-400/20 text-[11px] text-cyan-200 space-y-0.5">
                        <p className="font-bold flex items-center justify-between">
                          <span>1 {unit || 'unidade'} contém:</span>
                          <span className="text-white font-extrabold">{fractionSize} {fractionUnit || 'm'}</span>
                        </p>
                        <p className="text-white font-extrabold flex items-center justify-between pt-0.5 border-t border-cyan-400/20">
                          <span>Preço Fracionado:</span>
                          <span className="text-cyan-300 text-xs">
                            R$ {(Number(pricePerUnit) / Number(fractionSize)).toFixed(4)} / {fractionUnit || 'm'}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <ImageUploadOrLink
                label="Foto / Imagem do Material"
                value={imageUrl}
                onChange={setImageUrl}
                placeholder="Cole a URL da foto do insumo"
              />

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

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900/95 border border-cyan-400/30 backdrop-blur-2xl rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  <Edit className="w-4 h-4 text-cyan-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Editar Insumo / Material</h3>
                  <p className="text-[11px] text-slate-300">Altere os dados do item no estoque</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-1 text-slate-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Nome do Insumo</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-white/20 bg-slate-950 text-white focus:outline-none focus:border-cyan-400 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Código</label>
                  <input
                    type="text"
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-white/20 bg-slate-950 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-300">Categoria</label>
                    <button
                      type="button"
                      onClick={() => setShowCategoryModal(true)}
                      className="text-[11px] font-bold text-cyan-300 hover:text-cyan-200 flex items-center gap-0.5 hover:underline"
                    >
                      <Plus className="w-3 h-3 text-cyan-300" /> Nova
                    </button>
                  </div>
                  <select
                    value={editCategory}
                    onChange={(e) => {
                      if (e.target.value === '__add_new__') {
                        setShowCategoryModal(true);
                      } else {
                        setEditCategory(e.target.value);
                      }
                    }}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-white/20 bg-slate-900 text-white focus:outline-none focus:border-cyan-400"
                  >
                    {allCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="__add_new__" className="font-bold text-cyan-400 bg-slate-800">
                      + Lançar Nova Categoria...
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Quantidade em Estoque</label>
                  <input
                    type="number"
                    step="any"
                    value={editStockQuantity}
                    onChange={(e) => setEditStockQuantity(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-white/20 bg-slate-950 text-white focus:outline-none focus:border-cyan-400 font-bold"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-300">Unidade</label>
                    <button
                      type="button"
                      onClick={() => setShowUnitModal(true)}
                      className="text-[11px] font-bold text-cyan-300 hover:text-cyan-200 flex items-center gap-0.5 hover:underline"
                    >
                      <Plus className="w-3 h-3 text-cyan-300" /> Nova
                    </button>
                  </div>
                  <select
                    value={editUnit}
                    onChange={(e) => {
                      if (e.target.value === '__add_new__') {
                        setShowUnitModal(true);
                      } else {
                        setEditUnit(e.target.value);
                      }
                    }}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-white/20 bg-slate-900 text-white focus:outline-none focus:border-cyan-400 font-semibold"
                  >
                    {allUnits.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                    <option value="__add_new__" className="font-bold text-cyan-400 bg-slate-800">
                      + Lançar Nova Unidade...
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Preço por Unidade (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editPricePerUnit}
                    onChange={(e) => setEditPricePerUnit(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-white/20 bg-slate-950 text-white focus:outline-none focus:border-cyan-400 font-bold text-cyan-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Classificação / Rotação</label>
                  <select
                    value={editTag}
                    onChange={(e) => setEditTag(e.target.value as MaterialTag)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-white/20 bg-slate-900 text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Alta Rotação">Alta Rotação</option>
                    <option value="Normal">Normal</option>
                    <option value="Estoque Baixo">Estoque Baixo</option>
                    <option value="Em Falta">Em Falta</option>
                  </select>
                </div>
              </div>

              {/* Fracionamento do Insumo na Edição */}
              <div className="p-3 bg-slate-950/60 rounded-2xl border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-200 flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editHasFractioning}
                      onChange={(e) => setEditHasFractioning(e.target.checked)}
                      className="w-4 h-4 rounded text-cyan-400 focus:ring-cyan-400 bg-slate-900 border-white/20 cursor-pointer"
                    />
                    <span>Habilitar Fracionamento</span>
                  </label>
                  <span className="text-[10px] text-cyan-300 font-semibold">(Ex: 1 {editUnit || 'unidade'} = {editFractionSize}{editFractionUnit})</span>
                </div>

                {editHasFractioning && (
                  <div className="space-y-2 pt-1 border-t border-white/10">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-300 mb-1">Qtd/Tamanho por {editUnit || 'unidade'}</label>
                        <input
                          type="number"
                          min="0.001"
                          step="any"
                          value={editFractionSize}
                          onChange={(e) => setEditFractionSize(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="Ex: 500"
                          className="w-full text-xs px-2.5 py-2 rounded-xl border border-white/20 bg-slate-900 text-white focus:outline-none focus:border-cyan-400 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-300 mb-1">Unidade da Fração</label>
                        <input
                          type="text"
                          value={editFractionUnit}
                          onChange={(e) => setEditFractionUnit(e.target.value)}
                          placeholder="Ex: m, metros, g, un"
                          className="w-full text-xs px-2.5 py-2 rounded-xl border border-white/20 bg-slate-900 text-white focus:outline-none focus:border-cyan-400 font-bold"
                        />
                      </div>
                    </div>

                    {Number(editPricePerUnit) > 0 && Number(editFractionSize) > 0 && (
                      <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-400/20 text-[11px] text-cyan-200 space-y-0.5">
                        <p className="font-bold flex items-center justify-between">
                          <span>1 {editUnit || 'unidade'} contém:</span>
                          <span className="text-white font-extrabold">{editFractionSize} {editFractionUnit || 'm'}</span>
                        </p>
                        <p className="text-white font-extrabold flex items-center justify-between pt-0.5 border-t border-cyan-400/20">
                          <span>Preço Fracionado:</span>
                          <span className="text-cyan-300 text-xs">
                            R$ {(Number(editPricePerUnit) / Number(editFractionSize)).toFixed(4)} / {editFractionUnit || 'm'}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <ImageUploadOrLink
                label="Foto / Imagem do Material"
                value={editImageUrl}
                onChange={setEditImageUrl}
                placeholder="URL da imagem do insumo"
              />

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 py-2.5 border border-white/20 bg-white/10 hover:bg-white/20 font-semibold text-slate-300 rounded-xl transition backdrop-blur-md"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-cyan-500/25 border border-cyan-300/40 hover:brightness-110 active:scale-95 transition"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Creator Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/15 backdrop-blur-2xl rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  <Plus className="w-4 h-4 text-cyan-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Lançar Nova Categoria</h3>
                  <p className="text-[11px] text-slate-300">Cadastre uma nova categoria para o estoque</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setNewCategoryName('');
                  setNewCategorySuccessMsg('');
                }}
                className="p-1 text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newCategoryName.trim()) return;
                const created = handleSaveNewCategory(newCategoryName);
                if (created) {
                  setCategory(created); // Auto-select in item form
                  setSelectedCategory(created); // Auto-filter top pills
                  setNewCategorySuccessMsg(`Categoria "${created}" salva com sucesso!`);
                  setTimeout(() => {
                    setShowCategoryModal(false);
                    setNewCategoryName('');
                    setNewCategorySuccessMsg('');
                  }, 1200);
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nome da Categoria</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pedrarias, Termocolantes, Fitilhos, Embalagens..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 backdrop-blur-md focus:outline-none focus:border-cyan-400"
                  autoFocus
                />
              </div>

              {newCategorySuccessMsg && (
                <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{newCategorySuccessMsg}</span>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false);
                    setNewCategoryName('');
                    setNewCategorySuccessMsg('');
                  }}
                  className="flex-1 py-2 text-xs border border-white/20 bg-white/10 hover:bg-white/20 font-semibold text-slate-300 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-cyan-500/25 border border-cyan-300/40 hover:brightness-110 active:scale-95 transition"
                >
                  Salvar Categoria
                </button>
              </div>
            </form>

            {/* List of registered custom categories */}
            {customCategories.length > 0 && (
              <div className="pt-2 border-t border-white/10 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-300">Categorias Personalizadas Salvas:</span>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                  {customCategories.map((cat) => (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 border border-white/15 text-slate-200 rounded-lg text-[11px] font-medium"
                    >
                      {cat}
                      <button
                        type="button"
                        onClick={() => {
                          const updated = customCategories.filter((c) => c !== cat);
                          setCustomCategories(updated);
                          try {
                            localStorage.setItem('sm_inventory_categories', JSON.stringify(updated));
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-400 text-xs ml-1"
                        title="Remover categoria"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Unit Creator Modal */}
      {showUnitModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/15 backdrop-blur-2xl rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  <Plus className="w-4 h-4 text-cyan-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Lançar Nova Unidade</h3>
                  <p className="text-[11px] text-slate-300">Cadastre uma nova unidade de medida de insumo</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowUnitModal(false);
                  setNewUnitName('');
                  setNewUnitSuccessMsg('');
                }}
                className="p-1 text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newUnitName.trim()) return;
                const created = handleSaveNewUnit(newUnitName);
                if (created) {
                  setUnit(created); // Auto-select in item form
                  setNewUnitSuccessMsg(`Unidade "${created}" salva com sucesso!`);
                  setTimeout(() => {
                    setShowUnitModal(false);
                    setNewUnitName('');
                    setNewUnitSuccessMsg('');
                  }, 1200);
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nome da Unidade</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: kg, rolos, pares, pacotes, litros..."
                  value={newUnitName}
                  onChange={(e) => setNewUnitName(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 backdrop-blur-md focus:outline-none focus:border-cyan-400"
                  autoFocus
                />
              </div>

              {newUnitSuccessMsg && (
                <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{newUnitSuccessMsg}</span>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowUnitModal(false);
                    setNewUnitName('');
                    setNewUnitSuccessMsg('');
                  }}
                  className="flex-1 py-2 text-xs border border-white/20 bg-white/10 hover:bg-white/20 font-semibold text-slate-300 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-cyan-500/25 border border-cyan-300/40 hover:brightness-110 active:scale-95 transition"
                >
                  Salvar Unidade
                </button>
              </div>
            </form>

            {/* List of registered custom units */}
            {customUnits.length > 0 && (
              <div className="pt-2 border-t border-white/10 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-300">Unidades Personalizadas Salvas:</span>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                  {customUnits.map((u) => (
                    <span
                      key={u}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 border border-white/15 text-slate-200 rounded-lg text-[11px] font-medium"
                    >
                      {u}
                      <button
                        type="button"
                        onClick={() => {
                          const updated = customUnits.filter((item) => item !== u);
                          setCustomUnits(updated);
                          try {
                            localStorage.setItem('sm_inventory_units', JSON.stringify(updated));
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-400 text-xs ml-1"
                        title="Remover unidade"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
