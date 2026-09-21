create extension if not exists vector;

create type public.document_access as enum ('public', 'internal');
create type public.document_status as enum ('processing', 'ready', 'error');

create table public.categorias (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  created_at timestamptz not null default now()
);

create table public.documentos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  categoria_id uuid references public.categorias(id) on delete set null,
  acesso public.document_access not null default 'public',
  origem text,
  status public.document_status not null default 'processing',
  erro text,
  storage_path text,
  chunk_count integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.partes_documento (
  id uuid primary key default gen_random_uuid(),
  documento_id uuid not null references public.documentos(id) on delete cascade,
  conteudo text not null,
  ordem integer not null,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

create index partes_documento_documento_idx on public.partes_documento(documento_id);
create index partes_documento_embedding_hnsw_idx
  on public.partes_documento using hnsw (embedding vector_cosine_ops);

create table public.conversas (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  perfil text not null,
  created_at timestamptz not null default now()
);

create table public.mensagens (
  id uuid primary key default gen_random_uuid(),
  conversa_id uuid not null references public.conversas(id) on delete cascade,
  papel text not null check (papel in ('user', 'assistant')),
  conteudo text not null,
  created_at timestamptz not null default now()
);

create table public.fontes_utilizadas (
  id uuid primary key default gen_random_uuid(),
  mensagem_id uuid not null references public.mensagens(id) on delete cascade,
  documento_id uuid not null references public.documentos(id) on delete cascade,
  ordem integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.funcoes_utilizador (
  user_id uuid primary key references auth.users(id) on delete cascade,
  funcao text not null check (funcao in ('admin', 'DAF', 'Secretaria', 'Direcção Pedagógica')),
  created_at timestamptz not null default now()
);

alter table public.categorias enable row level security;
alter table public.documentos enable row level security;
alter table public.partes_documento enable row level security;
alter table public.conversas enable row level security;
alter table public.mensagens enable row level security;
alter table public.fontes_utilizadas enable row level security;
alter table public.funcoes_utilizador enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.funcoes_utilizador
    where user_id = auth.uid() and funcao = 'admin'
  );
$$;

create policy "public can read public documents"
on public.documentos for select
to anon, authenticated
using (acesso = 'public');

create policy "admins manage documents"
on public.documentos for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "public can read public chunks"
on public.partes_documento for select
to anon, authenticated
using (
  exists (
    select 1 from public.documentos d
    where d.id = documento_id and d.acesso = 'public' and d.status = 'ready'
  )
);

create policy "admins manage chunks"
on public.partes_documento for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins manage categories"
on public.categorias for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "users can create conversations"
on public.conversas for insert
to anon, authenticated
with check (true);

create policy "users can read own session conversations"
on public.conversas for select
to anon, authenticated
using (true);

create policy "users can create messages"
on public.mensagens for insert
to anon, authenticated
with check (true);

create policy "users can read messages"
on public.mensagens for select
to anon, authenticated
using (true);

create policy "admins manage sources"
on public.fontes_utilizadas for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins read roles"
on public.funcoes_utilizador for select
to authenticated
using (public.is_admin());
