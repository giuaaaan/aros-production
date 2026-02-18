"use client";

import { Suspense, useState } from "react";
import { Navigation } from "@/components/ui/navigation";
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card";
import { StatusBadge, WorkOrderStatusBadge, AlertBanner } from "@/components/ui/status-badge";
import { QuickActionsWidget } from "@/components/ui/quick-actions";
import { Timeline, WorkOrderProgress } from "@/components/ui/timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Wrench, 
  Package, 
  ClipboardCheck, 
  Users, 
  Clock,
  Search,
  Plus,
  Filter,
  Car,
  AlertCircle,
  CheckCircle2,
  MoreHorizontal,
  ChevronRight,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

/**
 * AROS Gestionale Page - Enhanced Work Management
 * 
 * Features:
 * - Work order kanban board
 * - Digital inspection integration
 * - Barcode scanning for parts
 * - Status tracking with visual indicators
 * - Mobile-optimized workflow
 */

// Mock data for work orders
const mockWorkOrders = [
  {
    id: "WO-001",
    title: "Cambio olio e filtri",
    customer: "Mario Rossi",
    vehicle: "VW Golf",
    licensePlate: "AB123CD",
    status: "in_progress" as const,
    priority: "normal" as const,
    technician: "Marco T.",
    estimatedHours: 2,
    spentHours: 1.5,
    createdAt: new Date(),
  },
  {
    id: "WO-002",
    title: "Sostituzione freni anteriori",
    customer: "Laura Bianchi",
    vehicle: "BMW X3",
    licensePlate: "XY987ZZ",
    status: "waiting_parts" as const,
    priority: "urgent" as const,
    technician: "Giuseppe M.",
    estimatedHours: 3,
    spentHours: 0,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: "WO-003",
    title: "Tagliando completo",
    customer: "Antonio Verdi",
    vehicle: "Fiat Panda",
    licensePlate: "CD456EF",
    status: "pending" as const,
    priority: "normal" as const,
    technician: null,
    estimatedHours: 4,
    spentHours: 0,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: "WO-004",
    title: "Diagnosi elettronica",
    customer: "Giulia Neri",
    vehicle: "Audi A4",
    licensePlate: "GH789IJ",
    status: "completed" as const,
    priority: "normal" as const,
    technician: "Marco T.",
    estimatedHours: 1,
    spentHours: 0.75,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
  },
];

const workOrderStages = [
  { id: "1", label: "Ricevuto", completed: true, current: false },
  { id: "2", label: "Diagnosi", completed: true, current: false },
  { id: "3", label: "In Lavoro", completed: false, current: true },
  { id: "4", label: "Controllo", completed: false, current: false },
  { id: "5", label: "Consegna", completed: false, current: false },
];

export default function GestionalePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [showInspection, setShowInspection] = useState(false);

  // Filter work orders
  const filteredOrders = mockWorkOrders.filter(wo => {
    const matchesSearch = 
      wo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wo.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wo.licensePlate.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === "all" || wo.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    today: 8,
    waiting: 3,
    parts: 1247,
    customers: 156,
    urgent: mockWorkOrders.filter(wo => wo.priority === "urgent").length,
    completed: mockWorkOrders.filter(wo => wo.status === "completed").length,
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Navigation */}
      <Navigation userName="Marco T." orgName="Officina Rossi" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 sm:pb-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
              Gestionale Officina
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Gestione ordini e flusso di lavoro
            </p>
          </div>
          <Button 
            size="lg" 
            className="sm:w-auto w-full"
            onClick={() => {}}
          >
            <Plus className="h-5 w-5 mr-2" />
            Nuovo Ordine
          </Button>
        </div>

        {/* Critical Alerts */}
        {stats.urgent > 0 && (
          <div className="mb-6">
            <AlertBanner
              variant="critical"
              title={`${stats.urgent} ordine/i urgente/i`}
              description="Richiedono attenzione immediata"
            />
          </div>
        )}

        {/* Stats KPI */}
        <KpiGrid columns={4} className="mb-8">
          <KpiCard
            title="Ordini Oggi"
            value={stats.today}
            icon={Wrench}
            variant="info"
            trend={{ direction: 'up', value: '+2', label: 'vs ieri' }}
          />
          <KpiCard
            title="In Attesa"
            value={stats.waiting}
            icon={Clock}
            variant={stats.waiting > 5 ? 'warning' : 'default'}
            progress={{ current: stats.today - stats.waiting, total: stats.today, label: 'Completati' }}
          />
          <KpiCard
            title="Ricambi"
            value={stats.parts.toLocaleString()}
            icon={Package}
            variant="success"
          />
          <KpiCard
            title="Clienti"
            value={stats.customers}
            icon={Users}
            variant="default"
            trend={{ direction: 'up', value: '+5%', label: 'questo mese' }}
          />
        </KpiGrid>

        {/* Quick Actions */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Azioni Rapide Tecnico
          </h2>
          <QuickActionsWidget
            variant="grid"
            onAction={(actionId) => {
              console.log('Quick action:', actionId);
              if (actionId === 'barcode') {
                // Trigger barcode scanner
              }
            }}
          />
        </section>

        {/* Work Orders Board */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Work Orders List */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5 text-blue-500" />
                    Ordini di Lavoro
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Cerca ordine..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                  {[
                    { id: 'all', label: 'Tutti', count: mockWorkOrders.length },
                    { id: 'pending', label: 'In Attesa', count: mockWorkOrders.filter(wo => wo.status === 'pending').length },
                    { id: 'in_progress', label: 'In Corso', count: mockWorkOrders.filter(wo => wo.status === 'in_progress').length },
                    { id: 'completed', label: 'Completati', count: mockWorkOrders.filter(wo => wo.status === 'completed').length },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setSelectedFilter(filter.id)}
                      className={`
                        px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                        ${selectedFilter === filter.id 
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }
                      `}
                    >
                      {filter.label}
                      <span className="ml-2 text-xs bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded-full">
                        {filter.count}
                      </span>
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredOrders.map((order) => (
                    <div
                      key={order.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono text-slate-400">{order.id}</span>
                            <WorkOrderStatusBadge workStatus={order.status} size="sm" />
                            {order.priority === 'urgent' && (
                              <StatusBadge status="critical" label="Urgente" size="sm" />
                            )}
                          </div>
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mt-2">
                            {order.title}
                          </h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              {order.customer}
                            </span>
                            <span className="flex items-center gap-1">
                              <Car className="h-3.5 w-3.5" />
                              {order.vehicle}
                            </span>
                            <span className="font-mono bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs">
                              {order.licensePlate}
                            </span>
                          </div>
                          {order.technician && (
                            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                              <span className="text-sm">
                                <span className="text-slate-500">Tecnico:</span>{' '}
                                <span className="font-medium">{order.technician}</span>
                              </span>
                              <span className="text-sm">
                                <span className="text-slate-500">Tempo:</span>{' '}
                                <span className="font-medium">{order.spentHours}h / {order.estimatedHours}h</span>
                              </span>
                              <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-blue-500 rounded-full"
                                  style={{ width: `${(order.spentHours / order.estimatedHours) * 100}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                        <Button variant="ghost" size="icon" className="flex-shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {filteredOrders.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                      <ClipboardCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>Nessun ordine trovato</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Work Order Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  Avanzamento Ordine #WO-001
                </CardTitle>
              </CardHeader>
              <CardContent>
                <WorkOrderProgress stages={workOrderStages} />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Summary & Actions */}
          <div className="space-y-6">
            {/* Today's Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-500" />
                  Programma Oggi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { time: '09:00', task: 'Cambio olio VW Golf', status: 'completed' },
                    { time: '11:00', task: 'Diagnosi BMW X3', status: 'in_progress' },
                    { time: '14:00', task: 'Tagliando Fiat Panda', status: 'pending' },
                    { time: '16:30', task: 'Consegna Audi A4', status: 'pending' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="text-sm font-mono w-12">{item.time}</span>
                      <div className={`
                        flex-1 p-2 rounded-lg text-sm
                        ${item.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300' : ''}
                        ${item.status === 'in_progress' ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-l-4 border-blue-500' : ''}
                        ${item.status === 'pending' ? 'bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400' : ''}
                      `}>
                        {item.task}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Parts Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5 text-amber-500" />
                  Stato Ricambi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Disponibili</span>
                    <StatusBadge status="success" label="1,180" size="sm" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">In ordine</span>
                    <StatusBadge status="warning" label="47" size="sm" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Esauriti</span>
                    <StatusBadge status="critical" label="12" size="sm" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Totale</span>
                    <span className="font-semibold">1,239</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4">
                  Gestisci Magazzino
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Attività Recenti</CardTitle>
              </CardHeader>
              <CardContent>
                <Timeline
                  items={[
                    {
                      id: '1',
                      title: 'Ordine completato',
                      description: 'Cambio olio - VW Golf',
                      timestamp: new Date(Date.now() - 30 * 60 * 1000),
                      status: 'completed',
                      user: { name: 'Marco T.' },
                    },
                    {
                      id: '2',
                      title: 'Ricambio ordinato',
                      description: 'Kit freni BMW X3',
                      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
                      status: 'pending',
                      user: { name: 'Laura R.' },
                    },
                  ]}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
