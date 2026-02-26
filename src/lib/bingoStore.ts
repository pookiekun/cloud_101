import { create } from 'zustand'
import { Connection } from './supabase'

export interface BingoStore {
    grid: (Connection | null)[]
    selectedSlot: number | null
    progress: number

    setGrid: (grid: (Connection | null)[]) => void
    fillSlot: (slotIndex: number, connection: Connection) => void
    selectSlot: (index: number | null) => void
    calculateProgress: () => void
    resetGrid: () => void
}

export const useBingoStore = create<BingoStore>((set, get) => ({
    grid: Array(25).fill(null),
    selectedSlot: null,
    progress: 0,

    setGrid: (grid) => {
        set({ grid })
        get().calculateProgress()
    },

    fillSlot: (slotIndex, connection) => {
        const newGrid = [...get().grid]
        newGrid[slotIndex] = connection
        set({ grid: newGrid })
        get().calculateProgress()
    },

    selectSlot: (index) => set({ selectedSlot: index }),

    calculateProgress: () => {
        const filledSlots = get().grid.filter((slot) => slot !== null).length
        const progress = Math.round((filledSlots / 25) * 100)
        set({ progress })
    },

    resetGrid: () => {
        set({
            grid: Array(25).fill(null),
            selectedSlot: null,
            progress: 0
        })
    },
}))
