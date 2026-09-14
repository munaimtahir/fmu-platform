import { useEffect, useRef } from 'react'
import { useBlocker } from 'react-router-dom'

/**
 * Warns the user before they lose unsaved form state, both for
 * in-app navigation (React Router) and for closing/reloading the tab
 * (`beforeunload`). No forms in this codebase warned about unsaved changes
 * before this hook existed.
 *
 * @param when - true while there is unsaved state worth protecting.
 * @returns `bypassNext()` - call synchronously right before a programmatic
 *   `navigate()` that follows a successful save, so that same navigation
 *   isn't itself caught by the blocker. `when` is normally still `true` at
 *   that point (nothing here resets the caller's dirty-tracking state), and
 *   a `setState` toggle wouldn't take effect before the immediately-following
 *   `navigate()` call in the same tick - a ref sidesteps that render-timing
 *   gap since the blocker closure reads it live, not from render-captured state.
 */
export function useUnsavedChangesWarning(when: boolean) {
  const bypassRef = useRef(false)

  useBlocker(({ currentLocation, nextLocation }) => {
    if (!when) return false
    if (bypassRef.current) return false
    if (currentLocation.pathname === nextLocation.pathname) return false
    return !window.confirm('You have unsaved changes. Leave without saving?')
  })

  useEffect(() => {
    if (!when) return

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [when])

  return {
    bypassNext: () => {
      bypassRef.current = true
    },
  }
}
