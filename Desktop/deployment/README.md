# AutoFix - Autonomous CI/CD Self-Healing Platform

![AutoFix Banner](https://img.shields.io/badge/AutoFix-Autonomous%20CI%2FCD-blue?style=for-the-badge)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=flat-square&logo=supabase)](https://supabase.com/)

**Never worry about failed deployments again.** AutoFix is a production-ready autonomous platform that monitors your Vercel deployments 24/7, automatically detects failures, uses Claude AI to analyze errors and generate fixes, commits changes to GitHub, and re-triggers deployments until success—all without any user intervention.

## 🌟 Features

- **🔄 Continuous Autonomous Monitoring**: Polls Vercel deployments every 60 seconds
- **🤖 AI-Powered Analysis**: Uses Claude 3.5 Sonnet to analyze build logs and identify root causes
- **🔧 Automatic Fixes**: Generates precise code changes and commits to GitHub automatically
- **🚀 Self-Healing Deployments**: Triggers new deployments and monitors until success
- **♻️ Intelligent Retries**: Attempts up to 5 fixes per failure with exponential learning
- **📧 Smart Notifications**: Email alerts for successful fixes and max retry failures
- **🔒 Enterprise Security**: Token encryption, file whitelisting, dangerous code detection
- **📊 Real-time Dashboard**: Monitor deployment health and fix attempts in beautiful UI

## 🏗️ Architecture

```
Deployment Fails → AutoFix Detects → AI Analyzes → Fix Generated → 
Committed to GitHub → New Deployment → Monitor Status → 
Success ✅ or Retry (up to 5x)
```

### Technology Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Vercel Cron Functions
- **Database**: Supabase PostgreSQL with pgcrypto encryption
- **AI**: Claude 3.5 Sonnet via Anthropic API
- **Integrations**: GitHub REST API, Vercel REST API, Resend (email)
- **Infrastructure**: Vercel deployment with cron scheduling

## 📋 Prerequisites

Before setting up AutoFix, you need:

1. **GitHub Account** - For OAuth and App installation
2. **Vercel Account** - For deployment and API access
3. **Supabase Account** - For PostgreSQL database
4. **Anthropic API Key** - For Claude AI access
5. **Resend API Key** - For email notifications

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo>
cd deployment
npm install
```

### 2. Set Up Supabase Database

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the migration:

```bash
# Copy the contents of migrations/001_initial_schema.sql and execute in Supabase SQL Editor
```

3. Note your Project URL and API keys from Settings → API

### 3. Create GitHub OAuth App

1. Go to GitHub Settings → Developer Settings → OAuth Apps → New OAuth App
2. Set Application name: `AutoFix`
3. Homepage URL: `https://your-domain.vercel.app`
4. Authorization callback URL: `https://your-domain.vercel.app/api/auth/github-callback`
5. Note the **Client ID** and generate a **Client Secret**

### 4. Create GitHub App

1. Go to GitHub Settings → Developer Settings → GitHub Apps → New GitHub App
2. **GitHub App Name**: `AutoFix-YourName` (must be unique)
3. **Homepage URL**: `https://your-domain.vercel.app`
4. **Callback URL**: `https://your-domain.vercel.app/api/auth/github-callback`
5. **Setup URL**: `https://your-domain.vercel.app/setup/connect-repo`
6. **Webhook**: Leave blank (we use polling)
7. **Permissions** (Repository):
   - Contents: Read & Write
   - Pull Requests: Read & Write
   - Deployments: Read
   - Checks: Write
8. Click **Create GitHub App**
9. Note the **App ID**
10. Generate a **Private Key** and download it
11. Copy the private key contents (you'll need to format with `\n` for newlines)

### 5. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in all values:

```env
# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

# GitHub OAuth
GITHUB_CLIENT_ID=your_oauth_client_id
GITHUB_CLIENT_SECRET=your_oauth_client_secret

# GitHub App
GITHUB_APP_ID=123456
GITHUB_APP_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nKey\nHere\n-----END PRIVATE KEY-----"

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Encryption (generate a random 32-character string)
ENCRYPTION_KEY=your_random_32_char_encryption_key

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Resend
RESEND_API_KEY=re_...

# Vercel Cron Secret (generate a random string)
VERCEL_CRON_SECRET=your_random_cron_secret
```

### 6. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### 7. Set Environment Variables in Vercel

After deployment, add all environment variables:

```bash
# Set each variable
vercel env add GITHUB_CLIENT_ID
vercel env add GITHUB_CLIENT_SECRET
# ... repeat for all variables
```

### 8. Update GitHub App URLs

After deployment, update your GitHub App settings:
- Callback URL: `https://your-actual-domain.vercel.app/api/auth/github-callback`
- Setup URL: `https://your-actual-domain.vercel.app/setup/connect-repo`

### 9. Verify Cron Job

1. Go to Vercel Dashboard → Your Project → Cron
2. Verify `/api/cron/monitor` is scheduled to run every minute
3. Check logs to see autonomous monitoring in action

## 📱 Usage

### Connect Your First Repository

1. Visit your deployed AutoFix URL
2. Click "Connect with GitHub" and authorize
3. Install the GitHub App on your repository
4. Go to Dashboard → Connect Repository
5. Enter Vercel Project ID and API Token
6. Done! AutoFix will start monitoring immediately

### Monitor Deployments

- **Dashboard**: View connected repos and recent failures
- **Failures Page**: See all deployment failures with status
- **Failure Detail**: View AI analysis, fixes applied, and deployment results

## 🔐 Security Features

### Token Encryption
All API tokens (GitHub, Vercel) are encrypted using PostgreSQL's pgcrypto extension before storage.

### File Whitelist
AI can only modify:
- Files in `src/` directory
- `next.config.ts/js`
- `package.json`
- `tsconfig.json`
- `.eslintrc` files
- `middleware.ts`
- `tailwind.config.ts/js`

### Dangerous Code Detection
Automatically blocks AI-generated code containing:
- `child_process` usage
- `exec()` calls
- `eval()` functions
- File deletion operations
- Environment variable writes
- Shell command injections

## 🔄 The Autonomous Loop

1. **Every 60 seconds**: Cron job checks all Vercel projects
2. **Failure Detected**: Extracts deployment ID and build logs
3. **AI Analysis**: Claude analyzes logs and repository files
4. **Fix Generation**: Creates precise code changes
5. **Validation**: Checks file whitelist and dangerous patterns
6. **GitHub Commit**: Creates branch and commits fixes
7. **Deployment**: Triggers new Vercel deployment via API or hook
8. **Monitoring**: Polls deployment every 15s for up to 30 minutes
9. **Decision**:
   - ✅ **Success**: Update status, send success email
   - ❌ **Failed & attempts < 5**: Create new failure, retry from step 3
   - ❌ **Failed & attempts ≥ 5**: Mark as failed, send detailed failure email

## 📊 Database Schema

```sql
users
├── id (UUID)
├── email
├── github_username
└── github_access_token (encrypted)

github_installations
├── id (UUID)
├── user_id (FK)
├── installation_id
├── repo_owner
├── repo_name
└── installation_token (encrypted)

vercel_projects
├── id (UUID)
├── user_id (FK)
├── github_installation_id (FK)
├── project_id
├── vercel_token (encrypted)
└── last_checked_deployment_id

failure_records
├── id (UUID)
├── vercel_project_id (FK)
├── deployment_id
├── logs
├── status (enum)
└── attempt_count

fix_attempts
├── id (UUID)
├── failure_record_id (FK)
├── attempt_number
├── ai_response (JSONB)
├── files_changed (JSONB)
├── applied_branch
└── deployment_status
```

## 🧪 Testing

### Test the Autonomous Flow

1. Create a test repository with an intentional error:
```typescript
// src/app/page.tsx
export default function Page() {
  return <div>{undefinedVariable}</div>; // This will fail
}
```

2. Deploy to Vercel
3. Watch AutoFix:
   - Detect the failure (within 60 seconds)
   - Analyze with AI
   - Generate and commit fix
   - Redeploy automatically
   - Send success email

## 🐛 Troubleshooting

### Cron Not Running
- Check Vercel Dashboard → Cron tab
- Verify `vercel.json` is at project root
- Check environment variable `VERCEL_CRON_SECRET` is set

### AI Analysis Fails
- Verify `ANTHROPIC_API_KEY` is valid
- Check Anthropic account has credits
- Review logs in Vercel Dashboard

### GitHub Commits Fail
- Verify GitHub App has correct permissions
- Check installation token hasn't expired
- Ensure repository access is granted

### Vercel Deployment Not Triggered
- Verify Vercel token has correct permissions
- Check project ID is correct
- Try setting a deploy hook URL

## 📈 Monitoring & Logging

All operations are logged with structured JSON:

```json
{
  "timestamp": "2024-01-06T12:00:00Z",
  "level": "info",
  "message": "Deployment fixed successfully",
  "failureRecordId": "uuid",
  "attempt": 2
}
```

View logs in:
- Vercel Dashboard → Your Project → Logs
- Filter by `/api/cron/monitor` for monitoring logs

## 💰 Cost Considerations

- **Anthropic API**: ~$0.015 per failure analysis (Claude 3.5 Sonnet)
- **Vercel**: Free tier supports cron jobs
- **Supabase**: Free tier sufficient for most use cases
- **Resend**: 100 emails/day on free tier

**Estimated monthly cost** for 10 failures/day: ~$5-10

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- **Anthropic** - For Claude 3.5 Sonnet AI
- **Vercel** - For hosting and cron infrastructure
- **Supabase** - For PostgreSQL database
- **Next.js Team** - For the amazing framework

---

**Built with ❤️ by the AutoFix Team**

For support, email: support@autofix.dev
