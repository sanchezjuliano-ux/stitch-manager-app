'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Image as ImageIcon, 
  FileType, 
  Code, 
  Check, 
  Filter,
  FileCode,
  Send,
  Mail,
  Share2,
  Copy,
  Edit,
  RotateCcw,
  Building2,
  Upload
} from 'lucide-react';
import { 
  ExportDataPayload, 
  ExportFormat, 
  exportToCsv, 
  exportToPdf, 
  exportToImage, 
  exportToTxt, 
  exportToMarkdown, 
  exportToJson,
  shareToWhatsapp,
  shareToEmail,
  shareViaNativeApi,
  generateFormattedShareText
} from '@/lib/exportUtils';
import { 
  getStoredCompanyConfig, 
  saveCompanyConfig, 
  DEFAULT_SANCHEZ_LOGO_SVG, 
  CompanyLogoConfig 
} from '@/lib/logoConfig';

interface ExportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  payload: ExportDataPayload;
}

export const ExportDataModal: React.FC<ExportDataModalProps> = ({
  isOpen,
  onClose,
  payload
}) => {
  const [activeTab, setActiveTab] = useState<'download' | 'share'>('download');
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('excel');
  const [shareChannel, setShareChannel] = useState<'whatsapp' | 'email' | 'native' | 'copy'>('whatsapp');
  const [customFilename, setCustomFilename] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Company logo & header state
  const [companyConfig, setCompanyConfig] = useState<CompanyLogoConfig>(getStoredCompanyConfig());
  const [showLogoEditor, setShowLogoEditor] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        const cfg = getStoredCompanyConfig();
        setCompanyConfig(cfg);
        setEditName(cfg.name);
        setEditSubtitle(cfg.subtitle);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentPayload: ExportDataPayload = {
    ...payload,
    logoUrl: companyConfig.logoDataUrl,
    companyName: companyConfig.name
  };

  const formattedShareText = generateFormattedShareText(currentPayload);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Por favor selecione uma imagem menor que 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const updated = saveCompanyConfig({ logoDataUrl: reader.result });
        setCompanyConfig(updated);
        setSuccessMessage('Logotipo atualizado com sucesso!');
        setTimeout(() => setSuccessMessage(null), 2000);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetDefaultLogo = () => {
    const updated = saveCompanyConfig({ logoDataUrl: DEFAULT_SANCHEZ_LOGO_SVG });
    setCompanyConfig(updated);
    setSuccessMessage('Logotipo restaurado para o padrão SANCHEZ com Z!');
    setTimeout(() => setSuccessMessage(null), 2000);
  };

  const handleSaveCompanyText = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = saveCompanyConfig({
      name: editName.trim() || 'SANCHEZ com Z Bordados',
      subtitle: editSubtitle.trim() || 'Desde 2016 • Ateliê de Bordados'
    });
    setCompanyConfig(updated);
    setShowLogoEditor(false);
    setSuccessMessage('Dados da empresa salvos!');
    setTimeout(() => setSuccessMessage(null), 2000);
  };

  const handleExport = async (formatOverride?: ExportFormat) => {
    const fmt = formatOverride || selectedFormat;
    setIsExporting(true);
    setSuccessMessage(null);

    try {
      const sanitizedName = customFilename.trim() ? customFilename.trim() : undefined;

      switch (fmt) {
        case 'excel':
          exportToCsv(currentPayload, sanitizedName ? `${sanitizedName}.csv` : undefined);
          break;
        case 'pdf':
          await exportToPdf(currentPayload, sanitizedName ? `${sanitizedName}.pdf` : undefined);
          break;
        case 'image':
          await exportToImage(currentPayload, sanitizedName ? `${sanitizedName}.png` : undefined);
          break;
        case 'txt':
          exportToTxt(currentPayload, sanitizedName ? `${sanitizedName}.txt` : undefined);
          break;
        case 'markdown':
          exportToMarkdown(currentPayload, sanitizedName ? `${sanitizedName}.md` : undefined);
          break;
        case 'json':
          exportToJson(currentPayload, sanitizedName ? `${sanitizedName}.json` : undefined);
          break;
      }

      setSuccessMessage(`Arquivo exportado em formato ${fmt.toUpperCase()} com sucesso!`);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Erro ao exportar:', err);
      alert('Ocorreu um erro ao gerar o arquivo de exportação. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExecuteSend = async () => {
    if (shareChannel === 'whatsapp') {
      shareToWhatsapp(currentPayload, whatsappPhone);
      setSuccessMessage('Redirecionando para o WhatsApp...');
    } else if (shareChannel === 'email') {
      shareToEmail(currentPayload, recipientEmail);
      setSuccessMessage('Abrindo cliente de e-mail...');
    } else if (shareChannel === 'native') {
      const shared = await shareViaNativeApi(currentPayload);
      if (shared) {
        setSuccessMessage('Relatório compartilhado com sucesso!');
      } else {
        handleCopyText();
        return;
      }
    } else if (shareChannel === 'copy') {
      handleCopyText();
      return;
    }

    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(formattedShareText);
    setSuccessMessage('Resumo do relatório copiado para a área de transferência!');
    setTimeout(() => {
      setSuccessMessage(null);
    }, 2500);
  };

  const formats: { id: ExportFormat; label: string; desc: string; icon: any; color: string }[] = [
    {
      id: 'excel',
      label: 'Planilha (CSV / Excel)',
      desc: 'Formato nativo para Excel e Google Sheets com acentuação PT-BR e BOM UTF-8',
      icon: FileSpreadsheet,
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/40 text-emerald-300'
    },
    {
      id: 'pdf',
      label: 'Documento PDF',
      desc: 'Relatório formatado pronto para impressão ou envio por e-mail/WhatsApp',
      icon: FileType,
      color: 'from-rose-500/20 to-red-500/10 border-rose-500/40 text-rose-300'
    },
    {
      id: 'image',
      label: 'Imagem PNG',
      desc: 'Captura em imagem de alta definição para compartilhamento rápido',
      icon: ImageIcon,
      color: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/40 text-cyan-300'
    },
    {
      id: 'txt',
      label: 'Texto Simples (TXT)',
      desc: 'Relatório estruturado em texto plano, leve e compatível com qualquer sistema',
      icon: FileText,
      color: 'from-amber-500/20 to-yellow-500/10 border-amber-500/40 text-amber-300'
    },
    {
      id: 'markdown',
      label: 'Tabela Markdown (.MD)',
      desc: 'Tabela em formato Markdown ideal para documentações e Notions',
      icon: FileCode,
      color: 'from-indigo-500/20 to-purple-500/10 border-indigo-500/40 text-indigo-300'
    },
    {
      id: 'json',
      label: 'Dados brutos em JSON',
      desc: 'Exportação estruturada de dados para integração com outros sistemas',
      icon: Code,
      color: 'from-violet-500/20 to-fuchsia-500/10 border-violet-500/40 text-violet-300'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div 
        className="w-full max-w-4xl bg-slate-900 border border-white/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-400/10 border border-cyan-400/30 text-cyan-300">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                Exportar & Enviar: {payload.title}
              </h2>
              <p className="text-xs text-slate-300">
                Escolha o formato ideal para baixar ou compartilhar com seus clientes.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/15 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 bg-slate-950/80 p-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('download')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'download'
                ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300 shadow-md ring-1 ring-cyan-400/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Baixar Arquivo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('share')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'share'
                ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-300 shadow-md ring-1 ring-emerald-400/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Send className="w-4 h-4 text-emerald-400" />
            <span>Enviar / Compartilhar</span>
          </button>
        </div>

        {/* Compact Summary & Logo Bar */}
        <div className="px-4 sm:px-5 py-3 bg-slate-950/90 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-white border-2 border-red-600 p-0.5 shrink-0 overflow-hidden shadow-sm flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={companyConfig.logoDataUrl}
                alt={companyConfig.name}
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white truncate">{companyConfig.name}</span>
                <span className="text-[10px] text-cyan-400 font-extrabold hidden sm:inline">• {companyConfig.subtitle}</span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Doc: <strong className="text-slate-200">{payload.title}</strong> {payload.subtitle ? `(${payload.subtitle})` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowLogoEditor(!showLogoEditor)}
            className="px-2.5 py-1 rounded-xl border border-white/20 bg-white/5 hover:bg-white/15 text-xs font-bold text-slate-200 transition flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5 text-cyan-400" />
            <span>{showLogoEditor ? 'Fechar Logo' : 'Alterar Logo'}</span>
          </button>
        </div>

        {/* Logo Editor Panel */}
        {showLogoEditor && (
          <div className="mx-4 sm:mx-5 mt-3 p-3.5 rounded-2xl bg-slate-950 border border-cyan-500/40 text-xs space-y-3 animate-fadeIn shrink-0">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                <Building2 className="w-4 h-4" /> Personalizar Logotipo & Cabeçalho
              </span>
              <button
                type="button"
                onClick={handleResetDefaultLogo}
                className="text-[11px] text-rose-300 hover:text-rose-200 underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Logo Padrão SANCHEZ
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Carregar Nova Imagem do Logo</label>
                <label className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-cyan-400/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-bold text-xs cursor-pointer transition">
                  <Upload className="w-4 h-4" />
                  <span>Selecionar Foto / Arquivo</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Ou Cole o Link do Logo (URL)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={companyConfig.logoDataUrl.startsWith('data:') ? '' : companyConfig.logoDataUrl}
                  onChange={(e) => {
                    if (e.target.value.trim()) {
                      const updated = saveCompanyConfig({ logoDataUrl: e.target.value.trim() });
                      setCompanyConfig(updated);
                    }
                  }}
                  className="w-full text-xs p-2.5 rounded-xl border border-white/20 bg-slate-900 text-white placeholder-slate-500"
                />
              </div>
            </div>

            <form onSubmit={handleSaveCompanyText} className="space-y-2 pt-1 border-t border-white/10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Nome da Empresa</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-white/15 bg-slate-900 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Slogan / Subtítulo</label>
                  <input
                    type="text"
                    value={editSubtitle}
                    onChange={(e) => setEditSubtitle(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-white/15 bg-slate-900 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-cyan-400 text-slate-950 font-extrabold text-xs rounded-xl hover:bg-cyan-300 transition cursor-pointer"
                >
                  Salvar Texto
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'download' ? (
            /* TAB 1: DOWNLOAD FILE */
            <div className="space-y-4">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div>
                    <label className="text-sm font-extrabold text-white flex items-center gap-2">
                      <Download className="w-4 h-4 text-cyan-400" /> Escolha o Formato de Exportação:
                    </label>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Clique no tipo de arquivo desejado para selecionar antes de baixar
                    </p>
                  </div>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-bold">
                    6 formatos disponíveis
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {formats.map((f) => {
                    const Icon = f.icon;
                    const isSelected = selectedFormat === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setSelectedFormat(f.id)}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 bg-gradient-to-br ${f.color} cursor-pointer relative group ${
                          isSelected
                            ? 'ring-2 ring-cyan-400 border-cyan-400 shadow-lg bg-slate-800/95 scale-[1.01]'
                            : 'opacity-85 hover:opacity-100 hover:bg-slate-800/70'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full gap-2">
                          <div className={`p-1.5 rounded-lg border shrink-0 shadow-sm transition ${
                            isSelected ? 'bg-cyan-400 text-slate-950 border-cyan-300' : 'bg-slate-900/80 border-white/10'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          {isSelected ? (
                            <span className="px-2 py-0.5 rounded-full bg-cyan-400 text-slate-950 font-black text-[10px] flex items-center gap-0.5 shadow-sm">
                              <Check className="w-3 h-3" /> Selecionado
                            </span>
                          ) : (
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-900/60 border border-white/5">
                              .{f.id}
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 className="font-extrabold text-xs sm:text-sm text-white mb-0.5 group-hover:text-cyan-300 transition">
                            {f.label}
                          </h3>
                          <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
                            {f.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-white/10">
                <label className="block text-xs font-bold text-slate-200 mb-1.5">
                  Nome Personalizado do Arquivo (Opcional)
                </label>
                <input
                  type="text"
                  placeholder={`Ex: ${payload.title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`}
                  value={customFilename}
                  onChange={(e) => setCustomFilename(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-white/20 bg-slate-800/90 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition shadow-inner"
                />
              </div>
            </div>
          ) : (
            /* TAB 2: SEND & SHARE (WHATSAPP, EMAIL, NATIVE, COPY) */
            <div className="space-y-4">
              {/* Channel Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Escolha o Canal de Envio:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setShareChannel('whatsapp')}
                    className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                      shareChannel === 'whatsapp'
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-2 ring-emerald-400/50 shadow-md'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Send className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs font-bold">WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShareChannel('email')}
                    className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                      shareChannel === 'email'
                        ? 'bg-sky-500/20 border-sky-400 text-sky-300 ring-2 ring-sky-400/50 shadow-md'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Mail className="w-5 h-5 text-sky-400" />
                    <span className="text-xs font-bold">E-mail</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShareChannel('native')}
                    className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                      shareChannel === 'native'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-2 ring-cyan-400/50 shadow-md'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Share2 className="w-5 h-5 text-cyan-400" />
                    <span className="text-xs font-bold">App / Celular</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShareChannel('copy')}
                    className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                      shareChannel === 'copy'
                        ? 'bg-purple-500/20 border-purple-400 text-purple-300 ring-2 ring-purple-400/50 shadow-md'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Copy className="w-5 h-5 text-purple-400" />
                    <span className="text-xs font-bold">Copiar</span>
                  </button>
                </div>
              </div>

              {/* Channel Input Fields */}
              {shareChannel === 'whatsapp' && (
                <div className="p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 space-y-2">
                  <label className="block text-xs font-bold text-emerald-200">
                    Número do WhatsApp (Opcional):
                  </label>
                  <input
                    type="text"
                    placeholder="DDD + Telefone (ex: 11999999999)"
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-white/20 bg-slate-900 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400"
                  />
                  <p className="text-[11px] text-emerald-300/80">
                    Caso não digite o número, o WhatsApp abrirá para selecionar qualquer contato.
                  </p>
                </div>
              )}

              {shareChannel === 'email' && (
                <div className="p-3.5 rounded-2xl border border-sky-500/30 bg-sky-500/10 space-y-2">
                  <label className="block text-xs font-bold text-sky-200">
                    E-mail do Destinatário (Opcional):
                  </label>
                  <input
                    type="email"
                    placeholder="exemplo@cliente.com"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-white/20 bg-slate-900 text-white placeholder-slate-400 focus:outline-none focus:border-sky-400"
                  />
                  <p className="text-[11px] text-sky-300/80">
                    Abre seu aplicativo padrão de e-mail com o resumo formatado no corpo da mensagem.
                  </p>
                </div>
              )}

              {shareChannel === 'native' && (
                <div className="p-3.5 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-xs text-cyan-200">
                  <p className="font-bold mb-1">Compartilhar via aplicativo móvel / sistema:</p>
                  <p className="text-slate-300 text-[11px]">
                    Usa o menu nativo de compartilhamento do seu dispositivo (disponível em celulares e navegadores compatíveis).
                  </p>
                </div>
              )}

              {shareChannel === 'copy' && (
                <div className="p-3.5 rounded-2xl border border-purple-500/30 bg-purple-500/10 text-xs text-purple-200">
                  <p className="font-bold mb-1">Copiar para Área de Transferência:</p>
                  <p className="text-slate-300 text-[11px]">
                    Copia o resumo formatado do relatório para você colar em qualquer conversa ou documento.
                  </p>
                </div>
              )}

              {/* Live Preview Box */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Prévia da Mensagem Formatada:
                </span>
                <pre className="text-[11px] font-mono text-cyan-200/90 whitespace-pre-wrap max-h-32 overflow-y-auto bg-slate-900/90 p-2.5 rounded-xl border border-white/5 no-scrollbar">
                  {formattedShareText}
                </pre>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-bounce">
              <Check className="w-4 h-4 text-emerald-400" />
              {successMessage}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-900/80 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-white/15 text-slate-300 text-xs font-bold hover:bg-white/10 transition"
          >
            Cancelar
          </button>

          {activeTab === 'download' ? (
            <button
              type="button"
              disabled={isExporting}
              onClick={() => handleExport()}
              className="px-6 py-2.5 rounded-xl bg-cyan-400 text-slate-950 text-xs font-black hover:bg-cyan-300 active:scale-95 transition shadow-lg shadow-cyan-400/20 flex items-center gap-2 disabled:opacity-50"
            >
              {isExporting ? (
                <>Gerando arquivo...</>
              ) : (
                <>
                  <Download className="w-4 h-4" /> Baixar Arquivo
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleExecuteSend}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black hover:bg-emerald-400 active:scale-95 transition shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              <Send className="w-4 h-4 text-slate-950" />
              <span>
                {shareChannel === 'whatsapp' && 'Enviar via WhatsApp'}
                {shareChannel === 'email' && 'Enviar via E-mail'}
                {shareChannel === 'native' && 'Compartilhar'}
                {shareChannel === 'copy' && 'Copiar Texto'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

