import { useEffect, useState } from 'react'
import {
  getWebsiteCustomization,
  saveCustomizationDraft,
  publishCustomization,
  restoreCustomization,
  type WebsiteCustomization,
} from '@/core'
import styles from '../DeveloperSuperAdminScreen.module.css'

interface CustomizationStudioTabProps {
  onNotify: (msg: string) => void
  onBroadcastCustomization?: (customization: WebsiteCustomization) => void
}

export function CustomizationStudioTab({ onNotify, onBroadcastCustomization }: CustomizationStudioTabProps) {
  const [data, setData] = useState<WebsiteCustomization | null>(null)
  const [form, setForm] = useState<WebsiteCustomization | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [activeSubTab, setActiveSubTab] = useState<'branding' | 'hero' | 'navigation' | 'history'>('branding')

  useEffect(() => {
    let mounted = true
    getWebsiteCustomization()
      .then((res) => {
        if (mounted) {
          setData(res)
          setForm(JSON.parse(JSON.stringify(res)))
          setLoading(false)
        }
      })
      .catch((err) => {
        if (mounted) {
          setLoading(false)
          onNotify(`Error loading studio: ${err.message}`)
        }
      })
    return () => {
      mounted = false
    }
  }, [onNotify])

  async function handleSaveDraft() {
    if (!form) return
    try {
      setSaving(true)
      const res = await saveCustomizationDraft(form)
      setData(res)
      onNotify('Draft configuration saved successfully.')
    } catch (err: any) {
      onNotify(`Failed to save draft: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  async function handlePublish() {
    if (!form) return
    try {
      setPublishing(true)
      const res = await publishCustomization(form)
      setData(res)
      setForm(JSON.parse(JSON.stringify(res)))
      if (onBroadcastCustomization) {
        onBroadcastCustomization(res)
      }
      onNotify(`Live Website updated! Version ${res.version} is now active.`)
    } catch (err: any) {
      onNotify(`Failed to publish: ${err.message}`)
    } finally {
      setPublishing(false)
    }
  }

  async function handleRestoreVersion(version: number) {
    try {
      const res = await restoreCustomization(version)
      setData(res)
      setForm(JSON.parse(JSON.stringify(res)))
      if (onBroadcastCustomization) {
        onBroadcastCustomization(res)
      }
      onNotify(`Restored website version ${version} successfully.`)
    } catch (err: any) {
      onNotify(`Failed to restore version: ${err.message}`)
    }
  }

  if (loading || !form) {
    return <div style={{ color: 'var(--color-text-muted)', padding: '40px 0' }}>Loading customization engine...</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner & Publish Controls */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={styles.glowBadge}>V{data?.version || 1} LIVE</span>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                Published: {data?.published_at ? new Date(data.published_at).toLocaleString() : 'Just now'}
              </span>
            </div>
            <h2 className={styles.cardTitle} style={{ marginTop: '4px' }}>
              Website Customization Studio & Design System
            </h2>
            <div className={styles.cardSubtitle}>
              Dynamically modify branding, visual colors, typography, hero banners, and navigation in real time.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className={styles.actionBtn} onClick={handleSaveDraft} disabled={saving}>
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
              onClick={handlePublish}
              disabled={publishing}
            >
              {publishing ? 'Publishing...' : '🚀 Publish Changes Live'}
            </button>
          </div>
        </div>

        {/* Sub Navigation */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
          {(['branding', 'hero', 'navigation', 'history'] as const).map((tab) => (
            <button
              key={tab}
              className={`${styles.actionBtn} ${activeSubTab === tab ? styles.actionBtnPrimary : ''}`}
              onClick={() => setActiveSubTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Studio Work Area: Split Editor & Live Preview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(380px, 1.2fr) minmax(360px, 1.4fr)', gap: '20px', alignItems: 'start' }}>
        {/* Left: Configuration Form */}
        <div className={styles.card}>
          {activeSubTab === 'branding' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 className={styles.cardTitle}>Brand Identity & Chromatic Tokens</h3>

              <div>
                <label className={styles.label}>Platform Name</label>
                <input
                  type="text"
                  className={styles.input}
                  value={form.brand_name}
                  onChange={(e) => setForm({ ...form, brand_name: e.target.value })}
                />
              </div>

              <div>
                <label className={styles.label}>Institutional Tagline</label>
                <input
                  type="text"
                  className={styles.input}
                  value={form.tagline}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className={styles.label}>Primary Color Token</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="color"
                      value={form.primary_color}
                      onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                      style={{ width: '38px', height: '36px', padding: 0, border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                    />
                    <input
                      type="text"
                      className={styles.input}
                      value={form.primary_color}
                      onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className={styles.label}>Secondary Accent</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="color"
                      value={form.secondary_color}
                      onChange={(e) => setForm({ ...form, secondary_color: e.target.value })}
                      style={{ width: '38px', height: '36px', padding: 0, border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                    />
                    <input
                      type="text"
                      className={styles.input}
                      value={form.secondary_color}
                      onChange={(e) => setForm({ ...form, secondary_color: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className={styles.label}>Typography Engine (Font Family)</label>
                <select
                  className={styles.input}
                  value={form.font_family}
                  onChange={(e) => setForm({ ...form, font_family: e.target.value })}
                >
                  <option value="Inter, system-ui, sans-serif">Inter (Modern Clean UI)</option>
                  <option value="'Plus Jakarta Sans', sans-serif">Plus Jakarta Sans (Futuristic)</option>
                  <option value="system-ui, -apple-system, sans-serif">System Native Stack</option>
                  <option value="'Roboto', sans-serif">Material Roboto</option>
                </select>
              </div>

              <div>
                <label className={styles.label}>Brand Logo Glyph / Emoji</label>
                <input
                  type="text"
                  className={styles.input}
                  value={form.logo_url}
                  onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                  placeholder="⚡ or /logo.svg"
                />
              </div>
            </div>
          )}

          {activeSubTab === 'hero' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 className={styles.cardTitle}>Hero & Broadcast Content</h3>

              <div>
                <label className={styles.label}>Hero Display Title</label>
                <input
                  type="text"
                  className={styles.input}
                  value={form.hero_title}
                  onChange={(e) => setForm({ ...form, hero_title: e.target.value })}
                />
              </div>

              <div>
                <label className={styles.label}>Hero Subtitle Paragraph</label>
                <textarea
                  className={styles.input}
                  rows={3}
                  value={form.hero_subtitle}
                  onChange={(e) => setForm({ ...form, hero_subtitle: e.target.value })}
                />
              </div>

              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label className={styles.label} style={{ margin: 0 }}>Global Banner Alert Bar</label>
                  <input
                    type="checkbox"
                    checked={form.banner_alert_active}
                    onChange={(e) => setForm({ ...form, banner_alert_active: e.target.checked })}
                  />
                </div>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. 📢 Campus power grid maintenance scheduled 10 PM tonight."
                  value={form.banner_alert_text}
                  onChange={(e) => setForm({ ...form, banner_alert_text: e.target.value })}
                />
              </div>

              <div>
                <label className={styles.label}>Footer Copyright & Institutional Attributions</label>
                <input
                  type="text"
                  className={styles.input}
                  value={form.footer_copyright}
                  onChange={(e) => setForm({ ...form, footer_copyright: e.target.value })}
                />
              </div>
            </div>
          )}

          {activeSubTab === 'navigation' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 className={styles.cardTitle}>Global Navigation Architecture</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {form.nav_links.map((link, idx) => (
                  <div
                    key={link.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      background: 'var(--color-surface-muted)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={link.visible}
                      onChange={(e) => {
                        const nextLinks = [...form.nav_links]
                        nextLinks[idx].visible = e.target.checked
                        setForm({ ...form, nav_links: nextLinks })
                      }}
                    />
                    <input
                      type="text"
                      className={styles.input}
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                      value={link.label}
                      onChange={(e) => {
                        const nextLinks = [...form.nav_links]
                        nextLinks[idx].label = e.target.value
                        setForm({ ...form, nav_links: nextLinks })
                      }}
                    />
                    <code style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{link.path}</code>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSubTab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 className={styles.cardTitle}>Version Snapshots & Rollback Archive</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(form.history || []).length === 0 ? (
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>No previous versions recorded yet.</div>
                ) : (
                  (form.history || []).map((h) => (
                    <div
                      key={h.version}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: 'var(--color-surface-muted)',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700 }}>Version {h.version}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          {new Date(h.published_at).toLocaleString()}
                        </div>
                      </div>
                      <button
                        className={styles.actionBtn}
                        style={{ fontSize: '11px' }}
                        onClick={() => handleRestoreVersion(h.version)}
                      >
                        Restore V{h.version}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Interactive Live Preview Container */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h3 className={styles.cardTitle}>Live Client Canvas Preview</h3>
              <div className={styles.cardSubtitle}>Real-time simulation of live user rendering</div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                className={`${styles.actionBtn} ${previewMode === 'desktop' ? styles.actionBtnPrimary : ''}`}
                style={{ padding: '3px 8px', fontSize: '11px' }}
                onClick={() => setPreviewMode('desktop')}
              >
                Desktop
              </button>
              <button
                className={`${styles.actionBtn} ${previewMode === 'mobile' ? styles.actionBtnPrimary : ''}`}
                style={{ padding: '3px 8px', fontSize: '11px' }}
                onClick={() => setPreviewMode('mobile')}
              >
                Mobile
              </button>
            </div>
          </div>

          {/* Simulated Browser Frame */}
          <div
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-bg)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-md)',
              maxWidth: previewMode === 'mobile' ? '360px' : '100%',
              margin: '0 auto',
              transition: 'max-width 0.3s ease',
            }}
          >
            {/* Browser Header Bar */}
            <div style={{ background: 'var(--color-surface-muted)', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }} />
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B' }} />
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
              <div style={{ flex: 1, textAlign: 'center', fontSize: '10px', color: 'var(--color-text-muted)', background: 'var(--color-surface)', borderRadius: '4px', padding: '2px 0' }}>
                https://campus-os.fixit.internal/tracks/fixit
              </div>
            </div>

            {/* Banner Alert Preview */}
            {form.banner_alert_active && form.banner_alert_text && (
              <div style={{ background: '#FEF3C7', color: '#92400E', padding: '6px 12px', fontSize: '11px', textAlign: 'center', fontWeight: 600 }}>
                {form.banner_alert_text}
              </div>
            )}

            {/* Simulated Nav */}
            <div style={{ padding: '10px 16px', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>{form.logo_url || '⚡'}</span>
                <span style={{ fontWeight: 800, fontSize: '14px', color: form.primary_color }}>
                  {form.brand_name}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                {form.nav_links.filter((l) => l.visible).slice(0, 3).map((l) => (
                  <span key={l.id}>{l.label}</span>
                ))}
              </div>
            </div>

            {/* Simulated Hero */}
            <div style={{ padding: '32px 20px', textAlign: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text)', margin: '0 0 8px 0' }}>
                {form.hero_title}
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '0 auto 16px auto', maxWidth: '400px' }}>
                {form.hero_subtitle}
              </p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <button
                  style={{
                    background: form.primary_color,
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Raise Complaint Now
                </button>
                <button
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text)',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  View Heatmap
                </button>
              </div>
            </div>

            {/* Simulated Footer */}
            <div style={{ padding: '12px 16px', background: 'var(--color-surface-muted)', borderTop: '1px solid var(--color-border)', textAlign: 'center', fontSize: '11px', color: 'var(--color-text-muted)' }}>
              {form.footer_copyright}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
