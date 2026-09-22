import { useCallback, useEffect, useRef, useState } from 'react'

export function useFullscreenMode() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const syncState = () => {
      if (!document.fullscreenElement && document.fullscreenEnabled) setActive(false)
    }
    document.addEventListener('fullscreenchange', syncState)
    return () => document.removeEventListener('fullscreenchange', syncState)
  }, [])

  const enter = useCallback(async () => {
    setActive(true)
    try {
      await containerRef.current?.requestFullscreen?.({ navigationUI: 'hide' })
    } catch {
      // CSS fullscreen remains available when the browser blocks the native API.
    }
  }, [])

  const exit = useCallback(async () => {
    setActive(false)
    if (document.fullscreenElement) await document.exitFullscreen()
  }, [])

  return { containerRef, active, enter, exit }
}
