import React, { useState, lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const PricingPage = lazy(() => import('./pages/PricingPage'))
const DocsPage = lazy(() => import('./pages/DocsPage'))

const PageLoader = () => (
  <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center">
    <div className="relative w-16 h-16">
      {/* Outer spinning gradient ring */}
      <div className="absolute inset-0 rounded-full border-2 border-indigo-500/10" />
      <div className="absolute inset-0 rounded-full border-2 border-t-indigo-500 border-r-purple-500 animate-spin" />
    </div>
    <p className="text-gray-500 text-xs mt-6 tracking-widest uppercase font-semibold">Loading experience...</p>
  </div>
)

function App() {
  const [currentPage, setCurrentPage] = useState('landing')

  if (currentPage === 'dashboard') {
    return (
      <Suspense fallback={<PageLoader />}>
        <Dashboard onBack={() => setCurrentPage('landing')} />
      </Suspense>
    )
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<LandingPage onEnterApp={() => setCurrentPage('dashboard')} />} />
        <Route path="/pricing" element={<PricingPage onEnterApp={() => setCurrentPage('dashboard')} />} />
        <Route path="/docs" element={<DocsPage onEnterApp={() => setCurrentPage('dashboard')} />} />
        <Route path="*" element={<LandingPage onEnterApp={() => setCurrentPage('dashboard')} />} />
      </Routes>
    </Suspense>
  )
}

export default App

