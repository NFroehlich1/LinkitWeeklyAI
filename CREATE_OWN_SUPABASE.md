# 🚀 Eigenes Supabase Projekt für Development

## Warum ein eigenes Projekt?
- ✅ Du hast volle Kontrolle über Edge Functions
- ✅ Du kannst selbst deployen und testen
- ✅ Keine Abhängigkeit von deinem Freund
- ✅ Separate Development/Production Umgebung

## Schritt-für-Schritt Setup:

### 1. Neues Supabase Projekt erstellen:
1. Gehe zu https://supabase.com/dashboard
2. "New Project" klicken
3. Name: `linkitweekly-dev` (oder ähnlich)
4. Passwort notieren!
5. Region: Europe (closest to Germany)

### 2. Projekt-Daten kopieren:
Nach dem Setup, gehe zu Settings → API:
- Project URL: `https://xxx.supabase.co`
- Project API Key (anon): `eyJ...`
- Project Reference ID: `xxx`

### 3. Lokale Konfiguration anpassen:
```bash
# In deinem LinkitWeeklyAI Projekt:
cp .env.example .env.local

# .env.local editieren:
VITE_SUPABASE_URL=https://dein-projekt.supabase.co
VITE_SUPABASE_ANON_KEY=dein_anon_key
```

### 4. Supabase CLI Setup:
```bash
# CLI installieren (falls nicht vorhanden)
npm install -g supabase

# Login
supabase login

# Projekt verknüpfen
supabase link --project-ref dein-reference-id
```

### 5. Database Schema kopieren:
```bash
# Schema von Production ziehen (falls möglich)
supabase db pull

# Oder manuell die Tabellen erstellen:
# - daily_raw_articles
# - newsletter_archive  
# - newsletter_subscribers
# - newsletters
```

### 6. Edge Functions deployen:
```bash
# Alle Functions deployen
supabase functions deploy

# Sollte ausgeben:
# ✅ gemini-ai deployed
# ✅ fetch-rss deployed
# ✅ qa-archive-search deployed
# ✅ auto-generate-newsletter deployed
```

### 7. Secrets setzen:
```bash
# Gemini API Key setzen
supabase secrets set GEMINI_API_KEY=dein_gemini_api_key
```

### 8. App testen:
1. App neu starten: `npm run dev`
2. Gehe zu `/debug`
3. Klicke "Functions prüfen"
4. Alle sollten ✅ grün sein

## Vorteile deines eigenen Projekts:
- 🔧 Du kannst Edge Functions selbst anpassen
- 🧪 Du kannst neue Features testen
- 📊 Du siehst alle Logs und Metrics
- 🚀 Schnellere Development-Zyklen

## Database Sync:
Falls du die gleichen Daten wie Production willst:
```bash
# Daten exportieren (auf Production)
supabase db dump --data-only

# Daten importieren (auf deinem Projekt)
psql -h db.xxx.supabase.co -U postgres -d postgres < dump.sql
```

## Cost:
- Supabase Free Tier: **$0/month**
- 500MB Database, 50MB Edge Functions
- Völlig ausreichend für Development!

Nach dem Setup kannst du völlig unabhängig entwickeln! 🎉 