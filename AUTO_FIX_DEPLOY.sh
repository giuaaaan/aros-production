#!/bin/bash
# ============================================
# AROS - AUTO FIX & REDEPLOY
# ============================================
set -e

echo "🚀 AROS Auto-Fix Deploy Script"
echo "================================"
echo ""

# Colori
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Verifica prerequisiti
echo -e "${BLUE}Step 1: Verifica prerequisiti...${NC}"

if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI non trovato${NC}"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js non trovato${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisiti OK${NC}"
echo ""

# Step 2: Check deploy correnti
echo -e "${BLUE}Step 2: Check deploy esistenti...${NC}"

check_url() {
    local url=$1
    local name=$2
    local status=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
    echo "  $name: HTTP $status"
}

check_url "https://admin-dashboard-33ovnmih7-giuaaaans-projects.vercel.app" "Admin Dashboard"
check_url "https://voice-dashboard-gzqf7vvxc-giuaaaans-projects.vercel.app" "Voice Dashboard"

echo ""

# Step 3: Build locale (opzionale ma raccomandato)
echo -e "${BLUE}Step 3: TypeScript Check...${NC}"
cd apps/admin-dashboard
if npm run type-check 2>/dev/null || pnpm type-check 2>/dev/null || yarn type-check 2>/dev/null; then
    echo -e "${GREEN}✅ TypeScript OK${NC}"
else
    echo -e "${YELLOW}⚠️  TypeScript check saltato o errori trovati${NC}"
fi
cd ../..

echo ""

# Step 4: Deploy Admin Dashboard
echo -e "${BLUE}Step 4: Deploy Admin Dashboard...${NC}"
cd apps/admin-dashboard

if [ -f .env.local ]; then
    echo "  Trovato .env.local, uso configurazione esistente"
fi

echo "  Eseguo deploy su Vercel..."
vercel --prod --yes 2>&1 | tee /tmp/deploy-admin.log || {
    echo -e "${YELLOW}⚠️  Deploy admin fallito o richiede login${NC}"
}

cd ../..

# Step 5: Deploy Voice Dashboard  
echo -e "${BLUE}Step 5: Deploy Voice Dashboard...${NC}"
cd apps/voice-dashboard

echo "  Eseguo deploy su Vercel..."
vercel --prod --yes 2>&1 | tee /tmp/deploy-voice.log || {
    echo -e "${YELLOW}⚠️  Deploy voice fallito o richiede login${NC}"
}

cd ../..

# Step 6: Verifica post-deploy
echo ""
echo -e "${BLUE}Step 6: Verifica post-deploy...${NC}"
sleep 5

check_url "https://admin-dashboard-33ovnmih7-giuaaaans-projects.vercel.app" "Admin Dashboard"
check_url "https://voice-dashboard-gzqf7vvxc-giuaaaans-projects.vercel.app" "Voice Dashboard"

echo ""
echo "================================"
echo -e "${GREEN}🎉 Script completato!${NC}"
echo ""
echo "📊 RIEPILOGO:"
echo "  Admin Dashboard: https://admin-dashboard-33ovnmih7-giuaaaans-projects.vercel.app"
echo "  Voice Dashboard: https://voice-dashboard-gzqf7vvxc-giuaaaans-projects.vercel.app"
echo ""
echo -e "${YELLOW}⚠️  NOTA: Per eseguire le migration SQL:${NC}"
echo "  1. Vai su https://supabase.com/dashboard"
echo "  2. Seleziona il progetto AROS"
echo "  3. SQL Editor → New Query"
echo "  4. Esegui: supabase/migrations/999_complete_migration.sql"
echo ""
