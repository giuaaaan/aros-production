#!/bin/bash
set -e

echo "🚀 AROS DevContainer Setup Starting..."

# 1. Install docker-compose if not present
if ! command -v docker-compose &> /dev/null; then
    echo "📦 Installing docker-compose..."
    apt-get update && apt-get install -y docker-compose
else
    echo "✅ docker-compose already installed"
fi

# 2. Wait for postgres to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until pg_isready -h postgres -U postgres > /dev/null 2>&1; do
    echo "   PostgreSQL is unavailable - sleeping 2s"
    sleep 2
done
echo "✅ PostgreSQL is ready!"

# 3. Run init.sql to create tables (using migrations)
echo "🗄️ Setting up database tables..."
if [ -f "/docker-entrypoint-initdb.d/000_base_tables.sql" ]; then
    PGPASSWORD=postgres psql -h postgres -U postgres -d aros -f /docker-entrypoint-initdb.d/000_base_tables.sql
fi
if [ -f "/docker-entrypoint-initdb.d/001_security_schema.sql" ]; then
    PGPASSWORD=postgres psql -h postgres -U postgres -d aros -f /docker-entrypoint-initdb.d/001_security_schema.sql
fi
if [ -f "/docker-entrypoint-initdb.d/999_complete_migration.sql" ]; then
    PGPASSWORD=postgres psql -h postgres -U postgres -d aros -f /docker-entrypoint-initdb.d/999_complete_migration.sql
fi
echo "✅ Database tables created!"

# 4. Create .env files for both apps
if [ ! -f "/workspaces/ai-aros-production/apps/admin-dashboard/.env.local" ]; then
    echo "🔧 Creating admin-dashboard .env.local..."
    cat > /workspaces/ai-aros-production/apps/admin-dashboard/.env.local << 'EOF'
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=admin-dashboard
SENTRY_AUTH_TOKEN=

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Supabase Configuration (local)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# Optional: Vercel specific
NEXT_PUBLIC_VERCEL_ENV=development
NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA=dev
EOF
fi

if [ ! -f "/workspaces/ai-aros-production/apps/voice-dashboard/.env.local" ]; then
    echo "🔧 Creating voice-dashboard .env.local..."
    cat > /workspaces/ai-aros-production/apps/voice-dashboard/.env.local << 'EOF'
# Supabase Configuration (local)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# OpenAI (for AI responses)
OPENAI_API_KEY=

# Vapi.ai (Voice AI)
VAPI_API_KEY=
VAPI_ASSISTANT_ID=
VAPI_PHONE_NUMBER_ID=

# WhatsApp Cloud API (Meta)
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_ID=
WHATSAPP_VERIFY_TOKEN=

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF
fi
echo "✅ .env files created!"

# 5. Run pnpm install
echo "📦 Running pnpm install..."
cd /workspaces/ai-aros-production
if command -v pnpm &> /dev/null; then
    pnpm install
else
    echo "⚠️ pnpm not found, installing..."
    npm install -g pnpm
    pnpm install
fi
echo "✅ Dependencies installed!"

# 6. Echo completion message
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║  🎉 AROS DevContainer Setup Complete!                    ║"
echo "║                                                          ║"
echo "║  Services ready:                                         ║"
echo "║    • PostgreSQL: localhost:5432                          ║"
echo "║    • Admin Dashboard: http://localhost:3001              ║"
echo "║    • Voice Dashboard: http://localhost:3000              ║"
echo "║                                                          ║"
echo "║  To start development:                                   ║"
echo "║    pnpm dev                                              ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
