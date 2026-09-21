import * as React from 'react'

type Document = { id: string; titulo: string; status: string; created_at: string; chunk_count: number; acesso: string }

export function DocumentList({ documents, onDelete, onEdit }: { documents: Document[]; onDelete: (id: string) => void; onEdit: (doc: Document) => void }) {
  return <section style={styles.card}>
    {documents.length === 0 ? <div style={styles.empty}>Nenhum documento encontrado.</div> : documents.map((doc) => <article key={doc.id} style={styles.row}>
      <div style={styles.fileIcon}>DOC</div>
      <div style={styles.info}><strong>{doc.titulo}</strong><span>{doc.chunk_count} segmentos · {new Date(doc.created_at).toLocaleDateString('pt-PT')}</span></div>
      <span style={{ ...styles.badge, ...(doc.status === 'ready' ? styles.ready : styles.processing) }}>{doc.status === 'ready' ? 'Pronto' : 'A processar'}</span>
      <button onClick={() => onEdit(doc)} style={styles.action}>Editar</button>
      <button onClick={() => onDelete(doc.id)} style={{ ...styles.action, ...styles.delete }}>Eliminar</button>
    </article>)}
  </section>
}

const styles: Record<string, React.CSSProperties> = {
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' },
  empty: { padding: 48, textAlign: 'center', color: '#94a3b8' },
  row: { display: 'flex', alignItems: 'center', gap: 16, padding: 18, borderBottom: '1px solid #f1f5f9' },
  fileIcon: { width: 38, height: 38, borderRadius: 8, display: 'grid', placeItems: 'center', background: '#eef2ff', color: '#4f46e5', fontSize: 9, fontWeight: 800 },
  info: { flex: 1, display: 'grid', gap: 5, fontSize: 14, color: '#0f172a' },
  infoSpan: { fontSize: 12, color: '#94a3b8' },
  badge: { fontSize: 11, fontWeight: 600, padding: '5px 9px', borderRadius: 5 },
  ready: { color: '#166534', background: '#dcfce7' },
  processing: { color: '#92400e', background: '#fef3c7' },
  action: { border: '1px solid #e2e8f0', background: '#fff', borderRadius: 6, padding: '7px 10px', fontSize: 12, cursor: 'pointer', color: '#475569' },
  delete: { color: '#b91c1c' },
}
styles.infoSpan = styles.infoSpan
