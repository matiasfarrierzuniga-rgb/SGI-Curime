type CurimeBrandAccentProps = {
  className?: string
}

export function CurimeBrandAccent({ className = '' }: CurimeBrandAccentProps) {
  return (
    <div aria-hidden="true" className={`pointer-events-none overflow-hidden ${className}`}>
      <img
        src="/brand/motifs/maize-mark.svg"
        alt=""
        width="160"
        height="200"
        className="block size-full object-contain"
      />
    </div>
  )
}
