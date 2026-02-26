import { create } from 'zustand'

interface ScannerStore {
    isOpen: boolean
    failedAttempts: number
    showManualCodeEntry: boolean
    lastScanError: string | null

    openScanner: () => void
    closeScanner: () => void
    incrementFailedAttempts: () => void
    resetFailedAttempts: () => void
    setShowManualCodeEntry: (show: boolean) => void
    setLastScanError: (error: string | null) => void
}

export const useScannerStore = create<ScannerStore>((set, get) => ({
    isOpen: false,
    failedAttempts: 0,
    showManualCodeEntry: false,
    lastScanError: null,

    openScanner: () => set({ isOpen: true, lastScanError: null }),

    closeScanner: () => set({ isOpen: false }),

    incrementFailedAttempts: () => {
        const newAttempts = get().failedAttempts + 1
        set({ failedAttempts: newAttempts })

        // Auto-open manual code entry after 3 failed attempts
        if (newAttempts >= 3) {
            set({ showManualCodeEntry: true, isOpen: false })
        }
    },

    resetFailedAttempts: () => set({ failedAttempts: 0 }),

    setShowManualCodeEntry: (show) => set({ showManualCodeEntry: show }),

    setLastScanError: (error) => set({ lastScanError: error }),
}))
