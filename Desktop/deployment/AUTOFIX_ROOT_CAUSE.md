# AutoFix Not Working - ROOT CAUSE FOUND

## ❌ Problem Identified

**The GitHub App installation token keeps expiring after 1 hour!**

### Evidence:
- Token was refreshed on: 2026-01-12 at 16:01 IST
- Token expired on: 2026-01-12 at 17:01 IST (1 hour later)
- Recent failures: 2026-01-13 at 21:17 IST (token expired 28 hours ago)

When the autonomous fix loop runs with an expired token, it fails silently and marks the record as `failed_after_max_retries` with `attempt_count = 0`.

---

## ✅ Immediate Solution

I've just refreshed the token again:
- **New Token Expires:** 2026-01-14 at 04:37 IST (1 hour from now)

Run the cron monitor now and it should work:
```bash
curl "http://localhost:3000/api/cron/monitor?key=debug_123"
```

---

## 🔧 Permanent Solution Needed

GitHub App installation tokens expire after 1 hour. You need to implement automatic token refresh.

### Option 1: Refresh on Every Request (Recommended)
Modify `lib/github.ts` to always generate a fresh token:

```typescript
export async function createInstallationClient(installationId: number): Promise<Octokit> {
  // Generate a FRESH token every time (they're valid for 1 hour)
  const auth = createAppAuth({
    appId: process.env.GITHUB_APP_ID!,
    privateKey: process.env.GITHUB_APP_PRIVATE_KEY!.replace(/\\n/g, '\n'),
  });

  const installationAuth = await auth({
    type: 'installation',
    installationId: installationId,
  });

  return new Octokit({
    auth: installationAuth.token,
  });
}
```

This way, you NEVER store the token - you generate a fresh one every time you need it.

### Option 2: Add Hourly Cron Job
Add a new cron route at `app/api/cron/refresh-token/route.ts`:

```typescript
export async function GET(request: NextRequest) {
  // Verify cron authorization
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.VERCEL_CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Run the token refresh script logic
  // ... (copy logic from scripts/refresh-github-token.js)
  
  return NextResponse.json({ success: true });
}
```

Then add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/refresh-token",
    "schedule": "0 * * * *"  // Every hour
  }]
}
```

---

## 🎯 Recommended Approach

**Option 1 is better** because:
- ✅ No database storage needed
- ✅ Always fresh tokens
- ✅ No cron job needed
- ✅ Simpler code
- ✅ More secure (tokens not stored)

The current approach of storing encrypted tokens in the database is unnecessary - just generate them on demand!

---

## 📝 Summary

**Why AutoFix wasn't working:**
1. ✅ Monitor detects failures correctly
2. ✅ Creates failure_records correctly
3. ✅ Calls autonomous fix loop correctly
4. ❌ **GitHub token was expired**
5. ❌ Fix loop crashes silently on expired token
6. ❌ Marks as failed without updating attempt_count

**Current Status:**
- ✅ Token refreshed (valid for 1 hour)
- ⚠️  Will expire again at 2026-01-14 04:37 IST
- 💡 Implement Option 1 above for permanent fix
