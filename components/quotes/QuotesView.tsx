'use client';

import React, { useState } from 'react';
import { Quote, Client, InventoryItem, ProductType, QuoteMaterialItem, ExecutedService, DisplayViewMode } from '@/lib/types';
import { ImageUploadOrLink } from '../common/ImageUploadOrLink';
import { DataFilterExportToolbar } from '../common/DataFilterExportToolbar';
import { ExportDataModal } from '../common/ExportDataModal';
import { ExportDataPayload } from '@/lib/exportUtils';
import { 
  FileText, 
  Table, 
  Plus, 
  Check, 
  Edit, 
  Trash2, 
  Sparkles, 
  Calendar, 
  Search,
  CheckCircle2,
  Clock,
  Send,
  XCircle,
  Package,
  Cpu,
  Shirt,
  Smartphone,
  Calculator,
  Download,
  Layers,
  BookmarkPlus
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface QuotesViewProps {
  quotes: Quote[];
  clients: Client[];
  inventory?: InventoryItem[];
  executedServices?: ExecutedService[];
  onAddQuote: (newQuote: Omit<Quote, 'id'>) => void;
  onUpdateQuote?: (updatedQuote: Quote) => void;
  onUpdateQuoteStatus: (id: string, newStatus: 'Aprovado' | 'Pendente' | 'Recusado') => void;
  onDeleteQuote: (id: string) => void;
  onConvertToOrder: (quote: Quote) => void;
  onDisapproveQuote?: (id: string) => void;
  onSaveServiceToCatalog?: (srv: Omit<ExecutedService, 'id' | 'code'>) => void;
}

export const QuotesView: React.FC<QuotesViewProps> = ({
  quotes,
  clients,
  inventory = [],
  executedServices = [],
  onAddQuote,
  onUpdateQuote,
  onUpdateQuoteStatus,
  onDeleteQuote,
  onConvertToOrder,
  onDisapproveQuote,
  onSaveServiceToCatalog
}) => {
  const [showForm, setShowForm] = useState(false);
  const [filterDate, setFilterDate] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [filterValueRange, setFilterValueRange] = useState<string>('todos');
  const [filterSortBy, setFilterSortBy] = useState<string>('recentes');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [productType, setProductType] = useState<ProductType>('virtual');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [embroiderySize, setEmbroiderySize] = useState('10x10cm');
  const [hoopSize, setHoopSize] = useState('13x18cm');
  const [fabricType, setFabricType] = useState('Algodão');
  const [fabricColor, setFabricColor] = useState('Branco');
  const [description, setDescription] = useState('');
  const [estimatedValue, setEstimatedValue] = useState<number | ''>(0);
  const [itemQuantity, setItemQuantity] = useState<number | ''>(1);
  const [unitPrice, setUnitPrice] = useState<number | ''>(0);
  const [matrixUrl, setMatrixUrl] = useState('');
  const [isAiCalculating, setIsAiCalculating] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{
    stitchCount?: number;
    technicalTips?: string;
    suggestedPrice?: number;
  } | null>(null);

  // Physical Product Cost Breakdown & Unit Options State
  const DEFAULT_UNITS = ['retós', 'metros', 'unidades', 'caixas'];
  const [customUnits, setCustomUnits] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('sm_inventory_units');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading custom units:', e);
      }
    }
    return [];
  });
  const [selectedMaterialUnit, setSelectedMaterialUnit] = useState<string>('unidades');
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [selectedQuoteForExport, setSelectedQuoteForExport] = useState<ExportDataPayload | null>(null);
  const [viewMode, setViewMode] = useState<DisplayViewMode>('medium');

  // Edit Quote State
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [editClientId, setEditClientId] = useState('');
  const [editProductType, setEditProductType] = useState<ProductType>('virtual');
  const [editEmbroiderySize, setEditEmbroiderySize] = useState('10x10cm');
  const [editHoopSize, setEditHoopSize] = useState('13x18cm');
  const [editFabricType, setEditFabricType] = useState('Algodão');
  const [editFabricColor, setEditFabricColor] = useState('Branco');
  const [editDescription, setEditDescription] = useState('');
  const [editEstimatedValue, setEditEstimatedValue] = useState<number | ''>(0);
  const [editItemQuantity, setEditItemQuantity] = useState<number | ''>(1);
  const [editUnitPrice, setEditUnitPrice] = useState<number | ''>(0);
  const [editMatrixUrl, setEditMatrixUrl] = useState('');
  const [editStatus, setEditStatus] = useState<'Aprovado' | 'Pendente' | 'Recusado'>('Pendente');
  const [editMaterials, setEditMaterials] = useState<QuoteMaterialItem[]>([]);
  const [editMachineTimeMinutes, setEditMachineTimeMinutes] = useState<number | ''>(30);
  const [editMachineHourlyRate, setEditMachineHourlyRate] = useState<number | ''>(30);
  const [editLaborCost, setEditLaborCost] = useState<number | ''>(0);

  const [editSelectedInventoryItemId, setEditSelectedInventoryItemId] = useState('');
  const [editMaterialQuantity, setEditMaterialQuantity] = useState<number | ''>(1);
  const [editUseFractionedMode, setEditUseFractionedMode] = useState(true);

  const handleOpenEditModal = (q: Quote) => {
    setEditingQuote(q);
    setEditClientId(q.clientId || '');
    setEditProductType(q.productType || (q.machineTimeMinutes || (q.quoteMaterials && q.quoteMaterials.length > 0) ? 'fisico' : 'virtual'));
    setEditEmbroiderySize(q.embroiderySize || '10x10cm');
    setEditHoopSize(q.hoopSize || '13x18cm');
    setEditFabricType(q.fabricType || 'Algodão');
    setEditFabricColor(q.fabricColor || 'Branco');
    setEditDescription(q.description || '');
    const qQty = q.itemQuantity || 1;
    const qUnitP = q.unitPrice ?? (q.estimatedValue ? q.estimatedValue / qQty : 0);
    setEditItemQuantity(qQty);
    setEditUnitPrice(Number(qUnitP.toFixed(2)));
    setEditEstimatedValue(q.estimatedValue ?? 0);
    setEditMatrixUrl(q.matrixUrl || '');
    setEditStatus(q.status || 'Pendente');
    setEditMaterials(q.quoteMaterials ? [...q.quoteMaterials] : []);
    setEditMachineTimeMinutes(q.machineTimeMinutes ?? 30);
    setEditMachineHourlyRate(q.machineHourlyRate ?? 30);
    setEditLaborCost(q.laborCost ?? 0);
  };

  const handleAddEditMaterialItem = () => {
    if (!editSelectedInventoryItemId) return;
    const invItem = inventory.find(i => i.id === editSelectedInventoryItemId);
    if (!invItem) return;

    const qty = Number(editMaterialQuantity) || 1;
    let cost = 0;
    let unitName = invItem.unit || 'unidades';
    let isFractioned = false;
    const pricePerUnitToSave = invItem.pricePerUnit || 0;
    let pricePerFractionUnitToSave = invItem.pricePerFractionUnit;

    const hasItemFractioning = Boolean(invItem.hasFractioning && invItem.fractionSize && invItem.fractionSize > 0);

    if (hasItemFractioning && editUseFractionedMode) {
      isFractioned = true;
      unitName = invItem.fractionUnit || 'm';
      pricePerFractionUnitToSave = invItem.pricePerFractionUnit || (invItem.pricePerUnit / invItem.fractionSize!);
      cost = qty * pricePerFractionUnitToSave;
    } else {
      cost = qty * (invItem.pricePerUnit || 0);
    }

    const newMaterial: QuoteMaterialItem = {
      inventoryItemId: invItem.id,
      name: invItem.name,
      quantity: qty,
      unit: unitName,
      pricePerUnit: pricePerUnitToSave,
      totalCost: cost,
      isFractioned,
      fractionSize: invItem.fractionSize,
      fractionUnit: invItem.fractionUnit,
      fractionQuantity: isFractioned ? qty : undefined,
      pricePerFractionUnit: pricePerFractionUnitToSave
    };

    setEditMaterials(prev => [...prev, newMaterial]);
    setEditSelectedInventoryItemId('');
    setEditMaterialQuantity(1);
  };

  const handleRemoveEditMaterialItem = (index: number) => {
    setEditMaterials(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuote) return;

    const client = clients.find(c => c.id === editClientId);
    const clientName = client ? client.name : editingQuote.clientName;

    const editTotalMaterialsCost = editMaterials.reduce((sum, item) => sum + item.totalCost, 0);
    const editMachineCost = ((Number(editMachineTimeMinutes) || 0) / 60) * (Number(editMachineHourlyRate) || 0);
    const editLaborValue = Number(editLaborCost) || 0;
    const calculatedEditPhysicalTotal = editTotalMaterialsCost + editMachineCost + editLaborValue;

    const editQty = Number(editItemQuantity) || 1;
    const finalValue = editProductType === 'fisico' && (editEstimatedValue === 0 || editEstimatedValue === '')
      ? calculatedEditPhysicalTotal * editQty
      : (Number(editEstimatedValue) || (calculatedEditPhysicalTotal * editQty) || editingQuote.estimatedValue);

    const editUPrice = Number(editUnitPrice) || (finalValue / editQty);

    const updated: Quote = {
      ...editingQuote,
      clientId: editClientId || editingQuote.clientId,
      clientName,
      productType: editProductType,
      itemQuantity: editQty,
      unitPrice: Number(editUPrice.toFixed(2)),
      embroiderySize: editEmbroiderySize,
      hoopSize: editHoopSize,
      fabricType: editFabricType,
      fabricColor: editFabricColor,
      description: editDescription,
      estimatedValue: Number(finalValue.toFixed(2)),
      status: editStatus,
      matrixUrl: editMatrixUrl,
      matrixFileName: editMatrixUrl ? (editingQuote.matrixFileName || 'matriz_referencia.dst') : undefined,
      quoteMaterials: editProductType === 'fisico' ? editMaterials : undefined,
      machineTimeMinutes: editProductType === 'fisico' ? (Number(editMachineTimeMinutes) || 0) : undefined,
      machineHourlyRate: editProductType === 'fisico' ? (Number(editMachineHourlyRate) || 0) : undefined,
      machineCost: editProductType === 'fisico' ? Number(editMachineCost.toFixed(2)) : undefined,
      laborCost: editProductType === 'fisico' ? editLaborValue : undefined
    };

    if (onUpdateQuote) {
      onUpdateQuote(updated);
    }
    setEditingQuote(null);
  };

  const handleExportQuote = (q: Quote) => {
    const isVirtual = q.productType === 'virtual' || (!q.productType && !q.machineTimeMinutes && (!q.quoteMaterials || q.quoteMaterials.length === 0));

    const rows: (string | number)[][] = [
      ['Número do Orçamento', q.id],
      ['Data de Emissão', q.date],
      ['Cliente', q.clientName],
      ['Tipo de Produto', isVirtual ? 'Produto Virtual (Matriz)' : 'Produto Físico (Bordado/Confecção)'],
      ['Status', q.status],
      ['Descrição do Serviço', q.description || '-']
    ];

    if (q.matrixFileName) {
      rows.push(['Arquivo de Referência / Matriz', q.matrixFileName]);
    }
    if (q.embroiderySize) {
      rows.push(['Tamanho do Bordado', q.embroiderySize]);
    }
    if (q.hoopSize) {
      rows.push(['Tamanho do Bastidor', q.hoopSize]);
    }
    if (q.fabricType) {
      rows.push(['Tipo de Tecido / Material', q.fabricType]);
    }
    if (q.fabricColor) {
      rows.push(['Cor do Tecido', q.fabricColor]);
    }
    if (q.stitchCount && q.stitchCount > 0) {
      rows.push(['Número de Pontos', `${q.stitchCount.toLocaleString('pt-BR')} pontos`]);
    }

    if (!isVirtual) {
      if (q.machineTimeMinutes && q.machineTimeMinutes > 0) {
        rows.push(['Tempo Estimado de Máquina', `${q.machineTimeMinutes} minutos`]);
      }
      if (q.machineCost && q.machineCost > 0) {
        rows.push(['Custo Est. de Máquina', `R$ ${q.machineCost.toFixed(2)}`]);
      }
      if (q.laborCost && q.laborCost > 0) {
        rows.push(['Custo Mão de Obra', `R$ ${q.laborCost.toFixed(2)}`]);
      }
      if (q.quoteMaterials && q.quoteMaterials.length > 0) {
        const matFormatted = q.quoteMaterials
          .map(m => `• ${m.name}: ${m.quantity} ${m.unit} x R$ ${m.pricePerUnit.toFixed(2)} = R$ ${m.totalCost.toFixed(2)}`)
          .join('\n');
        rows.push(['Insumos e Materiais Utilizados', matFormatted]);
      }
    }

    rows.push([
      'VALOR TOTAL ESTIMADO',
      `R$ ${q.estimatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    ]);

    const payload: ExportDataPayload = {
      title: `Orçamento #${q.id}`,
      subtitle: `Cliente: ${q.clientName} • Data: ${q.date}`,
      headers: ['Especificação / Detalhe', 'Informação / Valor'],
      rows,
      imageUrl: q.matrixUrl || undefined,
      totals: [
        {
          label: 'Valor Total Estimado',
          value: `R$ ${q.estimatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        }
      ],
      rawItems: [q]
    };

    setSelectedQuoteForExport(payload);
  };

  const itemUnits = Array.from(new Set(inventory.map((i) => i.unit).filter(Boolean)));
  const allUnits = Array.from(
    new Set([...DEFAULT_UNITS, ...customUnits, ...itemUnits])
  );

  const handleSaveNewUnit = () => {
    const trimmed = newUnitName.trim();
    if (!trimmed) return;

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
    setSelectedMaterialUnit(trimmed);
    setNewUnitName('');
    setShowUnitModal(false);
  };

  const [selectedInventoryItemId, setSelectedInventoryItemId] = useState('');
  const [materialQuantity, setMaterialQuantity] = useState<number | ''>(1);
  const [useFractionedMode, setUseFractionedMode] = useState<boolean>(true);
  const [selectedMaterials, setSelectedMaterials] = useState<QuoteMaterialItem[]>([]);
  const [machineTimeMinutes, setMachineTimeMinutes] = useState<number | ''>(30);
  const [machineHourlyRate, setMachineHourlyRate] = useState<number | ''>(30);
  const [laborCost, setLaborCost] = useState<number | ''>(0);

  // Calculations for Physical Product
  const totalMaterialsCost = selectedMaterials.reduce((sum, item) => sum + item.totalCost, 0);
  const machineCost = ((Number(machineTimeMinutes) || 0) / 60) * (Number(machineHourlyRate) || 0);
  const laborValue = Number(laborCost) || 0;
  const calculatedPhysicalTotal = totalMaterialsCost + machineCost + laborValue;

  const handleAddMaterialItem = () => {
    if (!selectedInventoryItemId) return;
    const invItem = inventory.find(i => i.id === selectedInventoryItemId);
    if (!invItem) return;

    const qty = Number(materialQuantity) || 1;
    let cost = 0;
    let unitName = selectedMaterialUnit || invItem.unit || 'unidades';
    let isFractioned = false;
    const pricePerUnitToSave = invItem.pricePerUnit || 0;
    let pricePerFractionUnitToSave = invItem.pricePerFractionUnit;

    const hasItemFractioning = Boolean(
      invItem.hasFractioning && invItem.fractionSize && invItem.fractionSize > 0
    );

    if (hasItemFractioning && useFractionedMode) {
      isFractioned = true;
      unitName = invItem.fractionUnit || 'm';
      pricePerFractionUnitToSave = invItem.pricePerFractionUnit || (invItem.pricePerUnit / invItem.fractionSize!);
      cost = qty * pricePerFractionUnitToSave;
    } else {
      cost = qty * (invItem.pricePerUnit || 0);
    }

    const newMaterial: QuoteMaterialItem = {
      inventoryItemId: invItem.id,
      name: invItem.name,
      quantity: qty,
      unit: unitName,
      pricePerUnit: pricePerUnitToSave,
      totalCost: cost,
      isFractioned,
      fractionSize: invItem.fractionSize,
      fractionUnit: invItem.fractionUnit,
      fractionQuantity: isFractioned ? qty : undefined,
      pricePerFractionUnit: pricePerFractionUnitToSave
    };

    setSelectedMaterials(prev => [...prev, newMaterial]);
    setSelectedInventoryItemId('');
    setMaterialQuantity(1);
    setUseFractionedMode(true);
  };

  const handleRemoveMaterialItem = (index: number) => {
    setSelectedMaterials(prev => prev.filter((_, i) => i !== index));
  };

  const filteredQuotes = quotes
    .filter(q => {
      const matchesClient = !filterClient || filterClient === 'todos' || q.clientId === filterClient || q.clientName.toLowerCase().includes(filterClient.toLowerCase());
      const matchesStatus = filterStatus === 'todos' || q.status === filterStatus;
      const matchesDate = !filterDate || q.date.includes(filterDate);
      
      let matchesValue = true;
      if (filterValueRange === 'ate_100') matchesValue = q.estimatedValue <= 100;
      else if (filterValueRange === '100_500') matchesValue = q.estimatedValue > 100 && q.estimatedValue <= 500;
      else if (filterValueRange === 'acima_500') matchesValue = q.estimatedValue > 500;

      const matchesSearch = !searchQuery || 
        q.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
        q.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.fabricType.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesClient && matchesStatus && matchesDate && matchesValue && matchesSearch;
    })
    .sort((a, b) => {
      if (filterSortBy === 'maior_valor') return b.estimatedValue - a.estimatedValue;
      if (filterSortBy === 'menor_valor') return a.estimatedValue - b.estimatedValue;
      if (filterSortBy === 'antigos') return a.id.localeCompare(b.id, 'pt-BR');
      return b.id.localeCompare(a.id, 'pt-BR');
    });

  const totalValueFiltered = filteredQuotes.reduce((acc, q) => acc + q.estimatedValue, 0);

  const quotesExportPayload: ExportDataPayload = {
    title: 'Relatório de Orçamentos',
    subtitle: 'Ateliê de Bordados - Gestão de Orçamentos',
    activeFiltersSummary: [
      searchQuery ? `Busca: "${searchQuery}"` : null,
      filterStatus !== 'todos' ? `Status: ${filterStatus}` : null,
      filterClient && filterClient !== 'todos' ? `Cliente: ${filterClient}` : null,
      filterDate ? `Data: ${filterDate}` : null
    ].filter(Boolean).join(' | ') || 'Nenhum filtro aplicado (Todos)',
    headers: ['Nº Orçamento', 'Cliente', 'Data', 'Valor (R$)', 'Status', 'Tamanho', 'Bastidor', 'Tecido', 'Descrição'],
    rows: filteredQuotes.map(q => [
      q.id,
      q.clientName,
      q.date,
      `R$ ${q.estimatedValue.toFixed(2)}`,
      q.status,
      q.embroiderySize,
      q.hoopSize,
      q.fabricType,
      q.description
    ]),
    totals: [
      { label: 'Qtd Orçamentos', value: `${filteredQuotes.length}` },
      { label: 'Valor Total Estimado', value: `R$ ${totalValueFiltered.toFixed(2)}` }
    ]
  };

  const handleAiEstimate = async () => {
    setIsAiCalculating(true);
    try {
      const res = await fetch('/api/ai-estimator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fabricType,
          fabricColor,
          embroiderySize,
          hoopSize,
          description,
          imageUrl: matrixUrl
        })
      });
      const data = await res.json();
      if (data.estimatedPrice) {
        const q = Number(itemQuantity) || 1;
        setUnitPrice(data.estimatedPrice);
        setEstimatedValue(Number((data.estimatedPrice * q).toFixed(2)));
        setAiAnalysis({
          stitchCount: data.stitchCount,
          technicalTips: data.technicalTips,
          suggestedPrice: data.estimatedPrice
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiCalculating(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find(c => c.id === selectedClientId);
    const clientName = client ? client.name : 'Cliente Avulso';

    const qty = Number(itemQuantity) || 1;
    const finalValue = productType === 'fisico' && (estimatedValue === 0 || estimatedValue === '')
      ? calculatedPhysicalTotal * qty
      : (Number(estimatedValue) || (calculatedPhysicalTotal * qty) || 100);

    const uPrice = Number(unitPrice) || (finalValue / qty);

    onAddQuote({
      clientId: selectedClientId || 'cli-guest',
      clientName,
      date: new Date().toLocaleDateString('pt-BR'),
      productType,
      itemQuantity: qty,
      unitPrice: Number(uPrice.toFixed(2)),
      embroiderySize: embroiderySize || '10x10cm',
      hoopSize: hoopSize || '13x18cm',
      fabricType: fabricType || 'Algodão',
      fabricColor: fabricColor || 'Branco',
      description: description || (productType === 'fisico' ? 'Produto físico personalizado' : 'Bordado personalizado'),
      estimatedValue: Number(finalValue.toFixed(2)),
      status: 'Pendente',
      matrixUrl,
      matrixFileName: matrixUrl ? 'matriz_referencia.dst' : undefined,
      stitchCount: aiAnalysis?.stitchCount || 12000,
      quoteMaterials: productType === 'fisico' ? selectedMaterials : undefined,
      machineTimeMinutes: productType === 'fisico' ? (Number(machineTimeMinutes) || 0) : undefined,
      machineHourlyRate: productType === 'fisico' ? (Number(machineHourlyRate) || 0) : undefined,
      machineCost: productType === 'fisico' ? machineCost : undefined,
      laborCost: productType === 'fisico' ? laborValue : undefined,
    });

    // Reset Form
    setSelectedClientId('');
    setDescription('');
    setEstimatedValue(0);
    setItemQuantity(1);
    setUnitPrice(0);
    setMatrixUrl('');
    setAiAnalysis(null);
    setSelectedMaterials([]);
    setProductType('virtual');
    setMachineTimeMinutes(30);
    setMachineHourlyRate(30);
    setLaborCost(0);
    setShowForm(false);
  };

  // Approval Rate Data for chart
  const chartData = [
    { month: 'Jul', aprovados: 12, pendentes: 3 },
    { month: 'Ago', aprovados: 18, pendentes: 4 },
    { month: 'Set', aprovados: 15, pendentes: 5 },
    { month: 'Out', aprovados: 22, pendentes: 2 },
  ];

  const [selectedReferenceServiceId, setSelectedReferenceServiceId] = useState('');
  const [savedCatalogSuccessMsg, setSavedCatalogSuccessMsg] = useState(false);

  // Quick New Service Modal State
  const [showQuickAddServiceModal, setShowQuickAddServiceModal] = useState(false);
  const [quickServiceCode, setQuickServiceCode] = useState('');
  const [quickServiceName, setQuickServiceName] = useState('');
  const [quickServiceCategory, setQuickServiceCategory] = useState('Bordado Computadorizado');
  const [quickServicePrice, setQuickServicePrice] = useState<number | ''>(25);
  const [quickServiceUnit, setQuickServiceUnit] = useState('peça');
  const [quickServiceDescription, setQuickServiceDescription] = useState('');

  const handleSelectReferenceService = (serviceId: string) => {
    if (serviceId === '__manual__') {
      setSelectedReferenceServiceId('__manual__');
      return;
    }

    if (serviceId === '__add_new_catalog__') {
      const nextNum = executedServices.length + 1;
      setQuickServiceCode(`SRV-${String(nextNum).padStart(3, '0')}`);
      setShowQuickAddServiceModal(true);
      return;
    }

    setSelectedReferenceServiceId(serviceId);
    if (!serviceId) return;

    const srv = executedServices.find(s => s.id === serviceId);
    if (!srv) return;

    if (srv.productType) setProductType(srv.productType);
    if (srv.name) setDescription(srv.name + (srv.description ? ` — ${srv.description}` : ''));
    if (srv.defaultPrice) {
      const q = Number(itemQuantity) || 1;
      setUnitPrice(srv.defaultPrice);
      setEstimatedValue(Number((srv.defaultPrice * q).toFixed(2)));
    }
    if (srv.suggestedEmbroiderySize) setEmbroiderySize(srv.suggestedEmbroiderySize);
    if (srv.suggestedHoopSize) setHoopSize(srv.suggestedHoopSize);
    if (srv.estimatedStitchCount) {
      setAiAnalysis({
        stitchCount: srv.estimatedStitchCount,
        technicalTips: `Serviço de referência carregado: ${srv.name}`,
        suggestedPrice: srv.defaultPrice
      });
    }
    if (srv.estimatedTimeMinutes) setMachineTimeMinutes(srv.estimatedTimeMinutes);
    if (srv.imageUrl) setMatrixUrl(srv.imageUrl);
  };

  const handleCreateQuickService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickServiceName.trim()) return;

    const newServiceData = {
      code: quickServiceCode.trim() || undefined,
      name: quickServiceName.trim(),
      category: quickServiceCategory,
      defaultPrice: Number(quickServicePrice) || 0,
      unit: quickServiceUnit,
      description: quickServiceDescription,
      productType,
      suggestedEmbroiderySize: embroiderySize || '10x10cm',
      suggestedHoopSize: hoopSize || '13x18cm',
      estimatedTimeMinutes: Number(machineTimeMinutes) || 20,
      imageUrl: matrixUrl || undefined,
      timesExecuted: 1,
      lastUsedDate: new Date().toLocaleDateString('pt-BR')
    };

    if (onSaveServiceToCatalog) {
      onSaveServiceToCatalog(newServiceData);
    }

    // Auto-fill quote fields with this service
    setDescription(quickServiceName.trim() + (quickServiceDescription ? ` — ${quickServiceDescription}` : ''));
    if (quickServicePrice !== '') {
      const p = Number(quickServicePrice) || 0;
      const q = Number(itemQuantity) || 1;
      setUnitPrice(p);
      setEstimatedValue(Number((p * q).toFixed(2)));
    }

    // Reset and close
    setQuickServiceName('');
    setQuickServiceCode('');
    setQuickServiceDescription('');
    setShowQuickAddServiceModal(false);
  };

  const handleSaveCurrentQuoteAsServiceToCatalog = () => {
    if (!description.trim()) {
      alert('Preencha a descrição do serviço para salvar na Guia de Serviços.');
      return;
    }

    if (onSaveServiceToCatalog) {
      onSaveServiceToCatalog({
        name: description.split('—')[0].trim(),
        category: productType === 'virtual' ? 'Programação de Matriz' : 'Bordado Computadorizado',
        description: description,
        defaultPrice: Number(estimatedValue) || calculatedPhysicalTotal || 25,
        unit: 'peça',
        productType,
        estimatedStitchCount: aiAnalysis?.stitchCount || 12000,
        suggestedEmbroiderySize: embroiderySize || '10x10cm',
        suggestedHoopSize: hoopSize || '13x18cm',
        estimatedTimeMinutes: Number(machineTimeMinutes) || 20,
        imageUrl: matrixUrl || undefined,
        tags: ['Salvo do Orçamento', productType === 'virtual' ? 'Matriz' : 'Produto Físico'],
        timesExecuted: 1,
        lastUsedDate: new Date().toLocaleDateString('pt-BR')
      });

      setSavedCatalogSuccessMsg(true);
      setTimeout(() => setSavedCatalogSuccessMsg(false), 3000);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Orçamentos</h2>
          <p className="text-xs text-slate-300">Crie, calcule e gerencie os orçamentos de bordado</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3.5 py-2 bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 text-xs font-bold rounded-xl hover:brightness-110 transition shadow-lg shadow-cyan-500/20 border border-cyan-300/40 flex items-center gap-1.5"
        >
          {showForm ? <Check className="w-4 h-4 text-slate-950" /> : <Plus className="w-4 h-4 text-slate-950" />}
          {showForm ? 'Ver Lista' : 'Novo Orçamento'}
        </button>
      </div>

      {showForm ? (
        /* Novo Orçamento Form Screen (Frosted Glass) */
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/15 shadow-2xl p-4 sm:p-6 space-y-6 text-white">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-lg font-bold text-white">Novo Orçamento</h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-xs text-slate-300 hover:text-white underline transition"
            >
              ← Cancelar
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-5">
            {/* Seletor de Serviço da Guia de Referência ou Inserção Manual */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-cyan-400/40 space-y-2.5 backdrop-blur-md">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  Carregar da Guia de Serviços ou Adicionar Serviço
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedReferenceServiceId('__manual__');
                      setDescription('');
                      setEstimatedValue(0);
                    }}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition border flex items-center gap-1 cursor-pointer ${
                      selectedReferenceServiceId === '__manual__'
                        ? 'bg-cyan-400 text-slate-950 border-cyan-300 font-extrabold shadow'
                        : 'bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 border-cyan-400/30'
                    }`}
                  >
                    ✍️ Digitar Manualmente
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const nextNum = executedServices.length + 1;
                      setQuickServiceCode(`SRV-${String(nextNum).padStart(3, '0')}`);
                      setShowQuickAddServiceModal(true);
                    }}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg transition border bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border-emerald-400/30 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400" /> + Novo Serviço
                  </button>
                </div>
              </div>

              <select
                value={selectedReferenceServiceId}
                onChange={(e) => handleSelectReferenceService(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-cyan-400/30 bg-slate-900 text-white focus:outline-none focus:border-cyan-400 font-semibold"
              >
                <option value="">-- Selecionar um serviço de referência do catálogo --</option>
                <option value="__manual__" className="text-cyan-300 font-bold">
                  ✍️ Digitar / Inserir Serviço Manualmente (Campos livres abaixo)
                </option>
                <option value="__add_new_catalog__" className="text-emerald-300 font-bold">
                  + Cadastrar Novo Serviço no Catálogo...
                </option>
                {executedServices.map(srv => (
                  <option key={srv.id} value={srv.id}>
                    [{srv.code}] {srv.name} — R$ {srv.defaultPrice.toFixed(2)} ({srv.unit})
                  </option>
                ))}
              </select>

              {selectedReferenceServiceId === '__manual__' ? (
                <p className="text-[11px] text-cyan-300 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-cyan-400" /> Modo de serviço manual ativo: preencha o nome, valor e detalhes nos campos abaixo.
                </p>
              ) : selectedReferenceServiceId && selectedReferenceServiceId !== '__add_new_catalog__' ? (
                <p className="text-[11px] text-cyan-300 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Especificações do serviço aplicadas ao formulário!
                </p>
              ) : (
                <p className="text-[10px] text-slate-400">
                  Selecione um serviço cadastrado, use &quot;Digitar Manualmente&quot; para orçamentos avulsos ou clique em &quot;+ Novo Serviço&quot; para cadastrar na guia.
                </p>
              )}
            </div>

            {/* Tipo de Produto / Orçamento */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">Tipo de Produto / Orçamento</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setProductType('virtual')}
                  className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 ${
                    productType === 'virtual'
                      ? 'bg-purple-500/20 border-purple-400 text-white shadow-lg shadow-purple-500/20'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <div className={`p-2 rounded-xl ${productType === 'virtual' ? 'bg-purple-500 text-white' : 'bg-white/10 text-slate-400'}`}>
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold">Produto Virtual</span>
                    <span className="block text-[10px] text-slate-300">Matriz, Arquivo Digital</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setProductType('fisico');
                    if (estimatedValue === 0) {
                      setEstimatedValue(calculatedPhysicalTotal);
                    }
                  }}
                  className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 ${
                    productType === 'fisico'
                      ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-lg shadow-cyan-500/20'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <div className={`p-2 rounded-xl ${productType === 'fisico' ? 'bg-cyan-500 text-slate-950' : 'bg-white/10 text-slate-400'}`}>
                    <Shirt className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold">Produto Físico</span>
                    <span className="block text-[10px] text-slate-300">Bordado + Insumos + Máquina</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Cliente */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Cliente</label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-white/20 bg-slate-900/80 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition backdrop-blur-md"
              >
                <option value="" className="bg-slate-900 text-slate-300">Selecionar cliente existente...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                    {c.name} ({c.documentNumber})
                  </option>
                ))}
              </select>
            </div>

            {/* Detalhes do Orçamento */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                {productType === 'fisico' ? 'Especificações do Produto Físico' : 'Detalhes do Orçamento'}
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">Tamanho do Bordado</label>
                  <input
                    type="text"
                    value={embroiderySize}
                    onChange={(e) => setEmbroiderySize(e.target.value)}
                    placeholder="Ex: 10×10cm"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 backdrop-blur-md focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">Tamanho do Bastidor</label>
                  <input
                    type="text"
                    value={hoopSize}
                    onChange={(e) => setHoopSize(e.target.value)}
                    placeholder="Ex: 13×18cm"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 backdrop-blur-md focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">Tecido / Peça Utilizada</label>
                  <input
                    type="text"
                    value={fabricType}
                    onChange={(e) => setFabricType(e.target.value)}
                    placeholder="Ex: Algodão, Camisa Polo..."
                    className="w-full text-xs px-3 py-2 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 backdrop-blur-md focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">Cor do Tecido / Peça</label>
                  <input
                    type="text"
                    value={fabricColor}
                    onChange={(e) => setFabricColor(e.target.value)}
                    placeholder="Ex: Branco"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 backdrop-blur-md focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 mb-1">Descrição do Serviço</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Bordado frontal em camisa polo, 15 cores..."
                  className="w-full text-xs p-3 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 backdrop-blur-md focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Se for Produto Físico: Insumos do Estoque & Tempo de Máquina */}
              {productType === 'fisico' && (
                <div className="space-y-4 pt-2 border-t border-white/10">
                  {/* 1. Insumos do Estoque */}
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-cyan-400/30 space-y-3 backdrop-blur-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-bold text-white">Insumos da Guia de Estoque</span>
                      </div>
                      <span className="text-[11px] font-extrabold text-cyan-300">
                        Insumos: R$ {totalMaterialsCost.toFixed(2)}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                        <div className="sm:col-span-5">
                          <label className="block text-[10px] text-slate-300 mb-1">Selecionar Insumo do Estoque</label>
                          <select
                            value={selectedInventoryItemId}
                            onChange={(e) => {
                              const id = e.target.value;
                              setSelectedInventoryItemId(id);
                              const item = inventory.find(i => i.id === id);
                              if (item) {
                                setSelectedMaterialUnit(item.unit || 'unidades');
                                if (item.hasFractioning) {
                                  setUseFractionedMode(true);
                                }
                              }
                            }}
                            className="w-full text-xs px-2.5 py-2 rounded-xl border border-white/20 bg-slate-900 text-white focus:outline-none focus:border-cyan-400 font-medium"
                          >
                            <option value="">Selecione um insumo do estoque...</option>
                            {inventory.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name} ({item.category}) — R$ {item.pricePerUnit?.toFixed(2)}/{item.unit}
                                {item.hasFractioning && item.fractionSize ? ` [Fracionado: R$ ${(item.pricePerFractionUnit || (item.pricePerUnit / item.fractionSize)).toFixed(4)}/${item.fractionUnit || 'm'}]` : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[10px] text-slate-300 mb-1">
                            {(() => {
                              const item = inventory.find(i => i.id === selectedInventoryItemId);
                              if (item && item.hasFractioning && useFractionedMode) {
                                return `Qtd (${item.fractionUnit || 'm'})`;
                              }
                              return 'Quantidade';
                            })()}
                          </label>
                          <input
                            type="number"
                            min="0.001"
                            step="any"
                            value={materialQuantity}
                            onChange={(e) => setMaterialQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full text-xs px-2.5 py-2 rounded-xl border border-white/20 bg-slate-900 text-white focus:outline-none focus:border-cyan-400 font-bold text-center"
                          />
                        </div>

                        <div className="sm:col-span-4">
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[10px] text-slate-300">Medida / Unidade</label>
                            <button
                              type="button"
                              onClick={() => setShowUnitModal(true)}
                              className="text-[10px] font-bold text-cyan-300 hover:text-cyan-200 flex items-center gap-0.5 hover:underline"
                            >
                              <Plus className="w-2.5 h-2.5" /> Nova
                            </button>
                          </div>
                          <select
                            value={
                              (() => {
                                const item = inventory.find(i => i.id === selectedInventoryItemId);
                                if (item && item.hasFractioning && useFractionedMode) {
                                  return item.fractionUnit || 'm';
                                }
                                return selectedMaterialUnit;
                              })()
                            }
                            disabled={Boolean(inventory.find(i => i.id === selectedInventoryItemId)?.hasFractioning && useFractionedMode)}
                            onChange={(e) => {
                              if (e.target.value === '__add_new__') {
                                setShowUnitModal(true);
                              } else {
                                setSelectedMaterialUnit(e.target.value);
                              }
                            }}
                            className="w-full text-xs px-2.5 py-2 rounded-xl border border-white/20 bg-slate-900 text-white focus:outline-none focus:border-cyan-400 font-semibold disabled:opacity-80"
                          >
                            {allUnits.map((u) => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                            <option value="__add_new__" className="font-bold text-cyan-400 bg-slate-800">
                              + Nova Unidade...
                            </option>
                          </select>
                        </div>
                      </div>

                      {/* Opção de Fracionamento quando selecionado um insumo configurado */}
                      {(() => {
                        const item = inventory.find(i => i.id === selectedInventoryItemId);
                        if (!item || !item.hasFractioning || !item.fractionSize) return null;

                        const fracPrice = item.pricePerFractionUnit || (item.pricePerUnit / item.fractionSize);
                        const qty = Number(materialQuantity) || 0;
                        const calcCost = useFractionedMode ? (qty * fracPrice) : (qty * item.pricePerUnit);

                        return (
                          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-cyan-400/30 space-y-2 text-xs text-slate-200">
                            <div className="flex items-center justify-between flex-wrap gap-1">
                              <span className="font-bold text-cyan-300 text-[11px] flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse inline-block"></span>
                                Insumo com Fracionamento Configurado
                              </span>
                              <span className="text-[10px] text-slate-300 font-medium">
                                1 {item.unit} = {item.fractionSize} {item.fractionUnit || 'm'}
                              </span>
                            </div>

                            <div className="flex items-center gap-4 bg-slate-950/60 p-2 rounded-lg border border-white/10">
                              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-cyan-300">
                                <input
                                  type="radio"
                                  name="fractionMode"
                                  checked={useFractionedMode}
                                  onChange={() => setUseFractionedMode(true)}
                                  className="text-cyan-400 focus:ring-cyan-400 bg-slate-900 border-white/20 cursor-pointer"
                                />
                                <span>Lançar Fracionado ({item.fractionUnit || 'm'})</span>
                              </label>
                              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-300 hover:text-white">
                                <input
                                  type="radio"
                                  name="fractionMode"
                                  checked={!useFractionedMode}
                                  onChange={() => setUseFractionedMode(false)}
                                  className="text-cyan-400 focus:ring-cyan-400 bg-slate-900 border-white/20 cursor-pointer"
                                />
                                <span>Unidade Inteira ({item.unit})</span>
                              </label>
                            </div>

                            <div className="flex items-center justify-between text-[11px] pt-1 font-bold">
                              <span>
                                {useFractionedMode ? (
                                  <>Preço da fração: <strong className="text-cyan-300">R$ {fracPrice.toFixed(4)} / {item.fractionUnit || 'm'}</strong></>
                                ) : (
                                  <>Preço da unidade: <strong className="text-cyan-300">R$ {item.pricePerUnit.toFixed(2)} / {item.unit}</strong></>
                                )}
                              </span>
                              <span>
                                Custo calculado: <strong className="text-emerald-400 text-xs font-black">R$ {calcCost.toFixed(2)}</strong>
                              </span>
                            </div>
                          </div>
                        );
                      })()}

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse inline-block"></span>
                          A quantidade consumida será baixada automaticamente do estoque do produto ao salvar.
                        </span>

                        <button
                          type="button"
                          onClick={handleAddMaterialItem}
                          disabled={!selectedInventoryItemId}
                          className="px-3.5 py-2 bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 font-extrabold text-xs rounded-xl hover:brightness-110 active:scale-95 transition flex items-center gap-1.5 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed shrink-0 ml-auto"
                        >
                          <Plus className="w-3.5 h-3.5" /> Adicionar Insumo
                        </button>
                      </div>
                    </div>

                    {/* Lista de Insumos Adicionados */}
                    {selectedMaterials.length > 0 ? (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-bold text-slate-300">Insumos no Orçamento:</span>
                        <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                          {selectedMaterials.map((m, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs">
                              <div className="truncate flex-1 pr-2">
                                <span className="font-semibold text-white block truncate">{m.name}</span>
                                <span className="text-[10px] text-slate-300">
                                  {m.isFractioned ? (
                                    <>
                                      <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 mr-1.5 font-bold">Fracionado</span>
                                      {m.quantity} {m.unit} × R$ {(m.pricePerFractionUnit || 0).toFixed(4)}/{m.unit}
                                    </>
                                  ) : (
                                    <>
                                      {m.quantity} {m.unit} × R$ {m.pricePerUnit.toFixed(2)}/{m.unit}
                                    </>
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-cyan-300 whitespace-nowrap">
                                  R$ {m.totalCost.toFixed(2)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMaterialItem(idx)}
                                  className="p-1 text-slate-400 hover:text-rose-400 transition"
                                  title="Remover insumo"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic bg-white/5 p-2 rounded-xl border border-white/5">
                        Nenhum insumo selecionado da guia de estoque. Adicione fios, entretelas, bastidores, agulhas ou tecidos para somar ao custo.
                      </p>
                    )}
                  </div>

                  {/* 2. Tempo de Máquina & Mão de Obra */}
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-cyan-400/30 space-y-3 backdrop-blur-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Cpu className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-bold text-white">Tempo de Máquina & Custo Operacional</span>
                      </div>
                      <span className="text-[11px] font-extrabold text-cyan-300">
                        Máquina: R$ {machineCost.toFixed(2)}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-300 mb-1">Tempo (Minutos)</label>
                        <input
                          type="number"
                          min="0"
                          value={machineTimeMinutes}
                          onChange={(e) => setMachineTimeMinutes(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="Ex: 45 min"
                          className="w-full text-xs px-2.5 py-2 rounded-xl border border-white/20 bg-slate-900 text-white focus:outline-none focus:border-cyan-400 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-300 mb-1">Valor/Hora (R$)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={machineHourlyRate}
                          onChange={(e) => setMachineHourlyRate(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="Ex: 30.00"
                          className="w-full text-xs px-2.5 py-2 rounded-xl border border-white/20 bg-slate-900 text-white focus:outline-none focus:border-cyan-400 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-300 mb-1">Mão de Obra (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={laborCost}
                          onChange={(e) => setLaborCost(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="Ex: 15.00"
                          className="w-full text-xs px-2.5 py-2 rounded-xl border border-white/20 bg-slate-900 text-white focus:outline-none focus:border-cyan-400 font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Resumo de Custos do Produto Físico */}
                  <div className="p-3 rounded-2xl bg-cyan-950/60 border border-cyan-400/40 flex items-center justify-between text-xs backdrop-blur-md">
                    <div>
                      <span className="text-slate-300 block text-[11px]">Total Calculado (Insumos + Máquina + Mão de Obra):</span>
                      <span className="text-base font-extrabold text-cyan-300">
                        R$ {calculatedPhysicalTotal.toFixed(2)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUnitPrice(calculatedPhysicalTotal);
                        const q = Number(itemQuantity) || 1;
                        setEstimatedValue(Number((calculatedPhysicalTotal * q).toFixed(2)));
                      }}
                      className="px-3 py-1.5 bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 font-extrabold text-xs rounded-xl hover:brightness-110 active:scale-95 transition shadow-sm cursor-pointer"
                    >
                      Aplicar no Orçamento
                    </button>
                  </div>
                </div>
              )}

              {/* Quantidade e Valor Final do Orçamento */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-cyan-400/40 space-y-3 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                    💰 Quantidade & Valor do Orçamento
                  </label>
                  {productType === 'virtual' && (
                    <button
                      type="button"
                      onClick={handleAiEstimate}
                      disabled={isAiCalculating}
                      className="px-2.5 py-1 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/30 text-cyan-300 text-[11px] font-semibold rounded-lg flex items-center gap-1 transition backdrop-blur-md cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      {isAiCalculating ? 'Calculando...' : 'Calcular com IA'}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Qtd */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Quantidade (Peças / Serviços) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={itemQuantity}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : Math.max(1, Number(e.target.value));
                        setItemQuantity(val);
                        const q = Number(val) || 1;
                        const u = Number(unitPrice) || 0;
                        if (u > 0) {
                          setEstimatedValue(Number((q * u).toFixed(2)));
                        }
                      }}
                      placeholder="1"
                      className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-white/20 bg-slate-900 text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  {/* Valor Unitário */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Valor Unitário (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={unitPrice}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : Number(e.target.value);
                        setUnitPrice(val);
                        const u = Number(val) || 0;
                        const q = Number(itemQuantity) || 1;
                        setEstimatedValue(Number((q * u).toFixed(2)));
                      }}
                      placeholder="R$ 0,00"
                      className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-white/20 bg-slate-900 text-cyan-300 focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  {/* Valor Total do Orçamento */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Valor Final Total (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={estimatedValue}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : Number(e.target.value);
                        setEstimatedValue(val);
                        const tot = Number(val) || 0;
                        const q = Number(itemQuantity) || 1;
                        if (q > 0) {
                          setUnitPrice(Number((tot / q).toFixed(2)));
                        }
                      }}
                      placeholder="R$ 0,00"
                      className="w-full text-sm font-black px-3 py-2.5 rounded-xl border border-cyan-400/50 bg-slate-900 text-cyan-300 focus:outline-none focus:border-cyan-400 shadow-sm"
                    />
                  </div>
                </div>

                {/* Resumo do cálculo */}
                <div className="flex items-center justify-between text-[11px] pt-1 text-slate-300 border-t border-white/10">
                  <span>
                    Cálculo: <strong className="text-white">{itemQuantity || 1} {Number(itemQuantity) === 1 ? 'peça/serviço' : 'peças/serviços'}</strong> × <strong className="text-cyan-300">R$ {(Number(unitPrice) || 0).toFixed(2)}</strong>
                  </span>
                  <span className="font-black text-cyan-300 text-xs">
                    Total: R$ {(Number(estimatedValue) || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {aiAnalysis && productType === 'virtual' && (
                <div className="p-3 bg-white/5 border border-cyan-400/30 rounded-xl space-y-1 text-xs backdrop-blur-md">
                  <p className="font-semibold text-cyan-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Estimativa IA
                  </p>
                  <p className="text-slate-200">Pontos Estimados: <span className="font-bold text-white">{aiAnalysis.stitchCount?.toLocaleString('pt-BR')}</span></p>
                  {aiAnalysis.technicalTips && (
                    <p className="text-slate-300 text-[11px] italic">Dica: {aiAnalysis.technicalTips}</p>
                  )}
                </div>
              )}
            </div>

            {/* Referência da Matriz */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Referência da Matriz</h4>
              <ImageUploadOrLink
                label=""
                value={matrixUrl}
                onChange={setMatrixUrl}
                placeholder="Cole a URL ou selecione a imagem da matriz (.DST, .PES, .JPG)"
              />
            </div>

            {/* Botão para Salvar como Serviço de Referência na Guia */}
            {onSaveServiceToCatalog && (
              <div className="pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleSaveCurrentQuoteAsServiceToCatalog}
                  className="w-full py-2.5 bg-white/10 hover:bg-white/15 border border-cyan-400/30 text-cyan-300 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <BookmarkPlus className="w-4 h-4 text-cyan-400" />
                  Salvar estas Especificações na Guia de Serviços de Referência
                </button>
                {savedCatalogSuccessMsg && (
                  <p className="text-[11px] text-center text-emerald-400 font-bold mt-1 animate-in fade-in">
                    ✓ Serviço salvo na Guia de Serviços Executados com sucesso!
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg shadow-cyan-500/25 border border-cyan-300/40 hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 text-slate-950" /> Gerar Orçamento
            </button>
          </form>
        </div>
      ) : (
        /* Lista e Dashboard de Orçamentos (Frosted Glass) */
        <div className="space-y-6">
          {/* Main Card Overview */}
          <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/15 shadow-2xl p-4 sm:p-5 space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">Orçamentos</h3>
                <p className="text-xs text-slate-300">
                  {filteredQuotes.length} {filteredQuotes.length === 1 ? 'orçamento encontrado' : 'orçamentos encontrados'}
                </p>
              </div>
            </div>

            {/* Dynamic Filter & Export Toolbar */}
            <DataFilterExportToolbar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Buscar por descrição, código, cliente ou tecido..."
              filterOptions={[
                {
                  key: 'status',
                  label: 'Status do Orçamento',
                  value: filterStatus,
                  options: [
                    { label: 'Todos os Status', value: 'todos' },
                    { label: 'Pendentes', value: 'Pendente' },
                    { label: 'Aprovados', value: 'Aprovado' },
                    { label: 'Recusados', value: 'Recusado' }
                  ],
                  onChange: setFilterStatus
                },
                {
                  key: 'client',
                  label: 'Filtrar por Cliente',
                  value: filterClient,
                  options: [
                    { label: 'Todos os Clientes', value: 'todos' },
                    ...(clients || []).map(c => ({ label: c.name, value: c.id }))
                  ],
                  onChange: setFilterClient
                },
                {
                  key: 'valueRange',
                  label: 'Faixa de Valor Estimado',
                  value: filterValueRange,
                  options: [
                    { label: 'Todos os Valores', value: 'todos' },
                    { label: 'Até R$ 100,00', value: 'ate_100' },
                    { label: 'R$ 100,00 a R$ 500,00', value: '100_500' },
                    { label: 'Acima de R$ 500,00', value: 'acima_500' }
                  ],
                  onChange: setFilterValueRange
                },
                {
                  key: 'sortBy',
                  label: 'Ordenar Resultados Por',
                  value: filterSortBy,
                  options: [
                    { label: 'Mais Recentes', value: 'recentes' },
                    { label: 'Mais Antigos', value: 'antigos' },
                    { label: 'Maior Valor Estimado', value: 'maior_valor' },
                    { label: 'Menor Valor Estimado', value: 'menor_valor' }
                  ],
                  onChange: setFilterSortBy
                }
              ]}
              startDate={startDate}
              onStartDateChange={setStartDate}
              endDate={endDate}
              onEndDateChange={setEndDate}
              onResetFilters={() => {
                setSearchQuery('');
                setFilterStatus('todos');
                setFilterClient('');
                setFilterValueRange('todos');
                setFilterSortBy('recentes');
                setStartDate('');
                setEndDate('');
                setFilterDate('');
              }}
              exportPayload={quotesExportPayload}
              totalFilteredCount={filteredQuotes.length}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />

            {/* Approval Chart Box */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 min-h-[160px] flex flex-col justify-center backdrop-blur-md">
              <p className="text-xs font-semibold text-cyan-300 mb-2 text-center">[Gráfico de Taxa de Aprovação]</p>
              <div className="h-28 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#cbd5e1' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#cbd5e1' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '12px' }} />
                    <Bar dataKey="aprovados" name="Aprovados" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pendentes" name="Pendentes" fill="rgba(255, 255, 255, 0.25)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 font-semibold">
                    <th className="py-2 px-1">ID</th>
                    <th className="py-2 px-1">Valor</th>
                    <th className="py-2 px-1">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {quotes.slice(0, 3).map((q) => (
                    <tr key={q.id}>
                      <td className="py-2 px-1 font-semibold text-white">{q.id}</td>
                      <td className="py-2 px-1 font-medium text-slate-200">R$ {q.estimatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="py-2 px-1">
                        <span className={`font-bold ${q.status === 'Aprovado' ? 'text-cyan-300' : 'text-slate-400'}`}>
                          {q.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Histórico Completo de Orçamentos */}
          <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/15 shadow-2xl p-4 sm:p-5 space-y-4 text-white">
            <h3 className="text-base font-bold text-white">Histórico de Orçamentos</h3>

            <div className={
              viewMode === 'large'
                ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
                : viewMode === 'small'
                ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5'
                : viewMode === 'list'
                ? 'space-y-2'
                : 'space-y-3'
            }>
              {filteredQuotes.map((q) => {
                if (viewMode === 'small') {
                  return (
                    <div key={q.id} className="p-2.5 rounded-2xl border border-white/10 bg-white/5 space-y-2 backdrop-blur-md flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-white">{q.id}</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                            q.status === 'Aprovado' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-300'
                          }`}>
                            {q.status}
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold text-cyan-300 truncate">{q.clientName}</p>
                        <p className="text-[10px] text-slate-300 line-clamp-2">{q.description}</p>
                      </div>
                      <div className="border-t border-white/10 pt-1.5 flex items-center justify-between text-[11px]">
                        <span className="font-black text-cyan-300">R$ {q.estimatedValue.toFixed(0)}</span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleOpenEditModal(q)} className="p-1 rounded bg-white/5 text-slate-300 hover:text-white">
                            <Edit className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (viewMode === 'list') {
                  return (
                    <div key={q.id} className="p-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-black text-xs text-white px-2 py-1 rounded bg-white/10">{q.id}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-cyan-200 truncate">{q.clientName}</span>
                            <span className="text-[10px] text-slate-400">({q.date})</span>
                          </div>
                          <p className="text-xs text-slate-300 truncate">{q.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 justify-between sm:justify-end shrink-0">
                        <span className="text-xs font-black text-cyan-300">
                          R$ {q.estimatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          q.status === 'Aprovado' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-300'
                        }`}>
                          {q.status}
                        </span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleOpenEditModal(q)} className="p-1.5 rounded-lg bg-white/5 text-slate-200 hover:text-white">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleExportQuote(q)} className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 hover:text-white">
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={q.id} className="p-3.5 rounded-2xl border border-white/10 bg-white/5 space-y-3 backdrop-blur-md flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-white">Orçamento {q.id}</span>
                            <span className="text-[11px] text-slate-400">({q.date})</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                              q.productType === 'fisico'
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                                : 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                            }`}>
                              {q.productType === 'fisico' ? <Shirt className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
                              {q.productType === 'fisico' ? 'Produto Físico' : 'Produto Virtual'}
                            </span>
                          </div>
                          <p className="text-xs text-cyan-200 font-medium mt-0.5">{q.clientName}</p>
                          <p className="text-xs text-slate-300 line-clamp-2 mt-1">{q.description}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-extrabold text-cyan-300 whitespace-nowrap">
                            R$ {q.estimatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          {q.itemQuantity && q.itemQuantity > 1 ? (
                            <span className="text-[10px] font-semibold text-cyan-200/80">
                              {q.itemQuantity}x R$ {(q.unitPrice || q.estimatedValue / q.itemQuantity).toFixed(2)}/un
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {q.productType === 'fisico' && (
                        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/10 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between text-[11px] font-bold text-cyan-300">
                            <span className="flex items-center gap-1">
                              <Package className="w-3.5 h-3.5" /> Detalhes da Produção Física
                            </span>
                            {q.machineTimeMinutes && q.machineTimeMinutes > 0 && (
                              <span className="flex items-center gap-1 text-slate-300">
                                <Cpu className="w-3 h-3 text-cyan-400" /> {q.machineTimeMinutes} min máquina
                              </span>
                            )}
                          </div>
                          {q.quoteMaterials && q.quoteMaterials.length > 0 && (
                            <div className="text-[11px] text-slate-300 space-y-0.5 pt-0.5">
                              <span className="font-semibold text-white">Insumos ({q.quoteMaterials.length}): </span>
                              <span className="text-slate-300">
                                {q.quoteMaterials.map(m => `${m.quantity}${m.unit} ${m.name}`).join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {q.matrixUrl && (
                        <div className="flex items-center gap-2 p-2 bg-white/10 rounded-xl border border-white/15">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={q.matrixUrl} alt="Matriz" className="w-10 h-10 object-cover rounded-lg border border-white/20" />
                          <div className="text-[11px] truncate flex-1">
                            <span className="font-semibold text-white block">Matriz de Bordado</span>
                            <span className="text-slate-400">{q.matrixFileName || 'imagem.jpg'}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Approval / Disapproval and action buttons */}
                    <div className="flex flex-wrap items-center justify-between pt-1 border-t border-white/10 gap-2 mt-2">
                      {q.status === 'Aprovado' ? (
                        <div className="flex items-center gap-1.5">
                          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Aprovado
                          </span>
                          <button
                            type="button"
                            onClick={() => onDisapproveQuote && onDisapproveQuote(q.id)}
                            className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 text-rose-300 text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                            title="Desaprovar orçamento"
                          >
                            <XCircle className="w-3.5 h-3.5 text-rose-300" /> Desaprovar
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateQuoteStatus(q.id, 'Aprovado');
                            onConvertToOrder(q);
                          }}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 border border-cyan-300/40 hover:brightness-110 shadow-lg shadow-cyan-500/20 font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer active:scale-95 transition"
                          title="Aprovar orçamento e gerar Ordem de Serviço"
                        >
                          <CheckCircle2 className="w-4 h-4 text-slate-950" /> Aprovar
                        </button>
                      )}

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => handleOpenEditModal(q)}
                          className="px-2.5 py-1.5 border border-white/20 bg-white/5 hover:bg-white/15 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1 transition backdrop-blur-md cursor-pointer active:scale-95"
                        >
                          <Edit className="w-3 h-3" /> Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExportQuote(q)}
                          className="px-2.5 py-1.5 border border-cyan-400/30 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 hover:text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition backdrop-blur-md shadow-sm active:scale-95 cursor-pointer"
                          title="Enviar ou Baixar"
                        >
                          <Download className="w-3.5 h-3.5 text-cyan-300" /> Enviar / Baixar
                        </button>
                        <button
                          onClick={() => onDeleteQuote(q.id)}
                          className="px-2.5 py-1.5 border border-rose-400/30 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs font-semibold rounded-xl flex items-center gap-1 transition backdrop-blur-md"
                        >
                          <Trash2 className="w-3 h-3" /> Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* Modal para Adicionar Novo Tipo de Unidade / Medida */}
      {showUnitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-cyan-400/30 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-cyan-400" /> Adicionar Tipo de Quantidade
              </h3>
              <button
                type="button"
                onClick={() => setShowUnitModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs text-slate-300 font-medium">
                Nome do Tipo / Medida (Ex: metros, retós, quilos, pacotes, rolos, litros)
              </label>
              <input
                type="text"
                value={newUnitName}
                onChange={(e) => setNewUnitName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveNewUnit();
                  }
                }}
                placeholder="Ex: rolos"
                className="w-full text-xs p-3 rounded-xl border border-white/20 bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowUnitModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveNewUnit}
                disabled={!newUnitName.trim()}
                className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 font-bold text-xs rounded-xl hover:brightness-110 active:scale-95 transition disabled:opacity-40"
              >
                Salvar Unidade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Exportação e Envio de Orçamento Individual */}
      {selectedQuoteForExport && (
        <ExportDataModal
          isOpen={Boolean(selectedQuoteForExport)}
          onClose={() => setSelectedQuoteForExport(null)}
          payload={selectedQuoteForExport}
        />
      )}

      {/* Modal para Editar Orçamento */}
      {editingQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-3xl p-4 sm:p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto my-auto text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Editar Orçamento {editingQuote.id}</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingQuote(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditSubmit} className="space-y-4">
              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Status do Orçamento</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as 'Pendente' | 'Aprovado' | 'Recusado')}
                  className="w-full text-xs p-3 rounded-xl border border-white/20 bg-slate-950 text-white focus:outline-none focus:border-cyan-400 font-bold"
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Aprovado">Aprovado</option>
                  <option value="Recusado">Recusado</option>
                </select>
              </div>

              {/* Tipo de Produto / Orçamento */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Tipo de Produto</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditProductType('virtual')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      editProductType === 'virtual'
                        ? 'bg-purple-500/20 border-purple-400 text-purple-200'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" /> Produto Virtual (Matriz)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditProductType('fisico')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      editProductType === 'fisico'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <Shirt className="w-4 h-4" /> Produto Físico (Bordado)
                  </button>
                </div>
              </div>

              {/* Cliente */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Cliente</label>
                <select
                  value={editClientId}
                  onChange={(e) => setEditClientId(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-white/20 bg-slate-950 text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="">Selecione um cliente...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Descrição / Detalhes do Serviço</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-3 rounded-xl border border-white/20 bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  placeholder="Descreva o bordado ou serviço..."
                />
              </div>

              {/* Dimensões e Tecido */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Tamanho do Bordado</label>
                  <input
                    type="text"
                    value={editEmbroiderySize}
                    onChange={(e) => setEditEmbroiderySize(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-white/20 bg-slate-950 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Tamanho do Bastidor</label>
                  <input
                    type="text"
                    value={editHoopSize}
                    onChange={(e) => setEditHoopSize(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-white/20 bg-slate-950 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Tipo de Tecido</label>
                  <input
                    type="text"
                    value={editFabricType}
                    onChange={(e) => setEditFabricType(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-white/20 bg-slate-950 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Cor do Tecido</label>
                  <input
                    type="text"
                    value={editFabricColor}
                    onChange={(e) => setEditFabricColor(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-white/20 bg-slate-950 text-white"
                  />
                </div>
              </div>

              {/* Matriz / Imagem Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Imagem / Arquivo da Matriz</label>
                <ImageUploadOrLink
                  value={editMatrixUrl}
                  onChange={(val) => setEditMatrixUrl(val)}
                  label="Selecione ou Cole Link da Matriz"
                />
              </div>

              {/* Detalhes de Produto Físico */}
              {editProductType === 'fisico' && (
                <div className="p-3 bg-slate-950/80 rounded-2xl border border-cyan-500/20 space-y-3">
                  <h4 className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <Package className="w-4 h-4" /> Composição de Custos do Produto Físico
                  </h4>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Tempo Máq (min)</label>
                      <input
                        type="number"
                        value={editMachineTimeMinutes}
                        onChange={(e) => setEditMachineTimeMinutes(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full text-xs p-2 rounded-xl border border-white/10 bg-slate-900 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Hora Máq (R$)</label>
                      <input
                        type="number"
                        value={editMachineHourlyRate}
                        onChange={(e) => setEditMachineHourlyRate(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full text-xs p-2 rounded-xl border border-white/10 bg-slate-900 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Mão de Obra (R$)</label>
                      <input
                        type="number"
                        value={editLaborCost}
                        onChange={(e) => setEditLaborCost(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full text-xs p-2 rounded-xl border border-white/10 bg-slate-900 text-white"
                      />
                    </div>
                  </div>

                  {/* Adicionar Insumos */}
                  {inventory.length > 0 && (
                    <div className="space-y-2 pt-1 border-t border-white/10">
                      <label className="block text-[11px] font-bold text-slate-300">Adicionar Insumo do Estoque</label>
                      <div className="flex gap-2 items-center">
                        <select
                          value={editSelectedInventoryItemId}
                          onChange={(e) => setEditSelectedInventoryItemId(e.target.value)}
                          className="flex-1 text-xs p-2 rounded-xl border border-white/10 bg-slate-900 text-white"
                        >
                          <option value="">Selecione o insumo...</option>
                          {inventory.map((inv) => (
                            <option key={inv.id} value={inv.id}>
                              {inv.name} (R$ {inv.pricePerUnit.toFixed(2)}/{inv.unit})
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={editMaterialQuantity}
                          onChange={(e) => setEditMaterialQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="Qtd"
                          className="w-16 text-xs p-2 rounded-xl border border-white/10 bg-slate-900 text-white"
                        />
                        <button
                          type="button"
                          onClick={handleAddEditMaterialItem}
                          disabled={!editSelectedInventoryItemId}
                          className="px-3 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl disabled:opacity-40 transition cursor-pointer"
                        >
                          + Add
                        </button>
                      </div>

                      {/* Lista de Insumos Adicionados */}
                      {editMaterials.length > 0 && (
                        <div className="space-y-1 pt-1">
                          {editMaterials.map((m, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[11px] bg-white/5 p-2 rounded-xl border border-white/10">
                              <span>
                                {m.name} ({m.quantity} {m.unit})
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-cyan-300">R$ {m.totalCost.toFixed(2)}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveEditMaterialItem(idx)}
                                  className="text-rose-400 hover:text-rose-300 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Quantidade, Valor Unitário e Valor Total do Orçamento */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-white/10 space-y-2.5">
                <label className="block text-xs font-bold text-slate-200">Quantidade & Valor do Orçamento</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Quantidade *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={editItemQuantity}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : Math.max(1, Number(e.target.value));
                        setEditItemQuantity(val);
                        const q = Number(val) || 1;
                        const u = Number(editUnitPrice) || 0;
                        if (u > 0) setEditEstimatedValue(Number((q * u).toFixed(2)));
                      }}
                      className="w-full text-xs font-bold p-2 rounded-xl border border-white/10 bg-slate-900 text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Valor Unitário (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editUnitPrice}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : Number(e.target.value);
                        setEditUnitPrice(val);
                        const u = Number(val) || 0;
                        const q = Number(editItemQuantity) || 1;
                        setEditEstimatedValue(Number((q * u).toFixed(2)));
                      }}
                      className="w-full text-xs font-bold p-2 rounded-xl border border-white/10 bg-slate-900 text-cyan-300 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Valor Total (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={editEstimatedValue}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : Number(e.target.value);
                        setEditEstimatedValue(val);
                        const tot = Number(val) || 0;
                        const q = Number(editItemQuantity) || 1;
                        if (q > 0) setEditUnitPrice(Number((tot / q).toFixed(2)));
                      }}
                      className="w-full text-xs font-extrabold text-cyan-300 p-2 rounded-xl border border-cyan-500/40 bg-slate-900 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-white/5">
                  <span>Cálculo: {editItemQuantity || 1} x R$ {(Number(editUnitPrice) || 0).toFixed(2)}</span>
                  <span className="font-bold text-cyan-300">Total: R$ {(Number(editEstimatedValue) || 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Ações do Modal */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingQuote(null)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 font-extrabold text-xs rounded-xl hover:brightness-110 active:scale-95 transition shadow-lg shadow-cyan-500/20 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Rápido de Cadastrar Novo Serviço na Guia de Serviços */}
      {showQuickAddServiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/20 text-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" /> Cadastrar Novo Serviço no Catálogo
              </h3>
              <button
                type="button"
                onClick={() => setShowQuickAddServiceModal(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕ Fechar
              </button>
            </div>

            <form onSubmit={handleCreateQuickService} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Código *</label>
                  <input
                    type="text"
                    required
                    value={quickServiceCode}
                    onChange={(e) => setQuickServiceCode(e.target.value.toUpperCase())}
                    placeholder="SRV-001"
                    className="w-full text-xs px-2.5 py-2 rounded-xl border border-white/20 bg-slate-950 text-cyan-300 font-mono font-bold focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1">Nome do Serviço *</label>
                  <input
                    type="text"
                    required
                    value={quickServiceName}
                    onChange={(e) => setQuickServiceName(e.target.value)}
                    placeholder="Ex: Bordado Camisa Polo"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-white/20 bg-slate-950 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Categoria</label>
                  <select
                    value={quickServiceCategory}
                    onChange={(e) => setQuickServiceCategory(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 rounded-xl border border-white/20 bg-slate-950 text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Bordado Computadorizado">Bordado Computadorizado</option>
                    <option value="Programação de Matriz">Programação de Matriz</option>
                    <option value="Costura & Confecção">Costura & Confecção</option>
                    <option value="Estamparia & Sublimação">Estamparia & Sublimação</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Preço Base (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={quickServicePrice}
                    onChange={(e) => setQuickServicePrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-white/20 bg-slate-950 text-cyan-300 font-bold focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Descrição Adicional (Opcional)</label>
                <textarea
                  rows={2}
                  value={quickServiceDescription}
                  onChange={(e) => setQuickServiceDescription(e.target.value)}
                  placeholder="Ex: Inclui preparação de tecido e bastidor..."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-white/20 bg-slate-950 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowQuickAddServiceModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 text-xs font-bold hover:brightness-110 transition cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-4 h-4" /> Cadastrar e Selecionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
