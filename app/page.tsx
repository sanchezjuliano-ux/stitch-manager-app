'use client';

import React, { useState, useEffect } from 'react';
import { ViewTab, Client, Quote, ServiceOrder, InventoryItem, Transaction, OrderStatus, ExecutedService } from '@/lib/types';
import { 
  INITIAL_CLIENTS, 
  INITIAL_QUOTES, 
  INITIAL_ORDERS, 
  INITIAL_INVENTORY, 
  INITIAL_TRANSACTIONS,
  INITIAL_SERVICES
} from '@/lib/mockData';
import { 
  subscribeClients, 
  subscribeOrders, 
  saveClientToFirestore, 
  deleteClientFromFirestore, 
  saveOrderToFirestore, 
  deleteOrderFromFirestore, 
  seedInitialDataIfEmpty 
} from '@/lib/firebaseService';

import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { NavigationDrawer } from '@/components/NavigationDrawer';

import { QuotesView } from '@/components/quotes/QuotesView';
import { OrdersView } from '@/components/orders/OrdersView';
import { ClientsView } from '@/components/clients/ClientsView';
import { InventoryView } from '@/components/inventory/InventoryView';
import { FinanceView } from '@/components/finance/FinanceView';
import { AnalyticsView } from '@/components/analytics/AnalyticsView';
import { ServicesView } from '@/components/services/ServicesView';

export default function Home() {
  const [currentTab, setCurrentTab] = useState<ViewTab>('clients');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Persistent States initialized cleanly for SSR matching
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [quotes, setQuotes] = useState<Quote[]>(INITIAL_QUOTES);
  const [orders, setOrders] = useState<ServiceOrder[]>(INITIAL_ORDERS);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [services, setServices] = useState<ExecutedService[]>(INITIAL_SERVICES);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Subscribe to Firestore onSnapshot for Clients and Orders & seed if empty
  useEffect(() => {
    seedInitialDataIfEmpty(INITIAL_CLIENTS, INITIAL_ORDERS);

    const unsubClients = subscribeClients((firestoreClients) => {
      setClients(firestoreClients);
    });

    const unsubOrders = subscribeOrders((firestoreOrders) => {
      setOrders(firestoreOrders);
    });

    return () => {
      unsubClients();
      unsubOrders();
    };
  }, []);

  // 2. Load other states (quotes, inventory, transactions, services) from localStorage after mount
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const savedQuotes = localStorage.getItem('sm_quotes');
        if (savedQuotes) setQuotes(JSON.parse(savedQuotes));

        const savedInventory = localStorage.getItem('sm_inventory');
        if (savedInventory) setInventory(JSON.parse(savedInventory));

        const savedTransactions = localStorage.getItem('sm_transactions');
        if (savedTransactions) setTransactions(JSON.parse(savedTransactions));

        const savedServices = localStorage.getItem('sm_services');
        if (savedServices) setServices(JSON.parse(savedServices));
      } catch (e) {
        console.error('Error loading localStorage:', e);
      } finally {
        setIsLoaded(true);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Safe save to localStorage
  const safeSaveItem = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn(`localStorage quota exceeded for ${key}, stripping large base64 data URLs:`, e);
      try {
        // Strip base64 data URLs longer than 50KB to save space if quota is exceeded
        const cleaned = JSON.parse(JSON.stringify(data, (k, v) => {
          if (typeof v === 'string' && v.startsWith('data:') && v.length > 50000) {
            return 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=600&auto=format&fit=crop&q=80';
          }
          return v;
        }));
        localStorage.setItem(key, JSON.stringify(cleaned));
      } catch (innerErr) {
        console.error(`Failed to save ${key} to localStorage even after cleaning:`, innerErr);
      }
    }
  };

  // Save remaining states to localStorage when state changes after initial load
  useEffect(() => {
    if (!isLoaded) return;
    safeSaveItem('sm_quotes', quotes);
    safeSaveItem('sm_inventory', inventory);
    safeSaveItem('sm_transactions', transactions);
    safeSaveItem('sm_services', services);
  }, [quotes, inventory, transactions, services, isLoaded]);

  // Reset to initial mock data
  const handleResetData = () => {
    // Reset local states
    setQuotes(INITIAL_QUOTES);
    setInventory(INITIAL_INVENTORY);
    setTransactions(INITIAL_TRANSACTIONS);
    setServices(INITIAL_SERVICES);
    localStorage.clear();

    // Re-seed Firestore with initial clients & orders
    INITIAL_CLIENTS.forEach(client => saveClientToFirestore(client));
    INITIAL_ORDERS.forEach(order => saveOrderToFirestore(order));
  };

  // Client Handlers (directly synced with Firestore)
  const handleAddClient = (newClient: Omit<Client, 'id' | 'avatarInitials' | 'activeOrdersCount'>) => {
    const initials = newClient.name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    const created: Client = {
      ...newClient,
      id: `cli-${Date.now()}`,
      avatarInitials: initials || 'CL',
      activeOrdersCount: 0,
      avatarBgColor: 'bg-[#050077] text-white'
    };

    saveClientToFirestore(created);
  };

  const handleUpdateClient = (updatedClient: Client) => {
    saveClientToFirestore(updatedClient);
  };

  const handleDeleteClient = (clientId: string) => {
    deleteClientFromFirestore(clientId);
  };

  // Quote Handlers
  const handleAddQuote = (newQuote: Omit<Quote, 'id'>) => {
    const nextNum = quotes.length + 106;
    const created: Quote = {
      ...newQuote,
      id: `#${nextNum}`
    };
    setQuotes([created, ...quotes]);

    // Automatically deduct materials from inventory stock when a physical product quote with materials is added
    if (created.quoteMaterials && created.quoteMaterials.length > 0) {
      setInventory(prevInv => prevInv.map(item => {
        const matchingMaterials = created.quoteMaterials?.filter(
          m => m.inventoryItemId === item.id || m.name.toLowerCase() === item.name.toLowerCase()
        );
        if (matchingMaterials && matchingMaterials.length > 0) {
          const totalDeductedUnits = matchingMaterials.reduce((acc, m) => {
            const fSize = m.fractionSize || item.fractionSize;
            if (m.isFractioned && fSize && fSize > 0) {
              return acc + (m.quantity / fSize);
            }
            return acc + m.quantity;
          }, 0);
          const newQty = Math.max(0, item.stockQuantity - totalDeductedUnits);
          const roundedQty = Number(newQty.toFixed(2));
          let newTag = item.tag;
          if (roundedQty <= 3) newTag = 'Estoque Baixo';
          else if (roundedQty > 15) newTag = 'Alta Rotação';
          return { ...item, stockQuantity: roundedQty, tag: newTag };
        }
        return item;
      }));
    }
  };

  const handleUpdateQuote = (updatedQuote: Quote) => {
    setQuotes(quotes.map(q => q.id === updatedQuote.id ? updatedQuote : q));
  };

  const handleUpdateQuoteStatus = (id: string, newStatus: 'Aprovado' | 'Pendente' | 'Recusado') => {
    setQuotes(quotes.map(q => q.id === id ? { ...q, status: newStatus } : q));
  };

  const handleDeleteQuote = (id: string) => {
    setQuotes(quotes.filter(q => q.id !== id));
  };

  const handleDisapproveQuote = (quoteId: string) => {
    // 1. Find orders associated with this quote
    const associatedOrders = orders.filter(o => 
      o.quoteId === quoteId || 
      o.quoteId === quoteId.replace('#', '') || 
      (o.quoteId && quoteId.includes(o.quoteId))
    );

    // 2. Delete those orders
    if (associatedOrders.length > 0) {
      associatedOrders.forEach(o => handleDeleteOrder(o.id));
    } else {
      setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, status: 'Pendente' } : q));
    }
  };

  const generateNextOsId = (existingOrders: ServiceOrder[]): string => {
    const currentYearStr = new Date().getFullYear().toString();
    const yearPrefix = currentYearStr.slice(-2);

    let maxSeq = 0;

    existingOrders.forEach(o => {
      const digits = o.id.replace(/\D/g, '');
      if (digits.startsWith(yearPrefix)) {
        const seqPart = digits.slice(yearPrefix.length);
        const seqNum = parseInt(seqPart, 10);
        if (!isNaN(seqNum) && seqNum > maxSeq) {
          maxSeq = seqNum;
        }
      } else if (digits.length >= 3) {
        const seqNum = parseInt(digits, 10);
        if (!isNaN(seqNum) && seqNum > maxSeq) {
          maxSeq = seqNum;
        }
      }
    });

    const nextSeq = maxSeq + 1;
    const paddedSeq = String(nextSeq).padStart(3, '0');
    return `OS #${yearPrefix}${paddedSeq}`;
  };

  const handleConvertQuoteToOrder = (quote: Quote) => {
    setQuotes(quotes.map(q => q.id === quote.id ? { ...q, status: 'Aprovado' } : q));

    const newOsId = generateNextOsId(orders);
    const newOrder: ServiceOrder = {
      id: newOsId,
      clientId: quote.clientId,
      clientName: quote.clientName,
      quoteId: quote.id,
      productType: quote.productType || (quote.machineTimeMinutes || (quote.quoteMaterials && quote.quoteMaterials.length > 0) ? 'fisico' : 'virtual'),
      status: 'Em Andamento',
      creationDate: new Date().toLocaleDateString('pt-BR'),
      deliveryDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toLocaleDateString('pt-BR'),
      totalValue: quote.estimatedValue,
      paidValue: 0,
      isSinglePayment: false,
      description: quote.description,
      imageUrl: quote.matrixUrl,
      embroiderySize: quote.embroiderySize,
      hoopSize: quote.hoopSize,
      fabricType: quote.fabricType,
      fabricColor: quote.fabricColor,
      stitchCount: quote.stitchCount,
      matrixFileName: quote.matrixFileName,
      steps: [
        { title: 'Enviada para aprovação', date: new Date().toLocaleDateString('pt-BR'), completed: true, type: 'approval' },
        { title: 'Pagamento 1', date: 'Pendente', completed: false, type: 'payment1' },
        { title: 'Pagamento 2', date: 'Pendente', completed: false, type: 'payment2' },
        { title: 'Envio definitivo', date: 'Pendente', completed: false, type: 'shipping' }
      ]
    };

    saveOrderToFirestore(newOrder);
    setCurrentTab('orders');
  };

  // Order Handlers (directly synced with Firestore)
  const handleAddOrder = (newOrder: Omit<ServiceOrder, 'id'> & { id?: string }) => {
    const newOsId = newOrder.id || generateNextOsId(orders);
    const createdOrder: ServiceOrder = { ...newOrder, id: newOsId };
    saveOrderToFirestore(createdOrder);
  };

  const handleToggleStep = (orderId: string, stepIndex: number) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return;

    const updatedSteps = [...targetOrder.steps];
    if (updatedSteps[stepIndex]) {
      updatedSteps[stepIndex].completed = !updatedSteps[stepIndex].completed;
      updatedSteps[stepIndex].date = updatedSteps[stepIndex].completed ? new Date().toLocaleDateString('pt-BR') : 'Pendente';
    }

    const updatedOrder: ServiceOrder = { ...targetOrder, steps: updatedSteps };
    saveOrderToFirestore(updatedOrder);
  };

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return;
    saveOrderToFirestore({ ...targetOrder, status });
  };

  const handleDeleteOrder = (orderId: string) => {
    const targetOrder = orders.find(o => o.id === orderId);
    deleteOrderFromFirestore(orderId);

    // If order was linked to a quote, revert quote status back to 'Pendente'
    if (targetOrder?.quoteId) {
      setQuotes(prev => prev.map(q => 
        (q.id === targetOrder.quoteId || q.id === `#${targetOrder.quoteId}` || q.id.replace('#', '') === targetOrder.quoteId)
          ? { ...q, status: 'Pendente' }
          : q
      ));
    }

    // Remove all transactions from finance tab linked to this order
    if (targetOrder) {
      const cleanNum = targetOrder.id.replace('OS ', '').replace('#', '').trim();
      setTransactions(prev => prev.filter(t => {
        const isMatch =
          t.description.includes(targetOrder.id) ||
          (cleanNum.length > 2 && t.description.includes(cleanNum));
        return !isMatch;
      }));
    }
  };

  const handleToggleSinglePayment = (orderId: string) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return;
    saveOrderToFirestore({ ...targetOrder, isSinglePayment: !targetOrder.isSinglePayment });
  };

  const handleConfirmPayment = (
    orderId: string,
    paymentType: 'single_payment' | 'payment1' | 'payment2',
    amount: number
  ) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const targetStep = order.steps.find(step =>
      (paymentType === 'single_payment' && (step.type === 'single_payment' || step.type === 'payment1')) ||
      step.type === paymentType
    );
    if (targetStep && targetStep.completed) {
      return;
    }

    const todayStr = new Date().toLocaleDateString('pt-BR');
    const paymentLabel = paymentType === 'single_payment'
      ? 'Pagamento Único'
      : paymentType === 'payment1' ? 'Pagamento 1 (Sinal)' : 'Pagamento 2 (Final)';

    const updatedSteps = order.steps.map(step => {
      const isMatch = (paymentType === 'single_payment' && (step.type === 'single_payment' || step.type === 'payment1')) || step.type === paymentType;
      if (isMatch) {
        return {
          ...step,
          completed: true,
          date: todayStr,
          amount: amount
        };
      }
      return step;
    });

    const totalPaid = updatedSteps.reduce((acc, st) => {
      if (st.type?.includes('payment') && st.completed) {
        return acc + (st.amount || 0);
      }
      return acc;
    }, 0);

    const updatedOrder: ServiceOrder = {
      ...order,
      paidValue: totalPaid,
      steps: updatedSteps
    };

    saveOrderToFirestore(updatedOrder);

    handleAddTransaction({
      date: todayStr,
      description: `${paymentLabel} - ${order.id} (${order.clientName})`,
      type: 'entrada',
      amount: amount,
      category: paymentType === 'payment1' ? 'Sinal OS' : 'Pagamento OS'
    });
  };

  const handleUndoPayment = (
    orderId: string,
    paymentType: 'single_payment' | 'payment1' | 'payment2'
  ) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const updatedSteps = order.steps.map(step => {
      const isMatch = (paymentType === 'single_payment' && (step.type === 'single_payment' || step.type === 'payment1')) || step.type === paymentType;
      if (isMatch) {
        return {
          ...step,
          completed: false,
          date: 'Pendente',
          amount: undefined
        };
      }
      return step;
    });

    const totalPaid = updatedSteps.reduce((acc, st) => {
      if (st.type?.includes('payment') && st.completed) {
        return acc + (st.amount || 0);
      }
      return acc;
    }, 0);

    const updatedOrder: ServiceOrder = {
      ...order,
      paidValue: totalPaid,
      steps: updatedSteps
    };

    saveOrderToFirestore(updatedOrder);

    const cleanNum = order.id.replace('OS ', '').replace('#', '').trim();
    setTransactions(prev => prev.filter(t => {
      const isOrderMatch =
        t.description.includes(order.id) ||
        (cleanNum.length > 2 && t.description.includes(cleanNum));

      if (!isOrderMatch) return true;

      if (paymentType === 'payment1') {
        const isP1 =
          t.description.includes('Pagamento 1') ||
          t.description.includes('Sinal') ||
          t.category === 'Sinal OS' ||
          (!t.description.includes('Pagamento 2') && !t.description.includes('Final'));
        return !isP1;
      }

      if (paymentType === 'payment2') {
        const isP2 =
          t.description.includes('Pagamento 2') ||
          t.description.includes('Final');
        return !isP2;
      }

      if (paymentType === 'single_payment') {
        const isSingle =
          t.description.includes('Pagamento Único') ||
          t.description.includes('Pagamento 1') ||
          t.description.includes('Pagamento OS') ||
          t.category === 'Pagamento OS';
        return !isSingle;
      }

      return false;
    }));
  };

  const handleConfirmShipping = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const todayStr = new Date().toLocaleDateString('pt-BR');
    const updatedSteps = order.steps.map(step => {
      if (step.type === 'shipping') {
        return {
          ...step,
          completed: true,
          date: todayStr
        };
      }
      return step;
    });

    const updatedOrder: ServiceOrder = {
      ...order,
      status: 'Concluído',
      actualDeliveryDate: todayStr,
      steps: updatedSteps
    };

    saveOrderToFirestore(updatedOrder);
  };

  const handleUndoShipping = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const updatedSteps = order.steps.map(step => {
      if (step.type === 'shipping') {
        return {
          ...step,
          completed: false,
          date: 'Pendente'
        };
      }
      return step;
    });

    const updatedOrder: ServiceOrder = {
      ...order,
      status: 'Em Andamento',
      actualDeliveryDate: undefined,
      steps: updatedSteps
    };

    saveOrderToFirestore(updatedOrder);
  };

  const handleUpdateOrderDetails = (orderId: string, updatedFields: Partial<ServiceOrder>) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const updatedOrder: ServiceOrder = { ...order, ...updatedFields };

    if (updatedFields.id && updatedFields.id !== orderId) {
      deleteOrderFromFirestore(orderId);
      saveOrderToFirestore(updatedOrder);

      const oldId = orderId;
      const newId = updatedFields.id;
      const oldClean = oldId.replace('OS ', '').replace('#', '').trim();
      const newClean = newId.replace('OS ', '').replace('#', '').trim();

      setTransactions(prevTx => prevTx.map(t => {
        if (t.description.includes(oldId) || (oldClean.length >= 2 && t.description.includes(oldClean))) {
          return {
            ...t,
            description: t.description.replace(oldId, newId).replace(oldClean, newClean)
          };
        }
        return t;
      }));

      setQuotes(prevQuotes => prevQuotes.map(q => {
        if (q.id === oldId || q.id === oldClean) {
          return { ...q, id: newId };
        }
        return q;
      }));
    } else {
      saveOrderToFirestore(updatedOrder);
    }
  };

  // Inventory Handlers
  const handleAddInventoryItem = (newItem: Omit<InventoryItem, 'id'>) => {
    setInventory([{ ...newItem, id: `mat-${Date.now()}` }, ...inventory]);
  };

  const handleUpdateStock = (id: string, delta: number) => {
    setInventory(inventory.map(item => {
      if (item.id !== id) return item;
      const newQty = Math.max(0, item.stockQuantity + delta);
      let newTag = item.tag;
      if (newQty <= 3) newTag = 'Estoque Baixo';
      else if (newQty > 15) newTag = 'Alta Rotação';
      return { ...item, stockQuantity: newQty, tag: newTag };
    }));
  };

  const handleUpdateInventoryItem = (updatedItem: InventoryItem) => {
    setInventory(inventory.map(i => i.id === updatedItem.id ? updatedItem : i));
  };

  const handleDeleteInventoryItem = (id: string) => {
    setInventory(inventory.filter(i => i.id !== id));
  };

  // Finance Handlers
  const recalculateBalances = (txs: Transaction[]): Transaction[] => {
    const reversed = [...txs].reverse();
    let runningBalance = 0;
    const updatedReversed = reversed.map(t => {
      const change = t.type === 'entrada' ? t.amount : -t.amount;
      runningBalance += change;
      return { ...t, balanceAfter: runningBalance };
    });
    return updatedReversed.reverse();
  };

  const handleAddTransaction = (newTx: Omit<Transaction, 'id' | 'balanceAfter'>) => {
    const created: Transaction = {
      ...newTx,
      id: `tx-${Date.now()}`,
      balanceAfter: 0
    };

    setTransactions(prev => recalculateBalances([created, ...prev]));
  };

  const handleUpdateTransaction = (updatedTx: Transaction) => {
    setTransactions(prev => {
      const next = prev.map(t => t.id === updatedTx.id ? updatedTx : t);
      return recalculateBalances(next);
    });
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => {
      const next = prev.filter(t => t.id !== id);
      return recalculateBalances(next);
    });
  };

  // Executed Services Handlers
  const handleAddService = (newService: Omit<ExecutedService, 'id' | 'code'> & { code?: string }) => {
    const nextCodeNum = services.length + 1;
    const paddedCode = String(nextCodeNum).padStart(3, '0');
    const defaultCode = `SRV-${paddedCode}`;
    const created: ExecutedService = {
      ...newService,
      id: `srv-${Date.now()}`,
      code: newService.code && newService.code.trim() ? newService.code.trim().toUpperCase() : defaultCode
    };
    setServices([created, ...services]);
  };

  const handleUpdateService = (updatedService: ExecutedService) => {
    setServices(services.map(s => s.id === updatedService.id ? updatedService : s));
  };

  const handleDeleteService = (id: string) => {
    setServices(services.filter(s => s.id !== id));
  };

  const handleUseServiceInQuote = (service: ExecutedService) => {
    setServices(prev => prev.map(s => {
      if (s.id === service.id) {
        return {
          ...s,
          timesExecuted: (s.timesExecuted || 0) + 1,
          lastUsedDate: new Date().toLocaleDateString('pt-BR')
        };
      }
      return s;
    }));

    setCurrentTab('quotes');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 text-white font-sans antialiased selection:bg-cyan-400/30 relative overflow-x-hidden">
      {/* Frosted Background Light Orbs */}
      <div className="fixed -top-24 -left-24 w-96 h-96 bg-cyan-500/15 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="fixed top-1/3 -right-24 w-96 h-96 bg-purple-500/15 blur-[140px] rounded-full pointer-events-none z-0" />
      <div className="fixed -bottom-24 left-1/3 w-96 h-96 bg-pink-500/10 blur-[130px] rounded-full pointer-events-none z-0" />

      {/* Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onResetData={handleResetData}
      />

      {/* Main Container framed like a clean modern mobile/tablet view with Frosted Glass styling */}
      <div className="max-w-md mx-auto min-h-screen bg-white/5 backdrop-blur-2xl border-x border-white/10 flex flex-col shadow-2xl shadow-indigo-950/80 relative z-10">
        {/* Header */}
        <Header
          currentTab={currentTab}
          onOpenDrawer={() => setIsDrawerOpen(true)}
          onSelectTab={setCurrentTab}
        />

        {/* View Body */}
        <main className="flex-1 p-4 sm:p-5 overflow-y-auto">
          {currentTab === 'quotes' && (
            <QuotesView
              quotes={quotes}
              clients={clients}
              inventory={inventory}
              executedServices={services}
              onAddQuote={handleAddQuote}
              onUpdateQuote={handleUpdateQuote}
              onUpdateQuoteStatus={handleUpdateQuoteStatus}
              onDeleteQuote={handleDeleteQuote}
              onConvertToOrder={handleConvertQuoteToOrder}
              onDisapproveQuote={handleDisapproveQuote}
              onSaveServiceToCatalog={handleAddService}
            />
          )}

          {currentTab === 'services' && (
            <ServicesView
              services={services}
              onAddService={handleAddService}
              onUpdateService={handleUpdateService}
              onDeleteService={handleDeleteService}
            />
          )}

          {currentTab === 'orders' && (
            <OrdersView
              orders={orders}
              clients={clients}
              quotes={quotes}
              onAddOrder={handleAddOrder}
              onToggleStep={handleToggleStep}
              onUpdateStatus={handleUpdateOrderStatus}
              onToggleSinglePayment={handleToggleSinglePayment}
              onConfirmPayment={handleConfirmPayment}
              onUndoPayment={handleUndoPayment}
              onConfirmShipping={handleConfirmShipping}
              onUndoShipping={handleUndoShipping}
              onUpdateOrderDetails={handleUpdateOrderDetails}
              onDeleteOrder={handleDeleteOrder}
            />
          )}

          {currentTab === 'clients' && (
            <ClientsView
              clients={clients}
              onAddClient={handleAddClient}
              onUpdateClient={handleUpdateClient}
              onDeleteClient={handleDeleteClient}
            />
          )}

          {currentTab === 'inventory' && (
            <InventoryView
              items={inventory}
              onAddItem={handleAddInventoryItem}
              onUpdateStock={handleUpdateStock}
              onUpdateItem={handleUpdateInventoryItem}
              onDeleteItem={handleDeleteInventoryItem}
            />
          )}

          {currentTab === 'finance' && (
            <FinanceView
              transactions={transactions}
              onAddTransaction={handleAddTransaction}
              onUpdateTransaction={handleUpdateTransaction}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}

          {currentTab === 'analytics' && (
            <AnalyticsView
              quotes={quotes}
              transactions={transactions}
            />
          )}
        </main>

        {/* Bottom Navigation */}
        <BottomNav
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
        />
      </div>
    </div>
  );
}
