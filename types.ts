
export interface Chapter {
  title: string;
  scene: string;
  dialogue: string;
  imagePrompt: string;
  imageUrl: string | null;
  choices: string[];
}

export interface CoverData {
    title: string;
    description: string;
    imagePrompt: string;
}

export type GameState = 'cover' | 'playing' | 'loading' | 'error';
