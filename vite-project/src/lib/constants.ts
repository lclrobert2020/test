import type { IssueStatus, IssuePriority, IssueType, SdlcPhase, SprintStatus } from '../types'

export const APP_NAME = 'FlowAI'
export const APP_TAGLINE = 'SDLC Intelligence'

export const ISSUE_STATUSES: { value: IssueStatus; label: string; color: string }[] = [
  { value: 'backlog', label: 'Backlog', color: 'var(--color-status-todo)' },
  { value: 'todo', label: 'To Do', color: 'var(--color-status-todo)' },
  { value: 'inprogress', label: 'In Progress', color: 'var(--color-status-inprogress)' },
  { value: 'inreview', label: 'In Review', color: 'var(--color-status-inreview)' },
  { value: 'testing', label: 'Testing', color: 'var(--color-status-testing)' },
  { value: 'done', label: 'Done', color: 'var(--color-status-done)' },
  { value: 'blocked', label: 'Blocked', color: 'var(--color-status-blocked)' },
]

export const BOARD_COLUMNS: IssueStatus[] = ['todo', 'inprogress', 'inreview', 'testing', 'done']

export const ISSUE_PRIORITIES: { value: IssuePriority; label: string; color: string }[] = [
  { value: 'critical', label: 'Critical', color: 'var(--color-priority-critical)' },
  { value: 'high', label: 'High', color: 'var(--color-priority-high)' },
  { value: 'medium', label: 'Medium', color: 'var(--color-priority-medium)' },
  { value: 'low', label: 'Low', color: 'var(--color-priority-low)' },
]

export const ISSUE_TYPES: { value: IssueType; label: string; icon: string }[] = [
  { value: 'epic', label: 'Epic', icon: '⚡' },
  { value: 'story', label: 'Story', icon: '📖' },
  { value: 'task', label: 'Task', icon: '✓' },
  { value: 'bug', label: 'Bug', icon: '🐛' },
]

export const SDLC_PHASES: { value: SdlcPhase; label: string }[] = [
  { value: 'requirements', label: 'Requirements' },
  { value: 'design', label: 'Design' },
  { value: 'development', label: 'Development' },
  { value: 'testing', label: 'Testing' },
  { value: 'deployment', label: 'Deployment' },
  { value: 'maintenance', label: 'Maintenance' },
]

export const SPRINT_STATUSES: { value: SprintStatus; label: string }[] = [
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
]

export const PROJECT_COLORS = [
  '#E87040', '#8B5CF6', '#14B8A6', '#3B82F6',
  '#F59E0B', '#EF4444', '#10B981', '#EC4899',
]

export const STATUS_LABELS: Record<IssueStatus, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  inprogress: 'In Progress',
  inreview: 'In Review',
  testing: 'Testing',
  done: 'Done',
  blocked: 'Blocked',
}

export const PRIORITY_LABELS: Record<IssuePriority, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}
