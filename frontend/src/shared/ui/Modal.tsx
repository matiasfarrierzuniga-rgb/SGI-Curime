import { useEffect, useId, useRef, type ReactNode } from 'react'

export function Modal({ title, children, onClose, busy = false }: { title: string; children: ReactNode; onClose: () => void; busy?: boolean }) {
  const titleId = useId(); const dialog = useRef<HTMLDivElement>(null); const onCloseRef = useRef(onClose); const busyRef = useRef(busy)
  onCloseRef.current = onClose
  busyRef.current = busy
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    dialog.current?.focus()
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busyRef.current) onCloseRef.current()
      if (event.key !== 'Tab') return

      const focusable = Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? [])
      if (focusable.length === 0) return event.preventDefault()
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement
      if (event.shiftKey && (active === first || active === dialog.current || !dialog.current?.contains(active))) { event.preventDefault(); last.focus() }
      if (!event.shiftKey && (active === last || active === dialog.current || !dialog.current?.contains(active))) { event.preventDefault(); first.focus() }
    }
    const keepFocusInside = (event: FocusEvent) => {
      if (event.target instanceof Node && dialog.current && !dialog.current.contains(event.target)) dialog.current.focus()
    }
    document.addEventListener('keydown', key)
    document.addEventListener('focusin', keepFocusInside)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', key); document.removeEventListener('focusin', keepFocusInside); document.body.style.overflow = ''; previous?.focus() }
  }, [])
  return <div className="modal-overlay" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget && !busy) onClose() }}><div className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-busy={busy} tabIndex={-1} ref={dialog}><div className="modal-header"><h2 id={titleId}>{title}</h2><button type="button" aria-label="Cerrar diálogo" onClick={onClose} disabled={busy}>×</button></div>{children}</div></div>
}
