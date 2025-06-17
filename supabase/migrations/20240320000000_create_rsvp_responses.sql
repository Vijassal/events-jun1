-- Create RSVP responses table
create table public.rsvp_responses (
  id uuid not null default gen_random_uuid(),
  participant_id uuid not null,
  event_id text not null,
  response_status text not null check (response_status in ('pending', 'accepted', 'declined')),
  response_date timestamp with time zone,
  additional_notes text,
  custom_responses jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint rsvp_responses_pkey primary key (id),
  constraint rsvp_responses_participant_id_fkey foreign key (participant_id) references participants(id) on delete cascade
);

-- Create indexes
create index idx_rsvp_responses_participant_id on public.rsvp_responses(participant_id);
create index idx_rsvp_responses_event_id on public.rsvp_responses(event_id);

-- Create RSVP custom questions table
create table public.rsvp_custom_questions (
  id uuid not null default gen_random_uuid(),
  event_id text not null,
  question_text text not null,
  question_type text not null check (question_type in ('text', 'dropdown', 'checkbox')),
  options jsonb,
  is_required boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint rsvp_custom_questions_pkey primary key (id)
);

-- Create index
create index idx_rsvp_custom_questions_event_id on public.rsvp_custom_questions(event_id); 