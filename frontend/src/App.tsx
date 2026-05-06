import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import SignalListPage from './pages/SignalListPage'
import SignalDetailPage from './pages/SignalDetailPage'
import CreateSignalPage from './pages/CreateSignalPage'
import EditSignalPage from './pages/EditSignalPage'
import GoldenLibraryPage from './pages/GoldenLibraryPage'
import DashboardPage from './pages/DashboardPage'
import { useUser } from './context/UserContext'

export default function App() {
  const { loading } = useUser()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg">
        <span className="font-mono text-text-dim text-sm animate-pulse">initializing...</span>
      </div>
    )
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/signals" replace />} />
        <Route path="/signals" element={<SignalListPage />} />
        <Route path="/signals/new" element={<CreateSignalPage />} />
        <Route path="/signals/:id" element={<SignalDetailPage />} />
        <Route path="/signals/:id/edit" element={<EditSignalPage />} />
        <Route path="/signals/:id/fork" element={<CreateSignalPage />} />
        <Route path="/golden" element={<GoldenLibraryPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Route>
    </Routes>
  )
}
