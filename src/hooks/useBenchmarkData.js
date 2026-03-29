import { useState, useEffect } from 'react'
import { useData } from '../context/DataContext'

/**
 * Lazy-load benchmarking data for a specific metric.
 * Returns { data, loading, error } where data is the full benchmark JSON.
 */
export function useBenchmarkData(metricId) {
  const { loadBenchmark } = useData()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!metricId) {
      setData(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    loadBenchmark(metricId)
      .then((d) => {
        if (!cancelled) {
          setData(d)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message)
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [metricId, loadBenchmark])

  return { data, loading, error }
}
