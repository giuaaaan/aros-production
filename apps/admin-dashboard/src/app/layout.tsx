import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SentryErrorBoundary } from "@/components/error/sentry-error-boundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AROS Admin Console",
  description: "Admin dashboard for AROS Voice platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <SentryErrorBoundary>
          {children}
        </SentryErrorBoundary>
      </body>
    </html>
  );
}
