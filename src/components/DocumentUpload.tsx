import React, { useRef } from 'react'
import { Upload, Loader2, AlertCircle, CheckCircle2, FileText, X } from 'lucide-react'

interface DocumentUploadProps {
  onUpload: (file: File, title: string, category: string) => Promise<void>
  categories: string[]
  loading?: boolean
}

export function DocumentUpload({ onUpload, categories, loading = false }: DocumentUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = React.useState<File | null>(null)
  const [pastedText, setPastedText] = React.useState('')
  const [title, setTitle] = React.useState('')
  const [category, setCategory] = React.useState(categories[0] || '')
  const [status, setStatus] = React.useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [error, setError] = React.useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const extension = selectedFile.name.toLowerCase().split('.').pop()
      const supportedExtensions = ['pdf', 'txt', 'text', 'md', 'csv', 'doc', 'docx']
      if (!extension || !supportedExtensions.includes(extension)) {
        setError('Formatos permitidos: PDF, Word (.doc/.docx), TXT, MD e CSV')
        setFile(null)
        return
      }
      setFile(selectedFile)
      setError('')
      setStatus('idle')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const contentFile = file ?? (pastedText.trim()
      ? new File([pastedText], `${title.trim() || 'conhecimento'}.txt`, { type: 'text/plain' })
      : null)
    if (!contentFile || !title.trim()) {
      setError('Preencha o título e carregue um ficheiro ou cole o texto')
      return
    }

    try {
      setStatus('uploading')
      setError('')
      await onUpload(contentFile, title, category)
      setStatus('success')
      setFile(null)
      setPastedText('')
      setTitle('')
      setCategory(categories[0] || '')
      if (fileInputRef.current) fileInputRef.current.value = ''
      setTimeout(() => setStatus('idle'), 2000)
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload')
    }
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.section}>
        <label style={styles.label}>Título do documento</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Regulamento Académico 2024"
          style={styles.input}
          disabled={loading}
        />
      </div>

      <div style={styles.section}>
        <label style={styles.label}>Categoria</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={styles.select} disabled={loading}>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div style={styles.section}>
        <label style={styles.label}>Colar texto directamente</label>
        <textarea
          value={pastedText}
          onChange={(e) => { setPastedText(e.target.value); if (e.target.value) { setFile(null); setError('') } }}
          placeholder="Cole aqui regulamentos, avisos, cursos ou qualquer informação institucional..."
          rows={7}
          style={styles.textarea}
          disabled={loading}
        />
        <span style={styles.helpText}>Pode colar texto sem fazer upload de ficheiro. O conteúdo será guardado como conhecimento do agente.</span>
      </div>

      <div style={styles.section}>
        <label style={styles.label}>Ou carregar ficheiro (PDF, Word ou texto)</label>
        <div
          style={{
            ...styles.dropZone,
            borderColor: file ? '#10b981' : '#cbd5e1',
            backgroundColor: file ? '#f0fdf4' : '#f8fafc',
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const droppedFile = e.dataTransfer.files[0]
            if (droppedFile) {
              const input = fileInputRef.current
              if (input) {
                const dataTransfer = new DataTransfer()
                dataTransfer.items.add(droppedFile)
                input.files = dataTransfer.files
                handleFileChange({ target: input } as any)
              }
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.txt,.text,.md,.csv"
            style={{ display: 'none' }}
            disabled={loading}
          />
          {file ? (
            <div style={styles.filePreview}>
              <FileText size={20} color="#10b981" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#065f46' }}>{file.name}</div>
                <div style={{ fontSize: 12, color: '#10b981' }}>
                  {file.size >= 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${(file.size / 1024).toFixed(1)} KB`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFile(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                style={styles.removeBtn}
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div style={styles.uploadPrompt}>
              <Upload size={24} color="#94a3b8" />
              <div style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Arraste o ficheiro aqui</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>PDF, Word (.doc/.docx), TXT, MD ou CSV</div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={styles.selectBtn}
                disabled={loading}
              >
                Selecionar ficheiro
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div style={styles.alert}>
          <AlertCircle size={16} color="#dc2626" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={(!file && !pastedText.trim()) || !title.trim() || loading || status === 'success'}
        style={{
          ...styles.submitBtn,
          opacity: (!file && !pastedText.trim()) || !title.trim() || loading ? 0.5 : 1,
          cursor: (!file && !pastedText.trim()) || !title.trim() || loading ? 'not-allowed' : 'pointer',
        }}
      >
        {status === 'uploading' && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
        {status === 'success' && <CheckCircle2 size={16} color="#10b981" />}
        {status === 'error' && <AlertCircle size={16} color="#dc2626" />}
        <span>
          {status === 'uploading' ? 'A carregar...' : status === 'success' ? 'Enviado!' : status === 'error' ? 'Erro' : 'Enviar documento'}
        </span>
      </button>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </form>
  )
}

const styles: Record<string, React.CSSProperties> = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    padding: '10px 14px',
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    fontSize: 14,
    fontFamily: 'inherit',
    color: '#1e293b',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  textarea: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '12px 14px',
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    fontSize: 14,
    lineHeight: 1.5,
    fontFamily: 'inherit',
    color: '#1e293b',
    outline: 'none',
    resize: 'vertical',
    minHeight: 140,
  },
  helpText: {
    fontSize: 12,
    color: '#64748b',
  },
  select: {
    padding: '10px 14px',
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    fontSize: 14,
    fontFamily: 'inherit',
    color: '#1e293b',
    outline: 'none',
    backgroundColor: '#fff',
  },
  dropZone: {
    border: '2px dashed #cbd5e1',
    borderRadius: 12,
    padding: 24,
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  uploadPrompt: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  filePreview: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'space-between',
  },
  selectBtn: {
    marginTop: 12,
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 600,
    background: '#f1f5f9',
    border: '1px solid #cbd5e1',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#64748b',
    padding: 4,
  },
  alert: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: 8,
    fontSize: 13,
    color: '#991b1b',
  },
  submitBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '12px 20px',
    fontSize: 14,
    fontWeight: 600,
    color: '#fff',
    background: '#0f766e',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
}
