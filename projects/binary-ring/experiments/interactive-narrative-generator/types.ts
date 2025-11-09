
export enum GameState {
  SELECT_GENRE = 'SELECT_GENRE',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  ERROR = 'ERROR',
}

export interface StorySegment {
  narrative: string;
  choices: string[];
}

export interface StoryHistoryItem {
  narrative: string;
  choiceMade: string | null;
}
