import { Button } from './Button'

interface EmptyProps {
  message: string
  description?: string
  action?: { label: string; onClick: () => void }
}

export function Empty({ message, description, action }: EmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <p className="text-sm font-medium text-[#171717]">{message}</p>
      {description && (
        <p className="mt-1 text-sm text-[#737373] max-w-sm">{description}</p>
      )}
      {action && (
        <div className="mt-6">
          <Button variant="primary" size="md" onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      )}
    </div>
  )
}
