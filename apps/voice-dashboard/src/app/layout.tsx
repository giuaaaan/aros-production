import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SupabaseProvider } from "@/components/providers/supabase-provider";

/**
 * AROS Voice Dashboard - Root Layout
 * 
 * Features:
 * - Inter font family for modern typography
 * - Dark mode support with class strategy
 * - Responsive viewport settings
 * - PWA-ready meta tags
 */

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "AROS Voice - AI per Officine",
  description: "La segretaria AI che non si ammala mai. Gestisci le chiamate e gli appuntamenti della tua officina 24/7.",
  keywords: ["officina", "AI", "gestionale", "automotive", "appuntamenti", "voice"],
  authors: [{ name: "AROS" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "AROS Voice - AI per Officine",
    description: "La segretaria AI che non si ammala mai",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <SupabaseProvider>
          {children}
        </SupabaseProvider>
      </body>
    </html>
  );
}
