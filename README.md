# 🤖 LINKIT WEEKLY KI - Intelligenter Newsletter Generator

Ein vollautomatisches Newsletter-System, das KI- und Tech-News sammelt, analysiert und intelligente Newsletter für Studierende und Tech-Enthusiasten generiert.

## ✨ Neueste Features

### 🎯 **Top 10 Artikel-Ranking**
- **Intelligenter Scoring-Algorithmus**: Bewertet Artikel nach Relevanz, Aktualität und Quelle
- **Studenten-optimierte Ansicht**: Spezielle Filterung für Hochschul-relevante Inhalte
- **Konsistente Reihenfolge**: Synchronisierte Artikel-Rankings zwischen allen Ansichten

### 🧠 **KI-Powered Titel-Verbesserung**
- **Manuelle Titel-Optimierung**: 📝-Button neben jedem Artikel für KI-basierte Titel-Verbesserung
- **Persistente Speicherung**: Verbesserte Titel bleiben dauerhaft in der Datenbank gespeichert
- **On-Demand Processing**: Spart API-Kosten durch benutzergesteuerte Verbesserungen

### 🗑️ **Erweiterte Artikel-Verwaltung**
- **Permanente Löschung**: Artikel vollständig aus der Datenbank entfernen
- **Echtzeit-Synchronisation**: Änderungen werden sofort in allen Ansichten aktualisiert
- **Unified Management**: Einheitliche Lösch-Funktionalität in allen Komponenten

### 🎨 **Enhanced Glass Design**
- **Moderne UI**: Glasmorphismus-Design mit Blur-Effekten und Transparenz
- **Interactive Buttons**: Hover-Effekte und smooth Transitions
- **Responsive Layout**: Optimiert für alle Bildschirmgrößen

### 🔍 **Q&A System für Newsletter-Archive**
- **Intelligente Suche**: KI-basierte Abfragen zu vergangenen Newslettern
- **Chat-Interface**: Benutzerfreundliche Unterhaltung mit dem Newsletter-Archiv
- **Kontextuelle Antworten**: Referenziert spezifische Newsletter und Inhalte

## 🚀 Hauptfunktionen

### 📰 **Automatische News-Aggregation**
- **Multi-Source RSS**: The Decoder, TechCrunch, O'Reilly Radar und weitere
- **Wöchentliche Sammlung**: Automatische Artikel-Erfassung für aktuelle Kalenderwoche
- **Intelligent Filtering**: Fokus auf KI, Machine Learning, Startup-News und Tech-Trends
- **Duplikat-Vermeidung**: GUID-basierte Eindeutigkeit verhindert doppelte Artikel

### 🤖 **KI-gestützte Newsletter-Generierung**
- **Google Gemini Integration**: Nutzt Gemini 1.5 Flash für intelligente Zusammenfassungen
- **Faktentreue Generierung**: Strikt basierend auf echten Artikelinhalten ohne Halluzinationen
- **Studentenfreundlicher Ton**: Optimiert für Hochschulgruppen und Tech-Studierende
- **Strukturierte Ausgabe**: Konsistente Markdown-Formatierung mit LinkedIn-Integration

### 📱 **Intuitive Benutzeroberfläche**
- **Article Cards**: Expandierbare Karten mit KI-Zusammenfassungen und Metadaten
- **View Toggles**: Wechsel zwischen "Top 10" und "Alle Artikel" Ansichten
- **Real-time Updates**: Live-Aktualisierung ohne Seitenneuladen
- **Mobile-First Design**: Vollständig responsive für alle Geräte

### 📊 **Newsletter-Archiv & Management**
- **Automatische Archivierung**: Generierte Newsletter werden automatisch gespeichert
- **Suchfunktion**: Durchsuchung vergangener Newsletter nach Woche/Jahr
- **Export-Optionen**: Newsletter als Markdown, HTML oder E-Mail-Template
- **Abonnenten-Verwaltung**: E-Mail-Listen und Versand-Management

## 🛠 Technologie-Stack

### Frontend
- **React 18** mit TypeScript für typsichere Entwicklung
- **Vite** als Build-Tool für schnelle Entwicklung
- **Tailwind CSS** für utility-first Styling
- **shadcn/ui** für konsistente UI-Komponenten
- **Lucide Icons** für moderne Icon-Sets

### Backend & Services
- **Supabase** als Backend-as-a-Service
  - PostgreSQL Datenbank
  - Real-time Subscriptions
  - Edge Functions (Deno Runtime)
  - Authentication & Row Level Security
- **Google Gemini API** für KI-Textgenerierung
- **RSS2JSON** für RSS-Feed-Verarbeitung

### Architecture
- **Edge Functions**: Serverless Deno-basierte API-Endpunkte
- **TypeScript Services**: Modulare Business-Logic-Schicht
- **Component-Based**: Wiederverwendbare React-Komponenten
- **Progressive Enhancement**: Funktioniert auch bei JS-Deaktivierung

## 📋 Voraussetzungen

- **Node.js** ≥ 18.0.0
- **npm** oder **yarn** Package Manager
- **Supabase Account** (kostenlos verfügbar)
- **Google Gemini API Key** (kostenlose Quota verfügbar)

## 🚀 Installation & Setup

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
Die Anwendung ist unter **http://localhost:8082/** verfügbar.

### 4. Gemini API Key konfigurieren (für Newsletter-Generierung)

#### Option A: Supabase Dashboard
1. Besuche [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Erstelle einen neuen API-Key
3. Gehe zu [Supabase Dashboard](https://supabase.com/dashboard)
4. Wähle Projekt `aggkhetcdjmggqjzelgd`
5. **Edge Functions** → **Settings** → **Environment Variables**
6. Füge hinzu: `GEMINI_API_KEY = AIzaSy...`

#### Option B: Debug-Tools verwenden
1. Öffne die Anwendung
2. Klicke auf **"Gemini API Test"** (roter Button)
3. Folge den Anweisungen zur API-Key-Konfiguration

## 🏗 Projektstruktur

```
src/
├── components/              # React UI-Komponenten
│   ├── ui/                 # shadcn/ui Basis-Komponenten
│   ├── Header.tsx          # Hauptnavigation mit Glass-Design
│   ├── NewsCard.tsx        # Artikel-Karten mit KI-Features
│   ├── WeeklyDigest.tsx    # Newsletter-Generator
│   ├── ArticleRanking.tsx  # Top-10-Auswahl mit Lösch-Funktion
│   └── NewsletterArchiveQA.tsx # Q&A-System für Archive
├── services/               # Business Logic Layer
│   ├── NewsService.ts      # Haupt-News-Service
│   ├── DecoderService.ts   # Gemini AI Integration
│   ├── RawArticleService.ts # Datenbank-Operations
│   └── NewsletterArchiveService.ts # Archiv-Management
├── pages/                  # Hauptseiten-Komponenten
│   ├── Index.tsx          # Hauptseite mit Artikel-Übersicht
│   ├── StudentNews.tsx    # Studenten-optimierte Ansicht
│   └── ArchiveQA.tsx      # Newsletter-Archiv mit Q&A
├── types/                  # TypeScript-Definitionen
└── utils/                  # Hilfsfunktionen

supabase/
├── functions/              # Edge Functions (Deno)
│   ├── gemini-ai/         # KI-Integration (Titel, Summaries, Q&A)
│   ├── fetch-rss/         # RSS-Feed-Verarbeitung
│   ├── auto-generate-newsletter/ # Automatische Newsletter-Erstellung
│   └── newsletter-*/      # E-Mail-Versand-Services
└── config.toml            # Supabase-Konfiguration
```

## 📝 Verwendung

### Artikel-Management
1. **RSS Debug Test**: Orange Button zum Testen der Artikel-Ladung
2. **Artikel-Ansicht**: Toggle zwischen "Top 10" und "Alle Artikel"
3. **Titel verbessern**: 📝-Button neben Artikeln für KI-Optimierung
4. **Artikel löschen**: 🗑️-Button für permanente Entfernung

### Newsletter erstellen
1. **Artikel auswählen**: "Top 10 bearbeiten" für manuelle Auswahl
2. **Ranking anpassen**: Artikel per Drag & Drop sortieren
3. **Löschen**: Unerwünschte Artikel permanent entfernen
4. **Generieren**: "Newsletter erstellen" für KI-basierte Zusammenfassung
5. **Archivieren**: Automatische Speicherung im Newsletter-Archiv

### Q&A mit Newsletter-Archiv
1. **Archiv öffnen**: Navigation zu "Newsletter Archiv & Q&A"
2. **Frage stellen**: Natürlichsprachliche Abfragen zu vergangenen Newslettern
3. **Kontextuelle Antworten**: KI referenziert spezifische Newsletter-Inhalte

### Studenten-Ansicht
1. **Top 10 für Studenten**: Spezielle Filterung für Hochschul-relevante Artikel
2. **Konsistente Rankings**: Gleiche Basis-Algorithmen wie Haupt-Newsletter
3. **Relevanz-Filter**: Fokus auf Karriere, Programmierung, KI-Trends

## 🔄 Automatisierung

### RSS-Feed-Sammlung
```bash
# Manuelle Auslösung über Debug-Button
# Oder automatisch via Supabase Cron Jobs (täglich 10:00, 16:00, 22:00 MEZ)
```

### Newsletter-Generierung
```bash
# Automatische wöchentliche Generierung
# Konfigurierbar über Supabase Dashboard → Integrations → Cron
```

### Tägliche Artikel-Ladung (Setup)
```sql
-- Über Supabase Dashboard → Database → SQL Editor
select cron.schedule(
  'fetch-articles-morning',
  '0 8 * * *',  -- 10:00 MEZ
  'https://aggkhetcdjmggqjzelgd.supabase.co/functions/v1/cron-trigger'
);
```

## 🛡 Sicherheit & Performance

### API-Sicherheit
- ✅ **Environment Variables**: Sensitive Daten in Supabase Secrets
- ✅ **CORS-Konfiguration**: Sichere Cross-Origin-Requests
- ✅ **Rate Limiting**: Schutz vor API-Missbrauch
- ✅ **JWT-Authentication**: Optional für erweiterte Sicherheit

### Performance-Optimierungen
- ✅ **Lazy Loading**: Komponenten laden on-demand
- ✅ **Memoization**: React.memo für teure Berechnungen
- ✅ **Edge Functions**: Globale CDN-Distribution
- ✅ **Database Indexing**: Optimierte Abfragen für schnelle Suche

### Datenqualität
- ✅ **Duplikat-Vermeidung**: GUID-basierte Eindeutigkeit
- ✅ **Content Validation**: Automatische Qualitätsprüfung
- ✅ **Error Handling**: Graceful Degradation bei API-Fehlern
- ✅ **Fallback-Mechanismen**: Alternative Datenquellen

## 🎯 Roadmap

### Q1 2025
- [ ] **Social Media Integration**: Automatisches Teilen auf LinkedIn/Twitter
- [ ] **Advanced Analytics**: Engagement-Tracking für Newsletter
- [ ] **Multi-Language Support**: Englische Newsletter-Generierung

### Q2 2025
- [ ] **Custom RSS Sources**: Benutzer können eigene Quellen hinzufügen
- [ ] **AI Content Moderation**: Automatische Qualitätsbewertung
- [ ] **Export Templates**: Verschiedene Newsletter-Formate

## 🤝 Contributing

1. **Fork** das Repository
2. **Feature Branch** erstellen: `git checkout -b feature/amazing-feature`
3. **Commit** Änderungen: `git commit -m 'Add amazing feature'`
4. **Push** zum Branch: `git push origin feature/amazing-feature`
5. **Pull Request** öffnen

## 📄 Lizenz

Dieses Projekt ist unter der MIT License lizenziert - siehe [LICENSE](LICENSE) für Details.

## 🆘 Support

### Debug-Tools
- **RSS Debug Test**: Orange Button zum Testen der Artikel-Ladung
- **Gemini API Test**: Roter Button zum Testen der KI-Integration
- **Browser Console**: Detaillierte Logs für Fehlerdiagnose

### Häufige Probleme
- **Newsletter-Generierung funktioniert nicht**: Gemini API Key in Supabase konfigurieren
- **Keine Artikel geladen**: RSS Debug Test ausführen
- **Titel-Verbesserung fehlgeschlagen**: API-Quota überprüfen

### Kontakt
- **GitHub Issues**: Für Bug-Reports und Feature-Requests
- **E-Mail**: [support@linkit-ka.de](mailto:support@linkit-ka.de)
- **LinkedIn**: [LINKIT Karlsruhe](https://www.linkedin.com/company/linkit-karlsruhe)

---

**Entwickelt mit ❤️ von LINKIT Karlsruhe für die Tech-Community**
