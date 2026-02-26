import { motion } from 'framer-motion'
import { QrCode } from 'lucide-react'
import { useScannerStore } from '@/lib/scannerStore'

export default function ScanButton() {
    const { openScanner } = useScannerStore()

    return (
        <motion.button
            onClick={openScanner}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="fixed bottom-24 right-6 z-40 w-16 h-16 rounded-full bg-gradient-to-r from-stellar-purple to-cosmic-blue shadow-lg flex items-center justify-center"
        >
            <QrCode className="w-8 h-8 text-star-white" />
        </motion.button>
    )
}
