import { useState } from 'react'
import { Eye, EyeOff, Database, Download, Upload, Key, Play } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { query, run, exportDb, importDb } from '../lib/db'
import { useDbStore } from '../stores/dbStore'

const TABLES = ['projects', 'issues', 'sprints', 'documents', 'team_members', 'comments', 'ai_conversations', 'settings']

function ApiKeySection() {
  const { bump } = useDbStore()
  const [show, setShow] = useState(false)
  const [key, setKey] = useState(() => {
    const rows = query<{ value: string }>('SELECT value FROM settings WHERE key = ?', ['api_key'])
    return rows[0]?.value ?? ''
  })
  const [saved, setSaved] = useState(false)

  const save = () => {
    run('INSERT OR REPLACE INTO settings VALUES (?,?)', ['api_key', key.trim()])
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    bump()
  }

  return (
    <div className="rounded-xl border p-5"
      style={{ background: 'var(--color-surface-elevated)', borderColor: 'var(--color-surface-border)' }}>
      <div className="flex items-center gap-2 mb-4">
        <Key size={16} style={{ color: 'var(--color-brand)' }} />
        <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>Anthropic API Key</h3>
      </div>
      <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
        Required for AI features. Your key is stored locally in the browser.
      </p>
      <div className="flex gap-2">
        <div className="flex-1 flex rounded-lg overflow-hidden border"
          style={{ borderColor: 'var(--color-surface-border)' }}>
          <input
            type={show ? 'text' : 'password'}
            value={key}
            onChange={e => setKey(e.target.value)}
            placeholder="sk-ant-..."
            className="flex-1 px-3 py-2 text-sm outline-none bg-transparent"
            style={{ color: 'var(--color-text-primary)', background: 'var(--color-surface-overlay)' }}
          />
          <button onClick={() => setShow(!show)} className="px-3"
            style={{ background: 'var(--color-surface-overlay)', color: 'var(--color-text-muted)' }}>
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        <button onClick={save} className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: saved ? 'var(--color-status-done)' : 'var(--color-brand)', color: 'var(--color-text-inverse)' }}>
          {saved ? 'Saved!' : 'Save'}
        </button>
      </div>
    </div>
  )
}

function DbViewerSection() {
  const { version } = useDbStore()
  const [activeTable, setActiveTable] = useState(TABLES[0])
  const [customSql, setCustomSql] = useState('')
  const [customResult, setCustomResult] = useState<{ columns: string[]; rows: unknown[][] } | null>(null)
  const [customError, setCustomError] = useState('')

  const tableData = (() => {
    try {
      const rows = query(`SELECT * FROM ${activeTable} LIMIT 50`)
      if (!rows.length) return { columns: [], rows: [] }
      return { columns: Object.keys(rows[0] as object), rows: rows.map(r => Object.values(r as object)) }
    } catch { return { columns: [], rows: [] } }
  })()

  const runCustom = () => {
    setCustomError('')
    setCustomResult(null)
    try {
      const result = query(customSql)
      if (!result.length) { setCustomResult({ columns: ['Result'], rows: [['No rows returned']] }); return }
      setCustomResult({ columns: Object.keys(result[0] as object), rows: result.map(r => Object.values(r as object)) })
    } catch (e) {
      setCustomError(String(e))
    }
  }

  const exportFile = () => {
    const data = exportDb()
    const blob = new Blob([data.buffer as ArrayBuffer], { type: 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'flowai.sqlite'; a.click()
    URL.revokeObjectURL(url)
  }

  const importFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const buf = await file.arrayBuffer()
    await importDb(new Uint8Array(buf))
    window.location.reload()
  }

  return (
    <div className="rounded-xl border"
      style={{ background: 'var(--color-surface-elevated)', borderColor: 'var(--color-surface-border)' }}>
      <div className="px-5 py-4 border-b flex items-center justify-between"
        style={{ borderColor: 'var(--color-surface-border)' }}>
        <div className="flex items-center gap-2">
          <Database size={16} style={{ color: 'var(--color-brand)' }} />
          <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>Database Viewer</h3>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportFile}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
            style={{ border: '1px solid var(--color-surface-border)', color: 'var(--color-text-secondary)' }}>
            <Download size={12} /> Export .sqlite
          </button>
          <label className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg cursor-pointer"
            style={{ border: '1px solid var(--color-surface-border)', color: 'var(--color-text-secondary)' }}>
            <Upload size={12} /> Import
            <input type="file" accept=".sqlite,.db" className="hidden" onChange={importFile} />
          </label>
        </div>
      </div>

      {/* Table tabs */}
      <div className="flex gap-0 overflow-x-auto border-b" style={{ borderColor: 'var(--color-surface-border)' }}>
        {TABLES.map(t => (
          <button key={t} onClick={() => setActiveTable(t)}
            className="px-3 py-2 text-xs whitespace-nowrap transition-colors border-b-2"
            style={{
              borderColor: activeTable === t ? 'var(--color-brand)' : 'transparent',
              color: activeTable === t ? 'var(--color-brand)' : 'var(--color-text-muted)',
            }}>{t}</button>
        ))}
      </div>

      {/* Table content */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: 'var(--color-surface-overlay)' }}>
              {tableData.columns.map(col => (
                <th key={col} className="text-left px-3 py-2 font-medium"
                  style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-surface-border)' }}>{col}</th>
              ))}
              {tableData.columns.length === 0 && (
                <th className="text-left px-3 py-2 font-medium" style={{ color: 'var(--color-text-muted)' }}>Empty table</th>
              )}
            </tr>
          </thead>
          <tbody>
            {tableData.rows.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--color-surface-border)' }}
                className="hover:bg-[var(--color-surface-hover)]">
                {row.map((cell, j) => (
                  <td key={j} className="px-3 py-2 max-w-32 truncate" style={{ color: 'var(--color-text-secondary)' }}>
                    {String(cell ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {tableData.rows.length === 0 && (
          <div className="px-4 py-6 text-center text-xs" style={{ color: 'var(--color-text-muted)' }}>No rows</div>
        )}
      </div>

      {/* SQL Console */}
      <div className="border-t p-4" style={{ borderColor: 'var(--color-surface-border)' }}>
        <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>SQL Console</div>
        <div className="flex gap-2 mb-2">
          <input value={customSql} onChange={e => setCustomSql(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && runCustom()}
            placeholder="SELECT COUNT(*) FROM issues"
            className="flex-1 px-3 py-2 rounded-lg text-xs outline-none font-mono"
            style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }} />
          <button onClick={runCustom}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
            style={{ background: 'var(--color-brand)', color: 'var(--color-text-inverse)' }}>
            <Play size={11} /> Run
          </button>
        </div>
        {customError && (
          <div className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-status-blocked)' }}>
            {customError}
          </div>
        )}
        {customResult && (
          <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--color-surface-border)' }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: 'var(--color-surface-overlay)' }}>
                  {customResult.columns.map(c => (
                    <th key={c} className="text-left px-3 py-1.5 font-medium" style={{ color: 'var(--color-text-muted)' }}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customResult.rows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j} className="px-3 py-1.5" style={{ color: 'var(--color-text-secondary)' }}>{String(cell ?? '')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export function SettingsPage() {
  const { bump } = useDbStore()

  const reseed = () => {
    if (!confirm('Reset all data and load demo project?')) return
    TABLES.forEach(t => run(`DELETE FROM ${t}`))
    bump()
    window.location.reload()
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Settings" />
      <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-3xl">
        <ApiKeySection />
        <DbViewerSection />
        <div className="rounded-xl border p-5"
          style={{ background: 'var(--color-surface-elevated)', borderColor: 'var(--color-surface-border)' }}>
          <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--color-text-primary)' }}>Data Management</h3>
          <button onClick={reseed} className="text-sm px-4 py-2 rounded-lg"
            style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--color-status-blocked)', border: '1px solid rgba(239,68,68,0.3)' }}>
            Reset & Load Demo Data
          </button>
        </div>
      </div>
    </div>
  )
}
