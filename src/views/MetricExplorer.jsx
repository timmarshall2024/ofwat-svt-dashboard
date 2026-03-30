import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import LoadingSpinner from '../components/LoadingSpinner'
import ContextPanel from '../components/ContextPanel'
import { useData } from '../context/DataContext'
import { useMetricData } from '../hooks/useMetricData'
import { useKnowledge } from '../hooks/useKnowledge'
import { formatValue, domainLabel, sortPeriods, formatRaw } from '../utils/formatters'
import { chartTheme } from '../styles/chartTheme'

const PAGE_SIZE = 50

function domainToSlug(domain) {
  const d = (domain || '').toLowerCase()
  if (d.includes('cost') || d.includes('expenditure')) return 'expenditure-allowances'
  if (d.includes('financial') || d.includes('financeability') || d.includes('return') || d.includes('risk')) return 'aligning-risk-and-return'
  return 'svt-overview'
}

function RegulatoryContext({ slug, metricName, onOpenPanel }) {
  const { data } = useKnowledge(slug)
  if (!data?.key_decisions) return null

  const topicLower = (metricName || '').toLowerCase()
  let decisions = data.key_decisions.filter((d) =>
    (d.decision || '').toLowerCase().includes(topicLower) ||
    (d.detail || '').toLowerCase().includes(topicLower)
  )
  if (decisions.length === 0) decisions = data.key_decisions.slice(0, 3)
  decisions = decisions.slice(0, 3)

  return (
    <div className="mt-3 pt-3 border-t border-fs-border/50">
      <h4 className="text-xs font-heading font-bold text-fs-text-muted uppercase tracking-wider mb-1.5">Regulatory context</h4>
      <ul className="space-y-1">
        {decisions.map((d, i) => (
          <li key={i} className="text-xs text-fs-text-muted flex gap-1.5">
            <span className="text-fs-secondary shrink-0">{'\u00B7'}</span>
            <span><span className="font-medium text-fs-text">{d.decision}</span> {'\u2014'} {d.detail}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={onOpenPanel}
        className="mt-2 text-xs text-fs-secondary hover:text-fs-primary font-medium"
      >
        Read full context {'\u2192'}
      </button>
    </div>
  )
}

export default function MetricExplorer() {
  const { svtSummary, loading: ctxLoading, loadSvtSummary } = useData()
  const { metrics, domains, units, searchMetrics } = useMetricData()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [domainFilter, setDomainFilter] = useState('')
  const [unitFilter, setUnitFilter] = useState('')
  const [priorityOnly, setPriorityOnly] = useState(false)
  const [page, setPage] = useState(0)
  const [selectedRow, setSelectedRow] = useState(null)
  const [svtData, setSvtData] = useState(null)
  const [loadingSvt, setLoadingSvt] = useState(false)
  const [contextSlug, setContextSlug] = useState(null)
  const [contextTopic, setContextTopic] = useState(null)

  useEffect(() => {
    setLoadingSvt(true)
    loadSvtSummary()
      .then((d) => { setSvtData(d); setLoadingSvt(false) })
      .catch(() => setLoadingSvt(false))
  }, [loadSvtSummary])

  const svtMap = useMemo(() => {
    if (!svtData) return {}
    const map = {}
    for (const m of svtData) {
      if (m.values && m.values.length) {
        const sorted = [...m.values].sort((a, b) => (parseInt(b.period) || 0) - (parseInt(a.period) || 0))
        map[m.metric_id] = { latest: sorted[0].value, latestPeriod: sorted[0].period, allValues: m.values }
      }
    }
    return map
  }, [svtData])

  const filtered = useMemo(() => {
    return searchMetrics(query, { domain: domainFilter, unit: unitFilter, priorityOnly })
  }, [query, domainFilter, unitFilter, priorityOnly, searchMetrics])

  // Reset page when filters change (must be in useEffect, not useMemo)
  useEffect(() => {
    setPage(0)
  }, [query, domainFilter, unitFilter, priorityOnly])

  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  const exportCSV = useCallback(() => {
    const header = ['Metric ID', 'Name', 'Reference', 'Domain', 'Unit', 'SVT Value (latest)', 'Period']
    const rows = filtered.map((m) => {
      const svt = svtMap[m.id]
      return [m.id, `"${(m.name || '').replace(/"/g, '""')}"`, m.reference || '', m.taxonomy_domain || '', m.unit || '', svt ? formatRaw(svt.latest) : '', svt ? svt.latestPeriod : ''].join(',')
    })
    const csv = [header.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ofwat_metrics_export.csv'
    a.click()
    URL.revokeObjectURL(url)
  }, [filtered, svtMap])

  const panelMetric = selectedRow ? metrics?.find((m) => m.id === selectedRow) : null
  const panelSvt = selectedRow ? svtMap[selectedRow] : null
  const sparkData = useMemo(() => {
    if (!panelSvt?.allValues) return []
    const byPeriod = {}
    for (const v of panelSvt.allValues) {
      if (v.company === 'SVT' || v.company === 'SVE') {
        if (!byPeriod[v.period] || v.company === 'SVE') byPeriod[v.period] = v.value
      }
    }
    return sortPeriods(Object.keys(byPeriod)).map((p) => ({ period: p, value: byPeriod[p] }))
  }, [panelSvt])

  const panelSlug = panelMetric ? domainToSlug(panelMetric.taxonomy_domain) : null

  const closeContextPanel = useCallback(() => { setContextSlug(null); setContextTopic(null) }, [])

  if (ctxLoading && !metrics?.length) return <LoadingSpinner message="Loading metrics..." />

  return (
    <div className="flex gap-0">
      <div className={`flex-1 min-w-0 ${selectedRow ? 'pr-4' : ''}`}>
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-heading font-bold text-fs-primary">Metric Explorer</h1>
          <button
            onClick={exportCSV}
            className="rounded-fs-sm border border-fs-border bg-white px-3 py-1.5 text-xs font-medium text-fs-text-muted shadow-fs hover:bg-gray-50"
          >
            Export CSV
          </button>
        </div>
        <p className="text-sm text-fs-text-muted mb-4">
          Browse and search all {metrics?.length?.toLocaleString()} canonical metrics
        </p>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <input
            type="text"
            placeholder="Search by name or reference..."
            className="rounded-fs-sm border border-fs-border bg-white px-3 py-2 text-sm shadow-fs focus:border-fs-primary focus:outline-none flex-1 min-w-[200px]"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select className="rounded-fs-sm border border-fs-border bg-white px-3 py-2 text-sm shadow-fs" value={domainFilter} onChange={(e) => setDomainFilter(e.target.value)}>
            <option value="">All domains</option>
            {domains.map((d) => <option key={d} value={d}>{domainLabel(d)}</option>)}
          </select>
          <select className="rounded-fs-sm border border-fs-border bg-white px-3 py-2 text-sm shadow-fs" value={unitFilter} onChange={(e) => setUnitFilter(e.target.value)}>
            <option value="">All units</option>
            {units.slice(0, 30).map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
          <label className="flex items-center gap-1.5 text-sm text-fs-text-muted">
            <input type="checkbox" checked={priorityOnly} onChange={(e) => setPriorityOnly(e.target.checked)} className="rounded border-fs-border" />
            SVT priority only
          </label>
        </div>

        <div className="text-xs text-fs-text-muted mb-2">
          {filtered.length.toLocaleString()} metrics
          {totalPages > 1 && ` \u00B7 Page ${page + 1} of ${totalPages}`}
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-fs-md border border-fs-border bg-fs-surface shadow-fs">
          <table className="w-full text-sm">
            <thead className="bg-fs-primary-light border-b border-fs-border">
              <tr className="text-left text-xs text-fs-text-muted uppercase tracking-wider">
                <th className="px-3 py-2">Metric</th>
                <th className="px-3 py-2">Domain</th>
                <th className="px-3 py-2">Unit</th>
                <th className="px-3 py-2 text-right">SVT Value</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map((m) => {
                const svt = svtMap[m.id]
                return (
                  <tr
                    key={m.id}
                    onClick={() => setSelectedRow(selectedRow === m.id ? null : m.id)}
                    className={`border-b border-fs-border/30 cursor-pointer transition-colors ${
                      selectedRow === m.id ? 'bg-fs-secondary-light' : 'hover:bg-gray-50'
                    } ${m.is_svt_priority ? 'font-medium' : ''}`}
                  >
                    <td className="px-3 py-2 max-w-[400px]">
                      <div className="truncate">{m.name}</div>
                      {m.is_svt_priority && (
                        <span className="text-[10px] text-fs-secondary font-medium">SVT PRIORITY</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-fs-text-muted whitespace-nowrap">{domainLabel(m.taxonomy_domain)}</td>
                    <td className="px-3 py-2 text-xs text-fs-text-muted">{m.unit}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs">
                      {svt ? formatValue(svt.latest, m.unit) : (loadingSvt ? <span className="text-fs-border">...</span> : '\u2014')}
                    </td>
                  </tr>
                )
              })}
              {pageData.length === 0 && (
                <tr><td colSpan={4} className="px-3 py-8 text-center text-fs-text-muted">No metrics match your filters</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button disabled={page === 0} onClick={() => setPage(page - 1)} className="rounded-fs-sm border border-fs-border px-3 py-1 text-xs disabled:opacity-40 hover:bg-gray-50">Previous</button>
            <span className="text-xs text-fs-text-muted">{page + 1} / {totalPages}</span>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} className="rounded-fs-sm border border-fs-border px-3 py-1 text-xs disabled:opacity-40 hover:bg-gray-50">Next</button>
          </div>
        )}
      </div>

      {/* Slide-out detail panel */}
      {panelMetric && !contextSlug && (
        <div className="w-80 shrink-0 border-l border-fs-border pl-4 overflow-y-auto max-h-[calc(100vh-10rem)]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-heading font-bold text-fs-primary">Metric Detail</h3>
            <button onClick={() => setSelectedRow(null)} className="text-fs-text-muted hover:text-fs-text text-lg">×</button>
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-xs text-fs-text-muted">Name</div>
              <div className="font-heading font-bold text-fs-text">{panelMetric.name}</div>
            </div>
            <div>
              <div className="text-xs text-fs-text-muted">Reference</div>
              <div className="text-fs-text-muted font-mono text-xs">{panelMetric.reference || '\u2014'}</div>
            </div>
            <div className="flex gap-4">
              <div>
                <div className="text-xs text-fs-text-muted">Domain</div>
                <div className="text-fs-text">{domainLabel(panelMetric.taxonomy_domain)}</div>
              </div>
              <div>
                <div className="text-xs text-fs-text-muted">Unit</div>
                <div className="text-fs-text">{panelMetric.unit || '\u2014'}</div>
              </div>
            </div>
            <div>
              <div className="text-xs text-fs-text-muted">Category</div>
              <div className="text-fs-text">{panelMetric.category || '\u2014'}</div>
            </div>
            {panelSvt && (
              <div>
                <div className="text-xs text-fs-text-muted mb-1">SVT Value ({panelSvt.latestPeriod})</div>
                <div className="text-xl font-heading font-bold text-fs-primary">{formatValue(panelSvt.latest, panelMetric.unit)}</div>
              </div>
            )}
            {sparkData.length > 1 && (
              <div>
                <div className="text-xs text-fs-text-muted mb-1">SVT trend</div>
                <div className="h-16 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sparkData}>
                      <Line type="monotone" dataKey="value" stroke={chartTheme.svtColor} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button onClick={() => navigate(`/benchmarking/${panelMetric.id}`)} className="flex-1 rounded-fs-sm bg-fs-primary px-3 py-2 text-xs font-medium text-white hover:bg-fs-primary-dark transition-colors">View in Benchmarking</button>
              <button onClick={() => navigate(`/trends/${panelMetric.id}`)} className="flex-1 rounded-fs-sm border border-fs-primary px-3 py-2 text-xs font-medium text-fs-primary hover:bg-fs-primary-light transition-colors">View in Trends</button>
            </div>
            {panelSlug && (
              <RegulatoryContext slug={panelSlug} metricName={panelMetric.name} onOpenPanel={() => { setContextSlug(panelSlug); setContextTopic(panelMetric.name) }} />
            )}
          </div>
        </div>
      )}

      {contextSlug && (
        <ContextPanel slug={contextSlug} topic={contextTopic} onClose={closeContextPanel} />
      )}
    </div>
  )
}
