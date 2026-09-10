import { useEffect } from 'react'
import { useBlocker } from 'react-router-dom'

/**
 * Warns the user before they lose unsaved form state, both for
 * in-app navigation (React Router) and for closing/reloading the tab
 * (`beforeunload`). No forms in this codebase warned about unsaved changes
 * before this hook existed.
 *
 * @param when - true while there is unsaved state worth protecting.
 */
export function useUnsavedChangesWarning(when: boolean) {
  useBlocker(({ currentLocation, nextLocation }) => {
    if (!when) return false
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
}
