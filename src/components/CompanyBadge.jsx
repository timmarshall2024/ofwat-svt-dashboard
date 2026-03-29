export default function CompanyBadge({ code, onRemove }) {
  const isSvt = code === 'SVT' || code === 'SVE'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isSvt
          ? 'bg-fs-highlight text-white'
          : 'bg-fs-primary-light text-fs-text border border-fs-border'
      }`}
    >
      {code}
      {onRemove && !isSvt && (
        <button
          onClick={() => onRemove(code)}
          className="ml-0.5 hover:text-red-500 transition-colors"
          aria-label={`Remove ${code}`}
        >
          ×
        </button>
      )}
    </span>
  )
}
