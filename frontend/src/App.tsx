import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import GeneratePage from './pages/GeneratePage'
import ResultPage from './pages/ResultPage'
import HistoryPage from './pages/HistoryPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/generate" element={<GeneratePage />} />
      <Route path="/result/:taskId" element={<ResultPage />} />
      <Route path="/history" element={<HistoryPage />} />
    </Routes>
  )
}
