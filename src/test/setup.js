import '@testing-library/jest-dom'

// Polyfill ResizeObserver for Recharts ResponsiveContainer in jsdom
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    constructor(cb) { this._cb = cb }
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}
