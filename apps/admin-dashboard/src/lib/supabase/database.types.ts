export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          phone_number: string | null;
          whatsapp_number: string | null;
          address: string | null;
          city: string | null;
          zip_code: string | null;
          vat_number: string | null;
          subscription_tier: string;
          subscription_status: string;
          settings: Record<string, any> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          phone_number?: string | null;
          whatsapp_number?: string | null;
          address?: string | null;
          city?: string | null;
          zip_code?: string | null;
          vat_number?: string | null;
          subscription_tier?: string;
          subscription_status?: string;
          settings?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          phone_number?: string | null;
          whatsapp_number?: string | null;
          address?: string | null;
          city?: string | null;
          zip_code?: string | null;
          vat_number?: string | null;
          subscription_tier?: string;
          subscription_status?: string;
          settings?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          org_id: string | null;
          email: string;
          first_name: string | null;
          last_name: string | null;
          role: string;
          phone: string | null;
          avatar_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
    };
    Views: {
      appointment_stats: {
        Row: {
          org_id: string | null;
          date: string | null;
          total_appointments: number | null;
          completed: number | null;
          cancelled: number | null;
          ai_voice_bookings: number | null;
          ai_whatsapp_bookings: number | null;
          total_revenue: number | null;
        };
      };
    };
    Functions: {
      get_user_org_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
  };
};
