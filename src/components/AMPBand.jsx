import { ReferenceArea } from 'recharts'

/**
 * AMP period bands as Recharts ReferenceArea elements.
 * periods = array of period labels like "2020-21", "2025-26" etc.
 */
export function getAMPBands(periods) {
  const bands = []
  const amp7Start = periods.find((p) => p.startsWith('2020'))
  const amp7End = periods.find((p) => p.startsWith('2024'))
  const amp8Start = periods.find((p) => p.startsWith('2025'))
  const amp8End = periods.find((p) => p.startsWith('2029'))

  if (amp7Start || amp7End) {
    bands.push({
      key: 'AMP7',
      x1: amp7Start || periods[0],
      x2: amp7End || amp8Start || periods[periods.length - 1],
      label: 'AMP7',
      fill: '#f1f5f9',
    })
  }
  if (amp8Start || amp8End) {
    bands.push({
      key: 'AMP8',
      x1: amp8Start,
      x2: amp8End || periods[periods.length - 1],
      label: 'AMP8',
      fill: '#ecfdf5',
    })
  }
  return bands
}

export function AMPBandAreas({ periods }) {
  const bands = getAMPBands(periods)
  return bands.map((b) => (
    <ReferenceArea
      key={b.key}
      x1={b.x1}
      x2={b.x2}
      fill={b.fill}
      fillOpacity={0.5}
      label={{ value: b.label, position: 'insideTopLeft', fontSize: 11, fill: '#94a3b8' }}
    />
  ))
}
