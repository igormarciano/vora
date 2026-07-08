import { analiseMensalSchema, type AnaliseMensal } from './schema'
import { SYSTEM_PROMPT } from './prompts'

const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions'
const MODEL = 'gpt-4o-mini'

export async function gerarAnaliseMensal(userPrompt: string): Promise<AnaliseMensal> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY não configurada')

  const response = await fetch(OPENAI_CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      response_format: { type: 'json_object' },
      temperature: 0.4,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    }),
  })

  if (!response.ok) {
    const detalhe = await response.text()
    throw new Error(`Chamada à OpenAI falhou (${response.status}): ${detalhe}`)
  }

  const payload = await response.json()
  const conteudo = payload.choices?.[0]?.message?.content
  if (!conteudo) throw new Error('Resposta da OpenAI sem conteúdo')

  const json = JSON.parse(conteudo)
  return analiseMensalSchema.parse(json)
}
