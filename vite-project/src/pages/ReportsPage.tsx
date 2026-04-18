import { useParams } from 'react-router-dom'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Header } from '../components/layout/Header'
import { query } from '../lib/db'
import { type Issue, type Sprint, type Project } from '../types'

const COLORS = ['#E87040', '#8B5CF6', '#14B8A6', '#3B82F6', '#F59E0B', '#EF4444', '#22C55E']

export function ReportsPage() {
  const { id: projectId } = useParams<{ id?: string }>()

  const projects = projectId
    ? query<Project>('SELECT * FROM projects WHERE id = ?', [projectId])
    : query<Project>('SELECT * FROM projects')

  const allIssues = projectId
    ? query<Issue>('SELECT * FROM issues WHERE project_id = ?', [projectId])
    : query<Issue>('SELECT * FROM issues')

  const sprints = projectId
    ? query<Sprint>('SELECT * FROM sprints WHERE project_id = ? ORDER BY created_at', [projectId])
    : query<Sprint>('SELECT * FROM sprints ORDER BY created_at')

  // Status distribution
  const statusData = ['todo', 'inprogress', 'inreview', 'testing', 'done', 'blocked'].map(s => ({
    name: s === 'inprogress' ? 'In Progress' : s === 'inreview' ? 'In Review' : s.charAt(0).toUpperCase() + s.slice(1),
    value: allIssues.filter(i => i.status === s).length,
  })).filter(d => d.value > 0)

  // Priority distribution
  const priorityData = ['critical', 'high', 'medium', 'low'].map(p => ({
    name: p.charAt(0).toUpperCase() + p.slice(1),
    value: allIssues.filter(i => i.priority === p).length,
  })).filter(d => d.value > 0)

  // Velocity (story points per sprint)
  const velocityData = sprints.map(sprint => {
    const sprintIssues = query<Issue>('SELECT * FROM issues WHERE sprint_id = ?', [sprint.id])
    const done = sprintIssues.filter(i => i.status === 'done').reduce((s, i) => s + (i.story_points || 0), 0)
    const total = sprintIssues.reduce((s, i) => s + (i.story_points || 0), 0)
    return { name: sprint.name.replace('Sprint ', 'S'), done, total }
  })

  // Issue types
  const typeData = ['epic', 'story', 'task', 'bug'].map(t => ({
    name: t.charAt(0).toUpperCase() + t.slice(1),
    value: allIssues.filter(i => i.type === t).length,
  })).filter(d => d.value > 0)

  const chartBg = 'transparent'
  const gridColor = 'var(--color-surface-border)'
  const textColor = 'var(--color-text-muted)'
  const tooltipStyle = {
    background: 'var(--color-surface-overlay)',
    border: '1px solid var(--color-surface-border)',
    borderRadius: '8px',
    color: 'var(--color-text-primary)',
    fontSize: '12px',
  }

  const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="rounded-xl border p-4"
      style={{ background: 'var(--color-surface-elevated)', borderColor: 'var(--color-surface-border)' }}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>{title}</h3>
      {children}
    </div>
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Reports" />
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {allIssues.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            No data yet — create some projects and issues first.
          </div>
        ) : (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Total Issues', value: allIssues.length },
                { label: 'Completed', value: allIssues.filter(i => i.status === 'done').length },
                { label: 'Open Bugs', value: allIssues.filter(i => i.type === 'bug' && i.status !== 'done').length },
                { label: 'Sprints', value: sprints.length },
              ].map(s => (
                <div key={s.label} className="rounded-xl border p-4 text-center"
                  style={{ background: 'var(--color-surface-elevated)', borderColor: 'var(--color-surface-border)' }}>
                  <div className="text-2xl font-bold" style={{ color: 'var(--color-brand)' }}>{s.value}</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Velocity */}
              {velocityData.length > 0 && (
                <Card title="Sprint Velocity (Story Points)">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={velocityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis dataKey="name" tick={{ fill: textColor, fontSize: 11 }} />
                      <YAxis tick={{ fill: textColor, fontSize: 11 }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="done" name="Completed" fill="var(--color-brand)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="total" name="Total" fill="var(--color-surface-border)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {/* Status distribution */}
              <Card title="Issue Status Distribution">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: 'var(--color-text-muted)' }}>
                      {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              {/* Priority */}
              <Card title="Issue Priority Breakdown">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={priorityData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis type="number" tick={{ fill: textColor, fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fill: textColor, fontSize: 11 }} width={60} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="value" name="Issues" radius={[0, 4, 4, 0]}>
                      {priorityData.map((entry, i) => {
                        const c = ['var(--color-priority-critical)', 'var(--color-priority-high)', 'var(--color-priority-medium)', 'var(--color-priority-low)']
                        return <Cell key={i} fill={c[i] ?? 'var(--color-brand)'} />
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {/* Type breakdown */}
              <Card title="Issue Types">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={typeData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
