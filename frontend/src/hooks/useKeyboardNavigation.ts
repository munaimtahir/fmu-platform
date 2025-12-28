/**
 * A custom hook to handle keyboard navigation for a component.
 *
 * This hook attaches a keydown event listener to the referenced element and
 * calls the appropriate callback functions based on the key pressed. It
 * supports Enter, Escape, and arrow keys.
 *
 * @param {RefObject<HTMLElement>} ref A React ref to the element that should receive keyboard focus.
 * @param {UseKeyboardNavigationOptions} options An object containing the callback functions for different key presses.
 *
 * @example
 * const myRef = useRef(null);
 * useKeyboardNavigation(myRef, {
 *   onEnter: () => console.log('Enter pressed'),
 *   onArrowDown: () => console.log('Arrow down pressed'),
 * });
 *
 * <div ref={myRef} tabIndex={0}>...</div>
 */
import { useEffect, RefObject } from 'react'

/**
 * Defines the options for the `useKeyboardNavigation` hook.
 */
interface UseKeyboardNavigationOptions {
  /** Callback function for the 'Enter' key. */
  onEnter?: () => void
  /** Callback function for the 'Escape' key. */
  onEscape?: () => void
  /** Callback function for the 'ArrowUp' key. */
  onArrowUp?: () => void
  /** Callback function for the 'ArrowDown' key. */
  onArrowDown?: () => void
  /** Callback function for the 'ArrowLeft' key. */
  onArrowLeft?: () => void
  /** Callback function for the 'ArrowRight' key. */
  onArrowRight?: () => void
  /** Whether the keyboard navigation is enabled. */
  enabled?: boolean
}

export function useKeyboardNavigation(
  ref: RefObject<HTMLElement>,
  options: UseKeyboardNavigationOptions = {}
) {
  const {
    onEnter,
    onEscape,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    enabled = true,
  } = options

  useEffect(() => {
    if (!enabled || !ref.current) return

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Enter':
          if (onEnter) {
            event.preventDefault()
            onEnter()
          }
          break
        case 'Escape':
          if (onEscape) {
            event.preventDefault()
            onEscape()
          }
          break
        case 'ArrowUp':
          if (onArrowUp) {
            event.preventDefault()
            onArrowUp()
          }
          break
        case 'ArrowDown':
          if (onArrowDown) {
            event.preventDefault()
            onArrowDown()
          }
          break
        case 'ArrowLeft':
          if (onArrowLeft) {
            event.preventDefault()
            onArrowLeft()
          }
          break
        case 'ArrowRight':
          if (onArrowRight) {
            event.preventDefault()
            onArrowRight()
          }
          break
      }
    }

    const element = ref.current
    element.addEventListener('keydown', handleKeyDown)

    return () => {
      element.removeEventListener('keydown', handleKeyDown)
    }
  }, [ref, onEnter, onEscape, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, enabled])
}
