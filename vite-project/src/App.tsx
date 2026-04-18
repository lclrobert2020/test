import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { DashboardPage } from './pages/DashboardPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { ProjectBoardPage } from './pages/ProjectBoardPage'
import { BacklogPage } from './pages/BacklogPage'
import { SprintPlanningPage } from './pages/SprintPlanningPage'
import { DocumentsPage } from './pages/DocumentsPage'
import { IssueDetailPage } from './pages/IssueDetailPage'
import { TeamPage } from './pages/TeamPage'
import { ReportsPage } from './pages/ReportsPage'
import { AIAssistantPage } from './pages/AIAssistantPage'
import { SettingsPage } from './pages/SettingsPage'
import { useDbStore } from './stores/dbStore'

function Loading() {
  return (
    <div className="h-screen flex items-center justify-center"
      style={{ background: 'var(--color-surface-base)' }}>
      <div className="text-center">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold mx-auto mb-4"
          style={{ background: 'var(--color-brand)', color: 'var(--color-text-inverse)' }}>F</div>
        <div className="text-sm animate-pulse" style={{ color: 'var(--color-text-muted)' }}>Loading FlowAI…</div>
      </div>
    </div>
  )
}

function ErrorScreen({ error }: { error: string }) {
  return (
    <div className="h-screen flex items-center justify-center" style={{ background: 'var(--color-surface-base)' }}>
      <div className="text-center max-w-sm">
        <div className="text-sm font-semibold mb-2" style={{ color: 'var(--color-status-blocked)' }}>Failed to initialize database</div>
        <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{error}</div>
      </div>
    </div>
  )
}

export default function App() {
  const { initialized, error, init } = useDbStore()

  useEffect(() => { init() }, [init])

  if (error) return <ErrorScreen error={error} />
  if (!initialized) return <Loading />

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectBoardPage />} />
        <Route path="/projects/:id/backlog" element={<BacklogPage />} />
        <Route path="/projects/:id/sprints" element={<SprintPlanningPage />} />
        <Route path="/projects/:id/documents" element={<DocumentsPage />} />
        <Route path="/issues/:id" element={<IssueDetailPage />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/ai" element={<AIAssistantPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}
