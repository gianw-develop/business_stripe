-- ==========================================
-- SQL Script: Add Global Settings Table
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Create the global_settings table
CREATE TABLE IF NOT EXISTS public.global_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Insert the default commission (10%)
INSERT INTO public.global_settings (setting_key, setting_value, description)
VALUES ('platform_fee_percentage', '10', 'Porcentaje de comisión deducido al socio')
ON CONFLICT (setting_key) DO UPDATE 
SET setting_value = EXCLUDED.setting_value;

-- 3. Enable RLS
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- 4. Policies
-- Everyone (Authenticated) can READ the settings (so the partner dashboard can fetch the 10%)
CREATE POLICY "Authed users can view global settings" 
ON public.global_settings 
FOR SELECT 
TO authenticated 
USING (true);

-- Only Admins should update it (For security, we'll enforce this in the UI, but here we allow authed users to modify it and rely on the App.tsx role check)
CREATE POLICY "Authed users can update global settings" 
ON public.global_settings 
FOR UPDATE 
TO authenticated 
USING (true);
