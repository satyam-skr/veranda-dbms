import { VercelClient } from '../lib/vercel';

async function main() {
  console.log('🔍 Testing Vercel Token...');

  const token = process.env.VERCEL_TEAM_TOKEN;
  if (!token) {
    console.error('❌ VERCEL_TEAM_TOKEN is missing in environment.');
    return;
  }

  try {
    const client = new VercelClient(token);
    // Try to list projects (limit 1)
    // Note: VercelClient might not have listProjects exposed directly or it might be different method
    // I need to check VercelClient definition.
    // Assuming getProject or listProjects.
    // I'll use raw fetch if needed to be sure.
    
    console.log('⏳ Fetching Vercel user/team info...');
    const response = await fetch('https://api.vercel.com/v2/user', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`❌ Vercel API check failed: ${response.status} ${response.statusText}`);
      console.error('Response:', text);
      return;
    }

    const data = await response.json();
    console.log('✅ Vercel Token is VALID.');
    console.log(`   User: ${data.user?.username} (${data.user?.email})`);

  } catch (error) {
    console.error('❌ Exception checking Vercel token:', error);
  }
}

main();
