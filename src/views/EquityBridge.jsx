import { useReducer, useEffect, useState, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'

const GREEN = '#005030'
const AMBER = '#F47321'
const GREY = '#9ca3af'

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

function StatBox({ label, value, sub }) {
  return (
    <div className="text-center">
      <div className="text-[10px] text-fs-text-muted uppercase tracking-wide">{label}</div>
      <div className="text-lg font-heading font-bold text-fs-primary">{value}</div>
      {sub && <div className="text-[10px] text-fs-text-muted">{sub}</div>}
    </div>
  )
}

export default function EquityBridge() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [amp8Data, setAmp8Data] = useState(null)

  useEffect(() => {
    fetch('/data/rcv_amp8_detail.json').then(r => r.json()).then(setAmp8Data)
  }, [])

  const set = useCallback((field) => (value) => dispatch({ type: 'SET', field, value }), [])

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

  // Build waterfall chart data for Stage 2
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-heading font-bold text-fs-primary mb-1">Equity Bridge</h1>
        <p className="text-sm text-fs-text-muted">
          From RCV to regulated equity to statutory equity — an interactive walkthrough
        </p>
      </div>

      {/* ── Sticky Summary Bar ── */}
      <div className="sticky top-14 z-40 bg-white border-b border-fs-border px-4 py-2.5 -mx-4 sm:-mx-6 lg:-mx-8"
        style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
        <StatBox label="RCV" value={`£${(rcv / 1000).toFixed(1)}bn`} />
        <span className="text-fs-border">|</span>
        <StatBox label="Regulated equity" value={`£${(regulatedEquity / 1000).toFixed(1)}bn`} />
        <span className="text-fs-border">|</span>
        <StatBox label="Statutory equity" value={`£${(statutoryEquity / 1000).toFixed(1)}bn`} />
      </div>

      {/* ── STAGE 1: RCV to Regulated Equity ── */}
      <section>
        <h2 className="text-lg font-heading font-bold text-fs-text mb-1">Stage 1: RCV to Regulated Equity</h2>
        <p className="text-xs text-fs-text-muted mb-4">RCV minus net debt at notional gearing = regulated equity</p>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Chart */}
          <div className="flex-1 bg-white rounded-fs-md border border-fs-border p-4 shadow-fs">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={stage1Data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}bn`} tick={{ fontSize: 10 }} />
                <Tooltip formatter={v => `£${(Math.abs(Number(v)) / 1000).toFixed(1)}bn`} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {stage1Data.map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Controls */}
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

              <Slider
                label="Notional gearing"
                value={state.gearing} min={50} max={75} step={0.5} unit="%"
                onChange={set('gearing')}
                note="Notional gearing is Ofwat's assumed capital structure for a notionally efficient company. It is used to calculate the allowed return, not SVT's actual debt level. SVT's actual gearing may differ — see Stage 3 to compare."
              />
              <p className="text-[10px] text-fs-text-muted -mt-2 mb-3">Ofwat notional assumption: 60.0%</p>

              <div className="space-y-1 text-xs border-t border-fs-border pt-3">
                <div className="flex justify-between"><span className="text-fs-text-muted">Notional debt:</span><span className="font-semibold">£{notionalDebt.toLocaleString(undefined, { maximumFractionDigits: 0 })}m</span></div>
                <div className="flex justify-between"><span className="text-fs-text-muted">Regulated equity:</span><span className="font-semibold text-fs-primary">£{regulatedEquity.toLocaleString(undefined, { maximumFractionDigits: 0 })}m</span></div>
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
          {/* Waterfall chart */}
          <div className="flex-1 bg-white rounded-fs-md border border-fs-border p-4 shadow-fs">
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={stage2ChartData} margin={{ top: 20, right: 20, bottom: 60, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-35} textAnchor="end" height={70} />
                <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}bn`} tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(v, name, props) => {
                    const raw = props.payload.rawValue
                    return [`£${(raw / 1000).toFixed(1)}bn`, name === 'base' ? 'Base' : props.payload.name]
                  }}
                />
                <Bar dataKey="base" stackId="a" fill="transparent" />
                <Bar dataKey="value" stackId="a" radius={[2, 2, 0, 0]}>
                  {stage2ChartData.map((d, i) => (
                    <Cell key={i} fill={d.fill} opacity={d.isTotal ? 1 : 0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Controls */}
          <div className="w-full lg:w-72 space-y-4">
            <div className="bg-white rounded-fs-md border border-fs-border p-4 shadow-fs">
              <Slider
                label="Pension surplus / (deficit)"
                value={state.pension} min={-1000} max={1000} step={50} unit="£m"
                onChange={set('pension')}
                note="SVT operates a defined benefit pension scheme. The IAS 19 position can be material — check the latest SVT annual report for the current figure."
              />

              <Slider
                label="Fair value adjustment on debt"
                value={state.fairValueDebt} min={-2000} max={500} step={50} unit="£m"
                onChange={set('fairValueDebt')}
                note="Arises under IFRS 9 / hedge accounting where debt is marked to market. Negative when market rates have fallen below SVT's fixed coupon rates."
              />

              <Slider
                label="Deferred tax liability (net)"
                value={state.deferredTax} min={-800} max={200} step={50} unit="£m"
                onChange={set('deferredTax')}
                note="Typically a liability in regulated water companies due to accelerated capital allowances."
              />

              <NumberInput
                label="Goodwill & intangibles (£m)"
                value={state.goodwill} onChange={set('goodwill')} min={0} max={2000}
                note="SVT has historically carried minimal goodwill. Enter any acquired goodwill from the balance sheet."
              />

              <Slider
                label="Non-regulated net assets"
                value={state.nonRegulated} min={-500} max={500} step={25} unit="£m"
                onChange={set('nonRegulated')}
                note="SVT's non-appointed activities. Net of any non-regulated debt."
              />

              <NumberInput
                label="Other IFRS adjustments (£m)"
                value={state.otherIFRS} onChange={set('otherIFRS')} min={-500} max={500}
              />
            </div>

            <div className="bg-white rounded-fs-md border border-fs-border p-4 shadow-fs space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-fs-text-muted">Statutory equity:</span><span className="font-semibold text-fs-primary">£{statutoryEquity.toLocaleString(undefined, { maximumFractionDigits: 0 })}m</span></div>
              <div className="flex justify-between"><span className="text-fs-text-muted">Statutory equity / RCV:</span><span className="font-semibold">{bridgeEquityRCV.toFixed(1)}%</span></div>
              <div className="flex justify-between">
                <span className="text-fs-text-muted">Premium / (discount):</span>
                <span className={`font-semibold ${statutoryEquity > regulatedEquity ? 'text-fs-primary' : 'text-fs-secondary'}`}>
                  {((statutoryEquity - regulatedEquity) / regulatedEquity * 100).toFixed(1)}%
                </span>
              </div>
              <p className="text-[10px] text-fs-text-muted italic pt-1">vs RCV — what equity investors watch</p>
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
            <input type="number" value={state.annualReportRCV}
              onChange={e => set('annualReportRCV')(e.target.value)}
              placeholder="e.g. 13518"
              className="w-full px-3 py-2 text-sm border border-fs-border rounded-fs-sm focus:border-fs-primary focus:outline-none bg-white"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-fs-text block mb-1">Statutory net assets / equity (£m)</label>
            <input type="number" value={state.annualReportEquity}
              onChange={e => set('annualReportEquity')(e.target.value)}
              placeholder="e.g. 5200"
              className="w-full px-3 py-2 text-sm border border-fs-border rounded-fs-sm focus:border-fs-primary focus:outline-none bg-white"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-fs-text block mb-1">Financial year</label>
            <input type="text" value={state.annualReportYear}
              onChange={e => set('annualReportYear')(e.target.value)}
              placeholder="e.g. 2024-25"
              className="w-full px-3 py-2 text-sm border border-fs-border rounded-fs-sm focus:border-fs-primary focus:outline-none bg-white"
            />
          </div>
        </div>

        {arFilled && (
          <>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-fs-border">
                    <th className="text-left py-2 font-medium text-fs-text">Item</th>
                    <th className="text-right py-2 font-medium text-fs-text">Your bridge</th>
                    <th className="text-right py-2 font-medium text-fs-text">Annual report</th>
                    <th className="text-right py-2 font-medium text-fs-text">Gap</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-fs-border/50">
                    <td className="py-2">RCV (£m)</td>
                    <td className="text-right py-2">£{rcv.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className="text-right py-2">£{arRCV.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className="text-right py-2">£{Math.abs(rcv - arRCV).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  </tr>
                  <tr className="border-b border-fs-border/50">
                    <td className="py-2">Statutory equity (£m)</td>
                    <td className="text-right py-2">£{statutoryEquity.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className="text-right py-2">£{arEquity.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className="text-right py-2">£{equityGap.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
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
                ? 'Your bridge is closely aligned with the annual report. The remaining difference is likely timing and minor accounting items.'
                : 'A moderate gap remains. Review the pension and deferred tax assumptions — these are the most variable items between companies and years.'}
            </p>
          </>
        )}

        <p className="text-[10px] text-fs-text-muted mt-4 leading-relaxed">
          This bridge is a simplified illustrative tool for analytical purposes. It does not constitute financial
          advice. Always refer to SVT's audited accounts and regulatory submissions for precise figures. Analysis
          by Fox Stephens.
        </p>
      </section>
    </div>
  )
}
