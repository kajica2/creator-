
export type View = 'journey' | 'grid' | 'aetheneum';

export interface Sphere {
    id: number;
    name: string;
    theme: string;
    description: string;
    unlocksAtLevel: number;
    quest: {
        activity: 'meditation' | 'breathing';
        duration: number; // in seconds
        description: string;
    };
    artifactToCraft?: string; // ID of artifact required to ascend
}

export interface JournalEntry {
    id: string;
    blueprintId: string;
    nodeIndex: number;
    text: string;
    createdAt: Date;
}

export interface Blueprint {
    id: string;
    name: string;
    description: string;
    nodes: { x: number; y: number }[];
    unlocksArtifact: string;
}

export interface Artifact {
    id: string;
    name: string;
    description: string;
    bonus: string;
}

export interface AetheneumNode {
    id: string;
    name: string;
    description: string;
    ipCost: number;
    parent?: string;
    position: { x: number; y: number };
    contentPack: {
        title: string;
        prompts: string[];
    };
}

export interface GameState {
    energy: number;
    maxEnergy: number;
    ip: number;
    level: number;
    journalEntries: JournalEntry[];
    unlockedBlueprints: string[];
    craftedArtifacts: string[];
    unlockedAetheneumNodes: string[];
}

export type GameAction =
    | { type: 'ADD_ENERGY'; payload: number }
    | { type: 'SPEND_ENERGY'; payload: number }
    | { type: 'ADD_IP'; payload: number }
    | { type: 'SPEND_IP'; payload: number }
    | { type: 'ADD_JOURNAL_ENTRY'; payload: Omit<JournalEntry, 'id' | 'createdAt'> }
    | { type: 'UNLOCK_NODE'; payload: string }
    | { type: 'CRAFT_ARTIFACT'; payload: { blueprintId: string; artifactId: string } }
    | { type: 'ASCEND' };

export interface Activity {
    type: 'breathing' | 'meditation' | 'journaling';
    sphere?: Sphere;
    duration?: number; // in seconds
    onComplete?: (result?: any) => void;
}
