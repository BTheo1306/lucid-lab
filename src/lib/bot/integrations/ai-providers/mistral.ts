import OpenAI from 'openai';
import { config } from '../../config';
import type { AIProvider, AIResponse, ChatMessage, ToolCall, ToolDefinition } from './types';

/**
 * Mistral AI provider — OpenAI-compatible API, hosted in France (EU data residency).
 */
export class MistralProvider implements AIProvider {
  private client: OpenAI;
  private model: string;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.mistralApiKey,
      baseURL: 'https://api.mistral.ai/v1',
    });
    this.model = config.aiModel;
  }

  async chat(messages: ChatMessage[], tools?: ToolDefinition[]): Promise<AIResponse> {
    const openaiMessages = this.convertMessages(messages);
    const openaiTools = tools?.length ? this.convertTools(tools) : undefined;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: openaiMessages,
      tools: openaiTools,
      tool_choice: openaiTools ? 'auto' : undefined,
    });

    return this.parseResponse(response);
  }

  private convertMessages(messages: ChatMessage[]): OpenAI.Chat.ChatCompletionMessageParam[] {
    return messages.map((msg): OpenAI.Chat.ChatCompletionMessageParam => {
      if (msg.role === 'system') {
        return { role: 'system', content: msg.content };
      }
      if (msg.role === 'user') {
        return { role: 'user', content: msg.content };
      }
      if (msg.role === 'tool') {
        return {
          role: 'tool',
          content: msg.content,
          tool_call_id: msg.toolCallId ?? '',
        };
      }
      if (msg.toolCalls?.length) {
        return {
          role: 'assistant',
          content: msg.content || null,
          tool_calls: msg.toolCalls.map((tc) => ({
            id: tc.id,
            type: 'function' as const,
            function: {
              name: tc.name,
              arguments: JSON.stringify(tc.arguments),
            },
          })),
        };
      }
      return { role: 'assistant', content: msg.content };
    });
  }

  private convertTools(tools: ToolDefinition[]): OpenAI.Chat.ChatCompletionTool[] {
    return tools.map((tool) => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }

  private parseResponse(response: OpenAI.Chat.ChatCompletion): AIResponse {
    const choice = response.choices[0];
    const message = choice?.message;

    const text: string | null = message?.content ?? null;
    const toolCalls: ToolCall[] = [];

    if (message?.tool_calls) {
      for (const tc of message.tool_calls) {
        toolCalls.push({
          id: tc.id,
          name: tc.function.name,
          arguments: JSON.parse(tc.function.arguments) as Record<string, unknown>,
        });
      }
    }

    const finishReason =
      choice?.finish_reason === 'tool_calls' || toolCalls.length > 0
        ? 'tool_calls'
        : choice?.finish_reason === 'length'
          ? 'length'
          : 'stop';

    return {
      text,
      toolCalls,
      tokensUsed: {
        prompt: response.usage?.prompt_tokens ?? 0,
        completion: response.usage?.completion_tokens ?? 0,
        total: response.usage?.total_tokens ?? 0,
      },
      finishReason,
    };
  }
}
