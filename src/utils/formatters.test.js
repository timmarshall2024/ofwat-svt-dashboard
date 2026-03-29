import { describe, it, expect } from 'vitest'
import {
  formatValue,
  formatHeadline,
  formatRaw,
  domainLabel,
  sortPeriods,
  higherIsBetter,
  companyColour,
} from './formatters'

describe('formatValue', () => {
  it('returns dash for null/undefined', () => {
    expect(formatValue(null)).toBe('\u2014')
    expect(formatValue(undefined)).toBe('\u2014')
    expect(formatValue('')).toBe('\u2014')
  })

  it('formats percentages from decimals', () => {
    expect(formatValue(0.04, '%')).toBe('4.00%')
    expect(formatValue(0.0403, '% RoRE')).toBe('4.03%')
  })

  it('formats percentages from whole numbers', () => {
    expect(formatValue(55, '%')).toBe('55.00%')
  })

  it('formats currency in millions', () => {
    expect(formatValue(150, '\u00a3m')).toBe('\u00a3150.0m')
    expect(formatValue(14917, '\u00a3m')).toBe('\u00a314.92bn')
    expect(formatValue(0.5, '\u00a3m')).toBe('\u00a3500k')
  })

  it('formats per-customer bills', () => {
    expect(formatValue(463.57, '\u00a3 / customer')).toBe('\u00a3463.57')
  })

  it('formats megalitres per day', () => {
    expect(formatValue(289.7, 'Ml/d')).toBe('289.7 Ml/d')
  })

  it('formats ratios', () => {
    expect(formatValue(1.23, 'ratio')).toBe('1.23')
    expect(formatValue(5.678, 'nr')).toBe('5.68')
  })

  it('returns string representation for non-numeric values', () => {
    expect(formatValue('text')).toBe('text')
  })
})

describe('formatHeadline', () => {
  it('returns dash for null', () => {
    expect(formatHeadline(null)).toBe('\u2014')
  })

  it('formats headline percentages', () => {
    expect(formatHeadline(0.0403, '%')).toBe('4.03%')
  })

  it('formats headline currency', () => {
    expect(formatHeadline(14917, '\u00a3m')).toBe('\u00a314.9bn')
    expect(formatHeadline(150, '\u00a3m')).toBe('\u00a3150m')
  })

  it('formats per-customer headline', () => {
    expect(formatHeadline(463.57, '\u00a3 / customer')).toBe('\u00a3464')
  })
})

describe('formatRaw', () => {
  it('returns empty string for null', () => {
    expect(formatRaw(null)).toBe('')
  })

  it('returns string of value', () => {
    expect(formatRaw(42)).toBe('42')
    expect(formatRaw(3.14)).toBe('3.14')
  })
})

describe('domainLabel', () => {
  it('strips numeric prefix', () => {
    expect(domainLabel('1. Cost Assessment')).toBe('Cost Assessment')
    expect(domainLabel('12. Risk & Return')).toBe('Risk & Return')
  })

  it('returns Unclassified for falsy input', () => {
    expect(domainLabel(null)).toBe('Unclassified')
    expect(domainLabel('')).toBe('Unclassified')
  })

  it('returns label unchanged if no prefix', () => {
    expect(domainLabel('Performance')).toBe('Performance')
  })
})

describe('sortPeriods', () => {
  it('sorts periods chronologically', () => {
    const periods = ['2029-30', '2025-26', '2027-28']
    expect(sortPeriods(periods)).toEqual(['2025-26', '2027-28', '2029-30'])
  })

  it('handles empty array', () => {
    expect(sortPeriods([])).toEqual([])
  })
})

describe('higherIsBetter', () => {
  it('returns false for cost/leakage metrics', () => {
    expect(higherIsBetter('Total leakage')).toBe(false)
    expect(higherIsBetter('Total expenditure')).toBe(false)
    expect(higherIsBetter('Household bill')).toBe(false)
    expect(higherIsBetter('Pollution incidents')).toBe(false)
  })

  it('returns true for return/RCV metrics', () => {
    expect(higherIsBetter('Allowed return on capital')).toBe(true)
    expect(higherIsBetter('WACC')).toBe(true)
    expect(higherIsBetter('RCV end of period')).toBe(true)
  })

  it('returns null for ambiguous metrics', () => {
    expect(higherIsBetter('Some unknown metric')).toBeNull()
  })
})

describe('companyColour', () => {
  it('returns orange for SVT/SVE', () => {
    expect(companyColour('SVT', 0)).toBe('#F47321')
    expect(companyColour('SVE', 5)).toBe('#F47321')
  })

  it('returns palette colours for other companies', () => {
    const colour = companyColour('ANH', 0)
    expect(colour).toBe('#2E5F7F')
    expect(colour).not.toBe('#F47321')
  })

  it('wraps around palette for high indices', () => {
    const c1 = companyColour('ANH', 0)
    const c2 = companyColour('ANH', 10)
    expect(c1).toBe(c2)
  })
})
