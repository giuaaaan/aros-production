import { ActivityItem, DashboardStats, Organization } from '@/types'

export const mockDashboardStats: DashboardStats = {
  totalRevenue: 15700,
  revenueChange: 12.5,
  activeCustomers: 47,
  customersChange: 8.2,
  todayCalls: 23,
  callsChange: 15.3,
  systemHealth: 99.9,
  healthStatus: 'operational',
}

export const mockActivities: ActivityItem[] = [
  {
    id: 'conv-1',
    type: 'call',
    organization: 'Autofficina Rossi',
    description: 'AI voice call completed',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 min ago
  },
  {
    id: 'conv-2',
    type: 'whatsapp',
    organization: 'Car Service Bianchi',
    description: 'WhatsApp conversation handled',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 min ago
  },
  {
    id: 'apt-1',
    type: 'appointment',
    organization: 'Moto Garage Verdi',
    description: 'Appointment booked via AI voice',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min ago
  },
  {
    id: 'conv-3',
    type: 'signup',
    organization: 'Elettrauto Neri',
    description: 'New organization registered',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
  },
  {
    id: 'apt-2',
    type: 'error',
    organization: 'Service Center Blu',
    description: 'Failed to process appointment',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  },
]

export const mockOrganizations: Organization[] = [
  {
    id: 'org-1',
    name: 'Autofficina Rossi',
    slug: 'autofficina-rossi',
    phone_number: '+39123456789',
    whatsapp_number: '+39123456789',
    city: 'Milano',
    subscription_tier: 'professional',
    subscription_status: 'active',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-02-18T10:00:00Z',
    user_count: 5,
    appointment_count: 128,
  },
  {
    id: 'org-2',
    name: 'Car Service Bianchi',
    slug: 'car-service-bianchi',
    phone_number: '+39987654321',
    whatsapp_number: '+39987654321',
    city: 'Roma',
    subscription_tier: 'starter',
    subscription_status: 'active',
    created_at: '2024-02-01T14:30:00Z',
    updated_at: '2024-02-17T09:15:00Z',
    user_count: 2,
    appointment_count: 45,
  },
  {
    id: 'org-3',
    name: 'Moto Garage Verdi',
    slug: 'moto-garage-verdi',
    phone_number: null,
    whatsapp_number: '+39555123456',
    city: 'Torino',
    subscription_tier: 'enterprise',
    subscription_status: 'paused',
    created_at: '2024-01-20T08:00:00Z',
    updated_at: '2024-02-10T16:45:00Z',
    user_count: 12,
    appointment_count: 312,
  },
]

export const mockNewActivity: ActivityItem = {
  id: 'conv-new',
  type: 'call',
  organization: 'New Call Center',
  description: 'AI voice call started',
  timestamp: new Date().toISOString(),
}
