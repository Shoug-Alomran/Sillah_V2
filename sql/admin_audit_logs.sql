create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action_type text not null,
  target_type text not null,
  target_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_created_at_idx
on public.admin_audit_logs (created_at desc);

create index if not exists admin_audit_logs_actor_id_idx
on public.admin_audit_logs (actor_id);

alter table public.admin_audit_logs enable row level security;

drop policy if exists "Admins can read audit logs"
on public.admin_audit_logs;

create policy "Admins can read audit logs"
on public.admin_audit_logs
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role::text = 'admin'
  )
);

drop policy if exists "Admins can create audit logs"
on public.admin_audit_logs;

create policy "Admins can create audit logs"
on public.admin_audit_logs
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role::text = 'admin'
  )
);

notify pgrst, 'reload schema';
