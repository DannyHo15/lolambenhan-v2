/**
 * Hook for persisting form data to localStorage
 * Automatically saves form data and restores it on page reload
 */
import { useEffect, useRef, useCallback, useState } from 'react'

interface DraftState<T> {
  data: T
  hasUnsavedChanges: boolean
  lastSavedAt: Date | null
}

interface PersistenceOptions {
  key: string
  enabled?: boolean
  debounceMs?: number
  onSave?: (data: Record<string, unknown>) => void
}

export function useFormPersistence<T extends Record<string, unknown>>(
  data: T,
  options: PersistenceOptions
) {
  const { key, enabled = true, debounceMs = 1000 } = options
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const initialLoadRef = useRef(true)

  // Load saved data on mount
  useEffect(() => {
    if (!enabled) return

    try {
      const saved = localStorage.getItem(key)
      if (saved) {
        const parsed = JSON.parse(saved) as T
        // Return the saved data via callback
        options.onSave?.(parsed)
      }
    } catch (err) {
      console.error('Failed to load saved form data:', err)
    }
    initialLoadRef.current = false
  }, [key])

  // Save data to localStorage with debounce
  useEffect(() => {
    if (!enabled || initialLoadRef.current) return

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Debounce save
    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(data))
      } catch (err) {
        console.error('Failed to save form data:', err)
      }
    }, debounceMs)

    // Cleanup timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [data, key, enabled, debounceMs])

  // Clear saved data
  const clearSaved = useCallback(() => {
    try {
      localStorage.removeItem(key)
    } catch (err) {
      console.error('Failed to clear saved form data:', err)
    }
  }, [key])

  // Check if saved data exists
  const hasSavedData = useCallback(() => {
    try {
      return localStorage.getItem(key) !== null
    } catch {
      return false
    }
  }, [key])

  return {
    clearSaved,
    hasSavedData,
  }
}

/**
 * Hook for managing draft state with persistence
 */
export function useFormDraft<T extends Record<string, unknown>>(
  key: string,
  initialData: T
) {
  const [state, setState] = useState<DraftState<T>>({
    data: initialData,
    hasUnsavedChanges: false,
    lastSavedAt: null,
  })

  // Load draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`draft:${key}`)
      if (saved) {
        const parsed = JSON.parse(saved) as { data: T; savedAt: string }
        setState({
          data: parsed.data,
          hasUnsavedChanges: true,
          lastSavedAt: new Date(parsed.savedAt),
        })
      }
    } catch (err) {
      console.error('Failed to load draft:', err)
    }
  }, [key])

  // Save draft with debounce
  const saveDraft = useCallback(
    (data: T) => {
      try {
        localStorage.setItem(
          `draft:${key}`,
          JSON.stringify({
            data,
            savedAt: new Date().toISOString(),
          })
        )
        setState({
          data,
          hasUnsavedChanges: false,
          lastSavedAt: new Date(),
        })
      } catch (err) {
        console.error('Failed to save draft:', err)
      }
    },
    [key]
  )

  // Clear draft
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(`draft:${key}`)
      setState({
        data: initialData,
        hasUnsavedChanges: false,
        lastSavedAt: null,
      })
    } catch (err) {
      console.error('Failed to clear draft:', err)
    }
  }, [key, initialData])

  // Update data and mark as unsaved
  const updateData = useCallback((updates: Partial<T>) => {
    setState((prev) => ({
      ...prev,
      data: { ...prev.data, ...updates },
      hasUnsavedChanges: true,
    }))
  }, [])

  return {
    data: state.data,
    hasUnsavedChanges: state.hasUnsavedChanges,
    lastSavedAt: state.lastSavedAt,
    saveDraft,
    clearDraft,
    updateData,
  }
}

