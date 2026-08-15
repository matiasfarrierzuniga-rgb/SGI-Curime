import { useEffect, useId, useRef, type ReactNode } from 'react'

export function Modal({ title, children, onClose, busy = false }: { title: string; children: ReactNode; onClose: () => void; busy?: boolean }) {
  const titleId = useId(); const dialog = useRef<HTMLDivElement>(null)
  useEffect(() => { const previous = document.activeElement as HTMLElement | null; dialog.current?.focus(); const key = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onClose() }; document.addEventListener('keydown', key); document.body.style.overflow = 'hidden'; return () => { document.removeEventListener('keydown', key); document.body.style.overflow = ''; previous?.focus() } }, [busy, onClose])
  return <div className="modal-overlay" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget && !busy) onClose() }}><div className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-busy={busy} tabIndex={-1} ref={dialog}><div className="modal-header"><h2 id={titleId}>{title}</h2><button type="button" aria-label="Cerrar diálogo" onClick={onClose} disabled={busy}>×</button></div>{children}</div></div>
}
