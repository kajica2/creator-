// FIX: Defined all necessary types for the application. The original file contained constants and logic which is incorrect for a 'types.ts' file.
export interface SphereData {
  id: number;
  name: string;
  description: string;
  details: string;
  color: string;
  shadowColor: string;
  frequency: number;
  planetaryData?: { [key:string]: string };
}

export interface NasaApodData {
  title: string;
  explanation: string;
  url: string;
  hdurl?: string;
  copyright?: string;
  media_type: 'image' | 'video';
  date: string;
  service_version: string;
}

export type SoundMood = 'Cosmic Drone' | 'Celestial Harmony' | 'Starlight Serenade' | 'Silent Voyage';

export interface PlanetaryInfoDetail {
  label: string;
  value: number;
  unit: string;
}

export interface PlanetaryInfo {
  orbitalPeriod?: PlanetaryInfoDetail;
  rotationPeriod?: PlanetaryInfoDetail;
  diameter?: PlanetaryInfoDetail;
  mass?: PlanetaryInfoDetail;
  [key: string]: PlanetaryInfoDetail | undefined;
}
