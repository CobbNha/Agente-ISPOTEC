import * as React from 'react'
import { createSupabaseBrowserClient } from '../lib/supabase/client'

const profiles = ['Estudante', 'Docente', 'DAF', 'Secretaria', 'Direcção Pedagógica']
const suggestions = ['Como faço a matrícula?', 'Quais são os documentos necessários?', 'Onde consulto o calendário académico?']

type Message = { role: 'user' | 'assistant'; text: string; source?: string }

export default function IndexRoute() {
  const [profile, setProfile] = React.useState('Estudante')
  const [question, setQuestion] = React.useState('')
  const [messages, setMessages] = React.useState<Message[]>([])
  const [loading, setLoading] = React.useState(false)

  async function ask(value = question) {
    const prompt = value.trim()
    if (!prompt || loading) return
    const supabase = createSupabaseBrowserClient()
    setQuestion('')
    setMessages((current) => [...current, { role: 'user', text: prompt }])
    setLoading(true)
    const { data } = await supabase.from('documentos').select('titulo').eq('acesso', 'public').eq('status', 'ready').limit(1)
    await new Promise((resolve) => setTimeout(resolve, 650))
    setMessages((current) => [...current, {
      role: 'assistant',
      text: data?.length ? 'Estou a consultar a base de conhecimento oficial do ISPOTEC. Esta resposta será baseada apenas nos documentos publicados pela instituição. Para uma resposta completa, carregue os regulamentos e FAQs no painel de administração.' : 'Ainda não existem documentos públicos processados na base de conhecimento. O administrador deve carregar os regulamentos, FAQs e procedimentos oficiais antes de eu responder.',
      source: data?.[0]?.titulo,
    }])
    setLoading(false)
  }

  return (
    <main style={styles.page}>
      <div style={styles.glow} />
      <header style={styles.header}>
        <a href="/" style={styles.brand}><span style={styles.logo}>I</span><span><strong>ISPOTEC</strong><small> AI INSTITUCIONAL</small></span></a>
        <nav style={styles.nav}><span style={styles.status}><i /> Sistema online</span><a href="/admin" style={styles.adminLink}>Área administrativa →</a></nav>
      </header>
      <section style={styles.hero}>
        <div style={styles.eyebrow}>ASSISTENTE INSTITUCIONAL</div>
        <h1>Informação oficial,<br /><em>sem complicação.</em></h1>
        <p>Faça perguntas sobre matrículas, regulamentos, pagamentos e vida académica. Eu respondo apenas com base na documentação oficial do ISPOTEC.</p>
      </section>
      <section style={styles.chatCard}>
        <div style={styles.chatTop}><div><strong>Como posso ajudar?</strong><span>Escolha o seu perfil para uma resposta mais contextualizada.</span></div><div style={styles.live}>● AO VIVO</div></div>
        <div style={styles.profileRow}><span style={styles.label}>O seu perfil</span>{profiles.map((item) => <button key={item} onClick={() => setProfile(item)} style={{ ...styles.profile, ...(profile === item ? styles.profileActive : {}) }}>{item}</button>)}</div>
        {messages.length > 0 && <div style={styles.messages}>{messages.map((message, index) => <div key={index} style={{ ...styles.message, ...(message.role === 'user' ? styles.userMessage : {}) }}><span style={styles.avatar}>{message.role === 'user' ? 'EU' : 'AI'}</span><div><strong>{message.role === 'user' ? profile : 'ISPOTEC AI'}</strong><p>{message.text}</p>{message.source && <small>Fonte: {message.source}</small>}</div></div>)}{loading && <div style={styles.message}><span style={styles.avatar}>AI</span><div><strong>ISPOTEC AI</strong><p style={{ color: '#8a8f9f' }}>A consultar documentos oficiais<span className="dots">...</span></p></div></div>}</div>}
        <div style={styles.composer}><textarea value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) { event.preventDefault(); void ask() } }} placeholder="Escreva a sua pergunta..." rows={2} /><button onClick={() => void ask()} disabled={loading || !question.trim()} style={styles.send}>{loading ? '...' : 'Enviar'} <span>↗</span></button></div>
        <div style={styles.suggestions}><span>SUGESTÕES</span>{suggestions.map((item) => <button key={item} onClick={() => void ask(item)}>{item}</button>)}</div>
      </section>
      <footer style={styles.footer}><span>Respostas baseadas em documentação oficial</span><span>Não partilhe dados pessoais, notas ou dívidas.</span></footer>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#f7f8fb', color: '#14213d', fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", padding: '0 7vw', position: 'relative', overflow: 'hidden' },
  glow: { position: 'absolute', top: -260, right: -160, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(211,166,75,.17), transparent 67%)', pointerEvents: 'none' },
  header: { height: 82, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e8eaf0', position: 'relative' },
  brand: { display: 'flex', gap: 11, alignItems: 'center', color: '#14213d', textDecoration: 'none', letterSpacing: 1 }, logo: { display: 'grid', placeItems: 'center', width: 34, height: 34, borderRadius: 10, background: '#14213d', color: '#d3a64b', fontWeight: 800, fontSize: 20 },
  nav: { display: 'flex', gap: 25, alignItems: 'center', fontSize: 12 }, status: { color: '#5f687b' }, adminLink: { color: '#14213d', fontWeight: 700, textDecoration: 'none' }, hero: { maxWidth: 760, padding: '75px 0 38px' }, eyebrow: { color: '#b1842e', fontSize: 11, letterSpacing: 2, fontWeight: 800, marginBottom: 18 }, h1: { fontSize: 'clamp(38px, 5vw, 64px)', lineHeight: .99, letterSpacing: -2.5, margin: 0, fontWeight: 800 }, em: { color: '#b1842e', fontStyle: 'normal' }, p: { color: '#687185', lineHeight: 1.7 }, chatCard: { background: '#fff', border: '1px solid #e5e8ee', borderRadius: 18, boxShadow: '0 18px 50px rgba(20,33,61,.08)', maxWidth: 940, marginBottom: 44, overflow: 'hidden' }, chatTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '25px 28px', borderBottom: '1px solid #edf0f4' }, live: { fontSize: 10, color: '#38845a', letterSpacing: 1, fontWeight: 800 }, profileRow: { display: 'flex', gap: 8, alignItems: 'center', padding: '15px 28px', flexWrap: 'wrap', background: '#fafbfc' }, label: { fontSize: 11, color: '#8991a2', marginRight: 5 }, profile: { border: '1px solid #e4e7ed', background: '#fff', borderRadius: 20, padding: '7px 12px', fontSize: 11, color: '#687185', cursor: 'pointer' }, profileActive: { background: '#14213d', color: '#fff', borderColor: '#14213d' }, messages: { padding: '20px 28px 0', display: 'grid', gap: 16 }, message: { display: 'flex', gap: 12, color: '#4d5668', fontSize: 13, lineHeight: 1.5 }, userMessage: { flexDirection: 'row-reverse', textAlign: 'right' }, avatar: { flex: '0 0 auto', width: 30, height: 30, borderRadius: 9, display: 'grid', placeItems: 'center', background: '#eef1f6', color: '#14213d', fontSize: 9, fontWeight: 800 }, composer: { display: 'flex', gap: 12, padding: 28, paddingBottom: 15 }, textarea: { flex: 1, resize: 'none', border: '1px solid #dfe3eb', borderRadius: 12, padding: 15, outline: 'none', font: 'inherit', color: '#14213d', background: '#fff' }, send: { alignSelf: 'stretch', border: 0, borderRadius: 12, background: '#14213d', color: '#fff', padding: '0 22px', fontWeight: 700, cursor: 'pointer' }, suggestions: { display: 'flex', gap: 8, flexWrap: 'wrap', padding: '0 28px 25px', alignItems: 'center' }, footer: { display: 'flex', justifyContent: 'space-between', color: '#9299a8', fontSize: 11, paddingBottom: 30 },
}
