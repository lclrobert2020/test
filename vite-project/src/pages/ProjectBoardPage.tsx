import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  DndContext, closestCorners, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { KanbanColumn } from '../components/board/KanbanColumn'
import { query, run } from '../lib/db'
import { useDbStore } from '../stores/dbStore'
import { type Issue, type IssueStatus, type Project } from '../types'
import { BOARD_COLUMNS } from '../lib/constants'
import { generateId } from '../lib/utils'

function IssueFormModal({ projectId, defaultStatus, onClose }: {
  projectId: string; defaultStatus: IssueStatus; onClose: () => void
}) {
  const { bump } = useDbStore()
  const [title, setTitle] = useState('')
  const [type, setType] = useState<'epic' | 'story' | 'task' | 'bug'>('task')
  const [priority, setPriority] = useState<'critical' | 'high' | 'medium' | 'low'>('medium')
  const [points, setPoints] = useState(0)

  const submit = () => {
    if (!title.trim()) return
    run(`INSERT INTO issues VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
      generateId(), projectId, null, type, title.trim(), '',
      defaultStatus, priority, null, points, '', null,
      new Date().toISOString(), Date.now(),
    ])
    bump()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-xl p-6 shadow-2xl"
        style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)' }}
        onClick={e => e.stopPropagation()}>
        <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>New Issue</h2>
        <div className="space-y-3">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Issue title"
            autoFocus onKeyDown={e => e.key === 'Enter' && submit()}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: 'var(--color-surface-elevated)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }} />
          <div className="flex gap-2">
            <select value={type} onChange={e => setType(e.target.value as typeof type)}
              className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'var(--color-surface-elevated)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }}>
              <option value="task">Task</option>
              <option value="story">Story</option>
              <option value="bug">Bug</option>
              <option value="epic">Epic</option>
            </select>
            <select value={priority} onChange={e => setPriority(e.target.value as typeof priority)}
              className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'var(--color-surface-elevated)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <input type="number" value={points} onChange={e => setPoints(Number(e.target.value))}
              placeholder="Pts" min={0} max={99}
              className="w-20 px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'var(--color-surface-elevated)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm" style={{ color: 'var(--color-text-secondary)' }}>Cancel</button>
          <button onClick={submit} disabled={!title.trim()} className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ background: 'var(--color-brand)', color: 'var(--color-text-inverse)' }}>Create</button>
        </div>
      </div>
    </div>
  )
}

export function ProjectBoardPage() {
  const { id: projectId } = useParams<{ id: string }>()
  const { version, bump } = useDbStore()
  const [addingStatus, setAddingStatus] = useState<IssueStatus | null>(null)

  const project = query<Project>('SELECT * FROM projects WHERE id = ?', [projectId])[0]
  const issues = query<Issue>(
    'SELECT * FROM issues WHERE project_id = ? AND status != ? ORDER BY order_index ASC',
    [projectId, 'backlog']
  )

  const issuesByStatus = BOARD_COLUMNS.reduce((acc, status) => {
    acc[status] = issues.filter(i => i.status === status)
    return acc
  }, {} as Record<IssueStatus, Issue[]>)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const handleDragEnd = (event: DragEndEvent) => {

    const { active, over } = event
    if (!over) return

    const activeIssue = issues.find(i => i.id === active.id)
    if (!activeIssue) return

    const overId = over.id as string
    const targetStatus = BOARD_COLUMNS.includes(overId as IssueStatus)
      ? overId as IssueStatus
      : issues.find(i => i.id === overId)?.status ?? activeIssue.status

    if (activeIssue.status !== targetStatus) {
      run('UPDATE issues SET status = ? WHERE id = ?', [targetStatus, activeIssue.id])
      bump()
    }
  }

  if (!project) return null

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title={project.name} actions={
        <button onClick={() => setAddingStatus('todo')}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-medium"
          style={{ background: 'var(--color-brand)', color: 'var(--color-text-inverse)' }}>
          <Plus size={14} /> Issue
        </button>
      } />
      <div className="flex-1 overflow-x-auto p-6">
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 h-full min-h-0">
            {BOARD_COLUMNS.map(status => (
              <KanbanColumn
                key={status}
                status={status}
                issues={issuesByStatus[status] ?? []}
                onAddIssue={setAddingStatus}
              />
            ))}
          </div>
        </DndContext>
      </div>
      {addingStatus && (
        <IssueFormModal
          projectId={projectId!}
          defaultStatus={addingStatus}
          onClose={() => setAddingStatus(null)}
        />
      )}
    </div>
  )
}
