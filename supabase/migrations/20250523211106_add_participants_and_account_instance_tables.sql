-- Create account_instances table
CREATE TABLE IF NOT EXISTS account_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc', now()),
  owner_user_id uuid NOT NULL
);

-- Create participants table
CREATE TABLE IF NOT EXISTS participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_instance_id uuid NOT NULL REFERENCES account_instances(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  family text,
  relationship text,
  invited_by text,
  tags text[],
  events text[],
  sub_events text[],
  additional_participants jsonb,
  is_child boolean,
  child_age int,
  created_at timestamp with time zone DEFAULT timezone('utc', now()),
  updated_at timestamp with time zone DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_participants_account_instance_id ON participants(account_instance_id);
