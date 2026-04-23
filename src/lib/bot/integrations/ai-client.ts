import { config } from '../config';
import type { AIProvider } from './ai-providers/types';
import { AnthropicProvider } from './ai-providers/anthropic';
import { OpenAIProvider } from './ai-providers/openai';
import { GeminiProvider } from './ai-providers/gemini';
import { MistralProvider } from './ai-providers/mistral';

export type { AIProvider, AIResponse, ChatMessage, ToolCall, ToolDefinition } from './ai-providers/types';

let provider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!provider) {
    switch (config.aiProvider) {
      case 'anthropic':
        provider = new AnthropicProvider();
        break;
      case 'openai':
        provider = new OpenAIProvider();
        break;
      case 'gemini':
        provider = new GeminiProvider();
        break;
      case 'mistral':
        provider = new MistralProvider();
        break;
      default:
        throw new Error(`Unknown AI provider: ${String(config.aiProvider)}`);
    }
  }
  return provider;
}
