export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCallId?: string;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, ToolParameter>;
    required?: string[];
  };
}

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  enum?: string[];
  items?: ToolParameter;
}

export interface AIResponse {
  text: string | null;
  toolCalls: ToolCall[];
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  finishReason: 'stop' | 'tool_calls' | 'length' | 'error';
}

export interface AIProvider {
  chat(messages: ChatMessage[], tools?: ToolDefinition[]): Promise<AIResponse>;
}
