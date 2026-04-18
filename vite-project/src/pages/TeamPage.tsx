import { useState } from 'react'
import { Plus, Users } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { query, run } from '../lib/db'
import { useDbStore } from '../stores/dbStore'
import { generateId, getInitials } from '../lib/utils'
import { type TeamMember, type Issue } from '../types'

export function TeamPage() {
  const { version, bump } = useDbStore()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('Developer')

  const members = query<TeamMember>('SELECT * FROM team_members ORDER BY name')

  const add = () => {
    if (!name.trim()) return
    run('INSERT INTO team_members VALUES (?,?,?,?,?)', [generateId(), name.trim(), email.trim(), '', role.trim()])
    setName(''); setEmail(''); setRole('Developer')
    setShowForm(false)
    bump()
  }

  const deleteMember = (id: string) => {
    run('DELETE FROM team_members WHERE id = ?', [id])
    bump()
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Team" actions={
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-medium"
          style={{ background: 'var(--color-brand)', color: 'var(--color-text-inverse)' }}>
          <Plus size={14} /> Add Member
        </button>
      } />
      <div className="flex-1 overflow-y-auto p-6">
        {showForm && (
          <div className="mb-6 rounded-xl border p-4 space-y-3"
            style={{ background: 'var(--color-surface-elevated)', borderColor: 'var(--color-brand)' }}>
            <div className="grid grid-cols-3 gap-3">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name"
                className="px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }} />
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email"
                className="px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }} />
              <input value={role} onChange={e => setRole(e.target.value)} placeholder="Role"
                className="px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }} />
            </div>
            <div className="flex gap-2">
              <button onClick={add} className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'var(--color-brand)', color: 'var(--color-text-inverse)' }}>Add</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm"
                style={{ color: 'var(--color-text-secondary)' }}>Cancel</button>
            </div>
          </div>
        )}

        {members.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Users size={40} style={{ color: 'var(--color-brand)' }} />
            <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No team members yet</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map(m => {
              const assigned = query<Issue>('SELECT * FROM issues WHERE assignee_id = ? AND status != ?', [m.id, 'done']).length
              return (
                <div key={m.id} className="rounded-xl border p-4 flex items-center gap-3 group"
                  style={{ background: 'var(--color-surface-elevated)', borderColor: 'var(--color-surface-border)' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ background: 'var(--color-brand)', color: 'var(--color-text-inverse)' }}>
                    {getInitials(m.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>{m.name}</div>
                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{m.role}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{assigned} open issues</div>
                  </div>
                  <button onClick={() => deleteMember(m.id)}
                    className="opacity-0 group-hover:opacity-100 text-xs px-2 py-1 rounded"
                    style={{ color: 'var(--color-status-blocked)', border: '1px solid var(--color-status-blocked)' }}>
                    Remove
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
