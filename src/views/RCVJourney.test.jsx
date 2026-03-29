import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Mock fetch for JSON data files
const mockAnnual = [
  {
    year: '2023-24', year_end: 2024, amp_period: 'AMP7',
    opening_rcv: 11818.86, indexation: 728.31, indexation_basis: 'CPIH',
    rcv_additions: 657.01, depreciation: -590.29, outperformance: 0, other_adjustments: -207.99,
    closing_rcv: 11885.57, closing_rcv_nominal_bn: 11.886, yoy_growth_pct: 5.2,
    data_source: '2025-SVE', is_projection: false,
  },
  {
    year: '2024-25', year_end: 2025, amp_period: 'AMP7',
    opening_rcv: 13556.2, indexation: 394.4, indexation_basis: 'CPIH',
    rcv_additions: 576.11, depreciation: -614.35, outperformance: 0, other_adjustments: 1276.23,
    closing_rcv: 13517.96, closing_rcv_nominal_bn: 13.518, yoy_growth_pct: 13.73,
    data_source: '2025-SVE', is_projection: false,
  },
  {
    year: '2025-26', year_end: 2026, amp_period: 'AMP8',
    opening_rcv: 13517.96, indexation: null, indexation_basis: 'CPIH',
    rcv_additions: null, depreciation: null, outperformance: 0, other_adjustments: 0,
    closing_rcv: 14780.73, closing_rcv_nominal_bn: 14.781, yoy_growth_pct: 9.34,
    data_source: 'AMP8 Financial Model', is_projection: true,
  },
]

const mockAmp8 = {
  payg_rate: 0.3797, rcv_runoff_rate: 0.042,
  rcv_growth_nominal_pct: 56.69, rcv_growth_real_pct: 40.21,
  years: [
    { year: '2025-26', rcv_nominal: { pre_2020: 9077.1, '2020_25': 3939.2, post_2025: 1764.4, total: 14780.7 }, rcv_real: { pre_2020: 8159.0, '2020_25': 3540.8, post_2025: 1585.9, total: 13285.7 }, household_bill_real: 462.57, household_bill_nominal: 514.62, aicr: 1.3233, gearing: 0.5808, ffo_net_debt: 0.087, dividends_nominal: 258.6 },
    { year: '2029-30', rcv_nominal: { pre_2020: 8229.6, '2020_25': 3571.8, post_2025: 9088.3, total: 20889.8 }, rcv_real: { pre_2020: 6771.2, '2020_25': 2938.9, post_2025: 7477.8, total: 17187.9 }, household_bill_real: 583.46, household_bill_nominal: 709.13, aicr: 1.8407, gearing: 0.5557, ffo_net_debt: 0.1127, dividends_nominal: 482.3 },
  ],
}

const mockPC = {
  year: '2024-25', source: 'Ofwat Spring 2025 Valuation Exercise', total_rcv: 13518.0,
  price_controls: [
    { name: 'Water Resources', short: 'WR', closing_rcv: 555.7, pct_of_total: 4.1 },
    { name: 'Water Network+', short: 'WN', closing_rcv: 6139.6, pct_of_total: 45.4 },
    { name: 'Wastewater Network+', short: 'WWN', closing_rcv: 6130.7, pct_of_total: 45.4 },
    { name: 'Bioresources', short: 'BR', closing_rcv: 692.0, pct_of_total: 5.1 },
  ],
}

const mockSummary = [
  { amp_period: 'AMP7', years: '2020-2025', opening_rcv: 9388.07, closing_rcv: 13517.96, total_rcv_additions: 2898.21, total_depreciation: -2777.92, total_indexation: 2919.13, net_growth: 4129.89, net_growth_pct: 44.0, annual_rcv_bn: [] },
]

beforeEach(() => {
  global.fetch = vi.fn((url) => {
    if (url.includes('rcv_history_annual')) return Promise.resolve({ json: () => Promise.resolve(mockAnnual) })
    if (url.includes('rcv_amp8_detail')) return Promise.resolve({ json: () => Promise.resolve(mockAmp8) })
    if (url.includes('rcv_price_control_split')) return Promise.resolve({ json: () => Promise.resolve(mockPC) })
    if (url.includes('rcv_history_amp_summary')) return Promise.resolve({ json: () => Promise.resolve(mockSummary) })
    return Promise.reject(new Error(`unmocked fetch: ${url}`))
  })
})

import RCVJourney from './RCVJourney'

function renderView() {
  return render(<MemoryRouter><RCVJourney /></MemoryRouter>)
}

describe('RCVJourney', () => {
  it('renders without crashing', async () => {
    renderView()
    await waitFor(() => expect(screen.getByText('RCV Journey')).toBeInTheDocument())
  })

  it('renders waterfall bars with correct count (5 bars)', async () => {
    renderView()
    await waitFor(() => expect(screen.getByText('Opening RCV')).toBeInTheDocument())
    expect(screen.getByText('+ Indexation')).toBeInTheDocument()
    expect(screen.getByText('+ RCV Additions')).toBeInTheDocument()
    expect(screen.getByText('- Depreciation')).toBeInTheDocument()
    expect(screen.getByText('Closing RCV')).toBeInTheDocument()
  })

  it('nominal/real toggle buttons are present', async () => {
    renderView()
    await waitFor(() => expect(screen.getByText('Nominal £bn')).toBeInTheDocument())
    expect(screen.getByText('Real £bn')).toBeInTheDocument()
  })

  it('show components toggle is present and clickable', async () => {
    renderView()
    await waitFor(() => expect(screen.getByText('Show components')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Show components'))
    expect(screen.getByText('Hide components')).toBeInTheDocument()
  })

  it('stat strip shows four metric cards', async () => {
    renderView()
    await waitFor(() => expect(screen.getByText('Opening RCV AMP8')).toBeInTheDocument())
    expect(screen.getByText('Closing RCV AMP8')).toBeInTheDocument()
    expect(screen.getByText('AMP8 growth')).toBeInTheDocument()
    expect(screen.getByText('AMP8 growth %')).toBeInTheDocument()
  })

  it('renders price control breakdown section', async () => {
    renderView()
    await waitFor(() => expect(screen.getByText('Price Control Breakdown')).toBeInTheDocument())
    expect(screen.getByText('Water Resources')).toBeInTheDocument()
    expect(screen.getByText('Bioresources')).toBeInTheDocument()
  })

  it('clicking a waterfall bar shows explanation', async () => {
    renderView()
    await waitFor(() => expect(screen.getByText('+ Indexation')).toBeInTheDocument())
    // Click the indexation bar text
    fireEvent.click(screen.getByText('+ Indexation'))
    await waitFor(() => expect(screen.getByText(/inflation adjustment/i)).toBeInTheDocument())
  })
})
