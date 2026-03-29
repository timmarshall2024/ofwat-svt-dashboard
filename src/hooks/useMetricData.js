import { useMemo } from 'react'
import { useData } from '../context/DataContext'

/**
 * Build a lookup map and search helpers for the canonical metrics list.
 */
export function useMetricData() {
  const { metrics } = useData()

  const metricMap = useMemo(() => {
    if (!metrics) return {}
    const map = {}
    for (const m of metrics) map[m.id] = m
    return map
  }, [metrics])

  const domains = useMemo(() => {
    if (!metrics) return []
    const set = new Set(metrics.map((m) => m.taxonomy_domain).filter(Boolean))
    return [...set].sort()
  }, [metrics])

  const units = useMemo(() => {
    if (!metrics) return []
    const set = new Set(metrics.map((m) => m.unit).filter(Boolean))
    return [...set].sort()
  }, [metrics])

  const searchMetrics = (query, { domain, unit, priorityOnly } = {}) => {
    if (!metrics) return []
    const q = (query || '').toLowerCase()
    return metrics.filter((m) => {
      if (domain && m.taxonomy_domain !== domain) return false
      if (unit && m.unit !== unit) return false
      if (priorityOnly && !m.is_svt_priority) return false
      if (q) {
        return (
          m.name.toLowerCase().includes(q) ||
          (m.reference || '').toLowerCase().includes(q) ||
          (m.taxonomy_domain || '').toLowerCase().includes(q) ||
          (m.taxonomy_subdomain || '').toLowerCase().includes(q)
        )
      }
      return true
    })
  }

  return { metrics, metricMap, domains, units, searchMetrics }
}
