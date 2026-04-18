import { useState, useRef, useEffect } from 'react'
import { Sparkles, Send, Loader2, Plus, Trash2 } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { query, run } from '../lib/db'
import { useDbStore } from '../stores/dbStore'
import { generateId, formatRelative } from '../lib/utils'
import { streamCompletion } from '../lib/anthropic'
import { type AIConversation, type AIMessage, type Project } from '../types'

const SYSTEM_PROMPT = `You are an expert SDLC project management assistant integrated into FlowAI.
You help with: sprint planning, issue writing, bug analysis, test case generation, architecture decisions, and project insights.
Be concise, practical, and actionable. Format responses with markdown.`

export function AIAssistantPage() {
  const { version, bump } = useDbStore()
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamBuffer, setStreamBuffer] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const conversations = query<AIConversation>('SELECT * FROM ai_conversations ORDER BY created_at DESC')
  const projects = query<Project>('SELECT * FROM projects')

  const activeConv = activeConvId
    ? conversations.find(c => c.id === activeConvId)
    : conversations[0]

  const messages: AIMessage[] = (() => {
    try { return activeConv?.messages ? JSON.parse(activeConv.messages) : [] } catch { return [] }
  })()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamBuffer])

  const newConversation = () => {
    const id = generateId()
    run('INSERT INTO ai_conversations VALUES (?,?,?,?)', [id, null, '[]', new Date().toISOString()])
    setActiveConvId(id)
    bump()
  }

  const deleteConv = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    run('DELETE FROM ai_conversations WHERE id = ?', [id])
    if (activeConvId === id) setActiveConvId(null)
    bump()
  }

  const send = async () => {
    if (!input.trim() || streaming) return
    const msg = input.trim()
    setInput('')

    let convId = activeConv?.id
    if (!convId) {
      convId = generateId()
      run('INSERT INTO ai_conversations VALUES (?,?,?,?)', [convId, null, '[]', new Date().toISOString()])
      setActiveConvId(convId)
      bump()
    }

    const current = (() => {
      try {
        const rows = query<AIConversation>('SELECT * FROM ai_conversations WHERE id = ?', [convId])
        return rows[0]?.messages ? JSON.parse(rows[0].messages) as AIMessage[] : []
      } catch { return [] as AIMessage[] }
    })()

    const newMessages: AIMessage[] = [...current, { role: 'user', content: msg }]
    run('UPDATE ai_conversations SET messages = ? WHERE id = ?', [JSON.stringify(newMessages), convId])
    bump()

    setStreaming(true)
    setStreamBuffer('')
    let fullResponse = ''

    try {
      await streamCompletion(
        newMessages.map(m => ({ role: m.role, content: m.content })),
        SYSTEM_PROMPT,
        (chunk) => {
          fullResponse += chunk
          setStreamBuffer(fullResponse)
        },
        () => {
          const finalMessages: AIMessage[] = [...newMessages, { role: 'assistant', content: fullResponse }]
          run('UPDATE ai_conversations SET messages = ? WHERE id = ?', [JSON.stringify(finalMessages), convId])
          bump()
          setStreamBuffer('')
          setStreaming(false)
        }
      )
    } catch (e) {
      const errMsg = String(e)
      const finalMessages: AIMessage[] = [...newMessages, { role: 'assistant', content: `Error: ${errMsg}` }]
      run('UPDATE ai_conversations SET messages = ? WHERE id = ?', [JSON.stringify(finalMessages), convId!])
      bump()
      setStreamBuffer('')
      setStreaming(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="AI Assistant" />
      <div className="flex-1 overflow-hidden flex">
        {/* Sidebar */}
        <div className="w-56 border-r flex flex-col"
          style={{ borderColor: 'var(--color-surface-border)', background: 'var(--color-surface-elevated)' }}>
          <div className="p-3">
            <button onClick={newConversation}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ background: 'var(--color-brand)', color: 'var(--color-text-inverse)' }}>
              <Plus size={14} /> New Chat
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
            {conversations.length === 0 && (
              <div className="px-3 py-4 text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
                Start a conversation
              </div>
            )}
            {conversations.map(conv => {
              const msgs: AIMessage[] = (() => { try { return JSON.parse(conv.messages) } catch { return [] } })()
              const preview = msgs[0]?.content?.slice(0, 40) ?? 'New conversation'
              return (
                <div key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className="group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors"
                  style={{ background: activeConv?.id === conv.id ? 'var(--color-surface-hover)' : 'transparent' }}>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs truncate" style={{ color: 'var(--color-text-primary)' }}>{preview}</div>
                    <div className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{formatRelative(conv.created_at)}</div>
                  </div>
                  <button onClick={e => deleteConv(conv.id, e)} className="opacity-0 group-hover:opacity-100">
                    <Trash2 size={11} style={{ color: 'var(--color-status-blocked)' }} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && !streaming && (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, var(--color-brand), var(--color-accent-purple))' }}>
                  <Sparkles size={28} style={{ color: '#fff' }} />
                </div>
                <div>
                  <div className="font-semibold text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>FlowAI Assistant</div>
                  <div className="text-xs max-w-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Ask me anything about your projects, sprints, or SDLC. I can generate content, analyze bugs, and plan sprints.
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {['Plan my next sprint', 'Write test cases for a login feature', 'How do I reduce technical debt?'].map(s => (
                    <button key={s} onClick={() => setInput(s)}
                      className="text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-[var(--color-surface-hover)]"
                      style={{ border: '1px solid var(--color-surface-border)', color: 'var(--color-text-secondary)' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-2xl">
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-1.5 mb-1 text-xs" style={{ color: 'var(--color-accent-purple)' }}>
                      <Sparkles size={11} /> FlowAI
                    </div>
                  )}
                  <div className="px-4 py-3 rounded-xl text-sm"
                    style={msg.role === 'user'
                      ? { background: 'var(--color-brand)', color: 'var(--color-text-inverse)', borderRadius: '18px 18px 4px 18px' }
                      : { background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(139,92,246,0.05))', border: '1px solid rgba(139,92,246,0.2)', color: 'var(--color-text-primary)', borderRadius: '18px 18px 18px 4px', whiteSpace: 'pre-wrap' }}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
            {streaming && streamBuffer && (
              <div className="flex justify-start">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-1.5 mb-1 text-xs" style={{ color: 'var(--color-accent-purple)' }}>
                    <Sparkles size={11} /> FlowAI
                  </div>
                  <div className="px-4 py-3 rounded-xl text-sm whitespace-pre-wrap"
                    style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(139,92,246,0.05))', border: '1px solid rgba(139,92,246,0.2)', color: 'var(--color-text-primary)', borderRadius: '18px 18px 18px 4px' }}>
                    {streamBuffer}
                    <span className="inline-block w-1.5 h-4 ml-0.5 animate-pulse" style={{ background: 'var(--color-accent-purple)' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t" style={{ borderColor: 'var(--color-surface-border)' }}>
            <div className="flex gap-2 items-end rounded-xl border p-2"
              style={{ background: 'var(--color-surface-elevated)', borderColor: 'var(--color-surface-border)' }}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder="Ask anything about your projects… (Enter to send, Shift+Enter for newline)"
                rows={1}
                className="flex-1 bg-transparent text-sm outline-none resize-none"
                style={{ color: 'var(--color-text-primary)', maxHeight: '120px' }}
              />
              <button onClick={send} disabled={!input.trim() || streaming}
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg disabled:opacity-50 transition-colors"
                style={{ background: 'var(--color-brand)', color: 'var(--color-text-inverse)' }}>
                {streaming ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
