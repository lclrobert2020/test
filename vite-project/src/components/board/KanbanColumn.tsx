import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { IssueCard } from './IssueCard'
import { type Issue, type IssueStatus } from '../../types'
import { STATUS_LABELS } from '../../lib/constants'

const STATUS_COLORS: Record<IssueStatus, string> = {
  backlog: 'var(--color-status-todo)',
  todo: 'var(--color-status-todo)',
  inprogress: 'var(--color-status-inprogress)',
  inreview: 'var(--color-status-inreview)',
  testing: 'var(--color-status-testing)',
  done: 'var(--color-status-done)',
  blocked: 'var(--color-status-blocked)',
}

interface Props {
  status: IssueStatus
  issues: Issue[]
  onAddIssue?: (status: IssueStatus) => void
}

export function KanbanColumn({ status, issues, onAddIssue }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const color = STATUS_COLORS[status]
  const label = STATUS_LABELS[status] ?? status

  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: color }} />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
            {label}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full"
            style={{ background: 'var(--color-surface-elevated)', color: 'var(--color-text-muted)' }}>
            {issues.length}
          </span>
        </div>
        {onAddIssue && (
          <button onClick={() => onAddIssue(status)}
            className="w-5 h-5 rounded flex items-center justify-center hover:bg-[var(--color-surface-hover)] transition-colors">
            <Plus size={13} style={{ color: 'var(--color-text-muted)' }} />
          </button>
        )}
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className="flex-1 rounded-xl p-2 min-h-32 space-y-2 transition-colors"
        style={{
          background: isOver ? 'rgba(232,112,64,0.05)' : 'var(--color-surface-elevated)',
          border: `1px solid ${isOver ? 'var(--color-brand)' : 'var(--color-surface-border)'}`,
        }}
      >
        <SortableContext items={issues.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {issues.map(issue => <IssueCard key={issue.id} issue={issue} />)}
        </SortableContext>
        {issues.length === 0 && (
          <div className="flex items-center justify-center h-20 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Drop here
          </div>
        )}
      </div>
    </div>
  )
}
