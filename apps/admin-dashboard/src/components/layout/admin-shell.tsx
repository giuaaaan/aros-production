"use client";

import { Sidebar } from "./sidebar";
import { CommandPalette } from "@/components/command-palette";
import { MobileHeader } from "./mobile-header";

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - Desktop */}
      <Sidebar className="hidden lg:flex w-64 flex-shrink-0" />
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <MobileHeader />
        
        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>

      {/* Global Command Palette (for mobile keyboard access) */}
      <div className="fixed bottom-4 right-4 lg:hidden z-40">
        <CommandPalette />
      </div>
    </div>
  );
}
