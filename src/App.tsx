import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import AuthGuard from './components/auth/AuthGuard'
import Layout from './components/layout/Layout'
import LoginPage from './pages/LoginPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import ProfileSetupPage from './pages/ProfileSetupPage'
import GridPageWithScanner from './pages/GridPageWithScanner'
import NetworkPage from './pages/NetworkPage'
import MyQRPage from './pages/MyQRPage'
import HuntHomePage from './pages/hunt/HuntHomePage'
import HuntCreatePage from './pages/hunt/HuntCreatePage'
import HuntJoinPage from './pages/hunt/HuntJoinPage'
import HuntLobbyPage from './pages/hunt/HuntLobbyPage'
import HuntGamePage from './pages/hunt/HuntGamePage'
import HuntResultsPage from './pages/hunt/HuntResultsPage'
import HuntEventCreatePage from './pages/hunt/HuntEventCreatePage'
import HuntEventDashboard from './pages/hunt/HuntEventDashboard'
import HuntSimpleCreatePage from './pages/hunt/HuntSimpleCreatePage'
import HuntSimplePage from './pages/hunt/HuntSimplePage'
import HuntSimpleJoinPage from './pages/hunt/HuntSimpleJoinPage'
import HuntPresentPage from './pages/hunt/HuntPresentPage'
import './App.css'

function App() {
    return (
        <>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/auth/callback" element={<AuthCallbackPage />} />

                {/* Profile Setup (requires auth but not full guard) */}
                <Route path="/profile/setup" element={<ProfileSetupPage />} />

                {/* Protected Routes */}
                <Route path="/" element={
                    <AuthGuard>
                        <Layout />
                    </AuthGuard>
                }>
                    <Route index element={<Navigate to="/grid" replace />} />
                    <Route path="grid" element={<GridPageWithScanner />} />
                    <Route path="network" element={<NetworkPage />} />
                    <Route path="my-qr" element={<MyQRPage />} />

                    {/* Hunt Game Mode Routes */}
                    <Route path="hunt" element={<HuntHomePage />} />
                    <Route path="hunt/create" element={<HuntCreatePage />} />
                    <Route path="hunt/join" element={<HuntJoinPage />} />
                    <Route path="hunt/lobby/:sessionId" element={<HuntLobbyPage />} />
                    <Route path="hunt/play/:sessionId" element={<HuntGamePage />} />
                    <Route path="hunt/results/:sessionId" element={<HuntResultsPage />} />
                    <Route path="hunt/event/create" element={<HuntEventCreatePage />} />
                    <Route path="hunt/event/:eventId" element={<HuntEventDashboard />} />
                    {/* Clash Mode (60 players) */}
                    <Route path="hunt/simple/create" element={<HuntSimpleCreatePage />} />
                    <Route path="hunt/simple/join" element={<HuntSimpleJoinPage />} />
                    <Route path="hunt/simple/:sessionId" element={<HuntSimplePage />} />
                    <Route path="hunt/present/:sessionId" element={<HuntPresentPage />} />
                </Route>
            </Routes>

            {/* Toast Notifications */}
            <Toaster
                position="top-center"
                toastOptions={{
                    style: {
                        background: '#1E3A8A',
                        color: '#fff',
                        border: '1px solid #7C3AED',
                    },
                }}
            />
        </>
    )
}

export default App
