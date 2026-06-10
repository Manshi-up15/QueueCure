export default function TokenSlip({ patient, onClose }) {
  if (!patient) return null

  const registeredTime = new Date(patient.registeredAt).toLocaleString()

  const handlePrint = () => {
    window.print()
  }

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4 print:hidden">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-slate-900">Patient Registered</h2>
          <p className="mt-1 text-sm text-slate-500">
            Token #{patient.tokenNumber} assigned to {patient.name}
          </p>

          <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-6 text-center">
            <p className="text-xs uppercase tracking-widest text-slate-500">Your Token</p>
            <p className="mt-2 text-6xl font-bold text-clinic-700">{patient.tokenNumber}</p>
            <p className="mt-3 font-medium text-slate-900">{patient.name}</p>
            <p className="text-sm text-slate-500">{patient.phone}</p>
            <p className="mt-2 text-xs text-slate-400">{registeredTime}</p>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 rounded-lg bg-clinic-600 px-4 py-2.5 font-semibold text-white hover:bg-clinic-700"
            >
              Print Token Slip
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      <div className="hidden print:block">
        <div className="mx-auto max-w-xs border-2 border-slate-800 p-8 text-center">
          <p className="text-sm font-bold uppercase tracking-widest">Queue Cure Clinic</p>
          <p className="mt-4 text-xs uppercase text-slate-600">Token Number</p>
          <p className="text-8xl font-bold">{patient.tokenNumber}</p>
          <p className="mt-6 text-xl font-semibold">{patient.name}</p>
          <p className="text-sm text-slate-600">{patient.phone}</p>
          <p className="mt-4 text-xs text-slate-500">{registeredTime}</p>
          <p className="mt-6 text-xs text-slate-500">
            Please wait in the waiting area. Watch the display for your number.
          </p>
        </div>
      </div>
    </>
  )
}
