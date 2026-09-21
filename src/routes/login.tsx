import * as React from 'react'
import { createSupabaseBrowserClient } from '../lib/supabase/client'

export default function LoginRoute() {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), [])
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  async function signIn(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email ou palavra-passe inválidos.')
      setLoading(false)
      return
    }

    window.location.href = '/admin'
  }

  return (
    <main style={{ maxWidth: 460, margin: '80px auto', padding: 24, fontFamily: 'Arial, sans-serif' }}>
      <h1>Admin — ISPOTEC AI</h1>
      <p>Entre com a conta administrativa.</p>

      <form onSubmit={signIn} style={{ display: 'grid', gap: 14 }}>
        <label>
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ display: 'block', width: '100%', padding: 10, boxSizing: 'border-box', marginTop: 6 }}
          />
        </label>

        <label>
          Palavra-passe
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ display: 'block', width: '100%', padding: 10, boxSizing: 'border-box', marginTop: 6 }}
          />
        </label>

        {error && <div role="alert" style={{ color: '#b00020' }}>{error}</div>}

        <button type="submit" disabled={loading} style={{ padding: 12, fontWeight: 700 }}>
          {loading ? 'A entrar...' : 'Entrar'}
        </button>
      </form>
    </main>
  )
}
