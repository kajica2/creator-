export type Role = 'user' | 'model';

export interface Message {
  role: Role;
  content: string;
}

export interface InitialInputs {
  lyricalThemes: string;
  mood: string;
  targetPlatform: string;
  budget: string;
}

export interface VisualTreatmentInputs {
  colorPalette: string;
  cameraStyle: string;
  setDesign: string;
}
