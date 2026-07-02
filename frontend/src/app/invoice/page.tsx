'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import styles from './page.module.css'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002'

function InvoiceContent() {
  const router = useRouter()
  const params = useSearchParams()
  const vendorName = params.get('vendorName') || ''
  const projectTitle = params.get('projectTitle') || ''
  const agreedPrice = parseFloat(params.get('agreedPrice') || '0')
  const quotedRate = parseFloat(params.get('quotedRate') || '0')
  const sessionId = params.get('sessionId') || ''
  const companyName = params.get('companyName') || ''
  const companyAddress = params.get('companyAddress') || ''
  const companyCity = params.get('companyCity') || ''
  const companyEmail = params.get('companyEmail') || ''

  const [invoiceId, setInvoiceId] = useState('')
  const [dateIssued, setDateIssued] = useState('')

  const tax = agreedPrice * 0.08
  const total = agreedPrice + tax
  const saved = quotedRate > 0 ? quotedRate - agreedPrice : 0
  const savedPct = quotedRate > 0 ? (saved / quotedRate) * 100 : 0
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  useEffect(() => {
    const fallbackId = `INV-${Date.now().toString().slice(-6)}`
    const fallbackDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

    const fetchInvoice = async () => {
      try {
        const res = await fetch(`${API}/api/engagement/invoice/${sessionId}`)
        const data = await res.json()
        if (data.invoice_id) {
          setInvoiceId(data.invoice_id)
          setDateIssued(data.date_issued || fallbackDate)
          return
        }
      } catch {}
      setInvoiceId(fallbackId)
      setDateIssued(fallbackDate)
    }

    if (sessionId) {
      fetchInvoice()
    } else {
      setInvoiceId(fallbackId)
      setDateIssued(fallbackDate)
    }
  }, [sessionId])

  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className={styles.page}>
      <div className={styles.gridBg} />

      <header className={styles.topbar}>
        <button className={styles.backBtn} onClick={() => router.push('/')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          New Negotiation
        </button>
        <div className={styles.topLogo}>PitchFlow</div>
        <button className={styles.printBtn} onClick={() => window.print()}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          Print / Download
        </button>
      </header>

      {saved > 0 && (
        <div className={styles.savingsBanner}>
          <span className={styles.savingsEmoji}>🎉</span>
          <span>
            Negotiation complete — you saved{' '}
            <strong className={styles.savingsAmt}>${saved.toLocaleString()}</strong>{' '}
            ({savedPct.toFixed(1)}% below the original ${quotedRate.toLocaleString()} quote)
          </span>
        </div>
      )}

      <main className={styles.main}>
        <div className={styles.invoiceCard}>
          {/* Invoice Header */}
          <div className={styles.invoiceHeader}>
            <div className={styles.companyBlock}>
              <div className={styles.companyLogo}>
                {companyName ? companyName.slice(0, 2).toUpperCase() : '?'}
              </div>
              <div>
                <div className={styles.companyName}>
                  {companyName || <span className={styles.missingInfo}>Your company name</span>}
                </div>
                {companyAddress && <div className={styles.companyMeta}>{companyAddress}</div>}
                {companyCity && <div className={styles.companyMeta}>{companyCity}</div>}
                {companyEmail && <div className={styles.companyMeta}>{companyEmail}</div>}
                {!companyName && !companyAddress && !companyCity && !companyEmail && (
                  <div className={styles.missingInfoHint}>
                    Set your company info on the home page via the Company button
                  </div>
                )}
              </div>
            </div>
            <div className={styles.invoiceIdBlock}>
              <div className={styles.invoiceWordmark}>INVOICE</div>
              <div className={styles.invoiceNum}>{invoiceId}</div>
            </div>
          </div>

          <div className={styles.divider} />

          {/* Meta Row */}
          <div className={styles.metaRow}>
            <div className={styles.metaItem}>
              <div className={styles.metaKey}>Date Issued</div>
              <div className={styles.metaVal}>{dateIssued}</div>
            </div>
            <div className={styles.metaItem}>
              <div className={styles.metaKey}>Due Date</div>
              <div className={styles.metaVal}>{dueDate}</div>
            </div>
            <div className={styles.metaItem}>
              <div className={styles.metaKey}>Status</div>
              <div className={styles.issuedBadge}>Issued</div>
            </div>
          </div>

          <div className={styles.divider} />

          {/* Bill To */}
          <div className={styles.billTo}>
            <div className={styles.billLabel}>Bill To</div>
            <div className={styles.billName}>{vendorName}</div>
          </div>

          {/* Line Items */}
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th} style={{ textAlign: 'left' }}>Description</th>
                <th className={styles.th} style={{ textAlign: 'center' }}>Qty</th>
                <th className={styles.th} style={{ textAlign: 'right' }}>Unit Price</th>
                <th className={styles.th} style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={styles.td}>
                  <div className={styles.itemName}>{projectTitle}</div>
                  <div className={styles.itemNote}>Professional services — AI-negotiated rate</div>
                </td>
                <td className={styles.td} style={{ textAlign: 'center', color: '#475569' }}>1</td>
                <td className={styles.td} style={{ textAlign: 'right' }}>${fmt(agreedPrice)}</td>
                <td className={styles.td} style={{ textAlign: 'right', fontWeight: 700 }}>${fmt(agreedPrice)}</td>
              </tr>
            </tbody>
          </table>

          {/* Totals */}
          <div className={styles.totals}>
            <div className={styles.totalLine}>
              <span>Subtotal</span>
              <span>${fmt(agreedPrice)}</span>
            </div>
            <div className={styles.totalLine}>
              <span>Tax (8%)</span>
              <span>${fmt(tax)}</span>
            </div>
            <div className={styles.divider} style={{ margin: '8px 0' }} />
            <div className={`${styles.totalLine} ${styles.grandLine}`}>
              <span>Total Due</span>
              <span>${fmt(total)}</span>
            </div>
            {saved > 0 && (
              <div className={`${styles.totalLine} ${styles.savedLine}`}>
                <span>AI Savings</span>
                <span>−${fmt(saved)}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={styles.invoiceFooter}>
            <span>Payment due within 30 days · Terms: 50% upfront, 50% on delivery</span>
            <span className={styles.footerPowered}>Powered by PitchFlow AI</span>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function InvoicePage() {
  return (
    <Suspense>
      <InvoiceContent />
    </Suspense>
  )
}
