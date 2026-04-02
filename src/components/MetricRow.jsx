import { memo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatValue, higherIsBetter } from '../utils/formatters'

const COE_REAL_VALUE = 5.10
const COE_NOMINAL_VALUE = 7.06

export default memo(function MetricRow({ metric, onInfoClick }) {
  const {
    canonical_name, svt_value, unit, sector_median, why_it_matters,
    svt_value_secondary, svt_value_secondary_label, svt_value_label,
    rcv_difference_explanation,
  } = metric
  const [secondaryExpanded, setSecondaryExpanded] = useState(false)
  const hasSecondary = svt_value_secondary != null

  const nameLower = (canonical_name || '').toLowerCase()
  const isWACC = nameLower.includes('wacc')
  const isCoE = nameLower.includes('cost of equity')

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

  const arrowColor = comparison
    ? comparison.isGood === true
      ? 'text-fs-success'
      : comparison.isGood === false
        ? 'text-red-600'
        : 'text-fs-text-muted'
    : ''

  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-0 py-1.5 border-b border-[#f0f0f0] hover:bg-[#fafafa] transition-colors group">
      {/* LEFT — Name column */}
      <div className="lg:w-[30%] flex-shrink-0 flex flex-col justify-center">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-medium text-fs-primary leading-snug">
            {canonical_name}
          </span>
          {onInfoClick && (
            <button
              onClick={(e) => { e.stopPropagation(); onInfoClick(metric) }}
              className="w-5 h-5 rounded-full text-fs-border hover:text-fs-secondary hover:bg-fs-secondary-light flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
              aria-label="More info"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}
        </div>
        {hasSecondary && (
          <button
            onClick={() => setSecondaryExpanded(!secondaryExpanded)}
            className="flex items-center gap-1 text-[12px] text-fs-text-muted hover:text-fs-primary transition-colors mt-1 text-left"
          >
            <span>{svt_value_secondary_label || 'FD model'}: {formatValue(svt_value_secondary, unit)}</span>
            <span className="text-[9px]">{secondaryExpanded ? '\u25B2' : '\u25BC'}</span>
          </button>
        )}
      </div>

      {/* MIDDLE — Value column (clickable → Benchmarking) */}
      <div className="lg:w-1/4 lg:min-w-[200px] flex-shrink-0">
        <Link
          to={`/benchmarking/${metric.metric_id}`}
          title="View in Benchmarking"
          className="inline-flex items-baseline gap-1.5 cursor-pointer group/val hover:underline decoration-fs-primary/30 underline-offset-2"
        >
          <span className="text-[15px] leading-none font-bold text-fs-primary font-heading">
            {isCoE ? `${COE_REAL_VALUE}%` : formatValue(svt_value, unit)}
          </span>
          <span className="text-[11px] text-fs-text-muted">{displayUnit}</span>
          <svg className="w-3 h-3 text-fs-primary opacity-0 group-hover/val:opacity-60 transition-opacity -translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
          </svg>
        </Link>
        {hasSecondary && svt_value_label && (
          <div className="text-[10px] text-fs-text-muted">{svt_value_label}</div>
        )}
        {isWACC && (
          <div className="text-[10px] text-fs-text-muted">Nominal equiv. ~6.05%</div>
        )}
        {isCoE && (
          <div className="text-[10px] text-fs-text-muted">Nominal equiv. ~{COE_NOMINAL_VALUE}%</div>
        )}
        {sector_median != null && !isCoE && (
          <div className="flex items-center gap-1 text-[11px]" style={{ marginTop: 1 }}>
            {comparison && (
              <span className={`font-medium ${arrowColor}`}>
                {comparison.above ? '\u25B2' : '\u25BC'}
              </span>
            )}
            <span className="text-fs-text-muted">
              Sector: {formatValue(sector_median, unit)}
            </span>
          </div>
        )}
      </div>

      {/* RIGHT — Description column */}
      <div className="lg:w-[45%] flex flex-col justify-center">
        {why_it_matters && (
          <p className="text-[12px] text-[#4a4a4a] leading-[1.4]">
            {why_it_matters}
          </p>
        )}
        {hasSecondary && secondaryExpanded && rcv_difference_explanation && (
          <p className="text-[11px] text-fs-text-muted italic leading-relaxed mt-1.5">
            {rcv_difference_explanation}
          </p>
        )}
      </div>
    </div>
  )
})
