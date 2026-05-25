interface Props {
  title: string
  subtitle?: string
  right?: React.ReactNode
  /** Optional section number — shows as a "01 ·" prefix like a chart legend */
  index?: string
}

export function SectionHeader({ title, subtitle, right, index }: Props) {
  return (
    <div className="flex items-end justify-between mb-4 pb-3 border-b border-border-strong">
      <div className="flex items-baseline gap-3">
        {index && (
          <span className="text-[0.6875rem] font-mono font-bold tracking-[0.2em] text-primary">
            {index}
          </span>
        )}
        <div>
          <h2 className="font-display text-xl text-text-strong italic tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[0.6875rem] uppercase tracking-[0.15em] text-muted-2 font-mono mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {right}
    </div>
  )
}
