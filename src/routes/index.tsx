import * as React from 'react'

const profiles = ['Estudante', 'Docente', 'DAF', 'Secretaria', 'Direcção Pedagógica']
const suggestions = ['Como faço a matrícula?', 'Quais são os documentos necessários?', 'Qual é a data-limite de pagamento?']

type Message = { role: 'user' | 'assistant'; text: string; citations?: string[] }

export default function IndexRoute() {
  const [profile, setProfile] = React.useState('Estudante')
  const [question, setQuestion] = React.useState('')
  const [messages, setMessages] = React.useState<Message[]>([])
  const [loading, setLoading] = React.useState(false)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function ask(value = question) {
    const prompt = value.trim()
    if (!prompt || loading) return
    setQuestion('')
    setMessages((current) => [...current, { role: 'user', text: prompt }])
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: prompt, profile }),
      })
      const result = await response.json().catch(() => null) as { answer?: string; citations?: string[]; error?: string } | null
      if (!response.ok || !result?.answer) throw new Error(result?.error || 'O agente não está disponível. Tente mais tarde.')
      setMessages((current) => [...current, { role: 'assistant', text: result.answer!, citations: result.citations }])
    } catch (error) {
      setMessages((current) => [...current, {
        role: 'assistant',
        text: error instanceof Error ? error.message : 'Ocorreu um erro. Tente novamente.',
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <a href="/" style={styles.brand}>
            <img src="/ispotec-logo.png" alt="ISPOTEC" style={styles.logoImage} />
            <div>
              <div style={styles.brandName}>ISPOTEC</div>
              <div style={styles.brandSubtext}>Assistente Institucional</div>
            </div>
          </a>
          <nav style={styles.nav}>
            <span style={styles.status}>🟢 Sistema online</span>
            <a href="/admin" style={styles.adminLink}>Administração</a>
          </nav>
        </div>
      </header>

      <div style={styles.container}>
        {messages.length === 0 ? (
          <section style={styles.hero}>
            <div style={styles.eyebrow}>Bem-vindo ao ISPOTEC</div>
            <h1 style={styles.h1}>Respostas claras<br />baseadas em documentação<br /><em>oficial</em></h1>
            <p style={styles.p}>Faça perguntas sobre matrículas, regulamentos, calendário académico e procedimentos administrativos. O assistente consulta apenas documentação verificada.</p>
          </section>
        ) : null}

        <section style={styles.chatSection}>
          <div style={styles.chatContainer}>
            {messages.length === 0 && (
              <div style={styles.profileSelector}>
                <div style={styles.profileLabel}>Escolha o seu perfil para respostas contextualizadas:</div>
                <div style={styles.profileButtons}>
                  {profiles.map((p) => (
                    <button
                      key={p}
                      onClick={() => setProfile(p)}
                      style={{ ...styles.profileBtn, ...(profile === p ? styles.profileBtnActive : {}) }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.length > 0 && (
              <div style={styles.messages}>
                {messages.map((msg, i) => (
                  <div key={i} style={{ ...styles.messageWrapper, ...( msg.role === 'user' ? styles.userWrapper : {}) }}>
                    <div style={{ ...styles.message, ...(msg.role === 'user' ? styles.userMessage : styles.assistantMessage) }}>
                      <div style={styles.messageHeader}>
                        <span style={styles.role}>{msg.role === 'user' ? profile : 'ISPOTEC AI'}</span>
                      </div>
                      <div style={styles.messageContent}>{msg.text}</div>
                      {msg.citations && msg.citations.length > 0 && (
                        <div style={styles.citations}>
                          <div style={styles.citationLabel}>Fontes:</div>
                          {msg.citations.map((cite, j) => (
                            <div key={j} style={styles.citation}>{cite}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div style={{ ...styles.messageWrapper }}>
                    <div style={{ ...styles.message, ...styles.assistantMessage }}>
                      <div style={styles.messageHeader}>
                        <span style={styles.role}>ISPOTEC AI</span>
                      </div>
                      <div style={styles.loadingDots}>
                        <span></span><span></span><span></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}

            {messages.length === 0 && (
              <div style={styles.suggestionsGrid}>
                {suggestions.map((s) => (
                  <button key={s} onClick={() => ask(s)} style={styles.suggestionCard}>
                    <div style={styles.suggestionTitle}>{s}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={styles.composer}>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                  e.preventDefault()
                  void ask()
                }
              }}
              placeholder="Escreva a sua pergunta..."
              style={styles.textarea}
              rows={2}
            />
            <button onClick={() => ask()} disabled={loading || !question.trim()} style={{ ...styles.sendBtn, opacity: loading || !question.trim() ? 0.5 : 1 }}>
              {loading ? '⏳' : '✓'} Enviar
            </button>
          </div>
        </section>
      </div>

      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <p style={styles.footerText}>Respostas baseadas em documentação oficial do ISPOTEC</p>
          <p style={styles.footerWarning}>Não partilhe dados pessoais ou informações financeiras</p>
        </div>
      </footer>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  headerContent: { width: '100%', maxWidth: 1120, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  brandName: { fontSize: 15, fontWeight: 800, letterSpacing: '.08em' },
  brandSubtext: { fontSize: 11, color: '#94a3b8', marginTop: 3, letterSpacing: 0 },
  container: { width: '100%', maxWidth: 1120, margin: '0 auto' },
  chatSection: { maxWidth: 900, marginBottom: 48, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, boxShadow: '0 12px 40px rgba(15,23,42,.06)', overflow: 'hidden' },
  chatContainer: { minHeight: 190 },
  profileSelector: { padding: '22px 28px 8px' },
  profileLabel: { fontSize: 12, color: '#64748b', marginBottom: 12 },
  profileButtons: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  profileBtn: { border: '1px solid #e2e8f0', background: '#fff', borderRadius: 20, padding: '8px 13px', color: '#64748b', cursor: 'pointer', fontSize: 12 },
  profileBtnActive: { background: '#0f172a', color: '#fff', borderColor: '#0f172a' },
  suggestionsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, padding: '26px 28px' },
  suggestionCard: { textAlign: 'left', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 9, padding: 14, cursor: 'pointer', color: '#334155' },
  suggestionTitle: { fontSize: 12, lineHeight: 1.5 },
  messageWrapper: { display: 'flex', padding: '14px 28px' },
  userWrapper: { justifyContent: 'flex-end' },
  assistantMessage: { background: '#f8fafc' },
  messageHeader: { marginBottom: 7 },
  role: { fontSize: 11, fontWeight: 800, color: '#475569', letterSpacing: '.04em' },
  messageContent: { whiteSpace: 'pre-wrap', lineHeight: 1.65, fontSize: 14, color: '#334155' },
  citations: { borderTop: '1px solid #e2e8f0', marginTop: 12, paddingTop: 10, fontSize: 11, color: '#64748b' },
  citationLabel: { fontWeight: 700, marginBottom: 4 },
  citation: { marginTop: 3 },
  loadingDots: { display: 'flex', gap: 5, padding: '8px 0' },
  composer: { display: 'flex', gap: 10, padding: 20, borderTop: '1px solid #e2e8f0' },
  sendBtn: { border: 0, background: '#0f172a', color: '#fff', borderRadius: 8, padding: '0 18px', fontWeight: 700, cursor: 'pointer' },
  footerContent: { width: '100%', maxWidth: 1120, margin: '0 auto', display: 'flex', justifyContent: 'space-between', gap: 16 },
  footerText: { margin: 0, fontSize: 12, color: '#64748b' },
  footerWarning: { margin: 0, fontSize: 12, color: '#94a3b8' },
  page: { minHeight: '100vh', background: '#f7f8fb', color: '#14213d', fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", padding: '0 7vw', position: 'relative', overflow: 'hidden' },
  glow: { position: 'absolute', top: -260, right: -160, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(211,166,75,.17), transparent 67%)', pointerEvents: 'none' },
  header: { height: 82, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e8eaf0', position: 'relative' },
  brand: { display: 'flex', gap: 11, alignItems: 'center', color: '#14213d', textDecoration: 'none', letterSpacing: 1 }, logoImage: { width: 58, height: 58, objectFit: 'contain', objectPosition: 'center' },
  nav: { display: 'flex', gap: 25, alignItems: 'center', fontSize: 12 }, status: { color: '#5f687b' }, adminLink: { color: '#14213d', fontWeight: 700, textDecoration: 'none' }, hero: { maxWidth: 760, padding: '75px 0 38px' }, eyebrow: { color: '#b1842e', fontSize: 11, letterSpacing: 2, fontWeight: 800, marginBottom: 18 }, h1: { fontSize: 'clamp(38px, 5vw, 64px)', lineHeight: .99, letterSpacing: -2.5, margin: 0, fontWeight: 800 }, em: { color: '#b1842e', fontStyle: 'normal' }, p: { color: '#687185', lineHeight: 1.7 }, chatCard: { background: '#fff', border: '1px solid #e5e8ee', borderRadius: 18, boxShadow: '0 18px 50px rgba(20,33,61,.08)', maxWidth: 940, marginBottom: 44, overflow: 'hidden' }, chatTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '25px 28px', borderBottom: '1px solid #edf0f4' }, live: { fontSize: 10, color: '#38845a', letterSpacing: 1, fontWeight: 800 }, profileRow: { display: 'flex', gap: 8, alignItems: 'center', padding: '15px 28px', flexWrap: 'wrap', background: '#fafbfc' }, label: { fontSize: 11, color: '#8991a2', marginRight: 5 }, profile: { border: '1px solid #e4e7ed', background: '#fff', borderRadius: 20, padding: '7px 12px', fontSize: 11, color: '#687185', cursor: 'pointer' }, profileActive: { background: '#14213d', color: '#fff', borderColor: '#14213d' }, messages: { padding: '20px 28px 0', display: 'grid', gap: 16 }, message: { display: 'flex', gap: 12, color: '#4d5668', fontSize: 13, lineHeight: 1.5 }, userMessage: { flexDirection: 'row-reverse', textAlign: 'right' }, avatar: { flex: '0 0 auto', width: 30, height: 30, borderRadius: 9, display: 'grid', placeItems: 'center', background: '#eef1f6', color: '#14213d', fontSize: 9, fontWeight: 800 }, composer: { display: 'flex', gap: 12, padding: 28, paddingBottom: 15 }, textarea: { flex: 1, resize: 'none', border: '1px solid #dfe3eb', borderRadius: 12, padding: 15, outline: 'none', font: 'inherit', color: '#14213d', background: '#fff' }, send: { alignSelf: 'stretch', border: 0, borderRadius: 12, background: '#14213d', color: '#fff', padding: '0 22px', fontWeight: 700, cursor: 'pointer' }, suggestions: { display: 'flex', gap: 8, flexWrap: 'wrap', padding: '0 28px 25px', alignItems: 'center' }, footer: { display: 'flex', justifyContent: 'space-between', color: '#9299a8', fontSize: 11, paddingBottom: 30 },
}
