import { Navigate, Route, Routes } from 'react-router-dom'
import PinGate from './components/PinGate'
import PatientView from './views/PatientView'
import ReceptionistView from './views/ReceptionistView'

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PinGate>
            <ReceptionistView />
          </PinGate>
        }
      />
      <Route path="/patient" element={<PatientView />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
