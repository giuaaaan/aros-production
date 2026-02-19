"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CommandPalette } from "@/components/command-palette";
import { UserMenu } from "./user-menu";
import {
  Menu,
  X,
  LayoutDashboard,
  Building2,
  BarChart3,
  Activity,
  Settings,
  Bot,
  UserPlus,
  Shield,
  Flag,
  FileBarChart,
  FlaskConical,
  UserCog,
  Palette,
  Key,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Organizations", href: "/organizations", icon: Building2 },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Invites", href: "/invites", icon: UserPlus },
  { name: "Audit Logs", href: "/audit", icon: Shield },
  { name: "System Health", href: "/system", icon: Activity },
  { name: "Feature Flags", href: "/feature-flags", icon: Flag },
  { name: "Reports", href: "/reports", icon: FileBarChart },
  { name: "A/B Testing", href: "/experiments", icon: FlaskConical },
  { name: "Roles", href: "/roles", icon: UserCog },
  { name: "Branding", href: "/branding", icon: Palette },
  { name: "API Keys", href: "/api-keys", icon: Key },
];

export function MobileHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-card border-b sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMenu}
            className="h-9 w-9"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold">AROS</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <CommandPalette />
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={closeMenu}
            />

            {/* Mobile Sidebar Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-card border-r z-50 lg:hidden flex flex-col"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                    <Bot className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="font-bold text-lg leading-none">AROS</h1>
                    <p className="text-xs text-muted-foreground">Admin Console</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeMenu}
                  className="h-9 w-9"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Search */}
              <div className="px-4 py-3 border-b">
                <CommandPalette className="w-full justify-between" />
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                {navigation.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={closeMenu}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              {/* Bottom Section */}
              <div className="p-4 border-t space-y-1">
                <Link
                  href="/settings"
                  onClick={closeMenu}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Settings className="w-5 h-5" />
                  Settings
                </Link>
                <UserMenu />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
