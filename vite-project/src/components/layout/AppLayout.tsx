import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { CommandPalette } from './CommandPalette'

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-surface-base)' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </div>
      <CommandPalette />
    </div>
  )
}
