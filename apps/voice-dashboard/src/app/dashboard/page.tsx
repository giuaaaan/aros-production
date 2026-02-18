import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { RecentConversations } from '@/components/dashboard/recent-conversations';
import { TodayAppointments } from '@/components/dashboard/today-appointments';

export default async function DashboardPage() {
  const supabase = createClient();
  
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

  // Get stats for today
  const today = new Date().toISOString().split('T')[0];
  
  const { data: todayAppointments } = await supabase
    .from('appointments')
    .select('*, customers(first_name, last_name, phone), vehicles(make, model, license_plate)')
    .eq('org_id', profile.org_id)
    .gte('scheduled_at', `${today}T00:00:00`)
    .lte('scheduled_at', `${today}T23:59:59`)
    .order('scheduled_at', { ascending: true });

  const { data: recentConversations } = await supabase
    .from('conversations')
    .select('*, customers(first_name, last_name)')
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false })
    .limit(5);

  const { data: aiStats } = await supabase
    .from('conversations')
    .select('status, channel')
    .eq('org_id', profile.org_id)
    .gte('created_at', `${today}T00:00:00`);

  const successfulCalls = aiStats?.filter(c => c.status === 'completed' && c.channel === 'voice').length || 0;
  const whatsappChats = aiStats?.filter(c => c.channel === 'whatsapp').length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {profile.organizations?.name}
            </h1>
            <p className="text-sm text-gray-500">
              Dashboard AROS Voice
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {profile.first_name} {profile.last_name}
            </span>
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="text-sm text-red-600 hover:text-red-800"
              >
                Esci
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <StatsCards 
          todayAppointments={todayAppointments?.length || 0}
          successfulCalls={successfulCalls}
          whatsappChats={whatsappChats}
        />

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Today's Appointments */}
          <TodayAppointments appointments={todayAppointments || []} />
          
          {/* Recent Conversations */}
          <RecentConversations conversations={recentConversations || []} />
        </div>
      </main>
    </div>
  );
}
