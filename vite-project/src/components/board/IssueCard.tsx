import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useNavigate } from 'react-router-dom'
import { Bug, BookOpen, CheckSquare, Zap, MessageSquare } from 'lucide-react'
import { cn } from '../../lib/utils'
import { type Issue } from '../../types'
import { query } from '../../lib/db'

const TYPE_ICONS: Record<string, React.ElementType> = {
  epic: Zap,
  story: BookOpen,
  task: CheckSquare,
  bug: Bug,
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'var(--color-priority-critical)',
  high: 'var(--color-priority-high)',
  medium: 'var(--color-priority-medium)',
  low: 'var(--color-priority-low)',
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
      style={{ background: 'var(--color-brand)', color: 'var(--color-text-inverse)' }}>
      {initials}
    </div>
  )
}

export function IssueCard({ issue }: { issue: Issue }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: issue.id })
  const navigate = useNavigate()
  const TypeIcon = TYPE_ICONS[issue.type] ?? CheckSquare
  const priorityColor = PRIORITY_COLORS[issue.priority] ?? '#888'
  const commentCount = query<{ c: number }>('SELECT COUNT(*) as c FROM comments WHERE issue_id = ?', [issue.id])[0]?.c ?? 0
  const assignee = issue.assignee_id
    ? query<{ name: string }>('SELECT name FROM team_members WHERE id = ?', [issue.assignee_id])[0]
    : null

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: 'var(--color-surface-base)',
        borderColor: 'var(--color-surface-border)',
        borderLeft: `3px solid ${priorityColor}`,
      }}
      {...attributes}
      {...listeners}
      onClick={() => navigate(`/issues/${issue.id}`)}
      className={cn(
        'rounded-lg border p-3 cursor-pointer transition-colors hover:border-[var(--color-brand)]/40 group',
        isDragging ? 'shadow-xl' : ''
      )}
    >
      <div className="flex items-start gap-2 mb-2">
        <TypeIcon size={13} style={{ color: 'var(--color-text-muted)', marginTop: 1 }} />
        <span className="text-xs flex-1 leading-snug" style={{ color: 'var(--color-text-primary)' }}>{issue.title}</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {issue.story_points > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full"
              style={{ background: 'var(--color-surface-elevated)', color: 'var(--color-text-muted)' }}>
              {issue.story_points}pt
            </span>
          )}
          {commentCount > 0 && (
            <span className="flex items-center gap-0.5 text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
              <MessageSquare size={10} /> {commentCount}
            </span>
          )}
        </div>
        {assignee && <Avatar name={assignee.name} />}
      </div>
    </div>
  )
}
