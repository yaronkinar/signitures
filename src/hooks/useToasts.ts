import { useCallback, useState } from 'react'

export type ToastTone = 'success' | 'error'

export type Toast = {
  id: string
  message: string
  tone: ToastTone
}

const TOAST_DURATION_MS = 3000

export const useToasts = () => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const addToast = useCallback(
    (message: string, tone: ToastTone) => {
      const id = crypto.randomUUID()
      setToasts((prev) => [...prev, { id, message, tone }])
      window.setTimeout(() => dismissToast(id), TOAST_DURATION_MS)
    },
    [dismissToast]
  )

  return { toasts, addToast, dismissToast }
}
