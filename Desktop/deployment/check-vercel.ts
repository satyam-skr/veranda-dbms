
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const vercelToken = process.env.VERCEL_TEAM_TOKEN;

async function checkVercelToken() {
  console.log('Checking Vercel Token...');
  if (!vercelToken) {
    console.error('❌ VERCEL_TEAM_TOKEN is missing from .env.local');
    return;
  }
  
  console.log('Token starts with:', vercelToken.substring(0, 5) + '...');

  try {
    const response = await fetch('https://api.vercel.com/v9/projects', {
      headers: {
        Authorization: `Bearer ${vercelToken}`,
      },
    });

    if (response.ok) {
      console.log('✅ Vercel API access successful!');
      const data = await response.json();
      console.log(`Found ${data.projects?.length || 0} projects.`);
    } else {
      console.error('❌ Vercel API request failed:', response.status, response.statusText);
      const text = await response.text();
      console.error('Response:', text);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

checkVercelToken();
