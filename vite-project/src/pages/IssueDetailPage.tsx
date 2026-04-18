import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Sparkles, MessageSquare, Send, Loader2 } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { query, run } from '../lib/db'
import { useDbStore } from '../stores/dbStore'
import { generateId, formatRelative, getInitials } from '../lib/utils'
import { type Issue, type Comment, type TeamMember, type Project } from '../types'
import { ISSUE_STATUSES, ISSUE_PRIORITIES, ISSUE_TYPES, STATUS_LABELS, PRIORITY_LABELS } from '../lib/constants'
import { generateOnce } from '../lib/anthropic'

function Select({ label, value, options, onChange }: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>{label}</div>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-2 py-1.5 rounded-lg text-xs outline-none"
        style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

export function IssueDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { version, bump } = useDbStore()
  const [comment, setComment] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiText, setAiText] = useState('')

  const issue = query<Issue>('SELECT * FROM issues WHERE id = ?', [id])[0]
  const comments = query<Comment>('SELECT * FROM comments WHERE issue_id = ? ORDER BY created_at ASC', [id])
  const members = query<TeamMember>('SELECT * FROM team_members')
  const project = issue ? query<Project>('SELECT * FROM projects WHERE id = ?', [issue.project_id])[0] : null

  if (!issue) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Issue not found</div>
    </div>
  )

  const update = (field: string, value: string | number) => {
    run(`UPDATE issues SET ${field} = ? WHERE id = ?`, [value, issue.id])
    bump()
  }

  const addComment = () => {
    if (!comment.trim()) return
    run('INSERT INTO comments VALUES (?,?,?,?,?)', [
      generateId(), issue.id, 'me', comment.trim(), new Date().toISOString(),
    ])
    setComment('')
    bump()
  }

  const generateWithAI = async (type: 'description' | 'acceptance' | 'analysis') => {
    setAiLoading(true)
    setAiText('')
    try {
      const prompts = {
        description: `Write a clear, concise description for this ${issue.type} titled: "${issue.title}". Include purpose, scope, and technical context. Format as markdown.`,
        acceptance: `Write acceptance criteria for this ${issue.type}: "${issue.title}". Use Given/When/Then format or numbered checklist. Be specific and testable.`,
        analysis: `Analyze this bug: "${issue.title}". Provide: 1) Likely root causes 2) Severity assessment 3) Recommended fix steps 4) Prevention strategies.`,
      }
      const text = await generateOnce(prompts[type])
      setAiText(text)
    } catch (e) {
      setAiText(`Error: ${String(e)}`)
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header
        title={project?.name ?? 'Issue'}
        actions={
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg"
            style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }}>
            <ArrowLeft size={14} /> Back
          </button>
        }
      />
      <div className="flex-1 overflow-hidden flex">
        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl">
            {/* Type + Title */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2 py-0.5 rounded-full capitalize"
                style={{ background: 'var(--color-surface-elevated)', color: 'var(--color-text-muted)' }}>
                {issue.type}
              </span>
            </div>
            <input
              value={issue.title}
              onChange={e => update('title', e.target.value)}
              className="w-full text-xl font-semibold bg-transparent outline-none mb-4"
              style={{ color: 'var(--color-text-primary)' }}
            />

            {/* Description */}
            <div className="mb-6">
              <div className="text-xs mb-2 font-medium" style={{ color: 'var(--color-text-muted)' }}>Description</div>
              <textarea
                value={issue.description}
                onChange={e => update('description', e.target.value)}
                rows={6}
                placeholder="Describe the issue…"
                className="w-full px-3 py-2 rounded-lg text-sm resize-none outline-none"
                style={{ background: 'var(--color-surface-elevated)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }}
              />
            </div>

            {/* AI Result */}
            {aiText && (
              <div className="mb-6 rounded-xl p-4"
                style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.1), transparent)', border: '1px solid rgba(139,92,246,0.3)' }}>
                <div className="flex items-center gap-1.5 mb-2 text-xs font-medium" style={{ color: 'var(--color-accent-purple)' }}>
                  <Sparkles size={12} /> AI Generated
                </div>
                <pre className="text-sm whitespace-pre-wrap" style={{ color: 'var(--color-text-primary)', fontFamily: 'inherit' }}>{aiText}</pre>
              </div>
            )}

            {/* Comments */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare size={14} style={{ color: 'var(--color-text-muted)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  Comments ({comments.length})
                </span>
              </div>
              <div className="space-y-3 mb-4">
                {comments.map(c => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                      style={{ background: 'var(--color-brand)', color: 'var(--color-text-inverse)' }}>Me</div>
                    <div className="flex-1 rounded-lg p-3"
                      style={{ background: 'var(--color-surface-elevated)', border: '1px solid var(--color-surface-border)' }}>
                      <div className="text-[10px] mb-1" style={{ color: 'var(--color-text-muted)' }}>{formatRelative(c.created_at)}</div>
                      <div className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{c.content}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && addComment()}
                  placeholder="Write a comment…"
                  className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--color-surface-elevated)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }}
                />
                <button onClick={addComment}
                  className="px-3 py-2 rounded-lg"
                  style={{ background: 'var(--color-brand)', color: 'var(--color-text-inverse)' }}>
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-64 shrink-0 border-l overflow-y-auto p-4 space-y-4"
          style={{ borderColor: 'var(--color-surface-border)', background: 'var(--color-surface-elevated)' }}>
          <Select label="Status" value={issue.status} onChange={v => update('status', v)}
            options={ISSUE_STATUSES.map(s => ({ value: s.value, label: s.label }))} />
          <Select label="Priority" value={issue.priority} onChange={v => update('priority', v)}
            options={ISSUE_PRIORITIES.map(p => ({ value: p.value, label: p.label }))} />
          <Select label="Type" value={issue.type} onChange={v => update('type', v)}
            options={ISSUE_TYPES.map(t => ({ value: t.value, label: t.label }))} />
          <Select label="Assignee" value={issue.assignee_id ?? ''} onChange={v => update('assignee_id', v)}
            options={[{ value: '', label: 'Unassigned' }, ...members.map(m => ({ value: m.id, label: m.name }))]} />
          <div>
            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>Story Points</div>
            <input type="number" value={issue.story_points} min={0} max={99}
              onChange={e => update('story_points', Number(e.target.value))}
              className="w-full px-2 py-1.5 rounded-lg text-xs outline-none"
              style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }} />
          </div>

          {/* AI Actions */}
          <div className="pt-2 border-t" style={{ borderColor: 'var(--color-surface-border)' }}>
            <div className="flex items-center gap-1.5 mb-2 text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-accent-purple)' }}>
              <Sparkles size={11} /> AI Assistant
            </div>
            <div className="space-y-1.5">
              <button onClick={() => generateWithAI('description')} disabled={aiLoading}
                className="w-full text-left text-xs px-2.5 py-2 rounded-lg transition-colors hover:bg-[var(--color-surface-hover)] disabled:opacity-50"
                style={{ border: '1px solid rgba(139,92,246,0.3)', color: 'var(--color-text-secondary)' }}>
                {aiLoading ? <Loader2 size={11} className="animate-spin inline mr-1" /> : null}
                Generate description
              </button>
              <button onClick={() => generateWithAI('acceptance')} disabled={aiLoading}
                className="w-full text-left text-xs px-2.5 py-2 rounded-lg transition-colors hover:bg-[var(--color-surface-hover)] disabled:opacity-50"
                style={{ border: '1px solid rgba(139,92,246,0.3)', color: 'var(--color-text-secondary)' }}>
                Generate acceptance criteria
              </button>
              {issue.type === 'bug' && (
                <button onClick={() => generateWithAI('analysis')} disabled={aiLoading}
                  className="w-full text-left text-xs px-2.5 py-2 rounded-lg transition-colors hover:bg-[var(--color-surface-hover)] disabled:opacity-50"
                  style={{ border: '1px solid rgba(139,92,246,0.3)', color: 'var(--color-text-secondary)' }}>
                  Analyze bug
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
