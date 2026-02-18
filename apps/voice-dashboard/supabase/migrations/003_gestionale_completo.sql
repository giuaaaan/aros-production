-- GESTIONALE COMPLETO PER OFFICINE MECCANICHE
-- Migrazione 003: Magazzino, Ordini, Fatturazione, Fornitori

-- ============================================================
-- MAGAZZINO RICAMBI
-- ============================================================

CREATE TABLE IF NOT EXISTS public.parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  sku TEXT NOT NULL, -- codice interno
  oem_code TEXT, -- codice originale (es. Bosch)
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- Filtro, Freno, Distribuzione, etc
  brand TEXT,
  supplier_id UUID REFERENCES public.suppliers(id),
  
  -- Prezzi
  cost_price DECIMAL(10,2) NOT NULL DEFAULT 0, -- prezzo acquisto
  sale_price DECIMAL(10,2) NOT NULL DEFAULT 0, -- prezzo vendita
  vat_rate DECIMAL(5,2) DEFAULT 22.00, -- IVA %
  
  -- Magazzino
  quantity INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER DEFAULT 1, -- scorta minima
  max_stock INTEGER DEFAULT 100, -- scorta massima
  location TEXT, -- es: "Scaffale A3, Ripiano 2"
  
  -- Barcode/QR
  barcode TEXT UNIQUE,
  qr_code TEXT,
  
  -- Unità di misura
  unit TEXT DEFAULT 'pezzo', -- pezzo, litro, kg, metro
  
  -- Stato
  is_active BOOLEAN DEFAULT true,
  is_oem BOOLEAN DEFAULT false, -- originale vs aftermarket
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(org_id, sku)
);

-- Alert scorte basse
CREATE OR REPLACE FUNCTION public.check_low_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quantity <= NEW.min_stock THEN
    -- Inserisce notifica
    INSERT INTO public.notifications (org_id, type, title, message, data)
    VALUES (
      NEW.org_id,
      'low_stock',
      'Scorta bassa',
      NEW.name || ' - Quantità: ' || NEW.quantity,
      jsonb_build_object('part_id', NEW.id, 'sku', NEW.sku)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_check_low_stock
  AFTER UPDATE OF quantity ON public.parts
  FOR EACH ROW
  EXECUTE FUNCTION public.check_low_stock();

-- ============================================================
-- FORNITORI
-- ============================================================

CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Anagrafica
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  
  -- Indirizzo
  address TEXT,
  city TEXT,
  zip_code TEXT,
  
  -- Dati fiscali
  vat_number TEXT, -- P.IVA
  tax_code TEXT, -- Codice fiscale (se diverso)
  
  -- Condizioni
  payment_terms TEXT DEFAULT '30gg', -- 30gg, 60gg, etc
  discount_percent DECIMAL(5,2) DEFAULT 0,
  
  -- Note
  notes TEXT,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ORDINI FORNITORI
-- ============================================================

CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
  
  -- Numerazione
  order_number TEXT NOT NULL, -- es: PO-2026-001
  
  -- Stato
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'confirmed', 'received', 'cancelled')),
  
  -- Date
  order_date TIMESTAMPTZ DEFAULT NOW(),
  expected_date TIMESTAMPTZ,
  received_date TIMESTAMPTZ,
  
  -- Totale
  total_amount DECIMAL(10,2) DEFAULT 0,
  vat_amount DECIMAL(10,2) DEFAULT 0,
  total_with_vat DECIMAL(10,2) DEFAULT 0,
  
  -- Note
  notes TEXT,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(org_id, order_number)
);

CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES public.parts(id),
  
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_cost DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  
  received_quantity INTEGER DEFAULT 0
);

-- ============================================================
-- ORDINI DI LAVORO (Work Orders)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Numerazione
  wo_number TEXT NOT NULL, -- es: OL-2026-001
  
  -- Riferimenti
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  vehicle_id UUID REFERENCES public.vehicles(id),
  appointment_id UUID REFERENCES public.appointments(id),
  
  -- Stato workflow
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',           -- In attesa
    'in_progress',       -- In lavorazione
    'waiting_parts',     -- In attesa ricambi
    'completed',         -- Completato
    'invoiced',          -- Fatturato
    'cancelled'          -- Annullato
  )),
  
  -- Date
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  estimated_completion TIMESTAMPTZ,
  
  -- Descrizione lavoro
  description TEXT NOT NULL,
  notes TEXT, -- note interne
  customer_notes TEXT, -- note visibili al cliente
  
  -- Tempi
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2) DEFAULT 0,
  
  -- Costi e prezzi
  labor_cost DECIMAL(10,2) DEFAULT 0, -- manodopera
  parts_total DECIMAL(10,2) DEFAULT 0, -- totale ricambi
  subtotal DECIMAL(10,2) DEFAULT 0,
  vat_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0,
  
  -- Priorità
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Assegnazione
  assigned_to UUID REFERENCES auth.users(id), -- meccanico assegnato
  
  -- Firma cliente
  customer_signature TEXT, -- base64 immagine firma
  signed_at TIMESTAMPTZ,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(org_id, wo_number)
);

-- Storico cambi stato
CREATE TABLE IF NOT EXISTS public.work_order_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger per storico
CREATE OR REPLACE FUNCTION public.log_work_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.work_order_history (work_order_id, from_status, to_status, changed_by, notes)
    VALUES (NEW.id, OLD.status, NEW.status, NEW.updated_by, NEW.status_notes);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_work_order_history
  AFTER UPDATE ON public.work_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.log_work_order_status_change();

-- Ricambi usati nell'ordine di lavoro
CREATE TABLE IF NOT EXISTS public.work_order_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES public.parts(id),
  
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL, -- prezzo al momento dell'uso
  total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  
  -- Movimenta magazzino
  deducted_from_stock BOOLEAN DEFAULT false
);

-- Trigger: quando aggiungi ricambio, scala dal magazzino
CREATE OR REPLACE FUNCTION public.deduct_part_from_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.parts
  SET quantity = quantity - NEW.quantity
  WHERE id = NEW.part_id;
  
  NEW.deducted_from_stock = true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_deduct_stock
  BEFORE INSERT ON public.work_order_parts
  FOR EACH ROW
  EXECUTE FUNCTION public.deduct_part_from_stock();

-- ============================================================
-- PREVENTIVI (Quotes)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Numerazione
  quote_number TEXT NOT NULL, -- es: PR-2026-001
  
  -- Cliente e veicolo
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  vehicle_id UUID REFERENCES public.vehicles(id),
  
  -- Stato
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  
  -- Validità
  issue_date TIMESTAMPTZ DEFAULT NOW(),
  expiry_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  
  -- Lavoro richiesto
  description TEXT NOT NULL,
  
  -- Costi
  labor_hours DECIMAL(5,2) DEFAULT 0,
  labor_rate DECIMAL(10,2) DEFAULT 50.00, -- €/ora
  labor_total DECIMAL(10,2) GENERATED ALWAYS AS (labor_hours * labor_rate) STORED,
  
  parts_total DECIMAL(10,2) DEFAULT 0,
  subtotal DECIMAL(10,2) DEFAULT 0,
  vat_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0,
  
  -- Conversione
  converted_to_work_order_id UUID REFERENCES public.work_orders(id),
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(org_id, quote_number)
);

-- ============================================================
-- FATTURAZIONE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Numerazione (fiscale)
  invoice_number TEXT NOT NULL, -- es: FATT-2026-000001
  
  -- Tipo
  document_type TEXT DEFAULT 'invoice' CHECK (document_type IN ('invoice', 'receipt', 'credit_note')),
  
  -- Cliente
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  customer_name TEXT NOT NULL, -- snapshot nome cliente
  customer_vat TEXT, -- P.IVA cliente
  customer_address TEXT,
  
  -- Riferimenti
  work_order_ids UUID[], -- può fatturare più ordini
  
  -- Date
  issue_date TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  paid_date TIMESTAMPTZ,
  
  -- Importi
  subtotal DECIMAL(10,2) NOT NULL,
  vat_amount DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  
  -- Stato pagamento
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'overdue')),
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'check')),
  
  -- Note
  notes TEXT,
  
  -- XML SDI (fatturazione elettronica)
  sdi_xml TEXT,
  sdi_status TEXT CHECK (sdi_status IN ('pending', 'sent', 'delivered', 'accepted', 'rejected')),
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(org_id, invoice_number)
);

-- Righe fattura
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  vat_rate DECIMAL(5,2) DEFAULT 22.00,
  total_price DECIMAL(10,2) NOT NULL
);

-- ============================================================
-- SCADENZE VEICOLO (Reminder)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.vehicle_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  
  reminder_type TEXT NOT NULL CHECK (reminder_type IN (
    'insurance',      -- Assicurazione
    'road_tax',       -- Bollo
    'inspection',     -- Revisione
    'service',        -- Tagliando
    'tires',          -- Cambio gomme
    'custom'          -- Altro
  )),
  
  title TEXT NOT NULL,
  description TEXT,
  
  -- Data scadenza
  due_date DATE NOT NULL,
  due_km INTEGER, -- opzionale: scadenza per km
  
  -- Stato
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  
  -- Notifica
  notified BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: crea notifica quando scadenza imminente
CREATE OR REPLACE FUNCTION public.check_upcoming_reminders()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.due_date <= CURRENT_DATE + INTERVAL '7 days' AND NOT NEW.is_completed AND NOT NEW.notified THEN
    INSERT INTO public.notifications (org_id, type, title, message)
    SELECT 
      v.org_id,
      'reminder',
      'Scadenza imminente: ' || NEW.title,
      'Veicolo: ' || v.license_plate || ' - Scadenza: ' || NEW.due_date
    FROM public.vehicles v
    WHERE v.id = NEW.vehicle_id;
    
    NEW.notified = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- NOTIFICHE INTERNE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'error', 'low_stock', 'reminder')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  data JSONB, -- dati aggiuntivi
  
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes per performance
CREATE INDEX idx_parts_org_id ON public.parts(org_id);
CREATE INDEX idx_parts_quantity ON public.parts(org_id, quantity) WHERE quantity <= min_stock;
CREATE INDEX idx_work_orders_status ON public.work_orders(org_id, status);
CREATE INDEX idx_work_orders_customer ON public.work_orders(customer_id);
CREATE INDEX idx_invoices_status ON public.invoices(org_id, payment_status);
CREATE INDEX idx_quotes_status ON public.quotes(org_id, status);
CREATE INDEX idx_reminders_due ON public.vehicle_reminders(due_date) WHERE is_completed = false;

-- RLS Policies
ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy template per tutte le tabelle
CREATE POLICY "Users can access own org parts" ON public.parts
  FOR ALL USING (org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can access own org suppliers" ON public.suppliers
  FOR ALL USING (org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can access own org work orders" ON public.work_orders
  FOR ALL USING (org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can access own org quotes" ON public.quotes
  FOR ALL USING (org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can access own org invoices" ON public.invoices
  FOR ALL USING (org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid()));
