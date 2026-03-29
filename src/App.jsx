import { Routes, Route, Navigate } from 'react-router-dom'
import NavBar from './components/NavBar'
import DataFooter from './components/DataFooter'
import SVTAtAGlance from './views/SVTAtAGlance'
import Benchmarking from './views/Benchmarking'
import Trends from './views/Trends'
import MetricExplorer from './views/MetricExplorer'
import SVTvsCMA from './views/SVTvsCMA'
import RCVJourney from './views/RCVJourney'
import EquityBridge from './views/EquityBridge'
import RegPrimer from './views/RegPrimer'
import Glossary from './views/Glossary'
import PCTracker from './views/PCTracker'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Routes>
          <Route path="/" element={<SVTAtAGlance />} />
          <Route path="/benchmarking" element={<Benchmarking />} />
          <Route path="/benchmarking/:metricId" element={<Benchmarking />} />
          <Route path="/trends" element={<Trends />} />
          <Route path="/trends/:metricId" element={<Trends />} />
          <Route path="/explorer" element={<MetricExplorer />} />
          <Route path="/cma" element={<SVTvsCMA />} />
          <Route path="/performance/pc-tracker" element={<PCTracker />} />
          <Route path="/learn/primer" element={<RegPrimer />} />
          <Route path="/learn/rcv-journey" element={<RCVJourney />} />
          <Route path="/learn/equity-bridge" element={<EquityBridge />} />
          <Route path="/learn/glossary" element={<Glossary />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <DataFooter />
    </div>
  )
}
