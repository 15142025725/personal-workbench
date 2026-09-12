import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, ExternalLink } from 'lucide-react'
import { linksApi, type Link } from '../../api/links'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Input, Textarea } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { EmptyState } from '../../components/ui/EmptyState'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'

const categoryLabels: Record<string, string> = {
  work: '工作工具',
  tools: '常用工具',
  reference: '参考资料',
  social: '社交',
}

const categoryOptions = [
  { label: '工作工具', value: 'work' },
  { label: '常用工具', value: 'tools' },
  { label: '参考资料', value: 'reference' },
  { label: '社交', value: 'social' },
]

function getFavicon(url: string) {
  try {
    const domain = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
  } catch {
    return ''
  }
}

export default function QuickLinks() {
  const [links, setLinks] = useState<Link[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Link | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [form, setForm] = useState({ title: '', url: '', description: '', category: 'work' })

  const load = async () => {
    try {
      setLinks(await linksApi.list())
    } catch { } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.url.trim()) return
    if (editing) {
      await linksApi.update(editing.id, form)
    } else {
      await linksApi.create(form)
    }
    setFormOpen(false)
    setEditing(null)
    setForm({ title: '', url: '', description: '', category: 'work' })
    load()
  }

  const openEdit = (link: Link) => {
    setEditing(link)
    setForm({ title: link.title, url: link.url, description: link.description, category: link.category })
    setFormOpen(true)
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ title: '', url: '', description: '', category: 'work' })
    setFormOpen(true)
  }

  const categories = Object.keys(categoryLabels)
  const grouped = categories.map((cat) => ({
    category: cat,
    links: links.filter((l) => l.category === cat),
  }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">快捷入口</h1>
        <Button size="sm" onClick={openCreate}>
          <Plus size={16} className="mr-1" />添加链接
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-text-muted text-sm">加载中...</div>
      ) : links.length === 0 ? (
        <EmptyState
          icon={<Plus size={32} />}
          title="暂无快捷链接"
          description="添加常用网站和工具的快速入口"
          action={<Button size="sm" onClick={openCreate}>添加第一个链接</Button>}
        />
      ) : (
        <div className="space-y-6">
          {grouped.map(({ category, links: catLinks }) =>
            catLinks.length > 0 ? (
              <div key={category}>
                <h3 className="text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">
                  {categoryLabels[category]} ({catLinks.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {catLinks.map((link) => (
                    <div
                      key={link.id}
                      className="group card hover:shadow-card-hover transition-all flex items-center gap-3"
                    >
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 flex-1 min-w-0"
                      >
                        <img
                          src={getFavicon(link.url)}
                          alt=""
                          className="w-8 h-8 rounded-lg bg-bg shrink-0"
                          onError={(e) => { e.currentTarget.style.display = 'none' }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{link.title}</p>
                          {link.description && (
                            <p className="text-xs text-text-muted truncate">{link.description}</p>
                          )}
                        </div>
                        <ExternalLink size={14} className="text-text-muted shrink-0" />
                      </a>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(link)} className="p-1 rounded hover:bg-bg text-text-muted hover:text-text-primary">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteId(link.id)} className="p-1 rounded hover:bg-bg text-text-muted hover:text-danger">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null
          )}
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? '编辑链接' : '添加链接'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">标题</label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="链接名称" autoFocus />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">URL</label>
            <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">描述（选填）</label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="简要描述..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">分类</label>
            <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={categoryOptions} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>取消</Button>
            <Button type="submit">{editing ? '保存' : '添加'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => { if (deleteId) { await linksApi.remove(deleteId); setDeleteId(null); load() } }}
        title="删除链接"
        message="确认删除此快捷链接？"
      />
    </div>
  )
}
