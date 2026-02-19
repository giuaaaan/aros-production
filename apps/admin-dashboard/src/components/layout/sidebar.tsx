"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  BarChart3,
  Activity,
  FileText,
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
import { UserMenu } from "./user-menu";
import { CommandPalette } from "@/components/command-palette";

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

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className={cn("flex flex-col h-full bg-card border-r", className)}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
          <Bot className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-none">AROS</h1>
          <p className="text-xs text-muted-foreground">Admin Console</p>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b">
        <CommandPalette className="w-full justify-between" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
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
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Settings className="w-5 h-5" />
          Settings
        </Link>
        <UserMenu />
      </div>
    </div>
  );
}
