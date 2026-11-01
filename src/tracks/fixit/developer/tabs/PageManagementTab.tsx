import { useEffect, useState } from 'react'
import {
  getDeveloperPages,
  createDeveloperPage,
  updateDeveloperPage,
  deleteDeveloperPage,
  type WebsitePage,
} from '@/core'
import styles from '../DeveloperSuperAdminScreen.module.css'

interface PageManagementTabProps {
  onNotify: (msg: string) => void
}

export function PageManagementTab({ onNotify }: PageManagementTabProps) {
  const [pages, setPages] = useState<WebsitePage[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingPage, setEditingPage] = useState<WebsitePage | null>(null)
  const [previewPage, setPreviewPage] = useState<WebsitePage | null>(null)

  const [newPage, setNewPage] = useState({
    title: '',
    slug: '',
    description: '',
    content: '',
    status: 'published' as const,
  })

  async function loadPages() {
    try {
      setLoading(true)
      const res = await getDeveloperPages()
      setPages(res.items || [])
    } catch (err: any) {
      onNotify(`Failed to load pages: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
    getDeveloperPages()
      .then((res) => {
        if (mounted) {
          setPages(res.items || [])
          setLoading(false)
        }
      })
      .catch((err) => {
        if (mounted) {
          setLoading(false)
          onNotify(`Failed to load pages: ${err.message}`)
        }
      })
    return () => {
      mounted = false
    }
  }, [onNotify])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newPage.title || !newPage.slug) {
      onNotify('Title and URL slug are required.')
      return
    }
    try {
      await createDeveloperPage(newPage)
      onNotify(`Page '${newPage.title}' created and published`)
      setIsCreateOpen(false)
      setNewPage({ title: '', slug: '', description: '', content: '', status: 'published' })
      loadPages()
    } catch (err: any) {
      onNotify(`Create page failed: ${err.message}`)
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!editingPage) return
    try {
      await updateDeveloperPage(editingPage.id, editingPage)
      onNotify(`Page '${editingPage.title}' updated.`)
      setEditingPage(null)
      loadPages()
    } catch (err: any) {
      onNotify(`Update page failed: ${err.message}`)
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`Delete page "${title}"?`)) return
    try {
      await deleteDeveloperPage(id)
      onNotify(`Page "${title}" deleted.`)
      loadPages()
    } catch (err: any) {
      onNotify(`Delete failed: ${err.message}`)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h2 className={styles.cardTitle}>Dynamic Web Page & Routing Engine</h2>
            <div className={styles.cardSubtitle}>
              Author, edit, and control visibility for campus documentation, FAQ, and policy pages
            </div>
          </div>
          <button className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} onClick={() => setIsCreateOpen(true)}>
            + Author New Page
          </button>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Page Title</th>
                <th>Route Slug</th>
                <th>SEO Description</th>
                <th>Status</th>
                <th>Lifetime Views</th>
                <th>Last Modified</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--color-text-muted)' }}>
                    Loading managed pages...
                  </td>
                </tr>
              ) : pages.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--color-text-muted)' }}>
                    No dynamic pages created yet.
                  </td>
                </tr>
              ) : (
                pages.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.title}</td>
                    <td>
                      <code style={{ fontSize: '11px', padding: '2px 6px', background: 'var(--color-surface-muted)', borderRadius: '4px' }}>
                        /{p.slug}
                      </code>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--color-text-muted)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.description || 'No meta description'}
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: p.status === 'published' ? 'rgba(16, 185, 129, 0.12)' : 'var(--color-surface-muted)',
                          color: p.status === 'published' ? '#10B981' : 'var(--color-text-muted)',
                        }}
                      >
                        {p.status.toUpperCase()}
                      </span>
                    </td>
                    <td>{p.views.toLocaleString()}</td>
                    <td style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      {new Date(p.updated_at).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          className={styles.actionBtn}
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                          onClick={() => setPreviewPage(p)}
                        >
                          Preview
                        </button>
                        <button
                          className={styles.actionBtn}
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                          onClick={() => setEditingPage({ ...p })}
                        >
                          Edit
                        </button>
                        <button
                          className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                          onClick={() => handleDelete(p.id, p.title)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Create New Custom Web Page</h3>
              <button style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }} onClick={() => setIsCreateOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className={styles.label}>Page Title</label>
                  <input
                    type="text"
                    className={styles.input}
                    required
                    placeholder="e.g. Campus Wi-Fi Setup Guidelines"
                    value={newPage.title}
                    onChange={(e) => setNewPage({ ...newPage, title: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })}
                  />
                </div>
                <div>
                  <label className={styles.label}>URL Route Slug</label>
                  <input
                    type="text"
                    className={styles.input}
                    required
                    value={newPage.slug}
                    onChange={(e) => setNewPage({ ...newPage, slug: e.target.value })}
                  />
                </div>
                <div>
                  <label className={styles.label}>SEO Meta Description</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={newPage.description}
                    onChange={(e) => setNewPage({ ...newPage, description: e.target.value })}
                  />
                </div>
                <div>
                  <label className={styles.label}>Page Content (Markdown / HTML)</label>
                  <textarea
                    className={styles.input}
                    rows={6}
                    value={newPage.content}
                    onChange={(e) => setNewPage({ ...newPage, content: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                <button type="button" className={styles.actionBtn} onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}>
                  Publish Page
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingPage && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Edit Page: {editingPage.title}</h3>
              <button style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }} onClick={() => setEditingPage(null)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdate}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className={styles.label}>Page Title</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={editingPage.title}
                    onChange={(e) => setEditingPage({ ...editingPage, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className={styles.label}>URL Slug</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={editingPage.slug}
                    onChange={(e) => setEditingPage({ ...editingPage, slug: e.target.value })}
                  />
                </div>
                <div>
                  <label className={styles.label}>Publication State</label>
                  <select
                    className={styles.input}
                    value={editingPage.status}
                    onChange={(e) => setEditingPage({ ...editingPage, status: e.target.value as any })}
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft / Unpublished</option>
                  </select>
                </div>
                <div>
                  <label className={styles.label}>Content Body</label>
                  <textarea
                    className={styles.input}
                    rows={8}
                    value={editingPage.content || ''}
                    onChange={(e) => setEditingPage({ ...editingPage, content: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                <button type="button" className={styles.actionBtn} onClick={() => setEditingPage(null)}>
                  Cancel
                </button>
                <button type="submit" className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}>
                  Save Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewPage && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox} style={{ maxWidth: '680px' }}>
            <div className={styles.cardHeader}>
              <div>
                <span className={styles.glowBadge}>LIVE PREVIEW: /{previewPage.slug}</span>
                <h3 className={styles.cardTitle} style={{ marginTop: '4px' }}>{previewPage.title}</h3>
              </div>
              <button style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }} onClick={() => setPreviewPage(null)}>
                ✕
              </button>
            </div>
            <div style={{ padding: '20px', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', lineHeight: 1.6, fontSize: '14px' }}>
              {previewPage.content || 'This page has no content yet.'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className={styles.actionBtn} onClick={() => setPreviewPage(null)}>
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
