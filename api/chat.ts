import { LOCAL_ISPOTEC_KNOWLEDGE, findLocalAnswer } from '../src/lib/knowledge/local'

type ChatRequest = {
  question?: string
  profile?: string
}

type GroqResponse = {
  choices?: Array<{ message?: { content?: string } }>
  error?: { message?: string }
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Método não permitido.' }, { status: 405 })
  }

  const body = (await request.json().catch(() => null)) as ChatRequest | null
  const question = body?.question?.trim()
  const profile = body?.profile?.trim() || 'Utilizador'

  if (!question || question.length > 2000) {
    return Response.json({ error: 'A pergunta é obrigatória e deve ter até 2000 caracteres.' }, { status: 400 })
  }

  const localAnswer = findLocalAnswer(question)
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return Response.json({
      answer: localAnswer || 'Não encontrei essa informação na base local oficial do ISPOTEC. Confirme com a Secretaria Académica.',
      offline: true,
      citations: ['Base local oficial ISPOTEC'],
    })
  }

  const context = await loadKnowledge(question)
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b',
      temperature: 0.2,
      max_tokens: 700,
      messages: [
        {
          role: 'system',
          content: `És o assistente institucional do ISPOTEC. Responde em português de Moçambique, com clareza e tom profissional. Usa exclusivamente a base oficial abaixo. Não inventes regulamentos, prazos, valores ou procedimentos. Se a base não responder à pergunta, diz: "Não encontrei essa informação na base oficial do ISPOTEC. Confirme com a Secretaria Académica." Não uses conhecimento geral para preencher lacunas. Organiza a resposta com título curto, pontos objetivos e uma nota de confirmação quando necessário. Perfil: ${profile}\n\nBASE OFICIAL:\n${context}`,
        },
        { role: 'user', content: `Perfil: ${profile}\nPergunta: ${question}` },
      ],
    }),
  })

  const result = (await response.json().catch(() => null)) as GroqResponse | null
  if (!response.ok) {
    return Response.json({
      answer: localAnswer || 'O serviço inteligente está temporariamente indisponível. Não encontrei uma resposta segura na base local. Confirme com a Secretaria Académica.',
      offline: true,
      citations: ['Base local oficial ISPOTEC'],
    })
  }

  const answer = result?.choices?.[0]?.message?.content?.trim()
  if (!answer) {
    return Response.json({ answer: localAnswer || 'Não encontrei essa informação na base oficial do ISPOTEC. Confirme com a Secretaria Académica.', offline: true })
  }

  return Response.json({ answer, citations: ['Base oficial ISPOTEC'] })
}

async function loadKnowledge(question: string) {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return LOCAL_ISPOTEC_KNOWLEDGE

  const supabase = (await import('@supabase/supabase-js')).createClient(url, key)
  const { data } = await supabase
    .from('partes_documento')
    .select('conteudo, ordem, documentos!inner(titulo, status, acesso)')
    .eq('documentos.status', 'ready')
    .eq('documentos.acesso', 'public')
    .limit(200)

  const terms = question.toLowerCase().split(/\\W+/).filter((term) => term.length > 2)
  const ranked = (data || []).map((part: any) => {
    const text = String(part.conteudo || '')
    const score = terms.reduce((total, term) => total + (text.toLowerCase().includes(term) ? 1 : 0), 0)
    return { ...part, score }
  }).filter((part: any) => part.score > 0).sort((a: any, b: any) => b.score - a.score).slice(0, 8)

  return ranked.length
    ? `${ranked.map((part: any, index: number) => `[${index + 1}] ${part.documentos.titulo}\n${part.conteudo}`).join('\n\n')}\n\n[BASE LOCAL ISPOTEC]\n${LOCAL_ISPOTEC_KNOWLEDGE}`
    : LOCAL_ISPOTEC_KNOWLEDGE
}

export const config = { runtime: 'edge' }
