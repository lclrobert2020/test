import { useNavigate } from 'react-router-dom'
import { FolderKanban, Bug, CheckSquare, TrendingUp, Zap, Plus } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { query } from '../lib/db'
import { useDbStore } from '../stores/dbStore'
import { formatRelative, getInitials } from '../lib/utils'
import { type Project, type Issue, type Sprint } from '../types'
import { STATUS_LABELS, PRIORITY_LABELS } from '../lib/constants'

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <div className="rounded-xl p-4 border" style={{ background: 'var(--color-surface-elevated)', borderColor: 'var(--color-surface-border)' }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: color + '20' }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      <div className="text-2xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>{value}</div>
    </div>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    critical: 'var(--color-priority-critical)',
    high: 'var(--color-priority-high)',
    medium: 'var(--color-priority-medium)',
    low: 'var(--color-priority-low)',
  }
  return (
    <span className="text-xs px-1.5 py-0.5 rounded font-medium"
      style={{ background: (colors[priority] ?? '#888') + '20', color: colors[priority] ?? '#888' }}>
      {PRIORITY_LABELS[priority as keyof typeof PRIORITY_LABELS] ?? priority}
    </span>
  )
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { version } = useDbStore()

  const projects = query<Project>('SELECT * FROM projects ORDER BY created_at DESC')
  const allIssues = query<Issue>('SELECT * FROM issues')
  const recentIssues = query<Issue>('SELECT * FROM issues ORDER BY created_at DESC LIMIT 8')
  const activeSprints = query<Sprint>(`SELECT * FROM sprints WHERE status = 'active' LIMIT 3`)

  const openBugs = allIssues.filter(i => i.type === 'bug' && i.status !== 'done').length
  const inProgress = allIssues.filter(i => i.status === 'inprogress').length
  const done = allIssues.filter(i => i.status === 'done').length

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Dashboard" actions={
        <button onClick={() => navigate('/projects')}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-medium transition-colors hover:opacity-90"
          style={{ background: 'var(--color-brand)', color: 'var(--color-text-inverse)' }}>
          <Plus size={14} /> New Project
        </button>
      } />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Projects" value={projects.length} icon={FolderKanban} color="var(--color-brand)" />
          <StatCard label="Open Bugs" value={openBugs} icon={Bug} color="var(--color-priority-critical)" />
          <StatCard label="In Progress" value={inProgress} icon={TrendingUp} color="var(--color-status-inprogress)" />
          <StatCard label="Done" value={done} icon={CheckSquare} color="var(--color-status-done)" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Issues */}
          <div className="lg:col-span-2 rounded-xl border" style={{ background: 'var(--color-surface-elevated)', borderColor: 'var(--color-surface-border)' }}>
            <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-surface-border)' }}>
              <span className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>Recent Issues</span>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--color-surface-border)' }}>
              {recentIssues.length === 0 && (
                <div className="p-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>No issues yet</div>
              )}
              {recentIssues.map(issue => (
                <div key={issue.id}
                  onClick={() => navigate(`/issues/${issue.id}`)}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--color-surface-hover)] transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: issue.type === 'bug' ? 'var(--color-priority-critical)' : 'var(--color-brand)' }} />
                  <span className="flex-1 text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>{issue.title}</span>
                  <PriorityBadge priority={issue.priority} />
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {STATUS_LABELS[issue.status as keyof typeof STATUS_LABELS] ?? issue.status}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{formatRelative(issue.created_at)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Projects + Active Sprints */}
          <div className="space-y-4">
            {/* Active Sprints */}
            {activeSprints.length > 0 && (
              <div className="rounded-xl border" style={{ background: 'var(--color-surface-elevated)', borderColor: 'var(--color-surface-border)' }}>
                <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--color-surface-border)' }}>
                  <Zap size={14} style={{ color: 'var(--color-brand)' }} />
                  <span className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>Active Sprints</span>
                </div>
                {activeSprints.map(sprint => {
                  const issues = query<Issue>('SELECT * FROM issues WHERE sprint_id = ?', [sprint.id])
                  const doneCount = issues.filter(i => i.status === 'done').length
                  const pct = issues.length ? Math.round((doneCount / issues.length) * 100) : 0
                  return (
                    <div key={sprint.id} className="p-4 space-y-2">
                      <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{sprint.name}</div>
                      <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{sprint.goal}</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--color-surface-border)' }}>
                          <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: 'var(--color-brand)' }} />
                        </div>
                        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{pct}%</span>
                      </div>
                      <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{doneCount}/{issues.length} issues done</div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Projects */}
            <div className="rounded-xl border" style={{ background: 'var(--color-surface-elevated)', borderColor: 'var(--color-surface-border)' }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--color-surface-border)' }}>
                <span className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>Projects</span>
              </div>
              {projects.length === 0 && (
                <div className="p-6 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>No projects</div>
              )}
              {projects.map(p => {
                const count = query<{ c: number }>('SELECT COUNT(*) as c FROM issues WHERE project_id = ?', [p.id])[0]?.c ?? 0
                return (
                  <div key={p.id}
                    onClick={() => navigate(`/projects/${p.id}`)}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--color-surface-hover)] transition-colors border-b last:border-0"
                    style={{ borderColor: 'var(--color-surface-border)' }}>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                    <span className="flex-1 text-sm" style={{ color: 'var(--color-text-primary)' }}>{p.name}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full"
                      style={{ background: 'var(--color-surface-overlay)', color: 'var(--color-text-muted)' }}>
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
