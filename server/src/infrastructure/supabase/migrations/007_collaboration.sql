create type share_entity_type as enum ('project', 'task', 'brain_folder', 'brain_page');
create type collaboration_invite_status as enum ('pending', 'accepted', 'declined');

create table collaboration_shares (
  id uuid primary key default uuid_generate_v4(),
  entity_type share_entity_type not null,
  entity_id uuid not null,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  collaborator_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (entity_type, entity_id, collaborator_user_id)
);

create table collaboration_invites (
  id uuid primary key default uuid_generate_v4(),
  entity_type share_entity_type not null,
  entity_id uuid not null,
  entity_label text not null,
  sender_user_id uuid not null references auth.users(id) on delete cascade,
  sender_email text not null,
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  recipient_email text not null,
  status collaboration_invite_status not null default 'pending',
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  responded_at timestamptz
);

create index collaboration_shares_collaborator_idx
  on collaboration_shares (collaborator_user_id, entity_type);

create index collaboration_invites_recipient_idx
  on collaboration_invites (recipient_user_id, status, expires_at);

grant select, insert, update, delete on table collaboration_shares, collaboration_invites to authenticated, service_role;

alter table collaboration_shares enable row level security;
alter table collaboration_invites enable row level security;

create policy collaboration_shares_user_isolation on collaboration_shares
  using (owner_user_id = auth.uid() or collaborator_user_id = auth.uid())
  with check (owner_user_id = auth.uid() or collaborator_user_id = auth.uid());

create policy collaboration_invites_user_isolation on collaboration_invites
  using (sender_user_id = auth.uid() or recipient_user_id = auth.uid())
  with check (sender_user_id = auth.uid() or recipient_user_id = auth.uid());
