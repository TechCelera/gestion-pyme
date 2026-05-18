export function OperacionesPageFallback() {
  return (
    <div className="space-y-6 p-6 animate-pulse">
      <div className="h-8 w-48 rounded bg-muted" />
      <div className="h-10 rounded bg-muted" />
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 rounded-xl border bg-muted/50" />
        ))}
      </div>
      <div className="h-64 rounded-xl border bg-muted/30" />
    </div>
  )
}
