import { logger } from '../utils/logger';

/**
 * FREE AI Provider Service - ZERO COST
 * 
 * Automatically detects and uses the best available free AI model:
 * 1. Qwen/Qwen2.5-Coder-32B-Instruct (Hugging Face)
 * 2. DeepSeek-Coder-V2 (Hugging Face)
 * 3. Qwen/Qwen3-Coder (Vercel AI Gateway - if configured)
 * 4. Codeium Free API (if configured)
 * 
 * No configuration required - works out of the box!
 */

interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AIResponse {
  text: string;
  model: string;
  provider: string;
}

type AIProvider = 'openrouter' | 'perplexity' | 'huggingface-qwen' | 'huggingface-deepseek' | 'vercel-ai' | 'codeium';

export class FreeAIService {
  private activeProvider: AIProvider | null = null;
  private providerHealthy: Map<AIProvider, boolean> = new Map();
  private lastHealthCheck: number = 0;
  private readonly HEALTH_CHECK_INTERVAL = 300000; // 5 minutes

  /**
   * Get AI completion from the best available free provider
   */
  async getCompletion(params: {
    messages: AIMessage[];
    maxTokens?: number;
    temperature?: number;
  }): Promise<AIResponse> {
    const { messages, maxTokens = 2048, temperature = 0.7 } = params;

    // Refresh health checks periodically
    if (Date.now() - this.lastHealthCheck > this.HEALTH_CHECK_INTERVAL) {
      await this.runHealthChecks();
    }

    // Try providers in order of preference
    const providers: AIProvider[] = [];

    // 1. OpenRouter with Devstral 2 (Best for code fixing)
    if (process.env.OPENROUTER_API_KEY) {
      providers.push('openrouter');
    }

    // 2. Perplexity (if key exists)
    if (process.env.PERPLEXITY_API_KEY) {
      providers.push('perplexity');
    }

    // 3. Hugging Face (Free or Authenticated)
    providers.push('huggingface-qwen');
    providers.push('huggingface-deepseek');
    
    // 4. Others
    providers.push('vercel-ai');
    providers.push('codeium');

    for (const provider of providers) {
      if (this.providerHealthy.get(provider) === false) {
        continue; // Skip unhealthy providers
      }

      try {
        const response = await this.callProvider(provider, messages, maxTokens, temperature);
        
        // Success! Mark this as active provider
        if (!this.activeProvider) {
          this.activeProvider = provider;
          logger.info(`🤖 [FreeAI] Active provider set to: ${provider}`);
        }

        return response;
      } catch (error) {
        logger.warn(`⚠️ [FreeAI] Provider ${provider} failed, trying next...`, {
          error: String(error).substring(0, 200),
        });
        // Mark as unhealthy temporarily
        this.providerHealthy.set(provider, false);
        continue;
      }
    }

    // All providers failed
    throw new Error('All free AI providers are unavailable. Please try again later.');
  }

  /**
   * Call specific AI provider
   */
  private async callProvider(
    provider: AIProvider,
    messages: AIMessage[],
    maxTokens: number,
    temperature: number
  ): Promise<AIResponse> {
    switch (provider) {
      case 'openrouter':
        return this.callOpenRouter(messages, maxTokens, temperature);
      case 'perplexity':
        return this.callPerplexity(messages, maxTokens, temperature);
      case 'huggingface-qwen':
        return this.callHuggingFaceQwen(messages, maxTokens, temperature);
      case 'huggingface-deepseek':
        return this.callHuggingFaceDeepSeek(messages, maxTokens, temperature);
      case 'vercel-ai':
        return this.callVercelAI(messages, maxTokens, temperature);
      case 'codeium':
        return this.callCodeium(messages, maxTokens, temperature);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /**
   * OpenRouter API with Devstral 2 (Best for code fixing)
   */
  private async callOpenRouter(
    messages: AIMessage[],
    maxTokens: number,
    temperature: number
  ): Promise<AIResponse> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('OPENROUTER_API_KEY not set');

    logger.info('🤖 [FreeAI] Calling OpenRouter with Devstral 2...');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://autofix.dev',
          'X-Title': 'AutoFix Platform',
        },
        body: JSON.stringify({
          model: 'mistralai/devstral-2512:free',
          messages,
          max_tokens: maxTokens,
          temperature,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenRouter failed: ${response.status} ${response.statusText} - ${error}`);
      }

      const data = await response.json();
      const text = data.choices[0]?.message?.content || '';

      logger.info('✅ [FreeAI] OpenRouter/Devstral 2 response received');
      return { 
        text, 
        provider: 'openrouter',
        model: 'mistralai/devstral-2512:free'
      };
    } catch (error: any) {
      clearTimeout(timeoutId);
      logger.error('❌ [FreeAI] OpenRouter call failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Perplexity AI (Requires PERPLEXITY_API_KEY)
   */
  private async callPerplexity(
    messages: AIMessage[],
    maxTokens: number,
    temperature: number
  ): Promise<AIResponse> {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) throw new Error('PERPLEXITY_API_KEY not set');

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages,
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Perplexity failed: ${error}`);
    }

    const data = await response.json();
    const text = data.choices[0]?.message?.content || '';

    return {
      text,
      model: 'sonar-large-online',
      provider: 'Perplexity',
    };
  }

  /**
   * Hugging Face - Qwen/Qwen2.5-Coder-32B-Instruct (FREE tier)
   */
  private async callHuggingFaceQwen(
    messages: AIMessage[],
    maxTokens: number,
    temperature: number
  ): Promise<AIResponse> {
    const prompt = this.formatMessagesForHuggingFace(messages);

    const response = await fetch(
      'https://api-inference.huggingface.co/models/Qwen/Qwen2.5-Coder-32B-Instruct',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.HUGGINGFACE_API_KEY ? { 'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}` } : {}),
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: maxTokens,
            temperature,
            return_full_text: false,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Hugging Face Qwen failed: ${error}`);
    }

    const data = await response.json();
    const text = data[0]?.generated_text || data.generated_text || '';

    return {
      text,
      model: 'Qwen2.5-Coder-32B-Instruct',
      provider: 'HuggingFace (FREE)',
    };
  }

  /**
   * Hugging Face - deepseek-ai/DeepSeek-Coder-V2-Instruct (FREE tier)
   */
  private async callHuggingFaceDeepSeek(
    messages: AIMessage[],
    maxTokens: number,
    temperature: number
  ): Promise<AIResponse> {
    const prompt = this.formatMessagesForHuggingFace(messages);

    const response = await fetch(
      'https://api-inference.huggingface.co/models/deepseek-ai/DeepSeek-Coder-V2-Instruct',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.HUGGINGFACE_API_KEY ? { 'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}` } : {}),
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: maxTokens,
            temperature,
            return_full_text: false,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Hugging Face DeepSeek failed: ${error}`);
    }

    const data = await response.json();
    const text = data[0]?.generated_text || data.generated_text || '';

    return {
      text,
      model: 'DeepSeek-Coder-V2-Instruct',
      provider: 'HuggingFace (FREE)',
    };
  }

  /**
   * Vercel AI Gateway (if VERCEL_AI_GATEWAY_TOKEN is set)
   */
  private async callVercelAI(
    messages: AIMessage[],
    maxTokens: number,
    temperature: number
  ): Promise<AIResponse> {
    const token = process.env.VERCEL_AI_GATEWAY_TOKEN;
    if (!token) {
      throw new Error('VERCEL_AI_GATEWAY_TOKEN not configured');
    }

    // Vercel AI Gateway format
    const response = await fetch('https://gateway.vercel.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-coder', // Or whatever model name Vercel provides
        messages,
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Vercel AI failed: ${error}`);
    }

    const data = await response.json();
    const text = data.choices[0]?.message?.content || '';

    return {
      text,
      model: 'Qwen-Coder',
      provider: 'Vercel AI Gateway',
    };
  }

  /**
   * Codeium Free API (if CODEIUM_API_KEY is set)
   */
  private async callCodeium(
    messages: AIMessage[],
    maxTokens: number,
    temperature: number
  ): Promise<AIResponse> {
    const apiKey = process.env.CODEIUM_API_KEY;
    if (!apiKey) {
      throw new Error('CODEIUM_API_KEY not configured');
    }

    // Codeium API format (example - adjust based on actual API)
    const prompt = messages.map(m => m.content).join('\n\n');

    const response = await fetch('https://api.codeium.com/v1/complete', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Codeium failed: ${error}`);
    }

    const data = await response.json();
    const text = data.completion || data.text || '';

    return {
      text,
      model: 'Codeium',
      provider: 'Codeium (FREE)',
    };
  }

  /**
   * Format messages for Hugging Face models (they expect string prompts)
   */
  private formatMessagesForHuggingFace(messages: AIMessage[]): string {
    return messages
      .map(msg => {
        if (msg.role === 'system') return `System: ${msg.content}`;
        if (msg.role === 'user') return `User: ${msg.content}`;
        return `Assistant: ${msg.content}`;
      })
      .join('\n\n');
  }

  /**
   * Run health checks on all providers
   */
  private async runHealthChecks(): Promise<void> {
    logger.info('🔍 [FreeAI] Running provider health checks...');

    const providers: AIProvider[] = [
      'huggingface-qwen',
      'huggingface-deepseek',
      'vercel-ai',
      'codeium',
    ];

    for (const provider of providers) {
      try {
        // Simple test: ask for a single word
        await this.callProvider(
          provider,
          [{ role: 'user', content: 'Say "OK"' }],
          10,
          0.1
        );
        this.providerHealthy.set(provider, true);
        logger.info(`✅ [FreeAI] ${provider} is healthy`);
      } catch (error) {
        this.providerHealthy.set(provider, false);
        logger.warn(`❌ [FreeAI] ${provider} failed health check`);
      }
    }

    this.lastHealthCheck = Date.now();
  }

  /**
   * Get currently active provider (for logging)
   */
  getActiveProvider(): string {
    return this.activeProvider || 'none (will auto-detect)';
  }
}

// Singleton instance with startup health check
let freeAIInstance: FreeAIService | null = null;

export async function getFreeAIService(): Promise<FreeAIService> {
  if (!freeAIInstance) {
    freeAIInstance = new FreeAIService();
    // Run initial health check
    logger.info('🚀 [FreeAI] Initializing FREE AI service (ZERO cost)...');
    await (freeAIInstance as any).runHealthChecks();
  }
  return freeAIInstance;
}
