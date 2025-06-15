# 🚀 Migration von Edge Functions zu Backend API

## Übersicht

Diese Anleitung erklärt, wie du von Supabase Edge Functions zu einem einfachen Backend API wechselst, um die Funktionen in deinen Code zu integrieren und dabei trotzdem Supabase Secrets für API-Keys zu verwenden.

## 📋 Warum dieser Wechsel?

**Problem mit Edge Functions:**
- Schwer zu debuggen und testen
- Eingeschränkte Entwicklungsumgebung
- Abhängigkeit von Supabase-spezifischer Infrastruktur
- Komplexe Deployment-Prozesse

**Vorteile der Backend API:**
- ✅ Einfacheres Debugging und Testing
- ✅ Vollständige Kontrolle über die API
- ✅ Flexiblere Deployment-Optionen
- ✅ Bessere Integration in bestehende Workflows
- ✅ Weiterhin sichere Verwendung von API-Keys über Environment Variables

## 🏗️ Architektur

```
Frontend (React/Vite)
      ↓
API Proxy Service
      ↓
Backend API (Express.js)
      ↓
External APIs (Gemini, RSS, etc.)
```

## 🛠️ Setup-Anleitung

### 1. Backend API Setup

#### Backend installieren:
```bash
cd LinkitWeeklyAI/backend-api
npm install

# Environment Variables konfigurieren
cp env.example .env
# .env bearbeiten mit deinen Werten
```

#### Backend starten:
```bash
# Development
npm run dev

# Production
npm start
```

### 2. Environment Variables Setup

#### Backend (.env):
```env
# Supabase Configuration
SUPABASE_URL=https://aggkhetcdjmggqjzelgd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=dein_service_role_key

# API Keys
GEMINI_API_KEY=dein_gemini_api_key
BREVO_API_KEY=dein_brevo_api_key

# Server Configuration  
PORT=8000
NODE_ENV=development
```

#### Frontend (.env):
```env
VITE_API_BACKEND_URL=http://localhost:8000
```

### 3. Deployment-Optionen

#### Option A: Railway (Empfohlen)
```bash
# 1. Railway CLI installieren
npm install -g @railway/cli

# 2. Project erstellen
railway login
railway init

# 3. Environment Variables setzen
railway variables set SUPABASE_URL=your_url
railway variables set SUPABASE_SERVICE_ROLE_KEY=your_key
railway variables set GEMINI_API_KEY=your_key

# 4. Deployen
railway up
```

#### Option B: Vercel
```bash
# 1. Vercel CLI installieren
npm install -g vercel

# 2. Deployen
cd backend-api
vercel

# 3. Environment Variables über Vercel Dashboard setzen
```

#### Option C: Heroku
```bash
# 1. Heroku CLI installieren und einloggen
heroku login

# 2. App erstellen
heroku create your-app-name

# 3. Environment Variables setzen
heroku config:set SUPABASE_URL=your_url
heroku config:set GEMINI_API_KEY=your_key

# 4. Deployen
git push heroku main
```

## 🔄 Code-Migration

### Vorher (Edge Functions):
```typescript
// DecoderService.ts
const { data, error } = await supabase.functions.invoke('gemini-ai', {
  body: { action: 'verify-key' }
});
```

### Nachher (Backend API):
```typescript
// DecoderService.ts mit ApiProxyService
const result = await apiProxyService.callGemini({
  action: 'verify-key'
});
```

### Migrierte Services:
- ✅ `DecoderService` - Gemini API Calls
- ✅ `RssFeedService` - RSS Feed Processing
- ✅ `ApiProxyService` - Zentrale API-Verwaltung

## 🔧 API Endpoints

Das neue Backend stellt folgende Endpoints bereit:

### Gemini API Proxy
```http
POST /api/gemini
Content-Type: application/json

{
  "action": "verify-key" | "generate-summary" | "generate-article-summary" | "improve-article-title" | "qa-with-newsletter",
  "data": {...}
}
```

### RSS Feed Proxy
```http
POST /api/rss
Content-Type: application/json

{
  "url": "https://example.com/feed.xml",
  "source_name": "Example Source"
}
```

### QA Archive Search
```http
POST /api/qa-search
Content-Type: application/json

{
  "action": "search" | "qa",
  "query": "search term",
  "yearFilter": 2024,
  "weekFilter": 15,
  "limit": 10
}
```

### Newsletter Operations
```http
POST /api/newsletter/{operation}
Content-Type: application/json

{
  ...operation specific data
}
```

## 🔐 Sicherheit

### API-Key Management:
1. **Environment Variables**: Primäre Methode für lokale Entwicklung
2. **Supabase Vault**: Fallback für sichere Speicherung (optional)
3. **Plattform-Secrets**: Bei Deployment auf Railway/Vercel/Heroku

### CORS Configuration:
- Backend erlaubt alle Origins (für Development)
- Für Production: Spezifische Origins konfigurieren

## 🧪 Testing

### Backend testen:
```bash
# Health Check
curl http://localhost:8000/health

# Gemini API Test
curl -X POST http://localhost:8000/api/gemini \
  -H "Content-Type: application/json" \
  -d '{"action": "verify-key"}'
```

### Frontend Integration testen:
1. Backend starten: `npm run dev`
2. Frontend starten: `npm run dev`
3. Funktionen in der App testen

## 🚨 Troubleshooting

### Häufige Probleme:

#### 1. CORS Errors:
```
Access to fetch at 'http://localhost:8000' from origin 'http://localhost:3000' has been blocked by CORS policy
```
**Lösung**: Backend CORS-Configuration überprüfen

#### 2. Environment Variables nicht geladen:
```
Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY
```
**Lösung**: `.env` Datei im Backend-Verzeichnis erstellen

#### 3. API Key Fehler:
```
Gemini API Key not configured
```
**Lösung**: `GEMINI_API_KEY` in Environment Variables setzen

#### 4. Backend nicht erreichbar:
```
TypeError: Failed to fetch
```
**Lösung**: 
- Backend läuft? `npm run dev`
- Richtige URL in `VITE_API_BACKEND_URL`?

## 📊 Monitoring & Logging

### Backend Logs:
```bash
# Development
npm run dev  # Automatic console logging

# Production
npm start 2>&1 | tee app.log
```

### Error Monitoring:
- Console-basierte Logs im Development
- Für Production: Sentry oder ähnlichen Service integrieren

## 🎯 Nächste Schritte

1. **Backend deployen** auf bevorzugter Plattform
2. **Frontend Environment Variable** aktualisieren
3. **Edge Functions deaktivieren** (optional)
4. **Monitoring einrichten** für Production
5. **Tests schreiben** für kritische API-Endpoints

## 💡 Erweiterte Features

### Caching implementieren:
```javascript
// Redis oder In-Memory Cache für häufige Requests
const cache = new Map();

app.post('/api/rss', async (req, res) => {
  const cacheKey = `rss:${req.body.url}`;
  
  if (cache.has(cacheKey)) {
    return res.json(cache.get(cacheKey));
  }
  
  // ... fetch RSS logic
  cache.set(cacheKey, result);
  res.json(result);
});
```

### Rate Limiting:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### Health Checks:
```javascript
app.get('/health', async (req, res) => {
  const checks = {
    server: 'ok',
    database: await checkDatabase(),
    gemini_api: await checkGeminiAPI(),
    timestamp: new Date().toISOString()
  };
  
  res.json(checks);
});
```

## 📝 Checkliste

- [ ] Backend API installiert und konfiguriert
- [ ] Environment Variables gesetzt
- [ ] Backend läuft lokal
- [ ] Frontend mit Backend verbunden
- [ ] Alle Funktionen getestet
- [ ] Backend deployed
- [ ] Production Environment Variables gesetzt
- [ ] Frontend Production URL aktualisiert
- [ ] Edge Functions deaktiviert (optional)
- [ ] Monitoring eingerichtet

## 🆘 Support

Bei Problemen:
1. Logs überprüfen (Backend + Frontend Console)
2. Environment Variables validieren
3. Network Tab in DevTools prüfen
4. API Endpoints direkt mit curl testen

**Wichtig**: Diese Migration ist vollständig rückwärtskompatibel. Die alten Edge Functions können parallel laufen, bis die neue Lösung vollständig getestet ist. 