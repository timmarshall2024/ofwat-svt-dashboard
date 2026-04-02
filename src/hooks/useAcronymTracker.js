import { useState, useCallback, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Tracks which acronyms have been rendered on the current page.
 * Resets when the route changes.
 */
export default function useAcronymTracker() {
  const seenRef = useRef(new Set())
  const [, setTick] = useState(0)
  const location = useLocation()

  useEffect(() => {
    seenRef.current = new Set()
    setTick(t => t + 1)
  }, [location.pathname])

  const hasBeenSeen = useCallback((acronym) => {
    return seenRef.current.has(acronym)
  }, [])

  const markAsSeen = useCallback((acronym) => {
    seenRef.current.add(acronym)
  }, [])

  return { hasBeenSeen, markAsSeen }
}
