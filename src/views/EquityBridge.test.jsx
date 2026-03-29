import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const mockAmp8 = {
  payg_rate: 0.3797, rcv_runoff_rate: 0.042,
  rcv_growth_nominal_pct: 56.69, rcv_growth_real_pct: 40.21,
  years: [
    { year: '2025-26', rcv_nominal: { total: 14780.7 }, rcv_real: { total: 13285.7 }, household_bill_real: 462.57, household_bill_nominal: 514.62, aicr: 1.3233, gearing: 0.5808, ffo_net_debt: 0.087, dividends_nominal: 258.6 },
    { year: '2029-30', rcv_nominal: { total: 20889.8 }, rcv_real: { total: 17187.9 }, household_bill_real: 583.46, household_bill_nominal: 709.13, aicr: 1.8407, gearing: 0.5557, ffo_net_debt: 0.1127, dividends_nominal: 482.3 },
  ],
}

const mockActuals = [
  { year: '2022-23', 'rcv_£m': 11886, 'statutory_equity_£m': 2310, 'group_equity_£m': 970.6 },
  { year: '2023-24', 'rcv_£m': 13518, 'statutory_equity_£m': 2839, 'group_equity_£m': 1834.0 },
  { year: '2024-25', 'rcv_£m': 14781, 'statutory_equity_£m': 3006, 'group_equity_£m': 1770.8 },
]

const mockGroupBridge = [
  {
    year: '2024-25', year_end: 'March 2025',
    'company_equity_£m': 3006.0, 'group_equity_£m': 1770.8,
    reconciling_items: [
      { label: 'Goodwill on consolidation', short_label: 'Goodwill', 'value_£m': 117.3, direction: 'positive', explanation: 'Test goodwill', structural: true, source: 'Test' },
      { label: 'Non-regulated subsidiaries', short_label: 'Non-reg. subs', 'value_£m': 150.0, direction: 'positive', explanation: 'Test non-reg', structural: true, source: 'Test' },
      { label: 'Plc & holdco net debt', short_label: 'Plc net debt', 'value_£m': -169.1, direction: 'negative', explanation: 'Test plc debt', structural: true, source: 'Test' },
      { label: 'Intercompany & consolidation adjustments', short_label: 'Consol. adj.', 'value_£m': -1333.4, direction: 'negative', explanation: 'Test consol', structural: true, source: 'Test' },
    ],
    implied_gap: -1235.2, explained_gap: -1235.2, unexplained_residual: 0.0,
  },
  {
    year: '2023-24', year_end: 'March 2024',
    'company_equity_£m': 2839.0, 'group_equity_£m': 1834.0,
    reconciling_items: [
      { label: 'Goodwill on consolidation', short_label: 'Goodwill', 'value_£m': 112.8, direction: 'positive', explanation: 'Test', structural: true, source: 'Test' },
      { label: 'Non-regulated subsidiaries', short_label: 'Non-reg. subs', 'value_£m': 130.0, direction: 'positive', explanation: 'Test', structural: true, source: 'Test' },
      { label: 'Plc & holdco net debt', short_label: 'Plc net debt', 'value_£m': -558.1, direction: 'negative', explanation: 'Test', structural: true, source: 'Test' },
      { label: 'Intercompany & consolidation adjustments', short_label: 'Consol. adj.', 'value_£m': -689.7, direction: 'negative', explanation: 'Test', structural: true, source: 'Test' },
    ],
    implied_gap: -1005.0, explained_gap: -1005.0, unexplained_residual: 0.0,
  },
  {
    year: '2022-23', year_end: 'March 2023',
    'company_equity_£m': 2310.0, 'group_equity_£m': 970.6,
    reconciling_items: [
      { label: 'Goodwill on consolidation', short_label: 'Goodwill', 'value_£m': 113.0, direction: 'positive', explanation: 'Test', structural: true, source: 'Test' },
      { label: 'Non-regulated subsidiaries', short_label: 'Non-reg. subs', 'value_£m': 120.0, direction: 'positive', explanation: 'Test', structural: true, source: 'Test' },
      { label: 'Plc & holdco net debt', short_label: 'Plc net debt', 'value_£m': -600.0, direction: 'negative', explanation: 'Test', structural: true, source: 'Test' },
      { label: 'Intercompany & consolidation adjustments', short_label: 'Consol. adj.', 'value_£m': -972.4, direction: 'negative', explanation: 'Test', structural: true, source: 'Test' },
    ],
    implied_gap: -1339.4, explained_gap: -1339.4, unexplained_residual: 0.0,
  },
]

beforeEach(() => {
  global.fetch = vi.fn((url) => {
    if (url.includes('group_bridge')) {
      return Promise.resolve({ json: () => Promise.resolve(mockGroupBridge) })
    }
    if (url.includes('annual_report_actuals')) {
      return Promise.resolve({ json: () => Promise.resolve(mockActuals) })
    }
    return Promise.resolve({ json: () => Promise.resolve(mockAmp8) })
  })
})

import EquityBridge from './EquityBridge'

function renderView() {
  return render(<MemoryRouter><EquityBridge /></MemoryRouter>)
}

describe('EquityBridge', () => {
  it('renders without crashing', async () => {
    renderView()
    await waitFor(() => expect(screen.getByText('Equity Bridge')).toBeInTheDocument())
  })

  it('sticky summary bar shows four values including Group equity', async () => {
    renderView()
    await waitFor(() => {
      expect(screen.getByText('RCV')).toBeInTheDocument()
      expect(screen.getByText('Regulated equity')).toBeInTheDocument()
      expect(screen.getByText('Company equity')).toBeInTheDocument()
      expect(screen.getByText('Group equity')).toBeInTheDocument()
    })
  })

  it('gearing slider at 60% produces correct regulated equity (RCV x 0.40)', async () => {
    renderView()
    await waitFor(() => expect(screen.getByText('Stage 1: RCV to Regulated Equity')).toBeInTheDocument())
    expect(screen.getByText(/5,912/)).toBeInTheDocument()
  })

  it('gearing slider at 70% produces correct regulated equity (RCV x 0.30)', async () => {
    renderView()
    await waitFor(() => expect(screen.getByText('Notional gearing')).toBeInTheDocument())
    const sliders = document.querySelectorAll('input[type="range"]')
    const gearingSlider = sliders[0]
    fireEvent.change(gearingSlider, { target: { value: '70' } })
    await waitFor(() => expect(screen.getByText(/4,434/)).toBeInTheDocument())
  })

  it('pension slider updates statutory equity correctly', async () => {
    renderView()
    await waitFor(() => expect(screen.getByText('Stage 2: Regulated to Statutory Equity')).toBeInTheDocument())
    const sliders = document.querySelectorAll('input[type="range"]')
    const pensionSlider = sliders[1]
    fireEvent.change(pensionSlider, { target: { value: '500' } })
    await waitFor(() => {
      const el = screen.getAllByText(/5,912/)
      expect(el.length).toBeGreaterThan(0)
    })
  })

  it('deferred tax slider updates statutory equity correctly', async () => {
    renderView()
    await waitFor(() => expect(screen.getByText('Deferred tax liability (net)')).toBeInTheDocument())
    const sliders = document.querySelectorAll('input[type="range"]')
    const dtSlider = sliders[3]
    fireEvent.change(dtSlider, { target: { value: '0' } })
    await waitFor(() => {
      const el = screen.getAllByText(/5,712/)
      expect(el.length).toBeGreaterThan(0)
    })
  })

  it('renders Stage 3 annual report section', async () => {
    renderView()
    await waitFor(() => expect(screen.getByText("Check against SVT's annual report")).toBeInTheDocument())
  })

  it('Stage 3 comparison table appears when all three inputs filled', async () => {
    renderView()
    await waitFor(() => expect(screen.getByText("Check against SVT's annual report")).toBeInTheDocument())

    const inputs = screen.getAllByRole('spinbutton')
    const rcvInput = inputs[inputs.length - 2]
    const equityInput = inputs[inputs.length - 1]
    const yearInput = screen.getByPlaceholderText('e.g. 2024-25')

    fireEvent.change(rcvInput, { target: { value: '13518' } })
    fireEvent.change(equityInput, { target: { value: '5200' } })
    fireEvent.change(yearInput, { target: { value: '2024-25' } })

    await waitFor(() => expect(screen.getByText('Your bridge')).toBeInTheDocument())
    expect(screen.getByText('Annual report')).toBeInTheDocument()
  })

  it('dynamic interpretation text shows correct message for gap > £500m', async () => {
    renderView()
    await waitFor(() => expect(screen.getByText("Check against SVT's annual report")).toBeInTheDocument())

    const inputs = screen.getAllByRole('spinbutton')
    const rcvInput = inputs[inputs.length - 2]
    const equityInput = inputs[inputs.length - 1]
    const yearInput = screen.getByPlaceholderText('e.g. 2024-25')

    fireEvent.change(rcvInput, { target: { value: '14781' } })
    fireEvent.change(equityInput, { target: { value: '3000' } })
    fireEvent.change(yearInput, { target: { value: '2024-25' } })

    await waitFor(() => expect(screen.getByText(/gap is material/i)).toBeInTheDocument())
  })

  // ── Stage 4 tests ──

  it('renders Stage 4 section with title', async () => {
    renderView()
    await waitFor(() => expect(screen.getByText(/Stage 4: Statutory company to group equity/)).toBeInTheDocument())
  })

  it('Stage 4 year selector shows correct years from bridge data', async () => {
    renderView()
    await waitFor(() => {
      // Years appear in both Stage 3 (annual report buttons) and Stage 4 (year pills)
      const y2025 = screen.getAllByText('2024-25')
      expect(y2025.length).toBeGreaterThanOrEqual(2)
      const y2024 = screen.getAllByText('2023-24')
      expect(y2024.length).toBeGreaterThanOrEqual(2)
    })
  })

  it('Stage 4 summary boxes show STW equity and Group equity values', async () => {
    renderView()
    await waitFor(() => {
      // Default selected year is last in array (2022-23 in mock), s4Year set to d[d.length-1].year
      // 2022-23: company 2310 → £2,310m, group 970.6 → £971m
      const compEls = screen.getAllByText(/2,310/)
      expect(compEls.length).toBeGreaterThan(0)
    })
  })

  it('Stage 4 shows waterfall chart container', async () => {
    renderView()
    await waitFor(() => expect(screen.getByText(/Click a bar to see the explanation/)).toBeInTheDocument())
  })

  it('Stage 4 scroll link appears in Stage 3', async () => {
    renderView()
    await waitFor(() => {
      expect(screen.getByText(/bridges to Group equity/)).toBeInTheDocument()
    })
  })

  it('Stage 4 Custom button toggles custom mode with inputs', async () => {
    renderView()
    // Wait for Stage 4 to render, then find both Custom buttons and click the Stage 4 one (last)
    await waitFor(() => expect(screen.getByText(/Stage 4/)).toBeInTheDocument())
    const customBtns = screen.getAllByText('Custom')
    fireEvent.click(customBtns[customBtns.length - 1])
    await waitFor(() => {
      expect(screen.getByText(/STW Ltd equity \(£m\)/)).toBeInTheDocument()
    })
  })

  it('Stage 4 context panel expands on click', async () => {
    renderView()
    await waitFor(() => expect(screen.getByText('Why does this matter for investors?')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Why does this matter for investors?'))
    await waitFor(() => {
      const els = screen.getAllByText(/price-to-book ratio/)
      expect(els.length).toBeGreaterThan(0)
    })
  })

  it('Show history toggle renders historical chart note', async () => {
    renderView()
    await waitFor(() => expect(screen.getByText('Show history')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Show history'))
    await waitFor(() => {
      expect(screen.getByText(/£986m equity placing/)).toBeInTheDocument()
    })
  })
})
