import { useReducer, useEffect, useState, useCallback, useRef, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line, Legend, ReferenceLine,
} from 'recharts'

const GREEN = '#005030'
const AMBER = '#F47321'
const GREY = '#9ca3af'
const NAVY = '#1e3a5f'

// ── Reducer ──
const initialState = {
  rcvSource: 'opening',
  rcvCustom: 14781,
  gearing: 60,
  pension: 0,
  fairValueDebt: -200,
  deferredTax: -300,
  goodwill: 0,
  nonRegulated: 0,
  otherIFRS: 0,
  annualReportRCV: '',
  annualReportEquity: '',
  annualReportYear: '',
}

function reducer(state, action) {
  if (action.type === 'SET') return { ...state, [action.field]: action.value }
  return state
}

function Slider({ label, note, value, min, max, step, unit = '£m', onChange, showValue = true }) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-baseline mb-1">
        <label className="text-xs font-medium text-fs-text">{label}</label>
        {showValue && (
          <span className="text-xs font-semibold text-fs-primary">
            {unit === '%' ? `${value.toFixed(1)}%` : `£${value.toLocaleString()}m`}
          </span>
        )}
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#005030]"
      />
      <div className="flex justify-between text-[10px] text-fs-text-muted mt-0.5">
        <span>{unit === '%' ? `${min}%` : `${min < 0 ? '-' : ''}£${Math.abs(min).toLocaleString()}m`}</span>
        <span>{unit === '%' ? `${max}%` : `£${max.toLocaleString()}m`}</span>
      </div>
      {note && <NoteToggle text={note} />}
    </div>
  )
}

function NoteToggle({ text }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-1">
      <button onClick={() => setOpen(!open)} className="text-[10px] text-fs-text-muted hover:text-fs-primary underline">
        {open ? 'Hide note' : 'Why?'}
      </button>
      {open && <p className="text-[10px] text-fs-text-muted mt-1 leading-relaxed">{text}</p>}
    </div>
  )
}

function NumberInput({ label, value, onChange, note, min = -5000, max = 5000 }) {
  return (
    <div className="mb-4">
      <label className="text-xs font-medium text-fs-text block mb-1">{label}</label>
      <div className="flex items-center gap-1">
        <span className="text-xs text-fs-text-muted">£</span>
        <input
          type="number" value={value} min={min} max={max}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          className="w-full px-2 py-1 text-xs border border-fs-border rounded-fs-sm focus:border-fs-primary focus:outline-none"
        />
        <span className="text-xs text-fs-text-muted">m</span>
      </div>
      {note && <NoteToggle text={note} />}
    </div>
  )
}

function StatBox({ label, value, sub, color }) {
  return (
    <div className="text-center">
      <div className="text-[10px] text-fs-text-muted uppercase tracking-wide">{label}</div>
      <div className="text-lg font-heading font-bold" style={{ color: color || GREEN }}>{value}</div>
      {sub && <div className="text-[10px] text-fs-text-muted">{sub}</div>}
    </div>
  )
}

function fmtM(v) {
  return `£${Math.abs(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}m`
}

export default function EquityBridge() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [amp8Data, setAmp8Data] = useState(null)
  const [annualActuals, setAnnualActuals] = useState(null)
  const [selectedYear, setSelectedYear] = useState('')
  const [groupBridge, setGroupBridge] = useState(null)
  const [s4Year, setS4Year] = useState('')
  const [s4Custom, setS4Custom] = useState(false)
  const [s4CustomInputs, setS4CustomInputs] = useState(null)
  const [s4ExpandedBar, setS4ExpandedBar] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [showContext, setShowContext] = useState(false)
  const stage4Ref = useRef(null)

  useEffect(() => {
    fetch('/data/rcv_amp8_detail.json').then(r => r.json()).then(setAmp8Data).catch(() => {})
    fetch('/data/svt_annual_report_actuals.json').then(r => r.json()).then(setAnnualActuals).catch(() => {})
    fetch('/data/svt_group_bridge.json').then(r => r.json()).then(d => {
      setGroupBridge(d)
      if (d?.length) setS4Year(d[d.length - 1].year)
    }).catch(() => {})
  }, [])

  const set = useCallback((field) => (value) => dispatch({ type: 'SET', field, value }), [])

  // When a year is selected in Stage 3, populate sliders AND sync Stage 4
  useEffect(() => {
    if (!selectedYear || !annualActuals) return
    const actual = annualActuals.find(a => a.year === selectedYear)
    if (!actual) return
    const pension = actual['pension_ias19_£m']
    const deferredTax = actual['deferred_tax_£m']
    const rcv = actual['rcv_£m']
    const gearing = actual['actual_gearing_pct']
    const equity = actual['statutory_equity_£m']
    if (pension != null) dispatch({ type: 'SET', field: 'pension', value: pension })
    if (deferredTax != null) dispatch({ type: 'SET', field: 'deferredTax', value: deferredTax })
    if (rcv != null) {
      dispatch({ type: 'SET', field: 'rcvSource', value: 'custom' })
      dispatch({ type: 'SET', field: 'rcvCustom', value: rcv })
    }
    if (gearing != null) dispatch({ type: 'SET', field: 'gearing', value: gearing })
    if (rcv != null) dispatch({ type: 'SET', field: 'annualReportRCV', value: String(rcv) })
    if (equity != null) dispatch({ type: 'SET', field: 'annualReportEquity', value: String(equity) })
    dispatch({ type: 'SET', field: 'annualReportYear', value: actual.year })
    // Sync Stage 4 year
    if (groupBridge?.find(g => g.year === selectedYear)) {
      setS4Year(selectedYear)
      setS4Custom(false)
    }
  }, [selectedYear, annualActuals, groupBridge])

  const amp8Opening = amp8Data?.years?.[0]?.rcv_nominal?.total || 14780.7
  const amp8Closing = amp8Data?.years?.[amp8Data.years.length - 1]?.rcv_nominal?.total || 20889.8

  const rcv = state.rcvSource === 'opening' ? amp8Opening :
              state.rcvSource === 'closing' ? amp8Closing : state.rcvCustom

  // Stage 1
  const notionalDebt = rcv * (state.gearing / 100)
  const regulatedEquity = rcv - notionalDebt

  // Stage 2
  const statutoryEquity = regulatedEquity + state.pension + state.fairValueDebt +
    state.deferredTax + state.goodwill + state.nonRegulated + state.otherIFRS

  // Stage 1 waterfall data
  const stage1Data = [
    { name: 'RCV', value: rcv, fill: GREEN },
    { name: 'Net Debt', value: -notionalDebt, fill: AMBER },
    { name: 'Regulated\nEquity', value: regulatedEquity, fill: GREEN },
  ]

  // Stage 2 waterfall data
  const stage2Items = [
    { name: 'Regulated Equity', value: regulatedEquity },
    { name: 'Pension (IAS 19)', value: state.pension },
    { name: 'Fair value of debt', value: state.fairValueDebt },
    { name: 'Deferred tax', value: state.deferredTax },
    { name: 'Goodwill', value: state.goodwill },
    { name: 'Non-regulated', value: state.nonRegulated },
    { name: 'Other IFRS', value: state.otherIFRS },
    { name: 'Statutory Equity', value: statutoryEquity },
  ]

  let running = 0
  const stage2ChartData = stage2Items.map((item, i) => {
    const isTotal = i === 0 || i === stage2Items.length - 1
    const base = isTotal ? 0 : running
    const barVal = item.value
    if (!isTotal) running += barVal
    else running = barVal
    return {
      name: item.name,
      base: isTotal ? 0 : (barVal >= 0 ? base : base + barVal),
      value: Math.abs(barVal),
      rawValue: barVal,
      fill: isTotal ? GREEN : (barVal >= 0 ? GREEN : AMBER),
      isTotal,
    }
  })

  // Stage 3 comparison
  const arRCV = parseFloat(state.annualReportRCV) || 0
  const arEquity = parseFloat(state.annualReportEquity) || 0
  const arFilled = arRCV > 0 && arEquity > 0 && state.annualReportYear.length > 0
  const arGearing = arRCV > 0 ? ((arRCV - arEquity) / arRCV * 100) : 0
  const arEquityRCV = arRCV > 0 ? (arEquity / arRCV * 100) : 0
  const bridgeEquityRCV = rcv > 0 ? (statutoryEquity / rcv * 100) : 0
  const bridgeGearing = rcv > 0 ? ((rcv - statutoryEquity) / rcv * 100) : 0
  const equityGap = Math.abs(statutoryEquity - arEquity)

  // ── Stage 4 data ──
  const s4Data = useMemo(() => {
    if (!groupBridge || !s4Year) return null
    return groupBridge.find(g => g.year === s4Year) || null
  }, [groupBridge, s4Year])

  const s4CompanyEquity = useMemo(() => {
    if (s4Custom) return s4CustomInputs?.companyEquity ?? (s4Data?.['company_equity_£m'] || statutoryEquity)
    return s4Data?.['company_equity_£m'] || 0
  }, [s4Custom, s4CustomInputs, s4Data, statutoryEquity])

  const s4Items = useMemo(() => {
    if (!s4Data) return []
    if (s4Custom && s4CustomInputs?.items) return s4CustomInputs.items
    return s4Data.reconciling_items || []
  }, [s4Data, s4Custom, s4CustomInputs])

  const s4GroupEquity = useMemo(() => {
    return s4CompanyEquity + s4Items.reduce((sum, item) => sum + (item['value_£m'] || 0), 0)
  }, [s4CompanyEquity, s4Items])

  const s4GroupEquityRCV = rcv > 0 ? (s4GroupEquity / rcv * 100) : 0

  // Stage 4 waterfall chart data
  const s4ChartData = useMemo(() => {
    if (!s4Data) return []
    const items = [
      { name: 'STW Ltd equity', rawValue: s4CompanyEquity, isStart: true },
      ...s4Items.map(item => ({
        name: item.short_label || item.label,
        rawValue: item['value_£m'] || 0,
        fullItem: item,
      })),
      { name: 'Group equity', rawValue: s4GroupEquity, isEnd: true },
    ]
    let r = 0
    return items.map((item, i) => {
      const isTotal = item.isStart || item.isEnd
      const base = isTotal ? 0 : r
      const barVal = item.rawValue
      if (!isTotal) r += barVal
      else r = barVal
      return {
        ...item,
        base: isTotal ? 0 : (barVal >= 0 ? base : base + barVal),
        value: Math.abs(barVal),
        fill: item.isEnd ? NAVY : (isTotal ? GREEN : (barVal >= 0 ? GREEN : AMBER)),
        isTotal,
      }
    })
  }, [s4Data, s4CompanyEquity, s4Items, s4GroupEquity])

  // Init custom inputs when switching to custom mode
  function enterCustomMode() {
    setS4Custom(true)
    setS4CustomInputs({
      companyEquity: s4Data?.['company_equity_£m'] || statutoryEquity,
      items: (s4Data?.reconciling_items || []).map(item => ({ ...item })),
    })
  }

  function updateCustomItem(idx, val) {
    setS4CustomInputs(prev => {
      const items = prev.items.map((it, i) => i === idx ? { ...it, 'value_£m': val } : it)
      return { ...prev, items }
    })
  }

  // Scroll to Stage 4
  function scrollToStage4() {
    if (groupBridge?.find(g => g.year === selectedYear)) setS4Year(selectedYear)
    setS4Custom(false)
    stage4Ref.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Historical chart data
  const historyData = useMemo(() => {
    if (!groupBridge) return []
    return groupBridge.map(g => {
      const actual = annualActuals?.find(a => a.year === g.year)
      return {
        year: g.year,
        company: g['company_equity_£m'],
        group: g['group_equity_£m'],
        rcv: actual?.['rcv_£m'] || null,
      }
    })
  }, [groupBridge, annualActuals])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-heading font-bold text-fs-primary mb-1">Equity Bridge</h1>
        <p className="text-sm text-fs-text-muted">
          From RCV to regulated equity to statutory equity to group equity — an interactive walkthrough
        </p>
      </div>

      {/* ── Sticky Summary Bar ── */}
      <div className="sticky top-14 z-40 bg-white border-b border-fs-border px-4 py-2.5 -mx-4 sm:-mx-6 lg:-mx-8"
        style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
        <StatBox label="RCV" value={`£${(rcv / 1000).toFixed(1)}bn`} />
        <span className="text-fs-border">|</span>
        <StatBox label="Regulated equity" value={`£${(regulatedEquity / 1000).toFixed(1)}bn`} />
        <span className="text-fs-border">|</span>
        <StatBox label="Company equity" value={`£${(statutoryEquity / 1000).toFixed(1)}bn`} />
        <span className="text-fs-border">|</span>
        <StatBox label="Group equity" value={s4Data ? `£${(s4GroupEquity / 1000).toFixed(1)}bn` : '—'} color={NAVY} />
      </div>

      {/* ── Year Selector ── */}
      {annualActuals && annualActuals.length > 0 && (
        <div className="rounded-fs-md border border-fs-border bg-white p-4 shadow-fs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium text-fs-text">Load actuals from SVT annual report:</span>
            <div className="flex gap-1.5">
              {annualActuals.map(a => (
                <button
                  key={a.year}
                  onClick={() => setSelectedYear(selectedYear === a.year ? '' : a.year)}
                  className={`px-3 py-1.5 text-xs rounded-fs-sm border transition-colors ${
                    selectedYear === a.year
                      ? 'bg-fs-primary text-white border-fs-primary'
                      : 'bg-white text-fs-text border-fs-border hover:border-fs-primary'
                  }`}
                >
                  {a.year}
                </button>
              ))}
            </div>
          </div>
          {selectedYear && (
            <div className="mt-2 text-xs px-3 py-2 rounded-fs-sm bg-fs-secondary-light border-l-4 border-fs-secondary">
              Showing actuals from SVT Annual Report {selectedYear} — adjust sliders to model scenarios
            </div>
          )}
          {!selectedYear && (
            <div className="mt-2 text-[10px] text-fs-text-muted">Illustrative defaults — select a year to load real figures</div>
          )}
        </div>
      )}

      {/* ── STAGE 1: RCV to Regulated Equity ── */}
      <section>
        <h2 className="text-lg font-heading font-bold text-fs-text mb-1">Stage 1: RCV to Regulated Equity</h2>
        <p className="text-xs text-fs-text-muted mb-4">RCV minus net debt at notional gearing = regulated equity</p>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 bg-white rounded-fs-md border border-fs-border p-4 shadow-fs">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={stage1Data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}bn`} tick={{ fontSize: 10 }} />
                <Tooltip formatter={v => `£${(Math.abs(Number(v)) / 1000).toFixed(1)}bn`} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {stage1Data.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full lg:w-72 lg:sticky lg:top-28 lg:self-start space-y-4">
            <div className="bg-white rounded-fs-md border border-fs-border p-4 shadow-fs">
              <p className="text-xs font-medium text-fs-text mb-2">RCV selector</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {[
                  { key: 'opening', label: `AMP8 opening £${(amp8Opening / 1000).toFixed(1)}bn` },
                  { key: 'closing', label: `AMP8 closing £${(amp8Closing / 1000).toFixed(1)}bn` },
                  { key: 'custom', label: 'Custom' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => set('rcvSource')(opt.key)}
                    className={`px-2 py-1 text-[10px] rounded-full border transition-colors ${
                      state.rcvSource === opt.key
                        ? 'bg-fs-primary text-white border-fs-primary'
                        : 'bg-white text-fs-text border-fs-border hover:border-fs-primary'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {state.rcvSource === 'custom' && (
                <NumberInput label="Custom RCV (£m)" value={state.rcvCustom} onChange={set('rcvCustom')} min={0} max={50000} />
              )}
              <Slider label="Notional gearing" value={state.gearing} min={50} max={75} step={0.5} unit="%" onChange={set('gearing')}
                note="Notional gearing is Ofwat's assumed capital structure for a notionally efficient company. It is used to calculate the allowed return, not SVT's actual debt level." />
              <p className="text-[10px] text-fs-text-muted -mt-2 mb-3">Ofwat notional assumption: 60.0%</p>
              <div className="space-y-1 text-xs border-t border-fs-border pt-3">
                <div className="flex justify-between"><span className="text-fs-text-muted">Notional debt:</span><span className="font-semibold">{fmtM(notionalDebt)}</span></div>
                <div className="flex justify-between"><span className="text-fs-text-muted">Regulated equity:</span><span className="font-semibold text-fs-primary">{fmtM(regulatedEquity)}</span></div>
                <div className="flex justify-between"><span className="text-fs-text-muted">Equity / RCV:</span><span className="font-semibold">{(100 - state.gearing).toFixed(1)}%</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STAGE 2: Regulated to Statutory Equity ── */}
      <section>
        <h2 className="text-lg font-heading font-bold text-fs-text mb-1">Stage 2: Regulated to Statutory Equity</h2>
        <p className="text-xs text-fs-text-muted mb-4">IFRS adjustments bridge from regulatory to accounting equity</p>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 bg-white rounded-fs-md border border-fs-border p-4 shadow-fs">
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={stage2ChartData} margin={{ top: 20, right: 20, bottom: 60, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-35} textAnchor="end" height={70} />
                <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}bn`} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v, name, props) => {
                  const raw = props.payload.rawValue
                  return [`£${(raw / 1000).toFixed(1)}bn`, name === 'base' ? 'Base' : props.payload.name]
                }} />
                <Bar dataKey="base" stackId="a" fill="transparent" />
                <Bar dataKey="value" stackId="a" radius={[2, 2, 0, 0]}>
                  {stage2ChartData.map((d, i) => <Cell key={i} fill={d.fill} opacity={d.isTotal ? 1 : 0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full lg:w-72 space-y-4">
            <div className="bg-white rounded-fs-md border border-fs-border p-4 shadow-fs">
              <Slider label="Pension surplus / (deficit)" value={state.pension} min={-1000} max={1000} step={50} unit="£m" onChange={set('pension')}
                note="SVT operates a defined benefit pension scheme. The IAS 19 position can be material." />
              <Slider label="Fair value adjustment on debt" value={state.fairValueDebt} min={-2000} max={500} step={50} unit="£m" onChange={set('fairValueDebt')}
                note="Arises under IFRS 9 / hedge accounting where debt is marked to market." />
              <Slider label="Deferred tax liability (net)" value={state.deferredTax} min={-800} max={200} step={50} unit="£m" onChange={set('deferredTax')}
                note="Typically a liability in regulated water companies due to accelerated capital allowances." />
              <NumberInput label="Goodwill & intangibles (£m)" value={state.goodwill} onChange={set('goodwill')} min={0} max={2000} />
              <Slider label="Non-regulated net assets" value={state.nonRegulated} min={-500} max={500} step={25} unit="£m" onChange={set('nonRegulated')} />
              <NumberInput label="Other IFRS adjustments (£m)" value={state.otherIFRS} onChange={set('otherIFRS')} min={-500} max={500} />
            </div>
            <div className="bg-white rounded-fs-md border border-fs-border p-4 shadow-fs space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-fs-text-muted">Statutory equity:</span><span className="font-semibold text-fs-primary">{fmtM(statutoryEquity)}</span></div>
              <div className="flex justify-between"><span className="text-fs-text-muted">Statutory equity / RCV:</span><span className="font-semibold">{bridgeEquityRCV.toFixed(1)}%</span></div>
              <div className="flex justify-between">
                <span className="text-fs-text-muted">Premium / (discount):</span>
                <span className={`font-semibold ${statutoryEquity > regulatedEquity ? 'text-fs-primary' : 'text-fs-secondary'}`}>
                  {((statutoryEquity - regulatedEquity) / regulatedEquity * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STAGE 3: Annual Report Sanity Check ── */}
      <section className="bg-slate-50 rounded-fs-md border border-fs-border p-6">
        <h2 className="text-lg font-heading font-bold text-fs-text mb-4">Check against SVT's annual report</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="text-xs font-medium text-fs-text block mb-1">RCV per annual report (£m)</label>
            <input type="number" value={state.annualReportRCV} onChange={e => set('annualReportRCV')(e.target.value)} placeholder="e.g. 13518"
              className="w-full px-3 py-2 text-sm border border-fs-border rounded-fs-sm focus:border-fs-primary focus:outline-none bg-white" />
          </div>
          <div>
            <label className="text-xs font-medium text-fs-text block mb-1">Statutory net assets / equity (£m)</label>
            <input type="number" value={state.annualReportEquity} onChange={e => set('annualReportEquity')(e.target.value)} placeholder="e.g. 5200"
              className="w-full px-3 py-2 text-sm border border-fs-border rounded-fs-sm focus:border-fs-primary focus:outline-none bg-white" />
          </div>
          <div>
            <label className="text-xs font-medium text-fs-text block mb-1">Financial year</label>
            <input type="text" value={state.annualReportYear} onChange={e => set('annualReportYear')(e.target.value)} placeholder="e.g. 2024-25"
              className="w-full px-3 py-2 text-sm border border-fs-border rounded-fs-sm focus:border-fs-primary focus:outline-none bg-white" />
          </div>
        </div>

        {arFilled && (
          <>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm border-collapse">
                <thead><tr className="border-b-2 border-fs-border">
                  <th className="text-left py-2 font-medium text-fs-text">Item</th>
                  <th className="text-right py-2 font-medium text-fs-text">Your bridge</th>
                  <th className="text-right py-2 font-medium text-fs-text">Annual report</th>
                  <th className="text-right py-2 font-medium text-fs-text">Gap</th>
                </tr></thead>
                <tbody>
                  <tr className="border-b border-fs-border/50">
                    <td className="py-2">RCV (£m)</td>
                    <td className="text-right py-2">{fmtM(rcv)}</td>
                    <td className="text-right py-2">{fmtM(arRCV)}</td>
                    <td className="text-right py-2">{fmtM(Math.abs(rcv - arRCV))}</td>
                  </tr>
                  <tr className="border-b border-fs-border/50">
                    <td className="py-2">Statutory equity (£m)</td>
                    <td className="text-right py-2">{fmtM(statutoryEquity)}</td>
                    <td className="text-right py-2">{fmtM(arEquity)}</td>
                    <td className="text-right py-2">{fmtM(equityGap)}</td>
                  </tr>
                  <tr className="border-b border-fs-border/50">
                    <td className="py-2">Implied gearing</td>
                    <td className="text-right py-2">{bridgeGearing.toFixed(1)}%</td>
                    <td className="text-right py-2">{arGearing.toFixed(1)}%</td>
                    <td className="text-right py-2">{Math.abs(bridgeGearing - arGearing).toFixed(1)}pp</td>
                  </tr>
                  <tr>
                    <td className="py-2">Equity / RCV</td>
                    <td className="text-right py-2">{bridgeEquityRCV.toFixed(1)}%</td>
                    <td className="text-right py-2">{arEquityRCV.toFixed(1)}%</td>
                    <td className="text-right py-2">{Math.abs(bridgeEquityRCV - arEquityRCV).toFixed(1)}pp</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-fs-text leading-relaxed mb-2">
              {equityGap > 500
                ? 'The gap is material. The largest reconciling items are typically pension positions and fair value of debt — try adjusting those sliders.'
                : equityGap < 100
                ? 'Your bridge is closely aligned with the annual report.'
                : 'A moderate gap remains. Review the pension and deferred tax assumptions.'}
            </p>
          </>
        )}

        {/* Link to Stage 4 */}
        {groupBridge && (
          <button onClick={scrollToStage4} className="mt-3 text-sm text-fs-secondary hover:underline font-medium">
            See how company equity bridges to Group equity →
          </button>
        )}

        <p className="text-[10px] text-fs-text-muted mt-4 leading-relaxed">
          This bridge is a simplified illustrative tool for analytical purposes. It does not constitute financial
          advice. Always refer to SVT's audited accounts and regulatory submissions for precise figures. Analysis by Fox Stephens.
        </p>
      </section>

      {/* ── STAGE 4: Company to Group Equity ── */}
      {groupBridge && (
        <section ref={stage4Ref}>
          <h2 className="text-lg font-heading font-bold text-fs-text mb-1">Stage 4: Statutory company to group equity</h2>
          <p className="text-xs text-fs-text-muted mb-1">From STW Ltd (appointed company) to Severn Trent Plc (listed group)</p>
          <p className="text-xs text-fs-text leading-relaxed mb-4">
            Shareholders own Severn Trent Plc, not the appointed water company — this bridge shows why the Group equity
            visible to investors is typically lower than the appointed company equity.
          </p>

          {/* Year selector pills */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {groupBridge.map(g => (
              <button
                key={g.year}
                onClick={() => { setS4Year(g.year); setS4Custom(false); setS4ExpandedBar(null) }}
                className={`px-3 py-1.5 text-xs rounded-fs-sm border transition-colors ${
                  s4Year === g.year && !s4Custom
                    ? 'text-white border-transparent' : 'bg-white text-fs-text border-fs-border hover:border-fs-primary'
                }`}
                style={s4Year === g.year && !s4Custom ? { background: NAVY, borderColor: NAVY } : {}}
              >
                {g.year}
              </button>
            ))}
            <button
              onClick={enterCustomMode}
              className={`px-3 py-1.5 text-xs rounded-fs-sm border transition-colors ${
                s4Custom ? 'bg-fs-secondary text-white border-fs-secondary' : 'bg-white text-fs-text border-fs-border hover:border-fs-secondary'
              }`}
            >
              Custom
            </button>
          </div>

          {/* Custom mode inputs */}
          {s4Custom && s4CustomInputs && (
            <div className="rounded-fs-md border border-fs-border bg-white p-4 shadow-fs mb-6">
              <p className="text-xs font-medium text-fs-text mb-3">Custom inputs — adjust values to model scenarios</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-fs-text block mb-1">STW Ltd equity (£m)</label>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-fs-text-muted">£</span>
                    <input type="number" value={s4CustomInputs.companyEquity}
                      onChange={e => setS4CustomInputs(prev => ({ ...prev, companyEquity: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-2 py-1 text-xs border border-fs-border rounded-fs-sm focus:border-fs-primary focus:outline-none" />
                    <span className="text-xs text-fs-text-muted">m</span>
                  </div>
                </div>
                {s4CustomInputs.items.map((item, idx) => (
                  <div key={idx}>
                    <label className="text-xs font-medium text-fs-text block mb-1">{item.label} (£m)</label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-fs-text-muted">£</span>
                      <input type="number" value={item['value_£m']}
                        onChange={e => updateCustomItem(idx, parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 text-xs border border-fs-border rounded-fs-sm focus:border-fs-primary focus:outline-none" />
                      <span className="text-xs text-fs-text-muted">m</span>
                    </div>
                  </div>
                ))}
              </div>
              {rcv > 0 && (
                <div className="mt-3 text-xs text-fs-text-muted">
                  Implied Group equity / RCV: <strong className="text-fs-text">{(s4GroupEquity / rcv * 100).toFixed(1)}%</strong>
                  <span className="ml-2">— this is what investors see on Bloomberg / FactSet</span>
                </div>
              )}
            </div>
          )}

          {/* Waterfall chart */}
          {s4ChartData.length > 0 && (
            <div className="bg-white rounded-fs-md border border-fs-border p-4 shadow-fs mb-6">
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={s4ChartData} margin={{ top: 20, right: 20, bottom: 70, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-35} textAnchor="end" height={80} />
                  <YAxis tickFormatter={v => `${(v / 1000).toFixed(1)}bn`} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v, name, props) => {
                    const raw = props.payload.rawValue
                    return [fmtM(raw), name === 'base' ? 'Base' : props.payload.name]
                  }} />
                  <Bar dataKey="base" stackId="a" fill="transparent" />
                  <Bar dataKey="value" stackId="a" radius={[2, 2, 0, 0]}
                    onClick={(data) => {
                      if (data?.fullItem) setS4ExpandedBar(s4ExpandedBar === data.name ? null : data.name)
                    }}
                    cursor="pointer"
                  >
                    {s4ChartData.map((d, i) => (
                      <Cell key={i} fill={d.fill} opacity={d.isTotal ? 1 : 0.85}
                        stroke={s4ExpandedBar === d.name ? '#000' : 'none'} strokeWidth={s4ExpandedBar === d.name ? 2 : 0} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-[10px] text-fs-text-muted mt-1">Click a bar to see the explanation below</p>
            </div>
          )}

          {/* Expanded bar explanation */}
          {s4ExpandedBar && (() => {
            const bar = s4ChartData.find(d => d.name === s4ExpandedBar)
            const item = bar?.fullItem
            if (!item) return null
            return (
              <div className="rounded-fs-md border-l-4 border-fs-secondary bg-fs-secondary-light px-4 py-3 mb-6">
                <h3 className="text-sm font-heading font-bold text-fs-text mb-1">{item.label}</h3>
                <p className="text-xs text-fs-text leading-relaxed mb-2">{item.explanation}</p>
                <div className="flex flex-wrap gap-4 text-[10px] text-fs-text-muted">
                  <span>{item.structural ? 'Structural (always present)' : 'Variable (changes year to year)'}</span>
                  <span>Source: {item.source}</span>
                </div>
              </div>
            )
          })()}

          {/* Summary outputs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-fs-md border border-fs-border p-4 shadow-fs text-center">
              <div className="text-[10px] text-fs-text-muted uppercase tracking-wide">STW Ltd equity</div>
              <div className="text-lg font-heading font-bold text-fs-primary">{fmtM(s4CompanyEquity)}</div>
            </div>
            <div className="bg-white rounded-fs-md border border-fs-border p-4 shadow-fs text-center">
              <div className="text-[10px] text-fs-text-muted uppercase tracking-wide">Reconciling items</div>
              <div className="text-lg font-heading font-bold" style={{ color: AMBER }}>
                {s4GroupEquity - s4CompanyEquity >= 0 ? '+' : '-'}{fmtM(Math.abs(s4GroupEquity - s4CompanyEquity))}
              </div>
              <div className="text-[10px] text-fs-text-muted">net</div>
            </div>
            <div className="rounded-fs-md border-2 p-4 shadow-fs text-center" style={{ borderColor: NAVY, background: '#f0f4f8' }}>
              <div className="text-[10px] uppercase tracking-wide" style={{ color: NAVY }}>Group equity</div>
              <div className="text-lg font-heading font-bold" style={{ color: NAVY }}>{fmtM(s4GroupEquity)}</div>
            </div>
            <div className="bg-white rounded-fs-md border border-fs-border p-4 shadow-fs text-center">
              <div className="text-[10px] text-fs-text-muted uppercase tracking-wide">Group equity / RCV</div>
              <div className="text-lg font-heading font-bold" style={{ color: NAVY }}>
                {rcv > 0 ? `${s4GroupEquityRCV.toFixed(1)}%` : '—'}
              </div>
              <div className="text-[10px] text-fs-text-muted">what investors see</div>
            </div>
          </div>

          {/* Context note */}
          <div className="rounded-fs-md border border-fs-border bg-white shadow-fs overflow-hidden mb-6">
            <button onClick={() => setShowContext(!showContext)}
              className="w-full px-4 py-3 flex justify-between items-center text-left hover:bg-slate-50 transition-colors">
              <span className="text-sm font-heading font-bold text-fs-text">Why does this matter for investors?</span>
              <span className="text-fs-text-muted text-xs">{showContext ? '▲' : '▼'}</span>
            </button>
            {showContext && (
              <div className="px-4 pb-4 text-xs text-fs-text leading-relaxed space-y-2">
                <p>
                  Severn Trent Plc trades on the London Stock Exchange. Its market capitalisation is compared against Group equity
                  (net assets) to derive the price-to-book ratio. A premium to book (market cap {'>'} Group equity) reflects investors'
                  expectation of future regulatory returns. A discount would signal concern about the regulatory settlement or financial position.
                </p>
                <p>
                  At March 2025, Group equity was £1,770.8m — significantly lower than STW Ltd's statutory equity of £3,006m. The
                  difference arises primarily from intercompany financing structures eliminated on consolidation and Group-level debt
                  at the holding company. Analysts should use Group equity (not appointed company equity) when calculating price-to-book ratios.
                </p>
              </div>
            )}
          </div>

          {/* Historical chart */}
          {historyData.length >= 3 && (
            <div className="rounded-fs-md border border-fs-border bg-white shadow-fs overflow-hidden">
              <button onClick={() => setShowHistory(!showHistory)}
                className="w-full px-4 py-3 flex justify-between items-center text-left hover:bg-slate-50 transition-colors">
                <span className="text-sm font-heading font-bold text-fs-text">Show history</span>
                <span className="text-fs-text-muted text-xs">{showHistory ? '▲' : '▼'}</span>
              </button>
              {showHistory && (
                <div className="px-4 pb-4">
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={historyData} margin={{ top: 10, right: 50, bottom: 10, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                      <YAxis yAxisId="left" tickFormatter={v => `${(v / 1000).toFixed(1)}bn`} tick={{ fontSize: 10 }} />
                      <YAxis yAxisId="right" orientation="right" tickFormatter={v => `${(v / 1000).toFixed(0)}bn`} tick={{ fontSize: 10 }} />
                      <Tooltip content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null
                        return (
                          <div className="bg-white border border-fs-border rounded-fs-sm px-3 py-2 shadow-fs text-xs">
                            <p className="font-heading font-bold text-fs-text mb-1">{label}</p>
                            {payload.map((p, i) => (
                              <p key={i} style={{ color: p.color }}>{p.name}: £{(p.value / 1000).toFixed(1)}bn</p>
                            ))}
                            {label === '2023-24' && (
                              <p className="mt-1 text-[10px] text-fs-text-muted italic leading-snug">
                                Group equity increased from £970.6m to £1,834.0m following an equity raise in FY2024.
                              </p>
                            )}
                          </div>
                        )
                      }} />
                      <ReferenceLine x="2023-24" stroke={AMBER} strokeDasharray="4 2"
                        label={{ value: 'Equity raise FY24', position: 'top', fontSize: 9, fill: AMBER }} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Line yAxisId="left" type="monotone" dataKey="company" name="STW Ltd equity" stroke={GREEN} strokeWidth={2} dot={{ r: 4 }} />
                      <Line yAxisId="left" type="monotone" dataKey="group" name="Group equity" stroke={NAVY} strokeWidth={2} dot={{ r: 4 }} />
                      {historyData[0]?.rcv && (
                        <Line yAxisId="right" type="monotone" dataKey="rcv" name="RCV" stroke={GREEN} strokeWidth={1.5} strokeDasharray="6 3" dot={{ r: 3 }} />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                  <p className="text-[10px] text-fs-text-muted mt-2">
                    The gap between STW Ltd equity and Group equity reflects the structural impact of Group-level financing
                    and intercompany consolidation adjustments. The FY24 jump in Group equity reflects the £986m equity placing.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
