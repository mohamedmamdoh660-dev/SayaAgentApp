-- Create notifications table
create table if not exists public.zoho_notifications (
  id text primary key,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone null,
  title text not null,
  content text null,
  module_name text not null,
  module_id text not null,
  user_id uuid null,
  url text null,
  priority text null default 'normal',
  is_read boolean not null default false
);

-- Helpful indexes
create index if not exists idx_zoho_notifications_user_id on public.zoho_notifications(user_id);
create index if not exists idx_zoho_notifications_is_read on public.zoho_notifications(is_read);
create index if not exists idx_zoho_notifications_created_at on public.zoho_notifications(created_at desc);


