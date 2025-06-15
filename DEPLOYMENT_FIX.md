# 🚨 URGENT: Edge Functions Deployment Fix

## Problem identifiziert:
Alle Edge Functions sind NICHT deployed auf Supabase.

## Sofortige Lösung:

### 1. Terminal öffnen und ins Projekt-Verzeichnis:
```bash
cd LinkitWeeklyAI
```

### 2. Supabase CLI Check:
```bash
supabase --version
# Falls nicht installiert: npm install -g supabase
```

### 3. Supabase Login (falls noch nicht gemacht):
```bash
supabase login
```

### 4. Projekt verknüpfen (falls noch nicht gemacht):
```bash
supabase link --project-ref [DEIN_PROJECT_REF]
# PROJECT_REF findest du im Supabase Dashboard unter Settings > General
```

### 5. **ALLE Edge Functions deployen:**
```bash
supabase functions deploy
```

### 6. **Oder einzeln deployen:**
```bash
supabase functions deploy gemini-ai
supabase functions deploy fetch-rss
supabase functions deploy qa-archive-search
supabase functions deploy auto-generate-newsletter
```

### 7. **Deployment verifizieren:**
```bash
supabase functions list
```

### 8. **Secrets setzen (wichtig!):**
```bash
# Gemini API Key setzen
supabase secrets set GEMINI_API_KEY=dein_gemini_api_key_hier
```

## Expected Output nach erfolgreichem Deployment:
```
✅ gemini-ai deployed
✅ fetch-rss deployed  
✅ qa-archive-search deployed
✅ auto-generate-newsletter deployed
```

## Troubleshooting:

### Falls "Project not linked":
1. Gehe zu Supabase Dashboard
2. Settings > General > Reference ID kopieren
3. `supabase link --project-ref [REFERENCE_ID]`

### Falls "Not authenticated":
1. `supabase login`
2. Folge dem Browser-Login

### Falls "Function failed to deploy":
1. Check ob alle Dateien vorhanden sind in `supabase/functions/`
2. `supabase functions deploy [function-name] --no-verify-jwt`

## Nach dem Deployment:
1. Gehe zu `/debug` in der App
2. Klicke "Functions prüfen"  
3. Alle sollten ✅ grün sein
4. Test die App - RSS und AI sollten funktionieren

## Dateien die deployed werden:
- `supabase/functions/gemini-ai/index.ts`
- `supabase/functions/fetch-rss/index.ts`
- `supabase/functions/qa-archive-search/index.ts`
- `supabase/functions/auto-generate-newsletter/index.ts`

Diese Dateien MÜSSEN existieren für das Deployment! 