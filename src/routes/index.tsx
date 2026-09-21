import * as React from 'react'

export default function IndexRoute() {
  const [profile, setProfile] = React.useState('Estudante')
  const [question, setQuestion] = React.useState('')

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: 32, fontFamily: 'Arial, sans-serif' }}>
      <header style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0055a4' }}>ISPOTEC AI</div>
        <h1 style={{ margin: '8px 0' }}>Assistente Inteligente Institucional</h1>
        <p>Consulte informações oficiais do ISPOTEC de forma simples e rápida.</p>
      </header>

      <section style={{ display: 'grid', gap: 16 }}>
        <label>
          Perfil
          <select value={profile} onChange={(e) => setProfile(e.target.value)} style={{ display: 'block', padding: 10, marginTop: 6 }}>
            <option>Estudante</option>
            <option>Docente</option>
            <option>DAF</option>
            <option>Secretaria</option>
            <option>Direcção Pedagógica</option>
          </select>
        </label>

        <label>
          Pergunta
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ex.: Como faço a matrícula?"
            rows={5}
            style={{ width: '100%', padding: 12, boxSizing: 'border-box' }}
          />
        </label>

        <button type="button" style={{ padding: 12, fontWeight: 700 }}>
          Consultar ISPOTEC AI
        </button>

        <small>Perfil selecionado: {profile}</small>
      </section>
    </main>
  )
}
