import { useState, useEffect, useMemo } from 'react'
import { Tooltip, ResponsiveContainer, LineChart, Line, YAxis } from 'recharts'
import usePageTitle from '../hooks/usePageTitle'

const GREEN = '#005030'
const AMBER = '#F47321'
const RED = '#dc2626'

/**
 * Key SVT Performance Commitments for tracking.
 * Data compiled from Ofwat FD OC models and SVT summary data.
 */
const PC_DEFINITIONS = [
  {
    id: 'leakage',
    name: 'Leakage (3-year avg)',
    unit: 'Ml/d',
    direction: 'lower',
    target2030: 289.7,
    history: [
      { year: '2019-20', value: 434.7 },
      { year: '2020-21', value: 401.2 },
      { year: '2021-22', value: 397.3 },
      { year: '2022-23', value: 415.6 },
      { year: '2023-24', value: null },
    ],
    amp8Targets: [
      { year: '2025-26', value: 349.9 },
      { year: '2026-27', value: 329.5 },
      { year: '2027-28', value: 309.6 },
      { year: '2028-29', value: 299.6 },
      { year: '2029-30', value: 289.7 },
    ],
  },
  {
    id: 'supply-interruptions',
    name: 'Supply Interruptions',
    unit: 'mins/prop',
    direction: 'lower',
    target2030: 5.0,
    history: [
      { year: '2019-20', value: 5.88 },
      { year: '2020-21', value: 4.12 },
      { year: '2021-22', value: 8.03 },
      { year: '2022-23', value: 7.33 },
      { year: '2023-24', value: null },
    ],
    amp8Targets: [
      { year: '2025-26', value: 5.0 },
      { year: '2026-27', value: 5.0 },
      { year: '2027-28', value: 5.0 },
      { year: '2028-29', value: 5.0 },
      { year: '2029-30', value: 5.0 },
    ],
  },
  {
    id: 'pollution',
    name: 'Pollution Incidents',
    unit: 'per 10k km',
    direction: 'lower',
    target2030: 19.5,
    history: [
      { year: '2019-20', value: 25.7 },
      { year: '2020-21', value: 23.8 },
      { year: '2021-22', value: 22.1 },
      { year: '2022-23', value: 23.9 },
      { year: '2023-24', value: null },
    ],
    amp8Targets: [
      { year: '2025-26', value: 23.4 },
      { year: '2026-27', value: 22.4 },
      { year: '2027-28', value: 21.5 },
      { year: '2028-29', value: 20.5 },
      { year: '2029-30', value: 19.5 },
    ],
  },
  {
    id: 'sewer-flooding',
    name: 'Internal Sewer Flooding',
    unit: 'per 10k conn',
    direction: 'lower',
    target2030: 1.30,
    history: [
      { year: '2019-20', value: 2.22 },
      { year: '2020-21', value: 1.86 },
      { year: '2021-22', value: 1.61 },
      { year: '2022-23', value: 1.65 },
      { year: '2023-24', value: 1.67 },
    ],
    amp8Targets: [
      { year: '2025-26', value: 1.30 },
      { year: '2026-27', value: 1.30 },
      { year: '2027-28', value: 1.30 },
      { year: '2028-29', value: 1.30 },
      { year: '2029-30', value: 1.30 },
    ],
  },
  {
    id: 'pcc',
    name: 'Per Capita Consumption',
    unit: 'l/p/d',
    direction: 'lower',
    target2030: 121.2,
    history: [
      { year: '2019-20', value: 132.5 },
      { year: '2020-21', value: 141.2 },
      { year: '2021-22', value: 136.8 },
      { year: '2022-23', value: 133.4 },
      { year: '2023-24', value: null },
    ],
    amp8Targets: [
      { year: '2025-26', value: 128.5 },
      { year: '2026-27', value: 126.1 },
      { year: '2027-28', value: 123.8 },
      { year: '2028-29', value: 122.5 },
      { year: '2029-30', value: 121.2 },
    ],
  },
  {
    id: 'cri',
    name: 'Compliance Risk Index',
    unit: 'index',
    direction: 'lower',
    target2030: 2.0,
    history: [
      { year: '2019-20', value: 3.94 },
      { year: '2020-21', value: 1.53 },
      { year: '2021-22', value: 2.43 },
      { year: '2022-23', value: 5.65 },
      { year: '2023-24', value: 6.19 },
    ],
    amp8Targets: [
      { year: '2025-26', value: 2.73 },
      { year: '2026-27', value: 2.40 },
      { year: '2027-28', value: 2.13 },
      { year: '2028-29', value: 2.00 },
      { year: '2029-30', value: 2.00 },
    ],
  },
]

function getStatus(pc) {
  const historyVals = pc.history.filter(d => d.value != null)
  if (historyVals.length === 0) return { status: 'No data', color: '#9ca3af' }
  const latest = historyVals[historyVals.length - 1].value
  const target = pc.target2030
  const isLower = pc.direction === 'lower'
  const gap = isLower ? (latest - target) / target : (target - latest) / target

  if (gap <= 0) return { status: 'Outperforming', color: GREEN }
  if (gap <= 0.10) return { status: 'On track', color: GREEN }
  if (gap <= 0.25) return { status: 'At risk', color: AMBER }
  return { status: 'Off track', color: RED }
}

function MiniSparkline({ data, color }) {
  if (!data || data.length < 2) return null
  return (
    <ResponsiveContainer width="100%" height={50}>
      <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <YAxis hide domain={['dataMin - 5%', 'dataMax + 5%']} />
        <Tooltip
          formatter={(v) => [v?.toFixed(1), 'Value']}
          labelFormatter={(l) => l}
          contentStyle={{ fontSize: 10 }}
        />
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} connectNulls />
        {data.some(d => d.target != null) && (
          <Line type="monotone" dataKey="target" stroke="#9ca3af" strokeWidth={1} strokeDasharray="4 3" dot={false} connectNulls />
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}

function PCCard({ pc }) {
  const { status, color } = getStatus(pc)
  const historyVals = pc.history.filter(d => d.value != null)
  const latestValue = historyVals.length > 0 ? historyVals[historyVals.length - 1].value : null
  const latestYear = historyVals.length > 0 ? historyVals[historyVals.length - 1].year : null

  // Combined chart data: history + AMP8 targets
  const chartData = [
    ...pc.history.map(d => ({ year: d.year, value: d.value, target: null })),
    ...pc.amp8Targets.map(d => ({ year: d.year, value: null, target: d.value })),
  ]

  return (
    <div className="bg-white rounded-fs-md border border-fs-border p-4 shadow-fs hover:shadow-fs-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-heading font-bold text-fs-text leading-tight">{pc.name}</h3>
        <span
          className="text-[10px] px-2 py-0.5 rounded-full font-medium text-white shrink-0 ml-2"
          style={{ background: color }}
        >
          {status}
        </span>
      </div>

      <MiniSparkline data={chartData} color={color} />

      <div className="mt-2 space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-fs-text-muted">Latest ({latestYear}):</span>
          <span className="font-semibold text-fs-text">
            {latestValue != null ? `${latestValue.toFixed(1)} ${pc.unit}` : 'n/a'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-fs-text-muted">2029-30 target:</span>
          <span className="font-semibold text-fs-primary">{pc.target2030} {pc.unit}</span>
        </div>
      </div>
    </div>
  )
}

export default function PCTracker() {
  usePageTitle('PC Tracker')
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-fs-primary mb-1">PC Tracker</h1>
        <p className="text-sm text-fs-text-muted">
          SVT Performance Commitment trajectories — historical performance vs AMP8 targets
        </p>
      </div>

      <div className="rounded-fs-md border-l-4 border-fs-secondary bg-fs-secondary-light px-4 py-3 mb-4">
        <p className="text-xs text-fs-text leading-relaxed">
          Each card shows SVT's historical performance (solid line) and AMP8 target trajectory (dashed line).
          Status badges indicate whether current performance is on track to meet the 2029-30 PCL.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PC_DEFINITIONS.map(pc => (
          <PCCard key={pc.id} pc={pc} />
        ))}
      </div>

      <div className="text-[10px] text-fs-text-muted italic">
        Source: Ofwat PR24 FD OC models and SVT annual performance reports. Historical data may reflect
        different reporting methodologies across AMPs.
      </div>
    </div>
  )
}
