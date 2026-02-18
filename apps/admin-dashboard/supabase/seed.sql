-- Seed data for development and testing
-- Run with: supabase db reset or supabase seed

-- Organizations
INSERT INTO organizations (id, name, slug, phone_number, whatsapp_number, city, subscription_tier, subscription_status, created_at, updated_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'Autofficina Rossi', 'autofficina-rossi', '+39123456789', '+39123456789', 'Milano', 'professional', 'active', NOW() - INTERVAL '30 days', NOW()),
  ('550e8400-e29b-41d4-a716-446655440001', 'Car Service Bianchi', 'car-service-bianchi', '+39987654321', '+39987654321', 'Roma', 'starter', 'active', NOW() - INTERVAL '20 days', NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', 'Moto Garage Verdi', 'moto-garage-verdi', NULL, '+39555123456', 'Torino', 'enterprise', 'active', NOW() - INTERVAL '15 days', NOW()),
  ('550e8400-e29b-41d4-a716-446655440003', 'Elettrauto Neri', 'elettrauto-neri', '+39111222333', NULL, 'Napoli', 'professional', 'paused', NOW() - INTERVAL '10 days', NOW()),
  ('550e8400-e29b-41d4-a716-446655440004', 'Service Center Blu', 'service-center-blu', '+39444555666', '+39444555666', 'Bologna', 'starter', 'cancelled', NOW() - INTERVAL '5 days', NOW()),
  ('550e8400-e29b-41d4-a716-446655440005', 'Officina Ferrari', 'officina-ferrari', '+39777888999', '+39777888999', 'Modena', 'enterprise', 'active', NOW() - INTERVAL '25 days', NOW()),
  ('550e8400-e29b-41d4-a716-446655440006', 'Auto Riparazioni', 'auto-riparazioni', '+39111122222', NULL, 'Firenze', 'professional', 'active', NOW() - INTERVAL '18 days', NOW()),
  ('550e8400-e29b-41d4-a716-446655440007', 'Meccanica Veloce', 'meccanica-veloce', '+39333344444', '+39333344444', 'Verona', 'starter', 'active', NOW() - INTERVAL '12 days', NOW()),
  ('550e8400-e29b-41d4-a716-446655440008', 'Garage Italia', 'garage-italia', NULL, '+39555566666', 'Genova', 'professional', 'active', NOW() - INTERVAL '8 days', NOW()),
  ('550e8400-e29b-41d4-a716-446655440009', 'Carrozzeria Milano', 'carrozzeria-milano', '+39777788888', '+39777788888', 'Milano', 'enterprise', 'active', NOW() - INTERVAL '3 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- Conversations (Voice calls)
INSERT INTO conversations (id, org_id, channel, status, customer_phone, created_at, updated_at) VALUES
  ('660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 'voice', 'completed', '+39333111222', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'whatsapp', 'active', '+39333222333', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours'),
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'voice', 'completed', '+39333333444', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours'),
  ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'voice', 'completed', '+39333444555', NOW() - INTERVAL '8 hours', NOW() - INTERVAL '8 hours'),
  ('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440006', 'whatsapp', 'completed', '+39333555666', NOW() - INTERVAL '10 hours', NOW() - INTERVAL '10 hours'),
  ('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440009', 'voice', 'active', '+39333666777', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour')
ON CONFLICT (id) DO NOTHING;

-- Appointments
INSERT INTO appointments (id, org_id, customer_name, customer_phone, appointment_date, status, source, created_at) VALUES
  ('770e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 'Mario Rossi', '+39333111222', NOW() + INTERVAL '2 days', 'confirmed', 'ai_voice', NOW() - INTERVAL '1 day'),
  ('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Luigi Bianchi', '+39333222333', NOW() + INTERVAL '3 days', 'confirmed', 'ai_whatsapp', NOW() - INTERVAL '2 days'),
  ('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'Anna Verdi', '+39333333444', NOW() + INTERVAL '1 day', 'pending', 'ai_voice', NOW() - INTERVAL '5 hours'),
  ('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440006', 'Paolo Neri', '+39333444555', NOW() + INTERVAL '5 days', 'confirmed', 'manual', NOW() - INTERVAL '3 days'),
  ('770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440009', 'Giulia Ferrari', '+39333555666', NOW() + INTERVAL '2 days', 'confirmed', 'ai_voice', NOW() - INTERVAL '12 hours')
ON CONFLICT (id) DO NOTHING;

-- Users (Admins)
-- Note: Password would be hashed by Supabase Auth, this is just for reference
-- In real scenario, create users via Supabase Auth UI or API

-- Create a test admin user (you need to create this via Supabase Dashboard or Auth API)
-- The below is just a placeholder showing the structure
/*
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at) VALUES
  ('880e8400-e29b-41d4-a716-446655440000', 'admin@aiaros.it', '$2a$10$...', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, email, first_name, last_name, role, created_at) VALUES
  ('880e8400-e29b-41d4-a716-446655440000', 'admin@aiaros.it', 'Admin', 'User', 'super_admin', NOW())
ON CONFLICT (id) DO NOTHING;
*/

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_org_id ON conversations(org_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_appointments_org_id ON appointments(org_id);
CREATE INDEX IF NOT EXISTS idx_appointments_appointment_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_status ON organizations(subscription_status);
CREATE INDEX IF NOT EXISTS idx_organizations_created_at ON organizations(created_at);
