# Alternative Cron Solutions for Hobby Plan

Since Vercel Hobby plan only allows daily cron jobs, here are your options:

## Option 1: Use Vercel Cron (Every 6 Hours) ✅ IMPLEMENTED

Updated `vercel.json` to run every 6 hours:

```json
{
  "crons": [
    {
      "path": "/api/cron/monitor-deposits",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

**Runs at**: 12am, 6am, 12pm, 6pm daily
**Pros**: Free, no setup needed
**Cons**: Deposits take up to 6 hours to be detected

---

## Option 2: Use External Cron Service (FREE)

### cron-job.org (Recommended)

1. **Sign up**: https://cron-job.org (free)
2. **Create job**:
   - URL: `https://your-app.vercel.app/api/cron/monitor-deposits?secret=4d5f1d3a7f2070ad1bb0a8232b6dcf4229ddb9f7cf1822203fbb599710e8f9fa`
   - Schedule: Every 2 minutes
   - Method: GET

**Pros**: Free, runs every 2 minutes
**Cons**: Requires external service

### EasyCron

1. **Sign up**: https://www.easycron.com (free tier)
2. **Create cron job**:
   - URL: Same as above
   - Interval: Every 2 minutes

---

## Option 3: GitHub Actions (FREE)

Create `.github/workflows/monitor-deposits.yml`:

```yaml
name: Monitor Deposits

on:
  schedule:
    - cron: "*/5 * * * *" # Every 5 minutes
  workflow_dispatch: # Manual trigger

jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Deposit Monitoring
        run: |
          curl -X GET "https://your-app.vercel.app/api/cron/monitor-deposits?secret=${{ secrets.CRON_SECRET }}"
```

**Setup**:

1. Add `CRON_SECRET` to GitHub Secrets
2. Commit the workflow file
3. GitHub will run it every 5 minutes

**Pros**: Free, reliable, integrated with GitHub
**Cons**: Minimum 5-minute interval

---

## Option 4: Upgrade to Vercel Pro

**Cost**: $20/month
**Benefit**: Unlimited cron jobs at any frequency

---

## Option 5: Self-Hosted Cron (Advanced)

If you have a server or VPS:

```bash
# Add to crontab
*/2 * * * * curl -X GET "https://your-app.vercel.app/api/cron/monitor-deposits?secret=4d5f1d3a7f2070ad1bb0a8232b6dcf4229ddb9f7cf1822203fbb599710e8f9fa"
```

---

## Recommendation

**For Development/Testing**: Use Option 1 (every 6 hours)
**For Production**: Use Option 2 (cron-job.org) or Option 3 (GitHub Actions)

Both are completely free and work well!

---

## Quick Setup: cron-job.org

1. Go to https://cron-job.org/en/signup/
2. Sign up (free)
3. Click "Create cronjob"
4. Fill in:
   - **Title**: Monitor USDT Deposits
   - **URL**: `https://YOUR-APP.vercel.app/api/cron/monitor-deposits?secret=4d5f1d3a7f2070ad1bb0a8232b6dcf4229ddb9f7cf1822203fbb599710e8f9fa`
   - **Schedule**: Every 2 minutes
   - **Enabled**: Yes
5. Save

Done! Your deposits will be monitored every 2 minutes for free.
