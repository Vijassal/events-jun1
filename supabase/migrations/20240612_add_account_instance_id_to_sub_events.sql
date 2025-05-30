-- Migration: Add account_instance_id to sub_events table
ALTER TABLE public.sub_events
ADD COLUMN IF NOT EXISTS account_instance_id uuid REFERENCES account_instances(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_sub_events_account_instance_id ON public.sub_events(account_instance_id); 