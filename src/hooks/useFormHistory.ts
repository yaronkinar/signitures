import { useCallback, useRef, useState } from 'react'
import type { SignatureFormState } from '../types/signatureForm'

const MAX_HISTORY = 50
const DEBOUNCE_MS = 400

const cloneFormState = (form: SignatureFormState): SignatureFormState =>
  JSON.parse(JSON.stringify(form))

const formsEqual = (a: SignatureFormState, b: SignatureFormState): boolean =>
  JSON.stringify(a) === JSON.stringify(b)

export type SetFormOptions = {
  /** Record a single immediate history step instead of debouncing (AI, import, reset, etc.). */
  immediate?: boolean
  /** Skip recording this change in history (undo/redo replay). */
  skipHistory?: boolean
}

export const useFormHistory = (initialForm: SignatureFormState) => {
  const [form, setFormState] = useState(initialForm)
  const pastRef = useRef<SignatureFormState[]>([])
  const futureRef = useRef<SignatureFormState[]>([])
  const skipHistoryRef = useRef(false)
  const burstActiveRef = useRef(false)
  const burstTimerRef = useRef<number | null>(null)
  const [historyVersion, setHistoryVersion] = useState(0)

  const bumpHistoryUi = useCallback(() => setHistoryVersion((version) => version + 1), [])

  const pushPast = useCallback(
    (snapshot: SignatureFormState) => {
      const past = pastRef.current
      const cloned = cloneFormState(snapshot)
      if (past.length > 0 && formsEqual(past[past.length - 1], cloned)) return
      pastRef.current = [...past.slice(-(MAX_HISTORY - 1)), cloned]
      futureRef.current = []
      bumpHistoryUi()
    },
    [bumpHistoryUi]
  )

  const recordBeforeChange = useCallback(
    (current: SignatureFormState, immediate = false) => {
      if (skipHistoryRef.current) return
      if (immediate) {
        pushPast(current)
        burstActiveRef.current = false
        if (burstTimerRef.current !== null) {
          window.clearTimeout(burstTimerRef.current)
          burstTimerRef.current = null
        }
        return
      }
      if (!burstActiveRef.current) {
        pushPast(current)
        burstActiveRef.current = true
      }
      if (burstTimerRef.current !== null) window.clearTimeout(burstTimerRef.current)
      burstTimerRef.current = window.setTimeout(() => {
        burstActiveRef.current = false
        burstTimerRef.current = null
      }, DEBOUNCE_MS)
    },
    [pushPast]
  )

  const setForm = useCallback(
    (
      updater: SignatureFormState | ((prev: SignatureFormState) => SignatureFormState),
      options?: SetFormOptions
    ) => {
      if (options?.skipHistory) skipHistoryRef.current = true
      setFormState((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater
        if (!options?.skipHistory && !formsEqual(prev, next)) {
          recordBeforeChange(prev, options?.immediate)
        }
        return next
      })
      if (options?.skipHistory) skipHistoryRef.current = false
    },
    [recordBeforeChange]
  )

  const updateForm = useCallback(
    (patch: Partial<SignatureFormState>, options?: SetFormOptions) => {
      setForm((prev) => ({ ...prev, ...patch }), options)
    },
    [setForm]
  )

  const undo = useCallback(() => {
    const past = pastRef.current
    if (past.length === 0) return
    skipHistoryRef.current = true
    const previous = past[past.length - 1]
    pastRef.current = past.slice(0, -1)
    setFormState((current) => {
      futureRef.current = [cloneFormState(current), ...futureRef.current].slice(0, MAX_HISTORY)
      bumpHistoryUi()
      return cloneFormState(previous)
    })
    skipHistoryRef.current = false
    burstActiveRef.current = false
    if (burstTimerRef.current !== null) {
      window.clearTimeout(burstTimerRef.current)
      burstTimerRef.current = null
    }
  }, [bumpHistoryUi])

  const redo = useCallback(() => {
    const future = futureRef.current
    if (future.length === 0) return
    skipHistoryRef.current = true
    const next = future[0]
    futureRef.current = future.slice(1)
    setFormState((current) => {
      pastRef.current = [...pastRef.current.slice(-(MAX_HISTORY - 1)), cloneFormState(current)]
      bumpHistoryUi()
      return cloneFormState(next)
    })
    skipHistoryRef.current = false
    burstActiveRef.current = false
    if (burstTimerRef.current !== null) {
      window.clearTimeout(burstTimerRef.current)
      burstTimerRef.current = null
    }
  }, [bumpHistoryUi])

  const canUndo = pastRef.current.length > 0
  const canRedo = futureRef.current.length > 0

  return {
    form,
    setForm,
    updateForm,
    undo,
    redo,
    canUndo,
    canRedo,
    historyVersion
  }
}
