'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import styles from './page.module.css'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002'

interface Message { role: 'user' | 'assistant'; content: string }

interface DealRecord {
  id: string
  vendorName: string
  projectTitle: string
  quotedRate: number
  agreedPrice: number
  savingsPct: number
  date: string
}

function PitchContent() {
  const router = useRouter()
  const params = useSearchParams()
  const vendorName = params.get('vendorName') || 'Vendor'
  const projectTitle = params.get('projectTitle') || 'Project'
  const quotedRate = parseFloat(params.get('quotedRate') || '0')
  const description = params.get('description') || ''
  const companyName = params.get('companyName') || ''
  const companyAddress = params.get('companyAddress') || ''
  const companyCity = params.get('companyCity') || ''
  const companyEmail = params.get('companyEmail') || ''

  const sessionId = useRef(`session-${Date.now()}`)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [dealDone, setDealDone] = useState(false)
  const [agreedPrice, setAgreedPrice] = useState<number | null>(null)
  const [history, setHistory] = useState<DealRecord[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)

  const targetPrice = quotedRate * 0.8
  const saved = agreedPrice ? quotedRate - agreedPrice : 0
  const savedPct = agreedPrice ? (saved / quotedRate) * 100 : 0

  useEffect(() => {
    try {
      const raw = localStorage.getItem('pitchflow_history')
      if (raw) setHistory(JSON.parse(raw))
    } catch {}
  }, [])

  useEffect(() => {
    const intro = `Hi ${vendorName}! Thanks for submitting your proposal for "${projectTitle}" at $${quotedRate.toLocaleString()}. I've reviewed it and I'd love to discuss the budget in more detail. Can you walk me through what's included at that rate?`
    setMessages([{ role: 'assistant', content: intro }])
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const autoResize = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 140) + 'px'
  }

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading || dealDone) return
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setLoading(true)

    try {
      const res = await fetch(`${API}/api/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId.current,
          message: text,
          vendor_name: vendorName,
          project_title: projectTitle,
          quoted_rate: quotedRate,
          description,
        }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      if (data.deal_reached && data.agreed_price) {
        setDealDone(true)
        setAgreedPrice(data.agreed_price)
        const pct = ((quotedRate - data.agreed_price) / quotedRate) * 100
        const record: DealRecord = {
          id: `deal-${Date.now()}`,
          vendorName,
          projectTitle,
          quotedRate,
          agreedPrice: data.agreed_price,
          savingsPct: pct,
          date: new Date().toISOString(),
        }
        const updated = [record, ...history].slice(0, 20)
        setHistory(updated)
        localStorage.setItem('pitchflow_history', JSON.stringify(updated))
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const goInvoice = () => {
    const p = new URLSearchParams({
      vendorName,
      projectTitle,
      quotedRate: quotedRate.toString(),
      agreedPrice: agreedPrice!.toString(),
      sessionId: sessionId.current,
      ...(companyName && { companyName }),
      ...(companyAddress && { companyAddress }),
      ...(companyCity && { companyCity }),
      ...(companyEmail && { companyEmail }),
    })
    router.push(`/invoice?${p}`)
  }

  return (
    <div className={styles.page}>
      <div className={styles.gridBg} />

      <header className={styles.topbar}>
        <button className={styles.backBtn} onClick={() => router.push('/')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div className={styles.topCenter}>
          <div className={styles.topProject}>{projectTitle}</div>
          <div className={styles.topVendor}>{vendorName}</div>
        </div>
        <div className={styles.topQuoted}>
          <span className={styles.topQuotedLabel}>Quoted</span>
          <span className={styles.topQuotedVal}>${quotedRate.toLocaleString()}</span>
        </div>
      </header>

      <div className={styles.layout}>

        {/* ── LEFT PANEL ── */}
        <aside className={styles.left}>

          {/* Deal Intelligence */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>Deal Intelligence</div>

            <div className={styles.priceRows}>
              <div className={styles.priceRow}>
                <span className={styles.priceKey}>Quoted Rate</span>
                <span className={styles.priceQuoted}>${quotedRate.toLocaleString()}</span>
              </div>
              <div className={styles.priceRow}>
                <span className={styles.priceKey}>Target Budget</span>
                <span className={styles.priceTarget}>${targetPrice.toLocaleString()}</span>
              </div>
              {agreedPrice && (
                <div className={styles.priceRow}>
                  <span className={styles.priceKey}>Agreed Price</span>
                  <span className={styles.priceAgreed}>${agreedPrice.toLocaleString()}</span>
                </div>
              )}
            </div>

            {agreedPrice ? (
              <div className={styles.savingsBox}>
                <div className={styles.savingsNum}>
                  <span className={styles.savingsPlus}>+</span>
                  ${saved.toLocaleString()}
                </div>
                <div className={styles.savingsSub}>saved · {savedPct.toFixed(1)}% below quote</div>
              </div>
            ) : (
              <div className={styles.progressBlock}>
                <div className={styles.progressMeta}>
                  <span>Progress to target</span>
                  <span>20% below</span>
                </div>
                <div className={styles.progressTrack}>
                  <div className={styles.progressFill} style={{ width: '60%' }} />
                  <div className={styles.progressGoal} />
                </div>
              </div>
            )}

            <div className={styles.statusChip} data-done={dealDone}>
              <div className={styles.statusDot} />
              {dealDone ? 'Deal Reached' : 'Negotiating'}
            </div>
          </div>

          {/* Project Details */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>Project Details</div>
            <div className={styles.details}>
              <div className={styles.detailRow}>
                <span className={styles.detailKey}>Vendor</span>
                <span className={styles.detailVal}>{vendorName}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailKey}>Project</span>
                <span className={styles.detailVal}>{projectTitle}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailKey}>Rate</span>
                <span className={styles.detailVal}>${quotedRate.toLocaleString()}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailKey}>Messages</span>
                <span className={styles.detailVal}>{messages.length}</span>
              </div>
              {description && (
                <div className={styles.descBlock}>
                  <span className={styles.detailKey}>Scope</span>
                  <p className={styles.descText}>{description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Past Deals */}
          {history.length > 0 && (
            <div className={styles.card}>
              <button
                className={styles.histToggleBtn}
                onClick={() => setHistoryOpen(v => !v)}
              >
                <span className={styles.cardTitle} style={{ marginBottom: 0 }}>Past Deals ({history.length})</span>
                <svg
                  width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2"
                  style={{ transform: historyOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {historyOpen && (
                <div className={styles.histList}>
                  {history.slice(0, 5).map(h => (
                    <div key={h.id} className={styles.histItem}>
                      <div className={styles.histItemRow}>
                        <span className={styles.histVendor}>{h.vendorName}</span>
                        <span className={styles.histBadge}>−{h.savingsPct.toFixed(0)}%</span>
                      </div>
                      <div className={styles.histProject}>{h.projectTitle}</div>
                      <div className={styles.histPrice}>${h.agreedPrice.toLocaleString()} agreed</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </aside>

        {/* ── RIGHT PANEL — CHAT ── */}
        <main className={styles.chat}>
          <div className={styles.chatHeader}>
            <div className={styles.chatHeaderLeft}>
              <div className={styles.aiDot} />
              <span className={styles.chatHeaderTitle}>AI Negotiator</span>
            </div>
            <div className={styles.chatHeaderMeta}>{messages.length} messages</div>
          </div>

          <div className={styles.messages}>
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? styles.msgUser : styles.msgAI}>
                {m.role === 'assistant' && <div className={styles.aiTag}>AI</div>}
                <div className={styles.bubble}>{m.content}</div>
              </div>
            ))}

            {loading && (
              <div className={styles.msgAI}>
                <div className={styles.aiTag}>AI</div>
                <div className={`${styles.bubble} ${styles.typingBubble}`}>
                  <span /><span /><span />
                </div>
              </div>
            )}

            {dealDone && agreedPrice && (
              <div className={styles.dealBanner}>
                <div className={styles.dealCheck}>✓</div>
                <div className={styles.dealInfo}>
                  <div className={styles.dealTitle}>Deal confirmed at ${agreedPrice.toLocaleString()}</div>
                  <div className={styles.dealSub}>You saved ${saved.toLocaleString()} · {savedPct.toFixed(1)}% below quote</div>
                </div>
                <button className={styles.invoiceBtn} onClick={goInvoice}>
                  View Invoice →
                </button>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          <div className={styles.inputBar}>
            <textarea
              ref={textareaRef}
              className={styles.inputField}
              placeholder={dealDone ? 'Negotiation complete.' : 'Type a message… (Enter to send, Shift+Enter for newline)'}
              value={input}
              rows={1}
              disabled={loading || dealDone}
              onChange={e => { setInput(e.target.value); autoResize() }}
              onKeyDown={handleKey}
            />
            <button
              className={styles.sendBtn}
              onClick={sendMessage}
              disabled={!input.trim() || loading || dealDone}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function PitchPage() {
  return (
    <Suspense>
      <PitchContent />
    </Suspense>
  )
}
