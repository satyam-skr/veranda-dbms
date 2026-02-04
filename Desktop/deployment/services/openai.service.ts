import OpenAI from 'openai';
import { logger } from '../utils/logger';

export class OpenAIService {
  private client: OpenAI;
  private model: string;
  
  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    const baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    
    if (!apiKey) {
      logger.error('❌ [OpenAI] OPENAI_API_KEY not found in environment variables');
      this.client = new OpenAI({ apiKey: 'MISSING_KEY' });
    } else {
      this.client = new OpenAI({ 
        apiKey,
        baseURL,
        defaultHeaders: {
          'HTTP-Referer': 'https://autofix.dev', // Required for OpenRouter
          'X-Title': 'AutoFix Platform',
        }
      });
      logger.info(`✅ [OpenAI] Service initialized with model: ${this.model}`);
    }
  }
  
  async generateCodeFix(prompt: string): Promise<any> {
    logger.info(`🤖 [AI] Calling ${this.model} for code fix...`);
    
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a code-fixing AI. Always respond with valid JSON only. No markdown, no explanations outside the JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });
      
      const content = response.choices[0]?.message?.content;
      
      if (!content) {
        logger.error('❌ [OpenAI] No content in response');
        return null;
      }
      
      const tokens = response.usage?.total_tokens || 0;
      logger.info('✅ [OpenAI] Response received', {
        tokens: tokens,
        cost: this.calculateCost(tokens)
      });
      
      const parsed = JSON.parse(content);
      return parsed;
      
    } catch (error: any) {
      logger.error('❌ [OpenAI] API call failed', { error: error.message });
      throw error;
    }
  }

  async generateClassification(prompt: string): Promise<any> {
    logger.info(`🤖 [AI] Calling ${this.model} for classification...`);
    
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an error classification AI. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0,
        response_format: { type: 'json_object' },
      });
      
      const content = response.choices[0]?.message?.content;
      if (!content) return null;
      
      return JSON.parse(content);
    } catch (error: any) {
      logger.error('❌ [OpenAI] Classification failed', { error: error.message });
      return null;
    }
  }

  async getCompletion(params: {
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
    max_tokens?: number;
    temperature?: number;
  }): Promise<string> {
    logger.info(`🤖 [AI] Calling ${this.model} for completion...`);
    
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: params.messages,
        max_tokens: params.max_tokens || 1000,
        temperature: params.temperature ?? 0.7,
      });
      
      return response.choices[0]?.message?.content || '';
    } catch (error: any) {
      logger.error('❌ [OpenAI] Completion failed', { error: error.message });
      throw error;
    }
  }
  
  private calculateCost(tokens: number): string {
    const costPer1M = 0.15; // GPT-4o-mini is actually cheaper than 0.375 now? 
    // Input: $0.150 / 1M tokens, Output: $0.600 / 1M tokens. 
    // Let's use a rough average or just report token count.
    const cost = (tokens / 1_000_000) * 0.3; 
    return `$${cost.toFixed(6)}`;
  }
}
