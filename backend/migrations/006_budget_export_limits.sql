-- Agregar columnas de limites para presupuestos y exportaciones
ALTER TABLE plan_limits
ADD COLUMN max_budgets INTEGER NOT NULL DEFAULT 1,
ADD COLUMN max_exports_monthly INTEGER NOT NULL DEFAULT 5,
ADD COLUMN can_export_csv BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN can_export_excel BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN can_export_pdf BOOLEAN NOT NULL DEFAULT false;

-- Actualizar valores para cada plan

-- FREE (Defaults are already ok mostly, but ensuring)
UPDATE plan_limits 
SET max_budgets = 1, 
    max_exports_monthly = 5, 
    can_export_csv = true, 
    can_export_excel = false, 
    can_export_pdf = false 
WHERE tier = 'free';

-- STARTER
UPDATE plan_limits 
SET max_budgets = 5, 
    max_exports_monthly = 20, 
    can_export_csv = true, 
    can_export_excel = true, 
    can_export_pdf = false 
WHERE tier = 'starter';

-- PRO
UPDATE plan_limits 
SET max_budgets = 20, 
    max_exports_monthly = 100, 
    can_export_csv = true, 
    can_export_excel = true, 
    can_export_pdf = true 
WHERE tier = 'pro';

-- MAX
UPDATE plan_limits 
SET max_budgets = 999, 
    max_exports_monthly = 9999, 
    can_export_csv = true, 
    can_export_excel = true, 
    can_export_pdf = true 
WHERE tier = 'max';
