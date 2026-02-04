import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testOpenRouter() {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL;
  const model = process.env.OPENAI_MODEL;

  console.log('🔍 Testing OpenRouter Configuration...');
  console.log(`📡 URL: ${baseURL}`);
  console.log(`🤖 Model: ${model}`);
  console.log(`🔑 Key: ${apiKey?.substring(0, 10)}...`);

  if (!apiKey) {
    console.error('❌ Missing OPENAI_API_KEY');
    process.exit(1);
  }

  const client = new OpenAI({
    apiKey,
    baseURL,
    defaultHeaders: {
      'HTTP-Referer': 'https://autofix.dev',
      'X-Title': 'AutoFix Platform Test',
    }
  });

  const models = [
    model || 'openai/gpt-oss-120b:free',
    'mistralai/mistral-7b-instruct:free',
    'google/gemma-7b-it:free',
    'google/learnlm-1.5-pro-experimental:free'
  ];

  for (const m of models) {
    console.log(`\n🧪 Testing model: ${m}...`);
    try {
      const response = await client.chat.completions.create({
        model: m,
        messages: [{ role: 'user', content: 'Say "OK"' }],
        max_tokens: 10,
      });

      console.log(`✅ Success with ${m}!`);
      console.log('📥 Response:', response.choices[0]?.message?.content);
      
      // Update .env.local if the user's model failed but another worked
      if (m !== models[0]) {
        console.log(`💡 Suggestion: Update OPENAI_MODEL to ${m} in .env.local`);
      }
      
      process.exit(0);
    } catch (error: any) {
      console.error(`❌ Failed with ${m}`);
      console.error('Error:', error.message);
    }
  }

  process.exit(1);
}

testOpenRouter();
