# 🚀 GitOps Database Migration Setup

## Overview

This project uses **GitHub Actions** for zero-touch database migrations. No manual SQL execution, no credential exposure.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   GitHub    │────▶│   Actions   │────▶│  Supabase   │
│   (Code)    │     │  (Pipeline) │     │   (Database)│
└─────────────┘     └─────────────┘     └─────────────┘
                            │
                            ▼
                    ┌─────────────┐
                    │   Secrets   │
                    │   (Vault)   │
                    └─────────────┘
```

## Required Secrets

Configure these in your GitHub repository:

### 1. SUPABASE_ACCESS_TOKEN

**Purpose:** Authenticate with Supabase Management API

**How to get:**
1. Go to https://supabase.com/dashboard/account/tokens
2. Click "New Token"
3. Name: `GitHub Actions Migrations`
4. Copy the token (starts with `sbp_`)

**Set in GitHub:**
1. Go to repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `SUPABASE_ACCESS_TOKEN`
4. Value: [paste token]

### 2. SUPABASE_DB_PASSWORD

**Purpose:** Direct database connection for verification queries

**How to get:**
1. Go to https://supabase.com/dashboard/project/elruhdwcrsxeirbbsozd/settings/database
2. Find "Connection string" → "URI" tab
3. Copy the password from the connection string

**Set in GitHub:**
1. Same location as above
2. Name: `SUPABASE_DB_PASSWORD`
3. Value: [paste password]

## Workflow Triggers

Migrations run automatically on:

| Event | Behavior |
|-------|----------|
| `push` to `main` with migration files | Auto-deploy to production |
| `push` to `develop` with migration files | Deploy to staging |
| `pull_request` with migration files | Validation only (dry-run) |
| Manual `workflow_dispatch` | Choose specific migration |

## Manual Execution

### Option 1: GitHub UI (Recommended for one-off)

1. Go to repository → Actions → "🗄️ Database Migrations"
2. Click "Run workflow"
3. Options:
   - **migration_file:** Leave empty for all new, or specify file name
   - **dry_run:** Check "true" to validate without applying
4. Click "Run workflow"

### Option 2: Command Line

```bash
# Trigger workflow via GitHub CLI
gh workflow run migrations.yml

# Or with parameters
gh workflow run migrations.yml -f dry_run=true
```

## Migration Safety

### Pre-Deployment Checks

- ✅ SQL syntax validation
- ✅ Idempotency verification
- ✅ Dry-run support
- ✅ Required approval for production

### Post-Deployment Verification

- ✅ Database health check
- ✅ API endpoint testing
- ✅ Schema verification
- ✅ Rollback reference point

### Automatic Rollback on Failure

If migration fails:
1. Workflow creates incident issue automatically
2. Provides rollback instructions
3. Links to Supabase backup restore

## Directory Structure

```
.github/
└── workflows/
    └── migrations.yml          # Main migration workflow

supabase/
└── migrations/
    ├── 000_base_tables.sql
    ├── 001_security_schema.sql
    ├── 002_fatturazione_elettronica.sql
    ├── ...
    └── 006_schema_audit_remediation.sql  # ← Your migration

scripts/
└── verify-migration.js         # Post-deployment verification

docs/
└── GITOPS_SETUP.md             # This file
```

## Monitoring

### Check Migration Status

```bash
# View recent workflow runs
gh run list --workflow=migrations.yml

# View specific run logs
gh run view [RUN_ID]
```

### Verify Applied Migrations

After deployment, verify with:

```bash
# Link to project
supabase link --project-ref elruhdwcrsxeirbbsozd

# List migrations
supabase migration list

# Or check via SQL
supabase postgres execute "
  SELECT * FROM supabase_migrations.schema_migrations 
  ORDER BY version DESC LIMIT 5;
"
```

## Troubleshooting

### Workflow Fails: "No secrets configured"

**Problem:** Secrets not set in GitHub repository
**Solution:** Follow "Required Secrets" section above

### Workflow Fails: "Permission denied"

**Problem:** Supabase token doesn't have access to project
**Solution:** 
1. Verify token at https://supabase.com/dashboard/account/tokens
2. Check project ID matches: `elruhdwcrsxeirbbsozd`
3. Regenerate token if needed

### Migration Applied but App Broken

**Problem:** Migration may have introduced breaking change
**Solution:**
1. Check workflow logs for error details
2. Review incident issue created automatically
3. Restore from backup if needed:
   ```bash
   supabase db restore [BACKUP_ID]
   ```

### Need to Rollback

**Option A: Automatic Rollback**
- Workflow provides instructions on failure
- Use Supabase Dashboard → Database → Backups

**Option B: Manual SQL Rollback**
```bash
# Execute rollback script
psql "$DATABASE_URL" -f ROLLBACK_PLAN.sql
```

## Security Best Practices

1. **Never commit credentials**
   - All tokens/passwords in GitHub Secrets
   - `.env` files are gitignored

2. **Use least privilege**
   - Supabase token has only migration permissions
   - No production data access from CI

3. **Audit trail**
   - All migrations logged in GitHub Actions
   - Backup reference timestamps recorded
   - Rollback procedures documented

4. **Environment isolation**
   - `develop` branch → staging database
   - `main` branch → production database
   - PRs use dry-run validation only

## Support

- GitHub Actions docs: https://docs.github.com/en/actions
- Supabase CLI docs: https://supabase.com/docs/reference/cli
- Project issues: Create issue in this repository
