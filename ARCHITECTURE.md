# 🏗️ LinkitWeekly Architektur

## 📋 **Überblick**

LinkitWeekly verwendet eine **Hybrid-Architektur**, die die Vorteile von Supabase Edge Functions für sichere API-Zugriffe mit **lokaler Logik** für maximale Flexibilität kombiniert.

## 🔧 **Architektur-Prinzip**

```
Frontend Services (Prompts + Logik) → Edge Functions (API-Keys + Proxy) → External APIs
```

### ✅ **Vorteile dieser Architektur:**
- **Lokale Kontrolle**: Alle Prompts und Business-Logik sind in der Codebase
- **Sichere API-Keys**: Geheimnisse bleiben in Supabase Vault
- **Einfache Änderungen**: Prompts können direkt im Code angepasst werden
- **Keine zusätzlichen Services**: Nur Supabase Edge Functions als Proxy

---

## 📁 **Code-Struktur**

### **1. Frontend Services**
```
src/services/
├── GeminiPrompts.ts      # Alle Gemini AI Prompts & Logik
├── RssPrompts.ts         # RSS Processing & Filtering
├── DecoderService.ts     # Hauptservice für AI-Funktionen
├── RssFeedService.ts     # RSS-Feed Management
└── ApiProxyService.ts    # Fallback für Backend API (optional)
```

### **2. Edge Functions (Vereinfacht)**
```
supabase/functions/
├── gemini-ai/           # Einfacher Proxy für Gemini API
├── fetch-rss/           # RSS-Fetch ohne Processing
├── qa-archive-search/   # Newsletter-Archiv Suche
└── newsletter-send/     # Newsletter-Versand
```

---

## 🎯 **Service-Details**

### **GeminiPrompts.ts**
**Zweck:** Zentrale Verwaltung aller AI-Prompts
```typescript
// Newsletter Generation
GeminiPrompts.generateNewsletterPrompt(digest, articles, language)

// Article Summaries  
GeminiPrompts.generateArticleSummaryPrompt(article, language)

// Title Improvement
GeminiPrompts.improveArticleTitlePrompt(title, language)

// QA with Archives
GeminiPrompts.qaWithNewsletterPrompt(question, context, language)
```

### **RssPrompts.ts** 
**Zweck:** RSS-Verarbeitung und -Filterung
```typescript
// Content Cleaning
RssPrompts.cleanRssText(text)

// Article Processing
RssPrompts.processRssItem(rawItem, sourceName)

// Filtering & Sorting
RssPrompts.filterDuplicates(articles)
RssPrompts.filterRecentArticles(articles, maxDays)
RssPrompts.sortArticlesByDate(articles)
```

### **DecoderService.ts**
**Zweck:** Hauptservice für AI-Funktionen
```typescript
// Verwendet lokale Prompts + Edge Functions
await decoderService.generateWeeklyNewsletter(digest, articles, linkedIn, 'de')
await decoderService.generateArticleSummary(article, 'de')
await decoderService.improveArticleTitle(title, 'de')
await decoderService.qaWithNewsletter(question, 'de')
```

### **RssFeedService.ts**
**Zweck:** RSS-Feed Management mit lokaler Verarbeitung
```typescript
// Nutzt Edge Functions + lokale Verarbeitung
await rssService.fetchRssSource(source)
await rssService.fetchAllRssSources(sources)
await rssService.validateRssUrl(url)
```

---

## 🔄 **Datenfluss**

### **1. AI-Funktionen (Gemini)**
```
1. Frontend erstellt Prompt mit GeminiPrompts
2. DecoderService ruft Edge Function auf
3. Edge Function leitet Request an Gemini API weiter
4. Response kommt zurück über Edge Function
5. Frontend verarbeitet Response
```

### **2. RSS-Verarbeitung**
```
1. RssFeedService ruft Edge Function auf
2. Edge Function holt rohe RSS-Daten
3. Frontend verarbeitet Daten mit RssPrompts
4. Filtering, Cleaning, Sorting lokal
5. Verarbeitete Artikel werden zurückgegeben
```

---

## ⚙️ **Edge Function Konfiguration**

### **Gemini AI Function**
```typescript
// Vereinfachte Proxy-Funktion
{
  action: 'raw-call',
  prompt: '...',  // Von GeminiPrompts generiert
  config: { temperature: 0.3, maxOutputTokens: 4096 }
}
```

### **RSS Fetch Function**
```typescript
// Nur Raw-Data Fetch
{
  url: 'https://example.com/feed',
  source_name: 'Example Source',
  raw_mode: true  // Keine Verarbeitung in Edge Function
}
```

---

## 🛠️ **Vorteile für Entwicklung**

### ✅ **Lokale Anpassungen möglich:**
- **Prompts ändern**: Direkt in `GeminiPrompts.ts`
- **RSS-Filterung anpassen**: In `RssPrompts.ts`
- **Neue Funktionen hinzufügen**: Services erweitern
- **Debugging**: Lokale Console-Logs

### ✅ **Edge Functions bleiben einfach:**
- Nur API-Key Management
- Einfache Request-Weiterleitung
- Minimaler Code, wenig Wartung

### ✅ **Sicherheit:**
- API-Keys in Supabase Vault
- Keine Geheimnisse im Frontend
- CORS-sichere Anfragen

---

## 🔧 **Setup & Deployment**

### **1. Lokale Entwicklung**
```bash
# Supabase starten
npx supabase start

# Frontend starten  
npm run dev
```

### **2. Edge Functions deployen**
```bash
# Alle Functions deployen
npx supabase functions deploy

# Einzelne Function deployen
npx supabase functions deploy gemini-ai
npx supabase functions deploy fetch-rss
```

### **3. Secrets konfigurieren**
```bash
# Gemini API Key setzen
npx supabase secrets set GEMINI_API_KEY=your_key_here
```

---

## 📊 **Performance-Vorteile**

- **Weniger Edge Function Code** = Schnellere Cold Starts
- **Lokale Verarbeitung** = Weniger Netzwerk-Overhead  
- **Parallel Processing** = RSS-Feeds parallel verarbeiten
- **Caching möglich** = Frontend kann Ergebnisse cachen

---

## 🚀 **Migration von komplexen Edge Functions**

Wenn du weitere Edge Functions vereinfachen möchtest:

1. **Logik extrahieren** → Neuer Service im Frontend
2. **Edge Function vereinfachen** → Nur API-Zugriff
3. **Tests anpassen** → Frontend-Service testen
4. **Deployen** → Schrittweise Migration

Diese Architektur gibt dir **maximale Kontrolle** bei **minimaler Komplexität**! 🎯 