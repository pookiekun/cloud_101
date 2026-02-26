import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, AlertCircle } from 'lucide-react'
import architectures from '@/data/architectures.json'

interface HunterPanelProps {
    architectureId: 1 | 2
    placedComponentIds: string[]
    onAskForComponent: (componentId: string, componentName: string) => void
    disabled?: boolean
}

export default function HunterPanel({
    architectureId,
    placedComponentIds,
    onAskForComponent,
    disabled = false,
}: HunterPanelProps) {
    const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null)

    const architecture = architectures.architectures.find((a) => a.id === architectureId)

    if (!architecture) return null

    // Filter out already placed components
    const availableComponents = architecture.components.filter(
        (comp) => !placedComponentIds.includes(comp.id)
    )

    const selectedComponent = availableComponents.find(
        (c) => c.id === selectedComponentId
    )

    const handleAsk = () => {
        if (selectedComponent) {
            onAskForComponent(selectedComponent.id, selectedComponent.name)
            setSelectedComponentId(null)
        }
    }

    return (
        <div className="p-6 rounded-xl bg-cosmic-blue/20 border border-stellar-purple/30">
            <div className="flex items-center gap-2 mb-4">
                <Search className="w-5 h-5 text-stellar-purple" />
                <h3 className="text-lg font-semibold text-star-white">
                    Hunter Panel - Ask for a Component
                </h3>
            </div>

            {disabled && (
                <div className="p-3 rounded-lg bg-yellow-500/20 border border-yellow-500/50 mb-4">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-400" />
                        <p className="text-sm text-yellow-400">
                            Waiting for responses from other players...
                        </p>
                    </div>
                </div>
            )}

            {availableComponents.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-moon-gray">All components have been placed!</p>
                </div>
            ) : (
                <>
                    {/* Component Selection Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        {availableComponents.map((comp) => (
                            <motion.button
                                key={comp.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedComponentId(comp.id)}
                                disabled={disabled}
                                className={`
                  p-4 rounded-lg border-2 transition-all text-left
                  ${selectedComponentId === comp.id
                                        ? 'border-stellar-purple bg-stellar-purple/20'
                                        : 'border-stellar-purple/30 bg-cosmic-blue/10 hover:border-stellar-purple/50'
                                    }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-2xl">{comp.icon}</span>
                                    {selectedComponentId === comp.id && (
                                        <span className="text-stellar-purple text-xs">✓</span>
                                    )}
                                </div>
                                <p className="text-sm font-semibold text-star-white">
                                    {comp.name}
                                </p>
                            </motion.button>
                        ))}
                    </div>

                    {/* Selected Component Preview */}
                    <AnimatePresence mode="wait">
                        {selectedComponent && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-4 p-4 rounded-lg bg-stellar-purple/10 border border-stellar-purple/30"
                            >
                                <p className="text-sm text-moon-gray mb-2">
                                    You will ask: <span className="text-stellar-purple font-semibold">
                                        "Who has {selectedComponent.name}?"
                                    </span>
                                </p>
                                <p className="text-xs text-moon-gray">
                                    Players will have 20 seconds to pitch why they have this component.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Ask Button */}
                    <button
                        onClick={handleAsk}
                        disabled={!selectedComponent || disabled}
                        className="w-full py-3 px-4 rounded-lg bg-stellar-purple hover:bg-stellar-purple/90 disabled:bg-stellar-purple/30 disabled:cursor-not-allowed text-star-white font-semibold transition-all flex items-center justify-center gap-2"
                    >
                        <Search className="w-5 h-5" />
                        {selectedComponent
                            ? `Ask "Who has ${selectedComponent.name}?"`
                            : 'Select a component first'}
                    </button>
                </>
            )}
        </div>
    )
}
