# GitHub Write Access Test Script

## What This Does

This is a **standalone test script** that proves your GitHub App has write permissions to repositories. It performs these steps with clear console output:

1. ✅ Authenticates with GitHub using your App credentials
2. ✅ Gets repository information
3. ✅ Reads the latest commit SHA
4. ✅ Creates a test branch
5. ✅ Reads README.md
6. ✅ Adds a test comment
7. ✅ Commits the change

If ANY step fails, it shows **exactly which step failed** and suggests possible causes.

## How to Run

### Option 1: Command Line Arguments

```bash
npm run test:github -- --owner=Arkin26 --repo=autofix-test --installationId=103022850
```

### Option 2: Environment Variables

Add to your `.env.local`:
```bash
GITHUB_TEST_OWNER=Arkin26
GITHUB_TEST_REPO=autofix-test
GITHUB_TEST_INSTALLATION_ID=103022850
```

Then run:
```bash
npm run test:github
```

## What You'll See

### Success Output
```
============================================================
🧪 TESTING GITHUB WRITE ACCESS
============================================================

📁 Repository: Arkin26/autofix-test
🔑 Installation ID: 103022850

🔑 STEP 1: Authenticating with GitHub App...
✅ SUCCESS: Authenticated with GitHub

📖 STEP 2: Getting repository information...
✅ SUCCESS: Default branch is "main"
   Repository: Arkin26/autofix-test
   Private: Yes

📍 STEP 3: Getting latest commit SHA...
✅ SUCCESS: Latest commit is a7f3b2c

🌿 STEP 4: Creating test branch "debug/github-write-test-1738506510123"...
✅ SUCCESS: Branch created

📝 STEP 5: Reading README.md...
✅ SUCCESS: File read (342 bytes)

✏️  STEP 6: Adding test comment to file...
✅ SUCCESS: Content prepared (added 67 bytes)

💾 STEP 7: Committing changes to GitHub...
✅ SUCCESS: Changes committed (b4e2a1f)


============================================================
🎉 ALL TESTS PASSED - GITHUB WRITE ACCESS CONFIRMED
============================================================

✅ Successfully created branch and committed changes

📂 Modified file: README.md
🌿 Branch: debug/github-write-test-1738506510123
💾 Commit: b4e2a1f

🔗 View on GitHub:
   https://github.com/Arkin26/autofix-test/tree/debug/github-write-test-1738506510123

📋 Next steps:
   - Visit the URL above to see your test branch
   - Delete the test branch when done (it contains only a test comment)
   - Your GitHub App has proper write permissions! 🎊

============================================================
```

### Failure Output (Example)

If authentication fails:
```
❌ FAILED: Authentication
Error: Invalid installation ID

Possible causes:
  - Invalid installation ID
  - Missing GITHUB_APP_ID or GITHUB_APP_PRIVATE_KEY in .env.local
  - GitHub App not installed on this repository
```

## Finding Your Installation ID

1. Go to your GitHub App settings
2. Click "Advanced" tab
3. Look at "Recent Deliveries" webhook payload
4. Find `installation.id` in the JSON

Or check your database's `github_installations` table.

## What the Test Branch Contains

The script creates a branch named like:
```
debug/github-write-test-1738506510123
```

It adds one line to the top of README.md:
```html
<!-- 🧪 GitHub Write Test: 2026-02-02T15:28:30.123Z -->
```

**Safe to delete** after confirming the test passed.

## Troubleshooting

### Error: "Could not create branch"
**Solution:** Your GitHub App needs "Contents: Write" permission
1. Go to GitHub App settings
2. Permissions & events → Repository permissions
3. Set "Contents" to "Read and Write"
4. Click "Save changes"
5. Reinstall the app on your repositories

### Error: "Could not read README.md"
**Solution:** Repository doesn't have README.md
- Change line 160 in the script to use a different file
- Or create a README.md in your test repository

### Error: "Repository does not exist"
**Solution:** Check owner/repo name spelling
- Make sure the repository exists
- Verify the GitHub App is installed on this repository

## Files
- Script: [scripts/test-github-write.ts](file:///Users/arkin/Desktop/deployment/scripts/test-github-write.ts)
- Run command: `npm run test:github`
