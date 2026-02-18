"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Input } from "./input";
import {
  Home,
  Wrench,
  Users,
  Package,
  BarChart3,
  Search,
  Command,
  Menu,
  X,
  ChevronRight,
  Moon,
  Sun,
} from "lucide-react";

/**
 * AROS Navigation System
 * 
 * Key Principles:
 * - 5 main navigation items max (3-click rule)
 * - Command palette (Cmd+K) for power users
 * - Breadcrumbs for deep navigation
 * - Mobile-optimized with touch targets
 * 
 * Navigation Items:
 * 1. Home (Dashboard)
 * 2. Lavoro (Work Orders)
 * 3. Clienti (Customers)
 * 4. Magazzino (Inventory)
 * 5. Analisi (Analytics)
 */

// Main navigation items - Max 5 per guidelines
const mainNavItems = [
  { 
    href: "/dashboard", 
    label: "Home", 
    icon: Home,
    description: "Dashboard principale"
  },
  { 
    href: "/gestionale", 
    label: "Lavoro", 
    icon: Wrench,
    description: "Ordini e schede lavoro"
  },
  { 
    href: "/clienti", 
    label: "Clienti", 
    icon: Users,
    description: "Gestione clienti"
  },
  { 
    href: "/magazzino", 
    label: "Magazzino", 
    icon: Package,
    description: "Ricambi e inventario"
  },
  { 
    href: "/analisi", 
    label: "Analisi", 
    icon: BarChart3,
    description: "Report e statistiche"
  },
];

interface NavigationProps {
  userName?: string;
  orgName?: string;
  onSignOut?: () => void;
}

function Navigation({ userName, orgName, onSignOut }: NavigationProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [darkMode, setDarkMode] = React.useState(false);

  // Command palette keyboard shortcut
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen(true);
      }
      if (e.key === "Escape") {
        setCommandOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Dark mode toggle
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <>
      {/* Desktop Navigation */}
      <header className="sticky top-0 z-40 w-full border-b bg-white/95 dark:bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-950/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Wrench className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-xl hidden sm:block">AROS</span>
              </Link>
              
              {/* Desktop Nav Items */}
              <nav className="hidden md:flex items-center gap-1 ml-6">
                {mainNavItems.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right Section: Command Palette + User */}
            <div className="flex items-center gap-2">
              {/* Command Palette Trigger */}
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex items-center gap-2 text-slate-500"
                onClick={() => setCommandOpen(true)}
              >
                <Search className="h-4 w-4" />
                <span className="text-sm">Cerca...</span>
                <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded border bg-slate-100 dark:bg-slate-800 px-1.5 font-mono text-[10px] font-medium">
                  <Command className="h-3 w-3" />
                  <span>K</span>
                </kbd>
              </Button>

              {/* Dark Mode Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="hidden sm:flex"
                onClick={toggleDarkMode}
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

              {/* User Menu */}
              {userName && (
                <div className="hidden sm:flex items-center gap-3 pl-4 border-l">
                  <div className="text-right">
                    <p className="text-sm font-medium">{userName}</p>
                    {orgName && <p className="text-xs text-slate-500">{orgName}</p>}
                  </div>
                </div>
              )}

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Breadcrumbs */}
        {pathname && pathname !== "/dashboard" && (
          <div className="border-t bg-slate-50/50 dark:bg-slate-900/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
              <Breadcrumbs pathname={pathname} />
            </div>
          </div>
        )}
      </header>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div 
            className="fixed inset-0 bg-black/50" 
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed top-0 left-0 right-0 bg-white dark:bg-slate-950 border-b animate-in">
            <div className="px-4 py-4">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-lg">Menu</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
              <nav className="space-y-1">
                {mainNavItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-4 rounded-lg text-base font-medium transition-colors min-h-[56px]",
                        isActive
                          ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <div>
                        <div>{item.label}</div>
                        <div className="text-xs text-slate-400 font-normal">{item.description}</div>
                      </div>
                    </Link>
                  );
                })}
              </nav>
              
              {/* Mobile User Section */}
              {userName && (
                <div className="mt-4 pt-4 border-t">
                  <div className="px-4 py-2">
                    <p className="font-medium">{userName}</p>
                    {orgName && <p className="text-sm text-slate-500">{orgName}</p>}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-2"
                    onClick={onSignOut}
                  >
                    Esci
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Command Palette Modal */}
      {commandOpen && (
        <CommandPalette
          onClose={() => setCommandOpen(false)}
          navItems={mainNavItems}
        />
      )}
    </>
  );
}

/**
 * Breadcrumbs Component - 3-Click Rule Support
 */
function Breadcrumbs({ pathname }: { pathname: string }) {
  const segments = pathname.split("/").filter(Boolean);
  
  const getSegmentLabel = (segment: string) => {
    const labels: Record<string, string> = {
      dashboard: "Dashboard",
      gestionale: "Gestionale",
      clienti: "Clienti",
      magazzino: "Magazzino",
      analisi: "Analisi",
      ordini: "Ordini",
      nuovo: "Nuovo",
      modifica: "Modifica",
    };
    return labels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  return (
    <nav className="flex items-center gap-2 text-sm">
      <Link 
        href="/dashboard" 
        className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
      >
        Home
      </Link>
      {segments.map((segment, index) => {
        const href = "/" + segments.slice(0, index + 1).join("/");
        const isLast = index === segments.length - 1;
        
        return (
          <React.Fragment key={segment}>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            {isLast ? (
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {getSegmentLabel(segment)}
              </span>
            ) : (
              <Link 
                href={href}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                {getSegmentLabel(segment)}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

/**
 * Command Palette - Quick Navigation for Power Users
 */
interface CommandPaletteProps {
  onClose: () => void;
  navItems: typeof mainNavItems;
}

function CommandPalette({ onClose, navItems }: CommandPaletteProps) {
  const [search, setSearch] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filteredItems = navItems.filter(item =>
    item.label.toLowerCase().includes(search.toLowerCase()) ||
    item.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-[20vh]"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-2xl border overflow-hidden animate-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Search className="h-5 w-5 text-slate-400" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Cerca pagine, comandi..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border bg-slate-100 dark:bg-slate-800 px-2 font-mono text-xs">
            ESC
          </kbd>
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">
              Nessun risultato trovato
            </p>
          ) : (
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 px-2 py-1">Navigazione</p>
              {filteredItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-4 px-4 py-2 border-t bg-slate-50 dark:bg-slate-950 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <kbd className="font-mono bg-white dark:bg-slate-900 border rounded px-1">↑↓</kbd>
            <span>Naviga</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="font-mono bg-white dark:bg-slate-900 border rounded px-1">↵</kbd>
            <span>Seleziona</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Navigation, Breadcrumbs, CommandPalette, mainNavItems };
export type { NavigationProps };
