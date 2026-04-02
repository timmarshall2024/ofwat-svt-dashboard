import { useState, useEffect, useMemo } from 'react'
import { useData } from '../context/DataContext'
import usePageTitle from '../hooks/usePageTitle'
import LoadingSpinner from '../components/LoadingSpinner'
import ContextPanel from '../components/ContextPanel'
import { chartTheme } from '../styles/chartTheme'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LabelList, ReferenceLine,
} from 'recharts'

/**
 * The five companies that referred their PR24 Final Determinations to the CMA,
 * plus SVT (which accepted).
 * Updated March 2026: actual CMA referral companies were ANH, NES, SEW, SRN, WSX.
 */
const CMA_CODES = ['ANH', 'NES', 'SEW', 'SRN', 'WSX']
const ALL_CODES = ['SVE', ...CMA_CODES]

const COMPANY_NAMES = {
  SVE: 'Severn Trent (SVE)',
  ANH: 'Anglian (ANH)',
  NES: 'Northumbrian (NES)',
  SEW: 'South East (SEW)',
  SRN: 'Southern (SRN)',
  WSX: 'Wessex (WSX)',
}

const CMA_OUTCOMES = {
  ANH: { badge: 'CMA: improved', color: '#16a34a' },
  NES: { badge: 'CMA: confirmed', color: '#9ca3af' },
  SEW: { badge: 'CMA: improved', color: '#16a34a' },
  SRN: { badge: 'CMA: improved', color: '#16a34a' },
  WSX: { badge: 'CMA: improved', color: '#16a34a' },
}

const CMA_COLOUR = '#2E5F7F'
const SVT_COLOUR = chartTheme.svtColor

/**
 * Static head-to-head data extracted from the Ofwat FD models database.
 * Where multiple values exist per company (e.g. from company vs Ofwat views),
 * we use the Ofwat FD view as the canonical value.
 */
const HEAD_TO_HEAD = [
  {
    category: 'Accepted FD?',
    metrics: [
      {
        label: 'Response to Ofwat FD',
        unit: '',
        values: { SVE: 'Accepted', ANH: 'Referred', NES: 'Referred', SEW: 'Referred', SRN: 'Referred', WSX: 'Referred' },
        lowerIsBetter: null,
        isStatus: true,
      },
    ],
  },
  {
    category: 'Customer Bills',
    metrics: [
      {
        label: 'Avg household bill 2025-26',
        unit: '\u00A3',
        values: { SVE: 463, ANH: 547, NES: 519, SEW: 260, SRN: 495, WSX: 531 },
        lowerIsBetter: true,
      },
      {
        label: 'Avg household bill 2029-30',
        unit: '\u00A3',
        values: { SVE: 583, ANH: 631, NES: 585, SEW: 287, SRN: 611, WSX: 607 },
        lowerIsBetter: true,
      },
    ],
  },
  {
    category: 'Financial',
    metrics: [
      {
        label: 'Appointee WACC (real)',
        unit: '%',
        values: { SVE: 4.03, ANH: 4.20, NES: 4.20, SEW: 4.20, SRN: 4.20, WSX: 4.20 },
        lowerIsBetter: null,
        note: 'SVT: Ofwat FD 4.03%. CMA companies: revised to 4.20% by CMA.',
      },
      {
        label: 'Notional gearing',
        unit: '%',
        values: { SVE: 55, ANH: 55, NES: 55, SEW: 55, SRN: 55, WSX: 55 },
        lowerIsBetter: null,
        note: 'Regulatory assumption — unchanged by CMA',
      },
    ],
  },
  {
    category: 'Operational Performance (2029-30 targets)',
    metrics: [
      {
        label: 'Leakage',
        unit: 'Ml/d',
        values: { SVE: 289.7, ANH: 168.2, NES: 156.3, SEW: 70.5, SRN: 72.4, WSX: 57.1 },
        lowerIsBetter: true,
        note: 'Absolute levels; scale reflects company size',
      },
      {
        label: 'Per capita consumption',
        unit: 'l/p/d',
        values: { SVE: 121.2, ANH: 123.5, NES: 133.7, SEW: 124.7, SRN: 122.8, WSX: 127.4 },
        lowerIsBetter: true,
      },
      {
        label: 'Supply interruptions',
        unit: 'mins',
        values: { SVE: 5.0, ANH: 5.0, NES: 4.1, SEW: 5.0, SRN: 7.5, WSX: 5.0 },
        lowerIsBetter: true,
        note: 'Avg minutes lost per property per year',
      },
    ],
  },
  {
    category: 'ODI Incentives',
    metrics: [
      {
        label: 'C-MeX outperformance cap',
        unit: '\u00A3m',
        values: { SVE: 3.36, ANH: 2.71, NES: 1.43, SEW: 0.42, SRN: 1.85, WSX: 0.75 },
        lowerIsBetter: false,
        note: 'Maximum reward for customer service excellence',
      },
    ],
  },
  {
    category: 'Environmental (2029-30)',
    metrics: [
      {
        label: 'GHG emissions (water)',
        unit: 'tCO\u2082e',
        values: { SVE: 211514, ANH: 114771, NES: 92851, SEW: 46124, SRN: 68710, WSX: 37230 },
        lowerIsBetter: true,
        note: 'Absolute; scale reflects company size',
      },
      {
        label: 'GHG emissions (wastewater)',
        unit: 'tCO\u2082e',
        values: { SVE: 426678, ANH: 273787, NES: 97062, SEW: 46124, SRN: 174500, WSX: 95600 },
        lowerIsBetter: true,
        note: 'Absolute; scale reflects company size',
      },
    ],
  },
]

/**
 * Scatter chart data: bills (x) vs leakage reduction ambition (y).
 * PCC reduction % from baseline is a good measure of ambition.
 */
const SCATTER_DATA = [
  { code: 'SVE', name: 'Severn Trent (SVE)', bill: 583, pccReduction: 8.6 },
  { code: 'ANH', name: 'Anglian (ANH)', bill: 631, pccReduction: 11.1 },
  { code: 'NES', name: 'Northumbrian (NES)', bill: 585, pccReduction: 9.7 },
  { code: 'SEW', name: 'South East (SEW)', bill: 287, pccReduction: 9.1 },
  { code: 'SRN', name: 'Southern (SRN)', bill: 611, pccReduction: 7.8 },
  { code: 'WSX', name: 'Wessex (WSX)', bill: 607, pccReduction: 6.0 },
].filter((d) => d.bill != null)

function fmt(val, unit) {
  if (val == null) return 'n/a'
  if (typeof val === 'string') return val
  if (unit === '\u00A3') return '\u00A3' + Math.round(val).toLocaleString('en-GB')
  if (unit === '%') return val.toFixed(2) + '%'
  if (unit === '\u00A3m') return '\u00A3' + val.toFixed(2) + 'm'
  if (unit === 'Ml/d') return val.toFixed(1) + ' Ml/d'
  if (unit === 'l/p/d') return val.toFixed(1) + ' l/p/d'
  if (unit === 'mins') return val.toFixed(1) + ' mins'
  if (unit.includes('CO')) return Math.round(val).toLocaleString('en-GB') + ' t'
  return String(val)
}

function rankColour(rank, total, lowerIsBetter) {
  if (lowerIsBetter == null) return ''
  if (rank === 1) return 'text-green-700 font-semibold'
  if (rank === total) return 'text-red-600 font-semibold'
  return ''
}

function ScatterTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div className="rounded-fs-sm border border-fs-border bg-white px-3 py-2 shadow-fs text-xs">
      <div className="font-bold text-fs-text">{d.name}</div>
      <div className="text-fs-text-muted mt-1">Bill 2029-30: {'\u00A3'}{d.bill}</div>
      <div className="text-fs-text-muted">PCC reduction: {d.pccReduction}%</div>
    </div>
  )
}

export default function SVTvsCMA() {
  usePageTitle('SVT vs CMA')
  const { loading } = useData()
  const [contextSlug, setContextSlug] = useState(null)
  const [contextTopic, setContextTopic] = useState(null)

  if (loading) return <LoadingSpinner message="Loading CMA comparison..." />

  return (
    <div className="flex gap-0">
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl font-heading font-bold text-fs-primary mb-1">
          SVT vs CMA Five
        </h1>
        <p className="text-sm text-fs-text-muted mb-6">
          Comparing Severn Trent against the five companies that referred their PR24 Final Determinations to the CMA
        </p>

        {/* Context banner */}
        <div className="mb-8 rounded-fs-md border-l-4 border-fs-secondary bg-fs-secondary-light px-4 py-3">
          <div className="flex flex-wrap items-start gap-x-6 gap-y-2">
            <div className="flex-1 min-w-[280px]">
              <h2 className="text-sm font-heading font-bold text-fs-text mb-1">
                Why this matters
              </h2>
              <p className="text-xs text-fs-text-muted leading-relaxed">
                Five water companies — Anglian, Northumbrian, South East, Southern, and Wessex —
                rejected Ofwat's PR24 Final Determination and referred to the Competition and Markets
                Authority (CMA) for redetermination. Severn Trent accepted. The CMA published its
                final redeterminations on 10 March 2026, awarding £463m of additional revenues (17%
                of the £2.7bn sought) and increasing the WACC from 4.03% to 4.20%.
              </p>
            </div>
            <div className="shrink-0 flex flex-col gap-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: SVT_COLOUR }} />
                <span className="text-fs-text font-medium">SVT — Accepted FD</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: CMA_COLOUR }} />
                <span className="text-fs-text font-medium">CMA Five — Referred</span>
              </div>
              <button
                onClick={() => {
                  setContextSlug('aligning-risk-and-return')
                  setContextTopic('CMA referral')
                }}
                className="text-left text-fs-secondary hover:underline mt-1"
              >
                Read regulatory context →
              </button>
            </div>
          </div>
        </div>

        {/* Head-to-head metric tables */}
        {HEAD_TO_HEAD.map((group) => (
          <div key={group.category} className="mb-6">
            <h2 className="text-base font-heading font-bold text-fs-text mb-3">
              {group.category}
            </h2>
            <div className="overflow-x-auto rounded-fs-md border border-fs-border shadow-fs">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-fs-primary text-white">
                    <th className="text-left px-3 py-2 font-medium">Metric</th>
                    {ALL_CODES.map((code) => (
                      <th
                        key={code}
                        className={`text-right px-3 py-2 font-medium ${
                          code === 'SVE' ? 'bg-fs-primary-dark' : ''
                        }`}
                      >
                        <div>{COMPANY_NAMES[code]}</div>
                        {code === 'SVE' && (
                          <span className="inline-block mt-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-green-500 text-white font-normal">
                            Accepted FD
                          </span>
                        )}
                        {CMA_OUTCOMES[code] && (
                          <span
                            className="inline-block mt-0.5 text-[9px] px-1.5 py-0.5 rounded-full text-white font-normal"
                            style={{ background: CMA_OUTCOMES[code].color }}
                          >
                            {CMA_OUTCOMES[code].badge}
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {group.metrics.map((metric, mi) => {
                    // Compute ranks
                    const entries = ALL_CODES.map((c) => ({
                      code: c,
                      val: metric.values[c],
                    })).filter((e) => e.val != null)

                    const sorted = [...entries].sort((a, b) =>
                      metric.lowerIsBetter ? a.val - b.val : b.val - a.val
                    )
                    const ranks = {}
                    sorted.forEach((e, i) => { ranks[e.code] = i + 1 })

                    return (
                      <tr
                        key={metric.label}
                        className={mi % 2 === 0 ? 'bg-white' : 'bg-fs-surface-alt'}
                      >
                        <td className="px-3 py-2 text-fs-text">
                          <div>{metric.label}</div>
                          {metric.note && (
                            <div className="text-[10px] text-fs-text-muted mt-0.5">{metric.note}</div>
                          )}
                        </td>
                        {ALL_CODES.map((code) => {
                          const val = metric.values[code]
                          const isStatusRow = metric.isStatus
                          return (
                            <td
                              key={code}
                              className={`text-right px-3 py-2 tabular-nums ${
                                code === 'SVE' ? 'bg-fs-secondary-light font-medium' : ''
                              } ${isStatusRow
                                ? (val === 'Accepted' ? 'text-green-700 font-semibold' : 'text-amber-600 font-semibold')
                                : rankColour(ranks[code], entries.length, metric.lowerIsBetter)
                              }`}
                            >
                              {fmt(val, metric.unit)}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {/* Scatter chart: Bill vs PCC Reduction */}
        <div className="mb-8">
          <h2 className="text-base font-heading font-bold text-fs-text mb-1">
            Bill Level vs Demand Reduction Ambition
          </h2>
          <p className="text-xs text-fs-text-muted mb-4">
            2029-30 average household bill ({'\u00A3'}) vs per capita consumption reduction from 2019-20 baseline (%).
            Higher PCC reduction indicates greater demand management ambition.
          </p>
          <div className="rounded-fs-md border border-fs-border bg-white p-4 shadow-fs">
            <ResponsiveContainer width="100%" height={360}>
              <ScatterChart margin={{ top: 20, right: 40, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
                <XAxis
                  type="number"
                  dataKey="bill"
                  name="Bill"
                  domain={['dataMin - 30', 'dataMax + 30']}
                  tickFormatter={(v) => '\u00A3' + v}
                  label={{ value: 'Avg household bill 2029-30 (\u00A3)', position: 'bottom', offset: 0, style: { fontSize: 11, fill: '#6b6b6b' } }}
                  tick={{ fontSize: 11, fill: '#6b6b6b' }}
                />
                <YAxis
                  type="number"
                  dataKey="pccReduction"
                  name="PCC reduction"
                  domain={[0, 'dataMax + 2']}
                  tickFormatter={(v) => v + '%'}
                  label={{ value: 'PCC reduction from baseline (%)', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 11, fill: '#6b6b6b' } }}
                  tick={{ fontSize: 11, fill: '#6b6b6b' }}
                />
                <Tooltip content={<ScatterTooltip />} />
                {/* CMA companies */}
                <Scatter
                  data={SCATTER_DATA.filter((d) => d.code !== 'SVE')}
                  fill={CMA_COLOUR}
                  shape="circle"
                  r={7}
                >
                  <LabelList
                    dataKey="name"
                    position="top"
                    offset={10}
                    style={{ fontSize: 10, fill: '#6b6b6b', fontWeight: 500 }}
                  />
                </Scatter>
                {/* SVT */}
                <Scatter
                  data={SCATTER_DATA.filter((d) => d.code === 'SVE')}
                  fill={SVT_COLOUR}
                  shape="diamond"
                  r={9}
                >
                  <LabelList
                    dataKey="name"
                    position="top"
                    offset={12}
                    style={{ fontSize: 11, fill: SVT_COLOUR, fontWeight: 700 }}
                  />
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Key takeaways */}
        <div className="mb-8 rounded-fs-md border border-fs-border bg-white p-5 shadow-fs">
          <h2 className="text-base font-heading font-bold text-fs-text mb-3">Key Takeaways</h2>
          <ul className="space-y-2 text-sm text-fs-text">
            <li className="flex gap-2">
              <span className="shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full bg-fs-secondary" />
              <span>
                <strong>WACC divergence:</strong> SVT retains the Ofwat FD WACC of 4.03%. The CMA increased
                the WACC to 4.20% for the five referred companies — a 17 basis point premium reflecting
                updated market evidence on the cost of capital.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full bg-fs-secondary" />
              <span>
                <strong>Bill levels:</strong> SVT's 2029-30 bill ({'\u00A3'}583) sits mid-pack among the WaSCs.
                South East Water ({'\u00A3'}287) is a water-only company with a structurally lower bill.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full bg-fs-secondary" />
              <span>
                <strong>PCC ambition:</strong> SVT targets an 8.6% reduction from baseline — above the CMA
                group median, reflecting Ofwat's recognition of SVT's "Outstanding" plan quality.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full bg-fs-secondary" />
              <span>
                <strong>C-MeX incentive:</strong> SVT has the highest outperformance cap ({'\u00A3'}3.36m), consistent
                with its large customer base and strong service record.
              </span>
            </li>
          </ul>
        </div>
        {/* CMA Redetermination Summary */}
        <div className="mb-8 rounded-fs-md border border-fs-border bg-white p-5 shadow-fs">
          <h2 className="text-base font-heading font-bold text-fs-text mb-3">CMA Redetermination — March 2026</h2>
          <div className="space-y-3 text-sm text-fs-text leading-relaxed">
            <p>
              The Competition and Markets Authority published its final redeterminations on 10 March 2026
              for the five water companies that referred their PR24 Final Determinations. The CMA awarded
              £463 million of additional revenues — only 17% of the combined £2.7 billion the companies
              sought — and rejected the majority of claims around cost allowances and performance targets.
              The most significant change was an increase in the appointee WACC from 4.03% to 4.20%,
              reflecting updated market evidence on the cost of capital.
            </p>
            <p>
              For SVT, which accepted Ofwat's FD and was not part of the CMA process, the implications
              are nuanced. SVT retains the original 4.03% WACC — 17 basis points below the CMA companies.
              While this means a lower allowed return in the short term, SVT avoided the costs and
              uncertainty of the 15-month CMA process, maintained regulatory goodwill from its "Outstanding"
              plan quality rating, and can focus fully on AMP8 delivery. The sector-wide signal is that
              the CMA broadly endorsed Ofwat's approach, with adjustments at the margin.
            </p>
          </div>
        </div>
      </div>

      {contextSlug && (
        <ContextPanel slug={contextSlug} topic={contextTopic} onClose={() => {
          setContextSlug(null)
          setContextTopic(null)
        }} />
      )}
    </div>
  )
}
