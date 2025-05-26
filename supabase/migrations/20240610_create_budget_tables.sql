-- Migration: Create Budget, Logged Payments, and Logged Item Costs tables

CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase text NOT NULL,
  vendor_id uuid, -- (nullable for now, will link to vendors table in future)
  date date NOT NULL,
  event_id uuid, -- (nullable for now, will link to events/sub-events table)
  category text,
  cost numeric(12,2) NOT NULL,
  tags text[],
  payment_for text,
  payment_by text,
  created_at timestamp with time zone DEFAULT timezone('utc', now()),
  updated_at timestamp with time zone DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS logged_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  purchase text, -- (optional, for redundancy/search, but can be joined from budgets)
  payment_amount numeric(12,2) NOT NULL,
  payment_by text,
  payment_for text,
  payment_date date NOT NULL,
  item text,
  created_at timestamp with time zone DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS logged_item_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logged_payment_id uuid NOT NULL REFERENCES logged_payments(id) ON DELETE CASCADE,
  item text,
  per_cost numeric(12,2),
  subtotal numeric(12,2),
  total numeric(12,2),
  created_at timestamp with time zone DEFAULT timezone('utc', now())
); 