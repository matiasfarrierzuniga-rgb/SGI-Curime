type CurimeGrecaPatternProps = {
  className?: string
}

export function CurimeGrecaPattern({ className = '' }: CurimeGrecaPatternProps) {
  return (
    <div aria-hidden="true" className={`pointer-events-none overflow-hidden ${className}`}>
      <img
        src="/brand/motifs/greca-pattern.svg"
        alt=""
        width="480"
        height="320"
        className="block size-full object-cover"
      />
    </div>
  )
}
