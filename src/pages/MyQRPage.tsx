import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { QrCode, Copy, Download, Share2, CheckCircle2, Linkedin } from 'lucide-react'
import QRCode from 'react-qr-code'
import { useAuthStore } from '@/lib/store'
import { formatConnectionCode } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function MyQRPage() {
    const { user, profile } = useAuthStore()
    const navigate = useNavigate()
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (!profile) {
            navigate('/profile/setup', { replace: true })
        }
    }, [profile, navigate])

    if (!profile) return null

    const qrData = JSON.stringify({
        userId: profile.user_id,
        code: profile.connection_code,
        name: profile.full_name,
        linkedin: profile.linkedin_url,
        version: '1.0',
    })

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(profile.connection_code)
            setCopied(true)
            toast.success('Code copied to clipboard!')
            setTimeout(() => setCopied(false), 2000)
        } catch (error) {
            toast.error('Failed to copy code')
        }
    }

    const handleDownload = () => {
        const svg = document.getElementById('qr-code')
        if (!svg) return

        const svgData = new XMLSerializer().serializeToString(svg)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()

        img.onload = () => {
            canvas.width = img.width
            canvas.height = img.height
            ctx?.drawImage(img, 0, 0)
            const pngFile = canvas.toDataURL('image/png')

            const downloadLink = document.createElement('a')
            downloadLink.download = `${profile.full_name.replace(/\s+/g, '_')}_QR.png`
            downloadLink.href = pngFile
            downloadLink.click()
            toast.success('QR code downloaded!')
        }

        img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
    }

    const handleShare = async () => {
        if (!navigator.share) {
            toast.error('Sharing not supported on this device')
            return
        }

        try {
            await navigator.share({
                title: 'My CLOUD 101 Connection Code',
                text: `Connect with me on CLOUD 101! My code is: ${profile.connection_code}`,
            })
        } catch (error) {
            // User canceled share
        }
    }

    return (
        <div className="min-h-screen pt-8 pb-24 px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-lg mx-auto"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <QrCode className="w-12 h-12 text-stellar-purple mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-star-white mb-2">
                        My QR Code
                    </h1>
                    <p className="text-moon-gray">
                        Let others scan this to connect with you
                    </p>
                </div>

                {/* QR Code Card */}
                <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="p-8 rounded-2xl bg-cosmic-blue/30 backdrop-blur-md border border-stellar-purple/50 mb-6"
                >
                    {/* QR Code */}
                    <div className="bg-white p-6 rounded-xl mb-6 flex items-center justify-center">
                        <QRCode
                            id="qr-code"
                            value={qrData}
                            size={240}
                            level="H"
                            fgColor="#1E1B4B"
                        />
                    </div>

                    {/* User Info */}
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-stellar-purple/30 border-2 border-stellar-purple flex items-center justify-center">
                            <span className="text-xl font-bold text-stellar-purple">
                                {profile.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                            </span>
                        </div>
                        <h2 className="text-xl font-bold text-star-white mb-1">
                            {profile.full_name}
                        </h2>
                        <a
                            href={profile.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-stellar-purple hover:text-stellar-purple/80 transition-colors"
                        >
                            <Linkedin className="w-4 h-4" />
                            View LinkedIn
                        </a>
                    </div>

                    {/* Connection Code */}
                    <div className="bg-space-navy rounded-lg p-4 mb-4">
                        <p className="text-moon-gray text-sm mb-2 text-center">Connection Code</p>
                        <div className="flex items-center justify-center gap-2">
                            <code className="text-2xl font-bold text-stellar-purple tracking-wider">
                                {formatConnectionCode(profile.connection_code)}
                            </code>
                            <button
                                onClick={handleCopy}
                                className="p-2 rounded-lg hover:bg-stellar-purple/20 transition-colors"
                                title="Copy code"
                            >
                                {copied ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                ) : (
                                    <Copy className="w-5 h-5 text-moon-gray hover:text-star-white" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={handleDownload}
                            className="py-3 px-4 rounded-lg bg-stellar-purple/20 hover:bg-stellar-purple/30 text-stellar-purple font-medium flex items-center justify-center gap-2 transition-all"
                        >
                            <Download className="w-5 h-5" />
                            Download
                        </button>
                        <button
                            onClick={handleShare}
                            className="py-3 px-4 rounded-lg bg-stellar-purple/20 hover:bg-stellar-purple/30 text-stellar-purple font-medium flex items-center justify-center gap-2 transition-all"
                        >
                            <Share2 className="w-5 h-5" />
                            Share
                        </button>
                    </div>
                </motion.div>

                {/* Instructions */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="p-6 rounded-xl bg-cosmic-blue/20 border border-stellar-purple/30"
                >
                    <h3 className="text-lg font-semibold text-star-white mb-3">How to Connect</h3>
                    <ol className="space-y-2 text-sm text-moon-gray">
                        <li className="flex gap-3">
                            <span className="text-stellar-purple font-bold">1.</span>
                            <span>Have someone scan your QR code with their phone camera or the app scanner</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="text-stellar-purple font-bold">2.</span>
                            <span>Or share your connection code <code className="text-stellar-purple">{formatConnectionCode(profile.connection_code)}</code></span>
                        </li>
                        <li className="flex gap-3">
                            <span className="text-stellar-purple font-bold">3.</span>
                            <span>Watch your bingo grid fill up as you connect! 🎉</span>
                        </li>
                    </ol>
                </motion.div>

                <p className="text-center text-moon-gray/50 text-sm mt-6">
                    Signed in as {user?.email}
                </p>
            </motion.div>
        </div>
    )
}
