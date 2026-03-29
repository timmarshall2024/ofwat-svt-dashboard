/**
 * Format a numeric value based on its unit string.
 */
export function formatValue(value, unit) {
  if (value == null || value === '') return '—'
  const num = Number(value)
  if (isNaN(num)) return String(value)

  const u = (unit || '').toLowerCase().trim()

  // Percentage units — values stored as decimals (0.04 = 4%)
  if (u === '%' || u === '% rore' || u.includes('percent')) {
    // If the absolute value is less than 1, assume it's a decimal ratio
    if (Math.abs(num) < 1 && Math.abs(num) > 0) {
      return (num * 100).toFixed(2) + '%'
    }
    return num.toFixed(2) + '%'
  }

  // Currency (£m)
  if (u === '£m' || u === '£ million' || u === 'gbp million') {
    if (Math.abs(num) >= 1000) return '£' + (num / 1000).toFixed(2) + 'bn'
    if (Math.abs(num) >= 1) return '£' + num.toFixed(1) + 'm'
    return '£' + (num * 1000).toFixed(0) + 'k'
  }

  // Per customer bills
  if (u.includes('£') && u.includes('customer')) {
    return '£' + num.toFixed(2)
  }

  // Megalitres per day
  if (u === 'ml/d' || u === 'megalitres per day') {
    return num.toFixed(1) + ' Ml/d'
  }

  // Ratios
  if (u === 'ratio' || u === 'number' || u === 'nr' || u === 'nr/1000km' || u.includes('per 10,000') || u.includes('/10k')) {
    return num.toFixed(2)
  }

  // Index
  if (u === 'index') return num.toFixed(3)

  // Large integers
  if (u === '000' || u === '000s') return num.toLocaleString('en-GB') + 'k'

  // Default: smart formatting
  if (Number.isInteger(num) && Math.abs(num) < 1e6) return num.toLocaleString('en-GB')
  if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(2) + 'm'
  if (Math.abs(num) < 0.01 && num !== 0) return num.toExponential(2)
  if (Math.abs(num) < 1) return num.toFixed(4)
  return num.toFixed(2)
}

/**
 * Format a value for the summary banner (larger, simpler display).
 */
export function formatHeadline(value, unit) {
  if (value == null) return '—'
  const num = Number(value)
  if (isNaN(num)) return String(value)

  const u = (unit || '').toLowerCase().trim()

  if (u === '%' || u === '% rore') {
    if (Math.abs(num) < 1 && num !== 0) return (num * 100).toFixed(2) + '%'
    return num.toFixed(2) + '%'
  }
  if (u.includes('£') && u.includes('customer')) return '£' + num.toFixed(0)
  if (u === '£m') {
    if (Math.abs(num) >= 1000) return '£' + (num / 1000).toFixed(1) + 'bn'
    return '£' + num.toFixed(0) + 'm'
  }
  return formatValue(num, unit)
}

/**
 * Format a raw numeric value for CSV export (no units, full precision).
 */
export function formatRaw(value) {
  if (value == null) return ''
  return String(value)
}

/**
 * Clean domain name for display (remove numeric prefix).
 */
export function domainLabel(domain) {
  if (!domain) return 'Unclassified'
  return domain.replace(/^\d+\.\s*/, '')
}

/**
 * Sort periods chronologically.
 */
export function sortPeriods(periods) {
  return [...periods].sort((a, b) => {
    const ya = parseInt(a.split('-')[0]) || 0
    const yb = parseInt(b.split('-')[0]) || 0
    return ya - yb
  })
}

/**
 * Determine if higher is better for a metric (heuristic based on name/unit).
 */
export function higherIsBetter(name, unit) {
  const n = (name || '').toLowerCase()
  // Lower is better for these
  const lowerBetter = [
    'leakage', 'interruption', 'flooding', 'pollution', 'incident',
    'collapse', 'burst', 'complaint', 'sewer', 'cri',
    'cost', 'expenditure', 'totex', 'capex', 'opex',
    'bill', 'gearing', 'debt',
  ]
  for (const term of lowerBetter) {
    if (n.includes(term)) return false
  }
  // Higher is better for these
  const higherBetter = [
    'wacc', 'return', 'rcv', 'revenue', 'aicr', 'icr',
    'biodiversity', 'bathing', 'satisfaction',
  ]
  for (const term of higherBetter) {
    if (n.includes(term)) return true
  }
  return null // ambiguous
}

/**
 * Company colours for charts — Fox Stephens brand palette.
 */
const COMPANY_COLOURS = [
  '#2E5F7F', '#DA7842', '#34692E', '#489CD0', '#93358F',
  '#65A542', '#1B394C', '#8E451F', '#1E3F1B', '#6b6b6b',
]

export function companyColour(code, index) {
  if (code === 'SVT' || code === 'SVE') return '#F47321'
  return COMPANY_COLOURS[index % COMPANY_COLOURS.length]
}
