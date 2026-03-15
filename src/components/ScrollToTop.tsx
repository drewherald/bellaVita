import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      // Let the browser handle anchor scrolling
      const el = document.querySelector(hash)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
      }
      return
    }

    // No hash → normal route change
    window.scrollTo(0, 0)
  }, [pathname, hash])

  return null
}
