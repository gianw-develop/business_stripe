-- 1. Eliminar empresas de prueba (Borrando porque On Delete Cascade limpiará basura también)
DELETE FROM public.companies;

-- 2. Insertar las verdaderas LLCs
INSERT INTO public.companies (name) VALUES 
  ('GianWeb LLC'), 
  ('Apex Financial Advisors LLC'), 
  ('NexoMind AI LLC'), 
  ('NovaAW Software LLC'), 
  ('Marketing GP2 LLC'), 
  ('MarketCreatorPro LLC'), 
  ('Obiss LLC');

-- 3. Crear una tabla simple para roles (quién es admin y quién es partner)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'partner', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Asegurarse de que el RLS funciona para roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own role" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = id);
-- Como protección extra, los admins podrían leer todo, pero mantengamos simple leyendo la DB por ahora:
CREATE POLICY "Everyone can read roles" ON public.user_roles FOR SELECT TO authenticated USING (true);

-- Aquí deberás insertar manualment a través de Supabase SQL Editor tu correo de admin una vez registrado:
-- INSERT INTO public.user_roles (id, email, role) VALUES ('id-de-tu-usuario', 'tu@email.com', 'admin');
