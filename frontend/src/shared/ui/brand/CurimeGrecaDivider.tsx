type CurimeGrecaDividerProps = {
  className?: string
}

export function CurimeGrecaDivider({ className = '' }: CurimeGrecaDividerProps) {
  return (
    <div aria-hidden="true" className={`pointer-events-none h-4 w-full overflow-hidden md:h-5 ${className}`}>
      <img
        src="/brand/motifs/greca-horizontal.svg"
        alt=""
        width="1440"
        height="32"
        className="block size-full object-fill"
      />
    </div>
  )
}
