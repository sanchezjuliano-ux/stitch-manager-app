'use client';

import React, { useState } from 'react';
import { ServiceOrder, OrderStatus, Client, Quote, ProductType, DisplayViewMode } from '@/lib/types';
import { ImageUploadOrLink } from '../common/ImageUploadOrLink';
import { DataFilterExportToolbar } from '../common/DataFilterExportToolbar';
import { ExportDataPayload } from '@/lib/exportUtils';
import { ExportDataModal } from '../common/ExportDataModal';
import { 
  Send, 
  Wallet, 
  Check, 
  Truck, 
  Plus, 
  ChevronRight, 
  CheckCircle2, 
  Image as ImageIcon,
  ZoomIn,
  FileCode2,
  Scissors,
  Layers,
  X,
  Clock,
  Sparkles,
  Info,
  Calendar,
  AlertCircle,
  Trash2,
  Pencil,
  Download,
  Smartphone,
  Shirt
} from 'lucide-react';

interface OrdersViewProps {
  orders: ServiceOrder[];
  clients?: Client[];
  quotes?: Quote[];
  onAddOrder: (newOrder: Omit<ServiceOrder, 'id'> & { id?: string }) => void;
  onToggleStep: (orderId: string, stepIndex: number) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onToggleSinglePayment: (orderId: string) => void;
  onConfirmPayment: (orderId: string, paymentType: 'single_payment' | 'payment1' | 'payment2', amount: number) => void;
  onUndoPayment: (orderId: string, paymentType: 'single_payment' | 'payment1' | 'payment2') => void;
  onConfirmShipping: (orderId: string) => void;
  onUndoShipping: (orderId: string) => void;
  onUpdateOrderDetails?: (orderId: string, updatedFields: Partial<ServiceOrder>) => void;
  onDeleteOrder?: (orderId: string) => void;
}

interface OrderCardProps {
  order: ServiceOrder;
  clients?: Client[];
  quotes?: Quote[];
  onToggleSinglePayment: (orderId: string) => void;
  onConfirmPayment: (orderId: string, paymentType: 'single_payment' | 'payment1' | 'payment2', amount: number) => void;
  onUndoPayment: (orderId: string, paymentType: 'single_payment' | 'payment1' | 'payment2') => void;
  onConfirmShipping: (orderId: string) => void;
  onUndoShipping: (orderId: string) => void;
  onSelectDetails: (order: ServiceOrder) => void;
  getStatusBadgeStyle: (status: OrderStatus) => string;
  onRequestDeleteOrder?: (order: ServiceOrder) => void;
  onExportOrder?: (order: ServiceOrder) => void;
  onUpdateOrderDetails?: (orderId: string, updatedFields: Partial<ServiceOrder>) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  clients,
  quotes,
  onToggleSinglePayment,
  onConfirmPayment,
  onUndoPayment,
  onConfirmShipping,
  onUndoShipping,
  onSelectDetails,
  getStatusBadgeStyle,
  onRequestDeleteOrder,
  onExportOrder,
  onUpdateOrderDetails
}) => {
  const step1 = order.steps.find(s => s.type === 'payment1');
  const step2 = order.steps.find(s => s.type === 'payment2');
  const shippingStep = order.steps.find(s => s.type === 'shipping');

  const defaultSingleVal = order.totalValue;
  const defaultP1Val = step1?.amount || (order.totalValue / 2);
  const defaultP2Val = step2?.amount || (order.totalValue - (step1?.amount || order.totalValue / 2));

  const [singleVal, setSingleVal] = useState<string>(defaultSingleVal.toString());
  const [p1Val, setP1Val] = useState<string>(defaultP1Val.toString());
  const [p2Val, setP2Val] = useState<string>(defaultP2Val.toString());

  const [isEditingId, setIsEditingId] = useState(false);
  const [editingIdVal, setEditingIdVal] = useState(order.id);

  const handleSaveCardId = () => {
    if (!editingIdVal.trim()) return;
    let formatted = editingIdVal.trim();
    if (!formatted.startsWith('OS #') && !formatted.startsWith('#')) {
      formatted = `OS #${formatted}`;
    } else if (formatted.startsWith('#')) {
      formatted = `OS ${formatted}`;
    }
    if (onUpdateOrderDetails && formatted !== order.id) {
      onUpdateOrderDetails(order.id, { id: formatted });
    }
    setIsEditingId(false);
  };

  const handleConfirmSingle = () => {
    const num = parseFloat(singleVal) || defaultSingleVal;
    onConfirmPayment(order.id, 'single_payment', num);
  };

  const handleConfirmP1 = () => {
    const num = parseFloat(p1Val) || defaultP1Val;
    onConfirmPayment(order.id, 'payment1', num);
  };

  const handleConfirmP2 = () => {
    const num = parseFloat(p2Val) || defaultP2Val;
    onConfirmPayment(order.id, 'payment2', num);
  };

  const isSinglePaid = step1?.completed || order.paidValue >= order.totalValue;
  const isShippingDone = shippingStep?.completed || order.status === 'Concluído';

  const matchedClient = clients?.find(c => c.id === order.clientId || c.name.toLowerCase() === order.clientName.toLowerCase());
  const matchedQuote = quotes?.find(q => q.id === order.quoteId || (order.quoteId && q.id === order.quoteId.replace('OS ', '')));
  const cardImage = order.imageUrl || matchedQuote?.matrixUrl;

  const deliveryMethods = order.matrixDeliveryPreferences?.length
    ? order.matrixDeliveryPreferences.map(p => p === 'Outro' && order.matrixDeliveryOther ? `Outro (${order.matrixDeliveryOther})` : p)
    : matchedClient?.matrixDeliveryPreferences?.length
      ? matchedClient.matrixDeliveryPreferences.map(p => p === 'Outro' && matchedClient.matrixDeliveryOther ? `Outro (${matchedClient.matrixDeliveryOther})` : p)
      : [];

  const machineFormat = order.machineFileFormat
    || (matchedClient?.embroideryMachines && matchedClient.embroideryMachines.length > 0
        ? matchedClient.embroideryMachines.map(m => m.fileFormat).filter(Boolean).join(', ')
        : undefined);

  return (
    <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/15 shadow-2xl p-4 sm:p-5 space-y-4 text-white hover:border-white/25 transition">
      {/* Header row */}
      <div className="flex items-start justify-between border-b border-white/10 pb-3 gap-2">
        <div className="flex items-center gap-3">
          {cardImage ? (
            <button
              onClick={() => onSelectDetails(order)}
              className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/20 bg-slate-900 shrink-0 group hover:ring-2 hover:ring-cyan-400 transition"
              title="Clique para ver imagem completa"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cardImage} alt={order.id} className="w-full h-full object-cover group-hover:scale-110 transition duration-300" />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <ZoomIn className="w-4 h-4 text-white" />
              </div>
            </button>
          ) : (
            <div className="w-12 h-12 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-center shrink-0 text-cyan-400">
              <ImageIcon className="w-6 h-6 opacity-60" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              {isEditingId ? (
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editingIdVal}
                    onChange={(e) => setEditingIdVal(e.target.value)}
                    className="bg-slate-800 text-cyan-200 font-extrabold text-sm px-2 py-1 rounded-lg border border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-300 w-32"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveCardId();
                      }
                      if (e.key === 'Escape') {
                        setIsEditingId(false);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSaveCardId}
                    className="p-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition shrink-0"
                    title="Salvar número da OS"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingId(false)}
                    className="p-1 rounded-md bg-white/10 text-slate-300 border border-white/10 hover:bg-white/20 transition shrink-0"
                    title="Cancelar"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <h3 className="text-lg font-extrabold text-white tracking-tight">{order.id}</h3>
                  {onUpdateOrderDetails && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingIdVal(order.id);
                        setIsEditingId(true);
                      }}
                      className="p-1 text-slate-400 hover:text-cyan-300 hover:bg-cyan-400/10 rounded-md transition"
                      title="Editar número da OS"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {order.quoteId && (
                    <span className="text-[10px] font-bold text-cyan-300 bg-cyan-400/10 px-2 py-0.5 rounded-md border border-cyan-400/20">
                      Orçamento {order.quoteId}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1 mt-0.5">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-300">
                  Cliente: <strong className="text-cyan-200 font-bold">{order.clientName}</strong>
                </span>
                {machineFormat && (
                  <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-purple-500/20 text-purple-200 border border-purple-400/30 flex items-center gap-1" title={`Formato lido pela máquina: ${machineFormat}`}>
                    <FileCode2 className="w-3 h-3 text-purple-300" />
                    {machineFormat}
                  </span>
                )}
              </div>

              {deliveryMethods.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 text-[11px]">
                  <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 shrink-0">
                    <Send className="w-3 h-3 text-cyan-400" /> Envio:
                  </span>
                  {deliveryMethods.map((method, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 bg-cyan-400/15 text-cyan-300 border border-cyan-400/30 font-bold text-[10px] rounded-md"
                    >
                      {method}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadgeStyle(order.status)}`}>
            {order.status}
          </span>
          {isShippingDone ? (
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-emerald-300 font-bold flex items-center gap-1 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/30 shadow-sm" title="Data do envio definitivo do serviço">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Data de Entrega: <strong className="text-white">{order.actualDeliveryDate || shippingStep?.date || order.deliveryDate}</strong>
              </span>
              <span className="text-[9px] text-slate-400 mt-0.5">
                Prev: {order.deliveryDate}
              </span>
            </div>
          ) : (
            <span className="text-[10px] text-cyan-200 font-medium flex items-center gap-1 bg-cyan-400/10 px-2 py-0.5 rounded-md border border-cyan-400/20" title="Previsão de entrega do serviço">
              <Calendar className="w-3 h-3 text-cyan-400" />
              Previsão de Entrega: <strong className="text-white font-bold">{order.deliveryDate}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Steps & Payment Box */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-3.5 space-y-3 backdrop-blur-md">
        {/* Step 0: Approval */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-cyan-400" />
            <span className="font-medium text-slate-200">Enviada para aprovação</span>
          </div>
          <span className="font-bold text-white">{order.steps[0]?.date || order.creationDate}</span>
        </div>

        {/* Toggle Single Payment Switch */}
        <div className="flex items-center justify-between text-xs pt-2 border-t border-white/10">
          <span className="font-semibold text-slate-300">Pagamento Único</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={order.isSinglePayment}
              onChange={() => onToggleSinglePayment(order.id)}
              className="sr-only peer"
            />
            <div className="w-8 h-4 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-cyan-400 peer-checked:to-blue-600"></div>
          </label>
        </div>

        {/* Single Payment Mode */}
        {order.isSinglePayment ? (
          isSinglePaid ? (
            <div className="flex items-center justify-between text-xs p-2.5 bg-emerald-500/15 rounded-xl border border-emerald-400/30 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                <div>
                  <span className="font-extrabold text-emerald-200 block">Pagamento Único Quitado</span>
                  <span className="text-[10px] text-emerald-300/80">
                    R$ {(step1?.amount || order.totalValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em {step1?.date || order.creationDate} (Lançado no Financeiro)
                  </span>
                </div>
              </div>
              <button
                onClick={() => onUndoPayment(order.id, 'single_payment')}
                className="text-[11px] font-semibold text-rose-300 hover:text-rose-200 underline shrink-0"
              >
                Desfazer
              </button>
            </div>
          ) : (
            <div className="space-y-1.5 p-2.5 rounded-xl bg-slate-950/40 border border-emerald-500/30">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-emerald-200">Lançar Pagamento Único</span>
                </div>
                <span className="text-[10px] font-bold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">Pendente</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={singleVal}
                    onChange={(e) => setSingleVal(e.target.value)}
                    className="w-full pl-8 pr-2 py-1.5 text-xs font-extrabold bg-slate-900 border border-emerald-400/40 rounded-xl text-emerald-300 focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <button
                  onClick={handleConfirmSingle}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 font-black text-xs rounded-xl shadow-md hover:brightness-110 active:scale-95 transition flex items-center gap-1 shrink-0"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" /> Confirmar
                </button>
              </div>
            </div>
          )
        ) : (
          /* Split Payments Mode (Pagamento 1 e Pagamento 2) */
          <div className="space-y-2.5">
            {/* Pagamento 1 */}
            {step1?.completed ? (
              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                  <div>
                    <span className="font-extrabold text-emerald-200 block">Pagamento 1 Quitado</span>
                    <span className="text-[10px] text-emerald-300/80">
                      R$ {(step1.amount || (order.totalValue / 2)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em {step1.date} (Lançado no Financeiro)
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onUndoPayment(order.id, 'payment1')}
                  className="text-[10px] font-semibold text-rose-300 hover:text-rose-200 underline shrink-0"
                >
                  Desfazer
                </button>
              </div>
            ) : (
              <div className="space-y-1.5 p-2.5 rounded-xl bg-slate-950/40 border border-cyan-500/30">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-slate-200">Pagamento 1 (Sinal)</span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">Pendente</span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={p1Val}
                      onChange={(e) => setP1Val(e.target.value)}
                      className="w-full pl-8 pr-2 py-1.5 text-xs font-extrabold bg-slate-900 border border-cyan-400/40 rounded-xl text-cyan-300 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <button
                    onClick={handleConfirmP1}
                    className="px-3 py-1.5 bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 font-black text-xs rounded-xl shadow-md hover:brightness-110 active:scale-95 transition flex items-center gap-1 shrink-0"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" /> Lançar Pgt 1
                  </button>
                </div>
              </div>
            )}

            {/* Pagamento 2 */}
            {step2?.completed ? (
              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                  <div>
                    <span className="font-extrabold text-emerald-200 block">Pagamento 2 Quitado</span>
                    <span className="text-[10px] text-emerald-300/80">
                      R$ {(step2.amount || (order.totalValue / 2)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em {step2.date} (Lançado no Financeiro)
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onUndoPayment(order.id, 'payment2')}
                  className="text-[10px] font-semibold text-rose-300 hover:text-rose-200 underline shrink-0"
                >
                  Desfazer
                </button>
              </div>
            ) : (
              <div className="space-y-1.5 p-2.5 rounded-xl bg-slate-950/40 border border-cyan-500/30">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-slate-200">Pagamento 2 (Final)</span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">Pendente</span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={p2Val}
                      onChange={(e) => setP2Val(e.target.value)}
                      className="w-full pl-8 pr-2 py-1.5 text-xs font-extrabold bg-slate-900 border border-cyan-400/40 rounded-xl text-cyan-300 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <button
                    onClick={handleConfirmP2}
                    className="px-3 py-1.5 bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 font-black text-xs rounded-xl shadow-md hover:brightness-110 active:scale-95 transition flex items-center gap-1 shrink-0"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" /> Lançar Pgt 2
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Shipping Step - Botão Envio Definitivo */}
        <div className="pt-2 border-t border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-pink-300">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-pink-400" />
              <span className="font-bold">Envio Definitivo</span>
            </div>
            <span className="font-bold text-slate-300">{shippingStep?.date || order.deliveryDate}</span>
          </div>

          {isShippingDone ? (
            <div className="flex items-center justify-between text-xs p-2.5 bg-pink-500/15 rounded-xl border border-pink-400/30">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-pink-300 shrink-0" />
                <div>
                  <span className="font-extrabold text-pink-200 block">Envio Definitivo Realizado</span>
                  <span className="text-[10px] text-pink-300/80">
                    Enviado em {shippingStep?.date || order.deliveryDate} (OS Concluída)
                  </span>
                </div>
              </div>
              <button
                onClick={() => onUndoShipping(order.id)}
                className="text-[10px] font-semibold text-rose-300 hover:text-rose-200 underline shrink-0"
              >
                Desfazer
              </button>
            </div>
          ) : (
            <button
              onClick={() => onConfirmShipping(order.id)}
              className="w-full py-2.5 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:brightness-110 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-pink-500/25 border border-pink-400/40 transition flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Truck className="w-4 h-4 stroke-[2.5]" /> Confirmar Envio e Finalizar OS
            </button>
          )}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
        <div className="text-xs text-slate-300">
          Valor Total: <span className="font-extrabold text-cyan-300">R$ {order.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {onExportOrder && (
            <button
              onClick={() => onExportOrder(order)}
              className="px-2.5 py-1.5 border border-cyan-500/30 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 text-xs font-semibold rounded-xl flex items-center gap-1 transition backdrop-blur-md active:scale-95 cursor-pointer"
              title="Enviar / Baixar OS"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" /> Enviar / Baixar
            </button>
          )}
          {onRequestDeleteOrder && (
            <button
              onClick={() => onRequestDeleteOrder(order)}
              className="px-2.5 py-1.5 border border-rose-500/30 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-semibold rounded-xl flex items-center gap-1 transition backdrop-blur-md active:scale-95 cursor-pointer"
              title="Excluir Ordem de Serviço"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Excluir
            </button>
          )}
          <button
            onClick={() => onSelectDetails(order)}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-cyan-300 hover:text-cyan-200 rounded-xl flex items-center gap-1 transition shadow-sm cursor-pointer"
          >
            Ver Detalhes <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  clients,
  quotes,
  onAddOrder,
  onToggleStep,
  onUpdateStatus,
  onToggleSinglePayment,
  onConfirmPayment,
  onUndoPayment,
  onConfirmShipping,
  onUndoShipping,
  onUpdateOrderDetails,
  onDeleteOrder
}) => {
  const [activeFilter, setActiveFilter] = useState<'Todas Ativas' | 'Aguardando Pagamento' | 'Em Andamento' | 'Concluído'>('Todas Ativas');
  const [viewMode, setViewMode] = useState<DisplayViewMode>('medium');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientFilter, setSelectedClientFilter] = useState('todos');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('todos');
  const [fabricFilter, setFabricFilter] = useState('todos');
  const [sortByFilter, setSortByFilter] = useState('recentes');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<ServiceOrder | null>(null);
  const [selectedOrderForExport, setSelectedOrderForExport] = useState<ExportDataPayload | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<ServiceOrder | null>(null);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [showImageZoom, setShowImageZoom] = useState<string | null>(null);

  // Edit image mode in details modal
  const [isEditingImage, setIsEditingImage] = useState(false);

  // OS ID Edit states
  const [isEditingModalId, setIsEditingModalId] = useState(false);
  const [modalIdInput, setModalIdInput] = useState('');
  const [customOsNumber, setCustomOsNumber] = useState('');

  const handleSaveModalId = () => {
    if (!currentModalOrder || !modalIdInput.trim()) return;
    let formatted = modalIdInput.trim();
    if (!formatted.startsWith('OS #') && !formatted.startsWith('#')) {
      formatted = `OS #${formatted}`;
    } else if (formatted.startsWith('#')) {
      formatted = `OS ${formatted}`;
    }
    if (onUpdateOrderDetails && formatted !== currentModalOrder.id) {
      onUpdateOrderDetails(currentModalOrder.id, { id: formatted });
    }
    setIsEditingModalId(false);
  };

  // New OS Form state
  const [newClientName, setNewClientName] = useState('');
  const [newProductType, setNewProductType] = useState<ProductType>('virtual');
  const [newDescription, setNewDescription] = useState('');
  const [newTotalValue, setNewTotalValue] = useState<number>(350);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newEmbroiderySize, setNewEmbroiderySize] = useState('10x10cm');
  const [newHoopSize, setNewHoopSize] = useState('13x18cm');
  const [newFabricType, setNewFabricType] = useState('Algodão');
  const [newFabricColor, setNewFabricColor] = useState('Branco');
  const [newStitchCount, setNewStitchCount] = useState<number | ''>('');
  const [newMatrixFileName, setNewMatrixFileName] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newDeliveryDate, setNewDeliveryDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0]; // YYYY-MM-DD format for datepicker
  });

  const formatInputDateToPtBr = (dateStr: string) => {
    if (!dateStr) return new Date(Date.now() + 7 * 24 * 3600 * 1000).toLocaleDateString('pt-BR');
    if (dateStr.includes('-')) {
      const [year, month, day] = dateStr.split('-');
      if (year && month && day) {
        return `${day}/${month}/${year}`;
      }
    }
    return dateStr;
  };

  const filteredOrders = orders
    .filter((o) => {
      // Status tab filter
      if (activeFilter === 'Todas Ativas' && o.status === 'Cancelado') return false;
      if (activeFilter === 'Aguardando Pagamento' && o.status !== 'Aguardando') return false;
      if (activeFilter === 'Em Andamento' && o.status !== 'Em Andamento') return false;
      if (activeFilter === 'Concluído' && o.status !== 'Concluído') return false;

      // Client filter dropdown
      if (selectedClientFilter !== 'todos' && o.clientId !== selectedClientFilter && !o.clientName.toLowerCase().includes(selectedClientFilter.toLowerCase())) {
        return false;
      }

      // Payment Status filter
      if (paymentStatusFilter === 'pago' && o.paidValue < o.totalValue) return false;
      if (paymentStatusFilter === 'sinal' && (o.paidValue <= 0 || o.paidValue >= o.totalValue)) return false;
      if (paymentStatusFilter === 'pendente' && o.paidValue > 0) return false;

      // Fabric type filter
      if (fabricFilter !== 'todos') {
        const fab = (o.fabricType || '').toLowerCase();
        if (!fab.includes(fabricFilter.toLowerCase())) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          o.id.toLowerCase().includes(q) ||
          o.clientName.toLowerCase().includes(q) ||
          o.description.toLowerCase().includes(q) ||
          (o.matrixFileName && o.matrixFileName.toLowerCase().includes(q)) ||
          (o.notes && o.notes.toLowerCase().includes(q)) ||
          (o.fabricType && o.fabricType.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortByFilter === 'maior_valor') return b.totalValue - a.totalValue;
      if (sortByFilter === 'menor_valor') return a.totalValue - b.totalValue;
      if (sortByFilter === 'antigas') return a.id.localeCompare(b.id, 'pt-BR');
      return b.id.localeCompare(a.id, 'pt-BR');
    });

  const handleExportOrder = (o: ServiceOrder) => {
    const matchedQuote = quotes?.find(
      (q) => q.id === o.quoteId || (o.quoteId && q.id === o.quoteId.replace('OS ', ''))
    );

    const effectiveProductType =
      o.productType ||
      matchedQuote?.productType ||
      (matchedQuote?.machineTimeMinutes || (matchedQuote?.quoteMaterials && matchedQuote.quoteMaterials.length > 0) ? 'fisico' : 'virtual');

    const isVirtual = effectiveProductType === 'virtual';

    const rows: (string | number)[][] = [
      ['Número da OS', o.id],
      ['Orçamento de Origem', o.quoteId || '-'],
      ['Data de Entrada', o.creationDate],
      ['Previsão de Entrega', o.deliveryDate],
      ['Cliente', o.clientName],
      ['Tipo de Produto', isVirtual ? 'Produto Virtual (Matriz)' : 'Produto Físico (Bordado/Confecção)'],
      ['Status da OS', o.status],
      ['Descrição do Serviço', o.description || '-']
    ];

    if (o.matrixFileName || matchedQuote?.matrixFileName) {
      rows.push(['Arquivo de Referência / Matriz', o.matrixFileName || matchedQuote?.matrixFileName || '']);
    }
    if (o.embroiderySize) {
      rows.push(['Tamanho do Bordado', o.embroiderySize]);
    }
    if (o.hoopSize) {
      rows.push(['Tamanho do Bastidor', o.hoopSize]);
    }
    if (o.fabricType) {
      rows.push(['Tipo de Tecido / Material', o.fabricType]);
    }
    if (o.fabricColor) {
      rows.push(['Cor do Tecido', o.fabricColor]);
    }
    if (o.stitchCount && o.stitchCount > 0) {
      rows.push(['Número de Pontos', `${o.stitchCount.toLocaleString('pt-BR')} pontos`]);
    }
    if (o.machineFileFormat) {
      rows.push(['Formato da Máquina', o.machineFileFormat]);
    }

    if (!isVirtual && matchedQuote) {
      if (matchedQuote.machineTimeMinutes && matchedQuote.machineTimeMinutes > 0) {
        rows.push(['Tempo Estimado de Máquina', `${matchedQuote.machineTimeMinutes} minutos`]);
      }
      if (matchedQuote.machineCost && matchedQuote.machineCost > 0) {
        rows.push(['Custo Est. de Máquina', `R$ ${matchedQuote.machineCost.toFixed(2)}`]);
      }
      if (matchedQuote.laborCost && matchedQuote.laborCost > 0) {
        rows.push(['Custo Mão de Obra', `R$ ${matchedQuote.laborCost.toFixed(2)}`]);
      }
      if (matchedQuote.quoteMaterials && matchedQuote.quoteMaterials.length > 0) {
        const matFormatted = matchedQuote.quoteMaterials
          .map((m) => `• ${m.name}: ${m.quantity} ${m.unit} x R$ ${m.pricePerUnit.toFixed(2)} = R$ ${m.totalCost.toFixed(2)}`)
          .join('\n');
        rows.push(['Insumos e Materiais Utilizados', matFormatted]);
      }
    }

    rows.push([
      'VALOR TOTAL DA OS',
      `R$ ${o.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    ]);
    rows.push([
      'VALOR PAGO',
      `R$ ${o.paidValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    ]);
    rows.push([
      'SALDO RESTANTE',
      `R$ ${Math.max(0, o.totalValue - o.paidValue).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    ]);

    const payload: ExportDataPayload = {
      title: `Ordem de Serviço ${o.id}`,
      subtitle: `Cliente: ${o.clientName} | Entrada: ${o.creationDate}`,
      headers: ['Especificação / Detalhe', 'Informação / Valor'],
      rows,
      imageUrl: o.imageUrl || matchedQuote?.matrixUrl || undefined,
      totals: [
        {
          label: 'Valor Total da OS',
          value: `R$ ${o.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        }
      ]
    };

    setSelectedOrderForExport(payload);
  };

  const totalFilteredValue = filteredOrders.reduce((acc, o) => acc + o.totalValue, 0);

  const ordersExportPayload: ExportDataPayload = {
    title: 'Relatório de Ordens de Serviço (OS)',
    subtitle: 'Ateliê de Bordados - Controle Operacional',
    activeFiltersSummary: [
      searchQuery ? `Busca: "${searchQuery}"` : null,
      activeFilter ? `Aba: ${activeFilter}` : null,
      selectedClientFilter !== 'todos' ? `Cliente: ${selectedClientFilter}` : null
    ].filter(Boolean).join(' | ') || 'Nenhum filtro ativo (Todas as OS)',
    headers: ['OS #', 'Cliente', 'Tipo de Produto', 'Data Entrada', 'Data Entrega', 'Valor Total (R$)', 'Sinal (50%)', 'Status', 'Tecido', 'Descrição'],
    rows: filteredOrders.map(o => {
      const matchedQuote = quotes?.find(q => q.id === o.quoteId || (o.quoteId && q.id === o.quoteId.replace('OS ', '')));
      const effectiveType = o.productType || matchedQuote?.productType || (matchedQuote?.machineTimeMinutes || (matchedQuote?.quoteMaterials && matchedQuote.quoteMaterials.length > 0) ? 'fisico' : 'virtual');
      const typeLabel = effectiveType === 'virtual' ? 'Produto Virtual' : 'Produto Físico';
      return [
        o.id,
        o.clientName,
        typeLabel,
        o.creationDate || '-',
        o.deliveryDate || '-',
        `R$ ${o.totalValue.toFixed(2)}`,
        `R$ ${(o.totalValue * 0.5).toFixed(2)}`,
        o.status,
        `${o.fabricType || 'Padrão'} (${o.fabricColor || ''})`,
        o.description
      ];
    }),
    totals: [
      { label: 'Total de OS Filtradas', value: `${filteredOrders.length}` },
      { label: 'Valor Total Bruto', value: `R$ ${totalFilteredValue.toFixed(2)}` }
    ]
  };

  const handleCreateNewOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName) return;

    let finalCustomId: string | undefined = undefined;
    if (customOsNumber.trim()) {
      let formatted = customOsNumber.trim();
      if (!formatted.startsWith('OS #') && !formatted.startsWith('#')) {
        formatted = `OS #${formatted}`;
      } else if (formatted.startsWith('#')) {
        formatted = `OS ${formatted}`;
      }
      finalCustomId = formatted;
    }

    onAddOrder({
      id: finalCustomId,
      clientName: newClientName,
      clientId: 'cli-custom',
      productType: newProductType,
      status: 'Em Andamento',
      creationDate: new Date().toLocaleDateString('pt-BR'),
      deliveryDate: formatInputDateToPtBr(newDeliveryDate),
      totalValue: Number(newTotalValue) || 350,
      paidValue: 0,
      isSinglePayment: false,
      description: newDescription || 'Bordado de logomarca em uniforme',
      imageUrl: newImageUrl || undefined,
      embroiderySize: newEmbroiderySize,
      hoopSize: newHoopSize,
      fabricType: newFabricType,
      fabricColor: newFabricColor,
      stitchCount: Number(newStitchCount) || undefined,
      matrixFileName: newMatrixFileName || undefined,
      notes: newNotes || undefined,
      steps: [
        { title: 'Enviada para aprovação', date: new Date().toLocaleDateString('pt-BR'), completed: true, type: 'approval' },
        { title: 'Pagamento 1', date: 'Pendente', completed: false, type: 'payment1' },
        { title: 'Pagamento 2', date: 'Pendente', completed: false, type: 'payment2' },
        { title: 'Envio definitivo', date: 'Pendente', completed: false, type: 'shipping' }
      ]
    });

    // Reset Form
    setCustomOsNumber('');
    setNewClientName('');
    setNewDescription('');
    setNewTotalValue(350);
    setNewImageUrl('');
    setNewNotes('');
    setShowNewOrderModal(false);
  };

  const getStatusBadgeStyle = (status: OrderStatus) => {
    switch (status) {
      case 'Em Andamento':
        return 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 backdrop-blur-md shadow-[0_0_10px_rgba(34,211,238,0.2)]';
      case 'Aguardando':
        return 'bg-amber-500/20 text-amber-300 border border-amber-400/30 backdrop-blur-md';
      case 'Concluído':
        return 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 backdrop-blur-md shadow-[0_0_10px_rgba(52,211,153,0.2)]';
      default:
        return 'bg-white/10 text-slate-400 border border-white/10';
    }
  };

  // Synchronize modal state if updated
  const currentModalOrder = selectedOrderDetails
    ? orders.find(o => o.id === selectedOrderDetails.id) || selectedOrderDetails
    : null;

  const modalQuote = currentModalOrder
    ? quotes?.find(q => q.id === currentModalOrder.quoteId || (currentModalOrder.quoteId && q.id === currentModalOrder.quoteId.replace('OS ', '')))
    : null;

  const modalImage = currentModalOrder?.imageUrl || modalQuote?.matrixUrl;

  const modalClient = currentModalOrder
    ? clients?.find(c => c.id === currentModalOrder.clientId || c.name.toLowerCase() === currentModalOrder.clientName.toLowerCase())
    : null;

  const modalDeliveryMethods = currentModalOrder?.matrixDeliveryPreferences?.length
    ? currentModalOrder.matrixDeliveryPreferences.map(p => p === 'Outro' && currentModalOrder.matrixDeliveryOther ? `Outro (${currentModalOrder.matrixDeliveryOther})` : p)
    : modalClient?.matrixDeliveryPreferences?.length
      ? modalClient.matrixDeliveryPreferences.map(p => p === 'Outro' && modalClient.matrixDeliveryOther ? `Outro (${modalClient.matrixDeliveryOther})` : p)
      : [];

  const modalMachineFormat = currentModalOrder?.machineFileFormat
    || (modalClient?.embroideryMachines && modalClient.embroideryMachines.length > 0
        ? modalClient.embroideryMachines.map(m => m.fileFormat).filter(Boolean).join(', ')
        : undefined);

  return (
    <div className="space-y-5 pb-20">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Ordens de Serviço (OS)</h2>
          <p className="text-xs text-slate-300">Acompanhe etapas, fotos do bordado e envio definitivo</p>
        </div>
        <button
          onClick={() => setShowNewOrderModal(true)}
          className="px-3.5 py-2 bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 text-xs font-extrabold rounded-xl hover:brightness-110 transition shadow-lg shadow-cyan-500/20 border border-cyan-300/40 flex items-center gap-1"
        >
          <Plus className="w-4 h-4 text-slate-950" /> Nova OS
        </button>
      </div>

      {/* Dynamic Filter & Export Toolbar */}
      <DataFilterExportToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Buscar por OS #, cliente, matriz, observação ou tecido..."
        filterOptions={[
          {
            key: 'client',
            label: 'Filtrar por Cliente',
            value: selectedClientFilter,
            options: [
              { label: 'Todos os Clientes', value: 'todos' },
              ...(clients || []).map(c => ({ label: c.name, value: c.id }))
            ],
            onChange: setSelectedClientFilter
          },
          {
            key: 'paymentStatus',
            label: 'Status do Pagamento',
            value: paymentStatusFilter,
            options: [
              { label: 'Todos os Pagamentos', value: 'todos' },
              { label: 'Totalmente Quitado (100%)', value: 'pago' },
              { label: 'Apenas Sinal Pago (50%)', value: 'sinal' },
              { label: 'Sem Pagamento (Pendente)', value: 'pendente' }
            ],
            onChange: setPaymentStatusFilter
          },
          {
            key: 'fabric',
            label: 'Tipo de Tecido / Material',
            value: fabricFilter,
            options: [
              { label: 'Todos os Tecidos', value: 'todos' },
              { label: 'Algodão', value: 'Algodão' },
              { label: 'Piquet (Polo)', value: 'Piquet' },
              { label: 'Jeans', value: 'Jeans' },
              { label: 'Sarja / Brim', value: 'Sarja' },
              { label: 'Moletom', value: 'Moletom' },
              { label: 'Sintético / Poliéster', value: 'Sintético' }
            ],
            onChange: setFabricFilter
          },
          {
            key: 'sortBy',
            label: 'Ordenar Resultados Por',
            value: sortByFilter,
            options: [
              { label: 'OS Mais Recente', value: 'recentes' },
              { label: 'OS Mais Antiga', value: 'antigas' },
              { label: 'Maior Valor Total', value: 'maior_valor' },
              { label: 'Menor Valor Total', value: 'menor_valor' }
            ],
            onChange: setSortByFilter
          }
        ]}
        startDate={startDateFilter}
        onStartDateChange={setStartDateFilter}
        endDate={endDateFilter}
        onEndDateChange={setEndDateFilter}
        onResetFilters={() => {
          setSearchQuery('');
          setSelectedClientFilter('todos');
          setPaymentStatusFilter('todos');
          setFabricFilter('todos');
          setSortByFilter('recentes');
          setStartDateFilter('');
          setEndDateFilter('');
          setActiveFilter('Todas Ativas');
        }}
        exportPayload={ordersExportPayload}
        totalFilteredCount={filteredOrders.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {(['Todas Ativas', 'Aguardando Pagamento', 'Em Andamento', 'Concluído'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition backdrop-blur-md ${
              activeFilter === filter
                ? 'bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 font-black shadow-md shadow-cyan-500/25 border border-cyan-300/40'
                : 'bg-white/10 border border-white/15 text-slate-300 hover:bg-white/20'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* OS Cards List */}
      <div className={
        filteredOrders.length === 0 ? 'space-y-4' :
        viewMode === 'large' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' :
        viewMode === 'small' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5' :
        viewMode === 'list' ? 'space-y-2' :
        'space-y-4'
      }>
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-3xl bg-white/5 border border-white/10 text-slate-400 col-span-full">
            <Info className="w-8 h-8 text-cyan-400 mx-auto mb-2 opacity-60" />
            <p className="text-sm font-semibold text-slate-300">Nenhuma Ordem de Serviço encontrada</p>
            <p className="text-xs text-slate-400 mt-1">Crie uma nova OS ou altere o filtro de pesquisa.</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            if (viewMode === 'small') {
              return (
                <div key={order.id} className="p-2.5 rounded-2xl border border-white/10 bg-white/5 space-y-2 backdrop-blur-md flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">{order.id}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                        order.status === 'Concluído' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-cyan-500/20 text-cyan-300'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-cyan-300 truncate">{order.clientName}</p>
                    <p className="text-[10px] text-slate-300 line-clamp-2">{order.description}</p>
                  </div>
                  <div className="border-t border-white/10 pt-1.5 flex items-center justify-between text-[11px]">
                    <span className="font-black text-cyan-300">R$ {order.totalValue.toFixed(0)}</span>
                    <button
                      onClick={() => {
                        setSelectedOrderDetails(order);
                        setIsEditingImage(false);
                      }}
                      className="p-1 rounded bg-white/5 text-slate-200 hover:text-white"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            }

            if (viewMode === 'list') {
              return (
                <div key={order.id} className="p-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-black text-xs text-white px-2 py-1 rounded bg-white/10">{order.id}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-cyan-200 truncate">{order.clientName}</span>
                        <span className="text-[10px] text-slate-400">({order.creationDate})</span>
                      </div>
                      <p className="text-xs text-slate-300 truncate">{order.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-between sm:justify-end shrink-0">
                    <span className="text-xs font-black text-cyan-300">
                      R$ {order.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      order.status === 'Concluído' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-cyan-500/20 text-cyan-300'
                    }`}>
                      {order.status}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedOrderDetails(order);
                        setIsEditingImage(false);
                      }}
                      className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-xs font-bold text-cyan-300 rounded-xl flex items-center gap-1"
                    >
                      Detalhes
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <OrderCard
                key={order.id}
                order={order}
                clients={clients}
                quotes={quotes}
                onToggleSinglePayment={onToggleSinglePayment}
                onConfirmPayment={onConfirmPayment}
                onUndoPayment={onUndoPayment}
                onConfirmShipping={onConfirmShipping}
                onUndoShipping={onUndoShipping}
                onSelectDetails={(ord) => {
                  setSelectedOrderDetails(ord);
                  setIsEditingImage(false);
                }}
                getStatusBadgeStyle={getStatusBadgeStyle}
                onRequestDeleteOrder={(ord) => setOrderToDelete(ord)}
                onExportOrder={(ord) => handleExportOrder(ord)}
                onUpdateOrderDetails={onUpdateOrderDetails}
              />
            );
          })
        )}
      </div>


      {/* Comprehensive Details Modal */}
      {currentModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900/95 border border-white/20 backdrop-blur-2xl rounded-3xl max-w-lg w-full my-auto p-5 space-y-5 shadow-2xl text-white relative">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  {isEditingModalId ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={modalIdInput}
                        onChange={(e) => setModalIdInput(e.target.value)}
                        className="bg-slate-800 text-cyan-200 font-extrabold text-base px-2 py-1 rounded-lg border border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-300 w-36"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveModalId();
                          if (e.key === 'Escape') setIsEditingModalId(false);
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleSaveModalId}
                        className="p-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition shrink-0"
                        title="Salvar número da OS"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingModalId(false)}
                        className="p-1 rounded-md bg-white/10 text-slate-300 border border-white/10 hover:bg-white/20 transition shrink-0"
                        title="Cancelar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xl font-extrabold text-white tracking-tight">{currentModalOrder.id}</h3>
                      {onUpdateOrderDetails && (
                        <button
                          type="button"
                          onClick={() => {
                            setModalIdInput(currentModalOrder.id);
                            setIsEditingModalId(true);
                          }}
                          className="p-1 text-slate-400 hover:text-cyan-300 hover:bg-cyan-400/10 rounded-md transition"
                          title="Editar número da OS"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusBadgeStyle(currentModalOrder.status)}`}>
                    {currentModalOrder.status}
                  </span>
                  {currentModalOrder.steps.find(s => s.type === 'shipping')?.completed || currentModalOrder.status === 'Concluído' ? (
                    <span className="text-xs text-emerald-300 font-bold flex items-center gap-1 bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Data de Entrega: <strong className="text-white">{currentModalOrder.actualDeliveryDate || currentModalOrder.steps.find(s => s.type === 'shipping')?.date || currentModalOrder.deliveryDate}</strong>
                    </span>
                  ) : (
                    <span className="text-xs text-cyan-200 font-medium flex items-center gap-1 bg-cyan-400/10 px-2 py-0.5 rounded-lg border border-cyan-400/20">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                      Previsão de Entrega: <strong className="text-white font-bold">{currentModalOrder.deliveryDate}</strong>
                    </span>
                  )}
                </div>
                <div className="space-y-1 mt-0.5">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-cyan-300 font-semibold">
                      Cliente: <span className="text-white font-bold">{currentModalOrder.clientName}</span>
                    </span>
                    {modalMachineFormat && (
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-purple-500/20 text-purple-200 border border-purple-400/30 flex items-center gap-1">
                        <FileCode2 className="w-3 h-3 text-purple-300" />
                        Formato: {modalMachineFormat}
                      </span>
                    )}
                  </div>
                  {modalDeliveryMethods.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 text-[11px]">
                      <span className="text-[10px] text-slate-300 font-medium flex items-center gap-1">
                        <Send className="w-3 h-3 text-cyan-400" /> Envio:
                      </span>
                      {modalDeliveryMethods.map((m, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 bg-cyan-400/15 text-cyan-300 border border-cyan-400/30 font-bold text-[10px] rounded-md">
                          {m}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleExportOrder(currentModalOrder)}
                  className="p-1.5 text-cyan-300 hover:text-cyan-100 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 rounded-xl transition flex items-center gap-1 text-xs font-bold px-2.5 cursor-pointer"
                  title="Enviar / Baixar OS"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" /> Enviar / Baixar
                </button>
                {onDeleteOrder && (
                  <button
                    type="button"
                    onClick={() => setOrderToDelete(currentModalOrder)}
                    className="p-1.5 text-rose-300 hover:text-rose-100 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 rounded-xl transition flex items-center gap-1 text-xs font-bold px-2.5 cursor-pointer"
                    title="Excluir esta Ordem de Serviço"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Excluir OS
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedOrderDetails(null);
                    setIsEditingImage(false);
                  }}
                  className="p-1.5 text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Imagem do Serviço / Matriz do Orçamento */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-cyan-400" /> Imagem do Serviço / Matriz
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingImage(!isEditingImage)}
                  className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 underline"
                >
                  {isEditingImage ? 'Cancelar Edição' : modalImage ? 'Alterar Imagem' : '+ Adicionar Imagem'}
                </button>
              </div>

              {isEditingImage ? (
                <div className="p-3 bg-slate-950/60 rounded-2xl border border-cyan-500/30">
                  <ImageUploadOrLink
                    label="Nova Imagem da Matriz / Produto"
                    value={modalImage || ''}
                    onChange={(url) => {
                      if (onUpdateOrderDetails) {
                        onUpdateOrderDetails(currentModalOrder.id, { imageUrl: url });
                      }
                      setIsEditingImage(false);
                    }}
                  />
                </div>
              ) : modalImage ? (
                <div className="relative group rounded-2xl overflow-hidden border border-white/20 bg-slate-950/80 shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={modalImage}
                    alt={currentModalOrder.id}
                    className="w-full h-48 object-cover group-hover:scale-105 transition duration-500 cursor-pointer"
                    onClick={() => setShowImageZoom(modalImage)}
                  />
                  <div className="absolute top-2 left-2 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-bold text-cyan-300 border border-white/10 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-cyan-400" /> Matriz do Orçamento
                  </div>
                  <button
                    onClick={() => setShowImageZoom(modalImage)}
                    className="absolute bottom-2 right-2 px-2.5 py-1 bg-black/70 hover:bg-black/90 backdrop-blur-md rounded-lg text-xs font-semibold text-white border border-white/10 flex items-center gap-1 transition"
                  >
                    <ZoomIn className="w-3.5 h-3.5" /> Ampliar
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-white/5 rounded-2xl border border-dashed border-white/20 text-center space-y-1">
                  <ImageIcon className="w-8 h-8 text-slate-400 mx-auto opacity-50" />
                  <p className="text-xs font-medium text-slate-300">Nenhuma imagem da matriz anexada</p>
                  <button
                    type="button"
                    onClick={() => setIsEditingImage(true)}
                    className="text-xs font-bold text-cyan-300 hover:underline pt-1 block mx-auto"
                  >
                    Clique aqui para incluir imagem
                  </button>
                </div>
              )}
            </div>

            {/* Ficha Técnica e Detalhes do Produto */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                <FileCode2 className="w-4 h-4 text-cyan-400" /> Especificações Técnicas
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Tamanho do Bordado</span>
                  <span className="font-extrabold text-white">{currentModalOrder.embroiderySize || '10x10cm'}</span>
                </div>
                <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Bastidor Recomendado</span>
                  <span className="font-extrabold text-white">{currentModalOrder.hoopSize || '13x18cm'}</span>
                </div>
                <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Tecido & Cor</span>
                  <span className="font-extrabold text-white">{currentModalOrder.fabricType || 'Algodão'} ({currentModalOrder.fabricColor || 'Branco'})</span>
                </div>
                <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Contagem de Pontos</span>
                  <span className="font-extrabold text-cyan-300">{currentModalOrder.stitchCount ? currentModalOrder.stitchCount.toLocaleString('pt-BR') : '12.000'} pts</span>
                </div>
                <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Formato da Máquina</span>
                  <span className="font-extrabold text-purple-200 flex items-center gap-1 mt-0.5">
                    <FileCode2 className="w-3.5 h-3.5 text-purple-300" />
                    {modalMachineFormat || 'Não especificado'}
                  </span>
                </div>
                <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Envio da Matriz</span>
                  <span className="font-extrabold text-cyan-300 flex items-center gap-1 mt-0.5">
                    <Send className="w-3.5 h-3.5 text-cyan-400" />
                    {modalDeliveryMethods.length > 0 ? modalDeliveryMethods.join(', ') : 'Não especificado'}
                  </span>
                </div>
              </div>

              {currentModalOrder.matrixFileName && (
                <div className="p-2.5 bg-slate-950/40 rounded-xl border border-white/10 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="text-slate-300 font-medium">Arquivo da Matriz:</span>
                  </div>
                  <span className="font-mono font-bold text-cyan-200">{currentModalOrder.matrixFileName}</span>
                </div>
              )}

              <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-xs space-y-1">
                <span className="font-bold text-slate-300 block">Descrição do Serviço:</span>
                <p className="text-slate-200 leading-relaxed">{currentModalOrder.description}</p>
              </div>

              {currentModalOrder.notes && (
                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-400/20 text-xs space-y-1">
                  <span className="font-bold text-amber-300 block">Observações do Orçamento:</span>
                  <p className="text-amber-100">{currentModalOrder.notes}</p>
                </div>
              )}
            </div>

            {/* Resumo Financeiro & Envio Definitivo */}
            <div className="space-y-3 pt-2 border-t border-white/10 text-xs">
              <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-cyan-400" /> Resumo Financeiro & Envio
              </span>

              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 bg-white/5 rounded-xl border border-white/10 text-center">
                  <span className="text-[10px] text-slate-400 block">Valor Total</span>
                  <span className="font-extrabold text-cyan-300 text-xs">R$ {currentModalOrder.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="p-2 bg-white/5 rounded-xl border border-white/10 text-center">
                  <span className="text-[10px] text-slate-400 block">Valor Pago</span>
                  <span className="font-extrabold text-emerald-300 text-xs">R$ {currentModalOrder.paidValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="p-2 bg-white/5 rounded-xl border border-white/10 text-center">
                  <span className="text-[10px] text-slate-400 block">Saldo Restante</span>
                  <span className="font-extrabold text-rose-300 text-xs">
                    R$ {Math.max(0, currentModalOrder.totalValue - currentModalOrder.paidValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Shipping Action Button inside Modal */}
              <div className="p-3 bg-slate-950/50 rounded-2xl border border-pink-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-pink-400" />
                    <span className="font-bold text-pink-200">Envio Definitivo do Serviço</span>
                  </div>
                  <span className="text-[11px] text-slate-300 font-semibold">
                    {currentModalOrder.steps.find(s => s.type === 'shipping')?.completed ? 'Enviado' : 'Pendente'}
                  </span>
                </div>

                {currentModalOrder.steps.find(s => s.type === 'shipping')?.completed || currentModalOrder.status === 'Concluído' ? (
                  <div className="flex items-center justify-between text-xs p-2 bg-emerald-500/20 rounded-xl border border-emerald-400/30">
                    <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Produto Enviado & OS Concluída
                    </span>
                    <button
                      onClick={() => onUndoShipping(currentModalOrder.id)}
                      className="text-[10px] font-semibold text-rose-300 hover:underline"
                    >
                      Desfazer Envio
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      onConfirmShipping(currentModalOrder.id);
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:brightness-110 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-pink-500/25 border border-pink-400/40 transition flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <Truck className="w-4 h-4 stroke-[2.5]" /> Confirmar Envio Definitivo e Concluir OS
                  </button>
                )}
              </div>

              {/* Status Selector */}
              <div className="pt-2 border-t border-white/10">
                <p className="font-bold text-white mb-2">Alterar Status Manual da OS:</p>
                <div className="flex flex-wrap gap-2">
                  {(['Aguardando', 'Em Andamento', 'Concluído', 'Cancelado'] as OrderStatus[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => onUpdateStatus(currentModalOrder.id, st)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition backdrop-blur-md ${
                        currentModalOrder.status === st
                          ? 'bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 shadow-md'
                          : 'bg-white/10 text-slate-300 hover:bg-white/20 border border-white/15'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Close Button */}
            <button
              onClick={() => {
                setSelectedOrderDetails(null);
                setIsEditingImage(false);
              }}
              className="w-full py-2.5 bg-white/10 hover:bg-white/20 border border-white/15 font-bold text-xs text-slate-200 rounded-xl transition mt-2 backdrop-blur-md"
            >
              Fechar Detalhes
            </button>
          </div>
        </div>
      )}

      {/* Image Lightbox / Zoom Modal */}
      {showImageZoom && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center justify-center">
            <button
              onClick={() => setShowImageZoom(null)}
              className="absolute -top-12 right-0 text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition"
            >
              <X className="w-6 h-6" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={showImageZoom}
              alt="Matriz Ampliada"
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/20"
            />
            <p className="text-xs text-slate-300 mt-3 font-semibold">Visualização Detalhada da Matriz do Bordado</p>
          </div>
        </div>
      )}

      {/* New Order Modal */}
      {showNewOrderModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900/95 border border-white/20 backdrop-blur-2xl rounded-3xl max-w-md w-full my-auto p-5 space-y-4 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold text-white">Criar Nova Ordem de Serviço</h3>
              <button
                onClick={() => setShowNewOrderModal(false)}
                className="p-1 text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewOrder} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Número da OS</span>
                  <span className="text-[10px] text-cyan-300 font-normal">Deixe em branco para automático</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: OS #26050 (ou deixe em branco para sequencial)"
                  value={customOsNumber}
                  onChange={(e) => setCustomOsNumber(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-white/20 bg-white/10 text-cyan-200 font-extrabold placeholder-slate-400 backdrop-blur-md focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Tipo de Produto */}
              <div>
                <label className="block font-bold text-slate-300 mb-1">Tipo de Produto</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewProductType('virtual')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                      newProductType === 'virtual'
                        ? 'bg-purple-500/20 border-purple-400 text-purple-200'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" /> Produto Virtual (Matriz)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewProductType('fisico')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                      newProductType === 'fisico'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <Shirt className="w-4 h-4" /> Produto Físico (Bordado)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Nome do Cliente / Empresa *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Confecções Silva"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 backdrop-blur-md focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Descrição do Serviço *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ex: 50 bordados em polos com linha dourada"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 backdrop-blur-md focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Upload Image Section */}
              <div>
                <ImageUploadOrLink
                  label="Imagem do Serviço / Matriz de Bordado"
                  value={newImageUrl}
                  onChange={(url) => setNewImageUrl(url)}
                />
              </div>

              {/* Tech Specs */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Tamanho Bordado</label>
                  <input
                    type="text"
                    placeholder="10x10cm"
                    value={newEmbroiderySize}
                    onChange={(e) => setNewEmbroiderySize(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Bastidor</label>
                  <input
                    type="text"
                    placeholder="13x18cm"
                    value={newHoopSize}
                    onChange={(e) => setNewHoopSize(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Tipo de Tecido</label>
                  <input
                    type="text"
                    placeholder="Algodão / Piquet"
                    value={newFabricType}
                    onChange={(e) => setNewFabricType(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Cor do Tecido</label>
                  <input
                    type="text"
                    placeholder="Branco / Azul"
                    value={newFabricColor}
                    onChange={(e) => setNewFabricColor(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Valor Total (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTotalValue}
                    onChange={(e) => setNewTotalValue(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-white/20 bg-white/10 text-cyan-300 font-extrabold placeholder-slate-400 focus:outline-none focus:border-cyan-400 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Previsão Entrega *
                  </label>
                  <input
                    type="date"
                    required
                    value={newDeliveryDate}
                    onChange={(e) => setNewDeliveryDate(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-white/20 bg-slate-800 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewOrderModal(false)}
                  className="flex-1 py-2.5 border border-white/20 bg-white/10 hover:bg-white/20 font-semibold text-xs text-slate-300 rounded-xl transition backdrop-blur-md"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-cyan-500/25 border border-cyan-300/40 hover:brightness-110 active:scale-95 transition"
                >
                  Salvar OS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deleting Order */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-white">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-500/20 border border-rose-500/30 rounded-2xl text-rose-400">
                <Trash2 className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Excluir Ordem de Serviço?</h4>
                <p className="text-xs text-slate-400">{orderToDelete.id}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Ao excluir esta OS, o orçamento correspondente voltará ao status <strong className="text-amber-300">Pendente</strong> na aba Orçamentos e o botão de aprovar ficará disponível novamente.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 border border-white/15 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteOrder) {
                    onDeleteOrder(orderToDelete.id);
                  }
                  if (selectedOrderDetails?.id === orderToDelete.id) {
                    setSelectedOrderDetails(null);
                  }
                  setOrderToDelete(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/30 transition cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Data Modal for single OS */}
      {selectedOrderForExport && (
        <ExportDataModal
          isOpen={!!selectedOrderForExport}
          onClose={() => setSelectedOrderForExport(null)}
          payload={selectedOrderForExport}
        />
      )}
    </div>
  );
};
