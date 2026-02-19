"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Building2,
  BarChart3,
  Activity,
  Shield,
  Settings,
  UserPlus,
  Search,
  Command as CommandIcon,
  LogOut,
  Moon,
  Sun,
  FileText,
  Users,
  Key,
  Bell,
  HelpCircle,
  Flag,
  FileBarChart,
  FlaskConical,
  UserCog,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandPaletteProps {
  className?: string;
}

interface CommandItem {
  id: string;
  name: string;
  shortcut?: string;
  icon: React.ReactNode;
  onSelect?: () => void;
  href?: string;
  section: string;
}

export function CommandPalette({ className }: CommandPaletteProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [isDark, setIsDark] = React.useState(true);

  // Toggle theme
  const toggleTheme = React.useCallback(() => {
    setIsDark((prev) => !prev);
    document.documentElement.classList.toggle("dark");
  }, []);

  // Command items
  const commands: CommandItem[] = React.useMemo(
    () => [
      // Navigation - Dashboard
      {
        id: "dashboard",
        name: "Dashboard Overview",
        shortcut: "G D",
        icon: <LayoutDashboard className="w-4 h-4" />,
        href: "/dashboard",
        section: "Navigation",
      },
      {
        id: "organizations",
        name: "Organizations",
        shortcut: "G O",
        icon: <Building2 className="w-4 h-4" />,
        href: "/organizations",
        section: "Navigation",
      },
      {
        id: "analytics",
        name: "Analytics",
        shortcut: "G A",
        icon: <BarChart3 className="w-4 h-4" />,
        href: "/analytics",
        section: "Navigation",
      },
      {
        id: "invites",
        name: "Invites",
        shortcut: "G I",
        icon: <UserPlus className="w-4 h-4" />,
        href: "/invites",
        section: "Navigation",
      },
      {
        id: "audit",
        name: "Audit Logs",
        shortcut: "G L",
        icon: <Shield className="w-4 h-4" />,
        href: "/audit",
        section: "Navigation",
      },
      {
        id: "system",
        name: "System Health",
        shortcut: "G S",
        icon: <Activity className="w-4 h-4" />,
        href: "/system",
        section: "Navigation",
      },
      {
        id: "feature-flags",
        name: "Feature Flags",
        icon: <Flag className="w-4 h-4" />,
        href: "/feature-flags",
        section: "Navigation",
      },
      {
        id: "reports",
        name: "Reports",
        icon: <FileBarChart className="w-4 h-4" />,
        href: "/reports",
        section: "Navigation",
      },
      {
        id: "experiments",
        name: "A/B Testing",
        icon: <FlaskConical className="w-4 h-4" />,
        href: "/experiments",
        section: "Navigation",
      },
      {
        id: "roles",
        name: "Role Management",
        icon: <UserCog className="w-4 h-4" />,
        href: "/roles",
        section: "Navigation",
      },
      {
        id: "branding",
        name: "White-Label Branding",
        icon: <Palette className="w-4 h-4" />,
        href: "/branding",
        section: "Navigation",
      },
      {
        id: "settings",
        name: "Settings",
        shortcut: "G ,",
        icon: <Settings className="w-4 h-4" />,
        href: "/settings",
        section: "Navigation",
      },

      // Actions
      {
        id: "toggle-theme",
        name: "Toggle Theme",
        shortcut: "T",
        icon: isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />,
        onSelect: toggleTheme,
        section: "Actions",
      },
      {
        id: "new-organization",
        name: "New Organization",
        shortcut: "N O",
        icon: <Building2 className="w-4 h-4" />,
        href: "/organizations/new",
        section: "Actions",
      },
      {
        id: "new-invite",
        name: "New Invite",
        shortcut: "N I",
        icon: <UserPlus className="w-4 h-4" />,
        href: "/invites/new",
        section: "Actions",
      },
      {
        id: "view-logs",
        name: "View System Logs",
        icon: <FileText className="w-4 h-4" />,
        href: "/audit",
        section: "Actions",
      },
      {
        id: "notifications",
        name: "Notifications",
        icon: <Bell className="w-4 h-4" />,
        href: "/settings/notifications",
        section: "Actions",
      },

      // Help
      {
        id: "help",
        name: "Help & Documentation",
        icon: <HelpCircle className="w-4 h-4" />,
        href: "/docs",
        section: "Help",
      },
      {
        id: "keyboard-shortcuts",
        name: "Keyboard Shortcuts",
        icon: <Key className="w-4 h-4" />,
        onSelect: () => {
          setOpen(true);
          // Could open a shortcuts modal here
        },
        section: "Help",
      },

      // Account
      {
        id: "profile",
        name: "Profile Settings",
        icon: <Users className="w-4 h-4" />,
        href: "/settings/profile",
        section: "Account",
      },
      {
        id: "logout",
        name: "Log Out",
        icon: <LogOut className="w-4 h-4" />,
        href: "/logout",
        section: "Account",
      },
    ],
    [isDark, toggleTheme]
  );

  // Handle keyboard shortcut (Cmd+K / Ctrl+K)
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }

      // Navigation shortcuts
      if (!open) {
        if (e.key === "g" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          // Wait for next key
          const handleNextKey = (ev: KeyboardEvent) => {
            switch (ev.key.toLowerCase()) {
              case "d":
                router.push("/dashboard");
                break;
              case "o":
                router.push("/organizations");
                break;
              case "a":
                router.push("/analytics");
                break;
              case "i":
                router.push("/invites");
                break;
              case "l":
                router.push("/audit");
                break;
              case "s":
                router.push("/system");
                break;
              case ",":
                router.push("/settings");
                break;
            }
            document.removeEventListener("keydown", handleNextKey);
          };
          document.addEventListener("keydown", handleNextKey, { once: true });
        }
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, router]);

  // Handle command selection
  const handleSelect = React.useCallback(
    (item: CommandItem) => {
      if (item.onSelect) {
        item.onSelect();
      } else if (item.href) {
        router.push(item.href);
      }
      setOpen(false);
      setSearch("");
    },
    [router]
  );

  // Group commands by section
  const groupedCommands = React.useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    commands.forEach((cmd) => {
      if (!groups[cmd.section]) {
        groups[cmd.section] = [];
      }
      groups[cmd.section].push(cmd);
    });
    return groups;
  }, [commands]);

  return (
    <>
      {/* Keyboard shortcut indicator */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "hidden lg:flex items-center gap-2 px-2 py-1.5 rounded-md",
          "text-xs text-muted-foreground bg-muted/50 hover:bg-muted",
          "border border-border/50 transition-colors",
          className
        )}
      >
        <Search className="w-3.5 h-3.5" />
        <span>Search</span>
        <kbd className="hidden xl:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-muted font-mono text-[10px] border">
          <CommandIcon className="w-2.5 h-2.5" />
          <span>K</span>
        </kbd>
      </button>

      {/* Command Palette Modal */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Command Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="relative w-full max-w-xl mx-4 overflow-hidden rounded-xl border bg-card shadow-2xl"
            >
              <Command
                value={search}
                onValueChange={setSearch}
                className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
              >
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b">
                  <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <Command.Input
                    placeholder="Type a command or search..."
                    className="flex-1 bg-transparent border-0 outline-none placeholder:text-muted-foreground text-sm h-6"
                    autoFocus
                  />
                  {search && (
                    <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded bg-muted font-mono text-[10px] border">
                      ESC
                    </kbd>
                  )}
                </div>

                {/* Command List */}
                <Command.List className="max-h-[50vh] overflow-y-auto p-2">
                  <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                    No results found for &quot;{search}&quot;
                  </Command.Empty>

                  {Object.entries(groupedCommands).map(([section, items]) => (
                    <Command.Group
                      key={section}
                      heading={section}
                      className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground/80 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider"
                    >
                      {items.map((item) => (
                        <Command.Item
                          key={item.id}
                          value={`${item.section} ${item.name}`}
                          onSelect={() => handleSelect(item)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer select-none transition-colors data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary"
                        >
                          <span className="flex items-center justify-center w-8 h-8 rounded-md bg-muted text-muted-foreground group-data-[selected=true]:bg-primary/20 group-data-[selected=true]:text-primary">
                            {item.icon}
                          </span>
                          <span className="flex-1 text-sm font-medium">
                            {item.name}
                          </span>
                          {item.shortcut && (
                            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-muted font-mono text-[10px] border text-muted-foreground">
                              {item.shortcut.split(" ").map((key, i) => (
                                <React.Fragment key={i}>
                                  {i > 0 && <span className="mx-0.5" />}
                                  {key === "Command" || key === "Cmd" ? (
                                    <CommandIcon className="w-2.5 h-2.5" />
                                  ) : (
                                    key
                                  )}
                                </React.Fragment>
                              ))}
                            </kbd>
                          )}
                        </Command.Item>
                      ))}
                    </Command.Group>
                  ))}
                </Command.List>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-2.5 border-t bg-muted/30 text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono border">
                        ↑↓
                      </kbd>
                      to navigate
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono border">
                        ↵
                      </kbd>
                      to select
                    </span>
                  </div>
                  <span className="hidden sm:inline">AROS Admin Console</span>
                </div>
              </Command>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
