import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { Phone, MessageCircle, Bot, User } from 'lucide-react';

interface Conversation {
  id: string;
  channel: 'voice' | 'whatsapp' | 'web';
  status: string;
  phone_number: string;
  started_at: string;
  summary: string | null;
  customers: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

interface RecentConversationsProps {
  conversations: Conversation[];
}

export function RecentConversations({ conversations }: RecentConversationsProps) {
  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'voice':
        return <Phone className="h-4 w-4" />;
      case 'whatsapp':
        return <MessageCircle className="h-4 w-4" />;
      default:
        return <Bot className="h-4 w-4" />;
    }
  };

  const getChannelLabel = (channel: string) => {
    switch (channel) {
      case 'voice':
        return 'Chiamata';
      case 'whatsapp':
        return 'WhatsApp';
      default:
        return 'Web';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Conversazioni Recenti
        </h3>
        
        <div className="mt-4 space-y-4">
          {conversations.length === 0 ? (
            <p className="text-gray-500 text-sm">Nessuna conversazione recente</p>
          ) : (
            conversations.map((conv) => (
              <div key={conv.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    {getChannelIcon(conv.channel)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {conv.customers ? (
                        `${conv.customers.first_name} ${conv.customers.last_name}`
                      ) : (
                        conv.phone_number
                      )}
                    </p>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(conv.started_at), { 
                        addSuffix: true, 
                        locale: it 
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {conv.summary || `Conversazione ${getChannelLabel(conv.channel)}`}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      {getChannelLabel(conv.channel)}
                    </span>
                    {conv.status === 'completed' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Completata
                      </span>
                    )}
                    {conv.status === 'transferred' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                        Trasferita
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
