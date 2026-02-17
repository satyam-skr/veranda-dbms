import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function listModels() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !apiKey.startsWith('AIza')) {
    console.error('❌ Error: Current key in .env.local does not look like a Google API key (should start with AIza).');
    process.exit(1);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  console.log(`🔍 Querying Gemini Models API...`);
  console.log(`🔗 Endpoint: ${url.replace(apiKey, 'HIDDEN_KEY')}`);

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      const text = await response.text();
      try {
        const json = JSON.parse(text);
        console.error('📄 Error Details:', JSON.stringify(json, null, 2));
      } catch {
        console.error('📄 Raw Response:', text);
      }
      process.exit(1);
    }

    const data = await response.json();
    console.log('✅ Success! Available Models:');
    
    if (data.models && Array.isArray(data.models)) {
      const generateModels = data.models.filter((m: any) => 
        m.supportedGenerationMethods?.includes('generateContent')
      );
      
      const geminiModels = generateModels
        .filter((m: any) => m.name.includes('gemini'))
        .map((m: any) => m.name.replace('models/', ''));
      
      console.log('💎 Valid Gemini Model Names:');
      geminiModels.forEach((name: string) => console.log(` - ${name}`));

      console.log('\n💡 Recommendation: Use one of the "name" values above (without "models/" prefix) in your .env.local');
    } else {
      console.log('⚠️ No models array found in response:', data);
    }

  } catch (error) {
    console.error('💥 Fetch failed:', error);
  }
}

listModels();
