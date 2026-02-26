import { useEffect } from 'react'
import BingoGrid from '@/components/bingo/BingoGrid'
import ChallengeModal from '@/components/bingo/ChallengeModal'
import { useBingoStore } from '@/lib/bingoStore'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'

export default function GridPage() {
    const { selectedSlot, selectSlot, setGrid } = useBingoStore()
    const { profile } = useAuthStore()

    useEffect(() => {
        const loadGrid = async () => {
            if (!profile?.id) return

            console.log('Loading bingo grid for profile:', profile.id)

            // Fetch grid data with connections AND profile data for both users
            const { data: gridSlots, error } = await supabase
                .from('bingo_grid')
                .select(`
                    *,
                    connection:connections(
                        *,
                        user_a:profiles!connections_user_a_id_fkey(*),
                        user_b:profiles!connections_user_b_id_fkey(*)
                    )
                `)
                .eq('user_id', profile.id)

            if (error) {
                console.error('Error loading grid:', error)
                return
            }

            console.log('Grid data loaded:', gridSlots)

            // Create a 25-slot array
            const grid = Array(25).fill(null)

            // Fill in the slots that have connections
            gridSlots?.forEach((slot) => {
                if (slot.connection && slot.slot_index >= 0 && slot.slot_index < 25) {
                    grid[slot.slot_index] = slot.connection
                }
            })

            setGrid(grid)
        }

        loadGrid()
    }, [profile?.id, setGrid])

    const handleCloseModal = () => {
        selectSlot(null)
    }

    return (
        <div className="pb-24 px-4 pt-8">
            <header className="text-center mb-8">
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-stellar-purple to-cosmic-blue bg-clip-text text-transparent">
                    Bingo Grid
                </h1>
                <p className="text-moon-gray">
                    Connect with people and fill your grid!
                </p>
            </header>

            <BingoGrid />

            {/* Challenge Modal */}
            <ChallengeModal
                isOpen={selectedSlot !== null}
                onClose={handleCloseModal}
                slotIndex={selectedSlot ?? 0}
            />
        </div>
    )
}
