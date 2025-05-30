-- Migration: Add account_instance_id to events table
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS account_instance_id uuid REFERENCES account_instances(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_events_account_instance_id ON public.events(account_instance_id); 