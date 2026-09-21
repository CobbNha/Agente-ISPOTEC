import { createSupabaseBrowserClient } from '../lib/supabase/client'

export default function AdminRoute() {
  const supabase = createSupabaseBrowserClient()

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: 32, fontFamily: 'Arial, sans-serif' }}>
      <h1>Administração — ISPOTEC AI</h1>
      <p>Área reservada para gestão do conhecimento institucional.</p>
      <div style={{ display: 'grid', gap: 12, marginTop: 24 }}>
        <div>📚 Documentos</div>
        <div>🧩 Processamento e embeddings</div>
        <div>📊 Estatísticas e perguntas</div>
        <button onClick={signOut}>Terminar sessão</button>
      </div>
    </main>
  )
}
