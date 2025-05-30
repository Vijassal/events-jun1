-- Migration: Add account_instance_id to vendors table
ALTER TABLE public.vendors
ADD COLUMN IF NOT EXISTS account_instance_id uuid REFERENCES account_instances(id) ON DELETE CASCADE;

-- Optional: Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vendors_account_instance_id ON public.vendors(account_instance_id); 