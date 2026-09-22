import { createClient } from '@supabase/supabase-js'
import { PDFParse } from 'pdf-parse'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const execFileAsync = promisify(execFile)

export const config = { runtime: 'nodejs' }
export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') return Response.json({ error: 'Método não permitido.' }, { status: 405 })

  try {
    const form = await request.formData()
  const file = form.get('file')
  const title = String(form.get('title') || '').trim()
  const category = String(form.get('category') || 'Geral').trim()
  if (!(file instanceof File) || !title) return Response.json({ error: 'Título e ficheiro são obrigatórios.' }, { status: 400 })
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
  const fileName = file.name.toLowerCase()
  const fileBytes = Buffer.from(await file.arrayBuffer())

  if (file.type === 'application/pdf' || fileName.endsWith('.pdf')) {
    const parser = new PDFParse({ data: fileBytes })
    const parsed = await parser.getText()
    text = parsed.text
    await parser.destroy()
  } else if (fileName.endsWith('.docx')) {
    const tempDir = await mkdtemp(join(tmpdir(), 'ispotec-upload-'))
    const tempPath = join(tempDir, file.name.replace(/[^a-zA-Z0-9._-]/g, '_'))
    try {
      await writeFile(tempPath, fileBytes)
      const { stdout } = await execFileAsync('unzip', ['-p', tempPath, 'word/document.xml'], { maxBuffer: 20 * 1024 * 1024 })
      text = stdout
        .replace(/<w:tab\s*\/?>/g, '\\t')
        .replace(/<w:br\s*\/?>/g, '\\n')
        .replace(/<\\/w:p>/g, '\\n\\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/\\n{3,}/g, '\\n\\n')
        .trim()
    } finally {
      await rm(tempDir, { recursive: true, force: true })
    }
  } else if (fileName.endsWith('.doc')) {
    const tempDir = await mkdtemp(join(tmpdir(), 'ispotec-upload-'))
    const tempPath = join(tempDir, file.name.replace(/[^a-zA-Z0-9._-]/g, '_'))
    try {
      await writeFile(tempPath, fileBytes)
      const { stdout } = await execFileAsync('antiword', [tempPath], { maxBuffer: 20 * 1024 * 1024 })
      text = stdout
    } catch {
      return Response.json({ error: 'O formato .doc antigo não pôde ser lido neste servidor. Guarde o ficheiro como .docx ou PDF e tente novamente.' }, { status: 400 })
    } finally {
      await rm(tempDir, { recursive: true, force: true })
    }
  } else {
    text = new TextDecoder().decode(fileBytes)
  }
  if (!text.trim()) return Response.json({ error: 'Não foi possível extrair texto deste ficheiro. Para documentos digitalizados, use um PDF com texto selecionável.' }, { status: 400 })

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
  let chunksError: { message: string } | null = null
  for (let start = 0; start < chunks.length; start += 100) {
    const batch = chunks.slice(start, start + 100).map((conteudo, index) => ({
      documento_id: doc.id,
      conteudo,
      ordem: start + index,
    }))
    const result = await supabase.from('partes_documento').insert(batch)
    if (result.error) {
      chunksError = result.error
      break
    }
  }
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
