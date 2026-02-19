export interface Organization {
  id: string;
  name: string;
  slug: string;
  phone_number: string | null;
  whatsapp_number: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  subscription_tier: 'starter' | 'professional' | 'enterprise';
  subscription_status: 'active' | 'paused' | 'cancelled';
  created_at: string;
  updated_at: string;
  user_count?: number;
  appointment_count?: number;
}

export interface DashboardStats {
  totalRevenue: number;
  revenueChange: number;
  activeCustomers: number;
  customersChange: number;
  todayCalls: number;
  callsChange: number;
  systemHealth: number;
  healthStatus: 'operational' | 'degraded' | 'down';
}

export interface ActivityItem {
  id: string;
  type: 'call' | 'whatsapp' | 'signup' | 'appointment' | 'error';
  organization: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface SystemStatus {
  service: string;
  status: 'operational' | 'degraded' | 'down';
  latency: number;
  uptime: number;
  lastChecked: string;
}

export interface ChartData {
  date: string;
  calls: number;
  whatsapp: number;
  revenue: number;
}

export interface AdminUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: 'super_admin' | 'admin' | 'support';
  last_sign_in_at: string | null;
  created_at: string;
}
