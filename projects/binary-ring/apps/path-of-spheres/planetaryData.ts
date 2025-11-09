import { PlanetaryInfo } from './types';

// Data sourced from NASA's Space Science Data Coordinated Archive
export const PLANETARY_INFO_MAP: { [key: string]: PlanetaryInfo } = {
  "The Moon": {
    orbitalPeriod: { label: "Orbital Period", value: 27.3, unit: "days" },
    diameter: { label: "Diameter", value: 3474, unit: "km" },
    mass: { label: "Mass", value: 7.35e22, unit: "kg" },
  },
  "Mercury": {
    orbitalPeriod: { label: "Orbital Period", value: 88.0, unit: "days" },
    diameter: { label: "Diameter", value: 4879, unit: "km" },
    mass: { label: "Mass", value: 3.30e23, unit: "kg" },
  },
  "Venus": {
    orbitalPeriod: { label: "Orbital Period", value: 224.7, unit: "days" },
    diameter: { label: "Diameter", value: 12104, unit: "km" },
    mass: { label: "Mass", value: 4.87e24, unit: "kg" },
  },
  "The Sun": {
    rotationPeriod: { label: "Rotation Period", value: 25.0, unit: "days" },
    diameter: { label: "Diameter", value: 1392700, unit: "km" },
    mass: { label: "Mass", value: 1.99e30, unit: "kg" },
  },
  "Mars": {
    orbitalPeriod: { label: "Orbital Period", value: 687.0, unit: "days" },
    diameter: { label: "Diameter", value: 6779, unit: "km" },
    mass: { label: "Mass", value: 6.42e23, unit: "kg" },
  },
  "Jupiter": {
    orbitalPeriod: { label: "Orbital Period", value: 4331, unit: "days" },
    diameter: { label: "Diameter", value: 139820, unit: "km" },
    mass: { label: "Mass", value: 1.90e27, unit: "kg" },
  },
  "Saturn": {
    orbitalPeriod: { label: "Orbital Period", value: 10747, unit: "days" },
    diameter: { label: "Diameter", value: 116460, unit: "km" },
    mass: { label: "Mass", value: 5.68e26, unit: "kg" },
  },
};
