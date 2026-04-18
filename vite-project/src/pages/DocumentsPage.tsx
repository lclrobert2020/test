import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { FileText, Plus, Trash2, Bold, Italic, Code, List } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { query, run } from '../lib/db'
import { useDbStore } from '../stores/dbStore'
import { generateId, formatRelative, debounce } from '../lib/utils'
import { type Document, type Project } from '../types'

function EditorToolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null
  const btn = (active: boolean, onClick: () => void, icon: React.ReactNode) => (
    <button onClick={onClick}
      className="p-1.5 rounded transition-colors"
      style={{ background: active ? 'var(--color-surface-hover)' : 'transparent', color: active ? 'var(--color-brand)' : 'var(--color-text-muted)' }}>
      {icon}
    </button>
  )
  return (
    <div className="flex items-center gap-0.5 px-3 py-2 border-b" style={{ borderColor: 'var(--color-surface-border)' }}>
      {btn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), <Bold size={13} />)}
      {btn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), <Italic size={13} />)}
      {btn(editor.isActive('code'), () => editor.chain().focus().toggleCode().run(), <Code size={13} />)}
      {btn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), <List size={13} />)}
      {btn(editor.isActive('codeBlock'), () => editor.chain().focus().toggleCodeBlock().run(),
        <span className="text-xs font-mono">{'</>'}</span>)}
      <div className="w-px h-4 mx-1" style={{ background: 'var(--color-surface-border)' }} />
      {btn(editor.isActive('heading', { level: 1 }), () => editor.chain().focus().toggleHeading({ level: 1 }).run(), <span className="text-xs font-bold">H1</span>)}
      {btn(editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), <span className="text-xs font-bold">H2</span>)}
      {btn(editor.isActive('heading', { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), <span className="text-xs font-bold">H3</span>)}
    </div>
  )
}

function DocEditor({ doc }: { doc: Document }) {
  const { bump } = useDbStore()
  const save = debounce((content: string) => {
    run('UPDATE documents SET content = ?, updated_at = ? WHERE id = ?', [content, new Date().toISOString(), doc.id])
    bump()
  }, 800)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Start writing your document…' }),
    ],
    content: (() => {
      try { return doc.content ? JSON.parse(doc.content) : '' } catch { return doc.content || '' }
    })(),
    onUpdate: ({ editor }) => save(JSON.stringify(editor.getJSON())),
  })

  return (
    <div className="flex-1 flex flex-col overflow-hidden rounded-xl border"
      style={{ background: 'var(--color-surface-elevated)', borderColor: 'var(--color-surface-border)' }}>
      <EditorToolbar editor={editor} />
      <div className="flex-1 overflow-y-auto p-6">
        <EditorContent editor={editor} className="max-w-3xl" style={{ color: 'var(--color-text-primary)' }} />
      </div>
    </div>
  )
}

export function DocumentsPage() {
  const { id: projectId } = useParams<{ id: string }>()
  const { version, bump } = useDbStore()
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')

  const project = query<Project>('SELECT * FROM projects WHERE id = ?', [projectId])[0]
  const docs = query<Document>('SELECT * FROM documents WHERE project_id = ? ORDER BY updated_at DESC', [projectId])
  const selectedDoc = selectedDocId ? docs.find(d => d.id === selectedDocId) ?? docs[0] : docs[0]

  const addDoc = () => {
    const id = generateId()
    const now = new Date().toISOString()
    run('INSERT INTO documents VALUES (?,?,?,?,?,?,?)', [id, projectId, 'Untitled', '', null, now, now])
    setSelectedDocId(id)
    bump()
  }

  const deleteDoc = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    run('DELETE FROM documents WHERE id = ?', [id])
    if (selectedDocId === id) setSelectedDocId(null)
    bump()
  }

  const saveTitle = () => {
    if (titleDraft.trim() && selectedDoc) {
      run('UPDATE documents SET title = ? WHERE id = ?', [titleDraft.trim(), selectedDoc.id])
      bump()
    }
    setEditingTitle(false)
  }

  if (!project) return null

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title={`${project.name} — Documents`} actions={
        <button onClick={addDoc} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-medium"
          style={{ background: 'var(--color-brand)', color: 'var(--color-text-inverse)' }}>
          <Plus size={14} /> New Doc
        </button>
      } />
      <div className="flex-1 overflow-hidden flex">
        {/* Document tree */}
        <div className="w-56 border-r overflow-y-auto py-2"
          style={{ borderColor: 'var(--color-surface-border)', background: 'var(--color-surface-elevated)' }}>
          {docs.length === 0 && (
            <div className="px-4 py-8 text-center">
              <FileText size={24} className="mx-auto mb-2" style={{ color: 'var(--color-brand)' }} />
              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>No documents</div>
            </div>
          )}
          {docs.map(doc => (
            <div key={doc.id}
              onClick={() => setSelectedDocId(doc.id)}
              className="group flex items-center gap-2 px-4 py-2 cursor-pointer transition-colors"
              style={{
                background: selectedDoc?.id === doc.id ? 'var(--color-surface-hover)' : 'transparent',
                borderLeft: selectedDoc?.id === doc.id ? '2px solid var(--color-accent-teal)' : '2px solid transparent',
              }}>
              <FileText size={13} className="shrink-0" style={{ color: 'var(--color-accent-teal)' }} />
              <div className="flex-1 min-w-0">
                <div className="text-xs truncate" style={{ color: 'var(--color-text-primary)' }}>{doc.title}</div>
                <div className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{formatRelative(doc.updated_at)}</div>
              </div>
              <button onClick={e => deleteDoc(doc.id, e)}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded">
                <Trash2 size={11} style={{ color: 'var(--color-status-blocked)' }} />
              </button>
            </div>
          ))}
        </div>

        {/* Editor */}
        <div className="flex-1 flex flex-col overflow-hidden p-4">
          {selectedDoc ? (
            <>
              <div className="mb-3">
                {editingTitle ? (
                  <input value={titleDraft} onChange={e => setTitleDraft(e.target.value)}
                    onBlur={saveTitle} onKeyDown={e => e.key === 'Enter' && saveTitle()}
                    autoFocus className="text-xl font-semibold bg-transparent outline-none w-full"
                    style={{ color: 'var(--color-text-primary)' }} />
                ) : (
                  <h1 className="text-xl font-semibold cursor-text"
                    style={{ color: 'var(--color-text-primary)' }}
                    onClick={() => { setTitleDraft(selectedDoc.title); setEditingTitle(true) }}>
                    {selectedDoc.title}
                  </h1>
                )}
              </div>
              <DocEditor key={selectedDoc.id} doc={selectedDoc} />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <FileText size={40} style={{ color: 'var(--color-brand)' }} />
              <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Select or create a document</div>
              <button onClick={addDoc} className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'var(--color-brand)', color: 'var(--color-text-inverse)' }}>New Document</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
