import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

export function PublicScrollRestoration() {
  const { hash, key, pathname, search } = useLocation()
  const navigationType = useNavigationType()

  useEffect(() => {
    if (hash) {
      const target = document.getElementById(decodeURIComponent(hash.slice(1)))

      if (target) {
        target.scrollIntoView({ block: 'start' })
      }

      return
    }

    // Browser history retains scroll positions for POP navigation. New routes start at top.
    if (navigationType !== 'POP') {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    }
  }, [hash, key, navigationType, pathname, search])

  return null
}
