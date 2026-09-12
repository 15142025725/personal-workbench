import { useState, useEffect } from 'react'
import { Plus, Pin, PinOff, Trash2, Search, Eye, Edit3 } from 'lucide-react'
import { notesApi, type Note } from '../../api/notes'
import { Button } from '../../components/ui/Button'
import { Input, Textarea } from '../../components/ui/Input'
import { EmptyState } from '../../components/ui/EmptyState'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { cn } from '../../lib/utils'

function parseTags(tags: string): string[] {
  try { return JSON.parse(tags) } catch { return [] }
}

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [draft, setDraft] = useState({ title: '', content: '' })

  const load = async () => {
    try {
      setNotes(await notesApi.list(search || undefined))
    } catch { } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [search])

  useEffect(() => {
    const note = notes.find((n) => n.id === selectedId)
    if (note) {
      setDraft({ title: note.title, content: note.content })
    } else {
      setDraft({ title: '', content: '' })
    }
  }, [selectedId])

  const selectedNote = notes.find((n) => n.id === selectedId)

  const handleNew = () => {
    setSelectedId(null)
    setDraft({ title: '', content: '' })
    setMode('edit')
  }

  const handleSave = async () => {
    if (!draft.title.trim()) return
    let result: Note
    if (selectedId) {
      result = await notesApi.update(selectedId, draft)
    } else {
      result = await notesApi.create(draft)
      setSelectedId(result.id)
    }
    load()
  }

  const handleTogglePin = async (id: number) => {
    await notesApi.togglePin(id)
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">笔记备忘</h1>
        <Button size="sm" onClick={handleNew}>
          <Plus size={16} className="mr-1" />新建笔记
        </Button>
      </div>

      <div className="flex gap-4 h-[calc(100vh-220px)]">
        <div className="w-72 shrink-0 flex flex-col gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索笔记..."
              className="pl-9"
            />
          </div>
          <div className="flex-1 overflow-y-auto space-y-1">
            {loading ? (
              <div className="text-center py-8 text-text-muted text-sm">加载中...</div>
            ) : notes.length === 0 ? (
              <EmptyState title="暂无笔记" description="创建第一条笔记" />
            ) : (
              notes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => { setSelectedId(note.id); setMode('edit') }}
                  className={cn(
                    'w-full text-left p-3 rounded-lg border transition-all',
                    selectedId === note.id
                      ? 'border-accent bg-accent-light/30'
                      : 'border-border bg-surface hover:bg-bg'
                  )}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    {note.pinned === 1 && <Pin size={12} className="text-accent shrink-0" />}
                    <span className="text-sm font-medium truncate flex-1">{note.title}</span>
                  </div>
                  <p className="text-xs text-text-muted truncate">{note.content || '空笔记'}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-xs text-text-muted">{note.updated_at.slice(5, 16)}</span>
                    <div className="flex gap-0.5">
                      <span onClick={(e) => { e.stopPropagation(); handleTogglePin(note.id) }} className="p-1 rounded hover:bg-border/30">
                        {note.pinned === 1 ? <PinOff size={12} /> : <Pin size={12} />}
                      </span>
                      <span onClick={(e) => { e.stopPropagation(); setDeleteId(note.id) }} className="p-1 rounded hover:bg-border/30 text-danger">
                        <Trash2 size={12} />
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="笔记标题..."
              className="flex-1 text-lg font-semibold bg-transparent outline-none border-b border-transparent focus:border-accent pb-1"
            />
            <div className="flex gap-2">
              <div className="flex gap-0.5 bg-bg rounded-lg p-0.5">
                <button onClick={() => setMode('edit')} className={cn('p-1.5 rounded-md', mode === 'edit' ? 'bg-surface shadow-sm' : 'text-text-muted')}>
                  <Edit3 size={16} />
                </button>
                <button onClick={() => setMode('preview')} className={cn('p-1.5 rounded-md', mode === 'preview' ? 'bg-surface shadow-sm' : 'text-text-muted')}>
                  <Eye size={16} />
                </button>
              </div>
              <Button size="sm" onClick={handleSave}>保存</Button>
            </div>
          </div>
          {mode === 'edit' ? (
            <textarea
              value={draft.content}
              onChange={(e) => setDraft({ ...draft, content: e.target.value })}
              placeholder="开始输入...（支持 Markdown）"
              className="flex-1 w-full p-4 rounded-xl border border-border bg-surface outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 resize-none text-sm leading-relaxed font-mono"
            />
          ) : (
            <div className="flex-1 p-4 rounded-xl border border-border bg-surface overflow-y-auto prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-sm font-sans">{draft.content || '暂无内容'}</pre>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (deleteId) {
            await notesApi.remove(deleteId)
            if (selectedId === deleteId) setSelectedId(null)
            setDeleteId(null)
            load()
          }
        }}
        title="删除笔记"
        message="确认删除此笔记？此操作不可撤销。"
      />
    </div>
  )
}
