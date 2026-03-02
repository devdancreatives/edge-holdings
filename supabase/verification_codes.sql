create table public.verification_codes (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  code text not null,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for faster lookups
create index validation_codes_email_idx on public.verification_codes (email);

-- RLS (Only service role should access this really, but for simplicity let's secure it)
alter table public.verification_codes enable row level security;

-- Only server functions (service_role) will access this, no public access policies needed.
