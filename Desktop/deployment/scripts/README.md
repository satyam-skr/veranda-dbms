# GitHub Token Refresh Script

## Purpose

This script refreshes the expired GitHub App installation token and updates your Supabase database.

## Prerequisites

1. **GitHub App ID**: Get from [https://github.com/settings/apps](https://github.com/settings/apps)
2. **GitHub Private Key**: Already in your `.env.local` as `GITHUB_APP_PRIVATE_KEY`
3. **Supabase credentials**: Already in your `.env.local`

## Installation

Install the required package (if not already installed):

```bash
npm install @octokit/auth-app
```

## Usage

### Step 1: Set Environment Variables

Make sure your `.env.local` has these variables:

```bash
GITHUB_APP_ID=YOUR_APP_ID           # Get from GitHub settings
GITHUB_APP_PRIVATE_KEY=YOUR_KEY     # Already set
NEXT_PUBLIC_SUPABASE_URL=YOUR_URL   # Already set
SUPABASE_SERVICE_ROLE_KEY=YOUR_KEY  # Already set
ENCRYPTION_KEY=YOUR_KEY             # Already set
```

### Step 2: Run the Script

```bash
node scripts/refresh-github-token.js
```

### Expected Output

```
🔄 Refreshing GitHub App installation token...

1️⃣  Authenticating with GitHub App...
2️⃣  Generating installation access token...
✅ Token generated successfully!
   Token: ghs_1234567890abcdef...
   Expires: 2026-01-13T15:00:00Z

3️⃣  Encrypting token...
✅ Token encrypted

4️⃣  Connecting to Supabase...
5️⃣  Updating database...
✅ Database updated successfully!

6️⃣  Verifying update...
✅ Verification successful!

═══════════════════════════════════════════════════════════
🎉 GitHub Token Refresh Complete!
═══════════════════════════════════════════════════════════
Installation ID: 103022850
Repository:      Arkin26/autofix-test
Token Expires:   2026-01-13T15:00:00Z
Updated At:      2026-01-12T14:56:00.000Z
═══════════════════════════════════════════════════════════

7️⃣  Testing token with GitHub API...
✅ Token works! Successfully accessed Arkin26/autofix-test

✅ All done! Your AutoFix platform should now work correctly.
```

## What It Does

1. ✅ Authenticates with your GitHub App using the private key
2. ✅ Generates a fresh installation access token (valid for 1 hour)
3. ✅ Encrypts the token using your encryption key
4. ✅ Updates the `github_installations` table in Supabase:
   - `installation_token` → new encrypted token
   - `token_expires_at` → new expiry timestamp
   - `updated_at` → current timestamp
5. ✅ Verifies the update was successful
6. ✅ Tests the token by making a GitHub API call

## Troubleshooting

### "Missing GITHUB_APP_ID"
→ Get your App ID from [GitHub Apps settings](https://github.com/settings/apps) and add to `.env.local`

### "Database update failed"
→ Check your Supabase credentials in `.env.local`

### "Token verification failed"
→ The token was saved but may not have repository access. Check your GitHub App permissions.

## After Running

Your AutoFix platform should now work! Test it by:
1. Pushing a broken commit to your repo
2. Watching the AutoFix system detect and fix it
3. Checking the logs: `npm run dev` and trigger the cron manually
