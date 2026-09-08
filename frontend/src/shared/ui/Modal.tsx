import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'

type ModalStackEntry = { token: symbol; overlay: HTMLDivElement }

const modalStack: ModalStackEntry[] = []
let previousBodyOverflow = ''

function isTopModal(token: symbol) {
  return modalStack.at(-1)?.token === token
}

function syncModalAccessibility() {
  modalStack.forEach(({ overlay, token }, index) => {
    const isTop = isTopModal(token)
    overlay.setAttribute('aria-hidden', String(!isTop))
    overlay.toggleAttribute('inert', !isTop)
    overlay.style.zIndex = String(50 + index)
    overlay.querySelector('[role="dialog"]')?.setAttribute('aria-modal', String(isTop))
  })
}

export function Modal({ title, children, onClose, busy = false, initialFocusRef }: { title: string; children: ReactNode; onClose: () => void; busy?: boolean; initialFocusRef?: RefObject<HTMLElement | null> }) {
  const titleId = useId(); const overlay = useRef<HTMLDivElement>(null); const dialog = useRef<HTMLDivElement>(null); const onCloseRef = useRef(onClose); const busyRef = useRef(busy); const initialFocusRefRef = useRef(initialFocusRef); const token = useRef(Symbol('modal'))
  onCloseRef.current = onClose
  busyRef.current = busy
  initialFocusRefRef.current = initialFocusRef
  const requestClose = () => {
    if (isTopModal(token.current) && !busyRef.current) onCloseRef.current()
  }
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const modalToken = token.current
    const modalOverlay = overlay.current
    if (!modalOverlay) return
    modalStack.push({ token: modalToken, overlay: modalOverlay })
    if (modalStack.length === 1) {
      previousBodyOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }
    syncModalAccessibility()
    const isTop = () => isTopModal(modalToken)
    const requestTopClose = () => {
      if (isTop() && !busyRef.current) onCloseRef.current()
    }
    const focusInitial = () => {
      const activeElement = document.activeElement
      const explicitAutoFocus = activeElement instanceof HTMLElement && dialog.current?.contains(activeElement) ? activeElement : null
      const focusable = dialog.current?.querySelector<HTMLElement>('[autofocus], button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')
      const preferred = initialFocusRefRef.current?.current
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
      const wasTop = isTop()
      const index = modalStack.findIndex(entry => entry.token === modalToken)
      if (index !== -1) modalStack.splice(index, 1)
      syncModalAccessibility()
      if (modalStack.length === 0) document.body.style.overflow = previousBodyOverflow
      if (wasTop) previous?.focus()
    }
  }, [])
  if (typeof document === 'undefined') return null
  return createPortal(<div className="modal-overlay" role="presentation" ref={overlay} onMouseDown={e => { if (e.target === e.currentTarget) requestClose() }}><div className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-busy={busy} tabIndex={-1} ref={dialog}><div className="modal-header"><h2 id={titleId}>{title}</h2><button type="button" aria-label="Cerrar diálogo" onClick={requestClose} disabled={busy}>×</button></div>{children}</div></div>, document.body)
}
