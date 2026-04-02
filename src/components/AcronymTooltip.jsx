import { ACRONYMS } from '../utils/acronyms'

/**
 * Renders an acronym with a CSS-only tooltip.
 *
 * firstOccurrence=true  → shows "ACRONYM (Full Name)" inline
 * firstOccurrence=false → shows "ACRONYM" with dotted underline and hover tooltip
 */
export default function AcronymTooltip({ text, firstOccurrence = false }) {
  const definition = ACRONYMS[text]
  if (!definition) return <span>{text}</span>

  // Extract the short name (before the em dash) for first-occurrence display
  const shortDef = definition.split('—')[0].trim()

  if (firstOccurrence) {
    return (
      <span className="acronym-first">
        <strong>{text}</strong>
        <span className="text-fs-text-muted font-normal"> ({shortDef})</span>
      </span>
    )
  }

  return (
    <span className="acronym-tooltip-wrap">
      <span
        className="acronym-tooltip-trigger"
        style={{ borderBottom: '1px dotted #999', cursor: 'help' }}
      >
        {text}
      </span>
      <span className="acronym-tooltip-box" role="tooltip">
        <strong>{text}</strong>: {definition}
      </span>
    </span>
  )
}

/**
 * Scans a text string and wraps known acronyms with tooltips.
 * Uses a tracker to determine first vs subsequent occurrences.
 */
export function AcronymText({ children, tracker }) {
  if (typeof children !== 'string') return children

  // Build a regex matching whole-word acronyms (case-sensitive)
  const acronymKeys = Object.keys(ACRONYMS).sort((a, b) => b.length - a.length)
  const regex = new RegExp(`\\b(${acronymKeys.join('|')})\\b`, 'g')

  const parts = []
  let lastIndex = 0
  let match

  // Reset regex state
  regex.lastIndex = 0
  while ((match = regex.exec(children)) !== null) {
    if (match.index > lastIndex) {
      parts.push(children.slice(lastIndex, match.index))
    }
    const acronym = match[1]
    const isFirst = tracker && !tracker.hasBeenSeen(acronym)
    if (isFirst && tracker) tracker.markAsSeen(acronym)
    parts.push(
      <AcronymTooltip key={`${acronym}-${match.index}`} text={acronym} firstOccurrence={isFirst} />
    )
    lastIndex = regex.lastIndex
  }

  if (lastIndex < children.length) {
    parts.push(children.slice(lastIndex))
  }

  return parts.length > 0 ? <>{parts}</> : children
}
