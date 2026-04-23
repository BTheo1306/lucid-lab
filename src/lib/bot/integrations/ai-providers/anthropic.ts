import Anthropic from '@anthropic-ai/sdk';
import { config } from '../../config';
import type { AIProvider, AIResponse, ChatMessage, ToolCall, ToolDefinition } from './types';

export class AnthropicProvider implements AIProvider {
  private client: Anthropic;
  private model: string;

  constructor() {
    this.client = new Anthropic({ apiKey: config.anthropicApiKey });
    this.model = config.aiModel;
  }

  async chat(messages: ChatMessage[], tools?: ToolDefinition[]): Promise<AIResponse> {
    const { system, anthropicMessages } = this.convertMessages(messages);
    const anthropicTools = tools?.length ? this.convertTools(tools) : undefined;

    const maxRetries = 3;
    let lastError: unknown;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.client.messages.create({
          model: this.model,
          max_tokens: 1024,
          system: system || undefined,
          messages: anthropicMessages,
          tools: anthropicTools,
        });
        return this.parseResponse(response);
      } catch (err: unknown) {
        lastError = err;
        const status = (err as { status?: number }).status;
        if ((status === 529 || status === 502 || status === 503) && attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, attempt * 2000));
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  }

  private convertMessages(messages: ChatMessage[]): {
    system: string | null;
    anthropicMessages: Anthropic.MessageParam[];
  } {
    let system: string | null = null;
    const anthropicMessages: Anthropic.MessageParam[] = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        system = (system ?? '') + msg.content + '\n';
        continue;
      }

      if (msg.role === 'user') {
        anthropicMessages.push({ role: 'user', content: msg.content });
      } else if (msg.role === 'assistant') {
        if (msg.toolCalls?.length) {
          anthropicMessages.push({
            role: 'assistant',
            content: msg.toolCalls.map((tc) => ({
              type: 'tool_use' as const,
              id: tc.id,
              name: tc.name,
              input: tc.arguments,
            })),
          });
        } else {
          anthropicMessages.push({ role: 'assistant', content: msg.content });
        }
      } else if (msg.role === 'tool') {
        anthropicMessages.push({
          role: 'user',
          content: [
            {
              type: 'tool_result' as const,
              tool_use_id: msg.toolCallId ?? '',
              content: msg.content,
            },
          ],
        });
      }
    }

    return { system, anthropicMessages };
  }

  private convertTools(tools: ToolDefinition[]): Anthropic.Tool[] {
    return tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: {
        type: 'object' as const,
        properties: tool.parameters.properties,
        required: tool.parameters.required,
      },
    }));
  }

  private parseResponse(response: Anthropic.Message): AIResponse {
    let text: string | null = null;
    const toolCalls: ToolCall[] = [];

    for (const block of response.content) {
      if (block.type === 'text') {
        text = (text ?? '') + block.text;
      } else if (block.type === 'tool_use') {
        toolCalls.push({
          id: block.id,
          name: block.name,
          arguments: block.input as Record<string, unknown>,
        });
      }
    }

    let finishReason: AIResponse['finishReason'] = 'stop';
    if (response.stop_reason === 'tool_use') finishReason = 'tool_calls';
    else if (response.stop_reason === 'max_tokens') finishReason = 'length';

    return {
      text,
      toolCalls,
      tokensUsed: {
        prompt: response.usage.input_tokens,
        completion: response.usage.output_tokens,
        total: response.usage.input_tokens + response.usage.output_tokens,
      },
      finishReason,
    };
  }
}
