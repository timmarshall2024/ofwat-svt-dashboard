import { memo, useState } from 'react'
import { formatValue, higherIsBetter } from '../utils/formatters'

const WACC_NOMINAL_TOOLTIP =
  'Derived from equity (7.06%) and debt (5.21%) components at 55% gearing. Not stored as a single Ofwat metric.'

const COE_TOOLTIP =
  'Source: Ofwat PR24 allowed return appendix. Not stored as a standalone DB metric \u2014 derived from CAPM build-up in the allowed return appendix.'

// Cost of equity: DB metric is wrong (equity issuance £m, not CoE rate).
// Override with the true value from wacc_buildup.json (CAPM table 1).
const COE_REAL_VALUE = 5.10
const COE_NOMINAL_VALUE = 7.06

function InfoIcon({ size = 3 }) {
  return (
    <svg className={`w-${size} h-${size} text-fs-border`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

export default memo(function MetricCard({ metric, onInfoClick }) {
  const { canonical_name, svt_value, unit, sector_median, why_it_matters,
    svt_value_secondary, svt_value_secondary_label, svt_value_label,
    rcv_difference_explanation } = metric
  const [secondaryExpanded, setSecondaryExpanded] = useState(false)
  const hasSecondary = svt_value_secondary != null

  const nameLower = (canonical_name || '').toLowerCase()
  const isWACC = nameLower.includes('wacc')
  const isCoE = nameLower.includes('cost of equity')

  // Override display value for Cost of Equity
  const displayValue = isCoE ? COE_REAL_VALUE / 100 : svt_value
  const displayUnit = isCoE ? '%' : unit

  const hib = higherIsBetter(canonical_name, displayUnit)
  let comparison = null
  if (displayValue != null && sector_median != null && sector_median !== 0) {
    const diff = displayValue - sector_median
    if (Math.abs(diff) > 1e-6) {
      const above = diff > 0
      let isGood = null
      if (hib === true) isGood = above
      else if (hib === false) isGood = !above
      comparison = { above, isGood }
    }
  }

  return (
    <div className="rounded-fs-md border border-fs-border bg-fs-surface p-4 shadow-fs hover:shadow-fs-md transition-shadow relative group">
      {onInfoClick && (
        <button
          onClick={(e) => { e.stopPropagation(); onInfoClick(metric) }}
          className="absolute top-2 right-2 w-6 h-6 rounded-full text-fs-border hover:text-fs-secondary hover:bg-fs-secondary-light flex items-center justify-center text-xs transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Why this number?"
          title={isCoE ? COE_TOOLTIP : 'Why this number?'}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      )}
      <h4 className="text-sm font-heading font-bold text-fs-text leading-tight mb-2 line-clamp-2 pr-6">
        {canonical_name}
      </h4>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl font-bold text-fs-primary font-heading">
          {isCoE ? `${COE_REAL_VALUE}%` : formatValue(svt_value, unit)}
        </span>
        <span className="text-xs text-fs-text-muted">{displayUnit}</span>
      </div>
      {hasSecondary && svt_value_label && (
        <div className="text-[10px] text-fs-text-muted mb-1">{svt_value_label}</div>
      )}
      {hasSecondary && (
        <div className="mb-2">
          <button
            onClick={() => setSecondaryExpanded(!secondaryExpanded)}
            className="flex items-center gap-1.5 text-xs text-fs-text-muted hover:text-fs-primary transition-colors"
          >
            <span>{svt_value_secondary_label || 'FD model'}: {formatValue(svt_value_secondary, unit)}</span>
            <span className="text-[10px]">{secondaryExpanded ? '▲' : '▼'}</span>
          </button>
          <div
            className="overflow-hidden transition-all duration-200 ease-in-out"
            style={{ maxHeight: secondaryExpanded ? 120 : 0, opacity: secondaryExpanded ? 1 : 0 }}
          >
            {rcv_difference_explanation && (
              <p className="text-[11px] text-fs-text-muted italic leading-relaxed mt-1.5 pr-1">
                {rcv_difference_explanation}
              </p>
            )}
          </div>
        </div>
      )}
      {isWACC && (
        <div className="flex items-center gap-1 text-xs text-fs-text-muted mb-1" title={WACC_NOMINAL_TOOLTIP}>
          <span>Nominal equiv. ~6.05%</span>
          <InfoIcon />
        </div>
      )}
      {isCoE && (
        <div className="flex items-center gap-1 text-xs text-fs-text-muted mb-1" title={COE_TOOLTIP}>
          <span>Nominal equiv. ~{COE_NOMINAL_VALUE}%</span>
          <InfoIcon />
        </div>
      )}
      {sector_median != null && !isCoE && (
        <div className="flex items-center gap-1.5 text-xs mb-2">
          <span className="text-fs-text-muted">Sector median:</span>
          <span className="text-fs-text font-medium">
            {formatValue(sector_median, unit)}
          </span>
          {comparison && (
            <span
              className={`font-medium ${
                comparison.isGood === true
                  ? 'text-fs-success'
                  : comparison.isGood === false
                  ? 'text-red-600'
                  : 'text-fs-text-muted'
              }`}
            >
              {comparison.above ? '\u25B2' : '\u25BC'}
            </span>
          )}
        </div>
      )}
      {why_it_matters && (
        <p className="text-xs text-fs-text-muted leading-relaxed line-clamp-2">
          {why_it_matters}
        </p>
      )}
    </div>
  )
})
