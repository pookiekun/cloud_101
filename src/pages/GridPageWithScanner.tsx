import { useState } from 'react'
import GridPage from './GridPage'
import QRScanner from '@/components/scanner/QRScanner'
import ConnectionConfirmModal from '@/components/scanner/ConnectionConfirmModal'
import ScanButton from '@/components/scanner/ScanButton'
import { useAuthStore } from '@/lib/store'
import { useBingoStore } from '@/lib/bingoStore'
import { useScannerStore } from '@/lib/scannerStore'
import { supabase } from '@/lib/supabase'
import challenges from '@/data/challenges.json'
import toast from 'react-hot-toast'

export default function GridPageWithScanner() {
    const { profile } = useAuthStore()
    const { grid, fillSlot } = useBingoStore()
    const { isOpen, closeScanner } = useScannerStore()
    const [showConfirm, setShowConfirm] = useState(false)
    const [connectionData, setConnectionData] = useState<any>(null)

    const handleScan = async (qrData: string) => {
        try {
            const scannedData = JSON.parse(qrData)

            // Validate not connecting with self
            if (scannedData.userId === profile?.user_id) {
                toast.error('Cannot connect with yourself!')
                closeScanner()
                return
            }

            // Check if already connected
            const { data: existing } = await supabase
                .from('connections')
                .select('*')
                .or(`user_a_id.eq.${profile?.user_id},user_b_id.eq.${profile?.user_id}`)
                .or(`user_a_id.eq.${scannedData.userId},user_b_id.eq.${scannedData.userId}`)
                .single()

            if (existing) {
                toast.error(`Already connected with ${scannedData.name}!`)
                closeScanner()
                return
            }

            // Find next empty slot
            const emptySlotIndex = grid.findIndex(slot => slot === null)
            if (emptySlotIndex === -1) {
                toast.error('Bingo grid is full!')
                closeScanner()
                return
            }

            // Get challenge for this slot
            const challenge = challenges.challenges[emptySlotIndex]

            // Create connection
            const { data: connection, error } = await supabase
                .from('connections')
                .insert({
                    user_a_id: profile?.user_id,
                    user_b_id: scannedData.userId,
                    challenge_id: challenge.id,
                    connection_method: 'qr_scan',
                })
                .select()
                .single()

            if (error) throw error

            // Update bingo grid
            await supabase
                .from('bingo_grid')
                .upsert({
                    user_id: profile?.user_id,
                    slot_index: emptySlotIndex,
                    challenge_id: challenge.id,
                    connection_id: connection.id,
                })

            // Update local state
            fillSlot(emptySlotIndex, {
                id: connection.id,
                user_a_id: profile?.user_id!,
                user_b_id: scannedData.userId,
                challenge_id: challenge.id,
                connection_method: 'qr_scan',
                created_at: new Date().toISOString(),
            })

            // Show confirmation
            setConnectionData({
                partnerName: scannedData.name,
                partnerLinkedin: scannedData.linkedin,
                challengeTitle: challenge.title,
                challengeEmoji: challenge.emoji,
            })
            setShowConfirm(true)
            closeScanner()

            toast.success('Connection made! 🎉')
        } catch (error) {
            console.error('Error creating connection:', error)
            toast.error('Failed to create connection')
            closeScanner()
        }
    }

    const handleConfirm = () => {
        setShowConfirm(false)
        setConnectionData(null)
    }

    return (
        <>
            <GridPage />

            {/* Floating Scan Button */}
            <ScanButton />

            {isOpen && (
                <QRScanner
                    onScan={handleScan}
                    onClose={closeScanner}
                />
            )}

            {showConfirm && connectionData && (
                <ConnectionConfirmModal
                    isOpen={showConfirm}
                    onConfirm={handleConfirm}
                    onCancel={handleConfirm}
                    partnerName={connectionData.partnerName}
                    partnerLinkedin={connectionData.partnerLinkedin}
                    challengeTitle={connectionData.challengeTitle}
                    challengeEmoji={connectionData.challengeEmoji}
                />
            )}
        </>
    )
}
