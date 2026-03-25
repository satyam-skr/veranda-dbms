/**
 * Perplexity AI Client (FREE with Pro account)
 * Using Perplexity's Sonar models for code analysis
 */

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY!;
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

export const PERPLEXITY_MODEL = 'sonar'; // Free tier basic model

export interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface PerplexityResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
}

/**
 * Call Perplexity API
 */
export async function callPerplexity(params: {
  model?: string;
  messages: PerplexityMessage[];
  maxTokens?: number;
}): Promise<string> {
  const { model = PERPLEXITY_MODEL, messages, maxTokens = 4096 } = params;

  const response = await fetch(PERPLEXITY_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature: 0.2, // Lower for more deterministic code fixes
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Perplexity API error (${response.status}): ${error}`);
  }

  const data: PerplexityResponse = await response.json();
  
  if (!data.choices || data.choices.length === 0) {
    throw new Error('No response from Perplexity API');
  }

  return data.choices[0].message.content;
}
