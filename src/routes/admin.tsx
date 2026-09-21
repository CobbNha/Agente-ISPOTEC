import * as React from 'react'
import { createSupabaseBrowserClient } from '../lib/supabase/client'
import { requireAdmin } from '../lib/supabase/auth'

export default function AdminRoute() {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), [])
  const [userEmail, setUserEmail] = React.useState('')
  const [checking, setChecking] = React.useState(true)

  React.useEffect(() => {
    requireAdmin().then((user) => {
      if (user) setUserEmail(user.email ?? '')
      setChecking(false)
    })
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (checking) return <main style={{ padding: 32 }}>A verificar acesso...</main>

  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: 32, fontFamily: 'Arial, sans-serif' }}>
      <h1>Administração — ISPOTEC AI</h1>
      <p>Sessão: {userEmail}</p>
      <div style={{ display: 'grid', gap: 12, marginTop: 24 }}>
        <div>📚 Documentos</div>
        <div>🧩 Processamento e embeddings</div>
        <div>📊 Estatísticas e perguntas</div>
        <button onClick={signOut}>Terminar sessão</button>
      </div>
    </main>
  )
}
