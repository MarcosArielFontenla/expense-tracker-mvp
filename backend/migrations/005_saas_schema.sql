-- Definimos los niveles del plan
CREATE TYPE plan_tier AS ENUM ('free', 'starter', 'pro', 'max');

-- Definimos el estado de la suscripción
CREATE TYPE subscription_status AS ENUM ('active', 'trialing', 'past_due', 'canceled', 'expired');

-- Modificar tabla users
ALTER TABLE public.users
ADD COLUMN plan plan_tier NOT NULL DEFAULT 'free',
ADD COLUMN sub_status subscription_status NOT NULL DEFAULT 'active',
ADD COLUMN trial_start_date TIMESTAMP DEFAULT NULL,
ADD COLUMN billing_customer_id VARCHAR(255);

-- Crear tabla de limites del plan
CREATE TABLE plan_limits (
    tier plan_tier PRIMARY KEY,
    max_accounts INTEGER NOT NULL,
    max_categories INTEGER NOT NULL,
    max_transactions_monthly INTEGER NOT NULL,
    audit_log_retention_days INTEGER NOT NULL,
    can_export_data BOOLEAN DEFAULT false,
    has_priority_support BOOLEAN DEFAULT false
);

-- Poblar limites por defecto
INSERT INTO plan_limits (tier, max_accounts, max_categories, max_transactions_monthly, audit_log_retention_days, can_export_data, has_priority_support) VALUES
('free',    2,  5,   50,    7, false, false),
('starter', 5, 15,  200,   30, true,  false),
('pro',    15, 50, 1000,   90, true,  true),
('max',   999, 999, 9999, 365, true,  true);
