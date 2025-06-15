# 👥 Team Development Setup

## Für Teamwork mit deinem Freund:

### 🎯 Option A: Shared Access (Empfohlen für Teams)

#### Dein Freund muss dich als Admin hinzufügen:
1. **Supabase Dashboard** öffnen
2. **Settings** → **Team** 
3. **"Invite Member"** klicken
4. **Deine Email** eingeben
5. **Role: "Admin"** wählen (wichtig für Edge Functions!)
6. Einladung senden

#### Du bekommst Email und:
1. Einladung akzeptieren
2. Supabase Dashboard Zugriff ✅
3. Edge Functions Management ✅
4. Database Zugriff ✅

#### Dann kannst du:
```bash
# CLI Setup (falls noch nicht gemacht)
npm install -g supabase
supabase login

# Projekt verknüpfen
supabase link --project-ref [SHARED_PROJECT_REF]

# Edge Functions deployen
supabase functions deploy

# Secrets verwalten
supabase secrets list
supabase secrets set GEMINI_API_KEY=your_key
```

### 🔧 Option B: Separate Dev/Prod Setup

#### Production (dein Freund):
- Haupt-Supabase Projekt
- Live-App für echte User
- Stable Code

#### Development (du):
- Eigenes Supabase Projekt für Testing
- Neue Features entwickeln
- Code testen vor Production

#### Workflow:
```bash
# Du entwickelst auf deinem Dev-Projekt
git checkout -b new-feature
# Code changes...
npm run dev  # läuft auf deinem Supabase

# Wenn fertig: Push to Git
git push origin new-feature

# Dein Freund reviewed & merged
git checkout main
git pull origin main

# Deploy zu Production Supabase
supabase functions deploy --project-ref PRODUCTION_REF
```

## 🎯 Empfehlung für euer Team:

### **Start mit Option A (Shared Access):**
**Warum?**
- ✅ Ihr arbeitet am gleichen Projekt
- ✅ Gleiche Daten, gleiche Functions
- ✅ Einfacher für Hackathon/schnelle Entwicklung
- ✅ Beide können deployen und testen

### **Später Option B (Dev/Prod):**
Wenn das Projekt größer wird:
- ✅ Professioneller Workflow
- ✅ Keine Conflicts
- ✅ Sicherer für Production
- ✅ Separate Testing

## 🚨 Sofortiges Fix für jetzt:

### **Dein Freund macht:**
```bash
cd LinkitWeeklyAI
supabase functions deploy  # Deploy alle Functions
supabase secrets set GEMINI_API_KEY=his_key
```

### **Dann du:**
1. Gehe zu `/debug`
2. Klicke "Functions prüfen"
3. Sollte alle ✅ grün zeigen
4. **Danach** kann dein Freund dich als Admin hinzufügen

## 🎉 Nach Admin-Zugriff:

Du kannst dann **alles selbst machen**:
- ✅ Edge Functions deployen
- ✅ Database Schemas ändern
- ✅ Secrets verwalten  
- ✅ Logs und Metrics sehen
- ✅ Unabhängig entwickeln

## ⚡ Quick Commands für Teamwork:

```bash
# Status checken
supabase functions list

# Nur geänderte Function deployen
supabase functions deploy gemini-ai

# Logs anschauen
supabase functions logs gemini-ai

# Secrets anschauen (ohne Werte)
supabase secrets list
```

**Perfect für Hackathon**: Ihr beide könnt parallel entwickeln! 🚀 