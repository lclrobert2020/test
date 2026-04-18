import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Zap, Sparkles, Loader2 } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { query, run } from '../lib/db'
import { useDbStore } from '../stores/dbStore'
import { generateId, formatDate } from '../lib/utils'
import { type Sprint, type Issue, type Project } from '../types'
import { generateOnce } from '../lib/anthropic'

export function SprintPlanningPage() {
  const { id: projectId } = useParams<{ id: string }>()
  const { version, bump } = useDbStore()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [goal, setGoal] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState('')

  const project = query<Project>('SELECT * FROM projects WHERE id = ?', [projectId])[0]
  const sprints = query<Sprint>('SELECT * FROM sprints WHERE project_id = ? ORDER BY created_at DESC', [projectId])

  const addSprint = () => {
    if (!name.trim()) return
    run('INSERT INTO sprints VALUES (?,?,?,?,?,?,?)', [
      generateId(), projectId, name.trim(), goal.trim(), startDate, endDate, 'planning',
    ])
    setName(''); setGoal(''); setStartDate(''); setEndDate('')
    setShowForm(false)
    bump()
  }

  const updateStatus = (id: string, status: string) => {
    run('UPDATE sprints SET status = ? WHERE id = ?', [status, id])
    bump()
  }

  const deleteSprint = (id: string) => {
    run('UPDATE issues SET sprint_id = NULL, status = ? WHERE sprint_id = ?', ['backlog', id])
    run('DELETE FROM sprints WHERE id = ?', [id])
    bump()
  }

  const getAISuggestion = async () => {
    setAiLoading(true)
    setAiSuggestion('')
    try {
      const backlogIssues = query<Issue>('SELECT * FROM issues WHERE project_id = ? AND status = ?', [projectId, 'backlog'])
      const prompt = `I'm planning a sprint for a project called "${project?.name}". Here are the backlog issues:\n${backlogIssues.map(i => `- [${i.priority}] ${i.title} (${i.story_points}pts)`).join('\n')}\n\nSuggest which issues to include in the next 2-week sprint (assume 40 story points capacity for a small team), write a sprint goal, and explain your reasoning.`
      const text = await generateOnce(prompt)
      setAiSuggestion(text)
    } catch (e) {
      setAiSuggestion(`Error: ${String(e)}`)
    } finally {
      setAiLoading(false)
    }
  }

  if (!project) return null

  const STATUS_COLORS: Record<string, string> = {
    planning: 'var(--color-text-muted)',
    active: 'var(--color-status-inprogress)',
    completed: 'var(--color-status-done)',
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title={`${project.name} — Sprints`} actions={
        <div className="flex gap-2">
          <button onClick={getAISuggestion} disabled={aiLoading}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg disabled:opacity-50"
            style={{ border: '1px solid rgba(139,92,246,0.4)', color: 'var(--color-accent-purple)' }}>
            {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            AI Plan Sprint
          </button>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-medium"
            style={{ background: 'var(--color-brand)', color: 'var(--color-text-inverse)' }}>
            <Plus size={14} /> New Sprint
          </button>
        </div>
      } />
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {aiSuggestion && (
          <div className="rounded-xl p-4"
            style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.1), transparent)', border: '1px solid rgba(139,92,246,0.3)' }}>
            <div className="flex items-center gap-1.5 mb-2 text-xs font-medium" style={{ color: 'var(--color-accent-purple)' }}>
              <Sparkles size={12} /> AI Sprint Suggestion
            </div>
            <pre className="text-sm whitespace-pre-wrap" style={{ color: 'var(--color-text-primary)', fontFamily: 'inherit' }}>{aiSuggestion}</pre>
          </div>
        )}

        {showForm && (
          <div className="rounded-xl border p-4 space-y-3"
            style={{ background: 'var(--color-surface-elevated)', borderColor: 'var(--color-brand)' }}>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Sprint name"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }} />
            <input value={goal} onChange={e => setGoal(e.target.value)} placeholder="Sprint goal"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }} />
            <div className="flex gap-3">
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }} />
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }} />
            </div>
            <div className="flex gap-2">
              <button onClick={addSprint} className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'var(--color-brand)', color: 'var(--color-text-inverse)' }}>Create Sprint</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm"
                style={{ color: 'var(--color-text-secondary)' }}>Cancel</button>
            </div>
          </div>
        )}

        {sprints.length === 0 && !showForm && (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Zap size={32} style={{ color: 'var(--color-brand)' }} />
            <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No sprints yet. Create your first sprint!</div>
          </div>
        )}

        {sprints.map(sprint => {
          const issues = query<Issue>('SELECT * FROM issues WHERE sprint_id = ?', [sprint.id])
          const done = issues.filter(i => i.status === 'done').length
          const totalPts = issues.reduce((s, i) => s + (i.story_points || 0), 0)
          const pct = issues.length ? Math.round((done / issues.length) * 100) : 0

          return (
            <div key={sprint.id} className="rounded-xl border p-5"
              style={{ background: 'var(--color-surface-elevated)', borderColor: 'var(--color-surface-border)' }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{sprint.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full capitalize font-medium"
                      style={{ background: STATUS_COLORS[sprint.status] + '20', color: STATUS_COLORS[sprint.status] }}>
                      {sprint.status}
                    </span>
                  </div>
                  {sprint.goal && <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{sprint.goal}</p>}
                  {sprint.start_date && (
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                      {formatDate(sprint.start_date)} → {sprint.end_date ? formatDate(sprint.end_date) : '?'}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {sprint.status === 'planning' && (
                    <button onClick={() => updateStatus(sprint.id, 'active')}
                      className="text-xs px-2.5 py-1 rounded-lg font-medium"
                      style={{ background: 'var(--color-status-inprogress)', color: '#fff' }}>Start</button>
                  )}
                  {sprint.status === 'active' && (
                    <button onClick={() => updateStatus(sprint.id, 'completed')}
                      className="text-xs px-2.5 py-1 rounded-lg font-medium"
                      style={{ background: 'var(--color-status-done)', color: '#fff' }}>Complete</button>
                  )}
                  <button onClick={() => deleteSprint(sprint.id)}
                    className="text-xs px-2.5 py-1 rounded-lg"
                    style={{ color: 'var(--color-status-blocked)', border: '1px solid var(--color-status-blocked)' }}>Delete</button>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--color-surface-border)' }}>
                  <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: 'var(--color-brand)' }} />
                </div>
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{pct}%</span>
              </div>
              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {done}/{issues.length} issues · {totalPts}pts total
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
