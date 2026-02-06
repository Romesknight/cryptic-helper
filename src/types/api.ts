export interface SolveRequest {
  clue: string;
  letterPattern?: string;
  mode: 'hint' | 'answer';
}

export interface SolveAnswerResponse {
  answer: string;
  clueType: string;
  clueTypeLabel: string;
  annotation: string;
  definition: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface SolveHintResponse {
  hint: string;
  clueType: string;
  clueTypeLabel: string;
  definition: string;
  confidence: 'high' | 'medium' | 'low';
}

export type SolveResponse = SolveAnswerResponse | SolveHintResponse;

export interface ApiError {
  error: string;
  code?: string;
}
