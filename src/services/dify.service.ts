interface DifyServiceConfig {
  apiKey: string;
  apiEndpoint: string;
}

interface DifyResponse {
  event:
    | "message"
    | "message_end"
    | "tts_message"
    | "tts_message_end"
    | "agent_message";
  message_id?: string;
  conversation_id: string;
  answer?: string;
  error?: string;
  created_at?: number;
  metadata?: {
    usage?: {
      total_tokens: number;
      total_price: string;
    };
  };
}

export class DifyService {
  private apiKey: string;
  private apiEndpoint: string;

  constructor(config: DifyServiceConfig) {
    this.apiKey = config.apiKey;
    this.apiEndpoint = config.apiEndpoint;
  }

  async createCompletion(prompt: string): Promise<string> {
    try {
      let fullResponse = "";
      await this.createStreamingCompletion(prompt, (chunk) => {
        console.log("<<", chunk);
        fullResponse += chunk;
      });
      console.log(">>fullResponse", fullResponse);
      return fullResponse;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Dify API error: Unknown error occurred");
    }
  }

  async createStreamingCompletion(
    prompt: string,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${this.apiEndpoint}/chat-messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: {},
          conversation_id: "",
          query: prompt,
          response_mode: "streaming",
          user: "recommendation-user",
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as DifyResponse;
        console.log(">>errorData", errorData);
        throw new Error(
          `Dify API error: ${errorData.error || response.statusText}`
        );
      }

      if (!response.body) {
        throw new Error("Dify API error: No response body received");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const messages = buffer.split("\n\n");

        // Keep the last incomplete message in the buffer
        buffer = messages.pop() || "";
        for (const message of messages) {
          if (message.startsWith("data: ")) {
            try {
              const data = JSON.parse(message.slice(6)) as DifyResponse;
              console.log(">>data", data, message);
              if (data.event === "agent_message" && data.answer) {
                onChunk(data.answer);
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e);
            }
          }
        }
      }

      // Handle any remaining data
      if (buffer.startsWith("data: ")) {
        try {
          const data = JSON.parse(buffer.slice(6)) as DifyResponse;
          if (data.event === "message" && data.answer) {
            onChunk(data.answer);
          }
        } catch (e) {
          console.error("Error parsing SSE data:", e);
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Dify API error: Unknown error occurred");
    }
  }
}
