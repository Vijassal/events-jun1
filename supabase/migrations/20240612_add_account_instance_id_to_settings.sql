-- Migration: Add account_instance_id to settings table
ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS account_instance_id uuid REFERENCES account_instances(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_settings_account_instance_id ON public.settings(account_instance_id); 