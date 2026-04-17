-- ============================================================
-- JBA Schedule App v2 — Supabase PostgreSQL Schema
-- 4階層: projects → gous → kikakus → tasks
-- ============================================================

-- 拡張
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. members（チームメンバーマスター）
-- ============================================================
create table public.members (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  role       text not null default 'other'
               check (role in ('director','writer','designer','editor','proofreader','desk','camera','sales','other')),
  color      text,                           -- hex e.g. #3b82f6（自動設定可）
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 2. projects（案件）
-- ============================================================
create table public.projects (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  client      text,                          -- クライアント名
  media_type  text default 'shanaiho'
                check (media_type in ('shanaiho','web','video','sns','other')),
  sort_order  int not null default 0,        -- サイドバー表示順
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- 3. project_members（プロジェクト⇔メンバー 中間テーブル）
-- ============================================================
create table public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  member_id  uuid not null references public.members(id) on delete cascade,
  primary key (project_id, member_id)
);

-- ============================================================
-- 4. gous（号）
-- ============================================================
create table public.gous (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  name        text not null,                 -- e.g. "vol.42", "2026年7月号"
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_gous_project on public.gous(project_id);

-- ============================================================
-- 5. kikakus（企画）
-- ============================================================
create table public.kikakus (
  id          uuid primary key default uuid_generate_v4(),
  gou_id      uuid not null references public.gous(id) on delete cascade,
  name        text not null,
  page_num    text,                          -- ページ番号 e.g. "P4-5"
  sort_order  int not null default 0,
  -- Excel由来メタ（任意）
  meta_designer   text,
  meta_kikaku     text,
  meta_interview  text,
  meta_writer     text,
  meta_editor     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_kikakus_gou on public.kikakus(gou_id);

-- ============================================================
-- 6. tasks（工程・タスク）
-- ============================================================
create table public.tasks (
  id              uuid primary key default uuid_generate_v4(),
  kikaku_id       uuid not null references public.kikakus(id) on delete cascade,
  name            text not null,
  assignee        text,                      -- 担当者名（自由テキスト or member.name）
  assignee_id     uuid references public.members(id) on delete set null,
  status          text not null default 'not_started'
                    check (status in ('not_started','in_progress','completed')),
  plan_start      date,
  plan_end        date,
  actual_start    date,
  actual_end      date,
  estimated_hours numeric(5,1),
  note            text,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_tasks_kikaku on public.tasks(kikaku_id);
create index idx_tasks_assignee on public.tasks(assignee_id);
create index idx_tasks_status on public.tasks(status);
create index idx_tasks_plan_end on public.tasks(plan_end);

-- ============================================================
-- 7. task_assignee_history（担当者変更履歴）
-- ============================================================
create table public.task_assignee_history (
  id          uuid primary key default uuid_generate_v4(),
  task_id     uuid not null references public.tasks(id) on delete cascade,
  from_name   text,
  to_name     text,
  changed_at  timestamptz not null default now()
);

create index idx_task_history_task on public.task_assignee_history(task_id);

-- ============================================================
-- 8. time_schedules（タイムライン配置）
-- ============================================================
create table public.time_schedules (
  id         uuid primary key default uuid_generate_v4(),
  member_id  uuid not null references public.members(id) on delete cascade,
  date       date not null,
  hour       int not null check (hour >= 0 and hour <= 23),
  task_id    uuid references public.tasks(id) on delete set null,
  unique (member_id, date, hour)
);

create index idx_time_schedules_member_date on public.time_schedules(member_id, date);

-- ============================================================
-- 9. custom_fmts（カスタムFMTテンプレート）
-- ============================================================
create table public.custom_fmts (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  steps      jsonb not null default '[]',    -- [{name: "工程名", defaultDays: 3}, ...]
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 10. app_settings（アプリ設定・UI状態の永続化）
-- ============================================================
create table public.app_settings (
  key   text primary key,
  value jsonb not null default '{}'
);

-- 初期値: ズーム設定等
insert into public.app_settings (key, value) values
  ('zoom', '"100"'),
  ('ui_state', '{"currentScreen":"dashboard","activeView":"table"}');

-- ============================================================
-- updated_at 自動更新トリガー
-- ============================================================
create or replace function public.update_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_members_updated    before update on public.members    for each row execute function public.update_timestamp();
create trigger trg_projects_updated   before update on public.projects   for each row execute function public.update_timestamp();
create trigger trg_gous_updated       before update on public.gous       for each row execute function public.update_timestamp();
create trigger trg_kikakus_updated    before update on public.kikakus    for each row execute function public.update_timestamp();
create trigger trg_tasks_updated      before update on public.tasks      for each row execute function public.update_timestamp();
create trigger trg_custom_fmts_updated before update on public.custom_fmts for each row execute function public.update_timestamp();

-- ============================================================
-- Row Level Security (RLS) — 将来の認証対応用
-- ============================================================
-- 現時点ではanon keyで全操作可能に設定
-- 認証導入時にポリシーを追加

alter table public.members enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.gous enable row level security;
alter table public.kikakus enable row level security;
alter table public.tasks enable row level security;
alter table public.task_assignee_history enable row level security;
alter table public.time_schedules enable row level security;
alter table public.custom_fmts enable row level security;
alter table public.app_settings enable row level security;

-- anon/authenticated 全許可ポリシー（認証導入前の開発用）
do $$
declare
  tbl text;
begin
  for tbl in select unnest(array[
    'members','projects','project_members','gous','kikakus',
    'tasks','task_assignee_history','time_schedules','custom_fmts','app_settings'
  ]) loop
    execute format(
      'create policy "Allow all for %1$s" on public.%1$s for all using (true) with check (true)',
      tbl
    );
  end loop;
end $$;

-- ============================================================
-- ビュー: タスク一覧（フラットJOIN）
-- ============================================================
create or replace view public.v_tasks_flat as
select
  t.id as task_id,
  t.name as task_name,
  t.status,
  t.plan_start,
  t.plan_end,
  t.actual_start,
  t.actual_end,
  t.estimated_hours,
  t.assignee,
  t.note,
  k.id as kikaku_id,
  k.name as kikaku_name,
  k.page_num,
  g.id as gou_id,
  g.name as gou_name,
  p.id as project_id,
  p.name as project_name,
  p.client
from public.tasks t
join public.kikakus k on k.id = t.kikaku_id
join public.gous g on g.id = k.gou_id
join public.projects p on p.id = g.project_id
order by p.sort_order, g.sort_order, k.sort_order, t.sort_order;

-- ============================================================
-- ビュー: プロジェクト進捗サマリー
-- ============================================================
create or replace view public.v_project_progress as
select
  p.id as project_id,
  p.name as project_name,
  p.client,
  count(t.id) as total_tasks,
  count(t.id) filter (where t.status = 'completed') as completed_tasks,
  count(t.id) filter (where t.status = 'in_progress') as in_progress_tasks,
  count(t.id) filter (where t.status = 'not_started') as not_started_tasks,
  case when count(t.id) > 0
    then round(100.0 * count(t.id) filter (where t.status = 'completed') / count(t.id), 1)
    else 0
  end as progress_pct,
  count(t.id) filter (where t.plan_end < current_date and t.status != 'completed') as overdue_tasks
from public.projects p
left join public.gous g on g.project_id = p.id
left join public.kikakus k on k.gou_id = g.id
left join public.tasks t on t.kikaku_id = k.id
group by p.id, p.name, p.client;
