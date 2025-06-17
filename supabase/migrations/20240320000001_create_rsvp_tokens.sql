-- Create RSVP tokens table
create table public.rsvp_tokens (
  id uuid not null default gen_random_uuid(),
  token text not null,
  participant_id uuid not null,
  event_id text not null,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default now(),
  constraint rsvp_tokens_pkey primary key (id),
  constraint rsvp_tokens_participant_id_fkey foreign key (participant_id) references participants(id) on delete cascade
);

-- Create indexes
create index idx_rsvp_tokens_token on public.rsvp_tokens(token);
create index idx_rsvp_tokens_participant_id on public.rsvp_tokens(participant_id);
create index idx_rsvp_tokens_event_id on public.rsvp_tokens(event_id); 