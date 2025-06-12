# �� LINKIT WEEKLY KI - Newsletter Generator

KI-gestütztes System zur automatischen Erstellung von Tech-Newslettern mit intelligenter Artikel-Aggregation, Content-Management und Newsletter-Generierung.

## ✨ Hauptfunktionen

### 📰 **News-Aggregation & Content Management**
- **RSS-Feed Integration**: Automatische Sammlung aus The Decoder und konfigurierbaren Quellen
- **Intelligente Artikel-Bewertung**: Scoring-Algorithmus für Relevanz und Aktualität
- **Custom URL Import**: Manuelle Artikel-Eingabe über URL-Import
- **RSS Source Management**: Verwaltung mehrerer RSS-Quellen
- **Artikel-Filterung**: Duplikat-Erkennung und Content-Validierung

### 🎯 **Artikel-Ranking & Kuration**
- **Top 10 Ranking System**: Automatische und manuelle Artikel-Auswahl
- **Drag & Drop Interface**: Intuitive Reihenfolgen-Anpassung
- **Artikel-Verwaltung**: Permanente Löschung und Bearbeitung
- **Studenten-Ansicht**: Spezielle Filterung für hochschulrelevante Inhalte
- **Content Tabs**: Strukturierte Darstellung von Artikel-Metadaten

### 🧠 **KI-Integration (Google Gemini)**
- **Newsletter-Generierung**: Automatische Erstellung mit Gemini 1.5 Flash
- **Titel-Verbesserung**: KI-basierte Optimierung von Artikel-Titeln
- **Content-Zusammenfassung**: Intelligente Artikel-Abstracts
- **Q&A System**: Interaktive Fragen zu Newsletter-Inhalten
- **Dynamische Fragevorschläge**: Adaptive Fragen basierend auf Artikel-Inhalten

### 📧 **Newsletter-Management**
- **Newsletter-Archiv**: Vollständige Historien-Verwaltung
- **Abonnement-System**: E-Mail-Anmeldung mit Bestätigung
- **Newsletter-Versand**: Automatisierte E-Mail-Distribution
- **Archiv-Suche**: Q&A-basierte Suche in vergangenen Newslettern
- **Newsletter-Historie**: Chronologische Übersicht aller Newsletter

### 🔧 **Administration & Automatisierung**
- **Admin Panel**: Benutzer-Management und System-Konfiguration
- **Cron-Jobs**: Automatische tägliche und wöchentliche Verarbeitung
- **Debug-Tools**: RSS-Test und API-Validierung
- **Newsletter-Scheduler**: Zeitgesteuerte Newsletter-Erstellung
- **System-Monitoring**: Umfassendes Logging und Error-Tracking

## 🛠 Technologie-Stack

### **Frontend**
- **React 18** mit TypeScript und Vite
- **Tailwind CSS** + **shadcn/ui** Komponenten-Library
- **React Router** für Navigation
- **React Query** für State Management
- **React Markdown** für Content-Rendering

### **Backend & Infrastruktur**
- **Supabase** (PostgreSQL Database + Edge Functions)
- **Deno Runtime** für Edge Functions
- **Google Gemini 1.5 Flash API** für KI-Features
- **RSS2JSON** für Feed-Verarbeitung

### **Edge Functions (Supabase)**
```
├── gemini-ai/                    # KI-Integration
├── fetch-rss/                   # RSS-Feed-Verarbeitung
├── auto-generate-newsletter/     # Newsletter-Generierung
├── newsletter-send/              # E-Mail-Versand
├── newsletter-send-email/        # E-Mail-Templates
├── newsletter-send-confirmation/ # Versand-Bestätigung
├── newsletter-confirm/           # Abonnement-Bestätigung
├── newsletter-unsubscribe/       # Abmeldung
├── qa-archive-search/           # Q&A-Archiv-Suche
├── daily-article-processor/     # Tägliche Artikel-Verarbeitung
├── daily-decoder-processor/     # Decoder-Artikel-Processing
├── weekly-newsletter-processor/ # Wöchentliche Newsletter-Erstellung
├── weekly-newsletter-scheduler/ # Newsletter-Zeitplanung
├── setup-daily-cron/           # Cron-Job-Setup
├── cron-trigger/               # Automatische Trigger
├── test-article-system/        # System-Tests
└── test-decoder-system/        # Decoder-Tests
```

## 📋 Systemvoraussetzungen

- Node.js ≥ 18.0.0
- npm Package Manager
- Supabase Account mit Edge Functions
- Google Gemini API Key

## 🚀 Installation & Setup

### 1. Repository klonen und Dependencies installieren
```bash
git clone https://github.com/NFroehlich1/LinkitWeeklyAI.git
cd LinkitWeeklyAI
npm install
```

### 2. Umgebung konfigurieren
```bash
# Entwicklungsserver starten
npm run dev

# Build für Produktion
npm run build

# Tests ausführen
npm run test
```

### 3. Supabase & Gemini API Setup
- **Gemini API**: [Google AI Studio](https://aistudio.google.com/app/apikey)
- **Supabase**: Environment Variables in Edge Functions Settings
- **Cron Jobs**: Automatische Setup via `setup-daily-article-cron.sql`

## 📱 Anwendungsstruktur

### **Hauptseiten**
- **Index** (`/`): Artikel-Übersicht mit Ranking-System
- **Newsletter** (`/newsletter`): Newsletter-Generierung und -Verwaltung
- **Student News** (`/studentnews`): Studenten-optimierte Artikel-Ansicht
- **Archive Q&A** (`/archive-qa`): Q&A-System für Newsletter-Archive

### **Komponenten-Architektur**
```
src/
├── components/
│   ├── ui/                      # shadcn/ui Basis-Komponenten
│   ├── Header.tsx               # Navigation
│   ├── NewsCard.tsx             # Artikel-Darstellung
│   ├── NewsContentTab.tsx       # Artikel-Details
│   ├── WeeklyDigest.tsx         # Newsletter-Generator
│   ├── ArticleRanking.tsx       # Top-10-Management
│   ├── ArticleSelector.tsx      # Artikel-Auswahl
│   ├── NewsletterAskAbout.tsx   # Q&A für Newsletter
│   ├── NewsletterArchiveQA.tsx  # Archiv Q&A System
│   ├── NewsletterArchive.tsx    # Newsletter-Historie
│   ├── NewsletterManagement.tsx # Newsletter-Verwaltung
│   ├── NewsletterHistory.tsx    # Newsletter-Chronologie
│   ├── NewsletterSubscribe*.tsx # Abonnement-System
│   ├── CustomArticleImporter.tsx # URL-Import
│   ├── CustomUrlImport.tsx      # URL-Verarbeitung
│   ├── RssSourceManager.tsx     # RSS-Quellen-Verwaltung
│   ├── AdminPanel.tsx           # Administration
│   ├── AdminLoginForm.tsx       # Admin-Authentifizierung
│   └── NewsCardSkeleton.tsx     # Loading-States
├── services/
│   ├── NewsService.ts           # Haupt-News-Logic
│   ├── DecoderService.ts        # Decoder-Integration
│   ├── DigestService.ts         # Newsletter-Erstellung
│   ├── NewsletterArchiveService.ts # Archiv-Management
│   ├── RawArticleService.ts     # Artikel-Datenbank
│   ├── RssFeedService.ts        # RSS-Verarbeitung
│   ├── RssSourceService.ts      # RSS-Quellen
│   └── LocalNewsletterService.ts # Lokale Newsletter-Verwaltung
├── pages/                       # React Router Pages
├── types/                       # TypeScript Definitionen
├── hooks/                       # Custom React Hooks
├── utils/                       # Hilfsfunktionen
└── integrations/               # Externe API-Integrationen
```

## 🔧 Funktionen im Detail

### **RSS & Content Management**
- Automatischer Import aus konfigurierbaren RSS-Quellen
- Manuelle URL-Eingabe für Custom Content
- Intelligente Duplikat-Erkennung
- Content-Validierung und -Bereinigung

### **Newsletter-System**
- KI-basierte Newsletter-Generierung
- Anpassbare Templates und Formate
- Automatischer E-Mail-Versand
- Abonnement-Management mit Double-Opt-In

### **Q&A & Archiv**
- Intelligente Fragen zu Newsletter-Inhalten
- Archiv-Durchsuchung vergangener Newsletter
- Dynamische Fragevorschläge
- Chat-Interface für Benutzerinteraktion

### **Administration**
- Benutzer-Management und Authentifizierung
- System-Konfiguration und -Monitoring
- Debug-Tools für RSS und API-Tests
- Automatisierte Cron-Job-Verwaltung

## 🔄 Automatisierung & Cron-Jobs

### **Tägliche Verarbeitung**
- **Artikel-Import**: Automatische RSS-Aggregation
- **Content-Processing**: Artikel-Bewertung und -Filterung
- **Data-Cleanup**: Bereinigung veralteter Daten

### **Wöchentliche Newsletter**
- **Artikel-Auswahl**: Top-Artikel-Ermittlung
- **Newsletter-Generierung**: KI-basierte Content-Erstellung
- **Versand-Vorbereitung**: Template-Generierung und -Validierung
- **E-Mail-Distribution**: Automatisierter Versand an Abonnenten

## 🐛 Debug & Monitoring

### **Debug-Tools**
- **RSS Debug Test**: Validierung der RSS-Feed-Verbindungen
- **Gemini API Test**: KI-API-Konfiguration und -Status
- **System Health Checks**: Umfassende Funktionalitätstests

### **Logging & Monitoring**
- Detailliertes Console-Logging für alle Systemkomponenten
- Error-Tracking und Performance-Monitoring
- API-Response-Validierung und -Logging

## 📄 Lizenz

MIT License - siehe [LICENSE](LICENSE) für Details.

---

**Entwickelt für die LINKIT Karlsruhe Community**
