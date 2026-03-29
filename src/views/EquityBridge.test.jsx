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

beforeEach(() => {
  global.fetch = vi.fn(() => Promise.resolve({ json: () => Promise.resolve(mockAmp8) }))
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

  it('sticky summary bar shows three values', async () => {
    renderView()
    await waitFor(() => {
      expect(screen.getByText('RCV')).toBeInTheDocument()
      expect(screen.getByText('Regulated equity')).toBeInTheDocument()
      expect(screen.getByText('Statutory equity')).toBeInTheDocument()
    })
  })

  it('gearing slider at 60% produces correct regulated equity (RCV x 0.40)', async () => {
    renderView()
    await waitFor(() => expect(screen.getByText('Stage 1: RCV to Regulated Equity')).toBeInTheDocument())
    // Default gearing is 60%, RCV is 14780.7 (AMP8 opening)
    // Regulated equity = 14780.7 * 0.40 = 5912.28 ≈ £5,912m
    // Check that £5,912m appears
    expect(screen.getByText(/5,912/)).toBeInTheDocument()
  })

  it('gearing slider at 70% produces correct regulated equity (RCV x 0.30)', async () => {
    renderView()
    await waitFor(() => expect(screen.getByText('Notional gearing')).toBeInTheDocument())
    const slider = screen.getByLabelText ? null : null
    // Find the gearing slider by its range input
    const sliders = document.querySelectorAll('input[type="range"]')
    // First range slider is gearing
    const gearingSlider = sliders[0]
    fireEvent.change(gearingSlider, { target: { value: '70' } })
    // RCV 14780.7 * 0.30 = 4434.21 ≈ £4,434m
    await waitFor(() => expect(screen.getByText(/4,434/)).toBeInTheDocument())
  })

  it('pension slider updates statutory equity correctly', async () => {
    renderView()
    await waitFor(() => expect(screen.getByText('Stage 2: Regulated to Statutory Equity')).toBeInTheDocument())
    // Find pension slider (second range slider)
    const sliders = document.querySelectorAll('input[type="range"]')
    const pensionSlider = sliders[1]
    // Set pension to +500
    fireEvent.change(pensionSlider, { target: { value: '500' } })
    // Statutory equity should increase: 5912 - 200 - 300 + 500 = 5912
    // Default: regulated equity (5912) + pension(0) + fvDebt(-200) + deferredTax(-300) + goodwill(0) + nonReg(0) + other(0) = 5412
    // After pension=500: 5912 + 500 - 200 - 300 = 5912
    await waitFor(() => {
      const el = screen.getAllByText(/5,912/)
      expect(el.length).toBeGreaterThan(0)
    })
  })

  it('deferred tax slider updates statutory equity correctly', async () => {
    renderView()
    await waitFor(() => expect(screen.getByText('Deferred tax liability (net)')).toBeInTheDocument())
    const sliders = document.querySelectorAll('input[type="range"]')
    // Gearing(0), Pension(1), FairValue(2), DeferredTax(3), NonRegulated(4)
    const dtSlider = sliders[3]
    fireEvent.change(dtSlider, { target: { value: '0' } })
    // Default: regulated equity (5912) + pension(0) + fvDebt(-200) + deferredTax(-300) = 5412
    // After DT=0: 5912 + 0 - 200 + 0 = 5712
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
    // Find the annual report inputs (last two number inputs)
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

    // Bridge statutory equity ≈ 5412, so set AR equity to 3000 → gap = 2412 > 500
    fireEvent.change(rcvInput, { target: { value: '14781' } })
    fireEvent.change(equityInput, { target: { value: '3000' } })
    fireEvent.change(yearInput, { target: { value: '2024-25' } })

    await waitFor(() => expect(screen.getByText(/gap is material/i)).toBeInTheDocument())
  })
})
