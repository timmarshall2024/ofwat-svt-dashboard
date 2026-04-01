import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import NavBar from './components/NavBar'
import DataFooter from './components/DataFooter'
import ErrorBoundary from './components/ErrorBoundary'
import LoadingSpinner from './components/LoadingSpinner'

const SVTAtAGlance = lazy(() => import('./views/SVTAtAGlance'))
const Benchmarking = lazy(() => import('./views/Benchmarking'))
const Trends = lazy(() => import('./views/Trends'))
const MetricExplorer = lazy(() => import('./views/MetricExplorer'))
const SVTvsCMA = lazy(() => import('./views/SVTvsCMA'))
const RCVJourney = lazy(() => import('./views/RCVJourney'))
const EquityBridge = lazy(() => import('./views/EquityBridge'))
const RegPrimer = lazy(() => import('./views/RegPrimer'))
const Glossary = lazy(() => import('./views/Glossary'))
const PCTracker = lazy(() => import('./views/PCTracker'))

function ViewWrapper({ children }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner message="Loading..." />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  )
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Routes>
          <Route path="/" element={<ViewWrapper><SVTAtAGlance /></ViewWrapper>} />
          <Route path="/benchmarking" element={<ViewWrapper><Benchmarking /></ViewWrapper>} />
          <Route path="/benchmarking/:metricId" element={<ViewWrapper><Benchmarking /></ViewWrapper>} />
          <Route path="/trends" element={<ViewWrapper><Trends /></ViewWrapper>} />
          <Route path="/trends/:metricId" element={<ViewWrapper><Trends /></ViewWrapper>} />
          <Route path="/explorer" element={<ViewWrapper><MetricExplorer /></ViewWrapper>} />
          <Route path="/cma" element={<ViewWrapper><SVTvsCMA /></ViewWrapper>} />
          <Route path="/performance/pc-tracker" element={<ViewWrapper><PCTracker /></ViewWrapper>} />
          <Route path="/learn/primer" element={<ViewWrapper><RegPrimer /></ViewWrapper>} />
          <Route path="/learn/rcv-journey" element={<ViewWrapper><RCVJourney /></ViewWrapper>} />
          <Route path="/learn/equity-bridge" element={<ViewWrapper><EquityBridge /></ViewWrapper>} />
          <Route path="/learn/glossary" element={<ViewWrapper><Glossary /></ViewWrapper>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <DataFooter />
    </div>
  )
}
