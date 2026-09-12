import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import Notes from './pages/Notes'
import Interview from './pages/Interview'
import Knowledge from './pages/Knowledge'
import QuickLinks from './pages/QuickLinks'
import Charts from './pages/Charts'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/interview" element={<Interview />} />
        <Route path="/knowledge" element={<Knowledge />} />
        <Route path="/links" element={<QuickLinks />} />
        <Route path="/charts" element={<Charts />} />
      </Route>
    </Routes>
  )
}
