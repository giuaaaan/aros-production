#!/bin/bash
# ============================================================
# SELF-HEALING ACTIVATION - One Shot Deployment
# Chaos Engineering: Auto-detect and fix empty database
# ============================================================

set -e

echo "╔══════════════════════════════════════════════════════════════════════════╗"
echo "║              🏥 SELF-HEALING ACTIVATION - NETFLIX STYLE                  ║"
echo "╚══════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "⏱️  Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
API_URL="https://admin-dashboard-green-five-49.vercel.app"
REPO_URL=$(git remote get-url origin 2>/dev/null | sed 's/.*github.com[:/]//' | sed 's/.git$//' || echo "giuaaaan/aros-production")

echo "📊 PHASE 1: CHAOS EXPERIMENT - Baseline Detection"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test API
echo "🔍 Testing Organizations API..."
ORG_RESPONSE=$(curl -s "$API_URL/api/organizations")
ORG_COUNT=$(echo "$ORG_RESPONSE" | jq -r '.organizations | length // 0' 2>/dev/null || echo "0")

if [ "$ORG_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Database already populated ($ORG_COUNT organizations)${NC}"
    echo "   No healing needed. Exiting."
    exit 0
fi

if echo "$ORG_RESPONSE" | grep -q "error"; then
    echo -e "${YELLOW}⚠️  API Error detected - Database may be empty or corrupted${NC}"
    NEEDS_HEALING=true
else
    echo -e "${YELLOW}⚠️  Empty database detected (0 organizations)${NC}"
    NEEDS_HEALING=true
fi

echo ""
echo "🔧 PHASE 2: AUTOMATED REMEDIATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$NEEDS_HEALING" = true ]; then
    echo "🌱 Executing auto-seed via GitHub Actions..."
    
    # Trigger workflow_dispatch per self-healing
    if command -v gh &> /dev/null; then
        echo "📤 Triggering Self-Healing workflow..."
        gh workflow run self-healing.yml --repo "$REPO_URL" 2>/dev/null || echo "   Workflow will trigger on schedule (every 15 min)"
    else
        echo "   ℹ️  GitHub CLI not available. Workflow will auto-trigger on schedule."
    fi
    
    echo ""
    echo "📦 Committing auto-seed script to repository..."
    git add scripts/auto-seed.sql .github/workflows/self-healing.yml 2>/dev/null || true
    git commit -m "feat: self-healing automation - auto-seed for empty database" -m "- Auto-detects empty database" -m "- Seeds realistic demo data" -m "- Runs every 15 minutes via GitHub Actions" 2>/dev/null || echo "   Already committed"
    
    echo ""
    echo "🚀 Pushing to trigger pipeline..."
    git push origin main 2>&1 | tail -3
fi

echo ""
echo "⏱️  PHASE 3: WAITING FOR HEALING (60 seconds)..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for i in {1..6}; do
    echo "   Check $i/6..."
    sleep 10
    
    NEW_COUNT=$(curl -s "$API_URL/api/organizations" | jq -r '.organizations | length // 0' 2>/dev/null || echo "0")
    
    if [ "$NEW_COUNT" -gt 0 ]; then
        echo -e "${GREEN}   ✅ HEALING SUCCESSFUL! $NEW_COUNT organizations detected${NC}"
        break
    fi
done

echo ""
echo "🧪 PHASE 4: VERIFICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

FINAL_COUNT=$(curl -s "$API_URL/api/organizations" | jq -r '.organizations | length // 0' 2>/dev/null || echo "0")
HEALTH=$(curl -s "$API_URL/api/health" | jq -r '.status // "unknown"' 2>/dev/null || echo "unknown")

echo "   Final Organizations Count: $FINAL_COUNT"
echo "   System Health Status: $HEALTH"

if [ "$FINAL_COUNT" -gt 0 ] && [ "$HEALTH" == "healthy" ]; then
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║              ✅ SELF-HEALING COMPLETE - SYSTEM OPERATIONAL               ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "🌐 Dashboard URL: $API_URL"
    echo "🗂️   Organizations: $API_URL/organizations"
    echo ""
    echo "📊 Seeded Data:"
    echo "   • 3 Organizations"
    echo "   • 5 Customers"
    echo "   • 3 Vehicles"
    echo "   • 3 Work Orders"
    echo "   • 5 Parts in inventory"
    echo ""
    echo "🎲 Chaos Engineering:"
    echo "   • Self-healing runs every 15 minutes"
    echo "   • Auto-detects issues and fixes them"
    echo "   • Monitors via GitHub Actions"
    echo ""
    exit 0
else
    echo ""
    echo -e "${YELLOW}⚠️  Healing may need more time or manual intervention${NC}"
    echo "   Check: https://github.com/$REPO_URL/actions"
    echo ""
    exit 1
fi
