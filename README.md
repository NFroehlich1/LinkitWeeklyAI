
# KI News Digest - Intelligent Newsletter Generator

Ein intelligentes Newsletter-System, das automatisch KI- und Tech-News sammelt, analysiert und studentenfreundliche Newsletter für Hochschulgruppen generiert.

## 🚀 Features

### Automatische News-Aggregation
- **RSS-Feed Integration**: Automatisches Sammeln von Artikeln aus verschiedenen Tech-Quellen
- **The Decoder Integration**: Spezialisiert auf deutsche KI-News
- **Intelligente Filterung**: Fokus auf KI, Data Science und Machine Learning

### KI-gestützte Newsletter-Generierung
- **Gemini AI Integration**: Nutzt Google's Gemini API für intelligente Zusammenfassungen
- **Studentenfreundlicher Ton**: Optimiert für Hochschulgruppen und Studierende
- **Faktentreue**: Basiert strikt auf echten Artikelinhalten ohne Erfindungen
- **Wöchentliche Digests**: Automatische Erstellung von strukturierten Newslettern

### Benutzerfreundliches Interface
- **Artikel-Management**: Einfache Auswahl und Verwaltung von Artikeln
- **Live-Vorschau**: Sofortige Ansicht der generierten Newsletter
- **Export-Funktionen**: Newsletter als Markdown oder HTML exportieren
- **Responsive Design**: Optimiert für Desktop und Mobile

## 🛠 Technologie-Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: shadcn/ui, Tailwind CSS
- **Backend**: Supabase (Database, Authentication, Edge Functions)
- **KI-Integration**: Google Gemini API
- **Version Control**: Git/GitHub

## 📋 Voraussetzungen

- Node.js (≥ 18.0.0)
- npm oder yarn
- Supabase Account
- Google Gemini API Key

## 🚀 Installation & Setup

### 1. Repository klonen

```bash
git clone <YOUR_REPOSITORY_URL>
cd ki-news-digest
```

### 2. Dependencies installieren

```bash
npm install
```

### 3. Umgebung konfigurieren

Das Projekt nutzt Supabase für Backend-Services. Die Konfiguration erfolgt über:

- **Supabase Projekt ID**: `aggkhetcdjmggqjzelgd`
- **Supabase URL**: Automatisch konfiguriert
- **API Keys**: Werden sicher über Supabase Secrets verwaltet

### 4. API-Keys konfigurieren

#### Gemini API Key (Erforderlich)
1. Besuche [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Erstelle einen neuen API-Key
3. Füge den Key in Supabase Secrets als `GEMINI_API_KEY` hinzu

#### RSS2JSON API Key (Optional)
- Standard API-Key ist bereits konfiguriert
- Für erweiterte Nutzung: [RSS2JSON](https://rss2json.com/)

### 5. Entwicklungsserver starten

```bash
npm run dev
```

Die Anwendung ist dann unter `http://localhost:3000` verfügbar.

## 🏗 Projektstruktur

```
src/
├── components/          # React Komponenten
│   ├── ui/             # shadcn/ui Basis-Komponenten
│   ├── Header.tsx      # Hauptnavigation
│   ├── NewsCard.tsx    # Artikel-Anzeige
│   └── ...
├── services/           # Business Logic
│   ├── DecoderService.ts    # Gemini AI Integration
│   ├── NewsService.ts       # News-Aggregation
│   └── ...
├── types/              # TypeScript Definitionen
├── utils/              # Hilfsfunktionen
└── pages/              # Seiten-Komponenten

supabase/
├── functions/          # Edge Functions
│   ├── gemini-ai/     # Gemini API Integration
│   ├── fetch-rss/     # RSS Feed Processing
│   └── ...
└── config.toml        # Supabase Konfiguration
```

## 🔧 Konfiguration

### Supabase Edge Functions

Das Projekt nutzt mehrere Edge Functions:

- **`gemini-ai`**: Hauptfunktion für KI-Generierung
- **`fetch-rss`**: RSS-Feed Verarbeitung
- **`newsletter-send`**: E-Mail Versand
- **`auto-generate-newsletter`**: Automatische Newsletter-Erstellung

### Sicherheit

- ✅ **API-Keys**: Sicher in Supabase Secrets gespeichert
- ✅ **CORS**: Konfiguriert für sichere Cross-Origin Requests
- ✅ **Environment Variables**: Keine sensiblen Daten im Code
- ✅ **Edge Functions**: JWT-Verification optional konfigurierbar

## 📝 Verwendung

### Newsletter erstellen

1. **Artikel sammeln**: System sammelt automatisch aktuelle Tech-News
2. **Artikel auswählen**: Wähle relevante Artikel für den Newsletter
3. **KI-Generierung**: Klicke auf "Newsletter generieren"
4. **Vorschau & Export**: Überprüfe und exportiere den Newsletter

### Artikel-Management

- **Einzelne Artikel**: KI-Zusammenfassungen für jeden Artikel
- **Quellenfilterung**: Filter nach bestimmten News-Quellen
- **Kategorisierung**: Automatische Kategorisierung der Artikel
- **Duplikat-Erkennung**: Verhindert doppelte Artikel

### Admin-Features

- **RSS-Quellen verwalten**: Hinzufügen/Entfernen von News-Quellen
- **Newsletter-Archiv**: Vergangene Newsletter einsehen
- **Abonnenten-Management**: E-Mail-Listen verwalten


### Manuelles Deployment

```bash
# Build erstellen
npm run build

# Deploy auf beliebige Plattform
# (Vercel, Netlify, etc.)
```

## 🔄 Development Workflow

### Lokale Entwicklung

```bash
# Development Server
npm run dev

# Type Checking
npm run type-check

# Build testen
npm run build
```

### Supabase Development

```bash
# Lokale Supabase Instanz (optional)
npx supabase start

# Edge Functions lokal testen
npx supabase functions serve
```

## 📊 Features im Detail

### KI-Newsletter Generierung

- **Faktentreue Zusammenfassungen**: Basiert nur auf echten Artikelinhalten
- **Studentenfreundlicher Stil**: Optimiert für Hochschulgruppen
- **Strukturierte Ausgabe**: Konsistente Newsletter-Formatierung
- **LinkedIn Integration**: Automatische Social Media Verlinkung

### News-Aggregation

- **Multi-Source Support**: RSS, APIs, Web-Scraping
- **Intelligente Kategorisierung**: ML-basierte Artikel-Klassifizierung
- **Duplikat-Erkennung**: Verhindert redundante Inhalte
- **Real-time Updates**: Live-Aktualisierung der News

## 🛡 Sicherheit & Datenschutz

- **API-Key Sicherheit**: Alle Keys sicher in Supabase Secrets
- **CORS-Konfiguration**: Sichere Cross-Origin Requests
- **No-Log Policy**: Keine sensiblen Daten in Logs
- **GDPR-Konform**: Datenschutzfreundliche Newsletter-Abonnements

## 🤝 Contributing

1. Fork das Repository
2. Erstelle einen Feature Branch (`git checkout -b feature/amazing-feature`)
3. Committe deine Änderungen (`git commit -m 'Add amazing feature'`)
4. Push zum Branch (`git push origin feature/amazing-feature`)
5. Öffne eine Pull Request


## 📄 Lizenz

Dieses Projekt ist unter der MIT Lizenz veröffentlicht. Siehe `LICENSE` Datei für Details.

## 🙏 Danksagungen

- **Supabase**: Für Backend-as-a-Service
- **Google Gemini**: Für KI-Capabilities
- **The Decoder**: Für qualitativ hochwertige Tech-News

---

**Erstellt mit ❤️ für Studierende und Tech-Enthusiasten**

> Dieses Projekt wurde entwickelt, um Studierenden dabei zu helfen, bei den neuesten Entwicklungen in KI und Data Science auf dem Laufenden zu bleiben.
