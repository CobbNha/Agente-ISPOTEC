# ISPOTEC AI

Assistente institucional baseado em RAG, com conhecimento proveniente de documentos oficiais do ISPOTEC.

## Stack inicial
- TanStack Start + React + TypeScript
- Supabase Auth + PostgreSQL + RLS + pgvector
- Railway para deploy
- GitHub para versionamento

## Segurança
- `/admin` protegido por Supabase Auth.
- Documentos públicos e internos separados por políticas de acesso.
- Chaves secretas apenas no servidor.

## Próximos módulos
1. Auth e rota `/admin`
2. Schema de conhecimento
3. Upload PDF/TXT/MD
4. Chunking + embeddings
5. Pesquisa semântica RAG
6. API de chat com fontes
7. Dashboard administrativo

## Estado
Bootstrap inicial — pronto para implementação incremental.
