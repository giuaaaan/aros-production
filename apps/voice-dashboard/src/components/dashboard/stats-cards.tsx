import { Calendar, Phone, MessageCircle, TrendingUp } from 'lucide-react';

interface StatsCardsProps {
  todayAppointments: number;
  successfulCalls: number;
  whatsappChats: number;
}

export function StatsCards({ todayAppointments, successfulCalls, whatsappChats }: StatsCardsProps) {
  const stats = [
    {
      name: 'Appuntamenti Oggi',
      value: todayAppointments,
      icon: Calendar,
      color: 'bg-blue-500',
    },
    {
      name: 'Chiamate AI Gestite',
      value: successfulCalls,
      icon: Phone,
      color: 'bg-green-500',
    },
    {
      name: 'Conversazioni WhatsApp',
      value: whatsappChats,
      icon: MessageCircle,
      color: 'bg-purple-500',
    },
    {
      name: 'Tasso Conversione',
      value: '87%',
      icon: TrendingUp,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${stat.color} rounded-md p-3`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {stat.name}
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {stat.value}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
