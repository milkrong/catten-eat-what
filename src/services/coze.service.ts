import {
  CozeConfig,
  CozeMessage,
  CozeResponse,
  CozeStreamResponse,
} from '../types/coze';

export class CozeService {
  private config: CozeConfig;

  constructor(config: CozeConfig) {
    this.config = config;
  }

  async createConversation(messages: CozeMessage[]): Promise<CozeResponse> {
    const response = await fetch(
      `${this.config.apiEndpoint}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          bot_id: this.config.botId,
          messages,
          stream: false,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Coze API error: ${response.statusText}`);
    }

    const data = await response.json();
    return this.validateResponse(data);
  }

  async createStreamConversation(
    messages: CozeMessage[],
    onChunk: (chunk: CozeStreamResponse) => void
  ): Promise<void> {
    const response = await fetch(
      `${this.config.apiEndpoint}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          bot_id: this.config.botId,
          messages,
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Coze API error: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk
          .split('\n')
          .filter((line) => line.trim() !== '')
          .map((line) => line.replace(/^data: /, ''));

        for (const line of lines) {
          if (line === '[DONE]') return;
          try {
            const parsedChunk = JSON.parse(line);
            onChunk(parsedChunk);
          } catch (e) {
            console.error('Error parsing chunk:', e);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  private validateResponse(data: unknown): CozeResponse {
    if (typeof data !== 'object' || data === null) {
      throw new Error('Invalid response format from Coze API');
    }

    const response = data as any;
    if (
      !response.id ||
      !response.object ||
      !response.created ||
      !response.model ||
      !Array.isArray(response.choices)
    ) {
      throw new Error('Missing required fields in Coze API response');
    }

    return response;
  }
}
