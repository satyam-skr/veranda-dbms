#!/usr/bin/env tsx

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local explicitly BEFORE other imports
config({ path: resolve(process.cwd(), '.env.local') });

async function testPRWorkflow() {
  try {
    // Dynamic import to ensure env vars are loaded first
    const { FixService } = await import('../services/fix.service');
    console.log('\n' + '='.repeat(60));
    console.log('🧪 TESTING GITHUB PR WORKFLOW');
    console.log('='.repeat(60) + '\n');

    // Parse command line arguments
    const args = process.argv.slice(2);
    const getArg = (name: string) => {
      const arg = args.find(a => a.startsWith(`--${name}=`));
      return arg?.split('=')[1];
    };

    const owner = getArg('owner');
    const repo = getArg('repo');
    const installationIdStr = getArg('installationId');

    if (!owner || !repo || !installationIdStr) {
      console.error('❌ MISSING REQUIRED PARAMETERS\n');
      console.error('Usage:');
      console.error('  npx tsx scripts/test-pr-creation.ts --owner=USERNAME --repo=REPO_NAME --installationId=ID\n');
      process.exit(1);
    }

    const installationId = parseInt(installationIdStr, 10);
    const fixService = new FixService();

    // STEP 1: Modify a file and create a new branch
    const testBranch = `test/pr-logic-${Date.now()}`;
    const testPath = 'PR_TEST.md';
    const testContent = `# PR Test\nCreated at: ${new Date().toISOString()}\n\nThis file was created programmatically to test the PR workflow.`;
    
    console.log(`✏️  STEP 1: Modifying file "${testPath}" on branch "${testBranch}"...`);
    
    const modResult = await fixService.modifyFile(
      installationId,
      owner,
      repo,
      testPath,
      testContent,
      '🧪 Test: Programmatic modification',
      testBranch
    );

    if (!modResult) {
      console.error('❌ FAILED: Could not modify file');
      process.exit(1);
    }

    console.log(`✅ SUCCESS: File modified on branch "${modResult.branchName}" (SHA: ${modResult.sha.substring(0, 7)})\n`);

    // STEP 2: Create a Pull Request
    console.log('🌿 STEP 2: Creating Pull Request...');
    const prUrl = await fixService.createPullRequest(
      installationId,
      owner,
      repo,
      testBranch,
      `🧪 Test PR: ${testBranch}`,
      `This PR was created programmatically by the test script.\n\nBranch: \`${testBranch}\``
    );

    if (!prUrl) {
      console.error('❌ FAILED: Could not create Pull Request');
      process.exit(1);
    }

    console.log(`✅ SUCCESS: Pull Request created at ${prUrl}\n`);
    console.log('🎉 ALL TESTS PASSED!');
  } catch (error: any) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

testPRWorkflow();
