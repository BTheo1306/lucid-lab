import { GoogleGenAI, type Content, type FunctionDeclaration, type Tool } from '@google/genai';
import { config } from '../../config';
import type { AIProvider, AIResponse, ChatMessage, ToolCall, ToolDefinition } from './types';

export class GeminiProvider implements AIProvider {
  private client: GoogleGenAI;
  private model: string;

  constructor() {
    this.client = new GoogleGenAI({ apiKey: config.googleAiApiKey });
    this.model = config.aiModel;
  }

  async chat(messages: ChatMessage[], tools?: ToolDefinition[]): Promise<AIResponse> {
    const { systemInstruction, contents } = this.convertMessages(messages);
    const geminiTools = tools?.length ? this.convertTools(tools) : undefined;

    const maxRetries = 3;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await this.client.models.generateContent({
          model: this.model,
          contents,
          config: {
            systemInstruction: systemInstruction || undefined,
            tools: geminiTools,
          },
        });

        return this.parseResponse(response);
      } catch (err: unknown) {
        const status = (err as { status?: number }).status;
        if ((status === 503 || status === 429) && attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt + 1) * 1000;
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        throw err;
      }
    }
    throw new Error('Gemini: max retries exceeded');
  }

  private convertMessages(messages: ChatMessage[]): {
    systemInstruction: string | null;
    contents: Content[];
  } {
    let systemInstruction: string | null = null;
    const contents: Content[] = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemInstruction = (systemInstruction ?? '') + msg.content + '\n';
        continue;
      }

      if (msg.role === 'user') {
        contents.push({ role: 'user', parts: [{ text: msg.content }] });
      } else if (msg.role === 'assistant') {
        if (msg.toolCalls?.length) {
          contents.push({
            role: 'model',
            parts: msg.toolCalls.map((tc) => ({
              functionCall: { name: tc.name, args: tc.arguments },
            })),
          });
        } else {
          contents.push({ role: 'model', parts: [{ text: msg.content }] });
        }
      } else if (msg.role === 'tool') {
        contents.push({
          role: 'user',
          parts: [
            {
              functionResponse: {
                name: msg.toolCallId ?? 'unknown',
                response: { result: msg.content },
              },
            },
          ],
        });
      }
    }

    return { systemInstruction: systemInstruction?.trim() ?? null, contents };
  }

  private convertTools(tools: ToolDefinition[]): Tool[] {
    const functionDeclarations: FunctionDeclaration[] = tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters as unknown as FunctionDeclaration['parameters'],
    }));

    return [{ functionDeclarations }];
  }

  private parseResponse(response: unknown): AIResponse {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resp = response as any;
    const candidate = resp.candidates?.[0];
    const parts = candidate?.content?.parts ?? [];
    const usageMetadata = resp.usageMetadata;

    let text: string | null = null;
    const toolCalls: ToolCall[] = [];

    for (const part of parts) {
      if (part.text) {
        text = (text ?? '') + part.text;
      }
      if (part.functionCall) {
        toolCalls.push({
          id: part.functionCall.name,
          name: part.functionCall.name,
          arguments: part.functionCall.args ?? {},
        });
      }
    }

    const finishReason = toolCalls.length > 0 ? 'tool_calls' : 'stop';

    return {
      text,
      toolCalls,
      tokensUsed: {
        prompt: usageMetadata?.promptTokenCount ?? 0,
        completion: usageMetadata?.candidatesTokenCount ?? 0,
        total: usageMetadata?.totalTokenCount ?? 0,
      },
      finishReason,
    };
  }
}
