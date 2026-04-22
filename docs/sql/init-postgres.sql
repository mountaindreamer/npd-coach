create table if not exists users (
  id text primary key,
  created_at timestamptz not null default now(),
  consent_dialogue_collection boolean not null default false,
  channel text
);

create table if not exists sessions (
  id text primary key,
  created_at timestamptz not null default now(),
  user_id text not null references users(id),
  mode text not null,
  scenario_id text,
  difficulty text,
  ended_at timestamptz,
  duration_sec int,
  message_count int,
  feedback_summary jsonb
);

create table if not exists messages (
  id text primary key,
  created_at timestamptz not null default now(),
  session_id text not null references sessions(id),
  user_id text not null references users(id),
  role text not null,
  content text not null
);

create table if not exists events (
  id text primary key,
  created_at timestamptz not null default now(),
  user_id text references users(id),
  session_id text references sessions(id),
  event text not null,
  props jsonb
);

create table if not exists ugc (
  id text primary key,
  user_id text not null references users(id),
  title text not null,
  content text not null,
  relationship_type text not null,
  created_at timestamptz not null default now(),
  plays int not null default 0,
  status text not null default 'pending',
  review_note text,
  reviewed_at timestamptz,
  reviewed_by text
);

create index if not exists idx_events_created_at on events(created_at desc);
create index if not exists idx_events_event on events(event, created_at desc);
create index if not exists idx_sessions_user on sessions(user_id, created_at desc);
create index if not exists idx_messages_session on messages(session_id, created_at);
create index if not exists idx_ugc_status on ugc(status, created_at desc);
