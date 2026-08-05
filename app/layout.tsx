import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'StitchManager - Gestão de Ateliê de Bordados',
  description: 'Sistema completo de gestão de orçamentos, ordens de serviço, clientes, estoque e financeiro para ateliê de bordados.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="notranslate" translate="no">
      <head>
        <meta name="google" content="notranslate" />
      </head>
      <body suppressHydrationWarning className="notranslate" translate="no">
        {children}
      </body>
    </html>
  );
}
