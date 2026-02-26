import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import QRCode from 'react-qr-code'
import architectures from '@/data/architectures.json'

interface Session {
    id: string
    session_code: string
    status: 'lobby' | 'active' | 'complete'
    architecture_id: 1 | 2
}

export default function HuntPresentPage() {
    const { sessionId } = useParams<{ sessionId: string }>()
    const [session, setSession] = useState<Session | null>(null)
    const [playerCount, setPlayerCount] = useState(0)

    const joinUrl = `${window.location.origin}/hunt/simple/${sessionId}`

    const fetchData = useCallback(async () => {
        if (!sessionId) return
        const { data: s } = await supabase
            .from('hunt_sessions')
            .select('*')
            .eq('id', sessionId)
            .single()
        if (s) setSession(s)

        const { count } = await supabase
            .from('hunt_players')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', sessionId)
        setPlayerCount(count || 0)
    }, [sessionId])

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, 3000)
        return () => clearInterval(interval)
    }, [fetchData])

    const arch = architectures.architectures.find(a => a.id === session?.architecture_id)

    return (
        <div className="min-h-screen bg-space-navy text-star-white p-8 flex flex-col">
            {/* Top bar: title + status */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-4xl font-black text-stellar-purple">☁️ AWS Hunt Game</h1>
                    <p className="text-moon-gray text-lg">{arch?.name}</p>
                </div>
                <div className="text-right">
                    {session?.status === 'active' ? (
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500 text-green-400 text-xl font-bold">
                            <span className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                            GAME ACTIVE
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-stellar-purple/20 border border-stellar-purple text-stellar-purple text-xl font-bold">
                            <span className="w-3 h-3 rounded-full bg-stellar-purple animate-pulse" />
                            {playerCount} players joined
                        </span>
                    )}
                </div>
            </div>

            {/* Main layout: architecture + QR */}
            <div className="flex gap-8 flex-1">
                {/* Architecture Image */}
                <div className="flex-1">
                    {arch?.image && (
                        <div className="mb-6">
                            <img
                                src={arch.image}
                                alt={arch.name}
                                className="w-full rounded-2xl border-2 border-stellar-purple/40 shadow-2xl"
                            />
                        </div>
                    )}

                    {/* Component legend */}
                    <div className="grid grid-cols-2 gap-3">
                        {arch?.components.map(comp => (
                            <div
                                key={comp.id}
                                className="flex items-center gap-3 p-3 rounded-xl bg-cosmic-blue/30 border border-stellar-purple/20"
                            >
                                <span className="text-3xl">{comp.icon}</span>
                                <div>
                                    <p className="text-star-white font-semibold text-sm">{comp.name}</p>
                                    <p className="text-moon-gray text-xs">{comp.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right column: QR + instructions */}
                <div className="w-72 flex-shrink-0 flex flex-col gap-5">
                    {/* QR Section */}
                    <div className="p-5 rounded-2xl bg-cosmic-blue/20 border-2 border-stellar-purple text-center">
                        <p className="text-moon-gray text-sm mb-3 font-semibold uppercase tracking-widest">
                            Scan to Join
                        </p>
                        <div className="p-4 bg-white rounded-xl mx-auto inline-block">
                            <QRCode value={joinUrl} size={180} />
                        </div>
                        <div className="mt-4">
                            <p className="text-moon-gray text-xs mb-1">Or enter code:</p>
                            <p className="text-4xl font-mono font-black text-stellar-purple tracking-widest">
                                {session?.session_code}
                            </p>
                        </div>
                    </div>

                    {/* How-to play card */}
                    <div className="p-4 rounded-xl bg-stellar-purple/10 border border-stellar-purple/30">
                        <h3 className="text-star-white font-bold text-base mb-3">How to Play</h3>
                        <ol className="space-y-2">
                            {[
                                'Scan QR to get your card',
                                'Study your AWS component',
                                'Walk around & meet others',
                                'Explain your component — but watch out for the imposter!',
                                'Vote who you think is the imposter',
                            ].map((step, i) => (
                                <li key={i} className="flex gap-2 text-sm text-moon-gray">
                                    <span className="text-stellar-purple font-bold flex-shrink-0">{i + 1}.</span>
                                    <span>{step}</span>
                                </li>
                            ))}
                        </ol>
                    </div>

                    {/* Player count progress */}
                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-center">
                        <p className="text-2xl font-black text-green-400">{playerCount}</p>
                        <p className="text-green-300 text-sm">Players Joined</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
