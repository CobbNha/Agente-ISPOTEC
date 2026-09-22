import * as React from 'react'
import { createSupabaseBrowserClient } from '../lib/supabase/client'
import { requireAdmin } from '../lib/supabase/auth'
import { DocumentUpload } from '../components/DocumentUpload'
import { DocumentList } from '../components/DocumentList'
import { DocumentEditor } from '../components/DocumentEditor'

type Tab = 'overview' | 'documents' | 'edit'

interface Document {
  id: string
  titulo: string
  categoria_id?: string
  acesso: string
  status: string
  created_at: string
  chunk_count: number
}

export default function AdminRoute() {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), [])
  const [userEmail, setUserEmail] = React.useState('')
  const [checking, setChecking] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState<Tab>('overview')
  const [documents, setDocuments] = React.useState<Document[]>([])
  const [categories, setCategories] = React.useState<string[]>([])
  const [editingDoc, setEditingDoc] = React.useState<Document | null>(null)
  const [statsLoading, setStatsLoading] = React.useState(false)
  const [stats, setStats] = React.useState({ totalDocs: 0, totalChunks: 0, readyDocs: 0 })
  const [accessError, setAccessError] = React.useState('')

  React.useEffect(() => {
    requireAdmin().then((user) => {
      if (user) {
        setUserEmail(user.email ?? '')
        loadData()
      }
      setChecking(false)
    }).catch((error) => {
      setAccessError(error instanceof Error ? error.message : 'Não foi possível validar o acesso.')
      setChecking(false)
    })
  }, [])

  async function loadData() {
    try {
      const [docsRes, catsRes] = await Promise.all([
        supabase.from('documentos').select('*').order('created_at', { ascending: false }),
        supabase.from('categorias').select('nome').order('nome'),
      ])
      if (docsRes.error) throw new Error(`Documentos: ${docsRes.error.message}`)
      if (catsRes.error) throw new Error(`Categorias: ${catsRes.error.message}`)
      if (docsRes.data) setDocuments(docsRes.data as Document[])
      if (catsRes.data) setCategories(catsRes.data.map(c => c.nome))
      setAccessError('')

      if (docsRes.data) {
        setStats({
          totalDocs: docsRes.data.length,
          totalChunks: docsRes.data.reduce((acc, d) => acc + (d.chunk_count || 0), 0),
          readyDocs: docsRes.data.filter(d => d.status === 'ready').length,
        })
      }
    } catch (error) {
      console.log('[v0] Erro ao carregar dados:', error)
    }
  }

  async function handleUpload(file: File, title: string, category: string) {
    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData.session?.access_token
    if (!accessToken) throw new Error('A sessão expirou. Entre novamente.')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', title)
    formData.append('category', category)

    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    })
    const result = await response.json().catch(() => null)
    if (!response.ok) {
      if (response.status === 413) throw new Error(result?.error || 'O ficheiro excede o limite de 100MB.')
      throw new Error(result?.error || 'Erro no upload')
    }

    await loadData()
  }

  async function deleteDocument(id: string) {
    if (!confirm('Tem certeza que deseja eliminar este documento?')) return
    try {
      await supabase.from('documentos').delete().eq('id', id)
      await loadData()
    } catch (error) {
      console.log('[v0] Erro ao eliminar:', error)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (checking) return <main style={{ padding: 32, fontFamily: 'Inter, sans-serif' }}>A verificar acesso...</main>
  if (accessError) return (
    <main style={{ padding: 32, fontFamily: 'Inter, sans-serif', maxWidth: 560, margin: '0 auto' }}>
      <h1 style={{ color: '#0f172a' }}>Acesso ao painel</h1>
      <p style={{ color: '#64748b' }}>{accessError}</p>
      <button onClick={() => { window.location.href = '/login' }} style={styles.signOutBtn}>Voltar ao login</button>
    </main>
  )

  return (
    <main style={styles.page}>
      <div style={styles.sidebar}>
        <header style={styles.sidebarHeader}>
          <div style={styles.logo}>
            <img src="/ispotec-logo.png" alt="ISPOTEC" style={styles.logoImg} />
            <div>
              <div style={styles.logoText}>ISPOTEC</div>
              <div style={styles.logoSubtext}>Administração</div>
            </div>
          </div>
        </header>

        <nav style={styles.nav}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{ ...styles.navBtn, ...(activeTab === 'overview' ? styles.navBtnActive : {}) }}
          >
            <span style={styles.navIcon}>📊</span> Visão Geral
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            style={{ ...styles.navBtn, ...(activeTab === 'documents' ? styles.navBtnActive : {}) }}
          >
            <span style={styles.navIcon}>📄</span> Documentos
          </button>
          <button
            onClick={() => { setActiveTab('edit'); setEditingDoc(null) }}
            style={{ ...styles.navBtn, ...(activeTab === 'edit' ? styles.navBtnActive : {}) }}
          >
            <span style={styles.navIcon}>✏️</span> Adicionar
          </button>
        </nav>

        <button onClick={signOut} style={styles.signOutBtn}>Sair</button>
        <div style={styles.userInfo}>{userEmail}</div>
      </div>

      <div style={styles.main}>
        {activeTab === 'overview' && (
          <div style={styles.content}>
            <div style={styles.header}>
              <h1 style={styles.title}>Visão Geral do Conhecimento</h1>
              <p style={styles.subtitle}>Estado atual da base de dados institucional</p>
            </div>

            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Documentos Total</div>
                <div style={styles.statValue}>{stats.totalDocs}</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Documentos Prontos</div>
                <div style={styles.statValue}>{stats.readyDocs}</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Segmentos Processados</div>
                <div style={styles.statValue}>{stats.totalChunks}</div>
              </div>
            </div>

            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Documentos Recentes</h2>
              {documents.length === 0 ? (
                <div style={styles.emptyState}>
                  <p>Nenhum documento ainda. Comece adicionando documentação institucional.</p>
                </div>
              ) : (
                <div style={styles.docTable}>
                  <div style={styles.docTableHeader}>
                    <div style={{ flex: 1 }}>Título</div>
                    <div style={{ width: 100 }}>Status</div>
                    <div style={{ width: 80 }}>Segmentos</div>
                    <div style={{ width: 80 }}>Data</div>
                  </div>
                  {documents.slice(0, 5).map((doc) => (
                    <div key={doc.id} style={styles.docTableRow}>
                      <div style={{ flex: 1 }}>{doc.titulo}</div>
                      <div style={{ width: 100 }}>
                        <span style={{...styles.statusBadge, ...(doc.status === 'ready' ? styles.statusReady : doc.status === 'error' ? styles.statusError : styles.statusProcessing)}}>{doc.status}</span>
                      </div>
                      <div style={{ width: 80 }}>{doc.chunk_count}</div>
                      <div style={{ width: 80, color: '#8b92a3', fontSize: 12 }}>
                        {new Date(doc.created_at).toLocaleDateString('pt-PT')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'documents' && (
          <div style={styles.content}>
            <div style={styles.header}>
              <h1 style={styles.title}>Biblioteca de Documentos</h1>
              <p style={styles.subtitle}>Gerir e editar documentação institucional</p>
            </div>
            <DocumentList documents={documents} onDelete={deleteDocument} onEdit={(doc) => { setEditingDoc(doc); setActiveTab('edit') }} />
          </div>
        )}

        {activeTab === 'edit' && (
          <div style={styles.content}>
            <div style={styles.header}>
              <h1 style={styles.title}>{editingDoc ? 'Editar Documento' : 'Novo Documento'}</h1>
              <p style={styles.subtitle}>Adicione ou atualize documentação para melhorar as respostas da IA</p>
            </div>
            {editingDoc ? (
              <DocumentEditor doc={editingDoc} onSave={() => { setEditingDoc(null); setActiveTab('documents'); loadData() }} />
            ) : (
              <DocumentUpload onUpload={handleUpload} categories={categories.length > 0 ? categories : ['Académica', 'Financeira', 'Administrativa']} />
            )}
          </div>
        )}
      </div>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { display: 'flex', minHeight: '100vh', background: '#f8f9fb', fontFamily: 'Inter, sans-serif', color: '#1a202c' },
  sidebar: { width: 280, background: '#fff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', padding: '24px 0', boxShadow: '0 1px 3px rgba(0,0,0,.05)' },
  sidebarHeader: { padding: '0 20px 24px', borderBottom: '1px solid #e2e8f0' },
  logo: { display: 'flex', gap: 12, alignItems: 'center' },
  logoImg: { width: 48, height: 48, objectFit: 'contain' },
  logoText: { fontSize: 14, fontWeight: 700, color: '#0f172a' },
  logoSubtext: { fontSize: 11, color: '#64748b', marginTop: 2 },
  nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: 8, padding: '20px 12px' },
  navBtn: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', border: 'none', background: 'transparent', borderRadius: 8, cursor: 'pointer', color: '#64748b', fontSize: 14, fontWeight: 500, transition: 'all 0.2s', textAlign: 'left' },
  navBtnActive: { background: '#0f172a', color: '#fff' },
  navIcon: { fontSize: 16 },
  signOutBtn: { margin: '20px 12px 0', padding: '10px 16px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#64748b' },
  userInfo: { padding: '0 20px', fontSize: 11, color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: 12, marginTop: 'auto' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' },
  content: { flex: 1, padding: '40px' },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: 700, margin: 0, marginBottom: 8, color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#64748b', margin: 0 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 32 },
  statCard: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,.05)' },
  statLabel: { fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 12 },
  statValue: { fontSize: 32, fontWeight: 700, color: '#0f172a' },
  section: { background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #e2e8f0' },
  sectionTitle: { fontSize: 16, fontWeight: 700, margin: 0, marginBottom: 20, color: '#0f172a' },
  emptyState: { padding: '40px 20px', textAlign: 'center', color: '#94a3b8' },
  docTable: { display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' },
  docTableHeader: { display: 'flex', gap: 16, padding: '12px 16px', background: '#f1f5f9', fontWeight: 600, fontSize: 12, color: '#64748b', borderBottom: '1px solid #e2e8f0' },
  docTableRow: { display: 'flex', gap: 16, padding: '12px 16px', fontSize: 13, color: '#1a202c', borderBottom: '1px solid #e2e8f0', alignItems: 'center' },
  statusBadge: { fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 4, display: 'inline-block' },
  statusReady: { background: '#dcfce7', color: '#166534' },
  statusProcessing: { background: '#fef3c7', color: '#92400e' },
  statusError: { background: '#fee2e2', color: '#991b1b' },
}
