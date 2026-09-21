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
    <main style={{ minHeight: '100vh', background: '#f4f8fc', color: '#092f57', padding: 32, fontFamily: 'Inter, Arial, sans-serif' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, borderBottom: '1px solid #dce7f2', paddingBottom: 20 }}><div style={{ display: 'flex', alignItems: 'center', gap: 14 }}><img src="/ispotec-logo.png" alt="Logotipo do ISPOTEC" style={{ width: 86, height: 70, objectFit: 'contain' }} /><div><h1 style={{ margin: 0, fontSize: 26 }}>Administração — ISPOTEC AI</h1><p style={{ margin: '6px 0 0', color: '#60758c' }}>Painel institucional</p></div></div><button onClick={signOut} style={{ border: '1px solid #b9cee2', borderRadius: 8, background: '#fff', color: '#092f57', padding: '10px 14px', cursor: 'pointer' }}>Terminar sessão</button></header>
      <p style={{ color: '#60758c', marginTop: 24 }}>Sessão ativa: <strong>{userEmail}</strong></p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginTop: 24 }}>
        {['Documentos oficiais', 'Processamento de conhecimento', 'Perguntas e estatísticas'].map((item) => <section key={item} style={{ background: '#fff', border: '1px solid #dce7f2', borderRadius: 14, padding: 22, boxShadow: '0 8px 24px rgba(9,47,87,.06)' }}><h2 style={{ fontSize: 17, margin: 0 }}>{item}</h2><p style={{ color: '#60758c', lineHeight: 1.6 }}>Módulo pronto para gerir o conteúdo institucional do assistente.</p></section>)}
      </div>
      </div>
    </main>
  )
}
