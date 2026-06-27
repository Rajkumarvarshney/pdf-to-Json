import React, { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import PricingPage from './pages/PricingPage'
import DocsPage from './pages/DocsPage'

function App() {
  const [currentPage, setCurrentPage] = useState('landing')

  if (currentPage === 'dashboard') {
    return <Dashboard onBack={() => setCurrentPage('landing')} />
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage onEnterApp={() => setCurrentPage('dashboard')} />} />
      <Route path="/pricing" element={<PricingPage onEnterApp={() => setCurrentPage('dashboard')} />} />
      <Route path="/docs" element={<DocsPage onEnterApp={() => setCurrentPage('dashboard')} />} />
      <Route path="*" element={<LandingPage onEnterApp={() => setCurrentPage('dashboard')} />} />
    </Routes>
  )
}

export default App
