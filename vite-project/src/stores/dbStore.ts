import { create } from 'zustand'
import { initDatabase, saveDatabase } from '../lib/db'

interface DbStore {
  initialized: boolean
  error: string | null
  init: () => Promise<void>
  save: () => Promise<void>
  version: number
  bump: () => void
}

export const useDbStore = create<DbStore>((set, get) => ({
  initialized: false,
  error: null,
  version: 0,

  init: async () => {
    try {
      await initDatabase()
      const { seedDatabase } = await import('../lib/seedData')
      seedDatabase()
      set({ initialized: true })
    } catch (e) {
      set({ error: String(e) })
    }
  },

  save: async () => {
    await saveDatabase()
  },

  bump: () => set(s => ({ version: s.version + 1 })),
}))
