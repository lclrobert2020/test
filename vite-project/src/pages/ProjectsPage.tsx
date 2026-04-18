import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FolderKanban, Trash2 } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { query, run } from '../lib/db'
import { useDbStore } from '../stores/dbStore'
import { generateId } from '../lib/utils'
import { type Project } from '../types'
import { SDLC_PHASES, PROJECT_COLORS } from '../lib/constants'

function ProjectForm({ onClose }: { onClose: () => void }) {
  const { bump } = useDbStore()
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [phase, setPhase] = useState('development')
  const [color, setColor] = useState(PROJECT_COLORS[0])

  const submit = () => {
    if (!name.trim()) return
    run('INSERT INTO projects VALUES (?,?,?,?,?,?)', [
      generateId(), name.trim(), desc.trim(), phase, color, new Date().toISOString(),
    ])
    bump()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="w-full max-w-md rounded-xl p-6 shadow-2xl"
        style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)' }}
        onClick={e => e.stopPropagation()}>
        <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>New Project</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Project Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="My SDLC Project"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'var(--color-surface-elevated)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }} />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Description</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} placeholder="What is this project about?"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
              style={{ background: 'var(--color-surface-elevated)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }} />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-muted)' }}>SDLC Phase</label>
            <select value={phase} onChange={e => setPhase(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'var(--color-surface-elevated)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }}>
              {SDLC_PHASES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Color</label>
            <div className="flex gap-2 flex-wrap">
              {PROJECT_COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                  style={{ background: c, outline: color === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }} />
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm"
            style={{ color: 'var(--color-text-secondary)' }}>Cancel</button>
          <button onClick={submit} disabled={!name.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ background: 'var(--color-brand)', color: 'var(--color-text-inverse)' }}>
            Create Project
          </button>
        </div>
      </div>
    </div>
  )
}

export function ProjectsPage() {
  const navigate = useNavigate()
  const { version, bump } = useDbStore()
  const [showForm, setShowForm] = useState(false)
  const projects = query<Project>('SELECT * FROM projects ORDER BY created_at DESC')

  const deleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this project and all its issues?')) return
    run('DELETE FROM issues WHERE project_id = ?', [id])
    run('DELETE FROM sprints WHERE project_id = ?', [id])
    run('DELETE FROM documents WHERE project_id = ?', [id])
    run('DELETE FROM projects WHERE id = ?', [id])
    bump()
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Projects" actions={
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-medium"
          style={{ background: 'var(--color-brand)', color: 'var(--color-text-inverse)' }}>
          <Plus size={14} /> New Project
        </button>
      } />
      <div className="flex-1 overflow-y-auto p-6">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: 'var(--color-surface-elevated)' }}>
              <FolderKanban size={24} style={{ color: 'var(--color-brand)' }} />
            </div>
            <div className="text-center">
              <div className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>No projects yet</div>
              <div className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Create your first project to get started</div>
            </div>
            <button onClick={() => setShowForm(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: 'var(--color-brand)', color: 'var(--color-text-inverse)' }}>
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(p => {
              const issueCount = query<{ c: number }>('SELECT COUNT(*) as c FROM issues WHERE project_id = ?', [p.id])[0]?.c ?? 0
              const openCount = query<{ c: number }>('SELECT COUNT(*) as c FROM issues WHERE project_id = ? AND status != ?', [p.id, 'done'])[0]?.c ?? 0
              return (
                <div key={p.id}
                  onClick={() => navigate(`/projects/${p.id}`)}
                  className="group rounded-xl border p-5 cursor-pointer transition-colors hover:border-[var(--color-brand)]/30"
                  style={{ background: 'var(--color-surface-elevated)', borderColor: 'var(--color-surface-border)' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full" style={{ background: p.color }} />
                      <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{p.name}</span>
                    </div>
                    <button onClick={e => deleteProject(p.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity hover:bg-[var(--color-surface-hover)]">
                      <Trash2 size={13} style={{ color: 'var(--color-status-blocked)' }} />
                    </button>
                  </div>
                  {p.description && (
                    <p className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>{p.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs px-2 py-0.5 rounded-full capitalize"
                      style={{ background: 'var(--color-surface-overlay)', color: 'var(--color-text-muted)' }}>
                      {p.sdlc_phase}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {openCount} open · {issueCount} total
                    </span>
                  </div>
                </div>
              )
            })}
            <button onClick={() => setShowForm(true)}
              className="rounded-xl border border-dashed p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors hover:border-[var(--color-brand)]/50"
              style={{ borderColor: 'var(--color-surface-border)' }}>
              <Plus size={20} style={{ color: 'var(--color-text-muted)' }} />
              <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>New Project</span>
            </button>
          </div>
        )}
      </div>
      {showForm && <ProjectForm onClose={() => setShowForm(false)} />}
    </div>
  )
}
