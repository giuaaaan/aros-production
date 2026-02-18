#!/bin/bash
# AROS - Esecuzione Automatica Completa
# Copia e incolla QUESTO nel terminale

echo "🚀 AROS Auto-Setup"
echo "=================="

# 1. Installa supabase CLI se non c'è
if ! command -v supabase &> /dev/null; then
    echo "📦 Installing Supabase CLI..."
    brew install supabase/tap/supabase
fi

# 2. Login (se non sei già loggato)
echo "🔑 Checking Supabase login..."
supabase projects list &>/dev/null
if [ $? -ne 0 ]; then
    echo "⚠️  Devi fare login UNA VOLTA SOLA:"
    supabase login
fi

# 3. Link al progetto
echo "🔗 Linking project..."
cd /Users/romanogiovanni1993gmail.com/Desktop/PROGETTI/ai-aros-production
supabase link --project-ref elruhdwcrsxeirbbsozd

# 4. Esegui migration
echo "💾 Executing migrations..."
supabase db push

# 5. Deploy
echo "🚀 Deploying..."
cd apps/admin-dashboard && vercel --prod
cd ../voice-dashboard && vercel --prod

echo "✅ DONE! AROS è pronto!"
