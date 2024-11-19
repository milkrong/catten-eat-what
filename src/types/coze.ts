export interface CozeConfig {
  apiKey: string;
  botId: string;
  apiEndpoint: string;
}

export interface CozeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface CozeChoice {
  index: number;
  message: CozeMessage;
  finish_reason: string | null;
}

export interface CozeResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: CozeChoice[];
}

export interface CozeStreamChoice {
  delta: Partial<CozeMessage>;
  index: number;
  finish_reason: string | null;
}

export interface CozeStreamResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: CozeStreamChoice[];
}
