/**
 * Astrology Agent - Generates astrological data and converts it to sound parameters
 */

import { AgentHandler, AgentMessage } from '../core/AgentOrchestrator';

export interface AstrologyData {
  birthDate: Date;
  birthTime: string;
  birthPlace: {
    latitude: number;
    longitude: number;
    timezone: string;
  };
  planets?: PlanetaryPosition[];
  houses?: House[];
  aspects?: Aspect[];
}

export interface PlanetaryPosition {
  planet: string;
  sign: string;
  degree: number;
  house: number;
  retrograde: boolean;
}

export interface House {
  number: number;
  sign: string;
  degree: number;
  planets: string[];
}

export interface Aspect {
  planet1: string;
  planet2: string;
  type: string;
  degree: number;
  orb: number;
}

export interface CosmicSoundMapping {
  planetaryFrequencies: Record<string, number>;
  zodiacWaveforms: Record<string, string>;
  aspectHarmonics: number[];
  houseRhythms: number[];
  elementalTones: Record<string, string>;
}

export class AstrologyAgent implements AgentHandler {
  private cosmicMappings: CosmicSoundMapping = {
    planetaryFrequencies: {
      sun: 126.22,      // B
      moon: 210.42,     // G#
      mercury: 141.27,  // C#
      venus: 221.23,    // A
      mars: 144.72,     // D
      jupiter: 183.58,  // F#
      saturn: 147.85,   // D
      uranus: 207.36,   // G#
      neptune: 211.44,  // G#
      pluto: 140.25,    // C#
    },
    zodiacWaveforms: {
      aries: 'sawtooth',
      taurus: 'sine',
      gemini: 'triangle',
      cancer: 'sine',
      leo: 'square',
      virgo: 'triangle',
      libra: 'sine',
      scorpio: 'sawtooth',
      sagittarius: 'square',
      capricorn: 'triangle',
      aquarius: 'square',
      pisces: 'sine',
    },
    aspectHarmonics: [1, 2, 3, 5, 8, 13], // Fibonacci sequence
    houseRhythms: [4, 3, 6, 4, 5, 6, 4, 8, 9, 10, 11, 12],
    elementalTones: {
      fire: 'major',
      earth: 'minor',
      air: 'lydian',
      water: 'dorian',
    },
  };

  async handle(message: AgentMessage): Promise<any> {
    switch (message.type) {
      case 'request':
        return this.generateAstrologyData(message.payload);
      case 'pipeline':
        return this.processForPipeline(message.payload);
      case 'stream':
        return this.streamAstrologyData(message.payload);
      default:
        throw new Error(`Unsupported message type: ${message.type}`);
    }
  }

  private async generateAstrologyData(input: AstrologyData): Promise<any> {
    const chart = await this.calculateBirthChart(input);
    const soundParams = this.mapChartToSound(chart);
    const colorVibrations = this.mapChartToColors(chart);
    const numerology = this.calculateNumerology(input.birthDate);

    return {
      chart,
      soundParams,
      colorVibrations,
      numerology,
      interpretation: await this.generateInterpretation(chart),
      cosmicFrequency: this.calculateCosmicFrequency(chart),
    };
  }

  private async processForPipeline(data: any): Promise<any> {
    const chart = await this.calculateBirthChart(data);
    return {
      planetaryFrequencies: this.getPlanetaryFrequencies(chart),
      zodiacWaveform: this.getZodiacWaveform(chart),
      ascendantTempo: this.calculateAscendantTempo(chart),
      sunSignKey: this.getSunSignKey(chart),
      moonSignScale: this.getMoonSignScale(chart),
      aspectHarmonics: this.getAspectHarmonics(chart),
      elementalBalance: this.calculateElementalBalance(chart),
      cosmicRhythm: this.generateCosmicRhythm(chart),
    };
  }

  private async streamAstrologyData(input: any): Promise<AsyncGenerator<any>> {
    async function* generator() {
      yield { status: 'calculating', progress: 0 };
      const chart = await this.calculateBirthChart(input);
      yield { status: 'mapping', progress: 33, chart };
      const soundParams = this.mapChartToSound(chart);
      yield { status: 'harmonizing', progress: 66, soundParams };
      const final = await this.generateInterpretation(chart);
      yield { status: 'complete', progress: 100, final };
    }
    return generator.call(this);
  }

  private async calculateBirthChart(input: AstrologyData): Promise<any> {
    // Simplified chart calculation
    const { birthDate, birthTime, birthPlace } = input;

    // Calculate planetary positions (simplified)
    const planets = this.calculatePlanetaryPositions(birthDate, birthTime);
    const houses = this.calculateHouses(birthPlace, birthTime);
    const aspects = this.calculateAspects(planets);

    return {
      ...input,
      planets,
      houses,
      aspects,
      elements: this.categorizeElements(planets),
      modalities: this.categorizeModalities(planets),
    };
  }

  private calculatePlanetaryPositions(birthDate: Date, birthTime: string): PlanetaryPosition[] {
    // Simplified planetary calculation
    const basePositions = [
      { planet: 'sun', sign: 'aries', degree: 15, house: 1, retrograde: false },
      { planet: 'moon', sign: 'cancer', degree: 22, house: 4, retrograde: false },
      { planet: 'mercury', sign: 'gemini', degree: 8, house: 3, retrograde: true },
      { planet: 'venus', sign: 'taurus', degree: 18, house: 2, retrograde: false },
      { planet: 'mars', sign: 'scorpio', degree: 12, house: 8, retrograde: false },
    ];

    // Add time-based variations
    const hours = parseInt(birthTime.split(':')[0]);
    return basePositions.map(pos => ({
      ...pos,
      degree: (pos.degree + hours * 15) % 30,
    }));
  }

  private calculateHouses(birthPlace: any, birthTime: string): House[] {
    const houses: House[] = [];
    const signs = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
                   'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];

    for (let i = 0; i < 12; i++) {
      houses.push({
        number: i + 1,
        sign: signs[i],
        degree: i * 30,
        planets: [],
      });
    }
    return houses;
  }

  private calculateAspects(planets: PlanetaryPosition[]): Aspect[] {
    const aspects: Aspect[] = [];
    const aspectTypes = [
      { name: 'conjunction', degree: 0, orb: 8 },
      { name: 'sextile', degree: 60, orb: 6 },
      { name: 'square', degree: 90, orb: 8 },
      { name: 'trine', degree: 120, orb: 8 },
      { name: 'opposition', degree: 180, orb: 8 },
    ];

    for (let i = 0; i < planets.length; i++) {
      for (let j = i + 1; j < planets.length; j++) {
        const diff = Math.abs(planets[i].degree - planets[j].degree);
        for (const aspectType of aspectTypes) {
          if (Math.abs(diff - aspectType.degree) <= aspectType.orb) {
            aspects.push({
              planet1: planets[i].planet,
              planet2: planets[j].planet,
              type: aspectType.name,
              degree: diff,
              orb: Math.abs(diff - aspectType.degree),
            });
          }
        }
      }
    }
    return aspects;
  }

  private mapChartToSound(chart: any): any {
    const dominantPlanets = this.findDominantPlanets(chart.planets);
    const frequencies = dominantPlanets.map(p =>
      this.cosmicMappings.planetaryFrequencies[p.planet]
    );

    return {
      baseFrequency: frequencies[0] || 432,
      harmonics: this.cosmicMappings.aspectHarmonics,
      waveform: this.cosmicMappings.zodiacWaveforms[chart.planets[0]?.sign || 'aries'],
      rhythm: this.cosmicMappings.houseRhythms,
      scale: this.determineMusicalScale(chart),
      tempo: this.calculateTempo(chart),
      dynamics: this.calculateDynamics(chart),
    };
  }

  private mapChartToColors(chart: any): any {
    const elementColors: Record<string, string[]> = {
      fire: ['red', 'orange', 'yellow'],
      earth: ['brown', 'green', 'beige'],
      air: ['light blue', 'white', 'silver'],
      water: ['blue', 'turquoise', 'purple'],
    };

    const elements = this.categorizeElements(chart.planets);
    const dominantElement = Object.entries(elements)
      .sort(([, a], [, b]) => b - a)[0][0];

    return {
      primary: elementColors[dominantElement][0],
      secondary: elementColors[dominantElement][1],
      accent: elementColors[dominantElement][2],
      aura: this.calculateAuraColors(chart),
    };
  }

  private calculateNumerology(birthDate: Date): any {
    const dateStr = birthDate.toISOString().split('T')[0].replace(/-/g, '');
    const lifePathNumber = this.reduceToSingleDigit(dateStr);

    return {
      lifePathNumber,
      frequency: 111 * lifePathNumber,
      vibration: lifePathNumber,
      masterNumbers: [11, 22, 33].includes(lifePathNumber),
    };
  }

  private reduceToSingleDigit(str: string): number {
    let sum = str.split('').reduce((acc, digit) => acc + parseInt(digit), 0);
    while (sum > 9 && ![11, 22, 33].includes(sum)) {
      sum = sum.toString().split('').reduce((acc, digit) => acc + parseInt(digit), 0);
    }
    return sum;
  }

  private async generateInterpretation(chart: any): Promise<string> {
    const sunSign = chart.planets.find((p: any) => p.planet === 'sun')?.sign;
    const moonSign = chart.planets.find((p: any) => p.planet === 'moon')?.sign;

    return `Your sun in ${sunSign} creates a ${this.cosmicMappings.zodiacWaveforms[sunSign]} waveform,
            while your moon in ${moonSign} adds ${this.cosmicMappings.zodiacWaveforms[moonSign]} harmonics.
            This unique cosmic signature resonates at ${this.calculateCosmicFrequency(chart)}Hz.`;
  }

  private calculateCosmicFrequency(chart: any): number {
    const planetFreqs = chart.planets.map((p: any) =>
      this.cosmicMappings.planetaryFrequencies[p.planet] || 432
    );
    return planetFreqs.reduce((a, b) => a + b, 0) / planetFreqs.length;
  }

  private getPlanetaryFrequencies(chart: any): number[] {
    return chart.planets.map((p: any) =>
      this.cosmicMappings.planetaryFrequencies[p.planet] || 432
    );
  }

  private getZodiacWaveform(chart: any): string {
    const ascendant = chart.houses[0]?.sign || 'aries';
    return this.cosmicMappings.zodiacWaveforms[ascendant];
  }

  private calculateAscendantTempo(chart: any): number {
    const ascendant = chart.houses[0];
    const fireSignsfast = ['aries', 'leo', 'sagittarius'];
    const earthSignsSlow = ['taurus', 'virgo', 'capricorn'];

    if (fireSignsfast.includes(ascendant?.sign)) return 140;
    if (earthSignsSlow.includes(ascendant?.sign)) return 80;
    return 110; // Air and Water signs
  }

  private getSunSignKey(chart: any): string {
    const keys: Record<string, string> = {
      aries: 'C', taurus: 'F', gemini: 'G',
      cancer: 'D', leo: 'E', virgo: 'A',
      libra: 'F#', scorpio: 'C#', sagittarius: 'B',
      capricorn: 'G', aquarius: 'A', pisces: 'Eb',
    };
    const sunSign = chart.planets.find((p: any) => p.planet === 'sun')?.sign;
    return keys[sunSign] || 'C';
  }

  private getMoonSignScale(chart: any): string {
    const moonSign = chart.planets.find((p: any) => p.planet === 'moon')?.sign;
    const element = this.getElement(moonSign);
    return this.cosmicMappings.elementalTones[element] || 'major';
  }

  private getAspectHarmonics(chart: any): number[] {
    const harmonics = new Set(this.cosmicMappings.aspectHarmonics);
    chart.aspects.forEach((aspect: Aspect) => {
      if (aspect.type === 'trine') harmonics.add(3);
      if (aspect.type === 'square') harmonics.add(4);
      if (aspect.type === 'sextile') harmonics.add(6);
    });
    return Array.from(harmonics).sort((a, b) => a - b);
  }

  private calculateElementalBalance(chart: any): Record<string, number> {
    return this.categorizeElements(chart.planets);
  }

  private generateCosmicRhythm(chart: any): number[] {
    const houses = chart.houses || [];
    return houses.slice(0, 4).map((h: House) => h.number * 2);
  }

  private findDominantPlanets(planets: PlanetaryPosition[]): PlanetaryPosition[] {
    // Personal planets have more weight
    const weights: Record<string, number> = {
      sun: 3, moon: 3, mercury: 2, venus: 2, mars: 2,
      jupiter: 1, saturn: 1, uranus: 1, neptune: 1, pluto: 1,
    };

    return planets
      .sort((a, b) => (weights[b.planet] || 0) - (weights[a.planet] || 0))
      .slice(0, 3);
  }

  private determineMusicalScale(chart: any): string {
    const elements = this.categorizeElements(chart.planets);
    const dominant = Object.entries(elements)
      .sort(([, a], [, b]) => b - a)[0][0];
    return this.cosmicMappings.elementalTones[dominant] || 'major';
  }

  private calculateTempo(chart: any): number {
    const marsPosition = chart.planets.find((p: any) => p.planet === 'mars');
    const fireCount = this.categorizeElements(chart.planets).fire || 0;
    return 60 + (marsPosition?.degree || 0) + (fireCount * 10);
  }

  private calculateDynamics(chart: any): string {
    const aspects = chart.aspects || [];
    const hardAspects = aspects.filter((a: Aspect) =>
      ['square', 'opposition'].includes(a.type)
    ).length;

    if (hardAspects > 3) return 'forte';
    if (hardAspects > 1) return 'mezzo';
    return 'piano';
  }

  private categorizeElements(planets: PlanetaryPosition[]): Record<string, number> {
    const elements: Record<string, number> = { fire: 0, earth: 0, air: 0, water: 0 };

    planets.forEach(planet => {
      const element = this.getElement(planet.sign);
      elements[element]++;
    });

    return elements;
  }

  private categorizeModalities(planets: PlanetaryPosition[]): Record<string, number> {
    const modalities: Record<string, number> = { cardinal: 0, fixed: 0, mutable: 0 };
    const modalityMap: Record<string, string> = {
      aries: 'cardinal', cancer: 'cardinal', libra: 'cardinal', capricorn: 'cardinal',
      taurus: 'fixed', leo: 'fixed', scorpio: 'fixed', aquarius: 'fixed',
      gemini: 'mutable', virgo: 'mutable', sagittarius: 'mutable', pisces: 'mutable',
    };

    planets.forEach(planet => {
      const modality = modalityMap[planet.sign];
      if (modality) modalities[modality]++;
    });

    return modalities;
  }

  private getElement(sign: string): string {
    const elementMap: Record<string, string> = {
      aries: 'fire', leo: 'fire', sagittarius: 'fire',
      taurus: 'earth', virgo: 'earth', capricorn: 'earth',
      gemini: 'air', libra: 'air', aquarius: 'air',
      cancer: 'water', scorpio: 'water', pisces: 'water',
    };
    return elementMap[sign] || 'earth';
  }

  private calculateAuraColors(chart: any): string[] {
    const planets = chart.planets || [];
    const colors: string[] = [];

    planets.slice(0, 3).forEach((planet: PlanetaryPosition) => {
      const element = this.getElement(planet.sign);
      if (element === 'fire') colors.push('gold');
      if (element === 'earth') colors.push('emerald');
      if (element === 'air') colors.push('silver');
      if (element === 'water') colors.push('sapphire');
    });

    return colors;
  }

  getCapabilities(): string[] {
    return [
      'birth-chart-calculation',
      'planetary-frequency-mapping',
      'cosmic-sound-generation',
      'astrological-interpretation',
      'numerology-calculation',
      'element-analysis',
      'aspect-harmonics',
    ];
  }

  getStatus(): 'ready' | 'busy' | 'error' {
    return 'ready';
  }
}

export default AstrologyAgent;