import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const GREEN = '#005030'
const AMBER = '#F47321'

const AMP_TIMELINE = [
  { period: 'AMP4', years: '2005-10', label: 'PR09', svtOpeningRcv: 6097, note: 'RPI indexation era' },
  { period: 'AMP5', years: '2010-15', label: 'PR14', svtOpeningRcv: 6418, note: 'RPI→CPIH transition debated' },
  { period: 'AMP6', years: '2015-20', label: 'PR19', svtOpeningRcv: 7683, note: 'First CPIH-indexed AMP' },
  { period: 'AMP7', years: '2020-25', label: 'PR24 prep', svtOpeningRcv: 9406, note: 'Covid, inflation surge, WINEP ramp-up' },
  { period: 'AMP8', years: '2025-30', label: 'PR24 FD', svtOpeningRcv: 14781, closingRcv: 20890, note: '£104bn sector investment, SVT "Outstanding"' },
  { period: 'AMP9', years: '2030-35', label: 'PR29', svtOpeningRcv: null, note: 'Forecast only — PR29 not yet started' },
]

const FLOW_STEPS = [
  { id: 'rcv', label: 'Regulatory Capital Value (RCV)', desc: 'The regulated asset base — what the company has invested on behalf of customers.', value: '£14.8bn', sub: 'SVT opening AMP8' },
  { id: 'wacc', label: 'Allowed Return (WACC)', desc: 'Ofwat sets the return investors can earn on the RCV.', value: '4.03%', sub: '~£596m p.a. illustrative' },
  { id: 'totex', label: 'Total Expenditure (Totex)', desc: 'Base + enhancement spending allowed to run and improve services.', value: '£15bn', sub: 'SVT AMP8 allowance' },
  { id: 'revenue', label: 'Allowed Revenue', desc: 'Totex + return + depreciation = the revenue Ofwat allows to be collected from bills.', value: null, sub: null },
  { id: 'bill', label: 'Customer Bills', desc: 'Allowed revenue divided across the customer base.', value: '£463→£583', sub: '2025-26 to 2029-30' },
]

const ODI_EXAMPLE = {
  metric: 'Leakage (3-year average)',
  unit: 'Ml/d',
  pcl: 289.7,
  deadbandUpper: null,
  deadbandLower: null,
  collar: null,
  cap: null,
  roreRange: '-0.63% to +1.31%',
  note: 'SVT AMP8 leakage target is a 16% reduction from baseline. ODI cap and collar are expressed as % of RoRE across all PCs combined.',
}

function TimelineCard({ amp, isLast }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${amp.period === 'AMP8' ? 'bg-fs-secondary' : amp.period === 'AMP9' ? 'bg-gray-300' : 'bg-fs-primary'}`}>
          {amp.period.replace('AMP', '')}
        </div>
        {!isLast && <div className="w-0.5 h-8 bg-fs-border" />}
      </div>
      <div className="flex-1 pb-4">
        <div className="flex items-baseline gap-2">
          <span className="font-heading font-bold text-fs-text text-sm">{amp.period}</span>
          <span className="text-xs text-fs-text-muted">({amp.years})</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-fs-surface-alt text-fs-text-muted">{amp.label}</span>
        </div>
        <p className="text-xs text-fs-text-muted mt-0.5">{amp.note}</p>
        {amp.svtOpeningRcv && (
          <div className="mt-1 text-xs">
            <span className="text-fs-text-muted">SVT opening RCV: </span>
            <span className="font-semibold text-fs-primary">£{(amp.svtOpeningRcv / 1000).toFixed(1)}bn</span>
            {amp.closingRcv && (
              <span className="text-fs-text-muted"> → closing ~£{(amp.closingRcv / 1000).toFixed(1)}bn</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function FlowDiagram() {
  return (
    <div className="space-y-3">
      {FLOW_STEPS.map((step, i) => (
        <div key={step.id}>
          <div className="flex items-start gap-4 bg-white rounded-fs-md border border-fs-border p-4 shadow-fs">
            <div className="w-8 h-8 rounded-full bg-fs-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
              {i + 1}
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-heading font-bold text-fs-text">{step.label}</h4>
              <p className="text-xs text-fs-text-muted mt-0.5">{step.desc}</p>
            </div>
            {step.value && (
              <div className="text-right shrink-0">
                <div className="text-lg font-heading font-bold text-fs-primary">{step.value}</div>
                {step.sub && <div className="text-[10px] text-fs-text-muted">{step.sub}</div>}
              </div>
            )}
          </div>
          {i < FLOW_STEPS.length - 1 && (
            <div className="flex justify-center">
              <div className="w-0.5 h-4 bg-fs-border" />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function ODIExplainer() {
  const { pcl, roreRange, note, metric, unit } = ODI_EXAMPLE
  const lineMin = pcl * 0.8
  const lineMax = pcl * 1.2
  const range = lineMax - lineMin
  const pclPos = ((pcl - lineMin) / range) * 100

  return (
    <div>
      <h3 className="text-sm font-heading font-bold text-fs-text mb-2">Example: SVT leakage ODI</h3>
      <p className="text-xs text-fs-text-muted mb-4">
        Performance Commitment Level (PCL) for {metric}: <span className="font-semibold">{pcl} {unit}</span>
      </p>

      {/* Number line */}
      <div className="relative h-20 mb-4 mx-4">
        {/* Base line */}
        <div className="absolute top-8 left-0 right-0 h-1 bg-gray-200 rounded" />

        {/* Penalty zone */}
        <div className="absolute top-7 h-3 bg-red-100 rounded-l" style={{ left: `${pclPos}%`, right: '0%' }} />

        {/* Reward zone */}
        <div className="absolute top-7 h-3 bg-green-100 rounded-r" style={{ left: '0%', right: `${100 - pclPos}%` }} />

        {/* PCL marker */}
        <div className="absolute top-4" style={{ left: `${pclPos}%`, transform: 'translateX(-50%)' }}>
          <div className="w-0.5 h-8 bg-fs-primary mx-auto" />
          <div className="text-center mt-1">
            <div className="text-xs font-bold text-fs-primary">PCL</div>
            <div className="text-[10px] text-fs-text-muted">{pcl} {unit}</div>
          </div>
        </div>

        {/* Labels */}
        <div className="absolute top-0 left-0 text-[10px] text-green-700 font-medium">
          Outperformance → reward
        </div>
        <div className="absolute top-0 right-0 text-[10px] text-red-600 font-medium text-right">
          Underperformance → penalty
        </div>
      </div>

      <div className="bg-fs-surface-alt rounded-fs-sm p-3 text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-fs-text-muted">ODI risk range (all PCs):</span>
          <span className="font-semibold text-fs-text">{roreRange} RoRE</span>
        </div>
        <p className="text-[10px] text-fs-text-muted italic mt-2">{note}</p>
      </div>
    </div>
  )
}

export default function RegPrimer() {
  const [ampSummary, setAmpSummary] = useState(null)

  useEffect(() => {
    fetch('/data/rcv_history_amp_summary.json')
      .then(r => r.json())
      .then(setAmpSummary)
      .catch(() => {})
  }, [])

  // Enrich timeline with real RCV data if available
  const enrichedTimeline = AMP_TIMELINE.map(amp => {
    if (!ampSummary) return amp
    const match = ampSummary.find(s => s.amp_period === amp.period)
    if (match) {
      return {
        ...amp,
        svtOpeningRcv: match.opening_rcv || amp.svtOpeningRcv,
        closingRcv: match.closing_rcv || amp.closingRcv,
      }
    }
    return amp
  })

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-heading font-bold text-fs-primary mb-1">Regulatory Primer</h1>
        <p className="text-sm text-fs-text-muted">
          How the water industry is regulated — and what it means for SVT
        </p>
      </div>

      {/* Section 1: AMP Timeline */}
      <section>
        <h2 className="text-lg font-heading font-bold text-fs-text mb-4">The AMP cycle</h2>
        <p className="text-xs text-fs-text-muted mb-4">
          Ofwat sets prices, investment and performance targets every five years in Asset Management Periods (AMPs).
          Each AMP is governed by a Price Review (PR) determination.
        </p>
        <div className="bg-white rounded-fs-md border border-fs-border p-6 shadow-fs">
          {enrichedTimeline.map((amp, i) => (
            <TimelineCard key={amp.period} amp={amp} isLast={i === enrichedTimeline.length - 1} />
          ))}
        </div>
        <div className="mt-2 text-right">
          <Link to="/learn/glossary" className="text-xs text-fs-primary hover:underline">See full glossary →</Link>
        </div>
      </section>

      {/* Section 2: How a water company makes money */}
      <section>
        <h2 className="text-lg font-heading font-bold text-fs-text mb-4">How a water company makes money</h2>
        <p className="text-xs text-fs-text-muted mb-4">
          Revenue flows from a regulated building-block model: RCV → allowed return → totex allowance → customer bills.
        </p>
        <FlowDiagram />
        <div className="mt-2 text-right">
          <Link to="/learn/glossary" className="text-xs text-fs-primary hover:underline">See full glossary →</Link>
        </div>
      </section>

      {/* Section 3: What is RCV? */}
      <section>
        <h2 className="text-lg font-heading font-bold text-fs-text mb-4">What is RCV?</h2>
        <div className="bg-white rounded-fs-md border border-fs-border p-5 shadow-fs">
          <p className="text-sm text-fs-text leading-relaxed mb-3">
            The <strong>Regulatory Capital Value</strong> is the financial value Ofwat places on the
            company's regulated asset base. It grows through new investment and inflation indexation,
            and shrinks through depreciation (RCV run-off). Investors earn their return on this figure.
          </p>
          <p className="text-sm text-fs-text leading-relaxed">
            SVT's RCV has grown from ~£6.1bn at the start of AMP4 to £14.8bn at the start of AMP8,
            and is projected to reach ~£20.9bn by 2030 — reflecting a massive capital investment programme.
          </p>
          <div className="mt-3">
            <Link to="/learn/rcv-journey" className="text-xs text-fs-primary hover:underline font-medium">
              Explore the full RCV Journey →
            </Link>
          </div>
        </div>
        <div className="mt-2 text-right">
          <Link to="/learn/glossary" className="text-xs text-fs-primary hover:underline">See full glossary →</Link>
        </div>
      </section>

      {/* Section 4: ODI explainer */}
      <section>
        <h2 className="text-lg font-heading font-bold text-fs-text mb-4">How ODIs work</h2>
        <p className="text-xs text-fs-text-muted mb-4">
          Outcome Delivery Incentives create a financial link between operational performance and shareholder returns.
          Companies earn rewards for outperformance and face penalties for underperformance against their Performance
          Commitment Levels (PCLs).
        </p>
        <div className="bg-white rounded-fs-md border border-fs-border p-5 shadow-fs">
          <ODIExplainer />
        </div>
        <div className="mt-4 bg-white rounded-fs-md border border-fs-border p-5 shadow-fs">
          <h3 className="text-sm font-heading font-bold text-fs-text mb-2">Key ODI concepts</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-fs-surface-alt rounded-fs-sm">
              <span className="font-semibold text-fs-primary">PCL</span>
              <span className="text-fs-text-muted"> — Performance Commitment Level: the target a company must meet.</span>
            </div>
            <div className="p-3 bg-fs-surface-alt rounded-fs-sm">
              <span className="font-semibold text-fs-primary">Deadband</span>
              <span className="text-fs-text-muted"> — A range around the PCL where no financial incentive applies.</span>
            </div>
            <div className="p-3 bg-fs-surface-alt rounded-fs-sm">
              <span className="font-semibold text-fs-primary">Cap</span>
              <span className="text-fs-text-muted"> — Maximum reward a company can earn on a single PC.</span>
            </div>
            <div className="p-3 bg-fs-surface-alt rounded-fs-sm">
              <span className="font-semibold text-fs-primary">Collar</span>
              <span className="text-fs-text-muted"> — Maximum penalty — limits downside exposure on a single PC.</span>
            </div>
          </div>
        </div>
        <div className="mt-2 text-right">
          <Link to="/learn/glossary" className="text-xs text-fs-primary hover:underline">See full glossary →</Link>
        </div>
      </section>

      {/* Section 5: What's next */}
      <section>
        <h2 className="text-lg font-heading font-bold text-fs-text mb-4">Explore further</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link to="/learn/rcv-journey" className="rounded-fs-md border border-fs-border bg-white p-4 shadow-fs hover:shadow-fs-md transition-shadow">
            <h3 className="text-sm font-heading font-bold text-fs-primary mb-1">RCV Journey</h3>
            <p className="text-xs text-fs-text-muted">Trace how SVT's asset base has grown from AMP4 to AMP8</p>
          </Link>
          <Link to="/learn/equity-bridge" className="rounded-fs-md border border-fs-border bg-white p-4 shadow-fs hover:shadow-fs-md transition-shadow">
            <h3 className="text-sm font-heading font-bold text-fs-primary mb-1">Equity Bridge</h3>
            <p className="text-xs text-fs-text-muted">From RCV to regulated equity to statutory equity</p>
          </Link>
          <Link to="/learn/glossary" className="rounded-fs-md border border-fs-border bg-white p-4 shadow-fs hover:shadow-fs-md transition-shadow">
            <h3 className="text-sm font-heading font-bold text-fs-primary mb-1">Glossary</h3>
            <p className="text-xs text-fs-text-muted">All regulatory terms in one place</p>
          </Link>
        </div>
      </section>

      <div className="text-[10px] text-fs-text-muted italic">
        Analysis by Fox Stephens. Data sourced from Ofwat PR24 Final Determination documents.
      </div>
    </div>
  )
}
