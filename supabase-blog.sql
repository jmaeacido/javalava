-- ============================================================
--  Java Lava — Blog CMS schema
--  Run in Supabase SQL editor (idempotent — safe to re-run)
-- ============================================================

-- --------------------------------------------------------
--  Categories
-- --------------------------------------------------------
create table if not exists public.blog_categories (
  id   uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists blog_categories_slug_idx on public.blog_categories (slug);

-- --------------------------------------------------------
--  Tags
-- --------------------------------------------------------
create table if not exists public.blog_tags (
  id   uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists blog_tags_slug_idx on public.blog_tags (slug);

-- --------------------------------------------------------
--  Posts
-- --------------------------------------------------------
create table if not exists public.blog_posts (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  slug             text not null unique,
  excerpt          text,
  content_html     text,
  featured_image   text,
  status           text not null default 'draft'
                     check (status in ('draft','published','archived')),
  category_id      uuid references public.blog_categories (id) on delete set null,
  meta_title       text,
  meta_description text,
  author_name      text not null default 'Java Lava',
  read_time_mins   integer,
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists blog_posts_slug_idx        on public.blog_posts (slug);
create index if not exists blog_posts_status_idx      on public.blog_posts (status);
create index if not exists blog_posts_published_at_idx on public.blog_posts (published_at desc);
create index if not exists blog_posts_category_idx    on public.blog_posts (category_id);

-- --------------------------------------------------------
--  Post ↔ Tag (many-to-many)
-- --------------------------------------------------------
create table if not exists public.blog_post_tags (
  post_id uuid not null references public.blog_posts (id) on delete cascade,
  tag_id  uuid not null references public.blog_tags  (id) on delete cascade,
  primary key (post_id, tag_id)
);

create index if not exists blog_post_tags_tag_idx on public.blog_post_tags (tag_id);

-- --------------------------------------------------------
--  Auto-update updated_at
-- --------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists blog_posts_updated_at on public.blog_posts;
create trigger blog_posts_updated_at
  before update on public.blog_posts
  for each row execute function public.set_updated_at();

-- --------------------------------------------------------
--  Row-Level Security (public read for published posts)
-- --------------------------------------------------------
alter table public.blog_posts      enable row level security;
alter table public.blog_categories enable row level security;
alter table public.blog_tags       enable row level security;
alter table public.blog_post_tags  enable row level security;

-- Allow anyone (anon key) to read published posts
drop policy if exists "public read published posts" on public.blog_posts;
create policy "public read published posts"
  on public.blog_posts for select
  using (status = 'published');

-- Allow service role (used by API functions) to do everything
drop policy if exists "service role full access posts" on public.blog_posts;
create policy "service role full access posts"
  on public.blog_posts for all
  using (auth.role() = 'service_role');

-- Categories and tags are fully public (read-only)
drop policy if exists "public read categories" on public.blog_categories;
create policy "public read categories"
  on public.blog_categories for select using (true);

drop policy if exists "service role full access categories" on public.blog_categories;
create policy "service role full access categories"
  on public.blog_categories for all using (auth.role() = 'service_role');

drop policy if exists "public read tags" on public.blog_tags;
create policy "public read tags"
  on public.blog_tags for select using (true);

drop policy if exists "service role full access tags" on public.blog_tags;
create policy "service role full access tags"
  on public.blog_tags for all using (auth.role() = 'service_role');

drop policy if exists "public read post_tags" on public.blog_post_tags;
create policy "public read post_tags"
  on public.blog_post_tags for select using (true);

drop policy if exists "service role full access post_tags" on public.blog_post_tags;
create policy "service role full access post_tags"
  on public.blog_post_tags for all using (auth.role() = 'service_role');
