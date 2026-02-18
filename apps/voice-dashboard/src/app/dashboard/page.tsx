import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Navigation } from '@/components/ui/navigation';
import { KpiCard, KpiGrid } from '@/components/ui/kpi-card';
import { AlertBanner } from '@/components/ui/status-badge';
import { QuickActionsWidget } from '@/components/ui/quick-actions';
import { Timeline, ActivityFeed } from '@/components/ui/timeline';
import { 
  Calendar, 
  Phone, 
  MessageCircle, 
  TrendingUp, 
  Wrench,
  Clock,
  AlertCircle,
  Users,
  Car,
  Package,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

/**
 * AROS Voice Dashboard - Enhanced Version
 * 
 * Features:
 * - Role-based dashboard views
 * - Quick actions for technicians
 * - Status badges and alerts
 * - Activity timeline
 * - Mobile-optimized layout
 */

export default async function DashboardPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Get user profile with org info
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organizations(*)')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  // Get today's date
  const today = new Date().toISOString().split('T')[0];
  const todayStart = `${today}T00:00:00`;
  const todayEnd = `${today}T23:59:59`;

  // Fetch dashboard data
  const [
    { data: todayAppointments },
    { data: recentConversations },
    { data: aiStats },
    { data: workOrders },
    { data: pendingParts },
  ] = await Promise.all([
    // Today's appointments
    supabase
      .from('appointments')
      .select('*, customers(first_name, last_name, phone), vehicles(make, model, license_plate)')
      .eq('org_id', profile.org_id)
      .gte('scheduled_at', todayStart)
      .lte('scheduled_at', todayEnd)
      .order('scheduled_at', { ascending: true }),
    
    // Recent conversations
    supabase
      .from('conversations')
      .select('*, customers(first_name, last_name)')
      .eq('org_id', profile.org_id)
      .order('created_at', { ascending: false })
      .limit(5),
    
    // AI stats for today
    supabase
      .from('conversations')
      .select('status, channel')
      .eq('org_id', profile.org_id)
      .gte('created_at', todayStart),
    
    // Active work orders
    supabase
      .from('work_orders')
      .select('status, priority')
      .eq('org_id', profile.org_id)
      .in('status', ['pending', 'in_progress', 'waiting_parts']),
    
    // Pending parts orders
    supabase
      .from('parts_orders')
      .select('id')
      .eq('org_id', profile.org_id)
      .eq('status', 'ordered')
  ]);

  // Calculate stats
  const successfulCalls = aiStats?.filter(c => c.status === 'completed' && c.channel === 'voice').length || 0;
  const whatsappChats = aiStats?.filter(c => c.channel === 'whatsapp').length || 0;
  const activeWorkOrders = workOrders?.length || 0;
  const urgentWorkOrders = workOrders?.filter(wo => wo.priority === 'urgent').length || 0;

  // Mock timeline data (replace with real data)
  const timelineItems = [
    {
      id: '1',
      title: 'Ordine #1234 - Cambio olio e filtri',
      description: 'Cliente: Mario Rossi - VW Golf (AB123CD)',
      timestamp: new Date(),
      status: 'in_progress' as const,
      user: { name: 'Marco T.' },
      metadata: [
        { label: 'Tecnico', value: 'Marco T.' },
        { label: 'Inizio', value: '09:30' },
      ],
    },
    {
      id: '2',
      title: 'Chiamata AI gestita',
      description: 'Appuntamento prenotato per domani alle 14:00',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      status: 'completed' as const,
      icon: Phone,
    },
    {
      id: '3',
      title: 'Ricambio in arrivo',
      description: 'Filtro aria Bosch - Ordine #PO-567',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'pending' as const,
      icon: Package,
    },
  ];

  // Mock activities for activity feed
  const recentActivities = [
    {
      id: '1',
      type: 'work_order' as const,
      title: 'Nuovo ordine creato',
      description: 'Freni anteriori - BMW X3',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      user: 'Laura R.',
    },
    {
      id: '2',
      type: 'call' as const,
      title: 'Chiamata in arrivo',
      description: 'Richiesta preventivo - 3391234567',
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      user: 'AI Voice',
    },
    {
      id: '3',
      type: 'vehicle' as const,
      title: 'Veicolo consegnato',
      description: 'Fiat Panda (XY987ZZ) - Cliente soddisfatto',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      user: 'Marco T.',
    },
    {
      id: '4',
      type: 'part' as const,
      title: 'Ricambio ricevuto',
      description: 'Kit frizione LuK - Ordine completato',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      user: 'Magazzino',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Navigation */}
      <Navigation 
        userName={`${profile.first_name} ${profile.last_name}`}
        orgName={profile.organizations?.name}
        onSignOut={async () => {
          'use server';
          const supabase = await createClient();
          await supabase.auth.signOut();
          redirect('/login');
        }}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 sm:pb-6">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
            Ciao, {profile.first_name} 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {format(new Date(), "EEEE d MMMM yyyy", { locale: it })}
          </p>
        </div>

        {/* Critical Alerts */}
        {urgentWorkOrders > 0 && (
          <div className="mb-6">
            <AlertBanner
              variant="critical"
              title={`${urgentWorkOrders} ordine/i urgente/i in attesa`}
              description="Alcuni lavori richiedono attenzione immediata. Verifica la priorità."
            />
          </div>
        )}

        {/* KPI Grid */}
        <KpiGrid columns={4} className="mb-8">
          <KpiCard
            title="Appuntamenti Oggi"
            value={todayAppointments?.length || 0}
            icon={Calendar}
            variant="info"
            trend={{ direction: 'up', value: '+2', label: 'vs ieri' }}
          />
          <KpiCard
            title="Chiamate AI Gestite"
            value={successfulCalls}
            icon={Phone}
            variant="success"
            trend={{ direction: 'up', value: '+12%', label: 'vs media' }}
          />
          <KpiCard
            title="Chat WhatsApp"
            value={whatsappChats}
            icon={MessageCircle}
            variant="info"
          />
          <KpiCard
            title="Ordini Attivi"
            value={activeWorkOrders}
            subtitle={`${urgentWorkOrders} urgenti`}
            icon={Wrench}
            variant={urgentWorkOrders > 0 ? 'warning' : 'default'}
            progress={{ current: activeWorkOrders - urgentWorkOrders, total: activeWorkOrders, label: 'In corso' }}
          />
        </KpiGrid>

        {/* Quick Actions - For Technicians */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Azioni Rapide
          </h2>
          <QuickActionsWidget 
            variant="grid"
            onAction={(actionId, data) => {
              // Handle actions - these will be implemented with client components
              console.log('Action:', actionId, data);
            }}
          />
        </section>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Timeline (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Appointments */}
            <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    Appuntamenti di Oggi
                  </h2>
                  <span className="text-sm text-slate-500">
                    {todayAppointments?.length || 0} totali
                  </span>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                {todayAppointments && todayAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {todayAppointments.map((apt) => (
                      <div 
                        key={apt.id} 
                        className="flex items-start gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                      >
                        <div className="flex-shrink-0 w-16 text-center">
                          <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                            {format(new Date(apt.scheduled_at), 'HH:mm', { locale: it })}
                          </p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-slate-900 dark:text-slate-100">
                              {apt.customers?.first_name} {apt.customers?.last_name}
                            </p>
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded-full",
                              apt.status === 'confirmed' && "bg-emerald-100 text-emerald-700",
                              apt.status === 'in_progress' && "bg-blue-100 text-blue-700",
                              apt.status === 'pending' && "bg-amber-100 text-amber-700",
                            )}>
                              {apt.status === 'confirmed' ? 'Confermato' : 
                               apt.status === 'in_progress' ? 'In corso' : 'In attesa'}
                            </span>
                          </div>
                          {apt.vehicles && (
                            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                              <Car className="h-3.5 w-3.5" />
                              {apt.vehicles.make} {apt.vehicles.model} 
                              <span className="font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded text-xs">
                                {apt.vehicles.license_plate}
                              </span>
                            </p>
                          )}
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            {apt.service_type}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Nessun appuntamento per oggi</p>
                  </div>
                )}
              </div>
            </section>

            {/* Activity Timeline */}
            <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Timeline Attività
                </h2>
              </div>
              <div className="p-4 sm:p-6">
                <Timeline items={timelineItems} />
              </div>
            </section>
          </div>

          {/* Right Column - Activity Feed (1/3 width) */}
          <div className="space-y-6">
            {/* Recent Activity Feed */}
            <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  Attività Recenti
                </h2>
              </div>
              <div className="p-4 sm:p-6">
                <ActivityFeed activities={recentActivities} />
              </div>
            </section>

            {/* AI Performance Card */}
            <section className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-sm text-white p-6">
              <h3 className="font-semibold text-lg mb-2">Performance AI</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-blue-100">Tasso di conversione</span>
                    <span className="font-bold">87%</span>
                  </div>
                  <div className="h-2 bg-blue-900/30 rounded-full overflow-hidden">
                    <div className="h-full bg-white/90 rounded-full" style={{ width: '87%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-blue-100">Soddisfazione cliente</span>
                    <span className="font-bold">4.8/5</span>
                  </div>
                  <div className="h-2 bg-blue-900/30 rounded-full overflow-hidden">
                    <div className="h-full bg-white/90 rounded-full" style={{ width: '96%' }} />
                  </div>
                </div>
              </div>
              <p className="text-sm text-blue-100 mt-4">
                L'AI ha gestito con successo {successfulCalls} chiamate oggi
              </p>
            </section>

            {/* Pending Parts Alert */}
            {pendingParts && pendingParts.length > 0 && (
              <section className="bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 p-4">
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                      Ricambi in attesa
                    </h3>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      {pendingParts.length} ordini in attesa di consegna
                    </p>
                    <button className="text-sm text-amber-800 dark:text-amber-200 font-medium mt-2 hover:underline">
                      Visualizza ordini →
                    </button>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// Helper for class merging
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
