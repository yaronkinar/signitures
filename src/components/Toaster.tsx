import type { Toast } from '../hooks/useToasts'

type ToasterProps = {
  toasts: Toast[]
  onDismiss: (id: string) => void
}

export const Toaster = ({ toasts, onDismiss }: ToasterProps) => {
  if (toasts.length === 0) return null

  return (
    <div className="toaster" aria-live="polite" aria-relevant="additions">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast--${toast.tone}`}
          role="status"
        >
          <span className="toast-message">{toast.message}</span>
          <button
            type="button"
            className="toast-dismiss"
            aria-label="Dismiss"
            onClick={() => onDismiss(toast.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
