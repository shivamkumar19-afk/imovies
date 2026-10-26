export default function Loader({ label = 'Loading' }) {
  return (
    <div className="d-flex justify-content-center align-items-center py-5" role="status">
      <div className="spinner-border text-secondary me-2" aria-hidden="true" />
      <span className="text-muted-ink">{label}…</span>
    </div>
  )
}
