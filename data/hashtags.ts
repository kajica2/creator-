import { HashtagCategory, HashtagSize, ReadySet } from '../types';
import { generateSetId } from '../utils/hashtagStorage';

export interface MediaHashtagTemplate {
  id: string;
  title: string;
  description: string;
  primary: string[];
  secondary: string[];
  niche: string[];
}

export const hashtagCategories: HashtagCategory[] = [
  {
    category: 'Core Artform',
    hashtags: [
      { name: '#DigitalArt', count: '100M+', size: HashtagSize.Mega, tags: ['style'], popularityScore: 95, relatedHashtags: ['#Art', '#Design', '#Creative'] },
      { name: '#GenerativeArt', count: '1.5M+', size: HashtagSize.Large, tags: ['style', 'tool'], popularityScore: 85, relatedHashtags: ['#CreativeCoding', '#AlgorithmicArt', '#Procedural'] },
      { name: '#CreativeCoding', count: '1.2M+', size: HashtagSize.Large, tags: ['tool', 'style'], popularityScore: 80, relatedHashtags: ['#GenerativeArt', '#p5js', '#Processing'] },
      { name: '#Audiovisual', count: '500k+', size: HashtagSize.Medium, tags: ['style', 'audience'], popularityScore: 70, relatedHashtags: ['#VJing', '#AudioReactive', '#Visuals'] },
      { name: '#VJing', count: '300k+', size: HashtagSize.Medium, tags: ['tool', 'style'], popularityScore: 65, relatedHashtags: ['#Audiovisual', '#Resolume', '#LiveVisuals'] },
      { name: '#ProjectionMapping', count: '400k+', size: HashtagSize.Medium, tags: ['tool', 'style'], popularityScore: 68, relatedHashtags: ['#MadMapper', '#Immersive', '#Installation'] },
      { name: '#NewMediaArt', count: '800k+', size: HashtagSize.Large, tags: ['style'], popularityScore: 75, relatedHashtags: ['#DigitalArt', '#ContemporaryArt', '#Interactive'] },
      { name: '#InteractiveArt', count: '600k+', size: HashtagSize.Medium, tags: ['style', 'audience'], popularityScore: 72, relatedHashtags: ['#NewMediaArt', '#InteractiveInstallation', '#AudienceEngagement'] },
    ],
  },
  {
    category: 'Software & Tools',
    hashtags: [
      { name: '#TouchDesigner', count: '250k+', size: HashtagSize.Medium, tags: ['tool'], popularityScore: 78, relatedHashtags: ['#GenerativeArt', '#VisualProgramming', '#RealTime'] },
      { name: '#Processing', count: '400k+', size: HashtagSize.Medium, tags: ['tool'], popularityScore: 82, relatedHashtags: ['#CreativeCoding', '#Java', '#p5js'] },
      { name: '#p5js', count: '150k+', size: HashtagSize.Small, tags: ['tool'], popularityScore: 70, relatedHashtags: ['#CreativeCoding', '#JavaScript', '#Processing'] },
      { name: '#UnrealEngine', count: '2M+', size: HashtagSize.Large, tags: ['tool'], popularityScore: 88, relatedHashtags: ['#GameDev', '#RealTime', '#3D'] },
      { name: '#Blender3D', count: '5M+', size: HashtagSize.Large, tags: ['tool'], popularityScore: 92, relatedHashtags: ['#3DModeling', '#Animation', '#OpenSource'] },
      { name: '#Resolume', count: '100k+', size: HashtagSize.Small, tags: ['tool'], popularityScore: 60, relatedHashtags: ['#VJing', '#LiveVisuals', '#Audiovisual'] },
      { name: '#MadMapper', count: '50k+', size: HashtagSize.Micro, tags: ['tool'], popularityScore: 55, relatedHashtags: ['#ProjectionMapping', '#Mapping', '#Installation'] },
      { name: '#AfterEffects', count: '20M+', size: HashtagSize.Mega, tags: ['tool'], popularityScore: 96, relatedHashtags: ['#MotionGraphics', '#Animation', '#VFX'] },
    ],
  },
  {
    category: 'Aesthetic & Style',
    hashtags: [
      { name: '#GlitchArt', count: '2M+', size: HashtagSize.Large, tags: ['style'], popularityScore: 85, relatedHashtags: ['#DigitalArt', '#ErrorArt', '#Aesthetic'] },
      { name: '#Vaporwave', count: '3M+', size: HashtagSize.Large, tags: ['style'], popularityScore: 82, relatedHashtags: ['#Aesthetic', '#Retro', '#Synthwave'] },
      { name: '#Cyberpunk', count: '10M+', size: HashtagSize.Mega, tags: ['style'], popularityScore: 94, relatedHashtags: ['#SciFi', '#Futurism', '#Neon'] },
      { name: '#AbstractArt', count: '50M+', size: HashtagSize.Mega, tags: ['style'], popularityScore: 98, relatedHashtags: ['#Art', '#Contemporary', '#ModernArt'] },
      { name: '#Minimalism', count: '30M+', size: HashtagSize.Mega, tags: ['style'], popularityScore: 90, relatedHashtags: ['#Design', '#Simple', '#Clean'] },
      { name: '#Surrealism', count: '15M+', size: HashtagSize.Mega, tags: ['style'], popularityScore: 88, relatedHashtags: ['#Art', '#Dreamlike', '#Fantasy'] },
      { name: '#Futurism', count: '1M+', size: HashtagSize.Large, tags: ['style'], popularityScore: 75, relatedHashtags: ['#Cyberpunk', '#SciFi', '#Innovation'] },
      { name: '#SciFiArt', count: '1.8M+', size: HashtagSize.Large, tags: ['style'], popularityScore: 80, relatedHashtags: ['#Cyberpunk', '#Futurism', '#Space'] },
    ],
  },
  {
    category: 'Themes & Concepts',
    hashtags: [
        { name: '#Ethereal', count: '2M+', size: HashtagSize.Large, tags: ['style', 'theme'], popularityScore: 78, relatedHashtags: ['#Dreamy', '#Mystical', '#Atmospheric'] },
        { name: '#Cosmic', count: '3M+', size: HashtagSize.Large, tags: ['theme'], popularityScore: 82, relatedHashtags: ['#Space', '#Universe', '#Galaxy'] },
        { name: '#LiminalSpace', count: '400k+', size: HashtagSize.Medium, tags: ['theme'], popularityScore: 65, relatedHashtags: ['#Dreamcore', '#Transitional', '#Empty'] },
        { name: '#SacredGeometry', count: '1.2M+', size: HashtagSize.Large, tags: ['theme', 'style'], popularityScore: 72, relatedHashtags: ['#Patterns', '#Spiritual', '#Mathematics'] },
        { name: '#Mindfulness', count: '50M+', size: HashtagSize.Mega, tags: ['theme', 'audience'], popularityScore: 95, relatedHashtags: ['#Meditation', '#Wellness', '#Peace'] },
        { name: '#Nocturnal', count: '1M+', size: HashtagSize.Large, tags: ['theme'], popularityScore: 70, relatedHashtags: ['#Night', '#Dark', '#Mystery'] },
        { name: '#Dreamscape', count: '800k+', size: HashtagSize.Large, tags: ['theme', 'style'], popularityScore: 68, relatedHashtags: ['#Dream', '#Fantasy', '#Surreal'] },
    ]
  }
];

export const mediaLibraryTemplates: MediaHashtagTemplate[] = [
  {
    id: 'template-urban-shredder',
    title: 'The Urban Shredder',
    description: 'Captures the raw energy and grit of street skateboarding in city environments.',
    primary: ['#skateboarding', '#streetwear', '#urban', '#skatelife', '#thrasher', '#skate'],
    secondary: ['#streetskating', '#skateordie', '#skateeverydamnday', '#skateanddestroy', '#skateculture', '#berrics', '#skategram', '#metrogrammed'],
    niche: ['#skatespot', '#hellaclips', '#skateboardingisfun', '#iloveskateboarding', '#skatevideos', '#skateclips', '#thankyouskateboarding', '#skatetricks', '#ollie', '#kickflip', '#shredtillyouredead', '#boardcontrol', '#ledgefiend'],
  },
  {
    id: 'template-bowl-rider',
    title: 'The Bowl Rider',
    description: 'Celebrates fluid motion, airs, and lines in transition and park skating.',
    primary: ['#skatepark', '#bowlskating', '#skateboarding', '#skatelife', '#skater', '#actionsports'],
    secondary: ['#transitionskating', '#vertbiking', '#skatebowl', '#poolskating', '#skateeverydamnday', '#thankyouskateboarding', '#skateanddestroy', '#skateordie'],
    niche: ['#concretesurfing', '#bowlsesh', '#skateforfun', '#vertigo', '#airtime', '#copinggrind', '#carvegrind', '#frontsideair', '#backsidedisaster', '#indygrab', '#methodair', '#emptybowls', '#diyskate'],
  },
  {
    id: 'template-longboard-cruiser',
    title: 'The Longboard Cruiser',
    description: 'Leans into the laid-back, scenic cruising lifestyle of longboarding.',
    primary: ['#longboarding', '#cruising', '#longboard', '#skate', '#lifestyle', '#travel'],
    secondary: ['#longboarddancing', '#longboardlife', '#downhillskateboarding', '#landyachtz', '#sector9', '#loadedboards', '#skateandexplore', '#boardlife', '#cruiserboard'],
    niche: ['#longboardfreestyle', '#boardwalking', '#slidegloves', '#longdistanceskateboarding', '#longboardcommute', '#dancingonwheels', '#skatetravel', '#roadtriplife', '#scenicskate', '#getoutsideandskate', '#hillbomb', '#coleman-slide', '#pintail'],
  },
];

export const synapticSymphonyHashtags = [
  { name: '#SynapticSymphony', count: '∞', size: HashtagSize.Mega, description: 'Neural-inspired music generation', tags: ['neural', 'music', 'AI'], popularityScore: 100, relatedHashtags: ['#NeuralBeats', '#AIComposer'] },
  { name: '#NeuralBeats', count: '5M+', size: HashtagSize.Large, description: 'AI-generated rhythms', tags: ['beats', 'AI'], popularityScore: 90 },
  { name: '#AIComposer', count: '3M+', size: HashtagSize.Large, description: 'Artificial intelligence composition', tags: ['composer', 'AI'], popularityScore: 85 },
  { name: '#BrainwaveMusic', count: '2M+', size: HashtagSize.Medium, description: 'Music from brainwaves', tags: ['brain', 'music'], popularityScore: 80 },
  { name: '#QuantumHarmony', count: '1M+', size: HashtagSize.Medium, description: 'Quantum-inspired harmonies', tags: ['quantum', 'harmony'], popularityScore: 75 },
  { name: '#CognitiveRhythm', count: '800K+', size: HashtagSize.Medium, description: 'Cognitive rhythm patterns', tags: ['cognitive', 'rhythm'], popularityScore: 70 },
  { name: '#MindMelody', count: '600K+', size: HashtagSize.Small, description: 'Melodies from the mind', tags: ['mind', 'melody'], popularityScore: 65 },
  { name: '#SynapseSound', count: '400K+', size: HashtagSize.Small, description: 'Sounds of synapses', tags: ['synapse', 'sound'], popularityScore: 60 },
  { name: '#NeuronNotes', count: '200K+', size: HashtagSize.Small, description: 'Musical neurons', tags: ['neuron', 'notes'], popularityScore: 55 },
  { name: '#ConsciousnessCode', count: '100K+', size: HashtagSize.Micro, description: 'Coded consciousness', tags: ['consciousness', 'code'], popularityScore: 50 },
];

// Add Synaptic Symphony category to hashtagCategories
hashtagCategories.push({
  category: 'Synaptic Symphony',
  hashtags: synapticSymphonyHashtags,
});

export const readySets: ReadySet[] = [
    {
        id: 'set_synaptic_symphony',
        title: '🧠 Synaptic Symphony Project',
        hashtags: ['#SynapticSymphony', '#NeuralBeats', '#AIComposer', '#BrainwaveMusic', '#QuantumHarmony', '#CognitiveRhythm', '#MindMelody'],
        category: 'Synaptic Symphony',
        description: 'Neural-inspired music and media generation with floating hashtag visualization',
        size: HashtagSize.Mega,
        isFavorite: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
    },
    {
        id: 'set_cyberpunk_vj',
        title: 'Cyberpunk VJ Loop Set',
        hashtags: ['#Cyberpunk', '#VJing', '#Resolume', '#NeonNoir', '#GlitchArt', '#Futurism', '#MotionGraphics'],
        category: 'Core Artform',
        size: HashtagSize.Medium,
        isFavorite: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
    },
    {
        id: 'set_ambient_generative',
        title: 'Ambient Generative Art',
        hashtags: ['#GenerativeArt', '#CreativeCoding', '#TouchDesigner', '#AmbientMusic', '#Mindfulness', '#AbstractArt', '#Ethereal'],
        category: 'Core Artform',
        size: HashtagSize.Medium,
        isFavorite: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
    },
    {
        id: 'set_interactive_installation',
        title: 'Interactive Installation Promo',
        hashtags: ['#InteractiveArt', '#NewMediaArt', '#ProjectionMapping', '#MadMapper', '#ArtInstallation', '#ExperienceDesign', '#ImmersiveArt'],
        category: 'Core Artform',
        size: HashtagSize.Medium,
        isFavorite: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
    }
    },
    {
        id: generateSetId('template_urban_shredder'),
        title: 'The Urban Shredder',
        hashtags: [
            ...mediaLibraryTemplates[0].primary,
            ...mediaLibraryTemplates[0].secondary,
            ...mediaLibraryTemplates[0].niche.slice(0, 6)
        ],
        category: 'Skate Templates',
        description: mediaLibraryTemplates[0].description,
        size: HashtagSize.Large,
        isFavorite: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
    },
    {
        id: generateSetId('template_bowl_rider'),
        title: 'The Bowl Rider',
        hashtags: [
            ...mediaLibraryTemplates[1].primary,
            ...mediaLibraryTemplates[1].secondary,
            ...mediaLibraryTemplates[1].niche.slice(0, 6)
        ],
        category: 'Skate Templates',
        description: mediaLibraryTemplates[1].description,
        size: HashtagSize.Medium,
        isFavorite: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
    },
    {
        id: generateSetId('template_longboard_cruiser'),
        title: 'The Longboard Cruiser',
        hashtags: [
            ...mediaLibraryTemplates[2].primary,
            ...mediaLibraryTemplates[2].secondary,
            ...mediaLibraryTemplates[2].niche.slice(0, 6)
        ],
        category: 'Skate Templates',
        description: mediaLibraryTemplates[2].description,
        size: HashtagSize.Medium,
        isFavorite: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
    }
];
