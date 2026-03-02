-- Create a table for public profiles (extends auth.users)
create table public.users (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  role text default 'user' check (role in ('user', 'admin')),
  balance numeric(20, 6) default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.users enable row level security;

-- Create policies
create policy "Public profiles are viewable by everyone."
  on public.users for select
  using ( true );

create policy "Users can insert their own profile."
  on public.users for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on public.users for update
  using ( auth.uid() = id );

-- Wallets Table (Stores the derived address for each user)
create table public.wallets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null unique,
  address text not null unique,
  path_index integer not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Deposits Table (Logs incoming transfers)
create table public.deposits (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  amount numeric(20, 6) not null, -- USDT usually 6 decimals
  tx_hash text unique not null,
  status text default 'pending' check (status in ('pending', 'confirmed', 'failed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  confirmed_at timestamp with time zone
);

-- Investments Table (Active capital locks)
create table public.investments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  amount numeric(20, 6) not null,
  duration_months integer not null check (duration_months >= 1 and duration_months <= 6),
  start_date timestamp with time zone default timezone('utc'::text, now()) not null,
  end_date timestamp with time zone not null,
  status text default 'active' check (status in ('active', 'completed', 'cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ROI Snapshots (Weekly/Daily performance tracking)
create table public.roi_snapshots (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  date date default CURRENT_DATE not null,
  profit_amount numeric(20, 6) not null,
  roi_percentage numeric(10, 2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Transactions Table (General Ledger)
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  type text not null check (type in ('deposit', 'investment_start', 'profit_payout', 'withdrawal')),
  amount numeric(20, 6) not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Triggers for updated_at
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

-- Trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
