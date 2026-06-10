import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueueState } from '../hooks/useQueueState'

function truncateName(name, max = 28) {
  return name.length > max ? `${name.slice(0, max)}…` : name
}

export default function ReceptionistView() {
  const { state, loading, storageWarning, addPatient, callNext, setAvgConsultationTime } =
    useQueueState({ writable: true })
  const [patientName, setPatientName] = useState('')
  const [avgTimeInput, setAvgTimeInput] = useState('')

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        Loading queue…
      </div>
    )
  }

  const handleAddPatient = async (event) => {
    event.preventDefault()
    if (!patientName.trim()) return
    await addPatient(patientName)
    setPatientName('')
  }

  const handleAvgTimeBlur = async () => {
    const value = avgTimeInput === '' ? state.avgConsultationTime : avgTimeInput
    await setAvgConsultationTime(value)
    setAvgTimeInput('')
  }

  const isQueueEmpty = state.queue.length === 0

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-clinic-600">
              Queue Cure &apos;26
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">{state.clinicName}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-serve-500/10 px-5 py-3 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-serve-700">
                Now Serving
              </p>
              <p className="text-4xl font-bold tabular-nums text-serve-700">
                {state.currentToken > 0 ? state.currentToken : '—'}
              </p>
            </div>
            <Link
              to="/patient"
              className="rounded-lg border border-clinic-200 bg-clinic-50 px-4 py-2 text-sm font-medium text-clinic-700 transition hover:bg-clinic-100 focus:outline-none focus:ring-2 focus:ring-clinic-500 focus:ring-offset-2"
            >
              Open Patient View →
            </Link>
          </div>
        </div>
      </header>

      {storageWarning && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-800">
          Storage unavailable — changes may not persist across tabs.
        </div>
      )}

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-2 lg:px-6">
        <section className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Add Patient</h2>
            <form onSubmit={handleAddPatient} className="space-y-4">
              <div>
                <label htmlFor="patient-name" className="mb-1 block text-sm font-medium text-slate-700">
                  Patient name
                </label>
                <input
                  id="patient-name"
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Enter patient name"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base focus:border-clinic-500 focus:outline-none focus:ring-2 focus:ring-clinic-500/20"
                  autoComplete="off"
                />
              </div>
              <button
                type="submit"
                disabled={!patientName.trim()}
                className="w-full rounded-lg bg-clinic-600 px-4 py-3 text-base font-semibold text-white transition hover:bg-clinic-700 focus:outline-none focus:ring-2 focus:ring-clinic-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add Patient
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Consultation Time</h2>
            <label htmlFor="avg-time" className="mb-1 block text-sm font-medium text-slate-700">
              Average consultation (minutes)
            </label>
            <input
              id="avg-time"
              type="number"
              min="1"
              max="120"
              value={avgTimeInput !== '' ? avgTimeInput : state.avgConsultationTime}
              onChange={(e) => setAvgTimeInput(e.target.value)}
              onBlur={handleAvgTimeBlur}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base focus:border-clinic-500 focus:outline-none focus:ring-2 focus:ring-clinic-500/20"
            />
            <p className="mt-2 text-sm text-slate-500">
              Used to calculate estimated wait times for patients.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Waiting Queue</h2>
              <span className="rounded-full bg-clinic-100 px-3 py-1 text-sm font-semibold text-clinic-700">
                {state.queue.length} waiting
              </span>
            </div>
            <button
              type="button"
              onClick={() => callNext()}
              disabled={isQueueEmpty}
              className="rounded-lg bg-serve-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-serve-700 focus:outline-none focus:ring-2 focus:ring-serve-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Call Next Token
            </button>
          </div>

          {isQueueEmpty ? (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
              <p className="text-lg font-medium text-slate-600">No patients in queue</p>
              <p className="mt-1 text-sm text-slate-500">
                Add a patient or press Call Next when the queue is empty to see this message.
              </p>
            </div>
          ) : (
            <ul className="max-h-[28rem] space-y-2 overflow-y-auto">
              {state.queue.map((patient, index) => (
                <li
                  key={`${patient.tokenNumber}-${patient.addedAt}`}
                  className="flex items-center gap-4 rounded-xl border border-clinic-100 bg-clinic-50 px-4 py-3"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-clinic-600 text-lg font-bold text-white">
                    {patient.tokenNumber}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900" title={patient.patientName}>
                      {truncateName(patient.patientName)}
                    </p>
                    <p className="text-sm text-slate-500">Position {index + 1}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}
