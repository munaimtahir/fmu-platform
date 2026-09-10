import React, { useEffect } from 'react'

export interface ModalProps {
  /** Dialog heading, shown at the top of the modal. */
  title: string
  /** Called when the user dismisses the modal (backdrop click, Escape, or an explicit close control). */
  onClose: () => void
  /** Modal body content, typically a form. */
  children: React.ReactNode
  /** Width of the modal dialog. 'lg' also caps height and scrolls long content. */
  size?: 'md' | 'lg'
  /** Additional CSS classes to apply to the dialog panel. */
  className?: string
}

/**
 * Shared modal chrome (backdrop + centered panel + heading), consolidating
 * what was previously duplicated across each of the academics *FormModal
 * components. Form logic stays in the caller - this only owns presentation
 * and basic dismiss behavior (Escape key, backdrop click).
 */
export const Modal: React.FC<ModalProps> = ({ title, onClose, children, size = 'md', className = '' }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const sizeClasses = size === 'lg' ? 'max-w-2xl max-h-[90vh] overflow-y-auto' : 'max-w-md'

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`bg-white rounded-lg p-6 w-full ${sizeClasses} ${className}`}
      >
        <h2 id="modal-title" className="text-xl font-semibold mb-4">
          {title}
        </h2>
        {children}
      </div>
    </div>
  )
}
