import { NavLink, useNavigate, useParams } from 'react-router-dom'
import {
  LayoutDashboard, FolderKanban, Users, Sparkles, Settings,
  ChevronRight, PanelLeftClose, PanelLeft, Zap, FileText,
  BarChart3, ListTodo, GitBranch,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { APP_NAME, APP_TAGLINE } from '../../lib/constants'
import { useUIStore } from '../../stores/uiStore'
import { useDbStore } from '../../stores/dbStore'
import { query } from '../../lib/db'
import { type Project } from '../../types'

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
        style={{ background: 'var(--color-brand)', color: 'var(--color-text-inverse)' }}>
        F
      </div>
      <div>
        <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{APP_NAME}</div>
        <div className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>{APP_TAGLINE}</div>
      </div>
    </div>
  )
}

function NavItem({ to, icon: Icon, label, end }: { to: string; icon: React.ElementType; label: string; end?: boolean }) {
  return (
    <NavLink to={to} end={end}
      className={({ isActive }) => cn(
        'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors duration-150 group',
        isActive
          ? 'font-medium'
          : 'hover:bg-[var(--color-surface-hover)]'
      )}
      style={({ isActive }) => isActive ? {
        background: 'rgba(232,112,64,0.12)',
        color: 'var(--color-brand)',
        borderLeft: '2px solid var(--color-brand)',
      } : { color: 'var(--color-text-secondary)', borderLeft: '2px solid transparent' }}
    >
      <Icon size={16} />
      <span>{label}</span>
    </NavLink>
  )
}

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { id: projectId } = useParams()
  const navigate = useNavigate()
  const { version } = useDbStore()

  const projects = query<Project>('SELECT * FROM projects ORDER BY created_at DESC')

  if (sidebarCollapsed) {
    return (
      <div className="w-12 flex flex-col items-center py-4 gap-4 border-r"
        style={{ background: 'var(--color-surface-elevated)', borderColor: 'var(--color-surface-border)' }}>
        <button onClick={toggleSidebar} className="p-1.5 rounded-lg hover:bg-[var(--color-surface-hover)]">
          <PanelLeft size={16} style={{ color: 'var(--color-text-muted)' }} />
        </button>
      </div>
    )
  }

  return (
    <div className="w-64 flex flex-col border-r shrink-0"
      style={{ background: 'var(--color-surface-elevated)', borderColor: 'var(--color-surface-border)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b"
        style={{ borderColor: 'var(--color-surface-border)' }}>
        <Logo />
        <button onClick={toggleSidebar} className="p-1 rounded hover:bg-[var(--color-surface-hover)]">
          <PanelLeftClose size={14} style={{ color: 'var(--color-text-muted)' }} />
        </button>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        <NavItem to="/" icon={LayoutDashboard} label="Dashboard" end />
        <NavItem to="/projects" icon={FolderKanban} label="Projects" end />
        <NavItem to="/team" icon={Users} label="Team" />
        <NavItem to="/ai" icon={Sparkles} label="AI Assistant" />
        <NavItem to="/reports" icon={BarChart3} label="Reports" />

        {/* Projects section */}
        {projects.length > 0 && (
          <div className="pt-4">
            <div className="px-3 pb-1 text-[10px] uppercase tracking-widest font-medium"
              style={{ color: 'var(--color-text-muted)' }}>Projects</div>
            {projects.map(p => (
              <div key={p.id}>
                <button
                  onClick={() => navigate(`/projects/${p.id}`)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors',
                    projectId === p.id
                      ? 'font-medium'
                      : 'hover:bg-[var(--color-surface-hover)]'
                  )}
                  style={projectId === p.id
                    ? { color: 'var(--color-text-primary)' }
                    : { color: 'var(--color-text-secondary)' }}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
                  <span className="truncate text-left">{p.name}</span>
                </button>
                {projectId === p.id && (
                  <div className="ml-5 mt-0.5 space-y-0.5">
                    <NavLink to={`/projects/${p.id}`} end
                      className={({ isActive }) => cn('flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-colors',
                        isActive ? 'text-[var(--color-brand)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                      )}>
                      <GitBranch size={11} /> Board
                    </NavLink>
                    <NavLink to={`/projects/${p.id}/backlog`}
                      className={({ isActive }) => cn('flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-colors',
                        isActive ? 'text-[var(--color-brand)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                      )}>
                      <ListTodo size={11} /> Backlog
                    </NavLink>
                    <NavLink to={`/projects/${p.id}/sprints`}
                      className={({ isActive }) => cn('flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-colors',
                        isActive ? 'text-[var(--color-brand)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                      )}>
                      <Zap size={11} /> Sprints
                    </NavLink>
                    <NavLink to={`/projects/${p.id}/documents`}
                      className={({ isActive }) => cn('flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-colors',
                        isActive ? 'text-[var(--color-brand)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                      )}>
                      <FileText size={11} /> Documents
                    </NavLink>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t px-3 py-3" style={{ borderColor: 'var(--color-surface-border)' }}>
        <NavItem to="/settings" icon={Settings} label="Settings" />
      </div>
    </div>
  )
}
