-- Añadir la columna de notas a la tabla de transacciones de forma segura
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS notes TEXT;
