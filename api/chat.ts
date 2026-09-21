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

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return Response.json({ error: 'A integração com a Groq ainda não está configurada.' }, { status: 503 })
  }

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
          content: 'És o assistente institucional do ISPOTEC. Responde em português de Angola, com clareza e tom profissional. Não inventes regulamentos, prazos, valores ou procedimentos. Quando não tiveres informação oficial suficiente, diz explicitamente que a Secretaria deve confirmar. Não peças nem exponhas dados pessoais. O utilizador está no perfil indicado.',
        },
        { role: 'user', content: `Perfil: ${profile}\nPergunta: ${question}` },
      ],
    }),
  })

  const result = (await response.json().catch(() => null)) as GroqResponse | null
  if (!response.ok) {
    return Response.json({ error: result?.error?.message || 'Não foi possível obter resposta da Groq.' }, { status: 502 })
  }

  const answer = result?.choices?.[0]?.message?.content?.trim()
  if (!answer) {
    return Response.json({ error: 'A Groq devolveu uma resposta vazia.' }, { status: 502 })
  }

  return Response.json({ answer })
}

export const config = { runtime: 'edge' }
