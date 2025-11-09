import { SphereData } from './types';
import { PLANETARY_INFO_MAP } from './planetaryData';

const SPHERES_BASE_DATA = [
  {
    id: 1,
    name: "The Moon",
    description: "Inconstancy & Vows",
    details: "The Sphere of the Moon represents the first stage: recognizing our inconsistencies. It's about understanding broken vows to ourselves and others, and finding the strength to commit to our path of growth with renewed resolve.",
    color: "bg-slate-300",
    shadowColor: "shadow-slate-300/50",
  },
  {
    id: 2,
    name: "Mercury",
    description: "Ambition & Service",
    details: "Mercury is the sphere for those who sought greatness, but for personal glory. This stage is about transmuting ambition. It's a journey from self-serving goals to actions driven by a desire for the greater good and service to others.",
    color: "bg-amber-400",
    shadowColor: "shadow-amber-400/50",
  },
  {
    id: 3,
    name: "Venus",
    description: "Earthly Love & Divine Love",
    details: "The Sphere of Venus addresses love that was misdirected or imperfect. Here, we learn to elevate earthly affections into a higher, more inclusive form of Divine Love, understanding its power to connect and heal.",
    color: "bg-rose-500",
    shadowColor: "shadow-rose-500/50",
  },
  {
    id: 4,
    name: "The Sun",
    description: "Wisdom & Illumination",
    details: "The Sun is the sphere of the wise. This stage is about seeking knowledge not as an end, but as a means to illumination. It's about integrating intellectual understanding with spiritual insight to light our way forward.",
    color: "bg-yellow-300",
    shadowColor: "shadow-yellow-300/50",
  },
  {
    id: 5,
    name: "Mars",
    description: "Courage & Fortitude",
    details: "The Sphere of Mars honors the warriors of faith. This is the stage of cultivating courage and fortitude. We face our inner demons and external challenges, developing the strength to stand for our deepest-held values.",
    color: "bg-red-600",
    shadowColor: "shadow-red-600/50",
  },
  {
    id: 6,
    name: "Jupiter",
    description: "Justice & Rulership",
    details: "Jupiter represents the just rulers. This phase of the journey is about cultivating fairness, integrity, and right action in our lives. It's about becoming a just ruler of our own inner kingdom.",
    color: "bg-indigo-500",
    shadowColor: "shadow-indigo-500/50",
  },
  {
    id: 7,
    name: "Saturn",
    description: "Contemplation & Temperance",
    details: "The Sphere of Saturn is for the contemplatives. Here, we embrace silence, introspection, and temperance. It's about detaching from worldly noise to hear the subtle wisdom that arises from within.",
    color: "bg-purple-400",
    shadowColor: "shadow-purple-400/50",
  },
  {
    id: 8,
    name: "The Fixed Stars",
    description: "Faith, Hope, & Love",
    details: "This sphere represents the triumph of the soul. It's an examination of the three theological virtues: Faith in our path, Hope for what's to come, and Love as the ultimate guiding force of the universe.",
    color: "bg-sky-400",
    shadowColor: "shadow-sky-400/50",
  },
  {
    id: 9,
    name: "The Primum Mobile",
    description: "Divine Unity",
    details: "The 'First Mover,' this is the final stage before the Empyrean. It represents the realization of unity with the Divine. It's about seeing the cosmic dance and our place within it, moved by a singular, universal love.",
    color: "bg-white",
    shadowColor: "shadow-white/50",
  },
];

// --- Frequency Calculation ---
const MIN_FREQ = 110; // A2
const MAX_FREQ = 880; // A5

const orbitalPeriods = Object.values(PLANETARY_INFO_MAP)
  .map(p => (p.orbitalPeriod || p.rotationPeriod).value)
  .filter(Boolean);
  
const minPeriod = Math.min(...orbitalPeriods);
const maxPeriod = Math.max(...orbitalPeriods);

const logMinPeriod = Math.log(minPeriod);
const logMaxPeriod = Math.log(maxPeriod);

function mapPeriodToFrequency(period: number): number {
  if (period <= 0) return MIN_FREQ;
  const logPeriod = Math.log(period);
  const scale = (logPeriod - logMinPeriod) / (logMaxPeriod - logMinPeriod);
  return MIN_FREQ * Math.pow(MAX_FREQ / MIN_FREQ, scale);
}

// --- Data Augmentation ---
export const SPHERES_DATA: SphereData[] = SPHERES_BASE_DATA.map((sphere) => {
  const planetaryInfo = PLANETARY_INFO_MAP[sphere.name];
  let frequency = 0;
  let planetaryData: { [key: string]: string } = {};

  if (planetaryInfo) {
    const period = (planetaryInfo.orbitalPeriod || planetaryInfo.rotationPeriod).value;
    frequency = mapPeriodToFrequency(period);
    
    Object.keys(planetaryInfo).forEach(key => {
      const info = planetaryInfo[key];
      planetaryData[info.label] = `${info.value.toExponential(2)} ${info.unit}`;
    });
  } else {
    // For celestial concepts without direct planetary data, we assign musical intervals
    // Base frequency on Saturn's, the last planet
    const saturnFreq = mapPeriodToFrequency(PLANETARY_INFO_MAP["Saturn"].orbitalPeriod.value);
    if (sphere.name === "The Fixed Stars") {
      frequency = saturnFreq * 1.5; // Perfect Fifth
    } else if (sphere.name === "The Primum Mobile") {
      frequency = saturnFreq * 2; // Octave
    }
  }

  return {
    ...sphere,
    frequency,
    planetaryData: Object.keys(planetaryData).length > 0 ? planetaryData : undefined,
  };
});


export const NASA_API_URL = 'https://api.nasa.gov/planetary/apod';
// Using the demo key provided by NASA for general use.
export const NASA_API_KEY = 'DEMO_KEY';
