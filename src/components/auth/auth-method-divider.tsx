type AuthMethodDividerProps = {
  label?: string
}

export function AuthMethodDivider({
  label = 'o con correo y contraseña',
}: AuthMethodDividerProps) {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-border/60" />
      </div>
      <div className="relative flex justify-center text-xs uppercase tracking-wide">
        <span className="bg-card px-2 text-muted-foreground">{label}</span>
      </div>
    </div>
  )
}
