'use client';

import React, { useState } from 'react';
import { ExecutedService, ProductType, DisplayViewMode } from '@/lib/types';
import { ImageUploadOrLink } from '../common/ImageUploadOrLink';
import { DataFilterExportToolbar } from '../common/DataFilterExportToolbar';
import { ExportDataPayload } from '@/lib/exportUtils';
import { 
  Layers, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Sparkles, 
  FileText, 
  Clock, 
  Tag, 
  Check, 
  ArrowUpRight,
  Shirt,
  Smartphone,
  Cpu,
  BookmarkCheck,
  TrendingUp,
  Hash
} from 'lucide-react';

interface ServicesViewProps {
  services: ExecutedService[];
  onAddService: (newService: Omit<ExecutedService, 'id' | 'code'> & { code?: string }) => void;
  onUpdateService: (updatedService: ExecutedService) => void;
  onDeleteService: (id: string) => void;
}

export const ServicesView: React.FC<ServicesViewProps> = ({
  services,
  onAddService,
  onUpdateService,
  onDeleteService
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<ExecutedService | null>(null);

  // Filters, Search & View Mode State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('todos');
  const [filterSortBy, setFilterSortBy] = useState<string>('mais_executados');
  const [viewMode, setViewMode] = useState<DisplayViewMode>('medium');

  // Form State for New Service
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Bordado Computadorizado');
  const [customCategory, setCustomCategory] = useState('');
  const [subcategory, setSubcategory] = useState('Uniformes & Trabalho');
  const [customSubcategory, setCustomSubcategory] = useState('');
  const [description, setDescription] = useState('');
  const [defaultPrice, setDefaultPrice] = useState<number | ''>(25);
  const [unit, setUnit] = useState('peça');
  const [productType, setProductType] = useState<ProductType>('fisico');
  const [estimatedStitchCount, setEstimatedStitchCount] = useState<number | ''>(12000);
  const [suggestedEmbroiderySize, setSuggestedEmbroiderySize] = useState('10x10cm');
  const [suggestedHoopSize, setSuggestedHoopSize] = useState('13x18cm');
  const [estimatedTimeMinutes, setEstimatedTimeMinutes] = useState<number | ''>(20);
  const [imageUrl, setImageUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('Mais Vendido, Produto Físico');

  // Edit Modal State
  const [editCode, setEditCode] = useState('');
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('Bordado Computadorizado');
  const [editSubcategory, setEditSubcategory] = useState('Uniformes & Trabalho');
  const [editDescription, setEditDescription] = useState('');
  const [editDefaultPrice, setEditDefaultPrice] = useState<number | ''>(0);
  const [editUnit, setEditUnit] = useState('peça');
  const [editProductType, setEditProductType] = useState<ProductType>('fisico');
  const [editEstimatedStitchCount, setEditEstimatedStitchCount] = useState<number | ''>(0);
  const [editSuggestedEmbroiderySize, setEditSuggestedEmbroiderySize] = useState('');
  const [editSuggestedHoopSize, setEditSuggestedHoopSize] = useState('');
  const [editEstimatedTimeMinutes, setEditEstimatedTimeMinutes] = useState<number | ''>(0);
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editTagsInput, setEditTagsInput] = useState('');

  const DEFAULT_CATEGORIES = [
    'Bordado Computadorizado',
    'Programação de Matriz',
    'Personalização & Monograma',
    'Aplicação & Patch',
    'Acabamento & Costura',
    'Outros'
  ];

  const DEFAULT_SUBCATEGORIES = [
    'Uniformes & Trabalho',
    'Escolar & Infantil',
    'Nomes & Iniciais',
    'Logomarcas & Brasões',
    'Patchs & Emblemas',
    'Toalhas & Enxoval',
    'Matrizes de Bastidor',
    'Geral',
    'Outros'
  ];

  // Persistent Custom Categories state
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('sm_service_categories');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error('Error reading custom service categories:', e);
      }
    }
    return [];
  });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategorySuccessMsg, setNewCategorySuccessMsg] = useState('');
  const [targetCategoryField, setTargetCategoryField] = useState<'create' | 'edit'>('create');

  // Persistent Custom Subcategories state
  const [customSubcategories, setCustomSubcategories] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('sm_service_subcategories');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error('Error reading custom service subcategories:', e);
      }
    }
    return [];
  });
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [newSubcategorySuccessMsg, setNewSubcategorySuccessMsg] = useState('');
  const [targetSubcategoryField, setTargetSubcategoryField] = useState<'create' | 'edit'>('create');

  // Filter Subcategory state
  const [filterSubcategory, setFilterSubcategory] = useState<string>('todos');

  // Dynamically compute all unique service categories
  const serviceCategories = Array.from(new Set(services.map(s => s.category).filter(Boolean)));
  const allCategories = Array.from(
    new Set([...DEFAULT_CATEGORIES.filter(c => c !== 'Outros'), ...customCategories, ...serviceCategories, 'Outros'])
  );

  // Dynamically compute all unique service subcategories
  const serviceSubcategories = Array.from(new Set(services.map(s => s.subcategory).filter((s): s is string => Boolean(s))));
  const allSubcategories = Array.from(
    new Set([...DEFAULT_SUBCATEGORIES.filter(c => c !== 'Outros'), ...customSubcategories, ...serviceSubcategories, 'Outros'])
  );

  const handleSaveNewCategory = (catName: string, targetField: 'create' | 'edit' = 'create') => {
    const trimmed = catName.trim();
    if (!trimmed) return null;

    if (!allCategories.includes(trimmed)) {
      const updated = [...customCategories, trimmed];
      setCustomCategories(updated);
      try {
        localStorage.setItem('sm_service_categories', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save service categories:', e);
      }
    }

    if (targetField === 'create') {
      setCategory(trimmed);
    } else {
      setEditCategory(trimmed);
    }

    setNewCategorySuccessMsg(`Categoria "${trimmed}" adicionada com sucesso!`);
    setTimeout(() => setNewCategorySuccessMsg(''), 3000);
    setNewCategoryName('');
    return trimmed;
  };

  const handleDeleteCustomCategory = (catToDelete: string) => {
    const updated = customCategories.filter(c => c !== catToDelete);
    setCustomCategories(updated);
    try {
      localStorage.setItem('sm_service_categories', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to update service categories:', e);
    }
  };

  const handleSaveNewSubcategory = (subName: string, targetField: 'create' | 'edit' = 'create') => {
    const trimmed = subName.trim();
    if (!trimmed) return null;

    if (!allSubcategories.includes(trimmed)) {
      const updated = [...customSubcategories, trimmed];
      setCustomSubcategories(updated);
      try {
        localStorage.setItem('sm_service_subcategories', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save service subcategories:', e);
      }
    }

    if (targetField === 'create') {
      setSubcategory(trimmed);
    } else {
      setEditSubcategory(trimmed);
    }

    setNewSubcategorySuccessMsg(`Subcategoria "${trimmed}" adicionada com sucesso!`);
    setTimeout(() => setNewSubcategorySuccessMsg(''), 3000);
    setNewSubcategoryName('');
    return trimmed;
  };

  const handleDeleteCustomSubcategory = (subToDelete: string) => {
    const updated = customSubcategories.filter(s => s !== subToDelete);
    setCustomSubcategories(updated);
    try {
      localStorage.setItem('sm_service_subcategories', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to update service subcategories:', e);
    }
  };

  const handleOpenEditModal = (srv: ExecutedService) => {
    setEditingService(srv);
    setEditCode(srv.code || '');
    setEditName(srv.name);
    setEditCategory(srv.category || 'Bordado Computadorizado');
    setEditSubcategory(srv.subcategory || 'Uniformes & Trabalho');
    setEditDescription(srv.description || '');
    setEditDefaultPrice(srv.defaultPrice ?? 0);
    setEditUnit(srv.unit || 'peça');
    setEditProductType(srv.productType || 'fisico');
    setEditEstimatedStitchCount(srv.estimatedStitchCount ?? 10000);
    setEditSuggestedEmbroiderySize(srv.suggestedEmbroiderySize || '10x10cm');
    setEditSuggestedHoopSize(srv.suggestedHoopSize || '13x18cm');
    setEditEstimatedTimeMinutes(srv.estimatedTimeMinutes ?? 20);
    setEditImageUrl(srv.imageUrl || '');
    setEditTagsInput(srv.tags ? srv.tags.join(', ') : '');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalCategory = category === 'Outros' && customCategory.trim() ? customCategory.trim() : category;
    const finalSubcategory = subcategory === 'Outros' && customSubcategory.trim() ? customSubcategory.trim() : subcategory;

    const tagsArray = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    onAddService({
      code: code.trim() || undefined,
      name: name.trim(),
      category: finalCategory,
      subcategory: finalSubcategory,
      description: description.trim(),
      defaultPrice: Number(defaultPrice) || 0,
      unit: unit.trim() || 'peça',
      productType,
      estimatedStitchCount: Number(estimatedStitchCount) || undefined,
      suggestedEmbroiderySize: suggestedEmbroiderySize.trim() || undefined,
      suggestedHoopSize: suggestedHoopSize.trim() || undefined,
      estimatedTimeMinutes: Number(estimatedTimeMinutes) || undefined,
      imageUrl: imageUrl.trim() || undefined,
      tags: tagsArray.length > 0 ? tagsArray : undefined,
      timesExecuted: 0,
      lastUsedDate: new Date().toLocaleDateString('pt-BR')
    });

    // Reset Form
    setCode('');
    setName('');
    setDescription('');
    setDefaultPrice(25);
    setUnit('peça');
    setEstimatedStitchCount(12000);
    setSuggestedEmbroiderySize('10x10cm');
    setSuggestedHoopSize('13x18cm');
    setEstimatedTimeMinutes(20);
    setImageUrl('');
    setTagsInput('Mais Vendido, Produto Físico');
    setShowForm(false);
  };

  const handleSaveEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService || !editName.trim()) return;

    const tagsArray = editTagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const updated: ExecutedService = {
      ...editingService,
      code: editCode.trim() ? editCode.trim().toUpperCase() : editingService.code,
      name: editName.trim(),
      category: editCategory,
      subcategory: editSubcategory,
      description: editDescription.trim(),
      defaultPrice: Number(editDefaultPrice) || 0,
      unit: editUnit.trim() || 'peça',
      productType: editProductType,
      estimatedStitchCount: Number(editEstimatedStitchCount) || undefined,
      suggestedEmbroiderySize: editSuggestedEmbroiderySize.trim() || undefined,
      suggestedHoopSize: editSuggestedHoopSize.trim() || undefined,
      estimatedTimeMinutes: Number(editEstimatedTimeMinutes) || undefined,
      imageUrl: editImageUrl.trim() || undefined,
      tags: tagsArray.length > 0 ? tagsArray : undefined
    };

    onUpdateService(updated);
    setEditingService(null);
  };

  // Filtering & Sorting
  const filteredServices = services
    .filter(s => {
      const matchesCategory = filterCategory === 'todos' || s.category === filterCategory;
      const matchesSubcategory = filterSubcategory === 'todos' || s.subcategory === filterSubcategory;
      const matchesSearch = !searchQuery || 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.subcategory && s.subcategory.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.tags && s.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));

      return matchesCategory && matchesSubcategory && matchesSearch;
    })
    .sort((a, b) => {
      if (filterSortBy === 'mais_executados') return (b.timesExecuted || 0) - (a.timesExecuted || 0);
      if (filterSortBy === 'maior_preco') return b.defaultPrice - a.defaultPrice;
      if (filterSortBy === 'menor_preco') return a.defaultPrice - b.defaultPrice;
      if (filterSortBy === 'nome') return a.name.localeCompare(b.name, 'pt-BR');
      return a.code.localeCompare(b.code, 'pt-BR');
    });

  // Analytics Metrics
  const totalServicesCount = services.length;
  const mostPopular = [...services].sort((a, b) => (b.timesExecuted || 0) - (a.timesExecuted || 0))[0];
  const avgPrice = services.length > 0
    ? services.reduce((acc, s) => acc + s.defaultPrice, 0) / services.length
    : 0;

  // Export Data Payload Generator
  const exportPayload: ExportDataPayload = {
    title: 'Guia de Serviços Executados & Referências',
    subtitle: 'Ateliê de Bordados Computadorizados — Catálogo Técnico',
    activeFiltersSummary: [
      searchQuery ? `Busca: "${searchQuery}"` : null,
      filterCategory !== 'todos' ? `Categoria: ${filterCategory}` : null
    ].filter(Boolean).join(' | ') || 'Todos os Serviços',
    headers: ['Código', 'Serviço', 'Categoria', 'Preço Base', 'Tipo', 'Pontos', 'Tamanho', 'Bastidor', 'Tempo', 'Execuções'],
    rows: filteredServices.map(s => [
      s.code,
      s.name,
      s.category,
      `R$ ${s.defaultPrice.toFixed(2)} / ${s.unit}`,
      s.productType === 'virtual' ? 'Matriz Virtual' : 'Produto Físico',
      s.estimatedStitchCount ? `${s.estimatedStitchCount.toLocaleString('pt-BR')} pts` : '-',
      s.suggestedEmbroiderySize || '-',
      s.suggestedHoopSize || '-',
      s.estimatedTimeMinutes ? `${s.estimatedTimeMinutes} min` : '-',
      s.timesExecuted ? `${s.timesExecuted} vezes` : '0'
    ]),
    totals: [
      { label: 'Qtd de Serviços Cadastrados', value: `${filteredServices.length}` },
      { label: 'Preço Médio dos Serviços', value: `R$ ${avgPrice.toFixed(2)}` }
    ]
  };

  return (
    <div className="space-y-6 pb-20 text-white">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            Guia de Serviços Executados
          </h2>
          <p className="text-xs text-slate-300">Catálogo de referência para orçamentos e agilidade no atendimento</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3.5 py-2 bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 text-xs font-bold rounded-xl hover:brightness-110 transition shadow-lg shadow-cyan-500/20 border border-cyan-300/40 flex items-center gap-1.5 cursor-pointer"
        >
          {showForm ? <Check className="w-4 h-4 text-slate-950" /> : <Plus className="w-4 h-4 text-slate-950" />}
          {showForm ? 'Ver Catálogo' : 'Novo Serviço'}
        </button>
      </div>

      {/* Metrics Banner */}
      {!showForm && (
        <div className="grid grid-cols-3 gap-2.5">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-1">
            <span className="text-[10px] text-slate-300 uppercase font-bold tracking-wider block">Total Cadastrado</span>
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span className="text-base font-extrabold text-white">{totalServicesCount}</span>
            </div>
            <span className="text-[9px] text-cyan-300 block">serviços em catálogo</span>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-1">
            <span className="text-[10px] text-slate-300 uppercase font-bold tracking-wider block">Mais Solicitado</span>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white truncate">{mostPopular?.name || 'Carregando...'}</span>
            </div>
            <span className="text-[9px] text-emerald-300 block">{mostPopular?.timesExecuted || 0} execuções</span>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-1">
            <span className="text-[10px] text-slate-300 uppercase font-bold tracking-wider block">Preço Médio</span>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-base font-extrabold text-white">R$ {avgPrice.toFixed(2)}</span>
            </div>
            <span className="text-[9px] text-purple-300 block">valor base médio</span>
          </div>
        </div>
      )}

      {showForm ? (
        /* Form: Cadastrar Novo Serviço de Referência */
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/15 shadow-2xl p-4 sm:p-6 space-y-6 text-white animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-cyan-400" /> Cadastrar Serviço na Guia
            </h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-xs text-slate-300 hover:text-white underline transition"
            >
              ← Voltar ao Catálogo
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Código e Nome do Serviço */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-300">Código do Serviço *</label>
                  <button
                    type="button"
                    onClick={() => {
                      const nextNum = services.length + 1;
                      setCode(`SRV-${String(nextNum).padStart(3, '0')}`);
                    }}
                    className="text-[10px] font-bold text-cyan-300 hover:text-cyan-200 transition flex items-center gap-0.5"
                    title="Gerar código padrão sequencial"
                  >
                    Auto-gerar
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={code || `SRV-${String(services.length + 1).padStart(3, '0')}`}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder={`SRV-${String(services.length + 1).padStart(3, '0')}`}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-white/20 bg-slate-900/80 text-cyan-300 font-mono font-bold placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1">Nome do Serviço / Referência *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Bordado Peitoral de Logomarca (Até 10x10cm)"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-white/20 bg-slate-900/80 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Categoria, Subcategoria & Tipo de Produto */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-300">Categoria do Serviço</label>
                  <button
                    type="button"
                    onClick={() => {
                      setTargetCategoryField('create');
                      setShowCategoryModal(true);
                    }}
                    className="text-[11px] font-bold text-cyan-300 hover:text-cyan-200 flex items-center gap-1 transition"
                  >
                    <Plus className="w-3 h-3" /> Adicionar Categoria
                  </button>
                </div>
                <select
                  value={category}
                  onChange={(e) => {
                    if (e.target.value === '__add_new__') {
                      setTargetCategoryField('create');
                      setShowCategoryModal(true);
                    } else {
                      setCategory(e.target.value);
                    }
                  }}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-white/20 bg-slate-900 text-white focus:outline-none focus:border-cyan-400 font-medium"
                >
                  {allCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="__add_new__" className="text-cyan-300 font-bold">+ Adicionar Nova Categoria...</option>
                </select>

                {category === 'Outros' && (
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Digite a categoria customizada..."
                    className="w-full text-xs px-3 py-2 mt-2 rounded-xl border border-white/20 bg-slate-900/80 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                  />
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-300">Subcategoria do Serviço</label>
                  <button
                    type="button"
                    onClick={() => {
                      setTargetSubcategoryField('create');
                      setShowSubcategoryModal(true);
                    }}
                    className="text-[11px] font-bold text-cyan-300 hover:text-cyan-200 flex items-center gap-1 transition"
                  >
                    <Plus className="w-3 h-3" /> Adicionar Subcategoria
                  </button>
                </div>
                <select
                  value={subcategory}
                  onChange={(e) => {
                    if (e.target.value === '__add_new__') {
                      setTargetSubcategoryField('create');
                      setShowSubcategoryModal(true);
                    } else {
                      setSubcategory(e.target.value);
                    }
                  }}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-white/20 bg-slate-900 text-white focus:outline-none focus:border-cyan-400 font-medium"
                >
                  {allSubcategories.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                  <option value="__add_new__" className="text-cyan-300 font-bold">+ Adicionar Nova Subcategoria...</option>
                </select>

                {subcategory === 'Outros' && (
                  <input
                    type="text"
                    value={customSubcategory}
                    onChange={(e) => setCustomSubcategory(e.target.value)}
                    placeholder="Digite a subcategoria customizada..."
                    className="w-full text-xs px-3 py-2 mt-2 rounded-xl border border-white/20 bg-slate-900/80 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Tipo de Produto</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setProductType('fisico')}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      productType === 'fisico'
                        ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-md'
                        : 'bg-slate-900/50 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <Shirt className="w-3.5 h-3.5" /> Físico
                  </button>

                  <button
                    type="button"
                    onClick={() => setProductType('virtual')}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      productType === 'virtual'
                        ? 'bg-purple-500/20 border-purple-400 text-white shadow-md'
                        : 'bg-slate-900/50 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" /> Matriz Virtual
                  </button>
                </div>
              </div>
            </div>

            {/* Preço Base & Unidade */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Preço Base Sugerido (R$)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={defaultPrice}
                  onChange={(e) => setDefaultPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-white/20 bg-slate-900/80 text-white font-bold focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Unidade de Cobrança</label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="Ex: peça, matriz, unidade, milhar"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-white/20 bg-slate-900/80 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Descrição & Especificações Técnicas */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Descrição & Instruções Técnicas</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Recomenda-se entretela rasgável 80g e bastidor 13x18. Acabamento especial de recortes de fios..."
                className="w-full text-xs p-3 rounded-xl border border-white/20 bg-slate-900/80 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Especificações para Orçamento Rápido */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider block">
                Especificações Técnicas Médias
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[10px] text-slate-300 mb-1">Qtd de Pontos (Est.)</label>
                  <input
                    type="number"
                    value={estimatedStitchCount}
                    onChange={(e) => setEstimatedStitchCount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Ex: 12000"
                    className="w-full text-xs px-2.5 py-2 rounded-xl border border-white/20 bg-slate-900 text-white font-semibold focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-300 mb-1">Tamanho do Bordado</label>
                  <input
                    type="text"
                    value={suggestedEmbroiderySize}
                    onChange={(e) => setSuggestedEmbroiderySize(e.target.value)}
                    placeholder="Ex: 10x10cm"
                    className="w-full text-xs px-2.5 py-2 rounded-xl border border-white/20 bg-slate-900 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-300 mb-1">Bastidor Recomendado</label>
                  <input
                    type="text"
                    value={suggestedHoopSize}
                    onChange={(e) => setSuggestedHoopSize(e.target.value)}
                    placeholder="Ex: 13x18cm"
                    className="w-full text-xs px-2.5 py-2 rounded-xl border border-white/20 bg-slate-900 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-300 mb-1">Tempo Máquina (Min)</label>
                  <input
                    type="number"
                    value={estimatedTimeMinutes}
                    onChange={(e) => setEstimatedTimeMinutes(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Ex: 20"
                    className="w-full text-xs px-2.5 py-2 rounded-xl border border-white/20 bg-slate-900 text-white font-semibold focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            </div>

            {/* Imagem ou Foto de Referência */}
            <ImageUploadOrLink
              label="Foto do Serviço Executado / Exemplo"
              value={imageUrl}
              onChange={setImageUrl}
              placeholder="Cole o link da imagem da peça ou matriz pronta (http://...)"
            />

            {/* Tags / Marcadores */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Tags / Marcadores (separados por vírgula)</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Ex: Mais Vendido, Produto Físico, Promoção, Rápido"
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-white/20 bg-slate-900/80 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 rounded-xl border border-white/20 bg-white/5 text-slate-300 hover:text-white text-xs font-bold transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 font-black text-xs hover:brightness-110 active:scale-95 transition shadow-lg shadow-cyan-500/20"
              >
                Salvar Serviço na Guia
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Catálogo Lista e Filtros */
        <div className="space-y-4">
          {/* Toolbar de Exportação & Filtros */}
          <DataFilterExportToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Buscar por código, nome, tags..."
            exportPayload={exportPayload}
            totalFilteredCount={filteredServices.length}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          {/* Filtro por Categoria, Subcategoria e Ordenação */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Categoria:</span>
                <button
                  onClick={() => setFilterCategory('todos')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    filterCategory === 'todos'
                      ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  Todas ({services.length})
                </button>
                {allCategories.map(cat => {
                  const count = services.filter(s => s.category === cat).length;
                  if (count === 0 && filterCategory !== cat) return null;
                  return (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                        filterCategory === cat
                          ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>

              <select
                value={filterSortBy}
                onChange={(e) => setFilterSortBy(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-xl border border-white/20 bg-slate-900 text-slate-200 font-semibold focus:outline-none shrink-0"
              >
                <option value="mais_executados">Mais Utilizados</option>
                <option value="maior_preco">Maior Preço</option>
                <option value="menor_preco">Menor Preço</option>
                <option value="nome">Nome A-Z</option>
              </select>
            </div>

            {/* Guia / Filtro de Subcategoria */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-2 border-t border-white/10">
              <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
                <Layers className="w-3 h-3 text-cyan-400" /> Subcategoria:
              </span>
              <button
                onClick={() => setFilterSubcategory('todos')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition shrink-0 ${
                  filterSubcategory === 'todos'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm font-black'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                }`}
              >
                Todas
              </button>
              {allSubcategories.map(sub => {
                const count = services.filter(s => {
                  const matchesCat = filterCategory === 'todos' || s.category === filterCategory;
                  return matchesCat && s.subcategory === sub;
                }).length;
                if (count === 0 && filterSubcategory !== sub) return null;
                return (
                  <button
                    key={sub}
                    onClick={() => setFilterSubcategory(sub)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap shrink-0 ${
                      filterSubcategory === sub
                        ? 'bg-cyan-500 text-slate-950 shadow-sm font-black'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    {sub} ({count})
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  setTargetSubcategoryField('create');
                  setShowSubcategoryModal(true);
                }}
                className="px-2 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-[10px] font-bold flex items-center gap-1 transition shrink-0 border border-cyan-400/30 ml-auto"
              >
                <Plus className="w-3 h-3" /> Gerenciar Subcategorias
              </button>
            </div>
          </div>

          {/* Lista de Cards de Serviços Executados */}
          {filteredServices.length > 0 ? (
            <div className={
              viewMode === 'large'
                ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
                : viewMode === 'small'
                ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5'
                : viewMode === 'list'
                ? 'space-y-2'
                : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5'
            }>
              {filteredServices.map((srv) => {
                if (viewMode === 'list') {
                  return (
                    <div
                      key={srv.id}
                      className="bg-white/10 backdrop-blur-2xl rounded-2xl border border-white/15 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-cyan-400/50 transition shadow-md"
                    >
                      <div className="flex items-center gap-3 shrink-0 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-950 border border-white/15 overflow-hidden shrink-0 flex items-center justify-center">
                          {srv.imageUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={srv.imageUrl} alt={srv.name} className="w-full h-full object-cover" />
                          ) : (
                            <Layers className="w-5 h-5 text-cyan-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300">
                              {srv.code}
                            </span>
                            <span className="text-[10px] text-slate-300 font-semibold truncate">{srv.category}</span>
                            {srv.subcategory && (
                              <span className="text-[9px] text-cyan-300 bg-cyan-500/10 px-1.5 py-0.2 rounded font-semibold border border-cyan-400/20">
                                {srv.subcategory}
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-xs text-white truncate">{srv.name}</h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 justify-between sm:justify-end shrink-0 text-xs">
                        <div className="text-right">
                          <span className="text-cyan-300 font-black">R$ {srv.defaultPrice.toFixed(2)}</span>
                          <span className="text-[10px] text-slate-400 block">/ {srv.unit}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 hidden lg:block text-right">
                          <span>{srv.estimatedStitchCount ? `${srv.estimatedStitchCount.toLocaleString()} pts` : ''}</span>
                          <span className="block">{srv.estimatedTimeMinutes ? `${srv.estimatedTimeMinutes} min` : ''}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(srv)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white transition"
                            title="Editar Serviço"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Deseja excluir o serviço "${srv.name}" da guia?`)) {
                                onDeleteService(srv.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 border border-white/10 text-slate-400 hover:text-rose-400 transition"
                            title="Excluir Serviço"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (viewMode === 'small') {
                  return (
                    <div
                      key={srv.id}
                      className="bg-white/10 backdrop-blur-2xl rounded-2xl border border-white/15 p-2.5 flex flex-col justify-between hover:border-cyan-400/50 transition shadow-md relative group space-y-2"
                    >
                      <div className="w-full h-20 rounded-xl bg-slate-950 border border-white/15 overflow-hidden flex items-center justify-center relative">
                        {srv.imageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={srv.imageUrl} alt={srv.name} className="w-full h-full object-cover" />
                        ) : (
                          <Layers className="w-6 h-6 text-cyan-400" />
                        )}
                        <span className="absolute top-1 left-1 text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-slate-950/80 text-cyan-300 border border-cyan-400/30">
                          {srv.code}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-white truncate line-clamp-1" title={srv.name}>
                          {srv.name}
                        </h4>
                        <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                          <span>{srv.category}</span>
                          {srv.subcategory && <span className="text-cyan-300">· {srv.subcategory}</span>}
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-t border-white/10 pt-1.5 text-[11px]">
                        <span className="font-extrabold text-cyan-300">R$ {srv.defaultPrice.toFixed(2)}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(srv)}
                            className="p-1 rounded bg-white/5 text-slate-300 hover:text-white"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Deseja excluir o serviço "${srv.name}" da guia?`)) {
                                onDeleteService(srv.id);
                              }
                            }}
                            className="p-1 rounded bg-white/5 text-rose-400 hover:bg-rose-500/20"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Default Large or Medium Cards
                return (
                  <div
                    key={srv.id}
                    className={`bg-white/10 backdrop-blur-2xl rounded-2xl border border-white/15 p-4 space-y-3.5 hover:border-cyan-400/50 transition-all shadow-lg shadow-indigo-950/40 relative group flex flex-col justify-between ${
                      viewMode === 'large' ? 'min-h-[280px]' : ''
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Header Card */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`${viewMode === 'large' ? 'w-16 h-16' : 'w-12 h-12'} rounded-xl bg-slate-950 border border-white/15 overflow-hidden shrink-0 flex items-center justify-center relative`}>
                            {srv.imageUrl ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={srv.imageUrl} alt={srv.name} className="w-full h-full object-cover" />
                            ) : (
                              <Layers className={`${viewMode === 'large' ? 'w-8 h-8' : 'w-6 h-6'} text-cyan-400`} />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                                {srv.code}
                              </span>
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/10 text-slate-300">
                                {srv.category}
                              </span>
                              {srv.subcategory && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-400/30">
                                  {srv.subcategory}
                                </span>
                              )}
                            </div>
                            <h3 className={`font-extrabold ${viewMode === 'large' ? 'text-base' : 'text-sm'} text-white tracking-tight mt-0.5 leading-snug`}>
                              {srv.name}
                            </h3>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleOpenEditModal(srv)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white transition"
                            title="Editar Serviço"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Deseja excluir o serviço "${srv.name}" da guia?`)) {
                                onDeleteService(srv.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 border border-white/10 text-slate-400 hover:text-rose-400 transition"
                            title="Excluir Serviço"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Preço Base & Unidade */}
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/10 flex items-center justify-between">
                        <span className="text-xs text-slate-300 font-medium">Preço de Referência:</span>
                        <span className={`font-black text-cyan-300 ${viewMode === 'large' ? 'text-base' : 'text-sm'}`}>
                          R$ {srv.defaultPrice.toFixed(2)} <span className="text-[11px] font-normal text-slate-400">/ {srv.unit}</span>
                        </span>
                      </div>

                      {/* Descrição */}
                      {srv.description && (
                        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                          {srv.description}
                        </p>
                      )}

                      {/* Ficha Técnica Rápida */}
                      <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-300 pt-1">
                        <div className="flex items-center gap-1.5 bg-white/5 p-1.5 rounded-lg">
                          <Cpu className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span className="truncate">
                            Pontos: <strong className="text-white">{srv.estimatedStitchCount ? srv.estimatedStitchCount.toLocaleString('pt-BR') : '-'}</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 bg-white/5 p-1.5 rounded-lg">
                          <Clock className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span className="truncate">
                            Tempo: <strong className="text-white">{srv.estimatedTimeMinutes ? `${srv.estimatedTimeMinutes} min` : '-'}</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 bg-white/5 p-1.5 rounded-lg">
                          <Tag className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span className="truncate">
                            Tamanho: <strong className="text-white">{srv.suggestedEmbroiderySize || '-'}</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 bg-white/5 p-1.5 rounded-lg">
                          <BookmarkCheck className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span className="truncate">
                            Bastidor: <strong className="text-white">{srv.suggestedHoopSize || '-'}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Tags */}
                      {srv.tags && srv.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {srv.tags.map((tg, idx) => (
                            <span
                              key={idx}
                              className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-cyan-400/10 text-cyan-300 border border-cyan-400/20"
                            >
                              #{tg}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Card Footer: Informações de Referência */}
                    <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2 mt-2 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1 font-medium">
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                        Executado {srv.timesExecuted || 0}x
                      </span>

                      {srv.lastUsedDate && (
                        <span className="text-slate-400 font-mono">
                          Ref: {srv.lastUsedDate}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 space-y-3">
              <Layers className="w-10 h-10 text-slate-500 mx-auto" />
              <h3 className="text-sm font-bold text-white">Nenhum serviço encontrado</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Tente ajustar os termos da busca ou cadastre um novo serviço de referência para reutilizar em seus orçamentos.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl hover:brightness-110 transition inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Cadastrar Primeiro Serviço
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal de Edição de Serviço */}
      {editingService && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/20 text-white rounded-3xl max-w-lg w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit className="w-4 h-4 text-cyan-400" /> Editar Serviço [{editingService.code}]
              </h3>
              <button
                onClick={() => setEditingService(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕ Fechar
              </button>
            </div>

            <form onSubmit={handleSaveEditSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Código do Serviço *</label>
                  <input
                    type="text"
                    required
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-white/20 bg-slate-950 text-cyan-300 font-mono font-bold focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1">Nome do Serviço *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-white/20 bg-slate-950 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-300">Categoria</label>
                    <button
                      type="button"
                      onClick={() => {
                        setTargetCategoryField('edit');
                        setShowCategoryModal(true);
                      }}
                      className="text-[10px] font-bold text-cyan-300 hover:text-cyan-200 flex items-center gap-0.5 transition"
                    >
                      <Plus className="w-3 h-3" /> Adicionar
                    </button>
                  </div>
                  <select
                    value={editCategory}
                    onChange={(e) => {
                      if (e.target.value === '__add_new__') {
                        setTargetCategoryField('edit');
                        setShowCategoryModal(true);
                      } else {
                        setEditCategory(e.target.value);
                      }
                    }}
                    className="w-full text-xs px-2.5 py-2 rounded-xl border border-white/20 bg-slate-950 text-white font-medium"
                  >
                    {allCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="__add_new__" className="text-cyan-300 font-bold">+ Nova Categoria...</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-300">Subcategoria</label>
                    <button
                      type="button"
                      onClick={() => {
                        setTargetSubcategoryField('edit');
                        setShowSubcategoryModal(true);
                      }}
                      className="text-[10px] font-bold text-cyan-300 hover:text-cyan-200 flex items-center gap-0.5 transition"
                    >
                      <Plus className="w-3 h-3" /> Adicionar
                    </button>
                  </div>
                  <select
                    value={editSubcategory}
                    onChange={(e) => {
                      if (e.target.value === '__add_new__') {
                        setTargetSubcategoryField('edit');
                        setShowSubcategoryModal(true);
                      } else {
                        setEditSubcategory(e.target.value);
                      }
                    }}
                    className="w-full text-xs px-2.5 py-2 rounded-xl border border-white/20 bg-slate-950 text-white font-medium"
                  >
                    {allSubcategories.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                    <option value="__add_new__" className="text-cyan-300 font-bold">+ Nova Subcategoria...</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Preço Base (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editDefaultPrice}
                    onChange={(e) => setEditDefaultPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full text-xs px-2.5 py-2 rounded-xl border border-white/20 bg-slate-950 text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Descrição</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-white/20 bg-slate-950 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] text-slate-300 mb-1">Qtd Pontos (Est.)</label>
                  <input
                    type="number"
                    value={editEstimatedStitchCount}
                    onChange={(e) => setEditEstimatedStitchCount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full text-xs px-2.5 py-2 rounded-xl border border-white/20 bg-slate-950 text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-300 mb-1">Tempo (Minutos)</label>
                  <input
                    type="number"
                    value={editEstimatedTimeMinutes}
                    onChange={(e) => setEditEstimatedTimeMinutes(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full text-xs px-2.5 py-2 rounded-xl border border-white/20 bg-slate-950 text-white"
                  />
                </div>
              </div>

              <ImageUploadOrLink
                label="Foto de Referência"
                value={editImageUrl}
                onChange={setEditImageUrl}
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-3.5 py-2 rounded-xl border border-white/20 text-xs font-bold text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-400 text-slate-950 text-xs font-black hover:brightness-110"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Gerenciar / Adicionar Categoria */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/20 text-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" /> Gerenciar Categorias de Serviços
              </h3>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕ Fechar
              </button>
            </div>

            {newCategorySuccessMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{newCategorySuccessMsg}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newCategoryName.trim()) {
                  handleSaveNewCategory(newCategoryName, targetCategoryField);
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nome da Nova Categoria *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Ex: Sublimação, Silk Screen, Laser..."
                    className="flex-1 text-xs px-3 py-2.5 rounded-xl border border-white/20 bg-slate-950 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 text-xs font-bold hover:brightness-110 shrink-0 cursor-pointer"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </form>

            {/* Lista de Categorias Personalizadas Cadastradas */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <span className="text-xs font-bold text-slate-300 block">Categorias Personalizadas Cadastradas</span>
              {customCategories.length > 0 ? (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {customCategories.map((cat) => (
                    <div key={cat} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 text-xs">
                      <span className="font-semibold text-white">{cat}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomCategory(cat)}
                        className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-500/20 transition"
                        title="Excluir categoria"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Nenhuma categoria personalizada criada ainda.</p>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition cursor-pointer"
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Gerenciar / Adicionar Subcategoria */}
      {showSubcategoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/20 text-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" /> Gerenciar Subcategorias de Serviços
              </h3>
              <button
                type="button"
                onClick={() => setShowSubcategoryModal(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕ Fechar
              </button>
            </div>

            {newSubcategorySuccessMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{newSubcategorySuccessMsg}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newSubcategoryName.trim()) {
                  handleSaveNewSubcategory(newSubcategoryName, targetSubcategoryField);
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nome da Nova Subcategoria *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={newSubcategoryName}
                    onChange={(e) => setNewSubcategoryName(e.target.value)}
                    placeholder="Ex: Escolar, Infantil, Uniforme Peitoral, Brasão..."
                    className="flex-1 text-xs px-3 py-2.5 rounded-xl border border-white/20 bg-slate-950 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 text-xs font-bold hover:brightness-110 shrink-0 cursor-pointer"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </form>

            {/* Lista de Subcategorias Personalizadas Cadastradas */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <span className="text-xs font-bold text-slate-300 block">Subcategorias Personalizadas Cadastradas</span>
              {customSubcategories.length > 0 ? (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {customSubcategories.map((sub) => (
                    <div key={sub} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 text-xs">
                      <span className="font-semibold text-white">{sub}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomSubcategory(sub)}
                        className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-500/20 transition"
                        title="Excluir subcategoria"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Nenhuma subcategoria personalizada criada ainda.</p>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowSubcategoryModal(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition cursor-pointer"
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

