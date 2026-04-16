create table if not exists public.ember_push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  subscription jsonb not null,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.ember_push_subscriptions enable row level security;

drop policy if exists "Users can read their push subscriptions" on public.ember_push_subscriptions;
create policy "Users can read their push subscriptions"
on public.ember_push_subscriptions
for select
using (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "Users can insert their push subscriptions" on public.ember_push_subscriptions;
create policy "Users can insert their push subscriptions"
on public.ember_push_subscriptions
for insert
with check (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "Users can update their push subscriptions" on public.ember_push_subscriptions;
create policy "Users can update their push subscriptions"
on public.ember_push_subscriptions
for update
using (auth.uid() is not null and auth.uid() = user_id)
with check (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "Users can delete their push subscriptions" on public.ember_push_subscriptions;
create policy "Users can delete their push subscriptions"
on public.ember_push_subscriptions
for delete
using (auth.uid() is not null and auth.uid() = user_id);
