import { Outlet } from 'react-router-dom'
import Header from './Header'
import BottomNav from './BottomNav'
import ManualCodeEntry from '@/components/scanner/ManualCodeEntry'

export default function Layout() {
    return (
        <div className="min-h-screen bg-space-navy relative pb-20">
            {/* Starfield Background */}
            <div className="starfield fixed inset-0 -z-10" />

            {/* Header */}
            <Header />

            {/* Main Content */}
            <div className="relative z-10">
                <Outlet />
            </div>

            {/* Bottom Navigation */}
            <BottomNav />

            {/* Manual Code Entry Modal */}
            <ManualCodeEntry />
        </div>
    )
}
