import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, FolderKanban, Bug, CheckSquare } from 'lucide-react'
import { useUIStore } from '../../stores/uiStore'
import { query } from '../../lib/db'
import { type Project, type Issue } from '../../types'

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore()
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
      if (e.key === 'Escape') setCommandPaletteOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setCommandPaletteOpen])

  if (!commandPaletteOpen) return null

  const projects = query<Project>('SELECT * FROM projects WHERE name LIKE ? LIMIT 5', [`%${search}%`])
  const issues = search.length > 1
    ? query<Issue>('SELECT * FROM issues WHERE title LIKE ? LIMIT 8', [`%${search}%`])
    : []

  const go = (path: string) => {
    navigate(path)
    setCommandPaletteOpen(false)
    setSearch('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-32"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={() => setCommandPaletteOpen(false)}>
      <div className="w-full max-w-xl rounded-xl overflow-hidden shadow-2xl"
        style={{
          background: 'var(--color-surface-overlay)',
          border: '1px solid var(--color-brand)',
          boxShadow: '0 0 40px rgba(232,112,64,0.15)',
        }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b"
          style={{ borderColor: 'var(--color-surface-border)' }}>
          <Search size={16} style={{ color: 'var(--color-text-muted)' }} />
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search projects, issues..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--color-text-primary)' }}
          />
          <kbd className="text-xs px-1.5 py-0.5 rounded"
            style={{ background: 'var(--color-surface-elevated)', color: 'var(--color-text-muted)' }}>
            ESC
          </kbd>
        </div>
        <div className="max-h-80 overflow-y-auto py-2">
          {projects.length > 0 && (
            <div>
              <div className="px-4 py-1 text-[10px] uppercase tracking-widest"
                style={{ color: 'var(--color-text-muted)' }}>Projects</div>
              {projects.map(p => (
                <button key={p.id} onClick={() => go(`/projects/${p.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-[var(--color-surface-hover)] transition-colors">
                  <FolderKanban size={14} style={{ color: p.color }} />
                  <span style={{ color: 'var(--color-text-primary)' }}>{p.name}</span>
                </button>
              ))}
            </div>
          )}
          {issues.length > 0 && (
            <div>
              <div className="px-4 py-1 text-[10px] uppercase tracking-widest"
                style={{ color: 'var(--color-text-muted)' }}>Issues</div>
              {issues.map(i => (
                <button key={i.id} onClick={() => go(`/issues/${i.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-[var(--color-surface-hover)] transition-colors">
                  {i.type === 'bug' ? <Bug size={14} style={{ color: 'var(--color-priority-critical)' }} />
                    : <CheckSquare size={14} style={{ color: 'var(--color-brand)' }} />}
                  <span style={{ color: 'var(--color-text-primary)' }}>{i.title}</span>
                </button>
              ))}
            </div>
          )}
          {projects.length === 0 && issues.length === 0 && (
            <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {search ? 'No results found' : 'Start typing to search…'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
