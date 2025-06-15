import { RssItem, WeeklyDigest } from "@/types/newsTypes";
import { supabase } from "@/integrations/supabase/client";

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message: string;
  };
}

interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
  generationConfig: {
    temperature: number;
    topK?: number;
    topP?: number;
    maxOutputTokens: number;
  };
}

class GeminiService {
  private apiKey: string | null = null;
  private keyRetrievalPromise: Promise<string> | null = null;
  private isKeyValid: boolean = false;

  constructor() {
    console.log("🤖 GeminiService initialized - using hybrid approach: Supabase key retrieval + direct API calls");
  }

  private async retrieveApiKey(): Promise<string> {
    // If we already have a key retrieval in progress, wait for it
    if (this.keyRetrievalPromise) {
      return this.keyRetrievalPromise;
    }

    // If we already have a cached valid key, return it
    if (this.apiKey && this.isKeyValid) {
      return this.apiKey;
    }

    console.log("🔑 Retrieving Gemini API key from Supabase...");

    this.keyRetrievalPromise = (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-gemini-key');

        if (error) {
          console.error("❌ Supabase function error:", error);
          throw new Error(`Fehler beim Abrufen des API Keys: ${error.message}`);
        }

        if (!data.success || !data.apiKey) {
          console.error("❌ No valid API key returned:", data);
          throw new Error(data.error || "Kein gültiger API Key verfügbar");
        }

        console.log("✅ API key retrieved and validated via Supabase");
        this.apiKey = data.apiKey;
        this.isKeyValid = true;
        
        // Clear the promise so future calls can cache the result
        this.keyRetrievalPromise = null;
        
        return this.apiKey;

      } catch (error) {
        this.keyRetrievalPromise = null; // Clear failed promise
        this.isKeyValid = false;
        throw error;
      }
    })();

    return this.keyRetrievalPromise;
  }

  async verifyApiKey(): Promise<{ isValid: boolean; message: string }> {
    try {
      console.log("🔍 Verifying Gemini API key...");
      
      await this.retrieveApiKey();
      
      return {
        isValid: true,
        message: "Gemini API-Schlüssel ist gültig (sicher aus Supabase abgerufen)"
      };
      
    } catch (error) {
      console.error("❌ API key verification failed:", error);
      this.isKeyValid = false;
      
      return {
        isValid: false,
        message: `API-Schlüssel Problem: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
      };
    }
  }

  async getKeySource(): Promise<'supabase' | 'none'> {
    try {
      await this.retrieveApiKey();
      return 'supabase';
    } catch {
      return 'none';
    }
  }

  private async callGeminiAPI(request: GeminiRequest): Promise<GeminiResponse> {
    const apiKey = await this.retrieveApiKey();
    
    console.log("🚀 Making direct call to Gemini API...");
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMessage = errorData?.error?.message || `HTTP ${response.status}`;
      
      // If it's an auth error, invalidate our cached key
      if (response.status === 401 || response.status === 403) {
        console.warn("🔄 API key seems invalid, clearing cache...");
        this.apiKey = null;
        this.isKeyValid = false;
        this.keyRetrievalPromise = null;
      }
      
      throw new Error(`Gemini API Fehler: ${errorMessage}`);
    }

    return await response.json();
  }

  async generateSummary(digest: WeeklyDigest, selectedArticles?: RssItem[], linkedInPage?: string): Promise<string> {
    const articlesToUse = selectedArticles || digest.items;
    
    if (articlesToUse.length === 0) {
      throw new Error("Keine Artikel für die Zusammenfassung verfügbar");
    }

    console.log(`📝 Generating newsletter summary for ${articlesToUse.length} articles...`);

    const articleDetails = articlesToUse.map((article, index) => `
**ARTIKEL ${index + 1}:**
Titel: "${article.title}"
Beschreibung: "${article.description || 'Keine Beschreibung verfügbar'}"
Quelle: ${article.sourceName || 'Unbekannte Quelle'}
Datum: ${article.pubDate}
Link: ${article.link}
${article.content ? `Inhalt: "${article.content.substring(0, 500)}..."` : ''}
`).join('\n');

    const prompt = `Du schreibst als Student für Studenten den Newsletter "LINKIT WEEKLY" - für eine HOCHSCHULGRUPPE zu KI, Data Science und Machine Learning.
 
**ZIELGRUPPE:**
- Studierende in Informatik, Data Science, Mathematik, Ingenieurswissenschaften
- Bachelor- und Master-Studierende, die sich für KI und ML interessieren
- Junge Menschen, die praktische Anwendungen und Karrierechancen suchen
- Community von tech-begeisterten Studierenden
 
**STRENGE REGELN FÜR FAKTISCHE GENAUIGKEIT:**
- Verwende AUSSCHLIESSLICH Informationen aus den bereitgestellten Artikeln
- ERFINDE NIEMALS Bezüge zu spezifischen Universitätskursen oder Professoren
- ERFINDE NIEMALS technische Details, die nicht in den Artikeln stehen
- Wenn du Verbindungen zu Studieninhalten herstellst, bleibe allgemein ("in ML-Kursen", "bei Data Science Projekten")
- Nutze KEINE spezifischen Kursnamen wie "CS229" oder "Deep Learning Vorlesung"
 
**NEWSLETTER-STIL (natürlich und studentenfreundlich):**
- Beginne mit natürlichen, lockeren Begrüßungen wie "Hi!", "Was geht ab!", "Servus zusammen!", "Hey Leute!" oder einfach "Hey"
- VERMEIDE formelle Begrüßungen wie "Herzlichen Glückwunsch", "Willkommen zu unserem Newsletter" oder steife Formulierungen
- Schreibe direkt und persönlich ("ihr", "euch"), aber authentisch und entspannt
- Vermeide übertriebene Förmlichkeit oder Business-Sprache
- Sei enthusiastisch aber natürlich - wie ein Student, der anderen Studenten schreibt
- Fokus auf praktische Relevanz für das Studium
 
**STRUKTUR für KW ${digest.weekNumber}/${digest.year} (${digest.dateRange}):**
 
# 📬 LINKIT WEEKLY KW ${digest.weekNumber}
**Dein Update zu KI, Data Science und Industrie 4.0**
 
KW ${digest.weekNumber} · ${digest.dateRange}
 
**Intro mit natürlicher, lockerer Begrüßung:**
- Verwende eine entspannte, authentische Begrüßung (KEINE formellen Glückwünsche!)
- Kurzer, persönlicher Einstieg ohne Floskeln
- Was euch diese Woche erwartet
 
**Hauptteil - Artikel-Analysen (NUR basierend auf echten Inhalten):**
Für jeden Artikel:
- **Aussagekräftige Überschrift** mit dem Kern des Artikels
- 2-3 Absätze detaillierte Analyse der TATSÄCHLICHEN Inhalte
- **Warum das für euch relevant ist:** Praktische Bedeutung für Studierende
- Allgemeine Verbindungen zu Studieninhalten (OHNE spezifische Kursnamen)
- Mögliche Anwendungen in eigenen Projekten
- 👉 **Mehr dazu** [Link zum Artikel]
 
**Schlussteil:**
- Zusammenfassung der wichtigsten Erkenntnisse
- Lockerer Abschluss mit Community-Aufruf
 
**WICHTIGE STILELEMENTE:**
- Authentische, lockere Sprache ohne Förmlichkeiten oder steife Begrüßungen
- Erkläre KI-Konzepte verständlich, aber bleib bei den Fakten
- Erwähne Tools und Technologien nur, wenn sie in den Artikeln vorkommen
- Mindestens 1500-2000 Wörter für ausführliche Analysen
- Enthusiastischer aber faktenbasierter Ton wie unter Studierenden
 
**NEWSLETTER-INHALT basierend auf diesen Artikeln:**
${articleDetails}
 
WICHTIG: Bleibe strikt bei den Inhalten der bereitgestellten Artikel. Erfinde keine Details, Kurse oder technischen Zusammenhänge, die nicht explizit erwähnt werden! Verwende eine natürliche, studentische Begrüßung OHNE formelle Glückwünsche!`;

    const request: GeminiRequest = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        topK: 30,
        topP: 0.9,
        maxOutputTokens: 5000
      }
    };

    const response = await this.callGeminiAPI(request);
    
    if (!response.candidates || !response.candidates[0] || !response.candidates[0].content || 
        !response.candidates[0].content.parts || !response.candidates[0].content.parts[0]) {
      throw new Error("Unerwartete Antwort von der Gemini API");
    }

    let content = response.candidates[0].content.parts[0].text;
    
    if (!content || content.trim().length === 0) {
      throw new Error("Gemini API hat leeren Inhalt zurückgegeben");
    }

    // Add LinkedIn reference if provided and not present
    if (linkedInPage && !content.includes("linkedin.com/company/linkit-karlsruhe")) {
      content += `\n\n---\n\n**Bleibt connected! 🤝**\nFür weitere Updates, Diskussionen und Community-Events folgt uns auf [LinkedIn](${linkedInPage}). Dort teilen wir auch Infos zu Workshops, Gastvorträgen und Networking-Möglichkeiten!`;
    }

    console.log("✅ Newsletter summary generated successfully");
    return content;
  }

  async generateArticleSummary(article: RssItem, language?: string): Promise<string> {
    console.log('📰 Generating article summary for:', article.title);

    const articleContent = article.content || article.description || 'Nur Titel verfügbar';
    const cleanContent = articleContent.replace(/<[^>]*>/g, '').substring(0, 1000);

    const prompt = `Du hilfst Studierenden einer KI und Data Science Hochschulgruppe beim Verstehen von tech-Artikeln von "The Decoder" und ähnlichen KI-News-Quellen.
 
WICHTIG: Verwende nur Informationen aus dem bereitgestellten Artikel. Erfinde keine Details oder Verbindungen, die nicht explizit erwähnt werden.
 
Fasse diesen deutschen KI-Artikel in 2-3 prägnanten Sätzen zusammen und erkläre kurz, warum er für Studierende relevant ist:
             
**Titel:** ${article.title}
**Quelle:** ${article.sourceName || 'The Decoder'}
**Inhalt/Beschreibung:** ${cleanContent}
**Link:** ${article.link}
 
**Aufgabe:**
1. Erstelle eine präzise 2-3 Satz Zusammenfassung des TATSÄCHLICHEN Artikelinhalts
2. Erkläre die praktische Relevanz für KI/Data Science Studierende
3. Verwende einen lockeren, studentenfreundlichen Ton
4. Bleibe bei den Fakten aus dem Artikel - erfinde nichts dazu
 
Stil: Faktisch korrekt, wissenschaftlich aber zugänglich, direkt und studentenfreundlich. Fokus auf praktische Anwendungen im Studium, aber nur basierend auf den tatsächlichen Inhalten des Artikels.`;

    const request: GeminiRequest = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 300
      }
    };

    const response = await this.callGeminiAPI(request);
    
    if (!response.candidates || !response.candidates[0] || !response.candidates[0].content || 
        !response.candidates[0].content.parts || !response.candidates[0].content.parts[0]) {
      throw new Error("Unerwartete Antwort von der Gemini API");
    }

    const summary = response.candidates[0].content.parts[0].text;
    
    if (!summary) {
      throw new Error("Keine Zusammenfassung generiert");
    }

    console.log('✅ Article summary generated successfully');
    return summary;
  }

  async improveArticleTitle(article: RssItem): Promise<string> {
    console.log('✏️ Improving article title for:', article.title);

    const prompt = `Du hilfst dabei, Artikel-Titel für eine deutsche KI und Data Science Hochschulgruppe zu verbessern.
 
Verbessere den folgenden Artikel-Titel, damit er für deutsche KI/Data Science Studierende ansprechender und verständlicher wird:
 
**Aktueller Titel:** ${article.title}
**Quelle:** ${article.sourceName || 'Unbekannt'}
**Link:** ${article.link}
${article.description ? `**Beschreibung:** ${article.description.substring(0, 200)}...` : ''}
 
**Aufgabe:**
1. Erstelle einen verbesserten deutschen Titel (max. 80 Zeichen)
2. Der Titel soll technisch korrekt aber studentenfreundlich sein
3. Verwende klare, präzise Sprache ohne Clickbait
4. Fokussiere auf die praktische Relevanz für KI/Data Science Studierende
5. Behebe sprachliche Fehler oder unklare Formulierungen
 
**Stil:** Professionell aber zugänglich, direkt und informativ. Der Titel soll das Interesse wecken ohne zu übertreiben.
 
Antworte nur mit dem verbesserten Titel, ohne zusätzliche Erklärungen oder Anführungszeichen.`;

    const request: GeminiRequest = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 100
      }
    };

    const response = await this.callGeminiAPI(request);
    
    if (!response.candidates || !response.candidates[0] || !response.candidates[0].content || 
        !response.candidates[0].content.parts || !response.candidates[0].content.parts[0]) {
      throw new Error("Unerwartete Antwort von der Gemini API");
    }

    const improvedTitle = response.candidates[0].content.parts[0].text?.trim();
    
    if (!improvedTitle) {
      throw new Error("Kein verbesserter Titel generiert");
    }

    console.log('✅ Article title improved successfully');
    return improvedTitle;
  }

  async qaWithNewsletter(question: string, newsletter: string): Promise<string> {
    if (!question || !newsletter) {
      throw new Error("Frage und Newsletter-Inhalt sind erforderlich");
    }

    console.log('❓ Processing Q&A with newsletter...');

    const prompt = `Beantworte die Frage bezugnehmend auf: ${newsletter}
 
Die Frage lautet: ${question}
 
Anweisungen:
- Beziehe dich nur auf die Informationen aus dem bereitgestellten Newsletter-Inhalt
- Antworte präzise und hilfreich auf Deutsch
- Falls die Information nicht im Newsletter-Inhalt vorhanden ist, sage das ehrlich
- Strukturiere deine Antwort klar und verständlich für Studierende
- Verwende einen freundlichen, aber informativen Ton`;

    const request: GeminiRequest = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048
      }
    };

    const response = await this.callGeminiAPI(request);
    
    if (!response.candidates || !response.candidates[0] || !response.candidates[0].content || 
        !response.candidates[0].content.parts || !response.candidates[0].content.parts[0]) {
      throw new Error("Unerwartete Antwort von der Gemini API");
    }

    const content = response.candidates[0].content.parts[0].text;
    
    if (!content) {
      throw new Error("Keine Antwort generiert");
    }

    console.log('✅ Q&A answered successfully');
    return content;
  }

  // Method to clear cached key (useful for testing or key rotation)
  clearCache(): void {
    console.log("🔄 Clearing cached API key");
    this.apiKey = null;
    this.isKeyValid = false;
    this.keyRetrievalPromise = null;
  }
}

// Export singleton instance
export const geminiService = new GeminiService();
export default GeminiService; 