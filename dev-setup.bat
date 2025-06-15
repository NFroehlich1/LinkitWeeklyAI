@echo off
echo 🚀 LinkitWeeklyAI Development Setup
echo ==================================

REM Check if Supabase CLI is installed
supabase --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Supabase CLI is not installed.
    echo 📥 Please install Supabase CLI manually:
    echo https://supabase.com/docs/guides/cli/getting-started
    echo.
    echo For Windows with Chocolatey:
    echo choco install supabase
    echo.
    echo Or with Scoop:
    echo scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
    echo scoop install supabase
    pause
    exit /b 1
)

echo ✅ Supabase CLI is installed

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker Desktop.
    pause
    exit /b 1
)

echo ✅ Docker is running

REM Start Supabase local development
echo 🏗️  Starting local Supabase instance...
supabase start

echo.
echo 🎉 Setup completed!
echo.
echo 📊 Supabase Studio: http://localhost:54323
echo 🗄️  Database URL: postgresql://postgres:postgres@localhost:54322/postgres
echo 🔑 API URL: http://localhost:54321
echo.
echo Next steps:
echo 1. Start frontend: docker-compose --profile dev up app-dev
echo 2. Develop Edge Functions: supabase functions serve
echo 3. Deploy Edge Function: supabase functions deploy function-name
echo.
echo To stop: supabase stop
pause 