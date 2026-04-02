import { useState, useEffect, useMemo } from 'react'
import usePageTitle from '../hooks/usePageTitle'
import { ACRONYMS } from '../utils/acronyms'

export default function Glossary() {
  usePageTitle('Glossary')
  const [terms, setTerms] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/knowledge/index.json')
      .then(r => r.json())
      .then(async (index) => {
        const allTerms = []
        const files = (index.documents || []).map(d => d.file)
        for (const file of files) {
          try {
            const doc = await fetch(`/knowledge/${file}`).then(r => r.json())
            if (doc.glossary_terms) {
              for (const t of doc.glossary_terms) {
                allTerms.push({
                  term: t.term,
                  definition: t.definition,
                  source: doc.document_title || doc.slug || file.replace('.json', ''),
                })
              }
            }
          } catch { /* skip files that fail */ }
        }

        // Add acronyms from the central dictionary
        for (const [acronym, definition] of Object.entries(ACRONYMS)) {
          allTerms.push({
            term: acronym,
            definition,
            source: 'Regulatory terminology',
          })
        }

        // Deduplicate case-insensitive, keep first occurrence
        const seen = new Map()
        const deduped = []
        for (const t of allTerms) {
          const key = t.term.toLowerCase()
          if (!seen.has(key)) {
            seen.set(key, true)
            deduped.push(t)
          }
        }

        // Sort alphabetically
        deduped.sort((a, b) => a.term.localeCompare(b.term, 'en', { sensitivity: 'base' }))
        setTerms(deduped)
        setLoading(false)
      })
      .catch(() => {
        // If knowledge fetch fails, still show acronyms
        const acronymTerms = Object.entries(ACRONYMS).map(([term, definition]) => ({
          term,
          definition,
          source: 'Regulatory terminology',
        }))
        acronymTerms.sort((a, b) => a.term.localeCompare(b.term, 'en', { sensitivity: 'base' }))
        setTerms(acronymTerms)
        setLoading(false)
      })
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return terms
    const q = search.toLowerCase()
    return terms.filter(
      t => t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q)
    )
  }, [terms, search])

  // Group by first letter
  const grouped = useMemo(() => {
    const groups = {}
    for (const t of filtered) {
      const letter = t.term[0].toUpperCase()
      if (!groups[letter]) groups[letter] = []
      groups[letter].push(t)
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [filtered])

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-fs-text-muted">Loading glossary...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-fs-primary mb-1">Glossary</h1>
        <p className="text-sm text-fs-text-muted">
          {terms.length} regulatory terms extracted from Ofwat PR24 Final Determination documents
        </p>
      </div>

      {/* Search box */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search terms or definitions..."
          className="w-full px-4 py-2.5 text-sm border border-fs-border rounded-fs-md focus:border-fs-primary focus:outline-none bg-white shadow-fs"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-2.5 text-fs-text-muted hover:text-fs-text text-sm"
          >
            Clear
          </button>
        )}
        <div className="mt-1 text-xs text-fs-text-muted">
          {search ? `${filtered.length} matching term${filtered.length !== 1 ? 's' : ''}` : ''}
        </div>
      </div>

      {/* Terms grouped by letter */}
      {grouped.map(([letter, letterTerms]) => (
        <div key={letter}>
          <div className="sticky top-14 z-10 bg-fs-background py-1">
            <h2 className="text-lg font-heading font-bold text-fs-primary">{letter}</h2>
          </div>
          <div className="space-y-3">
            {letterTerms.map(t => (
              <div key={t.term} className="bg-white rounded-fs-md border border-fs-border p-4 shadow-fs">
                <dt className="text-sm font-bold text-fs-primary font-heading">{t.term}</dt>
                <dd className="text-sm text-fs-text mt-1 leading-relaxed">{t.definition}</dd>
                <div className="text-[10px] text-fs-text-muted mt-1.5 truncate">
                  Source: {t.source}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-fs-text-muted">
          No terms matching &ldquo;{search}&rdquo;
        </div>
      )}
    </div>
  )
}
