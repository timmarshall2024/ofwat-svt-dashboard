import { useMemo, useEffect } from 'react'
import { useKnowledge } from '../hooks/useKnowledge'

const PDF_URLS = {
  'svt-overview': 'https://www.ofwat.gov.uk/wp-content/uploads/2024/12/Overview-of-Severn-Trent-Waters-PR24-final-determination.pdf',
  'aligning-risk-and-return': 'https://www.ofwat.gov.uk/wp-content/uploads/2024/12/PR24-final-determinations-Aligning-risk-and-return-1.pdf',
  'allowed-return-appendix': 'https://www.ofwat.gov.uk/wp-content/uploads/2024/12/PR24-final-determinations-Aligning-risk-and-return-Allowed-return-Appendix.pdf',
  'risk-return-appendix': 'https://www.ofwat.gov.uk/wp-content/uploads/2024/12/PR24-final-determinations-Aligning-risk-and-return-appendix-1.pdf',
  'expenditure-allowances': 'https://www.ofwat.gov.uk/wp-content/uploads/2024/12/9.-PR24-final-determinations-Expenditure-allowances.pdf',
  'expenditure-allowances-amended': 'https://www.ofwat.gov.uk/wp-content/uploads/2024/12/PR24-final-determinations-Expenditure-allowances-1.pdf',
  'base-cost-modelling': 'https://www.ofwat.gov.uk/wp-content/uploads/2024/12/PR24-final-determinations-Expenditure-allowances-Base-cost-modelling-decision-appendix.pdf',
  'enhancement-cost-modelling': 'https://www.ofwat.gov.uk/wp-content/uploads/2024/12/PR24-final-determinations-Expenditure-allowances-Enhancement-cost-modelling-appendix.pdf',
  'thames-gated-allowance': 'https://www.ofwat.gov.uk/wp-content/uploads/2024/12/PR24-final-determinations-Expenditure-allowances-Thames-Water-gated-allowance-appendix.pdf',
  'wacc_buildup': 'https://www.ofwat.gov.uk/wp-content/uploads/2024/12/PR24-final-determinations-Aligning-risk-and-return-Allowed-return-Appendix.pdf',
}

function WACCBuildupTable({ components }) {
  if (!components) return null
  const { cost_of_equity: coe, cost_of_debt: cod, wacc } = components
  const rows = [
    ['Notional gearing', `${components.notional_gearing.value}%`],
    ['Risk-free rate', `${coe.risk_free_rate.point}%`],
    ['Total market return', `${coe.total_market_return.low}% \u2013 ${coe.total_market_return.high}%`],
    ['Equity risk premium', `${coe.market_risk_premium.low}% \u2013 ${coe.market_risk_premium.high}%`],
    ['Raw equity beta', `${coe.raw_equity_beta.low} \u2013 ${coe.raw_equity_beta.high}`],
    ['Re-levered equity beta', `${coe.relevered_equity_beta.low} \u2013 ${coe.relevered_equity_beta.high}`],
    ['Cost of equity', `${coe.cost_of_equity_point.value}%`],
    ['Embedded debt', `${cod.embedded_debt.value}%`],
    ['New debt', `${cod.new_debt.value}%`],
    ['Share of new debt', `${cod.share_of_new_debt.value}%`],
    ['Issuance & liquidity', `${cod.issuance_and_liquidity_costs.value}%`],
    ['Allowed return on debt', `${cod.allowed_return_on_debt.value}%`],
    ['Appointee WACC', `${wacc.appointee_wacc.value}%`],
    ['Retail margin', `${wacc.retail_margin_deduction.value}%`],
    ['Wholesale WACC', `${wacc.wholesale_wacc.value}%`],
  ]
  return (
    <div className="mt-3">
      <h4 className="text-xs font-semibold text-fs-text-muted uppercase tracking-wider mb-2">CAPM Build-up</h4>
      <table className="w-full text-xs">
        <tbody>
          {rows.map(([label, val], i) => (
            <tr key={label} className={i === 12 ? 'border-t-2 border-fs-secondary font-semibold' : 'border-b border-fs-border/50'}>
              <td className="py-1 text-fs-text-muted">{label}</td>
              <td className="py-1 text-right font-mono text-fs-text">{val}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function ContextPanel({ slug, topic, onClose }) {
  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const { data, loading, error } = useKnowledge(slug)

  const topicLower = (topic || '').toLowerCase()

  const relevantNumbers = useMemo(() => {
    if (!data?.key_numbers || !topicLower) return data?.key_numbers?.slice(0, 6) || []
    const matched = data.key_numbers.filter((n) =>
      (n.context || '').toLowerCase().includes(topicLower) ||
      (n.label || '').toLowerCase().includes(topicLower)
    )
    return matched.length > 0 ? matched : data.key_numbers.slice(0, 4)
  }, [data, topicLower])

  const relevantGlossary = useMemo(() => {
    if (!data?.glossary_terms) return []
    if (!topicLower) return data.glossary_terms.slice(0, 5)
    const matched = data.glossary_terms.filter((t) =>
      topicLower.includes(t.term.toLowerCase()) ||
      (t.definition || '').toLowerCase().includes(topicLower)
    )
    return matched.length > 0 ? matched : data.glossary_terms.slice(0, 3)
  }, [data, topicLower])

  const matchedDecision = useMemo(() => {
    if (!data?.key_decisions || !topicLower) return null
    return data.key_decisions.find((d) =>
      (d.decision || '').toLowerCase().includes(topicLower) ||
      (d.detail || '').toLowerCase().includes(topicLower)
    )
  }, [data, topicLower])

  const svtAssessment = data?.svt_assessment
  const svtNotablePCs = data?.svt_notable_pcs
  const isWACC = slug === 'wacc_buildup'
  const waccComponents = data?.components

  return (
    <div className="w-[420px] shrink-0 border-l border-fs-border bg-white overflow-y-auto max-h-[calc(100vh-5rem)]">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-4 border-b border-fs-border pb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-heading font-bold text-fs-primary leading-tight">
              {loading ? 'Loading...' : (data?.document_title || data?.title || slug)}
            </h3>
            {data?.publication_date && (
              <p className="text-xs text-fs-text-muted mt-0.5">Published {data.publication_date}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-2 text-fs-text-muted hover:text-fs-text text-lg leading-none"
            aria-label="Close context panel"
          >
            ×
          </button>
        </div>

        {loading && (
          <div className="flex items-center gap-2 py-8 justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-fs-border border-t-fs-secondary" />
            <span className="text-xs text-fs-text-muted">Loading context...</span>
          </div>
        )}

        {error && (
          <p className="text-xs text-red-600 py-4">Failed to load: {error}</p>
        )}

        {data && !loading && (
          <div className="space-y-4">
            {/* Matched decision (prominent) */}
            {matchedDecision && (
              <div className="rounded-fs-md bg-fs-secondary-light border border-fs-secondary/20 p-3">
                <h4 className="text-xs font-semibold text-fs-secondary uppercase tracking-wider mb-1">Key Decision</h4>
                <p className="text-sm font-heading font-bold text-fs-text">{matchedDecision.decision}</p>
                <p className="text-xs text-fs-text-muted mt-1 leading-relaxed">{matchedDecision.detail}</p>
                {matchedDecision['impact_\u00A3m'] && (
                  <p className="text-xs text-fs-secondary font-medium mt-1">
                    Impact: {matchedDecision['impact_\u00A3m'] >= 1000
                      ? '\u00A3' + (matchedDecision['impact_\u00A3m'] / 1000).toFixed(1) + 'bn'
                      : '\u00A3' + matchedDecision['impact_\u00A3m'] + 'm'}
                  </p>
                )}
              </div>
            )}

            {/* SVT Assessment */}
            {svtAssessment && (
              <div className="rounded-fs-md bg-fs-primary-light border border-fs-primary/20 p-3">
                <h4 className="text-xs font-semibold text-fs-primary uppercase tracking-wider mb-1">SVT Assessment</h4>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center rounded-full bg-fs-primary px-2 py-0.5 text-xs font-semibold text-white">
                    {svtAssessment.overall_rating}
                  </span>
                  <span className="text-xs text-fs-text-muted">QAA reward: {'\u00A3'}{svtAssessment['quality_reward_\u00A3m']}m</span>
                </div>
                <ul className="space-y-0.5">
                  {svtAssessment.strengths?.map((s, i) => (
                    <li key={i} className="text-xs text-fs-text-muted flex gap-1.5">
                      <span className="text-fs-primary shrink-0">·</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Notable PCs */}
            {svtNotablePCs && topicLower && (
              <div>
                <h4 className="text-xs font-semibold text-fs-text-muted uppercase tracking-wider mb-2">Performance Commitments</h4>
                <div className="space-y-1">
                  {svtNotablePCs.filter((pc) =>
                    topicLower.includes(pc.commitment.toLowerCase()) ||
                    pc.commitment.toLowerCase().includes(topicLower)
                  ).slice(0, 3).map((pc) => (
                    <div key={pc.commitment} className="text-xs flex justify-between rounded-fs-sm bg-fs-surface px-2 py-1.5 border border-fs-border/50">
                      <span className="text-fs-text">{pc.commitment}</span>
                      <span className="text-fs-text-muted font-mono">{pc.target}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* WACC buildup table */}
            {isWACC && waccComponents && <WACCBuildupTable components={waccComponents} />}

            {/* Key numbers */}
            {relevantNumbers.length > 0 && !isWACC && (
              <div>
                <h4 className="text-xs font-semibold text-fs-text-muted uppercase tracking-wider mb-2">Key Numbers</h4>
                <div className="space-y-1">
                  {relevantNumbers.map((n, i) => (
                    <div key={i} className="flex items-baseline justify-between text-xs rounded-fs-sm bg-fs-surface px-2 py-1.5 border border-fs-border/50">
                      <span className="text-fs-text-muted flex-1 min-w-0 truncate mr-2">{n.label}</span>
                      <span className="text-fs-primary font-semibold font-mono whitespace-nowrap">
                        {typeof n.value === 'number' ? n.value.toLocaleString() : n.value}
                        {n.unit && <span className="text-fs-text-muted font-normal ml-0.5">{n.unit}</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Glossary */}
            {relevantGlossary.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-fs-text-muted uppercase tracking-wider mb-2">Glossary</h4>
                <dl className="space-y-1.5">
                  {relevantGlossary.map((t) => (
                    <div key={t.term} className="text-xs">
                      <dt className="font-semibold text-fs-text inline">{t.term}: </dt>
                      <dd className="text-fs-text-muted inline">{t.definition}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {/* Key decisions list */}
            {!matchedDecision && data.key_decisions && (
              <div>
                <h4 className="text-xs font-semibold text-fs-text-muted uppercase tracking-wider mb-2">Key Decisions</h4>
                <div className="space-y-2">
                  {data.key_decisions.slice(0, 4).map((d, i) => (
                    <div key={i} className="text-xs rounded-fs-sm bg-fs-surface px-2 py-1.5 border border-fs-border/50">
                      <p className="font-medium text-fs-text">{d.decision}</p>
                      <p className="text-fs-text-muted mt-0.5 leading-relaxed">{d.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Read more link */}
            {PDF_URLS[slug] && (
              <a
                href={PDF_URLS[slug]}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-fs-secondary hover:text-fs-primary font-medium mt-2"
              >
                Read full Ofwat PDF
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
