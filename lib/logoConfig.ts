'use client';

export interface CompanyLogoConfig {
  name: string;
  subtitle: string;
  logoDataUrl: string;
  phone?: string;
  email?: string;
  address?: string;
}

// Convert Google Drive view links to direct high-res image link
export const parseGoogleDriveDirectUrl = (url: string): string => {
  if (!url) return url;
  if (url.includes('drive.google.com') || url.includes('google.com/file/d/')) {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://lh3.googleusercontent.com/d/${match[1]}`;
    }
  }
  return url;
};

// Exact logo URL provided by the user via Google Drive: https://drive.google.com/file/d/1uJDJqwKtR9xlQgvPP1lRA8G2xcSEjtDe/view
export const DEFAULT_SANCHEZ_LOGO_URL = 'https://lh3.googleusercontent.com/d/1uJDJqwKtR9xlQgvPP1lRA8G2xcSEjtDe';
export const DEFAULT_SANCHEZ_LOGO_SVG = DEFAULT_SANCHEZ_LOGO_URL;

export const DEFAULT_COMPANY_CONFIG: CompanyLogoConfig = {
  name: 'SANCHEZ com Z Bordados',
  subtitle: 'Desde 2016 • Ateliê de Bordados Computadorizados',
  logoDataUrl: DEFAULT_SANCHEZ_LOGO_URL,
  phone: '(11) 99999-9999',
  email: 'sanchez.bordados@gmail.com'
};

const LOGO_STORAGE_KEY = 'sanchez_company_logo_config_v5';

export const getStoredCompanyConfig = (): CompanyLogoConfig => {
  if (typeof window === 'undefined') return DEFAULT_COMPANY_CONFIG;
  try {
    const saved = localStorage.getItem(LOGO_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_COMPANY_CONFIG,
        ...parsed,
        logoDataUrl: parseGoogleDriveDirectUrl(parsed.logoDataUrl || DEFAULT_SANCHEZ_LOGO_URL)
      };
    }
  } catch (e) {
    console.warn('Could not read stored company config:', e);
  }
  return DEFAULT_COMPANY_CONFIG;
};

export const saveCompanyConfig = (config: Partial<CompanyLogoConfig>): CompanyLogoConfig => {
  const current = getStoredCompanyConfig();
  const processedConfig = {
    ...config,
    logoDataUrl: config.logoDataUrl ? parseGoogleDriveDirectUrl(config.logoDataUrl) : current.logoDataUrl
  };
  const updated = { ...current, ...processedConfig };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOGO_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('company-config-updated', { detail: updated }));
    } catch (e) {
      console.warn('Could not save company config:', e);
    }
  }
  return updated;
};
