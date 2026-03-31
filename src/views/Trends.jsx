import { useState, useMemo, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid, ReferenceArea,
} from 'recharts'
import MetricSelector, { findDefaultMetric, findDefaultForDomain, displayName } from '../components/MetricSelector'
import CompanyBadge from '../components/CompanyBadge'
import ContextPanel from '../components/ContextPanel'
import LoadingSpinner from '../components/LoadingSpinner'
import { useData } from '../context/DataContext'
import { useTrendData } from '../hooks/useTrendData'
import { formatValue, sortPeriods } from '../utils/formatters'
import { chartTheme } from '../styles/chartTheme'

function domainToSlug(domain) {
  const d = (domain || '').toLowerCase()
  if (d.includes('cost') || d.includes('expenditure')) return 'expenditure-allowances'
  if (d.includes('financial') || d.includes('financeability') || d.includes('return') || d.includes('risk')) return 'aligning-risk-and-return'
  return 'svt-overview'
}

export default function Trends() {
  const { metricId: routeMetricId } = useParams()

  const [domain, setDomain] = useState('__priority__')
  const [selectedMetric, setSelectedMetric] = useState(
    routeMetricId ? Number(routeMetricId) : null
  )
  const [contextOpen, setContextOpen] = useState(false)
  const { appointees, metrics } = useData()
  const { trendsByCompany, loading, selectedCompanies, addCompany, removeCompany } =
    useTrendData(['SVT'])

  // Route param sync
  useEffect(() => {
    if (routeMetricId) setSelectedMetric(Number(routeMetricId))
  }, [routeMetricId])

  // Auto-select default metric when metrics first load
  useEffect(() => {
    if (selectedMetric != null || !metrics?.length) return
    const id = findDefaultMetric(metrics)
    if (id != null) setSelectedMetric(id)
  }, [metrics, selectedMetric])

  // Sync domain on mount if routed to a specific metric
  useEffect(() => {
    if (!selectedMetric || !metrics?.length) return
    const m = metrics.find(x => x.id === selectedMetric)
    if (!m) return
    if (domain === '__priority__' && m.is_svt_priority) return
    if (domain === '__all__') return
    if (domain === m.taxonomy_domain) return
    if (m.is_svt_priority) {
      setDomain('__priority__')
    } else if (m.taxonomy_domain) {
      setDomain(m.taxonomy_domain)
    }
  }, []) // Only on mount

  function handleDomainChange(newDomain) {
    setDomain(newDomain)
    setContextOpen(false)
    if (!metrics?.length) return
    const defaultId = findDefaultForDomain(metrics, newDomain)
    if (defaultId != null) setSelectedMetric(defaultId)
  }

  function handleMetricChange(id) {
    setSelectedMetric(id)
    setContextOpen(false)
  }

  const metricInfo = useMemo(() => {
    if (!metrics) return null
    return metrics.find((m) => m.id === selectedMetric)
  }, [metrics, selectedMetric])

  const { chartData, allPeriods } = useMemo(() => {
    const periodMap = {}
    for (const code of selectedCompanies) {
      const trend = trendsByCompany[code]
      if (!trend) continue
      const metric = trend.metrics.find((m) => m.metric_id === selectedMetric)
      if (!metric) continue
      for (const v of metric.values) {
        if (!periodMap[v.period]) periodMap[v.period] = { period: v.period }
        periodMap[v.period][code] = v.value
      }
    }
    const allPeriods = sortPeriods(Object.keys(periodMap))
    const chartData = allPeriods.map((p) => periodMap[p])
    return { chartData, allPeriods }
  }, [trendsByCompany, selectedCompanies, selectedMetric])

  const amp7Start = allPeriods.find((p) => p.startsWith('2020'))
  const amp7End = allPeriods.find((p) => p.startsWith('2024'))
  const amp8Start = allPeriods.find((p) => p.startsWith('2025'))
  const amp8End = allPeriods.find((p) => p.startsWith('2029'))

  const unit = metricInfo?.unit || ''
  const contextSlug = metricInfo ? domainToSlug(metricInfo.taxonomy_domain) : null

  const available = appointees.filter((a) => !selectedCompanies.includes(a.code))
  const closeContext = useCallback(() => setContextOpen(false), [])

  return (
    <div className="flex gap-0">
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl font-heading font-bold text-fs-primary mb-1">Trends</h1>
        <p className="text-sm text-fs-text-muted mb-4">
          Track metric performance over time across companies
        </p>

        <div className="rounded-fs-md border border-fs-border bg-fs-surface p-4 shadow-fs mb-4">
          <p className="text-xs font-medium text-fs-text mb-2">Select metric</p>
          <MetricSelector
            metrics={metrics || []}
            selectedDomain={domain}
            onDomainChange={handleDomainChange}
            selectedMetricId={selectedMetric}
            onMetricChange={handleMetricChange}
          />
        </div>

        {/* Company selector */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-xs text-fs-text-muted mr-1">Companies:</span>
          {selectedCompanies.map((code) => (
            <CompanyBadge key={code} code={code} onRemove={removeCompany} />
          ))}
          {selectedCompanies.length < 5 && available.length > 0 && (
            <select
              className="rounded-fs-sm border border-fs-border bg-white px-2 py-1 text-xs shadow-fs"
              value=""
              onChange={(e) => { if (e.target.value) addCompany(e.target.value) }}
            >
              <option value="">+ Add company</option>
              {available.map((a) => (
                <option key={a.code} value={a.code}>{a.code} {'\u2014'} {a.name}</option>
              ))}
            </select>
          )}
        </div>

        {loading && <LoadingSpinner message="Loading trend data..." />}

        {metricInfo && (
          <div className="mb-2 flex items-center gap-3">
            <div className="text-sm text-fs-text-muted">
              <span className="font-heading font-bold text-fs-text">{displayName(metricInfo)}</span>
              {' \u00B7 '}
              {metricInfo.taxonomy_domain} {'\u00B7'} {unit}
            </div>
            <button
              onClick={() => setContextOpen(!contextOpen)}
              className="inline-flex items-center gap-1 rounded-fs-sm border border-fs-border bg-white px-2 py-1 text-xs text-fs-text-muted hover:text-fs-secondary hover:border-fs-secondary transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Methodology
            </button>
          </div>
        )}

        {chartData.length > 0 ? (
          <div className="rounded-fs-md border border-fs-border bg-fs-surface p-4 shadow-fs">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData} margin={{ left: 10, right: 20, top: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
                {amp7Start && amp7End && (
                  <ReferenceArea
                    x1={amp7Start} x2={amp7End}
                    fill={chartTheme.ampBandAMP7} fillOpacity={0.6}
                    label={{ value: 'AMP7', position: 'insideTopLeft', fontSize: 11, fill: '#6b6b6b' }}
                  />
                )}
                {amp8Start && amp8End && (
                  <ReferenceArea
                    x1={amp8Start} x2={amp8End}
                    fill={chartTheme.ampBandAMP8} fillOpacity={0.6}
                    label={{ value: 'AMP8', position: 'insideTopLeft', fontSize: 11, fill: '#6b6b6b' }}
                  />
                )}
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#6b6b6b' }} angle={-45} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11, fill: '#6b6b6b' }} />
                <Tooltip
                  formatter={(val, name) => [formatValue(val, unit), name]}
                  contentStyle={{ fontSize: 12, borderRadius: 6, border: `1px solid ${chartTheme.tooltipBorder}`, fontFamily: "'Times New Roman', serif" }}
                />
                <Legend />
                {selectedCompanies.map((code, i) => (
                  <Line
                    key={code}
                    type="monotone"
                    dataKey={code}
                    stroke={code === 'SVT' || code === 'SVE' ? chartTheme.svtColor : chartTheme.palette[i % chartTheme.palette.length]}
                    strokeWidth={code === 'SVT' || code === 'SVE' ? 3 : 1.5}
                    dot={{ r: code === 'SVT' ? 3 : 2 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          !loading && (
            <p className="text-fs-text-muted text-sm py-8 text-center">
              No trend data available for this metric and company selection.
            </p>
          )
        )}
      </div>

      {contextOpen && contextSlug && (
        <ContextPanel slug={contextSlug} topic={metricInfo?.name} onClose={closeContext} />
      )}
    </div>
  )
}
