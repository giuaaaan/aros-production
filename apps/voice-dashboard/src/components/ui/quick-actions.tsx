"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { VoiceInput } from "./voice-input";
import {
  Camera,
  ScanBarcode,
  Timer,
  Car,
  Mic,
  Wrench,
  ClipboardCheck,
  AlertTriangle,
  X,
  CheckCircle2,
} from "lucide-react";

/**
 * AROS Quick Actions Widget
 * 
 * Designed for technicians (Persona: Marco)
 * - Large touch targets (72px minimum)
 * - Voice input support for hands-free operation
 * - Offline-first capabilities
 * - Dark mode optimized for garage environments
 * 
 * Quick Actions:
 * - Scan Targa (License plate)
 * - Scan Barcode (Parts)
 * - Timer (Job tracking)
 * - Photo (Documentation)
 * - Voice Note
 * - Quick Report
 */

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  shortcut?: string;
  description: string;
}

// Strict type for action data payload
interface ActionData {
  elapsed?: number;
  text?: string;
}

const quickActions: QuickAction[] = [
  {
    id: "targa",
    label: "Scan Targa",
    icon: Car,
    color: "bg-blue-500",
    shortcut: "⌘1",
    description: "Scansiona targa veicolo",
  },
  {
    id: "barcode",
    label: "Barcode",
    icon: ScanBarcode,
    color: "bg-purple-500",
    shortcut: "⌘2",
    description: "Scansiona ricambio",
  },
  {
    id: "timer",
    label: "Timer",
    icon: Timer,
    color: "bg-orange-500",
    shortcut: "⌘3",
    description: "Avvia cronometro",
  },
  {
    id: "foto",
    label: "Foto",
    icon: Camera,
    color: "bg-emerald-500",
    shortcut: "⌘4",
    description: "Scatta foto",
  },
  {
    id: "voce",
    label: "Voce",
    icon: Mic,
    color: "bg-cyan-500",
    shortcut: "⌘5",
    description: "Nota vocale",
  },
  {
    id: "rapido",
    label: "Rapido",
    icon: Wrench,
    color: "bg-amber-500",
    shortcut: "⌘6",
    description: "Intervento rapido",
  },
];

interface QuickActionsWidgetProps {
  onAction?: (actionId: string, data?: ActionData) => void;
  className?: string;
  variant?: "grid" | "list" | "compact";
  showVoiceInput?: boolean;
}

function QuickActionsWidget({
  onAction,
  className,
  variant = "grid",
  showVoiceInput = true,
}: QuickActionsWidgetProps) {
  const [activeTimer, setActiveTimer] = React.useState<string | null>(null);
  const [timerElapsed, setTimerElapsed] = React.useState(0);
  const [voiceModalOpen, setVoiceModalOpen] = React.useState(false);

  // Timer functionality
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTimer) {
      interval = setInterval(() => {
        setTimerElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTimer]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAction = (action: QuickAction) => {
    if (action.id === "timer") {
      if (activeTimer) {
        // Stop timer
        onAction?.("timer_stop", { elapsed: timerElapsed });
        setActiveTimer(null);
        setTimerElapsed(0);
      } else {
        // Start timer
        setActiveTimer(Date.now().toString());
        onAction?.("timer_start", undefined);
      }
    } else if (action.id === "voce") {
      setVoiceModalOpen(true);
    } else {
      onAction?.(action.id, undefined);
    }
  };

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 6) {
          e.preventDefault();
          handleAction(quickActions[num - 1]);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTimer, timerElapsed]);

  if (variant === "compact") {
    return (
      <div className={cn("flex gap-2", className)}>
        {quickActions.slice(0, 4).map((action) => (
          <Button
            key={action.id}
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-xl"
            onClick={() => handleAction(action)}
            title={action.description}
          >
            <action.icon className="h-5 w-5" />
          </Button>
        ))}
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className={cn("space-y-2", className)}>
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={() => handleAction(action)}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500/30 transition-colors text-left"
          >
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white", action.color)}>
              <action.icon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">{action.label}</p>
              <p className="text-sm text-slate-500">{action.description}</p>
            </div>
            {action.shortcut && (
              <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border bg-slate-100 dark:bg-slate-700 px-2 font-mono text-xs">
                {action.shortcut}
              </kbd>
            )}
          </button>
        ))}
      </div>
    );
  }

  // Grid variant (default)
  return (
    <>
      <div className={cn("space-y-4", className)}>
        {/* Active Timer Display */}
        {activeTimer && (
          <div className="flex items-center justify-between p-4 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center animate-pulse">
                <Timer className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-orange-900 dark:text-orange-100">
                  Timer in corso
                </p>
                <p className="text-2xl font-mono font-bold text-orange-600 dark:text-orange-400">
                  {formatTime(timerElapsed)}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction(quickActions[2])}
            >
              Stop
            </Button>
          </div>
        )}

        {/* Quick Actions Grid - Optimized for Touch */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleAction(action)}
              className={cn(
                "flex flex-col items-center justify-center gap-2 p-4 rounded-xl",
                "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700",
                "shadow-sm transition-all duration-200",
                "hover:shadow-md hover:border-blue-500/30",
                "active:scale-95",
                "min-h-[88px] sm:min-h-[96px]"
              )}
              title={action.description}
            >
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm", action.color)}>
                <action.icon className="h-6 w-6" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                {action.label}
              </span>
              {action.shortcut && (
                <kbd className="hidden lg:inline-flex h-4 items-center rounded bg-slate-100 dark:bg-slate-700 px-1 font-mono text-[9px]">
                  {action.shortcut}
                </kbd>
              )}
            </button>
          ))}
        </div>

        {/* Voice Input Section */}
        {showVoiceInput && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <Mic className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Comando Vocale
              </span>
            </div>
            <VoiceInput
              onTranscript={(text) => onAction?.("voice_command", { text })}
              placeholder="Premi il microfono e parla..."
            />
          </div>
        )}
      </div>

      {/* Voice Note Modal */}
      {voiceModalOpen && (
        <VoiceNoteModal
          onClose={() => setVoiceModalOpen(false)}
          onSave={(text) => {
            onAction?.("voice_note", { text });
            setVoiceModalOpen(false);
          }}
        />
      )}
    </>
  );
}

/**
 * Voice Note Modal - For detailed voice input
 */
interface VoiceNoteModalProps {
  onClose: () => void;
  onSave: (text: string) => void;
}

function VoiceNoteModal({ onClose, onSave }: VoiceNoteModalProps) {
  const [note, setNote] = React.useState("");

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">Nota Vocale</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="p-4 space-y-4">
          <VoiceInput
            onTranscript={setNote}
            placeholder="Descrivi il lavoro effettuato..."
          />
          
          {note && (
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
              <p className="text-sm text-slate-700 dark:text-slate-300">{note}</p>
            </div>
          )}
        </div>
        
        <div className="flex gap-2 p-4 border-t bg-slate-50 dark:bg-slate-950">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Annulla
          </Button>
          <Button 
            className="flex-1" 
            onClick={() => onSave(note)}
            disabled={!note}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Salva Nota
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Technician Floating Action Button
 * Mobile-optimized FAB for quick access
 */
interface TechnicianFabProps {
  onAction?: (actionId: string) => void;
}

function TechnicianFab({ onAction }: TechnicianFabProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40 sm:hidden">
      {/* FAB Menu */}
      {open && (
        <div className="absolute bottom-16 right-0 space-y-2 animate-in">
          {quickActions.slice(0, 4).map((action, index) => (
            <button
              key={action.id}
              onClick={() => {
                onAction?.(action.id);
                setOpen(false);
              }}
              className="flex items-center gap-3 pr-2"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className="text-sm font-medium text-white bg-black/70 px-2 py-1 rounded">
                {action.label}
              </span>
              <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg", action.color)}>
                <action.icon className="h-5 w-5" />
              </div>
            </button>
          ))}
        </div>
      )}
      
      {/* Main FAB */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg transition-transform",
          open ? "bg-red-500 rotate-45" : "bg-blue-600"
        )}
      >
        {open ? <X className="h-8 w-8" /> : <Wrench className="h-8 w-8" />}
      </button>
    </div>
  );
}

export { QuickActionsWidget, TechnicianFab, quickActions };
export type { QuickActionsWidgetProps, TechnicianFabProps, QuickAction };
