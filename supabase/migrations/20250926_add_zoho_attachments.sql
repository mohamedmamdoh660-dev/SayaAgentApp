create table if not exists public.zoho_attachments (
  id text not null,
  created_at timestamp with time zone not null default now(),
  name text null,
  module text null,
  module_id text null,
  constraint zoho_attachments_pkey primary key (id)
);

comment on table public.zoho_attachments is 'Attachments synced from Zoho; module_id corresponds to the record id (e.g., application id or student id).';

