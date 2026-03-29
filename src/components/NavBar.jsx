import { NavLink } from 'react-router-dom'

const mainLinks = [
  { to: '/', label: 'SVT at a Glance' },
  { to: '/benchmarking', label: 'Benchmarking' },
  { to: '/trends', label: 'Trends' },
  { to: '/explorer', label: 'Metric Explorer' },
  { to: '/cma', label: 'SVT vs CMA' },
  { to: '/performance/pc-tracker', label: 'PC Tracker' },
]

const learnLinks = [
  { to: '/learn/primer', label: 'Primer' },
  { to: '/learn/rcv-journey', label: 'RCV Journey' },
  { to: '/learn/equity-bridge', label: 'Equity Bridge' },
  { to: '/learn/glossary', label: 'Glossary' },
]

function NavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `px-3 py-2 rounded-fs-sm text-sm font-body transition-colors ${
          isActive
            ? 'bg-white/15 text-white border-b-2 border-fs-secondary'
            : 'text-white/70 hover:text-white hover:bg-white/10'
        }`
      }
    >
      {label}
    </NavLink>
  )
}

export default function NavBar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-fs-primary-dark bg-fs-primary shadow-fs">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center gap-6">
          <div className="flex items-center gap-3 shrink-0">
            <img src="/fox-stephens-logo.png" alt="Fox Stephens" className="h-8 w-auto" />
            <span className="text-white/40 text-sm font-light">|</span>
            <span className="text-white font-heading text-sm tracking-wide whitespace-nowrap">
              Ofwat Regulatory Intelligence
            </span>
          </div>
          <div className="flex gap-1">
            {mainLinks.map(({ to, label }) => (
              <NavItem key={to} to={to} label={label} />
            ))}
          </div>
          <div className="flex items-center gap-1 ml-1 pl-2 border-l border-white/20">
            <span className="text-white/40 text-[10px] uppercase tracking-widest mr-1">Learn</span>
            {learnLinks.map(({ to, label }) => (
              <NavItem key={to} to={to} label={label} />
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
