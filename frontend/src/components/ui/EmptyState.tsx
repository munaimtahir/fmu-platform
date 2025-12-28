import React from 'react'

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon = '📭', 
  title, 
  description, 
  action 
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 text-center max-w-md mb-6">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-[#3B82F6] text-white rounded-2xl hover:bg-blue-600 transition-colors duration-150"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
