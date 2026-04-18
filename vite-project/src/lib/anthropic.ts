import Anthropic from '@anthropic-ai/sdk'
import { query } from './db'

export function getApiKey(): string {
  const rows = query<{ value: string }>('SELECT value FROM settings WHERE key = ?', ['api_key'])
  return rows[0]?.value ?? ''
}

export function createClient(): Anthropic {
  const key = getApiKey()
  if (!key) throw new Error('No API key configured. Please add your Anthropic API key in Settings.')
  return new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true })
}

export async function streamCompletion(
  messages: { role: 'user' | 'assistant'; content: string }[],
  systemPrompt: string,
  onChunk: (text: string) => void,
  onDone?: () => void
): Promise<void> {
  const client = createClient()
  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: systemPrompt,
    messages,
  })
  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      onChunk(event.delta.text)
    }
  }
  onDone?.()
}

export async function generateOnce(prompt: string, systemPrompt?: string): Promise<string> {
  const client = createClient()
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: systemPrompt ?? 'You are a helpful SDLC project management assistant.',
    messages: [{ role: 'user', content: prompt }],
  })
  const block = msg.content[0]
  return block.type === 'text' ? block.text : ''
}
