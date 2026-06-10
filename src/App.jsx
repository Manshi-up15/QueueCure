import { Navigate, Route, Routes } from 'react-router-dom'
import ReceptionistView from './views/ReceptionistView'
import PatientView from './views/PatientView'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ReceptionistView />} />
      <Route path="/patient" element={<PatientView />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
