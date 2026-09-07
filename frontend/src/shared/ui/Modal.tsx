import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react'

const modalStack: symbol[] = []
let previousBodyOverflow = ''

function isTopModal(overlay: HTMLDivElement | null) {
  const overlays = document.querySelectorAll<HTMLDivElement>('.modal-overlay')
  return overlays.item(overlays.length - 1) === overlay
}

function syncModalAccessibility() {
  const overlays = Array.from(document.querySelectorAll<HTMLDivElement>('.modal-overlay'))
  overlays.forEach((overlay, index) => {
    const isTop = index === overlays.length - 1
    overlay.setAttribute('aria-hidden', String(!isTop))
    overlay.querySelector('[role="dialog"]')?.setAttribute('aria-modal', String(isTop))
  })
}

export function Modal({ title, children, onClose, busy = false, initialFocusRef }: { title: string; children: ReactNode; onClose: () => void; busy?: boolean; initialFocusRef?: RefObject<HTMLElement | null> }) {
  const titleId = useId(); const overlay = useRef<HTMLDivElement>(null); const dialog = useRef<HTMLDivElement>(null); const onCloseRef = useRef(onClose); const busyRef = useRef(busy); const token = useRef(Symbol('modal'))
  onCloseRef.current = onClose
  busyRef.current = busy
  const requestClose = () => {
    if (isTopModal(overlay.current) && !busy) onClose()
  }
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    modalStack.push(token.current)
    if (modalStack.length === 1) {
      previousBodyOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }
    syncModalAccessibility()
    const isTop = () => isTopModal(overlay.current)
    const requestTopClose = () => {
      if (isTop() && !busyRef.current) onCloseRef.current()
    }
    const focusInitial = () => {
      const activeElement = document.activeElement
      const explicitAutoFocus = activeElement instanceof HTMLElement && dialog.current?.contains(activeElement) ? activeElement : null
      const focusable = dialog.current?.querySelector<HTMLElement>('[autofocus], button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')
      const preferred = initialFocusRef?.current
      const validPreferred = preferred && dialog.current?.contains(preferred) && !preferred.matches(':disabled') ? preferred : null
      ;(validPreferred ?? explicitAutoFocus ?? focusable ?? dialog.current)?.focus()
    }
    if (isTop()) focusInitial()
    const key = (event: KeyboardEvent) => {
      if (!isTop()) return
      if (event.key === 'Escape') {
        event.preventDefault()
        requestTopClose()
        return
      }
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
      if (isTop() && event.target instanceof Node && dialog.current && !dialog.current.contains(event.target)) focusInitial()
    }
    document.addEventListener('keydown', key)
    document.addEventListener('focusin', keepFocusInside)
    return () => {
      document.removeEventListener('keydown', key)
      document.removeEventListener('focusin', keepFocusInside)
      const index = modalStack.lastIndexOf(token.current)
      if (index !== -1) modalStack.splice(index, 1)
      syncModalAccessibility()
      if (modalStack.length === 0) document.body.style.overflow = previousBodyOverflow
      previous?.focus()
    }
  }, [])
  return <div className="modal-overlay" role="presentation" ref={overlay} onMouseDown={e => { if (e.target === e.currentTarget) requestClose() }}><div className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-busy={busy} tabIndex={-1} ref={dialog}><div className="modal-header"><h2 id={titleId}>{title}</h2><button type="button" aria-label="Cerrar diálogo" onClick={requestClose} disabled={busy}>×</button></div>{children}</div></div>
}
