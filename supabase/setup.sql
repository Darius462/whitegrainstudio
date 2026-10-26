-- Execute once in the SQL Editor of your new Supabase project.
create table public.admins (user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.admins enable row level security;
create policy "Read own admin membership" on public.admins for select to authenticated using (user_id = auth.uid());
create function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.admins where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create table public.projects (
  id text primary key check (id ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
  title text not null check (length(trim(title)) between 1 and 160),
  category text not null check (category in ('identity','space')),
  year integer not null check (year between 1900 and 2200),
  subtitle text not null default '', meta text not null default '', description text not null default '',
  cover text not null, style text not null default 'atelier',
  images jsonb not null check (jsonb_typeof(images) = 'array' and jsonb_array_length(images) > 0),
  sort_order integer not null default 0, published boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.projects enable row level security;
create policy "Published projects are public" on public.projects for select to anon, authenticated using (published or public.is_admin());
create policy "Admins manage projects" on public.projects for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select on public.projects to anon;
grant select, insert, update, delete on public.projects to authenticated;

create table public.inquiries (
 id uuid primary key default gen_random_uuid(), name text not null, email text not null,
 service text not null, timeline text not null, message text not null,
 status text not null default 'new' check(status in ('new','read','done')),
 created_at timestamptz not null default now()
);
alter table public.inquiries enable row level security;
create policy "Admins read requests" on public.inquiries for select to authenticated using (public.is_admin());
create policy "Admins update requests" on public.inquiries for update to authenticated using (public.is_admin()) with check (public.is_admin());
grant select, update on public.inquiries to authenticated;
revoke all on public.inquiries from anon;

-- Public visitors can submit only through this validated function; they cannot read requests.
create function public.submit_inquiry(p_name text,p_email text,p_service text,p_timeline text,p_message text,p_website text default '')
returns void language plpgsql security definer set search_path = '' as $$
begin
 if coalesce(p_website,'') <> '' then return; end if;
 if p_name is null or length(trim(p_name)) not between 1 and 100
 or p_email is null or length(p_email) > 160 or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
 or p_service is null or length(p_service) not between 1 and 100
 or p_timeline is null or length(p_timeline)>100
 or p_message is null or length(trim(p_message)) not between 20 and 1800 then
   raise exception 'Invalid request';
 end if;
 -- Serialize duplicate checks so repeat clicks cannot create duplicate messages.
 perform pg_advisory_xact_lock(hashtextextended(lower(trim(p_email)), 0));
 if exists(select 1 from public.inquiries where lower(email)=lower(trim(p_email)) and created_at > now() - interval '1 minute') then
   raise exception 'Please wait before submitting another request';
 end if;
 insert into public.inquiries(name,email,service,timeline,message) values(trim(p_name),trim(p_email),p_service,p_timeline,trim(p_message));
end;
$$;
revoke all on function public.submit_inquiry(text,text,text,text,text,text) from public;
grant execute on function public.submit_inquiry(text,text,text,text,text,text) to anon, authenticated;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('portfolio','portfolio',true,10485760,array['image/jpeg','image/png','image/webp']);
create policy "Admins upload portfolio" on storage.objects for insert to authenticated with check(bucket_id='portfolio' and public.is_admin());
create policy "Admins read portfolio objects" on storage.objects for select to authenticated using(bucket_id='portfolio' and public.is_admin());
create policy "Admins delete portfolio objects" on storage.objects for delete to authenticated using(bucket_id='portfolio' and public.is_admin());
