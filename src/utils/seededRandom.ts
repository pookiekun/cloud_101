import architectures from '@/data/architectures.json'

// Simple seeded random number generator (Mulberry32)
function mulberry32(a: number) {
    return function () {
        let t = a += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
}

// Convert string to seed number
function stringToSeed(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

// Generate N unique random indices using seeded RNG
function generateUniqueIndices(seed: number, count: number, maxIndex: number): number[] {
    const rng = mulberry32(seed);
    const indices: number[] = [];
    const used = new Set<number>();

    // Generate unique indices
    let attempts = 0;
    while (indices.length < count && attempts < maxIndex * 10) {
        const index = Math.floor(rng() * maxIndex);
        if (!used.has(index)) {
            used.add(index);
            indices.push(index);
        }
        attempts++;
    }

    // If we couldn't get enough unique indices, fill with any remaining
    if (indices.length < count) {
        for (let i = 0; i < maxIndex && indices.length < count; i++) {
            if (!used.has(i)) {
                indices.push(i);
            }
        }
    }

    return indices;
}

export interface StaticCard {
    id: string
    component_id: string
    component_name: string
    is_imposter_card: boolean
    brief_text: string | null
    icon: string
}

export function getImposterCards(): StaticCard[] {
    return [
        {
            id: 'imposter-card-1',
            component_id: 'imposter',
            component_name: 'Imposter Card',
            is_imposter_card: true,
            brief_text: null,
            icon: '💀'
        },
        {
            id: 'imposter-card-2',
            component_id: 'imposter',
            component_name: 'Imposter Card',
            is_imposter_card: true,
            brief_text: null,
            icon: '💀'
        },
        {
            id: 'imposter-card-3',
            component_id: 'imposter',
            component_name: 'Imposter Card',
            is_imposter_card: true,
            brief_text: null,
            icon: '💀'
        }
    ];
}

// Get deterministic cards for a crew member
// Cards are drawn from ALL components across BOTH architectures
export function getAssignedCards(playerId: string, sessionId: string, _architectureId: number): StaticCard[] {
    // Combine ALL components from BOTH architectures
    const allComponents = [
        ...architectures.architectures[0].components,
        ...architectures.architectures[1].components
    ];

    console.log(`🎴 Total component pool: ${allComponents.length} components`);

    // Generate unique seed from playerId + sessionId
    // CRITICAL: playerId must be unique for each player
    const seedString = `${sessionId}-${playerId}`;
    const seed = stringToSeed(seedString);

    console.log(`🎲 Seed for player ${playerId.slice(0, 8)}...: ${seed}`);

    // Generate 3 unique indices
    const indices = generateUniqueIndices(seed, 3, allComponents.length);

    console.log(`📇 Selected indices: [${indices.join(', ')}]`);

    // Map indices to actual cards
    return indices.map((index, cardNum) => {
        const comp = allComponents[index];
        return {
            id: `card-${playerId}-${cardNum}`,
            component_id: comp.id,
            component_name: comp.name,
            is_imposter_card: false,
            brief_text: comp.brief,
            icon: comp.icon
        };
    });
}
