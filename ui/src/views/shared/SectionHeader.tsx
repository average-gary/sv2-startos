interface Props {
  title: string
  subtitle?: string
  right?: React.ReactNode
}

export function SectionHeader({ title, subtitle, right }: Props) {
  return (
    <div className="flex items-baseline justify-between mb-3">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
      </div>
      {right}
    </div>
  )
}
