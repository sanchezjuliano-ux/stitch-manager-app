import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { getStoredCompanyConfig } from './logoConfig';

export type ExportFormat = 'excel' | 'pdf' | 'image' | 'txt' | 'json' | 'markdown';

export interface ExportDataPayload {
  title: string;
  subtitle?: string;
  activeFiltersSummary?: string;
  headers: string[];
  rows: (string | number)[][];
  rawItems?: any[];
  totals?: { label: string; value: string | number }[];
  containerId?: string; // HTML element ID for image export
  imageUrl?: string; // Image URL for quote/item photo
  logoUrl?: string; // Custom or stored company logo URL
  companyName?: string;
}

interface ImageResult {
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Loads an image from a URL or base64 string and converts it to a PNG data URL with dimensions for jsPDF / Canvas
 */
const loadImageAsDataUrl = (url: string): Promise<ImageResult | null> => {
  return new Promise((resolve) => {
    if (!url) return resolve(null);

    // If it's already a data URL, return it directly
    if (url.startsWith('data:')) {
      const img = new Image();
      img.onload = () => {
        resolve({
          dataUrl: url,
          width: img.naturalWidth || 300,
          height: img.naturalHeight || 300
        });
      };
      img.onerror = () => resolve({ dataUrl: url, width: 300, height: 300 });
      img.src = url;
      return;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const width = img.naturalWidth || img.width || 300;
        const height = img.naturalHeight || img.height || 300;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve({
            dataUrl: canvas.toDataURL('image/png'),
            width,
            height
          });
        } else {
          resolve({ dataUrl: url, width: 300, height: 300 });
        }
      } catch (e) {
        console.warn('Canvas conversion restricted, falling back to direct URL:', e);
        resolve({ dataUrl: url, width: 300, height: 300 });
      }
    };
    img.onerror = () => {
      console.warn('Could not load image cross-origin, using direct URL fallback');
      resolve({ dataUrl: url, width: 300, height: 300 });
    };
    img.src = url;
  });
};

/**
 * Downloads a blob as a file in browser
 */
const downloadFile = (content: BlobPart, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export to CSV (Excel Compatible with UTF-8 BOM)
 */
export const exportToCsv = (payload: ExportDataPayload, customFilename?: string) => {
  const sanitize = (val: string | number | undefined | null) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  let csvContent = '\uFEFF'; // UTF-8 BOM for Excel
  csvContent += `${payload.title}\n`;
  if (payload.activeFiltersSummary) {
    csvContent += `Filtros Aplicados: ${payload.activeFiltersSummary}\n`;
  }
  csvContent += `Data de Exportação: ${new Date().toLocaleString('pt-BR')}\n\n`;

  // Headers
  csvContent += payload.headers.map(sanitize).join(';') + '\n';

  // Rows
  payload.rows.forEach((row) => {
    csvContent += row.map(sanitize).join(';') + '\n';
  });

  // Totals
  if (payload.totals && payload.totals.length > 0) {
    csvContent += '\n' + payload.totals.map((t) => `${t.label}: ${t.value}`).join(' | ') + '\n';
  }

  const filename = customFilename || `${payload.title.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.csv`;
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
};

/**
 * Export to Formatted Text (TXT)
 */
export const exportToTxt = (payload: ExportDataPayload, customFilename?: string) => {
  let txt = `====================================================\n`;
  txt += `  ${payload.title.toUpperCase()}\n`;
  if (payload.subtitle) txt += `  ${payload.subtitle}\n`;
  txt += `====================================================\n`;
  txt += `Data da exportação: ${new Date().toLocaleString('pt-BR')}\n`;
  if (payload.activeFiltersSummary) {
    txt += `Filtros ativos: ${payload.activeFiltersSummary}\n`;
  }
  txt += `Total de registros: ${payload.rows.length}\n`;
  txt += `----------------------------------------------------\n\n`;

  payload.rows.forEach((row, idx) => {
    txt += `[${idx + 1}] `;
    payload.headers.forEach((h, hIdx) => {
      txt += `${h}: ${row[hIdx] ?? '-'} | `;
    });
    txt = txt.replace(/ \| $/, '') + '\n';
  });

  if (payload.totals && payload.totals.length > 0) {
    txt += `\n----------------------------------------------------\n`;
    txt += `RESUMO / TOTALIZADORES:\n`;
    payload.totals.forEach((t) => {
      txt += `- ${t.label}: ${t.value}\n`;
    });
  }

  const filename = customFilename || `${payload.title.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.txt`;
  downloadFile(txt, filename, 'text/plain;charset=utf-8;');
};

/**
 * Export to Markdown (MD)
 */
export const exportToMarkdown = (payload: ExportDataPayload, customFilename?: string) => {
  let md = `# ${payload.title}\n`;
  if (payload.subtitle) md += `*${payload.subtitle}*\n\n`;
  md += `> **Data de Exportação:** ${new Date().toLocaleString('pt-BR')}\n`;
  if (payload.activeFiltersSummary) {
    md += `> **Filtros Aplicados:** ${payload.activeFiltersSummary}\n`;
  }
  md += `> **Total de Registros:** ${payload.rows.length}\n\n`;

  // Header line
  md += `| ${payload.headers.join(' | ')} |\n`;
  md += `| ${payload.headers.map(() => '---').join(' | ')} |\n`;

  // Row lines
  payload.rows.forEach((row) => {
    md += `| ${row.map((cell) => String(cell ?? '').replace(/\|/g, '\\|')).join(' | ')} |\n`;
  });

  if (payload.totals && payload.totals.length > 0) {
    md += `\n### Totais e Resumos\n`;
    payload.totals.forEach((t) => {
      md += `- **${t.label}:** ${t.value}\n`;
    });
  }

  const filename = customFilename || `${payload.title.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.md`;
  downloadFile(md, filename, 'text/markdown;charset=utf-8;');
};

/**
 * Export to JSON
 */
export const exportToJson = (payload: ExportDataPayload, customFilename?: string) => {
  const jsonObject = {
    titulo: payload.title,
    subtitulo: payload.subtitle,
    dataExportacao: new Date().toISOString(),
    filtros: payload.activeFiltersSummary || 'Nenhum',
    totalRegistros: payload.rows.length,
    colunas: payload.headers,
    totais: payload.totals,
    dados: payload.rawItems || payload.rows.map((row) => {
      const itemObj: Record<string, any> = {};
      payload.headers.forEach((h, idx) => {
        itemObj[h] = row[idx];
      });
      return itemObj;
    })
  };

  const jsonStr = JSON.stringify(jsonObject, null, 2);
  const filename = customFilename || `${payload.title.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.json`;
  downloadFile(jsonStr, filename, 'application/json;charset=utf-8;');
};

/**
 * Export to PDF document using jsPDF & autoTable
 */
export const exportToPdf = async (payload: ExportDataPayload, customFilename?: string) => {
  const companyConfig = getStoredCompanyConfig();
  const logoUrlToUse = payload.logoUrl || companyConfig.logoDataUrl;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let imgInfo: ImageResult | null = null;
  let logoImgInfo: ImageResult | null = null;

  if (payload.imageUrl) {
    imgInfo = await loadImageAsDataUrl(payload.imageUrl);
  }

  if (logoUrlToUse) {
    logoImgInfo = await loadImageAsDataUrl(logoUrlToUse);
  }

  // Title Header with Company Logo
  doc.setFillColor(15, 23, 42); // slate-900 background for header
  doc.rect(0, 0, pageWidth, 36, 'F');

  let textStartX = 14;

  // Draw Logo on PDF Header
  if (logoImgInfo) {
    const logoX = 12;
    const logoY = 3;
    const logoSize = 30;

    // White circle backdrop for logo
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(logoX, logoY, logoSize, logoSize, 15, 15, 'F');
    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(0.6);
    doc.roundedRect(logoX, logoY, logoSize, logoSize, 15, 15, 'S');

    try {
      doc.addImage(logoImgInfo.dataUrl, 'PNG', logoX + 1.5, logoY + 1.5, logoSize - 3, logoSize - 3, undefined, 'FAST');
    } catch (err) {
      console.warn('Could not embed logo in PDF header:', err);
    }
    textStartX = logoX + logoSize + 5;
  }

  // Company Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(56, 189, 248); // cyan-400
  doc.text(payload.companyName || companyConfig.name, textStartX, 12);

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(payload.title, textStartX, 20);

  // Subtitle / Date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(
    `${payload.subtitle ? `${payload.subtitle} • ` : ''}Data: ${new Date().toLocaleString('pt-BR')} ${
      payload.activeFiltersSummary ? `• Filtros: ${payload.activeFiltersSummary}` : ''
    }`,
    textStartX,
    27
  );

  // Right Top Header Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(56, 189, 248);
  doc.text(companyConfig.subtitle, pageWidth - 14, 14, { align: 'right' });
  if (companyConfig.email || companyConfig.phone) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(`${companyConfig.phone ? `Tel: ${companyConfig.phone} ` : ''}${companyConfig.email ? `• ${companyConfig.email}` : ''}`, pageWidth - 14, 22, { align: 'right' });
  }

  // Draw image box if available
  if (imgInfo) {
    const boxX = 222;
    const boxY = 40;
    const boxW = 61;
    const boxH = 61;

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(boxX, boxY, boxW, boxH, 3, 3, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(boxX, boxY, boxW, boxH, 3, 3, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Imagem / Referência:', boxX + 3, boxY + 5.5);

    const maxW = boxW - 6; // 55mm
    const maxH = boxH - 9; // 52mm

    const aspect = imgInfo.width / imgInfo.height;
    let renderW = maxW;
    let renderH = maxW / aspect;

    if (renderH > maxH) {
      renderH = maxH;
      renderW = maxH * aspect;
    }

    const renderX = boxX + 3 + (maxW - renderW) / 2;
    const renderY = boxY + 7 + (maxH - renderH) / 2;

    try {
      doc.addImage(imgInfo.dataUrl, 'PNG', renderX, renderY, renderW, renderH, undefined, 'FAST');
    } catch (err) {
      console.warn('Could not embed image in PDF:', err);
    }
  }

  // Render Table with autoTable for optimal auto-column sizing & clean text wrapping
  autoTable(doc, {
    startY: 40,
    head: [payload.headers],
    body: payload.rows.map((row) =>
      row.map((cell) => (cell !== undefined && cell !== null && String(cell).trim() !== '' ? String(cell) : '-'))
    ),
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      cellPadding: 3,
      overflow: 'linebreak',
      textColor: [30, 41, 59],
      valign: 'middle',
      minCellHeight: 7
    },
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: [56, 189, 248], // cyan-400
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: 3.5,
      halign: 'left'
    },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [241, 245, 249], cellWidth: imgInfo ? 65 : 75 },
      1: { overflow: 'linebreak' }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: 14, right: imgInfo ? 80 : 14, top: 15, bottom: 15 },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, pageWidth, 12, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(`${payload.title} (Página ${data.pageNumber})`, 14, 8);
      }
    }
  });

  // Totals banner
  if (payload.totals && payload.totals.length > 0) {
    const finalY = (doc as any).lastAutoTable?.finalY || 40;
    let y = finalY + 6;

    if (y > 185) {
      doc.addPage();
      y = 15;
    }

    doc.setFillColor(224, 242, 254);
    doc.rect(14, y, pageWidth - 28, 10, 'F');
    doc.setDrawColor(186, 230, 253);
    doc.rect(14, y, pageWidth - 28, 10, 'S');
    doc.setTextColor(3, 105, 161);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);

    const totalsStr = payload.totals.map((t) => `${t.label}: ${t.value}`).join('   |   ');
    doc.text(totalsStr, 18, y + 6.5);
  }

  const filename = customFilename || `${payload.title.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.pdf`;
  doc.save(filename);
};

/**
 * Export to Image (PNG) using html2canvas or creating a rendered visual frame
 */
export const exportToImage = async (payload: ExportDataPayload, customFilename?: string) => {
  const companyConfig = getStoredCompanyConfig();
  const logoUrlToUse = payload.logoUrl || companyConfig.logoDataUrl;

  // If a container element ID is provided and exists, capture it directly
  if (payload.containerId) {
    const el = document.getElementById(payload.containerId);
    if (el) {
      try {
        const canvas = await html2canvas(el, {
          backgroundColor: '#0f172a',
          scale: 2,
          useCORS: true,
          logging: false
        });
        const imgData = canvas.toDataURL('image/png');
        const filename = customFilename || `${payload.title.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.png`;
        const link = document.createElement('a');
        link.href = imgData;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      } catch (err) {
        console.warn('html2canvas container capture error, falling back to dynamic rendering:', err);
      }
    }
  }

  // Calculate dynamic card width based on number of columns so columns have plenty of horizontal space
  const colCount = Math.max(1, payload.headers.length);
  const dynamicWidth = Math.max(1100, colCount * 220);

  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'fixed';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '-9999px';
  tempDiv.style.width = `${dynamicWidth}px`;
  tempDiv.style.padding = '32px';
  tempDiv.style.background = 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)';
  tempDiv.style.color = '#ffffff';
  tempDiv.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  tempDiv.style.borderRadius = '24px';
  tempDiv.style.border = '1px solid rgba(255, 255, 255, 0.15)';
  tempDiv.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.5)';
  tempDiv.style.boxSizing = 'border-box';

  let innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid rgba(56,189,248,0.3); padding-bottom:18px; margin-bottom:20px; gap:20px;">
      <div style="display:flex; align-items:center; gap:16px;">
        ${logoUrlToUse ? `
          <div style="width:76px; height:76px; shrink:0; border-radius:50%; background:#ffffff; border:3px solid #dc2626; padding:3px; box-shadow:0 6px 16px rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; overflow:hidden;">
            <img src="${logoUrlToUse}" style="width:100%; height:100%; object-fit:contain; border-radius:50%;" />
          </div>
        ` : ''}
        <div>
          <span style="font-size:11px; font-weight:800; color:#38bdf8; text-transform:uppercase; letter-spacing:1px; display:block;">${payload.companyName || companyConfig.name}</span>
          <h1 style="font-size:22px; font-weight:900; margin:2px 0; color:#ffffff; tracking-tight:-0.02em;">${payload.title}</h1>
          ${payload.subtitle ? `<p style="font-size:12px; color:#cbd5e1; margin:2px 0 0 0; font-weight:600;">${payload.subtitle}</p>` : ''}
          <p style="font-size:10px; color:#94a3b8; margin:2px 0 0 0;">${companyConfig.subtitle} • Data: ${new Date().toLocaleString('pt-BR')}</p>
        </div>
      </div>
      
      ${payload.imageUrl ? `
        <div style="text-align:center; shrink:0; background:rgba(15,23,42,0.8); padding:8px; border-radius:16px; border:1px solid rgba(56,189,248,0.3);">
          <img src="${payload.imageUrl}" style="max-width:180px; max-height:180px; object-fit:contain; border-radius:12px; display:block;" />
          <span style="font-size:10px; color:#38bdf8; font-weight:700; margin-top:4px; display:block;">Imagem / Referência</span>
        </div>
      ` : `
        <div style="text-align:right;">
          <span style="font-size:11px; background:rgba(56,189,248,0.15); color:#38bdf8; border:1px solid rgba(56,189,248,0.3); padding:4px 10px; border-radius:12px; font-weight:700;">
            ${payload.rows.length} itens
          </span>
          <p style="font-size:10px; color:#94a3b8; margin:4px 0 0 0;">${new Date().toLocaleString('pt-BR')}</p>
        </div>
      `}
    </div>
  `;

  if (payload.activeFiltersSummary) {
    innerHTML += `
      <div style="background:rgba(255,255,255,0.05); padding:10px 14px; border-radius:12px; font-size:12px; margin-bottom:20px; color:#cbd5e1; border:1px solid rgba(255,255,255,0.08);">
        <strong style="color:#22d3ee;">Filtros Aplicados:</strong> ${payload.activeFiltersSummary}
      </div>
    `;
  }

  // Table with explicit cell width, white-space wrapping and no overflow overlap
  innerHTML += `
    <table style="width:100%; border-collapse:collapse; font-size:13px; text-align:left; table-layout:auto;">
      <thead>
        <tr style="background:#1e293b; color:#38bdf8;">
          ${payload.headers
            .map(
              (h) =>
                `<th style="padding:12px 14px; border-bottom:2px solid rgba(255,255,255,0.2); font-weight:800; text-transform:none; white-space:normal; word-break:break-word; overflow-wrap:anywhere;">${h}</th>`
            )
            .join('')}
        </tr>
      </thead>
      <tbody>
        ${payload.rows
          .map(
            (row, idx) => `
          <tr style="background:${idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.06)'};">
            ${row
              .map(
                (cell, cellIdx) => {
                  const cellText = cell !== undefined && cell !== null && String(cell).trim() !== '' ? String(cell).replace(/\n/g, '<br/>') : '-';
                  const isLabelCol = cellIdx === 0;
                  return `<td style="padding:10px 14px; border-bottom:1px solid rgba(255,255,255,0.08); color:${isLabelCol ? '#38bdf8' : '#e2e8f0'}; font-weight:${isLabelCol ? '800' : '500'}; white-space:normal; word-break:break-word; overflow-wrap:anywhere; vertical-align:top; line-height:1.5;">${cellText}</td>`;
                }
              )
              .join('')}
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  `;

  if (payload.totals && payload.totals.length > 0) {
    innerHTML += `
      <div style="margin-top:20px; padding:14px 20px; background:rgba(34,211,238,0.12); border:1px solid rgba(34,211,238,0.35); border-radius:14px; display:flex; flex-wrap:wrap; gap:24px; font-size:14px; font-weight:800; color:#67e8f9;">
        ${payload.totals.map((t) => `<div>${t.label}: <span style="color:#ffffff;">${t.value}</span></div>`).join('')}
      </div>
    `;
  }

  tempDiv.innerHTML = innerHTML;
  document.body.appendChild(tempDiv);

  try {
    const canvas = await html2canvas(tempDiv, {
      backgroundColor: null,
      scale: 2,
      useCORS: true,
      logging: false
    });
    const imgData = canvas.toDataURL('image/png');
    const filename = customFilename || `${payload.title.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.png`;
    const link = document.createElement('a');
    link.href = imgData;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    document.body.removeChild(tempDiv);
  }
};

/**
 * Generates a clean, formatted text representation for messaging apps & emails
 */
export const generateFormattedShareText = (payload: ExportDataPayload): string => {
  const companyConfig = getStoredCompanyConfig();
  const compName = payload.companyName || companyConfig.name;

  let text = `🧵 *${compName.toUpperCase()}*\n`;
  if (companyConfig.subtitle) text += `_${companyConfig.subtitle}_\n`;
  text += `------------------------------------\n`;
  text += `📌 *${payload.title.toUpperCase()}*\n`;
  if (payload.subtitle) text += `_${payload.subtitle}_\n`;
  text += `📅 *Data:* ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n\n`;

  text += `📋 *DETALHES DO ORÇAMENTO:*\n`;
  payload.rows.forEach(([label, value]) => {
    if (value && String(value).trim() !== '' && String(value) !== '-') {
      const valStr = String(value);
      if (valStr.includes('\n')) {
        text += `• *${label}:*\n${valStr}\n`;
      } else {
        text += `• *${label}:* ${valStr}\n`;
      }
    }
  });

  if (payload.imageUrl) {
    text += `\n🖼️ *Imagem de Referência / Matriz:* ${payload.imageUrl}\n`;
  }

  if (payload.totals && payload.totals.length > 0) {
    text += `\n💰 *VALOR TOTAL:*\n`;
    payload.totals.forEach((t) => {
      text += `• *${t.label}:* ${t.value}\n`;
    });
  }

  text += `\n_Gerado via Gestão Ateliê de Bordados_`;
  return text;
};

/**
 * Share formatted report via WhatsApp API/Web
 */
export const shareToWhatsapp = (payload: ExportDataPayload, phoneNumber?: string) => {
  const formattedText = generateFormattedShareText(payload);
  const encodedText = encodeURIComponent(formattedText);
  const cleanPhone = phoneNumber ? phoneNumber.replace(/\D/g, '') : '';
  const url = cleanPhone
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;
  window.open(url, '_blank');
};

/**
 * Share via email client (mailto:)
 */
export const shareToEmail = (payload: ExportDataPayload, recipientEmail?: string) => {
  const formattedText = generateFormattedShareText(payload);
  const subject = encodeURIComponent(`${payload.title} - Ateliê de Bordados`);
  const body = encodeURIComponent(formattedText);
  const email = recipientEmail ? recipientEmail.trim() : '';
  window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
};

/**
 * Native sharing via Web Share API
 */
export const shareViaNativeApi = async (payload: ExportDataPayload): Promise<boolean> => {
  const text = generateFormattedShareText(payload);
  if (navigator.share) {
    try {
      await navigator.share({
        title: payload.title,
        text: text
      });
      return true;
    } catch (err) {
      console.warn('Native share cancelled or failed:', err);
      return false;
    }
  }
  return false;
};
