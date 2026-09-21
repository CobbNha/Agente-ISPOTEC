import { createClient } from '@supabase/supabase-js'
import { PDFParse } from 'pdf-parse'

export const config = { runtime: 'nodejs' }
export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') return Response.json({ error: 'Método não permitido.' }, { status: 405 })
  const form = await request.formData()
  const file = form.get('file')
  const title = String(form.get('title') || '').trim()
  const category = String(form.get('category') || 'Geral').trim()
  if (!(file instanceof File) || !title) return Response.json({ error: 'Título e ficheiro são obrigatórios.' }, { status: 400 })
  if (file.size > 10 * 1024 * 1024) return Response.json({ error: 'O ficheiro excede o limite de 10MB.' }, { status: 400 })
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

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!)
  const { data: cat } = await supabase.from('categorias').upsert({ nome: category }, { onConflict: 'nome' }).select('id').single()
  const { data: doc, error } = await supabase.from('documentos').insert({ titulo: title, categoria_id: cat?.id, origem: file.name, acesso: 'public', status: 'processing', storage_path: `documents/${Date.now()}-${file.name}` }).select('id').single()
  if (error || !doc) return Response.json({ error: 'Não foi possível criar o documento.' }, { status: 500 })
  const chunks = text.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean)
  if (chunks.length) await supabase.from('partes_documento').insert(chunks.map((conteudo, ordem) => ({ documento_id: doc.id, conteudo, ordem })))
  await supabase.from('documentos').update({ status: 'ready', chunk_count: chunks.length }).eq('id', doc.id)
  return Response.json({ id: doc.id, chunks: chunks.length })
}
