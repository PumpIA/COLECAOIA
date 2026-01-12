
export type GenerationType = 'video' | 'image';

export interface FashionAnswers {
  type: GenerationType;
  scenario: string;
  modelDescription: string;
  action: string;
  cameraStyle: string;
  details: string;
}

export enum AppStatus {
  IDLE = 'idle',
  ANALYZING_IMAGE = 'analyzing_image',
  FILLING_IA = 'filling_ia',
  GENERATING_PROMPT = 'generating_prompt',
  READY = 'ready'
}
