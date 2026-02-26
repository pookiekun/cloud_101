import { motion } from 'framer-motion'
import architectures from '@/data/architectures.json'

interface PlacedComponentData {
    id: string
    component_id: string
    component_name: string
    placed_by_player_id: string
    is_imposter_card: boolean
    placement_order: number
}

interface ArchitectureBoardProps {
    architectureId: 1 | 2
    placedComponents: PlacedComponentData[]
}

export default function ArchitectureBoard({
    architectureId,
    placedComponents,
}: ArchitectureBoardProps) {
    const architecture = architectures.architectures.find((a) => a.id === architectureId)

    if (!architecture) return null

    return (
        <div className="p-6 rounded-xl bg-cosmic-blue/20 border border-stellar-purple/30">
            <h3 className="text-lg font-semibold text-star-white mb-4">
                Architecture Board
            </h3>

            {/* Architecture Diagram */}
            <div className="mb-4 p-4 rounded-lg bg-space-navy border border-stellar-purple/20">
                <img
                    src={architecture.image}
                    alt={architecture.name}
                    className="w-full rounded"
                />
            </div>

            {/* Components Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {architecture.components.map((comp) => {
                    const placed = placedComponents.find(
                        (p) => p.component_id === comp.id
                    )

                    return (
                        <motion.div
                            key={comp.id}
                            initial={{ opacity: 0.5 }}
                            animate={{ opacity: placed ? 1 : 0.5 }}
                            className={`
                p-3 rounded-lg border-2 transition-all
                ${placed
                                    ? 'bg-green-500/20 border-green-500'
                                    : 'bg-cosmic-blue/10 border-stellar-purple/30 border-dashed'
                                }
              `}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-2xl">{comp.icon}</span>
                                {placed && (
                                    <span className="text-xs text-green-400 font-semibold">
                                        ✓
                                    </span>
                                )}
                            </div>
                            <p
                                className={`text-xs font-medium ${placed ? 'text-star-white' : 'text-moon-gray'
                                    }`}
                            >
                                {comp.name}
                            </p>
                            {placed && placed.is_imposter_card && (
                                <span className="text-xs text-red-400">⚠️ Imposter</span>
                            )}
                        </motion.div>
                    )
                })}
            </div>

            {/* Progress */}
            <div className="mt-4 text-center">
                <p className="text-sm text-moon-gray">
                    {placedComponents.length} / {architecture.components.length} components placed
                </p>
                <div className="w-full h-2 bg-cosmic-blue/30 rounded-full mt-2 overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{
                            width: `${(placedComponents.length / architecture.components.length) * 100
                                }%`,
                        }}
                        className="h-full bg-stellar-purple"
                    />
                </div>
            </div>
        </div>
    )
}
