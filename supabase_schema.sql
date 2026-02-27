-- ==========================================
-- Supabase Schema para Business Dashboard
-- ==========================================

-- 1. Tabla de Empresas (Companies)
CREATE TABLE public.companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insertar las 7 LLCs iniciales que mencionó el usuario (nombres genéricos por ahora, se pueden editar)
INSERT INTO public.companies (name) VALUES 
  ('Empresa 1 LLC'), ('Empresa 2 LLC'), ('Empresa 3 LLC'), 
  ('Empresa 4 LLC'), ('Empresa 5 LLC'), ('Empresa 6 LLC'), ('Empresa 7 LLC');

-- 2. Tabla de Transacciones / Recibos (Transactions)
CREATE TABLE public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    receipt_url TEXT,
    date_expected DATE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    profit_percentage DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabla de Tracking Diario (Daily Checklist)
CREATE TABLE public.daily_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    tracking_date DATE NOT NULL DEFAULT CURRENT_DATE,
    has_uploaded BOOLEAN DEFAULT FALSE,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, tracking_date)
);

-- 4. Bóveda de Contraseñas (Vault)
CREATE TABLE public.vault_credentials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_name TEXT NOT NULL,
    username TEXT NOT NULL,
    password_encrypted TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS) para que solo usuarios autenticados vean los datos
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_credentials ENABLE ROW LEVEL SECURITY;

-- Crear políticas para permitir acceso solo a usuarios autenticados (Partners y Admins)
CREATE POLICY "Authed users can view companies" ON public.companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authed users can view transactions" ON public.transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authed users can insert transactions" ON public.transactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authed users can update transactions" ON public.transactions FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authed users can view tracking" ON public.daily_tracking FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authed users can update tracking" ON public.daily_tracking FOR ALL TO authenticated USING (true);

CREATE POLICY "Authed users can access vault" ON public.vault_credentials FOR ALL TO authenticated USING (true);

-- Crear Storage Bucket para los Recibos (solo si no existe)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage
CREATE POLICY "Cualquiera puede ver los recibos" ON storage.objects FOR SELECT USING (bucket_id = 'receipts');
CREATE POLICY "Usuarios autenticados pueden subir recibos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'receipts');
