import { useState, useEffect, useMemo } from 'react'
import usePageTitle from '../hooks/usePageTitle'
import {
  ComposedChart, Area, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, PieChart, Pie, Cell,
  Legend,
} from 'recharts'

const GREEN = '#005030'
const AMBER = '#F47321'
const BLUE = '#1d4ed8'
const GREY = '#9ca3af'
const LIGHT_GREEN = 'rgba(0, 80, 48, 0.15)'

const AMP_BOUNDARIES = [
  { x: '2009-10', label: 'AMP4' },
  { x: '2014-15', label: 'AMP5' },
  { x: '2019-20', label: 'AMP6' },
  { x: '2024-25', label: 'AMP7' },
  { x: '2029-30', label: 'AMP8' },
]

const EVENT_ANNOTATIONS = [
  { x: '2019-20', label: 'PR19 FD' },
  { x: '2024-25', label: 'PR24 FD' },
  { x: '2025-26', label: 'CMA report' },
]

const EXPLANATIONS = {
  opening: {
    title: 'Opening RCV',
    desc: 'The regulatory capital value at the start of the year, carried forward from the prior year\'s closing RCV. This is the baseline against which all in-year movements are measured.',
    driver: 'Regulatory — determined by Ofwat\'s prior-year closing RCV.',
    direction: 'neutral',
  },
  indexation: {
    title: 'Indexation',
    desc: 'Annual inflation adjustment applied to the RCV to maintain its real value. Since AMP7, Ofwat uses CPIH; prior periods used RPI.',
    driver: 'External — driven by macroeconomic inflation, outside management control.',
    direction: 'positive',
  },
  additions: {
    title: 'RCV Additions',
    desc: 'New capital investment added to the RCV, calculated as the non-PAYG (pay-as-you-go) share of allowed totex. This is the primary way management grows the asset base.',
    driver: 'Management / Regulatory — driven by capex delivery against Ofwat\'s totex allowance.',
    direction: 'positive',
  },
  depreciation: {
    title: 'Depreciation (RCV Run-off)',
    desc: 'The annual return of capital to investors through customer bills. Ofwat sets the run-off rate, which determines the pace at which the RCV is recovered.',
    driver: 'Regulatory — Ofwat sets the RCV run-off rate at each price review.',
    direction: 'negative',
  },
  closing: {
    title: 'Closing RCV',
    desc: 'The regulatory capital value at year end, after all in-year movements. This is carried forward as the opening RCV for the next year.',
    driver: 'Calculated — the sum of opening RCV plus all in-year movements.',
    direction: 'neutral',
  },
}

const DONUT_COLORS = [GREEN, '#1a7a50', '#4da680', '#80c9a6']
const DONUT_DRIVERS = {
  'Water Resources': 'Reservoir & treatment infrastructure',
  'Water Network+': 'Distribution mains, meters & connections',
  'Wastewater Network+': 'Sewer network & treatment works',
  'Bioresources': 'Sludge treatment & energy recovery',
}

function fmt(v, dp = 1) {
  if (v == null) return '—'
  return v.toFixed(dp)
}

function fmtBn(v) {
  if (v == null) return '—'
  return `£${(v / 1000).toFixed(1)}bn`
}

export default function RCVJourney() {
  usePageTitle('RCV Journey')
  const [annualData, setAnnualData] = useState(null)
  const [amp8Data, setAmp8Data] = useState(null)
  const [pcData, setPcData] = useState(null)
  const [ampSummary, setAmpSummary] = useState(null)
  const [selectedBar, setSelectedBar] = useState(null)
  const [viewMode, setViewMode] = useState('nominal')
  const [showComponents, setShowComponents] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/data/rcv_history_annual.json').then(r => r.json()),
      fetch('/data/rcv_amp8_detail.json').then(r => r.json()),
      fetch('/data/rcv_price_control_split.json').then(r => r.json()),
      fetch('/data/rcv_history_amp_summary.json').then(r => r.json()),
    ]).then(([annual, amp8, pc, summary]) => {
      setAnnualData(annual)
      setAmp8Data(amp8)
      setPcData(pc)
      setAmpSummary(summary)
    })
  }, [])

  const amp8Avg = useMemo(() => {
    if (!amp8Data) return null
    const yrs = amp8Data.years
    const avgAdditions = null // not available in bridge for AMP8
    const opening = yrs[0].rcv_nominal.total
    const closing = yrs[yrs.length - 1].rcv_nominal.total
    return { opening, closing, growth: closing - opening, growthPct: ((closing / opening - 1) * 100) }
  }, [amp8Data])

  const chartData = useMemo(() => {
    if (!annualData) return []
    return annualData.map(d => ({
      year: d.year,
      closingBn: d.closing_rcv ? d.closing_rcv / 1000 : null,
      closingRealBn: d.closing_rcv_real ? d.closing_rcv_real / 1000 : (d.closing_rcv ? d.closing_rcv / 1000 : null),
      additions: d.rcv_additions ? Math.abs(d.rcv_additions) / 1000 : null,
      depreciation: d.depreciation ? Math.abs(d.depreciation) / 1000 : null,
      indexation: d.indexation ? d.indexation / 1000 : null,
      isProjection: d.is_projection,
      amp: d.amp_period,
    }))
  }, [annualData])

  const actualsData = useMemo(() => chartData.filter(d => !d.isProjection), [chartData])
  const projectionsData = useMemo(() => chartData.filter(d => d.isProjection), [chartData])

  // Waterfall bar data for Section A (use AMP7 2024-25 as example year since it has full bridge)
  const waterfallYear = useMemo(() => {
    if (!annualData) return null
    // Find a year with complete bridge data, preferring recent
    const candidates = annualData.filter(d => d.opening_rcv && d.rcv_additions && d.depreciation && !d.is_projection)
    return candidates.length > 0 ? candidates[candidates.length - 1] : null
  }, [annualData])

  if (!annualData || !amp8Data || !pcData) {
    return <div className="flex items-center justify-center h-64 text-fs-text-muted">Loading RCV data...</div>
  }

  const waterfallBars = waterfallYear ? [
    { key: 'opening', label: 'Opening RCV', value: waterfallYear.opening_rcv, color: GREY, cumulative: 0 },
    { key: 'indexation', label: '+ Indexation', value: waterfallYear.indexation || 0, color: BLUE, cumulative: waterfallYear.opening_rcv },
    { key: 'additions', label: '+ RCV Additions', value: waterfallYear.rcv_additions || 0, color: GREEN, cumulative: waterfallYear.opening_rcv + (waterfallYear.indexation || 0) },
    { key: 'depreciation', label: '- Depreciation', value: waterfallYear.depreciation || 0, color: AMBER, cumulative: waterfallYear.opening_rcv + (waterfallYear.indexation || 0) + (waterfallYear.rcv_additions || 0) },
    { key: 'closing', label: 'Closing RCV', value: waterfallYear.closing_rcv, color: GREY, cumulative: 0 },
  ] : []

  // SVG waterfall dimensions
  const svgW = 800, svgH = 300, padL = 60, padR = 20, padT = 40, padB = 50
  const barW = (svgW - padL - padR) / waterfallBars.length
  const maxVal = waterfallYear ? Math.max(waterfallYear.opening_rcv, waterfallYear.closing_rcv) * 1.1 : 1
  const scale = (v) => padT + (svgH - padT - padB) * (1 - v / maxVal)

  // AMP boundary x positions for chart
  const ampBoundaryYears = ['2009-10', '2014-15', '2019-20', '2024-25']

  // Stat strip
  const amp8Opening = amp8Data.years[0].rcv_nominal.total
  const amp8Closing = amp8Data.years[amp8Data.years.length - 1].rcv_nominal.total
  const amp8Growth = amp8Closing - amp8Opening
  const amp8GrowthPct = (amp8Closing / amp8Opening - 1) * 100

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-heading font-bold text-fs-primary mb-1">RCV Journey</h1>
        <p className="text-sm text-fs-text-muted">
          How Severn Trent Water's Regulatory Capital Value has evolved from AMP4 to AMP8
        </p>
      </div>

      {/* ── SECTION A: RCV Mechanics Explainer ── */}
      <section>
        <h2 className="text-lg font-heading font-bold text-fs-text mb-4">How does RCV move in a year?</h2>
        {waterfallYear && (
          <>
            <p className="text-xs text-fs-text-muted mb-3">
              Example year: {waterfallYear.year} ({waterfallYear.indexation_basis} indexed). Click any bar for an explanation.
            </p>
            <div className="overflow-x-auto">
              <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-[800px]" style={{ minWidth: 500 }}>
                {/* Y axis labels */}
                {[0, 2000, 4000, 6000, 8000, 10000, 12000, 14000].filter(v => v <= maxVal).map(v => (
                  <g key={v}>
                    <line x1={padL} x2={svgW - padR} y1={scale(v)} y2={scale(v)} stroke="#e5e7eb" strokeWidth={0.5} />
                    <text x={padL - 5} y={scale(v) + 3} textAnchor="end" fontSize={9} fill="#6b7280">
                      {(v / 1000).toFixed(0)}bn
                    </text>
                  </g>
                ))}

                {/* Bars */}
                {waterfallBars.map((bar, i) => {
                  const x = padL + i * barW + barW * 0.15
                  const w = barW * 0.7
                  let y, h
                  if (bar.key === 'opening' || bar.key === 'closing') {
                    y = scale(bar.value)
                    h = scale(0) - y
                  } else if (bar.value >= 0) {
                    y = scale(bar.cumulative + bar.value)
                    h = scale(bar.cumulative) - y
                  } else {
                    y = scale(bar.cumulative)
                    h = scale(bar.cumulative + bar.value) - y
                  }

                  const isSelected = selectedBar === bar.key
                  return (
                    <g key={bar.key} onClick={() => setSelectedBar(isSelected ? null : bar.key)} style={{ cursor: 'pointer' }}>
                      <rect x={x} y={y} width={w} height={Math.max(h, 1)} fill={bar.color}
                        rx={2} opacity={isSelected ? 1 : 0.85}
                        stroke={isSelected ? '#000' : 'none'} strokeWidth={isSelected ? 2 : 0}
                      />
                      {/* Connector lines */}
                      {i > 0 && i < waterfallBars.length - 1 && (
                        <line
                          x1={padL + (i - 1) * barW + barW * 0.85}
                          x2={x}
                          y1={bar.key === 'depreciation' ? scale(bar.cumulative) : scale(bar.cumulative)}
                          y2={bar.key === 'depreciation' ? scale(bar.cumulative) : scale(bar.cumulative)}
                          stroke="#d1d5db" strokeDasharray="3,2" strokeWidth={1}
                        />
                      )}
                      {/* Value label */}
                      <text x={x + w / 2} y={y - 6} textAnchor="middle" fontSize={10} fontWeight="600" fill={bar.color === GREY ? '#374151' : bar.color}>
                        £{Math.abs(bar.value / 1000).toFixed(1)}bn
                      </text>
                      {/* Bar label */}
                      <text x={x + w / 2} y={svgH - padB + 14} textAnchor="middle" fontSize={10} fill="#374151">
                        {bar.label}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>

            {/* Explanation panel */}
            {selectedBar && EXPLANATIONS[selectedBar] && (
              <div className="mt-4 p-4 rounded-fs-md border border-fs-border bg-white shadow-fs">
                <h3 className="font-heading font-bold text-fs-primary mb-2">{EXPLANATIONS[selectedBar].title}</h3>
                <p className="text-sm text-fs-text mb-2">{EXPLANATIONS[selectedBar].desc}</p>
                <p className="text-xs text-fs-text-muted mb-1"><span className="font-semibold">Driver:</span> {EXPLANATIONS[selectedBar].driver}</p>
                {waterfallYear && selectedBar !== 'opening' && selectedBar !== 'closing' && (
                  <p className="text-xs text-fs-text-muted">
                    <span className="font-semibold">SVT {waterfallYear.year}:</span>{' '}
                    £{Math.abs(waterfallBars.find(b => b.key === selectedBar)?.value / 1000).toFixed(1)}bn
                    {' '}— {EXPLANATIONS[selectedBar].direction === 'positive' ? 'increases' : EXPLANATIONS[selectedBar].direction === 'negative' ? 'decreases' : 'does not directly affect'} RCV growth
                  </p>
                )}
              </div>
            )}

            {/* Summary paragraph */}
            <p className="mt-4 text-sm text-fs-text leading-relaxed">
              SVT's RCV grows each year primarily because new capital investment and inflation indexation
              outweigh regulatory depreciation. Over AMP8, the RCV is projected to grow from{' '}
              <span className="font-semibold text-fs-primary">£{(amp8Opening / 1000).toFixed(1)}bn</span> to{' '}
              <span className="font-semibold text-fs-primary">£{(amp8Closing / 1000).toFixed(1)}bn</span>{' '}
              — a <span className="font-semibold text-fs-primary">{amp8GrowthPct.toFixed(0)}%</span> increase
              over five years.
            </p>
          </>
        )}
      </section>

      {/* ── SECTION B: SVT RCV Trajectory ── */}
      <section>
        <h2 className="text-lg font-heading font-bold text-fs-text mb-4">SVT RCV Trajectory</h2>

        {/* Toggle buttons */}
        <div className="flex gap-2 mb-4">
          {['nominal', 'real'].map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 text-xs font-medium rounded-fs-sm border transition-colors ${
                viewMode === mode
                  ? 'bg-fs-primary text-white border-fs-primary'
                  : 'bg-white text-fs-text border-fs-border hover:border-fs-primary'
              }`}
            >
              {mode === 'nominal' ? 'Nominal £bn' : 'Real £bn'}
            </button>
          ))}
          <button
            onClick={() => setShowComponents(!showComponents)}
            className={`px-3 py-1.5 text-xs font-medium rounded-fs-sm border transition-colors ml-2 ${
              showComponents
                ? 'bg-fs-primary text-white border-fs-primary'
                : 'bg-white text-fs-text border-fs-border hover:border-fs-primary'
            }`}
          >
            {showComponents ? 'Hide components' : 'Show components'}
          </button>
        </div>

        {/* Main trajectory chart */}
        <div className="bg-white rounded-fs-md border border-fs-border p-4 shadow-fs">
          <ResponsiveContainer width="100%" height={360}>
            <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} interval={1} angle={-45} textAnchor="end" height={60} />
              <YAxis
                tick={{ fontSize: 10 }}
                tickFormatter={v => `${v.toFixed(0)}`}
                label={{ value: `RCV (£bn, ${viewMode})`, angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
              />
              <Tooltip
                formatter={(v, name) => [`£${Number(v).toFixed(1)}bn`, name]}
                labelFormatter={l => `FY ${l}`}
                contentStyle={{ fontSize: 12, borderColor: '#e5e7eb' }}
              />

              {/* AMP boundary lines */}
              {ampBoundaryYears.map(yr => (
                <ReferenceLine key={yr} x={yr} stroke="#d1d5db" strokeDasharray="4 3" />
              ))}

              {/* Event annotations */}
              {EVENT_ANNOTATIONS.map(evt => (
                <ReferenceLine
                  key={evt.label}
                  x={evt.x}
                  stroke={AMBER}
                  strokeDasharray="4 2"
                  label={{ value: evt.label, position: 'top', fontSize: 9, fill: AMBER }}
                />
              ))}

              {/* Area for actual values */}
              <defs>
                <linearGradient id="rcvGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={GREEN} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={GREEN} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <Area
                dataKey={viewMode === 'nominal' ? 'closingBn' : 'closingRealBn'}
                name={viewMode === 'nominal' ? 'Closing RCV (nominal)' : 'Closing RCV (real)'}
                stroke={GREEN}
                fill="url(#rcvGrad)"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>

          {/* AMP labels */}
          <div className="flex justify-around text-xs text-fs-text-muted -mt-2 mb-2 px-12">
            {['AMP4', 'AMP5', 'AMP6', 'AMP7', 'AMP8'].map((amp, i) => (
              <span key={amp} className={`px-2 py-0.5 rounded ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                {amp}
              </span>
            ))}
          </div>
        </div>

        {/* Component bars panel */}
        {showComponents && (
          <div className="bg-white rounded-fs-md border border-fs-border p-4 shadow-fs mt-3">
            <p className="text-xs text-fs-text-muted mb-2">Annual RCV movements (£bn) — actuals only</p>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={actualsData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="year" tick={{ fontSize: 9 }} interval={1} angle={-45} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `${v.toFixed(1)}`} />
                <Tooltip
                  formatter={(v, name) => [`£${Number(v).toFixed(2)}bn`, name]}
                  contentStyle={{ fontSize: 11, borderColor: '#e5e7eb' }}
                />
                <Bar dataKey="additions" name="RCV Additions" fill={GREEN} opacity={0.8} />
                <Bar dataKey="indexation" name="Indexation" fill={BLUE} opacity={0.8} />
                <Bar dataKey="depreciation" name="Depreciation" fill={AMBER} opacity={0.8} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Stat strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {[
            { label: 'Opening RCV AMP8', value: fmtBn(amp8Opening) },
            { label: 'Closing RCV AMP8', value: fmtBn(amp8Closing) },
            { label: 'AMP8 growth', value: fmtBn(amp8Growth) },
            { label: 'AMP8 growth %', value: `${amp8GrowthPct.toFixed(1)}%` },
          ].map(s => (
            <div key={s.label} className="rounded-fs-md border border-fs-border bg-white p-3 shadow-fs text-center">
              <div className="text-xs text-fs-text-muted mb-1">{s.label}</div>
              <div className="text-xl font-heading font-bold text-fs-primary">{s.value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION C: Price Control Breakdown ── */}
      <section>
        <h2 className="text-lg font-heading font-bold text-fs-text mb-4">Price Control Breakdown</h2>
        <div className="bg-white rounded-fs-md border border-fs-border p-6 shadow-fs">
          <div className="flex flex-col lg:flex-row gap-8 items-center">
            {/* Donut */}
            <div className="w-64 h-64 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pcData.price_controls}
                    dataKey="closing_rcv"
                    nameKey="name"
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={95}
                    paddingAngle={2}
                    label={({ name, pct_of_total }) => `${name.split(' ')[0]} ${pct_of_total}%`}
                    labelLine={false}
                  >
                    {pcData.price_controls.map((_, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `£${(v / 1000).toFixed(1)}bn`} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend table */}
            <div className="flex-1 min-w-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-fs-border">
                    <th className="text-left py-2 text-fs-text-muted font-medium">Price control</th>
                    <th className="text-right py-2 text-fs-text-muted font-medium">RCV £bn</th>
                    <th className="text-right py-2 text-fs-text-muted font-medium">% of total</th>
                    <th className="text-left py-2 pl-4 text-fs-text-muted font-medium">Key driver</th>
                  </tr>
                </thead>
                <tbody>
                  {pcData.price_controls.map((pc, i) => (
                    <tr key={pc.name} className="border-b border-fs-border/50">
                      <td className="py-2 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-sm inline-block" style={{ background: DONUT_COLORS[i] }} />
                        {pc.name}
                      </td>
                      <td className="text-right py-2 font-medium">£{(pc.closing_rcv / 1000).toFixed(1)}bn</td>
                      <td className="text-right py-2">{pc.pct_of_total}%</td>
                      <td className="text-left py-2 pl-4 text-fs-text-muted text-xs">{DONUT_DRIVERS[pc.name]}</td>
                    </tr>
                  ))}
                  <tr className="font-semibold">
                    <td className="py-2">Total</td>
                    <td className="text-right py-2">£{(pcData.total_rcv / 1000).toFixed(1)}bn</td>
                    <td className="text-right py-2">100%</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <p className="mt-4 text-xs text-fs-text-muted italic">
            The price control split matters because Ofwat sets separate return and cost allowances for each
            control — performance on one does not offset another.
          </p>
          <p className="mt-1 text-xs text-fs-text-muted">Source: {pcData.source} ({pcData.year})</p>
        </div>
      </section>
    </div>
  )
}
