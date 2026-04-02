import { useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import usePageTitle from '../hooks/usePageTitle'
import MetricRow from '../components/MetricRow'
import ContextPanel from '../components/ContextPanel'
import LoadingSpinner from '../components/LoadingSpinner'
import { domainLabel } from '../utils/formatters'

const HEADLINES = [
  { label: 'Avg household bill 2025-26', value: '\u00A3463', sub: 'Severn Trent (SVE)' },
  { label: 'Real WACC (post-tax)', value: '4.03%', sub: 'Nominal equiv. ~6.05%' },
  { label: 'ODI risk range', value: '-0.63% to +1.31%', sub: 'RoRE (P10 / P90)' },
  { label: 'Avg bill 2029-30', value: '\u00A3583', sub: 'End of AMP8' },
]

function domainToSlug(domain) {
  const d = (domain || '').toLowerCase()
  if (d.includes('cost') || d.includes('expenditure')) return 'expenditure-allowances'
  if (d.includes('performance') || d.includes('outcome') || d.includes('odi')) return 'svt-overview'
  if (d.includes('price') || d.includes('determination')) return 'svt-overview'
  if (d.includes('financial') || d.includes('financeability') || d.includes('resilience')) return 'aligning-risk-and-return'
  if (d.includes('risk') || d.includes('return')) return 'aligning-risk-and-return'
  return 'svt-overview'
}

export default function SVTAtAGlance() {
  usePageTitle('SVT at a Glance')
  const { priorityMetrics, loading } = useData()
  const [activeDomain, setActiveDomain] = useState(null)
  const [contextSlug, setContextSlug] = useState(null)
  const [contextTopic, setContextTopic] = useState(null)
  const [rcvNoteOpen, setRcvNoteOpen] = useState(false)

  const grouped = useMemo(() => {
    if (!priorityMetrics) return []
    const groups = {}
    for (const m of priorityMetrics) {
      const domain = m.taxonomy_domain || 'Other'
      if (!groups[domain]) groups[domain] = []
      groups[domain].push(m)
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [priorityMetrics])

  // Set default active domain to first one when data loads
  const defaultDomain = grouped.length > 0 ? grouped[0][0] : null
  const currentDomain = activeDomain && grouped.some(([d]) => d === activeDomain) ? activeDomain : defaultDomain

  const activeMetrics = useMemo(() => {
    if (!currentDomain) return []
    const entry = grouped.find(([d]) => d === currentDomain)
    return entry ? entry[1] : []
  }, [grouped, currentDomain])

  const handleInfoClick = useCallback((metric) => {
    const name = (metric.canonical_name || '').toLowerCase()
    if (name.includes('wacc') || name.includes('allowed return on capital')) {
      setContextSlug('wacc_buildup')
      setContextTopic('wacc')
    } else {
      setContextSlug(domainToSlug(metric.taxonomy_domain))
      setContextTopic(metric.canonical_name)
    }
  }, [])

  const closePanel = useCallback(() => {
    setContextSlug(null)
    setContextTopic(null)
  }, [])

  const handleExport = useCallback(() => {
    window.print()
  }, [])

  if (loading) return <LoadingSpinner message="Loading dashboard..." />

  return (
    <div className="flex gap-0">
      {/* Print header (hidden on screen, shown in print) */}
      <div className="print-header">
        <h1>SVT Regulatory Intelligence Briefing</h1>
        <div className="print-date">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        <div className="print-brand">Analysis by Fox Stephens</div>
      </div>

      {/* Desktop sidebar */}
      <aside className="no-print hidden md:block w-[200px] flex-shrink-0 fixed top-[64px] bottom-0 left-0 z-30 overflow-y-auto"
        style={{ backgroundColor: '#005030' }}
      >
        <nav className="py-3">
          {grouped.map(([domain, metrics]) => {
            const isActive = domain === currentDomain
            return (
              <button
                key={domain}
                onClick={() => setActiveDomain(domain)}
                className="w-full text-left transition-colors"
                style={{
                  padding: '12px 16px',
                  borderLeft: isActive ? '3px solid #F47321' : '3px solid transparent',
                  backgroundColor: isActive ? '#0a6038' : 'transparent',
                  color: 'white',
                  opacity: isActive ? 1 : 0.7,
                }}
              >
                <div style={{ fontSize: 13, lineHeight: 1.3 }}>{domainLabel(domain)}</div>
                <div style={{ fontSize: 11, opacity: 0.5, marginTop: 2 }}>
                  ({metrics.length} metric{metrics.length !== 1 ? 's' : ''})
                </div>
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Mobile tab strip */}
      <div className="no-print md:hidden overflow-x-auto whitespace-nowrap -mx-4 px-4 pb-3 mb-3 border-b border-fs-border"
        style={{ position: 'sticky', top: 56, zIndex: 20, backgroundColor: 'white' }}
      >
        {grouped.map(([domain]) => {
          const isActive = domain === currentDomain
          return (
            <button
              key={domain}
              onClick={() => setActiveDomain(domain)}
              className="inline-block mr-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                backgroundColor: isActive ? '#005030' : '#f0f0f0',
                color: isActive ? 'white' : '#4a4a4a',
              }}
            >
              {domainLabel(domain)}
            </button>
          )
        })}
      </div>

      {/* Main content area */}
      <div className="flex-1 min-w-0 md:ml-[200px] transition-all duration-200">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-heading font-bold text-fs-primary">SVT at a Glance</h1>
          <button
            onClick={handleExport}
            aria-label="Export briefing"
            className="no-print px-3 py-1.5 text-xs font-medium rounded-fs-sm border border-fs-border bg-white text-fs-text hover:border-fs-primary hover:text-fs-primary transition-colors"
            data-print-hide
          >
            Export briefing
          </button>
        </div>
        <p className="text-sm text-fs-text-muted mb-6">
          Key metrics from the Ofwat PR24 Final Determination for Severn Trent Water
        </p>

        {/* Headline banner */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {HEADLINES.map((h) => (
            <div
              key={h.label}
              className="rounded-fs-md bg-fs-primary p-4 text-white shadow-fs"
            >
              <div className="text-xs font-medium text-white/60 mb-1">{h.label}</div>
              <div className="text-2xl font-heading font-bold">{h.value}</div>
              <div className="text-xs text-white/50 mt-1">{h.sub}</div>
            </div>
          ))}
        </div>

        {/* SVT Assessment banner */}
        <div className="mb-8 rounded-fs-md border-l-4 border-fs-secondary bg-fs-secondary-light px-4 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-fs-success" />
            <span className="text-fs-text">Ofwat assessment: <span className="font-bold text-fs-primary">Outstanding</span></span>
          </span>
          <span className="text-fs-border">|</span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-fs-success" />
            <span className="text-fs-text">SVT accepted FD — <span className="font-bold text-fs-primary">not referred to CMA</span></span>
          </span>
          <span className="text-fs-border">|</span>
          <span className="text-fs-text-muted">{'\u00A3'}15bn totex AMP8</span>
          <span className="text-fs-border">|</span>
          <span className="text-fs-text-muted">Plan quality: highest category</span>
        </div>

        {/* Domain heading */}
        {currentDomain && (
          <h2 className="text-[18px] font-heading font-medium mb-3" style={{ color: '#005030' }}>
            {domainLabel(currentDomain)}
          </h2>
        )}

        {/* Metric rows for selected domain */}
        {activeMetrics.map((m) => {
          const name = (m.canonical_name || '').toLowerCase()
          const showRCVLink = name.includes('rcv') || name.includes('regulatory capital value')
          const showWACCLink = name.includes('wacc') || name.includes('allowed return on capital')
          const isOpeningRCV = name.includes('opening rcv')
          return (
            <div key={`${m.metric_id}-${m.canonical_name}`}>
              <MetricRow metric={m} onInfoClick={handleInfoClick} />
              {(showRCVLink || showWACCLink || isOpeningRCV) && (
                <div className="flex flex-wrap items-center gap-3 pl-0 lg:pl-[25%] pb-2 -mt-1">
                  {showRCVLink && (
                    <Link to="/learn/rcv-journey" className="text-[10px] text-fs-primary hover:underline">
                      See RCV history →
                    </Link>
                  )}
                  {showWACCLink && (
                    <Link to="/learn/equity-bridge" className="text-[10px] text-fs-primary hover:underline">
                      Explore equity bridge →
                    </Link>
                  )}
                  {isOpeningRCV && (
                    <>
                      <button
                        onClick={() => setRcvNoteOpen(!rcvNoteOpen)}
                        className="inline-flex items-center gap-1 text-[10px] text-fs-text-muted hover:text-fs-primary transition-colors"
                      >
                        <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-current text-[8px] leading-none">?</span>
                        <span>Why two figures?</span>
                      </button>
                      <div
                        className="w-full overflow-hidden transition-all duration-200 ease-in-out"
                        style={{ maxHeight: rcvNoteOpen ? 120 : 0, opacity: rcvNoteOpen ? 1 : 0 }}
                      >
                        <p className="text-[11px] text-gray-500 italic leading-relaxed mt-1 max-w-2xl">
                          The PR24 FD model RCV (£12.26bn) is Ofwat's regulatory starting point. The adjusted
                          figure (£13.52bn) includes CPIH indexation and AMP7 period-end reconciliations applied
                          before AMP8 begins. For financial modelling, use the adjusted figure.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {contextSlug && (
        <ContextPanel slug={contextSlug} topic={contextTopic} onClose={closePanel} />
      )}
    </div>
  )
}
