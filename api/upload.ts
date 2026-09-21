import { createClient } from '@supabase/supabase-js'
import { PDFParse } from 'pdf-parse'

export const config = { runtime: 'nodejs' }
export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') return Response.json({ error: 'Método não permitido.' }, { status: 405 })

  try {
    const form = await request.formData()
  const file = form.get('file')
  const title = String(form.get('title') || '').trim()
  const category = String(form.get('category') || 'Geral').trim()
  if (!(file instanceof File) || !title) return Response.json({ error: 'Título e ficheiro são obrigatórios.' }, { status: 400 })
  if (file.size > 10 * 1024 * 1024) return Response.json({ error: 'O ficheiro excede o limite de 10MB.' }, { status: 400 })

  const authorization = request.headers.get('authorization')
  if (!authorization?.startsWith('Bearer ')) return Response.json({ error: 'Sessão necessária.' }, { status: 401 })

  const supabaseUrl = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
  if (!supabaseUrl || !serviceKey) {
    return Response.json({ error: 'O servidor não está configurado para receber documentos.' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    global: { headers: { Authorization: authorization } },
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) return Response.json({ error: 'Sessão inválida.' }, { status: 401 })

  const { data: role } = await supabase
    .from('funcoes_utilizador')
    .select('funcao')
    .eq('user_id', userData.user.id)
    .eq('funcao', 'admin')
    .maybeSingle()
  if (!role) return Response.json({ error: 'Apenas administradores podem carregar documentos.' }, { status: 403 })

  let text = ''
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    const parser = new PDFParse({ data: Buffer.from(await file.arrayBuffer()) })
    const parsed = await parser.getText()
    text = parsed.text
    await parser.destroy()
  } else {
    text = await file.text()
  }
  if (!text.trim()) return Response.json({ error: 'Não foi possível extrair texto deste ficheiro.' }, { status: 400 })

  const { data: cat, error: categoryError } = await supabase.from('categorias').upsert({ nome: category }, { onConflict: 'nome' }).select('id').single()
  if (categoryError) return Response.json({ error: `Não foi possível guardar a categoria: ${categoryError.message}` }, { status: 500 })

  const { data: doc, error } = await supabase.from('documentos').insert({
    titulo: title,
    categoria_id: cat?.id,
    origem: file.name,
    acesso: 'public',
    status: 'processing',
    storage_path: `documents/${Date.now()}-${file.name}`,
    created_by: userData.user.id,
  }).select('id').single()
  if (error || !doc) return Response.json({ error: `Não foi possível criar o documento: ${error?.message || 'erro desconhecido'}` }, { status: 500 })

  const chunks = text
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean)
    .flatMap((part) => part.match(/.{1,12000}(?:\s|$)/g) || [part])
  const { error: chunksError } = chunks.length
    ? await supabase.from('partes_documento').insert(chunks.map((conteudo, ordem) => ({ documento_id: doc.id, conteudo, ordem })))
    : { error: null }
  if (chunksError) {
    await supabase.from('documentos').update({ status: 'error', erro: chunksError.message }).eq('id', doc.id)
    return Response.json({ error: `Não foi possível indexar o conteúdo: ${chunksError.message}` }, { status: 500 })
  }

  const { error: readyError } = await supabase.from('documentos').update({ status: 'ready', chunk_count: chunks.length }).eq('id', doc.id)
  if (readyError) return Response.json({ error: `Documento criado, mas não foi possível concluir o processamento: ${readyError.message}` }, { status: 500 })
  return Response.json({ id: doc.id, chunks: chunks.length })
  } catch (error) {
    console.error('[v0] Erro inesperado no upload:', error)
    return Response.json({ error: 'O upload falhou ao processar o ficheiro. Tente novamente.' }, { status: 500 })
  }
}
