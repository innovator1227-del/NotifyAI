create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile" on public.profiles for all to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  platform text not null default 'demo',
  external_notification_id text,
  sender_name text not null,
  sender_username text,
  sender_avatar text,
  message text not null,
  source_url text,
  category text not null default 'other',
  priority text not null default 'medium',
  importance_score int not null default 50,
  suggested_action text,
  read_status boolean not null default false,
  archived_status boolean not null default false,
  is_important boolean not null default false,
  handled boolean not null default false,
  ai_summary text,
  ai_reason text,
  ai_source text,
  is_spam boolean not null default false,
  is_seed boolean not null default false,
  user_override boolean not null default false,
  analyzed_hash text,
  received_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index notifications_ext_uniq on public.notifications(user_id, platform, external_notification_id) where external_notification_id is not null;
create index notifications_user_received on public.notifications(user_id, received_at desc);
create index notifications_user_priority on public.notifications(user_id, priority);
grant select, insert, update, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "own notifications" on public.notifications for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.notification_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null,
  conditions jsonb not null default '[]',
  actions jsonb not null default '[]',
  match_mode text not null default 'all',
  rule_priority int not null default 0,
  active boolean not null default true,
  run_count int not null default 0,
  last_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.notification_rules to authenticated;
grant all on public.notification_rules to service_role;
alter table public.notification_rules enable row level security;
create policy "own rules" on public.notification_rules for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  provider text not null,
  status text not null default 'disconnected',
  last_sync_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, provider)
);
grant select, insert, update, delete on public.integrations to authenticated;
grant all on public.integrations to service_role;
alter table public.integrations enable row level security;
create policy "own integrations" on public.integrations for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.digests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  period_start timestamptz not null,
  period_end timestamptz not null,
  summary text not null,
  highlights jsonb not null default '[]',
  next_actions jsonb not null default '[]',
  notification_count int not null default 0,
  source text not null default 'ai',
  created_at timestamptz not null default now()
);
create index digests_user on public.digests(user_id, created_at desc);
grant select, insert, update, delete on public.digests to authenticated;
grant all on public.digests to service_role;
alter table public.digests enable row level security;
create policy "own digests" on public.digests for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.user_preferences (
  user_id uuid primary key default auth.uid(),
  important_categories text[] not null default array['work','security','personal'],
  important_contacts text[] not null default '{}',
  priority_threshold int not null default 70,
  ai_enabled boolean not null default true,
  auto_analyze boolean not null default true,
  quiet_hours_enabled boolean not null default false,
  quiet_start text not null default '22:00',
  quiet_end text not null default '07:00',
  digest_frequency text not null default 'daily',
  email_notifications boolean not null default false,
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.user_preferences to authenticated;
grant all on public.user_preferences to service_role;
alter table public.user_preferences enable row level security;
create policy "own prefs" on public.user_preferences for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, display_name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)), new.raw_user_meta_data->>'avatar_url')
  on conflict do nothing;
  insert into public.user_preferences(user_id) values (new.id) on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;
create trigger t_notif before update on public.notifications for each row execute function public.touch_updated_at();
create trigger t_rules before update on public.notification_rules for each row execute function public.touch_updated_at();
create trigger t_prof before update on public.profiles for each row execute function public.touch_updated_at();
create trigger t_int before update on public.integrations for each row execute function public.touch_updated_at();