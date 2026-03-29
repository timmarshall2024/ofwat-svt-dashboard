import { useState, useEffect } from 'react'
import { useData } from '../context/DataContext'

/**
 * Lazy-load a knowledge document by slug.
 * Returns { data, loading, error } where data is the full knowledge JSON.
 */
export function useKnowledge(slug) {
  const { loadKnowledge } = useData()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!slug) {
      setData(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    loadKnowledge(slug)
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
  }, [slug, loadKnowledge])

  return { data, loading, error }
}
