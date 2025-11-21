
export enum AppState {
  HOME = 'HOME',
  CAPTURE = 'CAPTURE',
  PREVIEW = 'PREVIEW',
  PROCESSING = 'PROCESSING',
  RESTORE = 'RESTORE',
  MASKING = 'MASKING',
  RESULT = 'RESULT',
}

export enum Era {
  VICTORIAN = 'Victorian Era',
  ANCIENT_EGYPT = 'Ancient Egypt',
  ROARING_20S = 'Roaring 1920s',
  VIKING = 'Viking Age',
  CYBERPUNK = 'Cyberpunk Future',
  MEDIEVAL = 'Medieval Knight',
  WESTERN = 'Wild West',
  RENAISSANCE = 'Renaissance Painting',
}

export enum ImageStyle {
  REALISTIC = 'Photorealistic',
  CINEMATIC = 'Cinematic',
  VINTAGE = 'Vintage Film',
  PAINTING = 'Oil Painting',
  CYBER = 'Cyberpunk/Neon',
  SKETCH = 'Pencil Sketch',
  STUDIO = 'Studio Lighting',
  STEAMPUNK = 'Steampunk',
  ART_DECO = 'Art Deco',
  RETRO_FUTURISM = 'Retro Futurism',
}

export enum Resolution {
  STANDARD = 'Standard',
  HIGH = 'High Quality',
  ULTRA_4K = '4K Ultra',
}

export interface ProcessingOptions {
  mode: 'ANALYZE' | 'TIMETRAVEL' | 'CUSTOM_EDIT';
  eras?: Era[];
  customPrompt?: string;
  style?: ImageStyle;
  resolution?: Resolution;
  image: string; // Base64
}

export interface AnalysisResult {
  text: string;
}

export interface GenerationResult {
  era: string;
  imageUrl: string;
}
