import * as React from 'react'
import { createSupabaseBrowserClient } from '../lib/supabase/client'

type Doc = { id: string; titulo: string; status: string }
export function DocumentEditor({ doc, onSave }: { doc: Doc; onSave: () => void }) {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), [])
  const [title, setTitle] = React.useState(doc.titulo)
  const [content, setContent] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [message, setMessage] = React.useState('')
  React.useEffect(() => { supabase.from('partes_documento').select('conteudo').eq('documento_id', doc.id).order('ordem').then(({ data }) => setContent((data || []).map((part) => part.conteudo).join('\n\n'))) }, [doc.id])
  async function save() {
    setSaving(true); setMessage('')
    const chunks = content.split(/\n\s*\n/).map((text) => text.trim()).filter(Boolean)
    const { error: titleError } = await supabase.from('documentos').update({ titulo: title, status: 'ready', chunk_count: chunks.length, updated_at: new Date().toISOString() }).eq('id', doc.id)
    await supabase.from('partes_documento').delete().eq('documento_id', doc.id)
    const { error: partsError } = chunks.length ? await supabase.from('partes_documento').insert(chunks.map((conteudo, ordem) => ({ documento_id: doc.id, conteudo, ordem }))) : { error: null }
    setSaving(false)
    if (titleError || partsError) { setMessage('Não foi possível guardar as alterações.'); return }
    setMessage('Conhecimento atualizado com sucesso.'); onSave()
  }
  return <div style={styles.card}>
    <label style={styles.label}>Título do documento</label><input value={title} onChange={(e) => setTitle(e.target.value)} style={styles.input} />
    <label style={styles.label}>Conteúdo de conhecimento</label><p style={styles.help}>Separe os temas por parágrafos. Este conteúdo será usado pelo agente nas respostas.</p><textarea value={content} onChange={(e) => setContent(e.target.value)} rows={18} style={styles.textarea} placeholder="Cole ou escreva aqui o conteúdo oficial..." />
    <div style={styles.footer}><span style={styles.message}>{message}</span><button disabled={saving || !title.trim()} onClick={save} style={styles.button}>{saving ? 'A guardar...' : 'Guardar conhecimento'}</button></div>
  </div>
}
const styles: Record<string, React.CSSProperties> = { card: { maxWidth: 850, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 28 }, label: { display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '.04em' }, help: { fontSize: 13, color: '#64748b', margin: '-2px 0 10px' }, input: { width: '100%', boxSizing: 'border-box', padding: 12, border: '1px solid #cbd5e1', borderRadius: 7, marginBottom: 24, font: 'inherit' }, textarea: { width: '100%', boxSizing: 'border-box', resize: 'vertical', padding: 14, border: '1px solid #cbd5e1', borderRadius: 7, font: 'inherit', lineHeight: 1.6 }, footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginTop: 18 }, message: { color: '#166534', fontSize: 13 }, button: { border: 0, background: '#0f172a', color: '#fff', borderRadius: 7, padding: '11px 16px', fontWeight: 700, cursor: 'pointer' } }
