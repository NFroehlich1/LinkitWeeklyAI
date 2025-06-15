# ⚡ Quick Start - Backend API Setup

## 🚀 In 5 Minuten von Edge Functions zu Backend API

### 1. Backend Setup (2 Minuten)

```bash
# Terminal 1: Backend installieren
cd LinkitWeeklyAI/backend-api
npm install

# Environment Variables kopieren und anpassen
cp env.example .env
```

**`.env` bearbeiten:**
```env
SUPABASE_URL=https://aggkhetcdjmggqjzelgd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=dein_service_role_key_hier
GEMINI_API_KEY=dein_gemini_api_key_hier
BREVO_API_KEY=dein_brevo_api_key_hier
PORT=8000
```

### 2. Backend starten (30 Sekunden)

```bash
# Backend starten
npm run dev
```

Du solltest sehen:
```
🚀 LinkIt Weekly Backend API running on port 8000
📍 Health check: http://localhost:8000/health
```

### 3. Frontend konfigurieren (1 Minute)

```bash
# Terminal 2: Frontend-Verzeichnis
cd LinkitWeeklyAI

# .env erstellen (falls nicht vorhanden)
echo "VITE_API_BACKEND_URL=http://localhost:8000" > .env
```

### 4. Frontend starten (30 Sekunden)

```bash
# Frontend starten
npm run dev
```

### 5. Testen (1 Minute)

1. **Backend Health Check:**
   ```bash
   curl http://localhost:8000/health
   ```

2. **In der App testen:**
   - Öffne `http://localhost:3000`
   - Versuche eine Newsletter-Generierung
   - Prüfe RSS-Feed Import

## ✅ Das wars!

Deine App verwendet jetzt das Backend API statt Edge Functions.

## 🐛 Probleme?

### Backend startet nicht:
```bash
# Node.js Version prüfen (>=18 erforderlich)
node --version

# Dependencies neu installieren
cd backend-api
rm -rf node_modules package-lock.json
npm install
```

### API-Key Fehler:
- Prüfe deine `.env` Datei im `backend-api` Verzeichnis
- Stelle sicher, dass alle Keys korrekt sind

### Frontend kann Backend nicht erreichen:
- Backend läuft auf Port 8000? `curl http://localhost:8000/health`
- `.env` im Frontend-Verzeichnis vorhanden?

## 🚀 Deployment

**Schnelles Railway Deployment:**
```bash
cd backend-api
npm install -g @railway/cli
railway login
railway init
railway up
```

**Dann Frontend `.env` aktualisieren:**
```env
VITE_API_BACKEND_URL=https://deine-railway-url.railway.app
```

## 📞 Nächste Schritte

- [ ] Vollständige [Migration Guide](./MIGRATION-TO-BACKEND-API.md) lesen
- [ ] Production Deployment planen
- [ ] Edge Functions deaktivieren (optional)

**Support**: Bei Problemen die Logs in beiden Terminals prüfen! 