import { Users, QrCode, Grid3x3, Shield } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useNetworkStore } from '@/lib/networkStore'

export default function BottomNav() {
    const location = useLocation()
    const { connections } = useNetworkStore()

    const navItems = [
        { icon: Grid3x3, label: 'Grid', path: '/grid' },
        { icon: Shield, label: 'Hunt', path: '/hunt' },
        { icon: Users, label: 'Network', path: '/network', badge: connections.length },
        { icon: QrCode, label: 'My QR', path: '/my-qr' },
    ]

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-cosmic-blue/40 via-space-navy/30 to-cosmic-blue/40 backdrop-blur-xl border-t border-stellar-purple/50 shadow-[0_-8px_32px_0_rgba(139,92,246,0.3)]">
            <div className="max-w-4xl mx-auto px-4">
                <div className="flex items-center justify-around py-3">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path
                        const Icon = item.icon

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    'flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all relative',
                                    isActive
                                        ? 'text-stellar-purple bg-stellar-purple/20'
                                        : 'text-moon-gray hover:text-star-white hover:bg-stellar-purple/10'
                                )}
                            >
                                <div className="relative">
                                    <Icon className="w-6 h-6" />
                                    {!!item.badge && item.badge > 0 && (
                                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full text-xs font-bold text-white flex items-center justify-center">
                                            {item.badge > 9 ? '9+' : item.badge}
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs font-medium">{item.label}</span>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </nav>
    )
}
