import { createContext, useCallback, useContext, useRef, useSyncExternalStore } from 'react'
import { useEffect } from 'react'

export interface Sample {
  t: number   // wall-clock ms
  v: number   // sample value
}

const MAX_SAMPLES = 60      // 60 × 5s tick = 5 minutes
const MIN_INTERVAL_MS = 4_500

type Listener = () => void

interface Store {
  buffers: Map<string, Sample[]>
  listeners: Set<Listener>
  push(key: string, value: number, t?: number): void
  read(key: string): Sample[]
  subscribe(l: Listener): () => void
}

function createStore(): Store {
  const buffers = new Map<string, Sample[]>()
  const listeners = new Set<Listener>()

  return {
    buffers,
    listeners,
    push(key, value, t = Date.now()) {
      const buf = buffers.get(key) ?? []
      const last = buf[buf.length - 1]
      // Drop dupes within MIN_INTERVAL_MS so re-renders don't double-feed
      if (last && t - last.t < MIN_INTERVAL_MS) return
      // Drop if the value is identical and very recent
      if (last && last.v === value && t - last.t < 30_000) {
        last.t = t
        listeners.forEach((l) => l())
        return
      }
      const next = [...buf, { t, v: value }]
      while (next.length > MAX_SAMPLES) next.shift()
      buffers.set(key, next)
      listeners.forEach((l) => l())
    },
    read(key) {
      return buffers.get(key) ?? []
    },
    subscribe(l) {
      listeners.add(l)
      return () => listeners.delete(l)
    },
  }
}

const TimeseriesContext = createContext<Store | null>(null)

export function TimeseriesProvider({ children }: { children: React.ReactNode }) {
  const ref = useRef<Store | null>(null)
  if (!ref.current) ref.current = createStore()
  return (
    <TimeseriesContext.Provider value={ref.current}>{children}</TimeseriesContext.Provider>
  )
}

function useStore(): Store {
  const s = useContext(TimeseriesContext)
  if (!s) throw new Error('TimeseriesProvider missing — wrap your app in <TimeseriesProvider>')
  return s
}

/**
 * Push a numeric sample into the named buffer whenever `value` changes.
 * No-ops on null/undefined/NaN.
 */
export function useRecordSample(key: string, value: number | null | undefined) {
  const store = useStore()
  useEffect(() => {
    if (value == null || !Number.isFinite(value)) return
    store.push(key, value)
  }, [store, key, value])
}

/**
 * Subscribe to a buffer; returns the current samples and re-renders when it grows.
 */
export function useTimeseries(key: string): Sample[] {
  const store = useStore()
  const subscribe = useCallback((l: Listener) => store.subscribe(l), [store])
  const get = useCallback(() => store.read(key), [store, key])
  return useSyncExternalStore(subscribe, get, get)
}
