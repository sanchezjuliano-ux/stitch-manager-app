'use client';

import React, { useState } from 'react';
import { Link, Upload, Image as ImageIcon, X, Check, ExternalLink } from 'lucide-react';

interface ImageUploadOrLinkProps {
  label?: string;
  value?: string;
  onChange: (url: string) => void;
  placeholder?: string;
  suggestedImages?: { label: string; url: string }[];
}

export const ImageUploadOrLink: React.FC<ImageUploadOrLinkProps> = ({
  label = 'Imagem ou Link Direto',
  value,
  onChange,
  placeholder = 'Cole a URL da imagem (http://... ou https://...)',
  suggestedImages = [
    {
      label: 'Linha Azul',
      url: 'https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?w=600&auto=format&fit=crop&q=80',
    },
    {
      label: 'Linha Dourada',
      url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80',
    },
    {
      label: 'Matriz Bordado',
      url: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=600&auto=format&fit=crop&q=80',
    },
    {
      label: 'Tecido / Entretela',
      url: 'https://images.unsplash.com/photo-1528458876861-544fd1761a91?w=600&auto=format&fit=crop&q=80',
    }
  ]
}) => {
  const [mode, setMode] = useState<'link' | 'upload'>('link');
  const [inputUrl, setInputUrl] = useState(value || '');

  const handleApplyLink = () => {
    if (inputUrl.trim()) {
      onChange(inputUrl.trim());
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            const img = new Image();
            img.src = reader.result;
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const MAX_WIDTH = 800;
              const MAX_HEIGHT = 800;
              let width = img.width;
              let height = img.height;

              if (width > height) {
                if (width > MAX_WIDTH) {
                  height = Math.round((height * MAX_WIDTH) / width);
                  width = MAX_WIDTH;
                }
              } else {
                if (height > MAX_HEIGHT) {
                  width = Math.round((width * MAX_HEIGHT) / height);
                  height = MAX_HEIGHT;
                }
              }

              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
                onChange(compressedDataUrl);
              } else if (typeof reader.result === 'string') {
                onChange(reader.result);
              }
            };
            img.onerror = () => {
              if (typeof reader.result === 'string') {
                onChange(reader.result);
              }
            };
          }
        };
        reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            onChange(reader.result.length > 300000 ? `https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=600&auto=format&fit=crop&q=80` : reader.result);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  return (
    <div className="w-full space-y-2">
      {label && <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">{label}</label>}

      {value ? (
        <div className="relative group rounded-xl border border-slate-200 bg-slate-50 p-2 flex items-center gap-3">
          <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-300 bg-white shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Preview" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-800 truncate">{value}</p>
            <p className="text-[11px] text-emerald-6-00 text-emerald-600 flex items-center gap-1 mt-0.5">
              <Check className="w-3 h-3" /> Imagem carregada
            </p>
          </div>
          <div className="flex gap-1">
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition"
              title="Abrir imagem em nova aba"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={() => {
                setInputUrl('');
                onChange('');
              }}
              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
              title="Remover imagem"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 space-y-3">
          <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-2">
            <span className="font-semibold text-slate-700">Adicionar Imagem / Matriz</span>
            <div className="flex gap-1 bg-slate-200/60 p-0.5 rounded-lg text-[11px]">
              <button
                type="button"
                onClick={() => setMode('link')}
                className={`px-2 py-0.5 rounded-md font-medium transition ${
                  mode === 'link' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                <Link className="w-3 h-3 inline mr-1" /> Link URL
              </button>
              <button
                type="button"
                onClick={() => setMode('upload')}
                className={`px-2 py-0.5 rounded-md font-medium transition ${
                  mode === 'upload' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                <Upload className="w-3 h-3 inline mr-1" /> Arquivo Local
              </button>
            </div>
          </div>

          {mode === 'link' ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder={placeholder}
                  className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#050077]/20 focus:border-[#050077]"
                />
                <button
                  type="button"
                  onClick={handleApplyLink}
                  className="px-3 py-2 bg-[#050077] text-white text-xs font-semibold rounded-lg hover:bg-[#050077]/90 transition"
                >
                  Usar Link
                </button>
              </div>

              {suggestedImages && suggestedImages.length > 0 && (
                <div className="pt-1">
                  <span className="text-[11px] text-slate-500 block mb-1">Sugestões rápidas:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestedImages.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setInputUrl(s.url);
                          onChange(s.url);
                        }}
                        className="text-[11px] px-2 py-1 bg-white hover:bg-slate-200 border border-slate-200 rounded-md text-slate-700 flex items-center gap-1 transition"
                      >
                        <ImageIcon className="w-3 h-3 text-[#050077]" />
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-2">
              <label className="cursor-pointer block border-2 border-dashed border-slate-300 hover:border-[#050077] rounded-lg p-4 bg-white transition group">
                <Upload className="w-6 h-6 text-slate-400 group-hover:text-[#050077] mx-auto mb-1 transition" />
                <span className="text-xs font-semibold text-slate-700 block">Clique para selecionar imagem ou arquivo</span>
                <span className="text-[11px] text-slate-400 block mt-0.5">Formatos suportados: PNG, JPG, WEBP, DST, PES</span>
                <input
                  type="file"
                  accept="image/*,.dst,.pes"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
