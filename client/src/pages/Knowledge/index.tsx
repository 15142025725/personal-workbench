import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Search, BookOpen, ExternalLink } from 'lucide-react'
import { knowledgeApi, type KnowledgeItem } from '../../api/knowledge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Input, Textarea } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { cn } from '../../lib/utils'

const categoryLabels: Record<string, string> = {
  general: '通用',
  methodology: '方法论',
  template: '模板',
  learning: '学习笔记',
}

const categoryColors: Record<string, string> = {
  general: 'default',
  methodology: 'purple',
  template: 'blue',
  learning: 'success',
}

const categoryOptions = [
  { label: '通用', value: 'general' },
  { label: '方法论', value: 'methodology' },
  { label: '模板', value: 'template' },
  { label: '学习笔记', value: 'learning' },
]

function parseTags(tags: string): string[] {
  try { return JSON.parse(tags) } catch { return [] }
}

export default function Knowledge() {
  const [items, setItems] = useState<KnowledgeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<KnowledgeItem | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [form, setForm] = useState({ title: '', content: '', source: '', tags: '', category: 'general' })

  const load = async () => {
    try {
      const data = await knowledgeApi.list({
        search: search || undefined,
        category: filter !== 'all' ? filter : undefined
      })
      setItems(data)
    } catch { } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [search, filter])

  const selectedItem = items.find((i) => i.id === selectedId)

  const openCreate = () => {
    setEditing(null)
    setForm({ title: '', content: '', source: '', tags: '', category: 'general' })
    setModal(true)
  }

  const openEdit = (item: KnowledgeItem) => {
    setEditing(item)
    setForm({
      title: item.title,
      content: item.content,
      source: item.source,
      tags: parseTags(item.tags).join(', '),
      category: item.category
    })
    setModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    const data = {
      title: form.title,
      content: form.content,
      source: form.source,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      category: form.category
    }
    if (editing) {
      await knowledgeApi.update(editing.id, data)
    } else {
      await knowledgeApi.create(data)
    }
    setModal(false)
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">个人知识库</h1>
        <Button size="sm" onClick={openCreate}>
          <Plus size={16} className="mr-1" />新建
        </Button>
      </div>

      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索知识..." className="pl-9" />
        </div>
        <div className="flex gap-1">
          <button onClick={() => setFilter('all')} className={cn('px-3 py-1.5 rounded-full text-xs font-medium', filter === 'all' ? 'bg-accent text-white' : 'bg-bg text-text-secondary')}>全部</button>
          {categoryOptions.map((c) => (
            <button key={c.value} onClick={() => setFilter(c.value)} className={cn('px-3 py-1.5 rounded-full text-xs font-medium', filter === c.value ? 'bg-accent text-white' : 'bg-bg text-text-secondary')}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <div className="w-72 shrink-0 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          {loading ? (
            <div className="text-center py-8 text-text-muted text-sm">加载中...</div>
          ) : items.length === 0 ? (
            <EmptyState icon={<BookOpen size={32} />} title="暂无知识条目" />
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={cn(
                  'w-full text-left p-3 rounded-lg border transition-all',
                  selectedId === item.id ? 'border-accent bg-accent-light/30' : 'border-border bg-surface hover:bg-bg'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Badge color={categoryColors[item.category] as any}>{categoryLabels[item.category]}</Badge>
                  <span className="text-sm font-medium truncate flex-1">{item.title}</span>
                </div>
                <p className="text-xs text-text-muted truncate">{item.content || '暂无内容'}</p>
              </button>
            ))
          )}
        </div>

        <div className="flex-1">
          {selectedItem ? (
            <div className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge color={categoryColors[selectedItem.category] as any}>{categoryLabels[selectedItem.category]}</Badge>
                    <span className="text-xs text-text-muted">{selectedItem.updated_at.slice(0, 16)}</span>
                  </div>
                  <h2 className="text-lg font-bold mb-2">{selectedItem.title}</h2>
                  {selectedItem.source && (
                    <a href={selectedItem.source} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-accent hover:underline">
                      <ExternalLink size={12} />来源链接
                    </a>
                  )}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(selectedItem)} className="p-1.5 rounded hover:bg-bg text-text-muted hover:text-text-primary"><Pencil size={16} /></button>
                  <button onClick={() => setDeleteId(selectedItem.id)} className="p-1.5 rounded hover:bg-bg text-text-muted hover:text-danger"><Trash2 size={16} /></button>
                </div>
              </div>
              <div className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">{selectedItem.content || '暂无内容'}</div>
              {parseTags(selectedItem.tags).length > 0 && (
                <div className="flex gap-1.5 mt-4 pt-4 border-t border-border">
                  {parseTags(selectedItem.tags).map((tag, i) => (
                    <Badge key={i} color="default">{tag}</Badge>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <EmptyState icon={<BookOpen size={40} />} title="选择左侧条目查看" description="或点击右上角创建新条目" />
          )}
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? '编辑知识' : '新建知识'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">标题</label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="知识条目标题" autoFocus />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">内容</label>
            <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="详细内容（支持 Markdown）" className="min-h-[160px]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">来源链接</label>
              <Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">分类</label>
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={categoryOptions} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">标签（逗号分隔）</label>
            <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="运营, 方法论, 模板" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModal(false)}>取消</Button>
            <Button type="submit">{editing ? '保存' : '创建'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => { if (deleteId) { await knowledgeApi.remove(deleteId); setDeleteId(null); setSelectedId(null); load() } }}
        title="删除知识"
        message="确认删除此知识条目？"
      />
    </div>
  )
}
