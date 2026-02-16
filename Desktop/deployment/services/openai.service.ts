import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger';

const SLEEP_DELAY = 5000; // 5 seconds delay for Free Tier (reduced from 12s)
const AI_CALL_TIMEOUT = 60000; // 60 seconds max for any AI call

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/** Race a promise against a timeout — prevents indefinite hangs */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)
    ),
  ]);
}

async function retryWithBackoff<T>(fn: () => Promise<T>, retries = 5, initialDelay = 5000): Promise<T> {
  let attempt = 0;
  while (attempt < retries) {
    try {
      return await fn();
    } catch (error: any) {
      if (error.message.includes('429') || error.status === 429) {
        attempt++;
        const delay = initialDelay * Math.pow(2, attempt); // Exponential backoff
        logger.warn(`⏳ Rate Limit Delay Triggered. Retrying in ${delay / 1000}s... (Attempt ${attempt}/${retries})`);
        await sleep(delay);
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded for Gemini API');
}

export class OpenAIService {
  private openaiClient: OpenAI | null = null;
  private geminiClient: GoogleGenerativeAI | null = null;
  private provider: 'openai' | 'gemini' = 'openai';
  private model: string;
  private apiKey: string;
  
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    const envModel = process.env.OPENAI_MODEL; 

    // Detect Provider based on Key Format
    if (this.apiKey.startsWith('AIza')) {
      this.provider = 'gemini';
      this.model = envModel || 'gemini-2.0-flash'; // Default confirmed working model
      this.geminiClient = new GoogleGenerativeAI(this.apiKey);
      logger.info(`✅ [AI Service] Initialized Google Gemini Provider with model: ${this.model}`);
    } else {
      this.provider = 'openai';
      this.model = envModel || 'gpt-4o-mini';
      const baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
      
      if (!this.apiKey || this.apiKey === 'MISSING_KEY') {
        logger.error('❌ [AI Service] API Key missing');
        this.openaiClient = new OpenAI({ apiKey: 'MISSING_KEY' });
      } else {
        this.openaiClient = new OpenAI({ 
          apiKey: this.apiKey,
          baseURL,
          defaultHeaders: {
            'HTTP-Referer': 'https://autofix.dev',
            'X-Title': 'AutoFix Platform',
          }
        });
        logger.info(`✅ [AI Service] Initialized OpenAI Provider with model: ${this.model}`);
      }
    }
  }
  
  async generateCodeFix(prompt: string): Promise<any> {
    logger.info(`🤖 [AI] Calling ${this.provider} (${this.model}) for code fix...`);
    
    // Throttle for Free Tier
    if (this.provider === 'gemini') {
      logger.info(`⏳ Throttling request for 12s (Gemini Free Tier)...`);
      await sleep(SLEEP_DELAY);
    }

    try {
      if (this.provider === 'gemini' && this.geminiClient) {
        // --- GEMINI IMPLEMENTATION WITH RETRY ---
        return await retryWithBackoff(async () => {
          if (!this.geminiClient) throw new Error('Gemini client null');
          
          const model = this.geminiClient.getGenerativeModel({ 
            model: this.model,
            generationConfig: { responseMimeType: "application/json" } // Force JSON
          });

          const systemPrompt = 'You are a code-fixing AI. Always respond with valid JSON only. No markdown, no explanations outside the JSON.';
          const result = await withTimeout(
            model.generateContent(`${systemPrompt}\n\n${prompt}`),
            AI_CALL_TIMEOUT,
            'Gemini generateCodeFix'
          );
          const response = result.response;
          const text = response.text();
          
          if (!text) throw new Error('No content in Gemini response');

          const tokens = response.usageMetadata?.totalTokenCount || 0;
          logger.info('✅ [Gemini] Response received', { tokens });

          return JSON.parse(text);
        });

      } else {
        // --- OPENAI IMPLEMENTATION ---
        if (!this.openaiClient) throw new Error('OpenAI client not initialized');

        const response = await this.openaiClient.chat.completions.create({
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
      }

    } catch (error: any) {
      logger.error(`❌ [${this.provider}] API call failed`, { error: error.message });
      throw error;
    }
  }

  async generateClassification(prompt: string): Promise<any> {
    logger.info(`🤖 [AI] Calling ${this.provider} (${this.model}) for classification...`);
    
    // Throttle for Free Tier
    if (this.provider === 'gemini') {
      logger.info(`⏳ Throttling request for 12s (Gemini Free Tier)...`);
      await sleep(SLEEP_DELAY);
    }

    try {
      if (this.provider === 'gemini' && this.geminiClient) {
         // --- GEMINI IMPLEMENTATION WITH RETRY ---
         return await retryWithBackoff(async () => {
          if (!this.geminiClient) throw new Error('Gemini client null');

          const model = this.geminiClient.getGenerativeModel({ 
            model: this.model,
            generationConfig: { responseMimeType: "application/json" }
          });
  
          const systemPrompt = 'You are an error classification AI. Always respond with valid JSON.';
          const result = await withTimeout(
            model.generateContent(`${systemPrompt}\n\n${prompt}`),
            AI_CALL_TIMEOUT,
            'Gemini generateClassification'
          );
          const text = result.response.text();
          if (!text) return null;
          return JSON.parse(text);
         });

      } else {
        // --- OPENAI IMPLEMENTATION ---
        if (!this.openaiClient) throw new Error('OpenAI client not initialized');

        const response = await this.openaiClient.chat.completions.create({
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
      }
    } catch (error: any) {
      logger.error(`❌ [${this.provider}] Classification failed`, { error: error.message });
      return null;
    }
  }

  async getCompletion(params: {
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
    max_tokens?: number;
    temperature?: number;
  }): Promise<string> {
    logger.info(`🤖 [AI] Calling ${this.provider} (${this.model}) for completion...`);
    
    // Throttle for Free Tier
    if (this.provider === 'gemini') {
      logger.info(`⏳ Throttling request for 12s (Gemini Free Tier)...`);
      await sleep(SLEEP_DELAY);
    }

    try {
      if (this.provider === 'gemini' && this.geminiClient) {
         // --- GEMINI IMPLEMENTATION WITH RETRY ---
         return await retryWithBackoff(async () => {
           if (!this.geminiClient) throw new Error('Gemini client null');
           const model = this.geminiClient.getGenerativeModel({ model: this.model });
           
           const history = params.messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
           
           const result = await withTimeout(
             model.generateContent(history),
             AI_CALL_TIMEOUT,
             'Gemini getCompletion'
           );
           return result.response.text();
         });

      } else {
        // --- OPENAI IMPLEMENTATION ---
        if (!this.openaiClient) throw new Error('OpenAI client not initialized');

        const response = await this.openaiClient.chat.completions.create({
          model: this.model,
          messages: params.messages,
          max_tokens: params.max_tokens || 1000,
          temperature: params.temperature ?? 0.7,
        });
        
        return response.choices[0]?.message?.content || '';
      }
    } catch (error: any) {
      logger.error(`❌ [${this.provider}] Completion failed`, { error: error.message });
      throw error;
    }
  }
  
  private calculateCost(tokens: number): string {
    const cost = (tokens / 1_000_000) * 0.3; 
    return `$${cost.toFixed(6)}`;
  }
}
