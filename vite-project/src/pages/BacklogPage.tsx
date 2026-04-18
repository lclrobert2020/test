import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Bug, BookOpen, CheckSquare, Zap } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { query, run } from '../lib/db'
import { useDbStore } from '../stores/dbStore'
import { generateId } from '../lib/utils'
import { type Issue, type IssueStatus, type Sprint, type Project } from '../types'
import { ISSUE_PRIORITIES, STATUS_LABELS, PRIORITY_LABELS } from '../lib/constants'

const TYPE_ICONS: Record<string, React.ElementType> = {
  epic: Zap, story: BookOpen, task: CheckSquare, bug: Bug,
}
const TYPE_COLORS: Record<string, string> = {
  epic: 'var(--color-brand)',
  story: 'var(--color-accent-teal)',
  task: 'var(--color-accent-blue)',
  bug: 'var(--color-status-blocked)',
}
const PRIORITY_COLORS: Record<string, string> = {
  critical: 'var(--color-priority-critical)',
  high: 'var(--color-priority-high)',
  medium: 'var(--color-priority-medium)',
  low: 'var(--color-priority-low)',
}

export function BacklogPage() {
  const { id: projectId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { version, bump } = useDbStore()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [type, setType] = useState('task')
  const [priority, setPriority] = useState('medium')

  const project = query<Project>('SELECT * FROM projects WHERE id = ?', [projectId])[0]
  const backlog = query<Issue>(
    'SELECT * FROM issues WHERE project_id = ? AND status = ? ORDER BY order_index ASC, created_at DESC',
    [projectId, 'backlog']
  )
  const sprints = query<Sprint>('SELECT * FROM sprints WHERE project_id = ? ORDER BY created_at DESC', [projectId])

  const addIssue = () => {
    if (!title.trim()) return
    run('INSERT INTO issues VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [
      generateId(), projectId, null, type, title.trim(), '',
      'backlog', priority, null, 0, '', null,
      new Date().toISOString(), Date.now(),
    ])
    setTitle('')
    setShowForm(false)
    bump()
  }

  const assignToSprint = (issueId: string, sprintId: string) => {
    if (sprintId) {
      run('UPDATE issues SET sprint_id = ?, status = ? WHERE id = ?', [sprintId, 'todo', issueId])
    } else {
      run('UPDATE issues SET sprint_id = NULL, status = ? WHERE id = ?', ['backlog', issueId])
    }
    bump()
  }

  const deleteIssue = (id: string) => {
    run('DELETE FROM issues WHERE id = ?', [id])
    bump()
  }

  if (!project) return null

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title={`${project.name} — Backlog`} actions={
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-medium"
          style={{ background: 'var(--color-brand)', color: 'var(--color-text-inverse)' }}>
          <Plus size={14} /> Add Issue
        </button>
      } />
      <div className="flex-1 overflow-y-auto p-6">
        {showForm && (
          <div className="mb-4 rounded-xl border p-4 flex gap-3 items-end"
            style={{ background: 'var(--color-surface-elevated)', borderColor: 'var(--color-surface-border)' }}>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Issue title"
              autoFocus onKeyDown={e => e.key === 'Enter' && addIssue()}
              className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }} />
            <select value={type} onChange={e => setType(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }}>
              <option value="task">Task</option>
              <option value="story">Story</option>
              <option value="bug">Bug</option>
              <option value="epic">Epic</option>
            </select>
            <select value={priority} onChange={e => setPriority(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <button onClick={addIssue} className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: 'var(--color-brand)', color: 'var(--color-text-inverse)' }}>Add</button>
            <button onClick={() => setShowForm(false)} className="px-3 py-2 rounded-lg text-sm"
              style={{ color: 'var(--color-text-secondary)' }}>Cancel</button>
          </div>
        )}

        {backlog.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <CheckSquare size={32} style={{ color: 'var(--color-brand)' }} />
            <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Backlog is empty. Add some issues!</div>
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden"
            style={{ background: 'var(--color-surface-elevated)', borderColor: 'var(--color-surface-border)' }}>
            <div className="grid text-[10px] uppercase tracking-wider px-4 py-2 border-b"
              style={{ gridTemplateColumns: '1fr 80px 80px 80px 140px 60px', borderColor: 'var(--color-surface-border)', color: 'var(--color-text-muted)' }}>
              <span>Issue</span><span>Type</span><span>Priority</span><span>Status</span><span>Sprint</span><span>Pts</span>
            </div>
            {backlog.map(issue => {
              const TypeIcon = TYPE_ICONS[issue.type] ?? CheckSquare
              return (
                <div key={issue.id}
                  className="grid items-center px-4 py-2.5 border-b hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer group"
                  style={{ gridTemplateColumns: '1fr 80px 80px 80px 140px 60px', borderColor: 'var(--color-surface-border)' }}
                  onClick={() => navigate(`/issues/${issue.id}`)}>
                  <span className="text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>{issue.title}</span>
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <TypeIcon size={12} style={{ color: TYPE_COLORS[issue.type] }} />
                    <span className="text-xs capitalize" style={{ color: 'var(--color-text-muted)' }}>{issue.type}</span>
                  </div>
                  <span className="text-xs capitalize" style={{ color: PRIORITY_COLORS[issue.priority] }}>
                    {PRIORITY_LABELS[issue.priority as keyof typeof PRIORITY_LABELS] ?? issue.priority}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {STATUS_LABELS[issue.status as keyof typeof STATUS_LABELS] ?? issue.status}
                  </span>
                  <select
                    value={issue.sprint_id ?? ''}
                    onChange={e => { e.stopPropagation(); assignToSprint(issue.id, e.target.value) }}
                    onClick={e => e.stopPropagation()}
                    className="text-xs px-1.5 py-1 rounded outline-none"
                    style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-muted)' }}>
                    <option value="">— Backlog</option>
                    {sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{issue.story_points}pt</span>
                    <button onClick={e => { e.stopPropagation(); deleteIssue(issue.id) }}
                      className="opacity-0 group-hover:opacity-100 text-xs px-1 py-0.5 rounded hover:bg-[var(--color-surface-hover)]"
                      style={{ color: 'var(--color-status-blocked)' }}>✕</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
