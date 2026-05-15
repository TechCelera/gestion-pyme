import '@testing-library/jest-dom'
import { beforeEach } from 'vitest'

/** Zustand `persist` y Node reciente: asegurar `localStorage` funcional en Vitest. */
const memoryStore: Record<string, string> = {}

const localStoragePolyfill: Storage = {
  get length() {
    return Object.keys(memoryStore).length
  },
  clear() {
    for (const k of Object.keys(memoryStore)) delete memoryStore[k]
  },
  getItem(key: string) {
    return Object.prototype.hasOwnProperty.call(memoryStore, key) ? memoryStore[key] : null
  },
  key(index: number) {
    return Object.keys(memoryStore)[index] ?? null
  },
  removeItem(key: string) {
    delete memoryStore[key]
  },
  setItem(key: string, value: string) {
    memoryStore[key] = String(value)
  },
}

Object.defineProperty(globalThis, 'localStorage', {
  value: localStoragePolyfill,
  configurable: true,
  writable: true,
})

beforeEach(() => {
  localStoragePolyfill.clear()
})
