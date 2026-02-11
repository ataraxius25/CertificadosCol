import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from '@/components/ui/ToastContext';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const viewport: Viewport = {
  themeColor: "#3B82F6",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: "Buscador de Certificados | Sistema de Verificación Académica",
  description: "Verifica y descarga tus certificados académicos de forma rápida y segura mediante tu número de documento.",
  keywords: ["certificados", "verificación académica", "descargar certificado", "estudiante"],
  authors: [{ name: "Tecnonets", url: "https://www.tecnonets.com" }],
  openGraph: {
    title: "Buscador de Certificados | Sistema de Verificación Académica",
    description: "Verifica y descarga tus certificados académicos de forma rápida y segura.",
    type: "website",
    locale: "es_CO",
    siteName: "Sistema de Certificados",
    images: [
      {
        url: "/og-image.png", // Sugerencia para el usuario de colocar imagen real
        width: 1200,
        height: 630,
        alt: "Sistema de Verificación de Certificados Académicos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Buscador de Certificados | Verificación Online",
    description: "Consulta tus certificados oficiales de forma instantánea.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-slate-50 text-slate-900`} suppressHydrationWarning>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
