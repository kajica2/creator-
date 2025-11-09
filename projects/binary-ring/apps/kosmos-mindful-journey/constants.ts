import { Sphere, Blueprint, Artifact, AetheneumNode } from './types';

export const SPHERES_DATA: Sphere[] = [
    {
        id: 1,
        name: 'Earth',
        theme: 'Grounding',
        description: 'Your journey begins on Earth, the foundation of being. Here, we practice grounding ourselves in the present.',
        unlocksAtLevel: 1,
        quest: {
            activity: 'meditation',
            duration: 300, // 5 minutes
            description: 'Meditate on your foundation.',
        },
        artifactToCraft: 'seed_of_grounding',
    },
    {
        id: 2,
        name: 'Moon',
        theme: 'Inconstancy',
        description: 'The Moon, ever-changing, represents our own inconstancy. Here we meditate on consistency and commitment.',
        unlocksAtLevel: 2,
        quest: {
            activity: 'meditation',
            duration: 600, // 10 minutes
            description: 'Commit to yourself.',
        },
        artifactToCraft: 'flower_of_life',
    },
    {
        id: 3,
        name: 'Venus',
        theme: 'Love',
        description: 'Venus governs connection and compassion. Reflect on your relationships with others and with yourself.',
        unlocksAtLevel: 3,
        quest: {
            activity: 'meditation',
            duration: 900, // 15 minutes
            description: 'Reflect on compassion.',
        },
    },
    // Add more spheres...
];

export const BLUEPRINTS_DATA: Blueprint[] = [
    {
        id: 'seed_of_life',
        name: 'Seed of Life',
        description: 'A foundational pattern of 7 overlapping circles, representing the 7 days of creation.',
        nodes: [
            { x: 50, y: 50 }, { x: 35.5, y: 25 }, { x: 64.5, y: 25 }, { x: 21, y: 50 },
            { x: 79, y: 50 }, { x: 35.5, y: 75 }, { x: 64.5, y: 75 },
        ],
        unlocksArtifact: 'seed_of_grounding',
    },
     {
        id: 'flower_of_life_blueprint',
        name: 'Flower of Life',
        description: 'An ancient symbol of creation, containing the patterns of the universe.',
        nodes: [ // simplified for example
            { x: 50, y: 15 }, { x: 65, y: 25 }, { x: 75, y: 40 }, { x: 75, y: 60 },
            { x: 65, y: 75 }, { x: 50, y: 85 }, { x: 35, y: 75 }, { x: 25, y: 60 },
            { x: 25, y: 40 }, { x: 35, y: 25 }, { x: 50, y: 50 },
        ],
        unlocksArtifact: 'flower_of_life',
    }
];

export const ARTIFACTS_DATA: Artifact[] = [
    {
        id: 'seed_of_grounding',
        name: 'Seed of Grounding',
        description: 'An artifact crafted from foundational insights.',
        bonus: 'Your energy bar drains 10% slower from fear events.',
    },
    {
        id: 'flower_of_life',
        name: 'Flower of Life',
        description: 'An artifact of universal connection.',
        bonus: 'Increases IP gains from meditation by 5%.',
    }
];

export const AETHENEUM_DATA: AetheneumNode[] = [
    {
        id: 'matter',
        name: 'Matter',
        description: 'The physical substance of the universe.',
        ipCost: 0,
        position: { x: 20, y: 50 },
        contentPack: { title: 'Meditations on the Physical', prompts: ['Feel the weight of your body.', 'Notice the texture of your clothes.'] },
    },
    {
        id: 'energy',
        name: 'Energy',
        description: 'The capacity for work or change; the life force.',
        ipCost: 0,
        position: { x: 50, y: 20 },
        contentPack: { title: 'Harnessing Your Energy', prompts: ['Where do you feel energy in your body?', 'What actions give you energy?'] },
    },
    {
        id: 'quanta',
        name: 'Quanta',
        description: 'The minimum amount of any physical entity involved in an interaction.',
        ipCost: 50,
        parent: 'matter',
        position: { x: 20, y: 20 },
        contentPack: { title: 'The Quantum Self', prompts: ['Consider a small choice you made today.', 'How can a small action create a large ripple?'] },
    },
     {
        id: 'logic',
        name: 'Logic',
        description: 'Reasoning conducted or assessed according to strict principles of validity.',
        ipCost: 100,
        parent: 'quanta',
        position: { x: 5, y: 5 },
        contentPack: { title: 'The Path of Reason', prompts: ['Observe a thought without judgment.', 'What is the logical next step?'] },
    },
    {
        id: 'prana',
        name: 'Prana',
        description: 'In Hindu philosophy, the vital life-sustaining force of living beings.',
        ipCost: 50,
        parent: 'energy',
        position: { x: 50, y: 50 },
        contentPack: { title: 'The Breath of Life', prompts: ['Follow your breath for one minute.', 'Inhale energy, exhale tension.'] },
    },
];