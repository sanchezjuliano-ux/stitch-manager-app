'use client';

import React, { useState } from 'react';
import { Client, EmbroideryMachine, DisplayViewMode } from '@/lib/types';
import { DataFilterExportToolbar } from '../common/DataFilterExportToolbar';
import { ExportDataPayload } from '@/lib/exportUtils';
import { 
  Search, 
  Filter, 
  Phone, 
  MessageSquare, 
  UserPlus, 
  Calendar, 
  Building2, 
  User, 
  Mail, 
  Instagram, 
  Facebook, 
  Check, 
  ChevronLeft,
  Bot,
  Plus,
  Trash2,
  Cpu,
  Edit,
  X,
  MapPin,
  AlertTriangle,
  ExternalLink,
  Send
} from 'lucide-react';

interface ClientsViewProps {
  clients: Client[];
  onAddClient: (newClient: Omit<Client, 'id' | 'avatarInitials' | 'activeOrdersCount'>) => void;
  onUpdateClient?: (updatedClient: Client) => void;
  onDeleteClient?: (clientId: string) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({ 
  clients, 
  onAddClient,
  onUpdateClient,
  onDeleteClient
}) => {
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<DisplayViewMode>('medium');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'Todos os Clientes' | 'Ativos Recentes' | 'Atacado'>('Todos os Clientes');
  const [categoryFilter, setCategoryFilter] = useState('todos');
  const [docTypeFilter, setDocTypeFilter] = useState('todos');
  const [activeOrdersFilter, setActiveOrdersFilter] = useState('todos');
  const [machineFilter, setMachineFilter] = useState('todos');
  const [sortByFilter, setSortByFilter] = useState('name_asc');

  // Form State - New Client
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('Brasil');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [docType, setDocType] = useState<'CPF' | 'CNPJ' | 'Outro'>('CPF');
  const [docNumber, setDocNumber] = useState('');
  const [category, setCategory] = useState<'Particular' | 'Empresa' | 'Atacado' | 'Escola'>('Particular');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [hasEmbroideryMachine, setHasEmbroideryMachine] = useState(false);
  const [embroideryMachines, setEmbroideryMachines] = useState<EmbroideryMachine[]>([
    { brand: '', model: '', hoops: '', fileFormat: '' }
  ]);
  const [matrixDeliveryPreferences, setMatrixDeliveryPreferences] = useState<string[]>(['Whatsapp']);
  const [matrixDeliveryOther, setMatrixDeliveryOther] = useState('');

  // Form State - Edit Client
  const [editName, setEditName] = useState('');
  const [editDocType, setEditDocType] = useState<'CPF' | 'CNPJ' | 'Outro'>('CPF');
  const [editDocNumber, setEditDocNumber] = useState('');
  const [editCategory, setEditCategory] = useState<'Particular' | 'Empresa' | 'Atacado' | 'Escola'>('Particular');
  const [editContactPerson, setEditContactPerson] = useState('');
  const [editBirthDate, setEditBirthDate] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editCountry, setEditCountry] = useState('Brasil');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editInstagram, setEditInstagram] = useState('');
  const [editFacebook, setEditFacebook] = useState('');
  const [editHasMachine, setEditHasMachine] = useState(false);
  const [editMachines, setEditMachines] = useState<EmbroideryMachine[]>([]);
  const [editMatrixDeliveryPreferences, setEditMatrixDeliveryPreferences] = useState<string[]>([]);
  const [editMatrixDeliveryOther, setEditMatrixDeliveryOther] = useState('');

  // Machine handlers for New Client
  const handleToggleMachine = (checked: boolean) => {
    setHasEmbroideryMachine(checked);
    if (checked && embroideryMachines.length === 0) {
      setEmbroideryMachines([{ brand: '', model: '', hoops: '', fileFormat: '' }]);
    }
  };

  const handleAddMachine = () => {
    setEmbroideryMachines([
      ...embroideryMachines,
      { brand: '', model: '', hoops: '', fileFormat: '' }
    ]);
  };

  const handleRemoveMachine = (index: number) => {
    const updated = embroideryMachines.filter((_, i) => i !== index);
    setEmbroideryMachines(updated);
    if (updated.length === 0) {
      setHasEmbroideryMachine(false);
    }
  };

  const handleMachineChange = (index: number, field: keyof EmbroideryMachine, value: string) => {
    const updated = [...embroideryMachines];
    updated[index] = { ...updated[index], [field]: value };
    setEmbroideryMachines(updated);
  };

  // Machine handlers for Edit Client
  const handleEditToggleMachine = (checked: boolean) => {
    setEditHasMachine(checked);
    if (checked && editMachines.length === 0) {
      setEditMachines([{ brand: '', model: '', hoops: '', fileFormat: '' }]);
    }
  };

  const handleEditAddMachine = () => {
    setEditMachines([
      ...editMachines,
      { brand: '', model: '', hoops: '', fileFormat: '' }
    ]);
  };

  const handleEditRemoveMachine = (index: number) => {
    const updated = editMachines.filter((_, i) => i !== index);
    setEditMachines(updated);
    if (updated.length === 0) {
      setEditHasMachine(false);
    }
  };

  const handleEditMachineChange = (index: number, field: keyof EmbroideryMachine, value: string) => {
    const updated = [...editMachines];
    updated[index] = { ...updated[index], [field]: value };
    setEditMachines(updated);
  };

  const filteredClients = clients
    .filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        c.name.toLowerCase().includes(q) ||
        c.documentNumber.includes(q) ||
        (c.contactPerson && c.contactPerson.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.cityState && c.cityState.toLowerCase().includes(q));

      const matchesCategory = categoryFilter === 'todos' || c.category === categoryFilter;
      const matchesDocType = docTypeFilter === 'todos' || c.documentType === docTypeFilter;
      
      const matchesActiveOrders =
        activeOrdersFilter === 'todos' ||
        (activeOrdersFilter === 'com_pedidos' && c.activeOrdersCount > 0) ||
        (activeOrdersFilter === 'sem_pedidos' && (!c.activeOrdersCount || c.activeOrdersCount === 0));

      const hasMachine = Boolean(c.embroideryMachines && c.embroideryMachines.length > 0);
      const matchesMachine =
        machineFilter === 'todos' ||
        (machineFilter === 'com_maquina' && hasMachine) ||
        (machineFilter === 'sem_maquina' && !hasMachine);

      if (!matchesSearch || !matchesCategory || !matchesDocType || !matchesActiveOrders || !matchesMachine) {
        return false;
      }

      if (activeTab === 'Ativos Recentes') return c.activeOrdersCount > 0;
      if (activeTab === 'Atacado') return c.category === 'Atacado';
      return true;
    })
    .sort((a, b) => {
      if (sortByFilter === 'name_asc') return a.name.localeCompare(b.name, 'pt-BR');
      if (sortByFilter === 'name_desc') return b.name.localeCompare(a.name, 'pt-BR');
      if (sortByFilter === 'orders_desc') return (b.activeOrdersCount || 0) - (a.activeOrdersCount || 0);
      return 0;
    });

  const clientsExportPayload: ExportDataPayload = {
    title: 'Relatório de Cadastros de Clientes',
    subtitle: 'Ateliê de Bordados - Base de Clientes',
    activeFiltersSummary: [
      searchQuery ? `Busca: "${searchQuery}"` : null,
      activeTab !== 'Todos os Clientes' ? `Aba: ${activeTab}` : null,
      categoryFilter !== 'todos' ? `Categoria: ${categoryFilter}` : null,
      docTypeFilter !== 'todos' ? `Tipo Doc: ${docTypeFilter}` : null
    ].filter(Boolean).join(' | ') || 'Todos os clientes',
    headers: ['Nome / Razão Social', 'Tipo Doc', 'Documento', 'Categoria', 'Contato / Responsável', 'Telefone', 'E-mail', 'Cidade/Estado', 'Pedidos Ativos'],
    rows: filteredClients.map(c => [
      c.name,
      c.documentType || 'CPF',
      c.documentNumber || '-',
      c.category || 'Particular',
      c.contactPerson || '-',
      c.phone || '-',
      c.email || '-',
      c.cityState || '-',
      `${c.activeOrdersCount || 0}`
    ]),
    totals: [
      { label: 'Total Clientes Filtrados', value: `${filteredClients.length}` },
      { label: 'Clientes com Pedidos Ativos', value: `${filteredClients.filter(c => c.activeOrdersCount > 0).length}` }
    ]
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName) return;

    const computedCityState = [city, state, country].filter(Boolean).join(', ') || 'São Paulo, SP';

    onAddClient({
      name: fullName,
      documentType: docType,
      documentNumber: docNumber || (docType === 'CNPJ' ? '00.000.000/0001-00' : '000.000.000-00'),
      category: category,
      contactPerson: contactPerson,
      email: email || 'cliente@email.com',
      phone: phone || '(11) 90000-0000',
      cityState: computedCityState,
      city: city || undefined,
      state: state || undefined,
      country: country || undefined,
      birthDate,
      instagram,
      facebook,
      hasEmbroideryMachine,
      embroideryMachines: hasEmbroideryMachine ? embroideryMachines : [],
      matrixDeliveryPreferences,
      matrixDeliveryOther: matrixDeliveryPreferences.includes('Outro') ? matrixDeliveryOther : undefined
    });

    // Reset Form
    setFullName('');
    setBirthDate('');
    setCity('');
    setState('');
    setCountry('Brasil');
    setEmail('');
    setPhone('');
    setContactPerson('');
    setDocNumber('');
    setInstagram('');
    setFacebook('');
    setHasEmbroideryMachine(false);
    setEmbroideryMachines([{ brand: '', model: '', hoops: '', fileFormat: '' }]);
    setMatrixDeliveryPreferences(['Whatsapp']);
    setMatrixDeliveryOther('');
    setShowForm(false);
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setIsEditing(false);
    setClientToDelete(null);
  };

  const handleStartEdit = (client: Client) => {
    setEditName(client.name);
    setEditDocType(client.documentType || 'CPF');
    setEditDocNumber(client.documentNumber || '');
    setEditCategory(client.category || 'Particular');
    setEditContactPerson(client.contactPerson || '');
    setEditPhone(client.phone || '');
    setEditEmail(client.email || '');

    // Parse location if separate fields aren't already populated
    let parsedCity = client.city || '';
    let parsedState = client.state || '';
    let parsedCountry = client.country || 'Brasil';

    if (!parsedCity && client.cityState) {
      const parts = client.cityState.split(',').map(s => s.trim());
      parsedCity = parts[0] || '';
      if (parts[1]) {
        const subParts = parts[1].split('-').map(s => s.trim());
        parsedState = subParts[0] || '';
        if (subParts[1]) {
          parsedCountry = subParts[1] || 'Brasil';
        }
      }
    }

    setEditCity(parsedCity);
    setEditState(parsedState);
    setEditCountry(parsedCountry);
    setEditBirthDate(client.birthDate || '');
    setEditInstagram(client.instagram || '');
    setEditFacebook(client.facebook || '');
    setEditHasMachine(client.hasEmbroideryMachine || false);
    setEditMachines(
      client.embroideryMachines && client.embroideryMachines.length > 0
        ? client.embroideryMachines
        : [{ brand: '', model: '', hoops: '', fileFormat: '' }]
    );
    setEditMatrixDeliveryPreferences(client.matrixDeliveryPreferences || []);
    setEditMatrixDeliveryOther(client.matrixDeliveryOther || '');
    setIsEditing(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !editName) return;

    const initials = editName
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    const computedCityState = [editCity, editState, editCountry].filter(Boolean).join(', ');

    const updated: Client = {
      ...selectedClient,
      name: editName,
      documentType: editDocType,
      documentNumber: editDocNumber,
      category: editCategory,
      contactPerson: editContactPerson,
      phone: editPhone,
      email: editEmail,
      cityState: computedCityState || selectedClient.cityState || '',
      city: editCity,
      state: editState,
      country: editCountry,
      birthDate: editBirthDate,
      instagram: editInstagram,
      facebook: editFacebook,
      hasEmbroideryMachine: editHasMachine,
      embroideryMachines: editHasMachine ? editMachines : [],
      matrixDeliveryPreferences: editMatrixDeliveryPreferences,
      matrixDeliveryOther: editMatrixDeliveryPreferences.includes('Outro') ? editMatrixDeliveryOther : undefined,
      avatarInitials: initials || selectedClient.avatarInitials
    };

    if (onUpdateClient) {
      onUpdateClient(updated);
    }
    setSelectedClient(updated);
    setIsEditing(false);
  };

  const handleDeleteClient = () => {
    if (!selectedClient) return;
    if (onDeleteClient) {
      onDeleteClient(selectedClient.id);
    }
    setSelectedClient(null);
    setClientToDelete(null);
  };

  return (
    <div className="space-y-5 pb-24 relative min-h-[500px]">
      {/* CASE 1: DETAILS VIEW (GUI DETALHES DO CLIENTE) */}
      {selectedClient && !isEditing ? (
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/15 shadow-2xl p-4 sm:p-6 space-y-6 text-white animate-in fade-in zoom-in-95 duration-200">
          {/* Top Bar Navigation & Actions */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <button
              onClick={() => setSelectedClient(null)}
              className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 flex items-center gap-1 transition"
            >
              <ChevronLeft className="w-4 h-4" /> Voltar
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleStartEdit(selectedClient)}
                className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md"
              >
                <Edit className="w-3.5 h-3.5" /> Editar
              </button>
              <button
                onClick={() => setClientToDelete(selectedClient)}
                className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 text-rose-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md"
              >
                <Trash2 className="w-3.5 h-3.5" /> Excluir
              </button>
            </div>
          </div>

          {/* Client Main Header Info */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 bg-gradient-to-tr from-cyan-400 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/25 border border-cyan-300/40">
              {selectedClient.avatarInitials || selectedClient.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-extrabold text-white tracking-tight">{selectedClient.name}</h2>
                {selectedClient.category && (
                  <span className="px-2.5 py-0.5 bg-cyan-400/20 border border-cyan-300/30 text-cyan-300 rounded-full text-[10px] font-bold">
                    {selectedClient.category}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-1.5">
                {selectedClient.documentType === 'CNPJ' ? (
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                ) : (
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                )}
                {selectedClient.documentType}: <span className="font-semibold text-white">{selectedClient.documentNumber}</span>
              </p>
            </div>
          </div>

          {/* Quick Contact Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <a
              href={`tel:${selectedClient.phone}`}
              className="py-2.5 px-3 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-xs font-bold text-white transition flex items-center justify-center gap-2 backdrop-blur-md"
            >
              <Phone className="w-4 h-4 text-cyan-300" /> Ligar ({selectedClient.phone})
            </a>
            <a
              href={`https://wa.me/55${selectedClient.phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 rounded-xl text-xs font-bold text-emerald-300 transition flex items-center justify-center gap-2 backdrop-blur-md shadow-[0_0_12px_rgba(52,211,153,0.2)]"
            >
              <MessageSquare className="w-4 h-4 text-emerald-300" /> WhatsApp
            </a>
          </div>

          {/* Comprehensive Details Section */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider border-b border-white/10 pb-1.5">
              Informações Cadastrais
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white/5 border border-white/10 p-3 rounded-2xl space-y-1">
                <span className="text-[11px] text-slate-400 font-semibold block">Pessoa de Contato</span>
                <p className="font-bold text-white">{selectedClient.contactPerson || 'Não informado'}</p>
              </div>

              <div className="bg-white/5 border border-white/10 p-3 rounded-2xl space-y-1">
                <span className="text-[11px] text-slate-400 font-semibold block">E-mail</span>
                <p className="font-bold text-white flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  {selectedClient.email || 'Não informado'}
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 p-3 rounded-2xl space-y-1 sm:col-span-2">
                <span className="text-[11px] text-slate-400 font-semibold block">Localização (Cidade, Estado, País)</span>
                <p className="font-bold text-white flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  {selectedClient.city || selectedClient.state || selectedClient.country ? (
                    <span>
                      {[selectedClient.city, selectedClient.state, selectedClient.country].filter(Boolean).join(' - ')}
                    </span>
                  ) : (
                    selectedClient.cityState || 'Não informado'
                  )}
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 p-3 rounded-2xl space-y-1">
                <span className="text-[11px] text-slate-400 font-semibold block">Data de Aniversário</span>
                <p className="font-bold text-white flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  {selectedClient.birthDate || 'Não informada'}
                </p>
              </div>

              {selectedClient.instagram && (
                <div className="bg-white/5 border border-white/10 p-3 rounded-2xl space-y-1">
                  <span className="text-[11px] text-slate-400 font-semibold block">Instagram</span>
                  <p className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <Instagram className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                    {selectedClient.instagram}
                  </p>
                </div>
              )}

              {selectedClient.facebook && (
                <div className="bg-white/5 border border-white/10 p-3 rounded-2xl space-y-1">
                  <span className="text-[11px] text-slate-400 font-semibold block">Facebook</span>
                  <p className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <Facebook className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    {selectedClient.facebook}
                  </p>
                </div>
              )}

              {/* Preference Matrix Delivery Display */}
              <div className="bg-white/5 border border-white/10 p-3 rounded-2xl space-y-1.5 sm:col-span-2">
                <span className="text-[11px] text-slate-400 font-semibold block flex items-center gap-1">
                  <Send className="w-3.5 h-3.5 text-cyan-400" /> Como prefere receber as matrizes
                </span>
                {selectedClient.matrixDeliveryPreferences && selectedClient.matrixDeliveryPreferences.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {selectedClient.matrixDeliveryPreferences.map((pref) => (
                      <span key={pref} className="px-2.5 py-1 bg-cyan-400/15 border border-cyan-400/30 text-cyan-300 font-bold text-xs rounded-lg">
                        {pref === 'Outro' && selectedClient.matrixDeliveryOther ? `Outro: ${selectedClient.matrixDeliveryOther}` : pref}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="font-semibold text-slate-400 text-xs">Não especificado</p>
                )}
              </div>
            </div>

            {/* Embroidery Machines Section */}
            <div className="pt-2">
              <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider border-b border-white/10 pb-1.5 mb-3 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-cyan-400" /> Máquinas de Bordar
              </h3>

              {selectedClient.hasEmbroideryMachine && selectedClient.embroideryMachines && selectedClient.embroideryMachines.length > 0 ? (
                <div className="space-y-3">
                  {selectedClient.embroideryMachines.map((machine, index) => (
                    <div key={index} className="bg-cyan-500/10 border border-cyan-400/30 p-3.5 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between border-b border-cyan-300/20 pb-1.5">
                        <span className="text-xs font-extrabold text-cyan-300">
                          Máquina #{index + 1}: {machine.brand} {machine.model}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400">Marca:</span> <strong className="text-white">{machine.brand || 'N/A'}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Modelo:</span> <strong className="text-white">{machine.model || 'N/A'}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Bastidores:</span> <strong className="text-cyan-200">{machine.hoops || 'N/A'}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Formato de Arquivo:</span> <strong className="text-cyan-200">{machine.fileFormat || 'N/A'}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl text-xs text-slate-400 italic">
                  Este cliente não possui máquinas de bordar registradas.
                </div>
              )}
            </div>

            {/* Active Orders Summary */}
            <div className="pt-2">
              <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block">Pedidos em Andamento</span>
                  <p className="font-extrabold text-emerald-300 text-sm mt-0.5">
                    {selectedClient.activeOrdersCount} {selectedClient.activeOrdersCount === 1 ? 'pedido ativo' : 'pedidos ativos'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : isEditing && selectedClient ? (
        /* CASE 2: EDIT CLIENT SCREEN */
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/15 shadow-2xl p-4 sm:p-6 space-y-6 text-white animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <button
              onClick={() => setIsEditing(false)}
              className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 flex items-center gap-1 transition"
            >
              <ChevronLeft className="w-4 h-4" /> Cancelar Edição
            </button>
            <span className="text-xs font-extrabold text-cyan-300 uppercase tracking-wider">
              Editar Cliente
            </span>
          </div>

          <form onSubmit={handleSaveEdit} className="space-y-4">
            {/* Nome Completo */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nome do Cliente / Empresa <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 backdrop-blur-md transition"
              />
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Categoria do Cliente
              </label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value as any)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-white/20 bg-slate-900 text-white focus:outline-none focus:border-cyan-400 transition"
              >
                <option value="Particular">Particular</option>
                <option value="Empresa">Empresa</option>
                <option value="Atacado">Atacado</option>
                <option value="Escola">Escola</option>
              </select>
            </div>

            {/* Documento Tipo & Número */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tipo de Documento
                </label>
                <select
                  value={editDocType}
                  onChange={(e) => setEditDocType(e.target.value as any)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-white/20 bg-slate-900 text-white focus:outline-none focus:border-cyan-400 transition"
                >
                  <option value="CPF">CPF</option>
                  <option value="CNPJ">CNPJ</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Número do Documento
                </label>
                <input
                  type="text"
                  value={editDocNumber}
                  onChange={(e) => setEditDocNumber(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 backdrop-blur-md transition"
                />
              </div>
            </div>

            {/* Contato Principal */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Pessoa de Contato / Responsável
              </label>
              <input
                type="text"
                value={editContactPerson}
                onChange={(e) => setEditContactPerson(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 backdrop-blur-md transition"
              />
            </div>

            {/* Data de Aniversário */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Data de Aniversário
              </label>
              <input
                type="text"
                placeholder="Ex: 15/10/1990"
                value={editBirthDate}
                onChange={(e) => setEditBirthDate(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 backdrop-blur-md transition"
              />
            </div>

            {/* Cidade, Estado e País */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Cidade
                </label>
                <input
                  type="text"
                  placeholder="Ex: Ferraz de Vasconcelos"
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 backdrop-blur-md transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Estado
                </label>
                <input
                  type="text"
                  placeholder="Ex: SP"
                  value={editState}
                  onChange={(e) => setEditState(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 backdrop-blur-md transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  País
                </label>
                <input
                  type="text"
                  placeholder="Ex: Brasil"
                  value={editCountry}
                  onChange={(e) => setEditCountry(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 backdrop-blur-md transition"
                />
              </div>
            </div>

            {/* Email & Telefone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 backdrop-blur-md transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 backdrop-blur-md transition"
                />
              </div>
            </div>

            {/* Instagram & Facebook */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Instagram
                </label>
                <input
                  type="text"
                  value={editInstagram}
                  onChange={(e) => setEditInstagram(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 backdrop-blur-md transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Facebook
                </label>
                <input
                  type="text"
                  value={editFacebook}
                  onChange={(e) => setEditFacebook(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 backdrop-blur-md transition"
                />
              </div>
            </div>

            {/* Edit Como prefere receber as matrizes */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-4 space-y-3">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-cyan-400" /> Como prefere receber as matrizes
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Selecione uma ou mais opções preferidas pelo cliente:
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                {['Email', 'Whatsapp', 'Telegram', 'Outro'].map((option) => {
                  const isChecked = editMatrixDeliveryPreferences.includes(option);
                  return (
                    <label
                      key={option}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border transition cursor-pointer text-xs font-semibold ${
                        isChecked
                          ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200 shadow-sm'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditMatrixDeliveryPreferences([...editMatrixDeliveryPreferences, option]);
                          } else {
                            setEditMatrixDeliveryPreferences(editMatrixDeliveryPreferences.filter(o => o !== option));
                          }
                        }}
                        className="rounded border-white/20 bg-slate-900 text-cyan-400 focus:ring-cyan-400"
                      />
                      <span>{option}</span>
                    </label>
                  );
                })}
              </div>

              {editMatrixDeliveryPreferences.includes('Outro') && (
                <div className="pt-2">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Especifique a outra forma de recebimento:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Google Drive, Pen Drive, WeTransfer..."
                    value={editMatrixDeliveryOther}
                    onChange={(e) => setEditMatrixDeliveryOther(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-cyan-400/40 bg-slate-950/60 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition"
                  />
                </div>
              )}
            </div>

            {/* Edit Máquina de bordar Card */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-cyan-400" /> Possui máquina de bordar?
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Habilite para registrar detalhes do equipamento.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editHasMachine}
                    onChange={(e) => handleEditToggleMachine(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-cyan-400 peer-checked:to-blue-600"></div>
                </label>
              </div>

              {editHasMachine && (
                <div className="space-y-4 pt-3 border-t border-white/10">
                  {editMachines.map((machine, index) => (
                    <div key={index} className="bg-white/5 border border-white/15 rounded-2xl p-3.5 space-y-3 relative backdrop-blur-sm">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="text-xs font-bold text-cyan-300 flex items-center gap-1">
                          <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Máquina de Bordar #{index + 1}
                        </span>
                        {editMachines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleEditRemoveMachine(index)}
                            className="text-rose-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-1 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remover
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                            Marca da máquina
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: Brother, Janome, Barudan..."
                            value={machine.brand}
                            onChange={(e) => handleEditMachineChange(index, 'brand', e.target.value)}
                            className="w-full text-xs px-3 py-2 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 backdrop-blur-md transition"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                            Modelo da máquina
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: PE770, BP2150, MC500E..."
                            value={machine.model}
                            onChange={(e) => handleEditMachineChange(index, 'model', e.target.value)}
                            className="w-full text-xs px-3 py-2 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 backdrop-blur-md transition"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                            Bastidores que possui
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: 10x10, 13x18, 20x30..."
                            value={machine.hoops}
                            onChange={(e) => handleEditMachineChange(index, 'hoops', e.target.value)}
                            className="w-full text-xs px-3 py-2 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 backdrop-blur-md transition"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                            Formato de arquivo
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: .PES, .DST, .JEF, .EXP..."
                            value={machine.fileFormat}
                            onChange={(e) => handleEditMachineChange(index, 'fileFormat', e.target.value)}
                            className="w-full text-xs px-3 py-2 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 backdrop-blur-md transition"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleEditAddMachine}
                    className="w-full py-2.5 bg-white/10 hover:bg-white/20 border border-cyan-400/40 text-cyan-300 font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 backdrop-blur-md shadow-md active:scale-98"
                  >
                    <Plus className="w-4 h-4 text-cyan-300" /> Adicionar outra máquina
                  </button>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/15 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-cyan-500/25 border border-cyan-300/40 hover:brightness-110 transition flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4 text-slate-950" /> Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      ) : showForm ? (
        /* CASE 3: NOVO CLIENTE SCREEN */
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/15 shadow-2xl p-4 sm:p-6 space-y-6 text-white animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <button
              onClick={() => setShowForm(false)}
              className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 flex items-center gap-1 transition"
            >
              <ChevronLeft className="w-4 h-4" /> Cancelar
            </button>
            <span className="text-xs font-extrabold text-cyan-300 uppercase tracking-wider">
              Novo Cliente
            </span>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Nome Completo */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nome Completo / Razão Social <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="Ex: Maria Silva ou Empresa XYZ Ltd"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 backdrop-blur-md transition"
              />
            </div>

            {/* Tipo Documento & Categoria */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tipo de Documento
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as any)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-white/20 bg-slate-900 text-white focus:outline-none focus:border-cyan-400 transition"
                >
                  <option value="CPF">CPF</option>
                  <option value="CNPJ">CNPJ</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Número do Documento
                </label>
                <input
                  type="text"
                  placeholder={docType === 'CNPJ' ? '00.000.000/0001-00' : '000.000.000-00'}
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 backdrop-blur-md transition"
                />
              </div>
            </div>

            {/* Categoria & Pessoa de Contato */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Categoria
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-white/20 bg-slate-900 text-white focus:outline-none focus:border-cyan-400 transition"
                >
                  <option value="Particular">Particular</option>
                  <option value="Empresa">Empresa</option>
                  <option value="Atacado">Atacado</option>
                  <option value="Escola">Escola</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Pessoa de Contato
                </label>
                <input
                  type="text"
                  placeholder="Ex: Carlos Mendes"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 backdrop-blur-md transition"
                />
              </div>
            </div>

            {/* Data de Aniversário */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Data de Aniversário
              </label>
              <input
                type="text"
                placeholder="dd/mm/aaaa"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 backdrop-blur-md transition"
              />
            </div>

            {/* Cidade, Estado e País */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Cidade
                </label>
                <input
                  type="text"
                  placeholder="Ex: Ferraz de Vasconcelos"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 backdrop-blur-md transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Estado
                </label>
                <input
                  type="text"
                  placeholder="Ex: SP"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 backdrop-blur-md transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  País
                </label>
                <input
                  type="text"
                  placeholder="Ex: Brasil"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 backdrop-blur-md transition"
                />
              </div>
            </div>

            {/* E-mail e Telefone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  placeholder="cliente@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 backdrop-blur-md transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="(11) 90000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 backdrop-blur-md transition"
                />
              </div>
            </div>

            {/* Instagram & Facebook */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Instagram
                </label>
                <input
                  type="text"
                  placeholder="@cliente"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 backdrop-blur-md transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Facebook
                </label>
                <input
                  type="text"
                  placeholder="/cliente"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 backdrop-blur-md transition"
                />
              </div>
            </div>

            {/* Como prefere receber as matrizes */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-4 space-y-3">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-cyan-400" /> Como prefere receber as matrizes
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Selecione uma ou mais opções preferidas pelo cliente:
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                {['Email', 'Whatsapp', 'Telegram', 'Outro'].map((option) => {
                  const isChecked = matrixDeliveryPreferences.includes(option);
                  return (
                    <label
                      key={option}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border transition cursor-pointer text-xs font-semibold ${
                        isChecked
                          ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200 shadow-sm'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setMatrixDeliveryPreferences([...matrixDeliveryPreferences, option]);
                          } else {
                            setMatrixDeliveryPreferences(matrixDeliveryPreferences.filter(o => o !== option));
                          }
                        }}
                        className="rounded border-white/20 bg-slate-900 text-cyan-400 focus:ring-cyan-400"
                      />
                      <span>{option}</span>
                    </label>
                  );
                })}
              </div>

              {matrixDeliveryPreferences.includes('Outro') && (
                <div className="pt-2">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Especifique a outra forma de recebimento:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Google Drive, Pen Drive, WeTransfer..."
                    value={matrixDeliveryOther}
                    onChange={(e) => setMatrixDeliveryOther(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-cyan-400/40 bg-slate-950/60 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition"
                  />
                </div>
              )}
            </div>

            {/* Possui máquina de bordar? Card */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-cyan-400" /> Possui máquina de bordar?
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Habilite para registrar detalhes do equipamento.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasEmbroideryMachine}
                    onChange={(e) => handleToggleMachine(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-cyan-400 peer-checked:to-blue-600"></div>
                </label>
              </div>

              {hasEmbroideryMachine && (
                <div className="space-y-4 pt-3 border-t border-white/10">
                  {embroideryMachines.map((machine, index) => (
                    <div key={index} className="bg-white/5 border border-white/15 rounded-2xl p-3.5 space-y-3 relative backdrop-blur-sm">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="text-xs font-bold text-cyan-300 flex items-center gap-1">
                          <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Máquina de Bordar #{index + 1}
                        </span>
                        {embroideryMachines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMachine(index)}
                            className="text-rose-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-1 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remover
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                            Marca da máquina
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: Brother, Janome, Barudan..."
                            value={machine.brand}
                            onChange={(e) => handleMachineChange(index, 'brand', e.target.value)}
                            className="w-full text-xs px-3 py-2 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 backdrop-blur-md transition"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                            Modelo da máquina
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: PE770, BP2150, MC500E..."
                            value={machine.model}
                            onChange={(e) => handleMachineChange(index, 'model', e.target.value)}
                            className="w-full text-xs px-3 py-2 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 backdrop-blur-md transition"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                            Bastidores que possui
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: 10x10, 13x18, 20x30..."
                            value={machine.hoops}
                            onChange={(e) => handleMachineChange(index, 'hoops', e.target.value)}
                            className="w-full text-xs px-3 py-2 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 backdrop-blur-md transition"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                            Formato de arquivo
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: .PES, .DST, .JEF, .EXP..."
                            value={machine.fileFormat}
                            onChange={(e) => handleMachineChange(index, 'fileFormat', e.target.value)}
                            className="w-full text-xs px-3 py-2 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 backdrop-blur-md transition"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddMachine}
                    className="w-full py-2.5 bg-white/10 hover:bg-white/20 border border-cyan-400/40 text-cyan-300 font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 backdrop-blur-md shadow-md active:scale-98"
                  >
                    <Plus className="w-4 h-4 text-cyan-300" /> Adicionar outra máquina
                  </button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-cyan-500/25 border border-cyan-300/40 hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 text-slate-950" /> Salvar Cliente
            </button>
          </form>
        </div>
      ) : (
        /* CASE 4: LISTA DE CLIENTES (FROSTED GLASS) */
        <div className="space-y-4">
          {/* Dynamic Filter & Export Toolbar */}
          <DataFilterExportToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Buscar clientes por nome, CPF/CNPJ, contato, cidade ou e-mail..."
            filterOptions={[
              {
                key: 'category',
                label: 'Categoria do Cliente',
                value: categoryFilter,
                options: [
                  { label: 'Todas as Categorias', value: 'todos' },
                  { label: 'Particular', value: 'Particular' },
                  { label: 'Empresa', value: 'Empresa' },
                  { label: 'Atacado', value: 'Atacado' },
                  { label: 'Escola', value: 'Escola' }
                ],
                onChange: setCategoryFilter
              },
              {
                key: 'docType',
                label: 'Tipo de Documento',
                value: docTypeFilter,
                options: [
                  { label: 'Todos os Documentos', value: 'todos' },
                  { label: 'CPF', value: 'CPF' },
                  { label: 'CNPJ', value: 'CNPJ' }
                ],
                onChange: setDocTypeFilter
              },
              {
                key: 'activeOrders',
                label: 'Status de Pedidos Ativos',
                value: activeOrdersFilter,
                options: [
                  { label: 'Todos os Status', value: 'todos' },
                  { label: 'Com Pedidos Ativos', value: 'com_pedidos' },
                  { label: 'Sem Pedidos Ativos', value: 'sem_pedidos' }
                ],
                onChange: setActiveOrdersFilter
              },
              {
                key: 'machine',
                label: 'Possui Máquina de Bordado',
                value: machineFilter,
                options: [
                  { label: 'Todas as Opções', value: 'todos' },
                  { label: 'Possui Máquina(s)', value: 'com_maquina' },
                  { label: 'Sem Máquina Cadastrada', value: 'sem_maquina' }
                ],
                onChange: setMachineFilter
              },
              {
                key: 'sortBy',
                label: 'Ordenar Resultados Por',
                value: sortByFilter,
                options: [
                  { label: 'Nome (A-Z)', value: 'name_asc' },
                  { label: 'Nome (Z-A)', value: 'name_desc' },
                  { label: 'Mais Pedidos Ativos', value: 'orders_desc' }
                ],
                onChange: setSortByFilter
              }
            ]}
            onResetFilters={() => {
              setSearchQuery('');
              setCategoryFilter('todos');
              setDocTypeFilter('todos');
              setActiveOrdersFilter('todos');
              setMachineFilter('todos');
              setSortByFilter('name_asc');
              setActiveTab('Todos os Clientes');
            }}
            exportPayload={clientsExportPayload}
            totalFilteredCount={filteredClients.length}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {(['Todos os Clientes', 'Ativos Recentes', 'Atacado'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition backdrop-blur-md ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 font-black shadow-md shadow-cyan-500/25 border border-cyan-300/40'
                    : 'bg-white/10 border border-white/15 text-slate-300 hover:bg-white/20'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Client Cards List */}
          <div className={
            viewMode === 'large' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' :
            viewMode === 'small' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5' :
            viewMode === 'list' ? 'space-y-2' :
            'space-y-3'
          }>
            {filteredClients.map((client) => {
              if (viewMode === 'small') {
                return (
                  <div
                    key={client.id}
                    onClick={() => handleSelectClient(client)}
                    className="p-2.5 rounded-2xl border border-white/10 bg-white/5 space-y-2 backdrop-blur-md flex flex-col justify-between hover:border-cyan-400/50 cursor-pointer transition"
                  >
                    <div className="space-y-1">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] bg-gradient-to-tr from-cyan-400 to-blue-600 text-slate-950">
                        {client.avatarInitials || client.name.slice(0, 2).toUpperCase()}
                      </div>
                      <p className="text-xs font-bold text-white truncate">{client.name}</p>
                      <p className="text-[10px] text-slate-300 truncate">{client.phone}</p>
                    </div>
                    <div className="border-t border-white/10 pt-1 text-[10px] text-cyan-300 font-semibold truncate">
                      {client.cityState || client.category || 'Cliente'}
                    </div>
                  </div>
                );
              }

              if (viewMode === 'list') {
                return (
                  <div
                    key={client.id}
                    onClick={() => handleSelectClient(client)}
                    className="p-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-cyan-400/50 cursor-pointer transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-xs shrink-0 bg-gradient-to-tr from-cyan-400 to-blue-600 text-slate-950">
                        {client.avatarInitials || client.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-white truncate block">{client.name}</span>
                        <p className="text-[11px] text-slate-300 truncate">{client.documentType}: {client.documentNumber} | {client.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 justify-end">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold">
                        {client.category || 'Cliente'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClient(client);
                          handleStartEdit(client);
                        }}
                        className="p-1.5 rounded-lg bg-white/5 text-slate-200 hover:text-white"
                      >
                        <Edit className="w-3.5 h-3.5 text-cyan-300" />
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={client.id}
                  onClick={() => handleSelectClient(client)}
                  className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/15 shadow-xl p-4 space-y-3 hover:border-cyan-400/60 hover:bg-white/15 cursor-pointer transition-all group active:scale-[0.99] flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-11 h-11 rounded-full flex items-center justify-center font-black text-xs shrink-0 bg-gradient-to-tr from-cyan-400 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20 border border-cyan-300/40"
                        >
                          {client.avatarInitials || client.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                            {client.name}
                          </h3>
                          <p className="text-xs text-slate-300 font-medium flex items-center gap-1 mt-0.5">
                            {client.documentType === 'CNPJ' ? (
                              <Building2 className="w-3 h-3 text-cyan-400" />
                            ) : (
                              <User className="w-3 h-3 text-cyan-400" />
                            )}
                            {client.documentType}: {client.documentNumber}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Embroidery Machines Display Badge */}
                    {client.hasEmbroideryMachine && (
                      <div className="p-2.5 bg-cyan-500/15 rounded-xl border border-cyan-400/30 text-xs space-y-1">
                        <span className="font-bold text-cyan-300 flex items-center gap-1">
                          <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Possui máquina(s) de bordar
                        </span>
                        {client.embroideryMachines && client.embroideryMachines.length > 0 ? (
                          <div className="space-y-1 pt-1">
                            {client.embroideryMachines.map((m, idx) => (
                              <p key={idx} className="text-[11px] text-slate-200">
                                • <strong className="text-white">{m.brand} {m.model}</strong> {m.hoops ? `(Bastidores: ${m.hoops})` : ''} {m.fileFormat ? `[${m.fileFormat}]` : ''}
                              </p>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>

                  <div className="pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div>
                      {client.contactPerson && (
                        <p className="text-slate-300">
                          Contato: <span className="font-semibold text-cyan-200">{client.contactPerson}</span>
                        </p>
                      )}
                      {client.activeOrdersCount > 0 && (
                        <p className="text-emerald-300 font-semibold flex items-center gap-1 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                          {client.activeOrdersCount} Pedidos em andamento
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClient(client);
                          handleStartEdit(client);
                        }}
                        className="px-2.5 py-1.5 border border-cyan-400/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-semibold rounded-xl flex items-center gap-1 transition backdrop-blur-md active:scale-95 shadow-sm"
                        title="Editar cliente"
                      >
                        <Edit className="w-3.5 h-3.5 text-cyan-300" /> Editar
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setClientToDelete(client);
                        }}
                        className="px-2.5 py-1.5 border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold rounded-xl flex items-center gap-1 transition backdrop-blur-md active:scale-95 shadow-sm"
                        title="Excluir cliente"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Excluir
                      </button>

                      <a
                        href={`tel:${client.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="w-8 h-8 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-200 transition backdrop-blur-md"
                        title="Ligar"
                      >
                        <Phone className="w-3.5 h-3.5 text-cyan-300" />
                      </a>
                      <a
                        href={`https://wa.me/55${client.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 hover:bg-emerald-500/30 flex items-center justify-center text-emerald-300 transition backdrop-blur-md shadow-[0_0_10px_rgba(52,211,153,0.2)]"
                        title="WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-300" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-center text-xs text-slate-400 pt-3">
            Fim da lista ({filteredClients.length} clientes encontrados)
          </p>

          {/* Floating Action Red Button (+) */}
          <button
            onClick={() => setShowForm(true)}
            className="fixed bottom-20 right-5 z-40 w-14 h-14 bg-gradient-to-r from-rose-500 to-pink-600 border border-pink-400/30 text-white rounded-2xl shadow-xl shadow-pink-500/30 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
            title="Novo Cliente"
          >
            <UserPlus className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Global Delete Confirmation Modal */}
      {clientToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Excluir Cliente?</h4>
                <p className="text-xs text-slate-300">Esta ação não poderá ser desfeita.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 bg-white/5 p-3 rounded-xl border border-white/10">
              Deseja realmente remover <strong className="text-white">{clientToDelete.name}</strong> da sua lista de clientes?
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setClientToDelete(null)}
                className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-xs font-bold rounded-xl text-slate-300 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteClient) {
                    onDeleteClient(clientToDelete.id);
                  }
                  if (selectedClient?.id === clientToDelete.id) {
                    setSelectedClient(null);
                  }
                  setClientToDelete(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-xs font-bold rounded-xl text-white shadow-lg shadow-rose-600/30 transition flex items-center justify-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
