-- Drop existing triggers and functions
drop trigger if exists handle_profiles_updated_at on profiles;
drop trigger if exists update_profiles_updated_at on profiles;
drop function if exists public.handle_updated_at() cascade;

-- Create profiles table
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    name text,
    email text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Public profiles are viewable by everyone." on profiles;
drop policy if exists "Users can insert their own profile." on profiles;
drop policy if exists "Users can update own profile." on profiles;

-- Create policies
create policy "Public profiles are viewable by everyone."
    on profiles for select
    using ( true );

create policy "Users can update own profile."
    on profiles for update
    using ( auth.uid() = id );

-- Create indexes
create index if not exists profiles_id_idx on public.profiles using btree (id);
create index if not exists profiles_email_idx on public.profiles using btree (email);

-- Set up automatic updated_at
create function public.handle_updated_at()
returns trigger
language plpgsql
security definer
as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$;

create trigger update_profiles_updated_at
    before update on public.profiles
    for each row
    execute function public.handle_updated_at(); 