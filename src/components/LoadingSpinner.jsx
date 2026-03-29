export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-fs-border border-t-fs-secondary" />
        <p className="text-sm text-fs-text-muted">{message}</p>
      </div>
    </div>
  )
}
