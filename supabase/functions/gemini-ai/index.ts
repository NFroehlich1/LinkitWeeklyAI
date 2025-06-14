import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    
    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY not found in environment');
      return new Response(
        JSON.stringify({ error: 'Gemini API Key not configured' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { action, data } = await req.json();

    switch (action) {
      case 'verify-key':
        return await verifyGeminiKey(geminiApiKey);
      
      case 'generate-summary':
        return await generateSummary(geminiApiKey, data);
      
      case 'generate-article-summary':
        return await generateArticleSummary(geminiApiKey, data);
      
      case 'improve-article-title':
        return await improveArticleTitle(geminiApiKey, data);
      
      case 'qa-with-newsletter':
        return await qaWithNewsletter(geminiApiKey, data);
      
      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }), 
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }
  } catch (error) {
    console.error('Error in gemini-ai function:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function verifyGeminiKey(apiKey: string) {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: "Test"
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 10,
        }
      })
    });

    if (response.ok) {
      return new Response(
        JSON.stringify({ isValid: true, message: "Gemini API key is valid" }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      const errorData = await response.json().catch(() => null);
      const errorMessage = errorData?.error?.message || `HTTP ${response.status}`;
      return new Response(
        JSON.stringify({ isValid: false, message: `API key invalid: ${errorMessage}` }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ isValid: false, message: `Connection error: ${error.message}` }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function generateSummary(apiKey: string, data: any) {
  const { digest, selectedArticles, linkedInPage, language = 'de' } = data;
  const articlesToUse = selectedArticles || digest.items;
  const isGerman = language === 'de';
  
  if (articlesToUse.length === 0) {
    const errorMsg = isGerman ? "Keine Artikel für die Zusammenfassung verfügbar" : "No articles available for summary";
    return new Response(
      JSON.stringify({ error: errorMsg }), 
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  // Create language-specific article details
  const articleDetails = articlesToUse.map((article: any, index: number) => `
**${isGerman ? 'ARTIKEL' : 'ARTICLE'} ${index + 1}:**
${isGerman ? 'Titel' : 'Title'}: "${article.title}"
${isGerman ? 'Beschreibung' : 'Description'}: "${article.description || (isGerman ? 'Keine Beschreibung verfügbar' : 'No description available')}"
${isGerman ? 'Quelle' : 'Source'}: ${article.sourceName || (isGerman ? 'Unbekannte Quelle' : 'Unknown Source')}
${isGerman ? 'Datum' : 'Date'}: ${article.pubDate}
Link: ${article.link}
${article.content ? `${isGerman ? 'Inhalt' : 'Content'}: "${article.content.substring(0, 500)}..."` : ''}
`).join('\n');

  // Language-specific newsletter prompts
  const prompt = isGerman ? `Du schreibst als Student für Studenten den Newsletter "LINKIT WEEKLY" - für eine HOCHSCHULGRUPPE zu KI, Data Science und Machine Learning. 

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

WICHTIG: Bleibe strikt bei den Inhalten der bereitgestellten Artikel. Erfinde keine Details, Kurse oder technischen Zusammenhänge, die nicht explizit erwähnt werden! Verwende eine natürliche, studentische Begrüßung OHNE formelle Glückwünsche!` : 

`You are writing as a student for students the newsletter "LINKIT WEEKLY" - for a UNIVERSITY GROUP about AI, Data Science and Machine Learning.

**TARGET AUDIENCE:**
- Students in Computer Science, Data Science, Mathematics, Engineering
- Bachelor and Master students interested in AI and ML
- Young people looking for practical applications and career opportunities
- Community of tech-enthusiastic students

**STRICT RULES FOR FACTUAL ACCURACY:**
- Use EXCLUSIVELY information from the provided articles
- NEVER invent references to specific university courses or professors
- NEVER invent technical details not mentioned in the articles
- When making connections to study content, stay general ("in ML courses", "in Data Science projects")
- Do NOT use specific course names like "CS229" or "Deep Learning Lecture"

**NEWSLETTER STYLE (natural and student-friendly):**
- Start with natural, casual greetings like "Hi!", "What's up!", "Hey everyone!", "Hey folks!" or simply "Hey"
- AVOID formal greetings like "Congratulations", "Welcome to our newsletter" or stiff formulations
- Write directly and personally ("you", "your"), but authentically and relaxed
- Avoid excessive formality or business language
- Be enthusiastic but natural - like a student writing to other students
- Focus on practical relevance for studies

**STRUCTURE for Week ${digest.weekNumber}/${digest.year} (${digest.dateRange}):**

# 📬 LINKIT WEEKLY Week ${digest.weekNumber}
**Your update on AI, Data Science and Industry 4.0**

Week ${digest.weekNumber} · ${digest.dateRange}

**Intro with natural, casual greeting:**
- Use a relaxed, authentic greeting (NO formal congratulations!)
- Brief, personal introduction without clichés
- What to expect this week

**Main section - Article analyses (ONLY based on real content):**
For each article:
- **Meaningful headline** with the core of the article
- 2-3 paragraphs detailed analysis of the ACTUAL content
- **Why this is relevant for you:** Practical significance for students
- General connections to study content (WITHOUT specific course names)
- Possible applications in your own projects
- 👉 **Read more** [Link to article]

**Conclusion:**
- Summary of the most important insights
- Casual ending with community call

**IMPORTANT STYLE ELEMENTS:**
- Authentic, casual language without formalities or stiff greetings
- Explain AI concepts understandably, but stick to facts
- Mention tools and technologies only if they appear in the articles
- At least 1500-2000 words for detailed analyses
- Enthusiastic but fact-based tone like among students

**NEWSLETTER CONTENT based on these articles:**
${articleDetails}

IMPORTANT: Stay strictly with the content of the provided articles. Don't invent details, courses or technical connections not explicitly mentioned! Use a natural, student greeting WITHOUT formal congratulations!`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4000,
        }
      })
    });

    const result = await response.json();
    
    if (result.candidates && result.candidates[0]?.content?.parts?.[0]?.text) {
      const summary = result.candidates[0].content.parts[0].text;
      return new Response(
        JSON.stringify({ summary }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      const errorMsg = isGerman ? "Keine gültige Antwort von Gemini erhalten" : "No valid response received from Gemini";
      return new Response(
        JSON.stringify({ error: errorMsg, details: result }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (error) {
    console.error('Error generating summary:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function generateArticleSummary(apiKey: string, data: any) {
  const { article, language = 'de' } = data;
  const isGerman = language === 'de';
  
  if (!article || !article.title) {
    const errorMsg = isGerman ? "Artikel-Daten fehlen" : "Article data missing";
    return new Response(
      JSON.stringify({ error: errorMsg }), 
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  const prompt = isGerman ? 
    `Du hilfst Studierenden einer KI und Data Science Hochschulgruppe beim Verstehen von tech-Artikeln von "The Decoder" und ähnlichen KI-News-Quellen.

WICHTIG: Verwende nur Informationen aus dem bereitgestellten Artikel. Erfinde keine Details oder Verbindungen, die nicht explizit erwähnt werden.

Fasse diesen deutschen KI-Artikel in 2-3 prägnanten Sätzen zusammen und erkläre kurz, warum er für Studierende relevant ist:

Titel: "${article.title}"
Beschreibung: "${article.description || 'Keine Beschreibung verfügbar'}"
Inhalt: "${article.content || article.description || 'Kein Inhalt verfügbar'}"
Quelle: ${article.sourceName || 'Unbekannte Quelle'}

ANWEISUNGEN:
1. Erstelle eine präzise 2-3 Satz Zusammenfassung des TATSÄCHLICHEN Artikelinhalts
2. Erkläre in 1-2 Sätzen die Relevanz für KI/Data Science Studierende
3. Verwende eine freundliche, studentische Sprache
4. Bleibe bei den Fakten aus dem Artikel - erfinde nichts dazu

Antworte auf Deutsch und basiere deine Zusammenfassung nur auf den tatsächlichen Inhalten des Artikels.` :

    `You help students from an AI and Data Science university group understand tech articles from "The Decoder" and similar AI news sources.

IMPORTANT: Use only information from the provided article. Don't invent details or connections not explicitly mentioned.

Summarize this AI article in 2-3 concise sentences and briefly explain why it's relevant for students:

Title: "${article.title}"
Description: "${article.description || 'No description available'}"
Content: "${article.content || article.description || 'No content available'}"
Source: ${article.sourceName || 'Unknown source'}

INSTRUCTIONS:
1. Create a precise 2-3 sentence summary of the ACTUAL article content
2. Explain in 1-2 sentences the relevance for AI/Data Science students
3. Use friendly, student-oriented language
4. Stick to facts from the article - don't invent anything

Answer in English and base your summary only on the actual content of the article.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 400,
        }
      })
    });

    const result = await response.json();
    
    if (result.candidates && result.candidates[0]?.content?.parts?.[0]?.text) {
      const summary = result.candidates[0].content.parts[0].text;
      return new Response(
        JSON.stringify({ summary }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      const errorMsg = isGerman ? "Keine gültige Antwort von Gemini erhalten" : "No valid response received from Gemini";
      return new Response(
        JSON.stringify({ error: errorMsg }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (error) {
    console.error('Error generating article summary:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function improveArticleTitle(apiKey: string, data: any) {
  const { article, language = 'de' } = data;
  const isGerman = language === 'de';
  
  if (!article || !article.title) {
    const errorMsg = isGerman ? "Artikel-Daten für Titel-Verbesserung fehlen" : "Article data for title improvement missing";
    return new Response(
      JSON.stringify({ error: errorMsg }), 
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  const prompt = isGerman ?
    `Du hilfst dabei, Artikel-Titel für eine deutsche KI und Data Science Hochschulgruppe zu verbessern.

Verbessere den folgenden Artikel-Titel, damit er für deutsche KI/Data Science Studierende ansprechender und verständlicher wird:

Aktueller Titel: "${article.title}"
Beschreibung: "${article.description || 'Keine Beschreibung verfügbar'}"

ANWEISUNGEN:
1. Mache den Titel prägnanter und studentenfreundlicher
2. Verwende deutsche Begriffe, die für Studierende verständlich sind
3. Bewahre die Kernaussage des ursprünglichen Titels
4. Mache ihn interessanter ohne zu übertreiben
5. Maximal 10-12 Wörter

Antworte NUR mit dem verbesserten Titel auf Deutsch.` :

    `You help improve article titles for a German AI and Data Science university group.

Improve the following article title to make it more appealing and understandable for AI/Data Science students:

Current title: "${article.title}"
Description: "${article.description || 'No description available'}"

INSTRUCTIONS:
1. Make the title more concise and student-friendly
2. Use English terms that are understandable for students
3. Preserve the core message of the original title
4. Make it more interesting without exaggerating
5. Maximum 10-12 words

Respond ONLY with the improved title in English.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 100,
        }
      })
    });

    const result = await response.json();
    
    if (result.candidates && result.candidates[0]?.content?.parts?.[0]?.text) {
      const improvedTitle = result.candidates[0].content.parts[0].text.trim();
      return new Response(
        JSON.stringify({ improvedTitle }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      const errorMsg = isGerman ? "Keine gültige Antwort von Gemini erhalten" : "No valid response received from Gemini";
      return new Response(
        JSON.stringify({ error: errorMsg }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (error) {
    console.error('Error improving article title:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function qaWithNewsletter(apiKey: string, data: any) {
  const { question, newsletter, language = 'de' } = data;
  const isGerman = language === 'de';
  
  if (!question || !newsletter) {
    const errorMsg = isGerman ? "Frage oder Newsletter-Inhalt fehlt" : "Question or newsletter content missing";
    return new Response(
      JSON.stringify({ error: errorMsg }), 
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  const prompt = isGerman ?
    `Du bist ein hilfsreicher Assistent für Studierende einer KI und Data Science Hochschulgruppe. Beantworte die folgende Frage basierend auf dem bereitgestellten Newsletter-Inhalt und den Artikeln.

NEWSLETTER/ARTIKEL-INHALT:
${newsletter}

FRAGE: ${question}

ANWEISUNGEN:
1. Beantworte die Frage detailliert und hilfreich auf Deutsch
2. Verwende nur Informationen aus dem bereitgestellten Newsletter/Artikel-Inhalt
3. Wenn du auf spezifische Artikel verweist, verwende das Format "Artikel X" (z.B. "Artikel 1", "Artikel 2")
4. Erkläre komplexe Konzepte studentenfreundlich
5. Bleibe bei den Fakten - erfinde keine zusätzlichen Details

Gib eine ausführliche, hilfreiche Antwort auf Deutsch.` :

    `You are a helpful assistant for students of an AI and Data Science university group. Answer the following question based on the provided newsletter content and articles.

NEWSLETTER/ARTICLE CONTENT:
${newsletter}

QUESTION: ${question}

INSTRUCTIONS:
1. Answer the question in detail and helpfully in English
2. Use only information from the provided newsletter/article content
3. When referring to specific articles, use the format "Article X" (e.g. "Article 1", "Article 2")
4. Explain complex concepts in a student-friendly way
5. Stick to facts - don't invent additional details

Give a comprehensive, helpful answer in English.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        }
      })
    });

    const result = await response.json();
    
    if (result.candidates && result.candidates[0]?.content?.parts?.[0]?.text) {
      const content = result.candidates[0].content.parts[0].text;
      return new Response(
        JSON.stringify({ content, answer: content }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      const errorMsg = isGerman ? "Keine gültige Antwort von Gemini erhalten" : "No valid response received from Gemini";
      return new Response(
        JSON.stringify({ error: errorMsg }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (error) {
    console.error('Error in QA with newsletter:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
