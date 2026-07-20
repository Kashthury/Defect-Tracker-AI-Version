import { useEffect, useRef } from 'react'
import { INACTIVITY_TIMEOUT_MS } from '@/constants/app'

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'mousemove',
  'mousedown',
  'click',
  'keydown',
  'scroll',
  'touchstart',
]

/**
 * Auto-logs out the user after INACTIVITY_TIMEOUT_MS of no mouse movement,
 * clicks, keyboard input, scrolling, or touch — resetting the timer on
 * every interaction, as required by session-security rules.
 */
export function useInactivityTimeout(active: boolean, onTimeout: () => void) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onTimeoutRef = useRef(onTimeout)
  onTimeoutRef.current = onTimeout

  useEffect(() => {
    if (!active) return

    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => onTimeoutRef.current(), INACTIVITY_TIMEOUT_MS)
    }

    resetTimer()
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, resetTimer, { passive: true }))

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, resetTimer))
    }
  }, [active])
}
