import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createAppAuth } from '@octokit/auth-app';

async function testGitHubAuth() {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!appId || !privateKey) {
    console.error('❌ GITHUB_APP_ID or GITHUB_APP_PRIVATE_KEY missing');
    process.exit(1);
  }

  console.log(`🔍 Testing GitHub Auth for App ID: ${appId}`);
  console.log(`🔍 Key starts with: ${privateKey.substring(0, 30)}...`);

  try {
    const auth = createAppAuth({
      appId,
      privateKey,
    });

    console.log('⏳ Attempting to generate JWT (app auth)...');
    const appAuth = await auth({ type: 'app' });
    console.log('✅ App Auth successful (JWT generated)');
    console.log(`🎫 Token starts with: ${appAuth.token.substring(0, 10)}...`);
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ GitHub Auth FAILED:');
    console.error(error);
    if (error.stack) {
      console.error('Stack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

testGitHubAuth();
