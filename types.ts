
export type GenerationType = 'video' | 'image';

export interface FashionAnswers {
  type: GenerationType;
  scenario: string;
  modelDescription: string;
  action: string;
  cameraStyle: string;
  details: string;
  // Campos de variação dinâmica
  skinTone?: string;
  hairStyle?: string;
  ethnicity?: string;
  ageRange?: string;
}

export enum AppStatus {
  IDLE = 'idle',
  ANALYZING_IMAGE = 'analyzing_image',
  FILLING_IA = 'filling_ia',
  GENERATING_PROMPT = 'generating_prompt',
  READY = 'ready'
}
