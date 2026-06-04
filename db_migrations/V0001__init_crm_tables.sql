CREATE TABLE IF NOT EXISTS t_p38013793_adaptive_crm_service.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  product TEXT NOT NULL DEFAULT '',
  product_type TEXT NOT NULL DEFAULT 'Бытовка',
  order_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  avito_link TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  comment TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Заинтересован',
  next_action_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p38013793_adaptive_crm_service.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  client_id UUID,
  due_date DATE NOT NULL,
  done BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p38013793_adaptive_crm_service.settings (
  id INT PRIMARY KEY DEFAULT 1,
  user_name TEXT NOT NULL DEFAULT 'Менеджер',
  commission_percent NUMERIC(5,2) NOT NULL DEFAULT 5
);
