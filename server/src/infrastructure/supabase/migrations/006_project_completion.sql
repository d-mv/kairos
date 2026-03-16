alter table public.projects
add column if not exists completed_at timestamptz null;
