'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

interface DealRecord {
  id: string
  vendorName: string
  projectTitle: string
  quotedRate: number
  agreedPrice: number
  savingsPct: number
  date: string
}

interface Company {
  name: string
  address: string
  city: string
  email: string
}

const EMPTY_COMPANY: Company = { name: '', address: '', city: '', email: '' }

export default function Home() {
  const router = useRouter()
  const [form, setForm] = useState({ vendorName: '', projectTitle: '', quotedRate: '', description: '' })
  const [error, setError] = useState('')
  const [history, setHistory] = useState<DealRecord[]>([])
  const [company, setCompany] = useState<Company>(EMPTY_COMPANY)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('pitchflow_history')
      if (raw) setHistory(JSON.parse(raw))
      const co = localStorage.getItem('pitchflow_company')
      if (co) setCompany(JSON.parse(co))
    } catch {}
  }, [])

  const totalSaved = history.reduce((s, h) => s + (h.quotedRate - h.agreedPrice), 0)
  const avgPct = history.length ? history.reduce((s, h) => s + h.savingsPct, 0) / history.length : 0

  const saveCompany = () => {
    localStorage.setItem('pitchflow_company', JSON.stringify(company))
    setSettingsSaved(true)
    setTimeout(() => setSettingsSaved(false), 2000)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.vendorName.trim() || !form.projectTitle.trim() || !form.quotedRate) {
      setError('Vendor name, project title, and quoted rate are required.')
      return
    }
    const rate = parseFloat(form.quotedRate)
    if (isNaN(rate) || rate <= 0) {
      setError('Enter a valid quoted rate greater than 0.')
      return
    }
    setError('')
    const p = new URLSearchParams({
      vendorName: form.vendorName.trim(),
      projectTitle: form.projectTitle.trim(),
      quotedRate: rate.toString(),
      ...(form.description.trim() && { description: form.description.trim() }),
      ...(company.name && { companyName: company.name }),
      ...(company.address && { companyAddress: company.address }),
      ...(company.city && { companyCity: company.city }),
      ...(company.email && { companyEmail: company.email }),
    })
    router.push(`/pitch?${p}`)
  }

  return (
    <div className={styles.page}>
      <div className={styles.gridBg} />
      <div className={styles.glowOrb} />

      <header className={styles.header}>
        <div className={styles.logo}>
          <div className={styles.logoMark}>P</div>
          <span>PitchFlow</span>
        </div>
        <button
          className={styles.settingsBtn}
          onClick={() => setSettingsOpen(v => !v)}
          title="Company Settings"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          Company
        </button>
      </header>

      {settingsOpen && (
        <div className={styles.settingsPanel}>
          <div className={styles.settingsPanelInner}>
            <div className={styles.settingsHeader}>
              <div>
                <div className={styles.settingsTitle}>Your Company Details</div>
                <div className={styles.settingsSub}>This appears on every invoice you generate.</div>
              </div>
              <button className={styles.settingsClose} onClick={() => setSettingsOpen(false)}>✕</button>
            </div>
            <div className={styles.settingsFields}>
              <div className={styles.settingsRow}>
                <div className={styles.field}>
                  <label>Company Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Bright Wave Digital"
                    value={company.name}
                    onChange={e => setCompany(c => ({ ...c, name: e.target.value }))}
                  />
                </div>
                <div className={styles.field}>
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="e.g. billing@yourcompany.com"
                    value={company.email}
                    onChange={e => setCompany(c => ({ ...c, email: e.target.value }))}
                  />
                </div>
              </div>
              <div className={styles.settingsRow}>
                <div className={styles.field}>
                  <label>Street Address</label>
                  <input
                    type="text"
                    placeholder="e.g. 123 Market Street, Suite 400"
                    value={company.address}
                    onChange={e => setCompany(c => ({ ...c, address: e.target.value }))}
                  />
                </div>
                <div className={styles.field}>
                  <label>City, State, ZIP</label>
                  <input
                    type="text"
                    placeholder="e.g. San Francisco, CA 94105"
                    value={company.city}
                    onChange={e => setCompany(c => ({ ...c, city: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className={styles.settingsFooter}>
              <button className={styles.saveCompanyBtn} onClick={saveCompany}>
                {settingsSaved ? '✓ Saved' : 'Save Company Info'}
              </button>
              {settingsSaved && <span className={styles.savedNotice}>Saved to this browser</span>}
            </div>
          </div>
        </div>
      )}

      <main className={styles.main}>
        <div className={styles.hero}>
          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeDot} />
            AI-Powered Vendor Negotiation
          </div>
          <h1 className={styles.heroTitle}>
            Negotiate smarter,<br />
            <span className={styles.heroGradient}>close faster.</span>
          </h1>
          <p className={styles.heroSub}>
            Submit a vendor proposal and let our AI fight for the best rate automatically — no back-and-forth emails, no guesswork.
          </p>
        </div>

        {!company.name && (
          <div className={styles.setupHint}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
            </svg>
            Set up your company info so it appears correctly on invoices —{' '}
            <button className={styles.setupHintLink} onClick={() => setSettingsOpen(true)}>
              click Company above
            </button>
          </div>
        )}

        <div className={styles.formCard}>
          <div className={styles.formCardHeader}>
            <h2 className={styles.formTitle}>New Proposal</h2>
            <p className={styles.formSub}>Takes 30 seconds. Our AI does the rest.</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.row}>
              <div className={styles.field}>
                <label>Vendor Name</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Creative Studio"
                  value={form.vendorName}
                  onChange={e => setForm(f => ({ ...f, vendorName: e.target.value }))}
                  autoComplete="off"
                />
              </div>
              <div className={styles.field}>
                <label>Project Title</label>
                <input
                  type="text"
                  placeholder="e.g. Brand Redesign Q3"
                  value={form.projectTitle}
                  onChange={e => setForm(f => ({ ...f, projectTitle: e.target.value }))}
                  autoComplete="off"
                />
              </div>
            </div>

            <div className={styles.field}>
              <label>Quoted Rate (USD)</label>
              <div className={styles.rateInput}>
                <span className={styles.rateDollar}>$</span>
                <input
                  type="number"
                  placeholder="0"
                  min="1"
                  value={form.quotedRate}
                  onChange={e => setForm(f => ({ ...f, quotedRate: e.target.value }))}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label>
                Description
                <span className={styles.optional}> — optional</span>
              </label>
              <textarea
                placeholder="Brief overview of project scope..."
                rows={3}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>

            {error && <div className={styles.errorBox}>{error}</div>}

            <button type="submit" className={styles.submitBtn}>
              Start Negotiation
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </form>
        </div>

        {history.length > 0 && (
          <div className={styles.historySection}>
            <div className={styles.statsRow}>
              <div className={styles.statBlock}>
                <div className={styles.statNum}>{history.length}</div>
                <div className={styles.statLbl}>Deals Closed</div>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statBlock}>
                <div className={styles.statNum}>${totalSaved.toLocaleString()}</div>
                <div className={styles.statLbl}>Total Saved</div>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statBlock}>
                <div className={styles.statNum}>{avgPct.toFixed(1)}%</div>
                <div className={styles.statLbl}>Avg Discount</div>
              </div>
            </div>

            <div className={styles.historyLabel}>Recent Negotiations</div>
            <div className={styles.historyGrid}>
              {history.slice(0, 6).map(h => (
                <div key={h.id} className={styles.historyCard}>
                  <div className={styles.historyCardTop}>
                    <span className={styles.historyVendor}>{h.vendorName}</span>
                    <span className={styles.historySavingBadge}>−{h.savingsPct.toFixed(0)}%</span>
                  </div>
                  <div className={styles.historyProject}>{h.projectTitle}</div>
                  <div className={styles.historyPrices}>
                    <span className={styles.historyQuoted}>${h.quotedRate.toLocaleString()}</span>
                    <span className={styles.historyArrow}>→</span>
                    <span className={styles.historyAgreed}>${h.agreedPrice.toLocaleString()}</span>
                  </div>
                  <div className={styles.historyDate}>
                    {new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
