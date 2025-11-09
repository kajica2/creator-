import React, { createContext, useContext, useReducer, Dispatch, ReactNode } from 'react';
import { GameState, GameAction, JournalEntry } from '../types';
// Fix: Import SPHERES_DATA to handle ascension logic within the reducer.
import { BLUEPRINTS_DATA, ARTIFACTS_DATA, SPHERES_DATA } from '../constants';

const initialState: GameState = {
    energy: 100,
    maxEnergy: 100,
    ip: 0,
    level: 1,
    journalEntries: [],
    unlockedBlueprints: ['seed_of_life'],
    craftedArtifacts: [],
    unlockedAetheneumNodes: ['matter', 'energy'],
};

const GameContext = createContext<{
    state: GameState;
    dispatch: Dispatch<GameAction>;
} | undefined>(undefined);

const gameReducer = (state: GameState, action: GameAction): GameState => {
    switch (action.type) {
        case 'ADD_ENERGY':
            return { ...state, energy: Math.min(state.maxEnergy, state.energy + action.payload) };
        case 'SPEND_ENERGY':
            return { ...state, energy: Math.max(0, state.energy - action.payload) };
        case 'ADD_IP':
            return { ...state, ip: state.ip + action.payload };
        case 'SPEND_IP':
            return { ...state, ip: Math.max(0, state.ip - action.payload) };
        case 'ADD_JOURNAL_ENTRY': {
            // Fix: Refactored logic to be more robust and handle ascension automatically.
            const newEntry: JournalEntry = {
                ...action.payload,
                id: new Date().toISOString(),
                createdAt: new Date(),
            };
            const entries = [...state.journalEntries, newEntry];
            
            const blueprint = BLUEPRINTS_DATA.find(b => b.id === newEntry.blueprintId);
            if (!blueprint) {
                return { ...state, journalEntries: entries };
            }

            const entriesForBlueprint = entries.filter(e => e.blueprintId === blueprint.id);
            const isBlueprintComplete = entriesForBlueprint.length >= blueprint.nodes.length;
            const isArtifactAlreadyCrafted = state.craftedArtifacts.includes(blueprint.unlocksArtifact);

            if (isBlueprintComplete && !isArtifactAlreadyCrafted) {
                const artifact = ARTIFACTS_DATA.find(a => a.id === blueprint.unlocksArtifact);
                if (!artifact) { // Should not happen if data is consistent
                    return { ...state, journalEntries: entries };
                }

                const newCraftedArtifacts = [...state.craftedArtifacts, artifact.id];
                
                // Unlock the next available blueprint that isn't already unlocked.
                const nextBlueprint = BLUEPRINTS_DATA.find(b => !state.unlockedBlueprints.includes(b.id));
                const newUnlockedBlueprints = nextBlueprint ? [...state.unlockedBlueprints, nextBlueprint.id] : state.unlockedBlueprints;
                
                const currentSphere = SPHERES_DATA.find(s => s.unlocksAtLevel === state.level);
                const shouldAscend = currentSphere && currentSphere.artifactToCraft === artifact.id;
                
                return { 
                    ...state, 
                    journalEntries: entries, 
                    craftedArtifacts: newCraftedArtifacts,
                    unlockedBlueprints: newUnlockedBlueprints,
                    level: shouldAscend ? state.level + 1 : state.level,
                };
            }
            
            return { ...state, journalEntries: entries };
        }
        case 'UNLOCK_NODE':
             if (state.unlockedAetheneumNodes.includes(action.payload)) return state;
            return { ...state, unlockedAetheneumNodes: [...state.unlockedAetheneumNodes, action.payload] };
        case 'ASCEND':
            return { ...state, level: state.level + 1 };
        default:
            return state;
    }
};

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(gameReducer, initialState);
    // Fix: Replaced JSX with React.createElement to avoid syntax errors in a .ts file.
    return React.createElement(GameContext.Provider, { value: { state, dispatch } }, children);
};

export const useGame = () => {
    const context = useContext(GameContext);
    if (context === undefined) {
        throw new Error('useGame must be used within a GameProvider');
    }
    const { state, dispatch } = context;

    const addEnergy = (amount: number) => dispatch({ type: 'ADD_ENERGY', payload: amount });
    const spendEnergy = (amount: number) => dispatch({ type: 'SPEND_ENERGY', payload: amount });
    const addIp = (amount: number) => dispatch({ type: 'ADD_IP', payload: amount });
    const spendIp = (amount: number) => dispatch({ type: 'SPEND_IP', payload: amount });
    const unlockAetheneumNode = (nodeId: string, cost: number) => {
        if (state.ip >= cost) {
            spendIp(cost);
            dispatch({ type: 'UNLOCK_NODE', payload: nodeId });
        }
    };
    const completeJournalEntry = (entry: Omit<JournalEntry, 'id' | 'createdAt'>) => {
        dispatch({ type: 'ADD_JOURNAL_ENTRY', payload: entry });
    };
    const ascendSphere = () => dispatch({ type: 'ASCEND' });

    return { state, dispatch, addEnergy, spendEnergy, addIp, spendIp, unlockAetheneumNode, completeJournalEntry, ascendSphere };
};
