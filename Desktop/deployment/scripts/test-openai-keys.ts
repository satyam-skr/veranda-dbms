import OpenAI from 'openai';

const API_KEYS = [
  'sk-abcdef1234567890abcdef1234567890abcdef12',
  'sk-1234567890abcdef1234567890abcdef12345678',
  'sk-abcdefabcdefabcdefabcdefabcdefabcdef12',
  'sk-7890abcdef7890abcdef7890abcdef7890abcd',
  'sk-1234abcd1234abcd1234abcd1234abcd1234abcd',
  'sk-abcd1234abcd1234abcd1234abcd1234abcd1234',
  'sk-5678efgh5678efgh5678efgh5678efgh5678efgh',
  'sk-efgh5678efgh5678efgh5678efgh5678efgh5678',
  'sk-ijkl1234ijkl1234ijkl1234ijkl1234ijkl1234',
  'sk-mnop5678mnop5678mnop5678mnop5678mnop5678',
  'sk-qrst1234qrst1234qrst1234qrst1234qrst1234',
  'sk-uvwx5678uvwx5678uvwx5678uvwx5678uvwx5678',
  'sk-1234ijkl1234ijkl1234ijkl1234ijkl1234ijkl',
  'sk-5678mnop5678mnop5678mnop5678mnop5678mnop',
  'sk-qrst5678qrst5678qrst5678qrst5678qrst5678',
  'sk-uvwx1234uvwx1234uvwx1234uvwx1234uvwx1234',
  'sk-1234abcd5678efgh1234abcd5678efgh1234abcd',
  'sk-5678ijkl1234mnop5678ijkl1234mnop5678ijkl',
  'sk-abcdqrstefghuvwxabcdqrstefghuvwxabcdqrst',
  'sk-ijklmnop1234qrstijklmnop1234qrstijklmnop',
  'sk-1234uvwx5678abcd1234uvwx5678abcd1234uvwx',
  'sk-efghijkl5678mnopabcd1234efghijkl5678mnop',
  'sk-mnopqrstuvwxabcdmnopqrstuvwxabcdmnopqrst',
  'sk-ijklmnopqrstuvwxijklmnopqrstuvwxijklmnop',
  'sk-abcd1234efgh5678abcd1234efgh5678abcd1234',
  'sk-1234ijklmnop5678ijklmnop1234ijklmnop5678',
  'sk-qrstefghuvwxabcdqrstefghuvwxabcdqrstefgh',
  'sk-uvwxijklmnop1234uvwxijklmnop1234uvwxijkl',
  'sk-abcd5678efgh1234abcd5678efgh1234abcd5678',
  'sk-ijklmnopqrstuvwxijklmnopqrstuvwxijklmnop',
  'sk-1234qrstuvwxabcd1234qrstuvwxabcd1234qrst',
  'sk-efghijklmnop5678efghijklmnop5678efghijkl',
  'sk-mnopabcd1234efghmnopabcd1234efghmnopabcd',
  'sk-ijklqrst5678uvwxijklqrst5678uvwxijklqrst',
  'sk-1234ijkl5678mnop1234ijkl5678mnop1234ijkl',
  'sk-abcdqrstefgh5678abcdqrstefgh5678abcdqrst',
  'sk-ijklmnopuvwx1234ijklmnopuvwx1234ijklmnop',
  'sk-efgh5678abcd1234efgh5678abcd1234efgh5678',
  'sk-mnopqrstijkl5678mnopqrstijkl5678mnopqrst',
  'sk-1234uvwxabcd5678uvwxabcd1234uvwxabcd5678',
  'sk-ijklmnop5678efghijklmnop5678efghijklmnop',
  'sk-abcd1234qrstuvwxabcd1234qrstuvwxabcd1234',
  'sk-1234efgh5678ijkl1234efgh5678ijkl1234efgh',
  'sk-5678mnopqrstuvwx5678mnopqrstuvwx5678mnop',
  'sk-abcdijkl1234uvwxabcdijkl1234uvwxabcdijkl',
  'sk-ijklmnopabcd5678ijklmnopabcd5678ijklmnop',
  'sk-1234efghqrstuvwx1234efghqrstuvwx1234efgh',
  'sk-5678ijklmnopabcd5678ijklmnopabcd5678ijkl',
  'sk-abcd1234efgh5678abcd1234efgh5678abcd1234',
  'sk-ijklmnopqrstuvwxijklmnopqrstuvwxijklmnop',
];

async function testKey(apiKey: string, index: number): Promise<{ valid: boolean; details?: any }> {
  try {
    const client = new OpenAI({ apiKey });
    
    // Make a minimal test call
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'test' }],
      max_tokens: 5,
    });
    
    return { 
      valid: true, 
      details: { 
        model: response.model,
        usage: response.usage 
      } 
    };
  } catch (error: any) {
    return { 
      valid: false, 
      details: error.message 
    };
  }
}

async function findWorkingKeys() {
  console.log('🔍 Testing 50 OpenAI API keys...\n');
  console.log('═'.repeat(60));
  
  const workingKeys: string[] = [];
  const failedKeys: string[] = [];
  
  for (let i = 0; i < API_KEYS.length; i++) {
    const key = API_KEYS[i];
    const keyPreview = `${key.substring(0, 10)}...${key.substring(key.length - 4)}`;
    
    process.stdout.write(`[${i + 1}/50] Testing ${keyPreview}... `);
    
    const result = await testKey(key, i);
    
    if (result.valid) {
      console.log('✅ VALID');
      workingKeys.push(key);
    } else {
      console.log(`❌ FAILED (${result.details})`);
      failedKeys.push(key);
    }
    
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('═'.repeat(60));
  console.log(`\n📊 RESULTS:`);
  console.log(`✅ Working keys: ${workingKeys.length}`);
  console.log(`❌ Failed keys: ${failedKeys.length}`);
  
  if (workingKeys.length > 0) {
    console.log(`\n🎉 WORKING API KEYS:\n`);
    workingKeys.forEach((key, i) => {
      const preview = `${key.substring(0, 10)}...${key.substring(key.length - 4)}`;
      console.log(`${i + 1}. ${preview}`);
    });
    
    console.log(`\n✅ RECOMMENDED: Add this to your .env.local:`);
    console.log(`OPENAI_API_KEY=${workingKeys[0]}`);
    
    return workingKeys[0];
  } else {
    console.log(`\n❌ No working keys found. You may need to:`);
    console.log(`   1. Check if keys are expired`);
    console.log(`   2. Verify billing is enabled on OpenAI account`);
    console.log(`   3. Get a new API key from platform.openai.com`);
    
    return null;
  }
}

findWorkingKeys().then(workingKey => {
  if (workingKey) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});
