# Docker Commands für LinkitWeeklyAI

## Vollständige Entwicklungsumgebung (Frontend + Supabase Edge Functions)

### Komplettes Setup starten:
**Windows:**
```bash
./dev-setup.bat
```

**Mac/Linux:**
```bash
chmod +x dev-setup.sh
./dev-setup.sh
```

### Manual Setup:

1. **Supabase lokal starten:**
```bash
supabase start
```

2. **Frontend im Development-Modus starten:**
```bash
docker-compose --profile dev up app-dev --build
```

3. **Edge Functions entwickeln:**
```bash
# Edge Functions lokal bereitstellen (alle Functions)
supabase functions serve

# Spezifische Function bereitstellen
supabase functions serve gemini-ai --debug

# Edge Function testen
curl -i --location --request POST 'http://localhost:54321/functions/v1/gemini-ai' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"action": "test"}'
```

## Development (nur Frontend)

### App im Development-Modus starten:
```bash
docker-compose --profile dev up app-dev --build
```

### App im Development-Modus im Hintergrund starten:
```bash
docker-compose --profile dev up -d app-dev --build
```

### Development-Container stoppen:
```bash
docker-compose --profile dev down
```

## Production (Produktion)

### App im Production-Modus starten:
```bash
docker-compose --profile prod up --build
```

### App im Production-Modus im Hintergrund starten:
```bash
docker-compose --profile prod up -d --build
```

### Production-Container stoppen:
```bash
docker-compose --profile prod down
```

## Direkte Docker-Befehle

### Development-Build:
```bash
docker build --target development -t linkit-weekly-ai:dev .
docker run -p 5173:5173 -v "$(pwd):/app" -v "/app/node_modules" linkit-weekly-ai:dev
```

### Production-Build:
```bash
docker build --target production -t linkit-weekly-ai:prod .
docker run -p 3000:80 linkit-weekly-ai:prod
```

## Nützliche Commands

### Alle Container anzeigen:
```bash
docker ps
```

### Logs anzeigen:
```bash
docker-compose --profile dev logs -f
```

### Container Terminal betreten:
```bash
docker-compose --profile dev exec app-dev sh
```

### Images aufräumen:
```bash
docker image prune
docker system prune
```

## Ports

- **Frontend Development**: http://localhost:5173
- **Frontend Production**: http://localhost:3000
- **Supabase Studio**: http://localhost:54323
- **Supabase API**: http://localhost:54321
- **Supabase Database**: localhost:54322
- **Edge Functions**: http://localhost:54321/functions/v1/

## Environment Variables

### Für lokale Entwicklung (automatisch gesetzt):
```
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
```

### Für Production:
Erstellen Sie eine `.env` Datei im Projektverzeichnis mit Ihren echten Supabase-Konfigurationen:

```
VITE_SUPABASE_URL=your-production-supabase-url
VITE_SUPABASE_ANON_KEY=your-production-supabase-anon-key
```

## Edge Functions entwickeln

### Neue Edge Function erstellen:
```bash
supabase functions new my-new-function
```

### Edge Function lokal testen:
```bash
supabase functions serve my-new-function --debug
```

### Edge Function deployen:
```bash
supabase functions deploy my-new-function
```

### Edge Functions Logs anzeigen:
```bash
supabase functions logs my-new-function
```

## Workflow für kollaborative Entwicklung

1. **Lokale Umgebung starten**: `./dev-setup.bat` (Windows) oder `./dev-setup.sh` (Mac/Linux)
2. **Frontend entwickeln**: Code-Änderungen werden automatisch neu geladen
3. **Edge Functions entwickeln**: `supabase functions serve` für lokale Tests
4. **Database-Änderungen**: Über Supabase Studio (http://localhost:54323)
5. **Alles testen**: Frontend + Edge Functions + Database lokal
6. **Deployen**: `supabase functions deploy` und Frontend-Deployment 