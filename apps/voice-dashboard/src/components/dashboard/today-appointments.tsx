import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Clock, User, Car } from 'lucide-react';

interface Appointment {
  id: string;
  scheduled_at: string;
  service_type: string;
  status: string;
  customers: {
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
  } | null;
  vehicles: {
    make: string | null;
    model: string | null;
    license_plate: string | null;
  } | null;
}

interface TodayAppointmentsProps {
  appointments: Appointment[];
}

export function TodayAppointments({ appointments }: TodayAppointmentsProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confermato';
      case 'in_progress':
        return 'In corso';
      case 'pending':
        return 'In attesa';
      case 'completed':
        return 'Completato';
      default:
        return status;
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Appuntamenti di Oggi
        </h3>
        
        <div className="mt-4 space-y-4">
          {appointments.length === 0 ? (
            <p className="text-gray-500 text-sm">Nessun appuntamento per oggi</p>
          ) : (
            appointments.map((apt) => (
              <div key={apt.id} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {format(new Date(apt.scheduled_at), 'HH:mm', { locale: it })}
                    </p>
                    <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {apt.customers?.first_name} {apt.customers?.last_name}
                    </p>
                    {apt.vehicles && (
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                        <Car className="h-4 w-4" />
                        {apt.vehicles.make} {apt.vehicles.model} ({apt.vehicles.license_plate})
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">{apt.service_type}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(apt.status)}`}>
                    {getStatusLabel(apt.status)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
