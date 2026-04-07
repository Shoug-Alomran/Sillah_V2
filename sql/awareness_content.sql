create table if not exists public.awareness_content (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null,
  category text not null default 'General',
  reading_time integer not null default 5
    check (reading_time > 0),
  image_url text,
  content_body text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  is_featured boolean not null default false,
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.awareness_content
add column if not exists title text;

alter table public.awareness_content
add column if not exists summary text;

alter table public.awareness_content
add column if not exists category text not null default 'General';

alter table public.awareness_content
add column if not exists reading_time integer not null default 5;

alter table public.awareness_content
add column if not exists image_url text;

alter table public.awareness_content
add column if not exists content_body text;

alter table public.awareness_content
add column if not exists status text not null default 'pending';

alter table public.awareness_content
add column if not exists is_featured boolean not null default false;

alter table public.awareness_content
add column if not exists reviewed_at timestamptz;

alter table public.awareness_content
add column if not exists reviewed_by uuid references public.profiles(id) on delete set null;

alter table public.awareness_content
add column if not exists created_at timestamptz not null default now();

alter table public.awareness_content
add column if not exists updated_at timestamptz not null default now();

create index if not exists awareness_content_status_idx
on public.awareness_content (status);

create index if not exists awareness_content_updated_at_idx
on public.awareness_content (updated_at desc);

create index if not exists awareness_content_category_idx
on public.awareness_content (category);

alter table public.awareness_content enable row level security;

drop policy if exists "Authenticated users can read approved awareness content"
on public.awareness_content;

create policy "Authenticated users can read approved awareness content"
on public.awareness_content
for select
to authenticated
using (status = 'approved');

drop policy if exists "Admins can manage awareness content"
on public.awareness_content;

create policy "Admins can manage awareness content"
on public.awareness_content
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role::text = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role::text = 'admin'
  )
);

with starter_content (
  title,
  summary,
  category,
  reading_time,
  image_url,
  content_body,
  status,
  is_featured,
  reviewed_at,
  updated_at
) as (
  values
    (
      'Understanding Sickle Cell Disease',
      'Learn about the genetic causes, symptoms, and management of sickle cell disease in families.',
      'Sickle Cell Disease',
      8,
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=400&fit=crop',
      'Sickle cell disease is an inherited blood condition that affects hemoglobin. Families benefit from early screening, regular follow-up, hydration, vaccination, and clear care plans with their provider.',
      'approved',
      true,
      now(),
      now()
    ),
    (
      'Genetic Screening: What You Need to Know',
      'A practical guide to genetic screening tests, why they matter, and what to expect during the process.',
      'Genetic Screening',
      6,
      'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800&h=400&fit=crop',
      'Genetic screening can identify inherited risk before symptoms appear. Results should be reviewed with a qualified clinician or genetic counselor so families understand next steps.',
      'approved',
      true,
      now(),
      now()
    ),
    (
      'Heart Health and Hereditary Conditions',
      'Explore how genetic factors influence cardiovascular health and what families can do for prevention.',
      'Heart Health',
      7,
      'https://images.unsplash.com/photo-1628348070889-cb656235b4eb?w=800&h=400&fit=crop',
      'Some heart conditions can cluster in families. Keeping family history updated, attending checkups, and discussing symptoms early can improve prevention and follow-up quality.',
      'approved',
      false,
      now(),
      now()
    ),
    (
      'Prevention Strategies for Genetic Diseases',
      'Evidence-based strategies to reduce risk and support families with hereditary health concerns.',
      'Prevention',
      5,
      null,
      'Prevention starts with accurate family records, screening when recommended, healthy lifestyle habits, and regular communication with healthcare providers.',
      'approved',
      false,
      now(),
      now()
    ),
    (
      'Family Planning and Genetic Counseling',
      'Important considerations for family planning when genetic conditions are present in family history.',
      'Family Planning',
      10,
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&h=400&fit=crop',
      'Genetic counseling can help families understand inheritance patterns, screening options, and planning decisions in a supportive clinical setting.',
      'approved',
      false,
      now(),
      now()
    )
)
insert into public.awareness_content (
  title,
  summary,
  category,
  reading_time,
  image_url,
  content_body,
  status,
  is_featured,
  reviewed_at,
  updated_at
)
select
  title,
  summary,
  category,
  reading_time,
  image_url,
  content_body,
  status,
  is_featured,
  reviewed_at,
  updated_at
from starter_content seed
where not exists (
  select 1
  from public.awareness_content existing
  where lower(existing.title) = lower(seed.title)
);

notify pgrst, 'reload schema';
