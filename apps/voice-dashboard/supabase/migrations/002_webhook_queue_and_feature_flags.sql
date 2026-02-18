-- Webhook queue for reliable delivery
CREATE TABLE IF NOT EXISTS public.webhook_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  payload JSONB NOT NULL,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 5,
  retry_after TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Index for efficient polling
CREATE INDEX idx_webhook_queue_status_retry ON public.webhook_queue(status, retry_after) 
WHERE status = 'pending';

-- RLS for webhook queue (only system can access)
ALTER TABLE public.webhook_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct access" ON public.webhook_queue
  FOR ALL USING (false);

-- Ensure feature_flags table exists with data
INSERT INTO public.feature_flags (key, enabled, description) VALUES
  ('new-dashboard-ui', false, 'Nuova interfaccia dashboard'),
  ('ai-suggestions', true, 'Suggerimenti AI per appuntamenti'),
  ('inventory-management', false, 'Gestione magazzino ricambi'),
  ('customer-portal', false, 'Portale clienti self-service'),
  ('whatsapp-business-api', true, 'WhatsApp Business API integration'),
  ('advanced-analytics', false, 'Analytics avanzate'),
  ('multi-location', false, 'Supporto multi-sede'),
  ('automatic-invoicing', false, 'Fatturazione automatica')
ON CONFLICT (key) DO NOTHING;

-- Function to clean old completed webhooks
CREATE OR REPLACE FUNCTION public.cleanup_old_webhooks()
RETURNS void AS $$
BEGIN
  DELETE FROM public.webhook_queue
  WHERE status IN ('completed', 'failed')
    AND updated_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cron job to clean webhooks (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-webhooks', '0 0 * * *', 'SELECT public.cleanup_old_webhooks()');
