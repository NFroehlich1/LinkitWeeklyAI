#!/bin/bash

echo "🚀 LinkitWeeklyAI Development Setup"
echo "=================================="

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI ist nicht installiert."
    echo "📥 Installiere Supabase CLI..."
    
    # Install Supabase CLI based on OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl -L https://github.com/supabase/cli/releases/download/v1.120.4/supabase_linux_amd64.tar.gz | tar -xz
        sudo mv supabase /usr/local/bin/
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # Mac OS
        brew install supabase/tap/supabase
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        # Windows
        echo "Bitte installieren Sie Supabase CLI manuell:"
        echo "https://supabase.com/docs/guides/cli/getting-started"
        exit 1
    fi
fi

echo "✅ Supabase CLI ist installiert"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker ist nicht gestartet. Bitte starten Sie Docker Desktop."
    exit 1
fi

echo "✅ Docker läuft"

# Start Supabase local development
echo "🏗️  Starte lokale Supabase-Instanz..."
supabase start

echo ""
echo "🎉 Setup abgeschlossen!"
echo ""
echo "📊 Supabase Studio: http://localhost:54323"
echo "🗄️  Database URL: postgresql://postgres:postgres@localhost:54322/postgres"
echo "🔑 API URL: http://localhost:54321"
echo ""
echo "Nächste Schritte:"
echo "1. Frontend starten: docker-compose --profile dev up app-dev"
echo "2. Edge Functions entwickeln: supabase functions serve"
echo "3. Edge Function deployen: supabase functions deploy function-name"
echo ""
echo "Zum Stoppen: supabase stop" 