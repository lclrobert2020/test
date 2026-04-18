import { Search, Command } from 'lucide-react'
import { useUIStore } from '../../stores/uiStore'

interface HeaderProps {
  title?: string
  actions?: React.ReactNode
}

export function Header({ title, actions }: HeaderProps) {
  const { setCommandPaletteOpen } = useUIStore()

  return (
    <div className="h-14 flex items-center justify-between px-6 border-b shrink-0"
      style={{ borderColor: 'var(--color-surface-border)', background: 'var(--color-surface-base)' }}>
      <h1 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
        {title}
      </h1>
      <div className="flex items-center gap-3">
        {actions}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors hover:bg-[var(--color-surface-elevated)]"
          style={{ color: 'var(--color-text-muted)', border: '1px solid var(--color-surface-border)' }}
        >
          <Search size={13} />
          <span className="hidden sm:block">Search</span>
          <span className="hidden sm:flex items-center gap-0.5 text-xs">
            <kbd className="px-1 rounded" style={{ background: 'var(--color-surface-overlay)' }}>
              <Command size={10} className="inline" />
            </kbd>
            <kbd className="px-1 rounded" style={{ background: 'var(--color-surface-overlay)' }}>K</kbd>
          </span>
        </button>
      </div>
    </div>
  )
}
