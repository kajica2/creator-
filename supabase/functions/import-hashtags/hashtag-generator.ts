// Hashtag generator that creates 300+ hashtags across various categories

interface Hashtag {
  name: string
  count: string
  size: 'Mega' | 'Large' | 'Medium' | 'Small' | 'Micro'
  tags?: string[]
  popularityScore?: number
  relatedHashtags?: string[]
  description?: string
}

interface HashtagCategory {
  name: string
  description?: string
  hashtags: Hashtag[]
}

// Base hashtags from existing data
const baseHashtags: HashtagCategory[] = [
  {
    name: 'Core Artform',
    description: 'Fundamental art forms and creative disciplines',
    hashtags: [
      { name: '#DigitalArt', count: '100M+', size: 'Mega', tags: ['style'], popularityScore: 95, relatedHashtags: ['#Art', '#Design', '#Creative'] },
      { name: '#GenerativeArt', count: '1.5M+', size: 'Large', tags: ['style', 'tool'], popularityScore: 85, relatedHashtags: ['#CreativeCoding', '#AlgorithmicArt', '#Procedural'] },
      { name: '#CreativeCoding', count: '1.2M+', size: 'Large', tags: ['tool', 'style'], popularityScore: 80, relatedHashtags: ['#GenerativeArt', '#p5js', '#Processing'] },
      { name: '#Audiovisual', count: '500k+', size: 'Medium', tags: ['style', 'audience'], popularityScore: 70, relatedHashtags: ['#VJing', '#AudioReactive', '#Visuals'] },
      { name: '#VJing', count: '300k+', size: 'Medium', tags: ['tool', 'style'], popularityScore: 65, relatedHashtags: ['#Audiovisual', '#Resolume', '#LiveVisuals'] },
      { name: '#ProjectionMapping', count: '400k+', size: 'Medium', tags: ['tool', 'style'], popularityScore: 68, relatedHashtags: ['#MadMapper', '#Immersive', '#Installation'] },
      { name: '#NewMediaArt', count: '800k+', size: 'Large', tags: ['style'], popularityScore: 75, relatedHashtags: ['#DigitalArt', '#ContemporaryArt', '#Interactive'] },
      { name: '#InteractiveArt', count: '600k+', size: 'Medium', tags: ['style', 'audience'], popularityScore: 72, relatedHashtags: ['#NewMediaArt', '#InteractiveInstallation', '#AudienceEngagement'] },
    ],
  },
  {
    name: 'Software & Tools',
    description: 'Creative software and development tools',
    hashtags: [
      { name: '#TouchDesigner', count: '250k+', size: 'Medium', tags: ['tool'], popularityScore: 78, relatedHashtags: ['#GenerativeArt', '#VisualProgramming', '#RealTime'] },
      { name: '#Processing', count: '400k+', size: 'Medium', tags: ['tool'], popularityScore: 82, relatedHashtags: ['#CreativeCoding', '#Java', '#p5js'] },
      { name: '#p5js', count: '150k+', size: 'Small', tags: ['tool'], popularityScore: 70, relatedHashtags: ['#CreativeCoding', '#JavaScript', '#Processing'] },
      { name: '#UnrealEngine', count: '2M+', size: 'Large', tags: ['tool'], popularityScore: 88, relatedHashtags: ['#GameDev', '#RealTime', '#3D'] },
      { name: '#Blender3D', count: '5M+', size: 'Large', tags: ['tool'], popularityScore: 92, relatedHashtags: ['#3DModeling', '#Animation', '#OpenSource'] },
      { name: '#Resolume', count: '100k+', size: 'Small', tags: ['tool'], popularityScore: 60, relatedHashtags: ['#VJing', '#LiveVisuals', '#Audiovisual'] },
      { name: '#MadMapper', count: '50k+', size: 'Micro', tags: ['tool'], popularityScore: 55, relatedHashtags: ['#ProjectionMapping', '#Mapping', '#Installation'] },
      { name: '#AfterEffects', count: '20M+', size: 'Mega', tags: ['tool'], popularityScore: 96, relatedHashtags: ['#MotionGraphics', '#Animation', '#VFX'] },
    ],
  },
  {
    name: 'Aesthetic & Style',
    description: 'Visual styles and aesthetic movements',
    hashtags: [
      { name: '#GlitchArt', count: '2M+', size: 'Large', tags: ['style'], popularityScore: 85, relatedHashtags: ['#DigitalArt', '#ErrorArt', '#Aesthetic'] },
      { name: '#Vaporwave', count: '3M+', size: 'Large', tags: ['style'], popularityScore: 82, relatedHashtags: ['#Aesthetic', '#Retro', '#Synthwave'] },
      { name: '#Cyberpunk', count: '10M+', size: 'Mega', tags: ['style'], popularityScore: 94, relatedHashtags: ['#SciFi', '#Futurism', '#Neon'] },
      { name: '#AbstractArt', count: '50M+', size: 'Mega', tags: ['style'], popularityScore: 98, relatedHashtags: ['#Art', '#Contemporary', '#ModernArt'] },
      { name: '#Minimalism', count: '30M+', size: 'Mega', tags: ['style'], popularityScore: 90, relatedHashtags: ['#Design', '#Simple', '#Clean'] },
      { name: '#Surrealism', count: '15M+', size: 'Mega', tags: ['style'], popularityScore: 88, relatedHashtags: ['#Art', '#Dreamlike', '#Fantasy'] },
      { name: '#Futurism', count: '1M+', size: 'Large', tags: ['style'], popularityScore: 75, relatedHashtags: ['#Cyberpunk', '#SciFi', '#Innovation'] },
      { name: '#SciFiArt', count: '1.8M+', size: 'Large', tags: ['style'], popularityScore: 80, relatedHashtags: ['#Cyberpunk', '#Futurism', '#Space'] },
      { name: '#CrudeArt', count: '500k+', size: 'Medium', tags: ['style'], popularityScore: 65, relatedHashtags: ['#RawArt', '#BrutalAesthetic', '#Gritty'] },
      { name: '#RawArt', count: '800k+', size: 'Medium', tags: ['style'], popularityScore: 70, relatedHashtags: ['#CrudeArt', '#Unfiltered', '#Gritty'] },
      { name: '#BrutalAesthetic', count: '1.2M+', size: 'Large', tags: ['style'], popularityScore: 75, relatedHashtags: ['#Brutalism', '#Minimalism', '#Raw'] },
      { name: '#GrittyArt', count: '600k+', size: 'Medium', tags: ['style'], popularityScore: 68, relatedHashtags: ['#RawArt', '#UrbanArt', '#Crude'] },
    ],
  },
]

// Additional hashtag templates to reach 300
const additionalHashtagTemplates = [
  // Technology & Innovation
  { base: 'AI', variants: ['Art', 'Design', 'Creative', 'Generated', 'Powered'], category: 'Technology' },
  { base: 'VR', variants: ['Art', 'Experience', 'Installation', 'Design'], category: 'Technology' },
  { base: 'AR', variants: ['Art', 'Experience', 'Interactive', 'Design'], category: 'Technology' },
  { base: 'NFT', variants: ['Art', 'Collection', 'Digital', 'Crypto'], category: 'Technology' },
  { base: 'Blockchain', variants: ['Art', 'Creative', 'Digital'], category: 'Technology' },
  
  // Visual Styles
  { base: 'Neon', variants: ['Aesthetic', 'Dreams', 'Nights', 'Vibes', 'Art'], category: 'Aesthetic & Style' },
  { base: 'Synthwave', variants: ['Aesthetic', 'Retro', '80s', 'Vibes'], category: 'Aesthetic & Style' },
  { base: 'Dark', variants: ['Art', 'Aesthetic', 'Mode', 'Vibes'], category: 'Aesthetic & Style' },
  { base: 'Retro', variants: ['Futurism', 'Aesthetic', 'Design', 'Art'], category: 'Aesthetic & Style' },
  { base: 'Crude', variants: ['Art', 'Aesthetic', 'Raw', 'Rough', 'Brutal'], category: 'Aesthetic & Style' },
  { base: 'Raw', variants: ['Art', 'Aesthetic', 'Unfiltered', 'Gritty', 'Edgy'], category: 'Aesthetic & Style' },
  { base: 'Brutal', variants: ['Aesthetic', 'Design', 'Art', 'Minimalism'], category: 'Aesthetic & Style' },
  { base: 'Rough', variants: ['Art', 'Aesthetic', 'Textured', 'Gritty'], category: 'Aesthetic & Style' },
  { base: 'Gritty', variants: ['Aesthetic', 'Art', 'Urban', 'Raw'], category: 'Aesthetic & Style' },
  
  // Creative Processes
  { base: 'Procedural', variants: ['Art', 'Design', 'Generation', 'Animation'], category: 'Core Artform' },
  { base: 'Algorithmic', variants: ['Art', 'Design', 'Composition', 'Pattern'], category: 'Core Artform' },
  { base: 'Parametric', variants: ['Design', 'Art', 'Architecture', 'Modeling'], category: 'Core Artform' },
  
  // Tools & Platforms
  { base: 'MaxMSP', variants: [], category: 'Software & Tools' },
  { base: 'PureData', variants: [], category: 'Software & Tools' },
  { base: 'OpenFrameworks', variants: [], category: 'Software & Tools' },
  { base: 'Cinder', variants: [], category: 'Software & Tools' },
  { base: 'Unity', variants: ['3D', 'VR', 'AR', 'GameDev'], category: 'Software & Tools' },
  { base: 'Cinema4D', variants: [], category: 'Software & Tools' },
  { base: 'Houdini', variants: [], category: 'Software & Tools' },
  { base: 'Notch', variants: [], category: 'Software & Tools' },
  { base: 'vvvv', variants: [], category: 'Software & Tools' },
  
  // Art Movements
  { base: 'Dadaism', variants: ['Digital', 'Modern'], category: 'Aesthetic & Style' },
  { base: 'Constructivism', variants: ['Digital', 'Modern'], category: 'Aesthetic & Style' },
  { base: 'Bauhaus', variants: ['Digital', 'Modern', 'Design'], category: 'Aesthetic & Style' },
  
  // Themes
  { base: 'Ethereal', variants: ['Dreams', 'Vibes', 'Aesthetic'], category: 'Themes & Concepts' },
  { base: 'Cosmic', variants: ['Art', 'Vibes', 'Aesthetic'], category: 'Themes & Concepts' },
  { base: 'Liminal', variants: ['Space', 'Aesthetic', 'Vibes'], category: 'Themes & Concepts' },
  { base: 'Sacred', variants: ['Geometry', 'Art', 'Design'], category: 'Themes & Concepts' },
  { base: 'Mindfulness', variants: ['Art', 'Design', 'Practice'], category: 'Themes & Concepts' },
  { base: 'Nocturnal', variants: ['Aesthetic', 'Vibes', 'Art'], category: 'Themes & Concepts' },
  { base: 'Dreamscape', variants: ['Art', 'Aesthetic', 'Vibes'], category: 'Themes & Concepts' },
]

function generateCount(size: string): string {
  const ranges: Record<string, [number, number]> = {
    Mega: [10, 100],
    Large: [1, 10],
    Medium: [500, 5000],
    Small: [100, 500],
    Micro: [10, 100],
  }
  
  const [min, max] = ranges[size] || [100, 1000]
  const value = Math.floor(Math.random() * (max - min) + min)
  
  if (size === 'Mega') {
    return `${value}M+`
  } else if (size === 'Large') {
    return `${value}M+`
  } else if (size === 'Medium') {
    return `${value}k+`
  } else {
    return `${value}k+`
  }
}

function generateSize(): 'Mega' | 'Large' | 'Medium' | 'Small' | 'Micro' {
  const rand = Math.random()
  if (rand < 0.05) return 'Mega'
  if (rand < 0.15) return 'Large'
  if (rand < 0.5) return 'Medium'
  if (rand < 0.85) return 'Small'
  return 'Micro'
}

function generatePopularityScore(size: string): number {
  const baseScores: Record<string, [number, number]> = {
    Mega: [90, 100],
    Large: [75, 90],
    Medium: [60, 75],
    Small: [45, 60],
    Micro: [30, 45],
  }
  
  const [min, max] = baseScores[size] || [50, 70]
  return Math.floor(Math.random() * (max - min) + min)
}

export function generateHashtags(targetCount: number): { categories: HashtagCategory[] } {
  const categories: Record<string, HashtagCategory> = {}
  
  // Add base categories
  for (const category of baseHashtags) {
    categories[category.name] = { ...category, hashtags: [...category.hashtags] }
  }
  
  let totalHashtags = baseHashtags.reduce((sum, cat) => sum + cat.hashtags.length, 0)
  
  // Generate additional hashtags
  while (totalHashtags < targetCount) {
    const template = additionalHashtagTemplates[Math.floor(Math.random() * additionalHashtagTemplates.length)]
    const categoryName = template.category
    
    if (!categories[categoryName]) {
      categories[categoryName] = {
        name: categoryName,
        description: `Generated category for ${categoryName.toLowerCase()}`,
        hashtags: [],
      }
    }
    
    // Generate hashtag name
    let hashtagName: string
    if (template.variants.length > 0) {
      const variant = template.variants[Math.floor(Math.random() * template.variants.length)]
      hashtagName = `#${template.base}${variant}`
    } else {
      hashtagName = `#${template.base}`
    }
    
    // Check if already exists
    const exists = categories[categoryName].hashtags.some(h => h.name === hashtagName)
    if (exists) continue
    
    const size = generateSize()
    const hashtag: Hashtag = {
      name: hashtagName,
      count: generateCount(size),
      size,
      tags: ['style'],
      popularityScore: generatePopularityScore(size),
      relatedHashtags: [],
    }
    
    categories[categoryName].hashtags.push(hashtag)
    totalHashtags++
    
    if (totalHashtags >= targetCount) break
  }
  
  return {
    categories: Object.values(categories),
  }
}

