export type SolveMethod = 'traditional' | 'ai' | 'both';

export interface SolveRequest {
  clue: string;
  letterPattern?: string;
  mode: 'hint' | 'answer';
  method?: SolveMethod;
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

export interface SolveResultWithMethod {
  method: 'traditional' | 'ai';
  result: SolveResponse;
}

export interface ApiError {
  error: string;
  code?: string;
}
