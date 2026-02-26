import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Flashlight, FlashlightOff } from 'lucide-react'
import { useScannerStore } from '@/lib/scannerStore'
import toast from 'react-hot-toast'

interface QRScannerProps {
    onScan: (data: string) => void
    onClose: () => void
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const codeReader = useRef<BrowserMultiFormatReader | null>(null)
    // const [hasPermission, setHasPermission] = useState(false) // Unused
    const [torchOn, setTorchOn] = useState(false)
    const [scanning, setScanning] = useState(true)
    const { incrementFailedAttempts } = useScannerStore()

    useEffect(() => {
        const initScanner = async () => {
            try {
                codeReader.current = new BrowserMultiFormatReader()

                // Request camera permission
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                })

                // setHasPermission(true) // Unused

                if (videoRef.current) {
                    videoRef.current.srcObject = stream
                }

                // Start scanning
                await startScanning()
            } catch (error) {
                console.error('Error accessing camera:', error)
                toast.error('Camera access denied. Please enable camera permissions.')
                onClose()
            }
        }

        const startScanning = async () => {
            if (!codeReader.current || !videoRef.current) return

            try {
                const controls = await codeReader.current.decodeFromVideoDevice(
                    undefined, // use default camera
                    videoRef.current,
                    (result, _error) => { // Rename to _error
                        if (result && scanning) {
                            const data = result.getText()
                            setScanning(false)
                            handleSuccessfulScan(data)
                        }
                    }
                )

                return () => {
                    controls?.stop()
                }
            } catch (error) {
                console.error('Error starting scanner:', error)
            }
        }

        initScanner()

        return () => {
            // if (codeReader.current) {
            //     // codeReader.current.reset() // reset() does not exist on BrowserMultiFormatReader
            // }
            if (videoRef.current?.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream
                stream.getTracks().forEach(track => track.stop())
            }
        }
    }, [])

    const handleSuccessfulScan = (data: string) => {
        try {
            // Validate QR data
            const qrData = JSON.parse(data)
            if (qrData.userId && qrData.code && qrData.version) {
                onScan(data)
            } else {
                toast.error('Invalid QR code. Please scan a CLOUD 101 QR code.')
                incrementFailedAttempts()
                setTimeout(() => setScanning(true), 2000)
            }
        } catch (error) {
            toast.error('Invalid QR code format')
            incrementFailedAttempts()
            setTimeout(() => setScanning(true), 2000)
        }
    }

    const toggleTorch = async () => {
        if (!videoRef.current?.srcObject) return

        try {
            const stream = videoRef.current.srcObject as MediaStream
            const track = stream.getVideoTracks()[0]
            const capabilities = track.getCapabilities() as any

            if (capabilities.torch) {
                await track.applyConstraints({
                    advanced: [{ torch: !torchOn }]
                } as any)
                setTorchOn(!torchOn)
            } else {
                toast.error('Flash not available on this device')
            }
        } catch (error) {
            console.error('Error toggling torch:', error)
        }
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-space-navy"
            >
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-space-navy to-transparent">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-star-white">Scan QR Code</h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full bg-stellar-purple/20 hover:bg-stellar-purple/30 transition-colors"
                        >
                            <X className="w-6 h-6 text-star-white" />
                        </button>
                    </div>
                </div>

                {/* Video Feed */}
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Scanning Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                    {/* Scan Frame */}
                    <div className="relative w-64 h-64">
                        {/* Corners */}
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-stellar-purple rounded-tl-lg" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-stellar-purple rounded-tr-lg" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-stellar-purple rounded-bl-lg" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-stellar-purple rounded-br-lg" />

                        {/* Scanning Line */}
                        {scanning && (
                            <motion.div
                                className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-stellar-purple to-transparent"
                                animate={{ top: ['0%', '100%'] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                            />
                        )}
                    </div>
                </div>

                {/* Bottom Controls */}
                <div className="absolute bottom-0 left-0 right-0 z-20 p-6 bg-gradient-to-t from-space-navy to-transparent">
                    <div className="flex flex-col items-center gap-4">
                        {/* Flash Toggle */}
                        <button
                            onClick={toggleTorch}
                            className="p-4 rounded-full bg-stellar-purple/20 hover:bg-stellar-purple/30 transition-colors"
                        >
                            {torchOn ? (
                                <Flashlight className="w-6 h-6 text-stellar-purple" />
                            ) : (
                                <FlashlightOff className="w-6 h-6 text-moon-gray" />
                            )}
                        </button>

                        {/* Instructions */}
                        <div className="text-center">
                            <p className="text-star-white font-medium mb-1">
                                Position QR code within the frame
                            </p>
                            <p className="text-moon-gray text-sm">
                                Scanning will happen automatically
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
