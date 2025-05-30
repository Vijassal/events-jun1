-- Migration: Add account_instance_members join table
CREATE TABLE IF NOT EXISTS public.account_instance_members (
  id serial PRIMARY KEY,
  account_instance_id uuid NOT NULL REFERENCES account_instances(id) ON DELETE CASCADE,
  user_id uuid NOT NULL, -- references users (or Supabase Auth users)
  role text DEFAULT 'member', -- e.g. 'owner', 'admin', 'member'
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (account_instance_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_account_instance_members_account_instance_id ON public.account_instance_members(account_instance_id);
CREATE INDEX IF NOT EXISTS idx_account_instance_members_user_id ON public.account_instance_members(user_id); 