# 🤖 LINKIT WEEKLY KI - Intelligenter Newsletter Generator

Ein Newsletter-System, das KI- und Tech-News sammelt, analysiert und intelligente Newsletter für Studierende und Tech-Enthusiasten generiert.

## ✨ Hauptfunktionen

### 📰 **News-Aggregation**
- **RSS-Feed Integration**: The Decoder als Hauptquelle für KI- und Tech-News
- **Wöchentliche Sammlung**: Artikel-Erfassung für aktuelle Kalenderwoche
- **Duplikat-Vermeidung**: GUID-basierte Eindeutigkeit

### 🎯 **Artikel-Ranking System**
- **Top 10 Auswahl**: Intelligenter Scoring-Algorithmus basierend auf Relevanz und Aktualität
- **Manuelle Bearbeitung**: Drag & Drop Interface für Artikel-Reihenfolge
- **Permanente Löschung**: Artikel vollständig aus der Datenbank entfernen
- **Studenten-Ansicht**: Spezielle Filterung für hochschulrelevante Inhalte

### 🧠 **KI-Integration**
- **Google Gemini API**: Newsletter-Generierung mit Gemini 1.5 Flash
- **Titel-Verbesserung**: Manuelle KI-basierte Titel-Optimierung per Button
- **Q&A System**: Intelligente Fragen zu Newsletter-Inhalten stellen
- **Dynamische Fragevorschläge**: Adaptive Fragen basierend auf aktuellen Artikeln

### 🎨 **Benutzeroberfläche**
- **Glass Design**: Moderne UI mit Blur-Effekten und Transparenz
- **Responsive Layout**: Optimiert für Desktop und Mobile
- **Interactive Cards**: Expandierbare Artikel-Karten mit Metadaten
- **Dark/Light Theme**: Automatische Anpassung an Systemeinstellungen

## 🛠 Technologie-Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **KI-Service**: Google Gemini 1.5 Flash API
- **RSS Processing**: RSS2JSON Service

## 📋 Voraussetzungen

- Node.js ≥ 18.0.0
- npm Package Manager
- Supabase Account
- Google Gemini API Key

## 🚀 Installation

### 1. Repository klonen
```bash
git clone https://github.com/NFroehlich1/LinkitWeeklyAI.git
cd LinkitWeeklyAI
```

### 2. Dependencies installieren
```bash
npm install
```

### 3. Entwicklungsserver starten
```bash
npm run dev
```
Die Anwendung läuft auf **http://localhost:8082/**

### 4. Gemini API Key konfigurieren

#### Option A: Supabase Dashboard
1. API-Key erstellen: [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Supabase Dashboard öffnen
3. Edge Functions → Settings → Environment Variables
4. `GEMINI_API_KEY` hinzufügen

#### Option B: Debug-Tools
1. Anwendung öffnen
2. **"Gemini API Test"** (roter Button) klicken
3. Anweisungen zur Konfiguration folgen

## 📝 Verwendung

### Artikel verwalten
1. **"RSS Debug Test"** (orange): Neue Artikel laden
2. **View Toggle**: Zwischen "Top 10" und "Alle Artikel" wechseln
3. **📝 Button**: KI-Titel-Verbesserung für einzelne Artikel
4. **🗑️ Button**: Artikel permanent löschen

### Newsletter erstellen
1. **"Top 10 bearbeiten"**: Artikel-Auswahl anpassen
2. **Ranking anpassen**: Drag & Drop für Reihenfolge
3. **"Newsletter erstellen"**: KI-generiert Newsletter aus ausgewählten Artikeln
4. **Archivierung**: Newsletter werden automatisch gespeichert

### Q&A System
1. **"Fragen" Button**: Q&A Interface öffnen
2. **Dynamische Vorschläge**: KI generiert relevante Fragen zu den Artikeln
3. **🔄 Refresh**: Neue Fragevorschläge generieren
4. **Chat Interface**: Natürlichsprachliche Fragen zu Newsletter-Inhalten

### Debug-Tools
- **RSS Debug Test** (orange): Testet RSS-Feed-Verbindung und lädt neue Artikel
- **Gemini API Test** (rot): Überprüft KI-API-Konfiguration und Funktionalität

## 🏗 Projektstruktur

```
src/
├── components/
│   ├── ui/                 # shadcn/ui Komponenten
│   ├── Header.tsx          # Navigation
│   ├── NewsCard.tsx        # Artikel-Karten
│   ├── WeeklyDigest.tsx    # Newsletter-Generator
│   ├── ArticleRanking.tsx  # Top-10-Verwaltung
│   └── NewsletterAskAbout.tsx # Q&A-System
├── services/
│   ├── NewsService.ts      # News-Logik
│   └── DecoderService.ts   # RSS-Integration
├── pages/
│   ├── Index.tsx          # Hauptseite
│   ├── Newsletter.tsx     # Newsletter-Seite
│   └── StudentNews.tsx    # Studenten-Ansicht
└── types/                 # TypeScript-Definitionen

supabase/
└── functions/             # Edge Functions
    ├── gemini-ai/         # KI-Integration
    └── fetch-rss/         # RSS-Verarbeitung
```

## 🔧 Debug & Fehlerbehebung

### Häufige Probleme

**Newsletter-Generierung funktioniert nicht**
- Gemini API Key in Supabase konfigurieren
- Roten "Gemini API Test" Button verwenden

**Keine neuen Artikel**
- Orange "RSS Debug Test" Button klicken
- Browser-Konsole auf Fehler prüfen

**Titel-Verbesserung fehlschlägt**
- API-Key überprüfen
- Gemini API-Quota kontrollieren

### Console Logging
Die Anwendung nutzt ausführliches Console-Logging für Debug-Zwecke:
- RSS-Feed-Status
- API-Antworten
- Artikel-Verarbeitung
- Fehlerdetails

## 🤝 Contributing

1. Repository forken
2. Feature Branch erstellen
3. Änderungen committen
4. Pull Request öffnen

## 📄 Lizenz

MIT License - siehe [LICENSE](LICENSE) für Details.

---

**Entwickelt für die LINKIT Karlsruhe Community**
