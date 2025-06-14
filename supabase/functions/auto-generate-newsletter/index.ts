import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("=== AUTO NEWSLETTER GENERATION STARTED ===");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body for language preference
    let config = {};
    try {
      config = await req.json();
    } catch (e) {
      // Default empty object if no body
    }

    const { language = 'de' } = config;
    const isGerman = language === 'de';

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      const errorMsg = isGerman ? "Fehlende Supabase-Konfiguration" : "Missing Supabase configuration";
      throw new Error(errorMsg);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current date info
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentWeek = getWeekNumber(now);
    const dateRange = getWeekDateRange(currentWeek, currentYear, language);
    
    console.log(`Generating newsletter for week ${currentWeek}/${currentYear} in ${language.toUpperCase()}`);

    // Check if newsletter for this week already exists
    const { data: existingNewsletter } = await supabase
      .from('newsletter_archive')
      .select('id')
      .eq('week_number', currentWeek)
      .eq('year', currentYear)
      .eq('language', language)
      .single();

    if (existingNewsletter) {
      const weekLabel = isGerman ? 'KW' : 'Week';
      const message = isGerman 
        ? `Newsletter für ${weekLabel} ${currentWeek}/${currentYear} bereits vorhanden`
        : `Newsletter for ${weekLabel} ${currentWeek}/${currentYear} already exists`;
      
      console.log(message);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message,
          existing: true 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate realistic mock articles for students
    const mockArticles = await generateStudentFocusedMockArticles(currentWeek, currentYear, language);
    
    if (mockArticles.length === 0) {
      const errorMsg = isGerman ? "Keine Artikel gefunden" : "No articles found";
      throw new Error(errorMsg);
    }

    console.log(`Generated ${mockArticles.length} student-focused articles for newsletter`);

    // Generate newsletter content using Gemini AI with student-focused prompting
    const newsletterContent = await generateStudentNewsletterContent(
      currentWeek,
      currentYear,
      dateRange,
      mockArticles,
      language
    );

    if (!newsletterContent) {
      const errorMsg = isGerman ? "Newsletter-Generierung fehlgeschlagen" : "Newsletter generation failed";
      throw new Error(errorMsg);
    }

    const weekLabel = isGerman ? 'KW' : 'Week';
    const title = isGerman ? `LINKIT WEEKLY ${weekLabel} ${currentWeek}` : `LINKIT WEEKLY ${weekLabel} ${currentWeek}`;

    // Save to newsletter archive
    const { data: savedNewsletter, error: saveError } = await supabase
      .from('newsletter_archive')
      .insert({
        week_number: currentWeek,
        year: currentYear,
        title: title,
        content: newsletterContent,
        html_content: convertMarkdownToHTML(newsletterContent),
        date_range: dateRange,
        article_count: mockArticles.length,
        language: language
      })
      .select()
      .single();

    if (saveError) {
      const errorMsg = isGerman ? `Fehler beim Speichern: ${saveError.message}` : `Save error: ${saveError.message}`;
      throw new Error(errorMsg);
    }

    console.log(`✅ Newsletter successfully saved with ID: ${savedNewsletter.id}`);

    const successMessage = isGerman 
      ? `Newsletter für ${weekLabel} ${currentWeek}/${currentYear} erfolgreich generiert und gespeichert`
      : `Newsletter for ${weekLabel} ${currentWeek}/${currentYear} successfully generated and saved`;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: successMessage,
        newsletterId: savedNewsletter.id,
        articleCount: mockArticles.length,
        language: language
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("❌ Error in auto-generate-newsletter:", error);
    const errorMsg = language === 'de' ? "Newsletter-Generierung fehlgeschlagen" : "Newsletter generation failed";
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMsg, 
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Helper function to get week number
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Helper function to get week date range with language support
function getWeekDateRange(weekNumber: number, year: number, language = 'de'): string {
  const startDate = getDateOfISOWeek(weekNumber, year);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  
  const locale = language === 'de' ? 'de-DE' : 'en-US';
  const formatDate = (date: Date) => date.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  return `${formatDate(startDate)}–${formatDate(endDate)}`;
}

// Helper function to get date of ISO week
function getDateOfISOWeek(week: number, year: number): Date {
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  const dayOfWeek = simple.getDay();
  const date = simple;
  if (dayOfWeek <= 4) {
    date.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    date.setDate(simple.getDate() + 8 - simple.getDay());
  }
  return date;
}

// Generate student-focused mock articles with current AI trends for university students
async function generateStudentFocusedMockArticles(weekNumber: number, year: number, language = 'de') {
  const isGerman = language === 'de';
  
  if (isGerman) {
    return [
      {
        title: "PyTorch 2.3 bringt neue Features für studentische ML-Projekte",
        description: "Die neueste PyTorch-Version führt vereinfachte APIs für Einsteiger ein und verbessert die Performance für typische Uni-Projekte. Besonders die neue DataLoader-Optimierung und erweiterte GPU-Unterstützung sind für Studierende interessant, die an Abschlussarbeiten arbeiten.",
        link: "https://pytorch.org/blog/pytorch-2-3-release",
        pubDate: new Date().toISOString(),
        guid: `article-pytorch23-${Date.now()}`,
        sourceName: "PyTorch Blog"
      },
      {
        title: "Neue Kaggle Learn-Kurse zu Large Language Models kostenlos verfügbar",
        description: "Kaggle erweitert sein kostenloses Lernangebot um praktische LLM-Kurse. Die Kurse decken Fine-Tuning, Prompt Engineering und RAG-Systeme ab - perfekt für Studierende, die ihre Skills erweitern wollen. Inklusive Hands-on Notebooks und Zertifikaten.",
        link: "https://kaggle.com/learn/large-language-models",
        pubDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        guid: `article-kaggle-llm-${Date.now()}`,
        sourceName: "Kaggle"
      },
      {
        title: "Stanford veröffentlicht neue CS229 Machine Learning Kursmaterialien",
        description: "Die renommierte ML-Vorlesung von Stanford ist jetzt mit aktualisierten Inhalten zu Transformer-Architekturen und modernen Optimierungsverfahren verfügbar. Alle Lectures, Assignments und Lösungen sind frei zugänglich für Selbststudium.",
        link: "https://cs229.stanford.edu/syllabus-spring2024.html",
        pubDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        guid: `article-stanford-cs229-${Date.now()}`,
        sourceName: "Stanford CS"
      },
      {
        title: "GitHub Student Pack erweitert: Kostenloses GPT-4 für Studierende",
        description: "Das GitHub Student Developer Pack bietet jetzt kostenlosen Zugang zu OpenAI GPT-4 für Bildungszwecke. Studierende erhalten monatlich Credits für API-Calls und Zugang zu neuen Modellen. Ideal für Prototyping und Forschungsprojekte an der Uni.",
        link: "https://education.github.com/pack",
        pubDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        guid: `article-github-student-${Date.now()}`,
        sourceName: "GitHub Education"
      }
    ];
  } else {
    return [
      {
        title: "PyTorch 2.3 introduces new features for student ML projects",
        description: "The latest PyTorch version introduces simplified APIs for beginners and improves performance for typical university projects. The new DataLoader optimization and extended GPU support are particularly interesting for students working on thesis projects.",
        link: "https://pytorch.org/blog/pytorch-2-3-release",
        pubDate: new Date().toISOString(),
        guid: `article-pytorch23-${Date.now()}`,
        sourceName: "PyTorch Blog"
      },
      {
        title: "New Kaggle Learn courses on Large Language Models available for free",
        description: "Kaggle expands its free learning offerings with practical LLM courses. The courses cover fine-tuning, prompt engineering, and RAG systems - perfect for students looking to expand their skills. Includes hands-on notebooks and certificates.",
        link: "https://kaggle.com/learn/large-language-models",
        pubDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        guid: `article-kaggle-llm-${Date.now()}`,
        sourceName: "Kaggle"
      },
      {
        title: "Stanford releases new CS229 Machine Learning course materials",
        description: "The renowned ML lecture from Stanford is now available with updated content on Transformer architectures and modern optimization methods. All lectures, assignments and solutions are freely accessible for self-study.",
        link: "https://cs229.stanford.edu/syllabus-spring2024.html",
        pubDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        guid: `article-stanford-cs229-${Date.now()}`,
        sourceName: "Stanford CS"
      },
      {
        title: "GitHub Student Pack expanded: Free GPT-4 for students",
        description: "The GitHub Student Developer Pack now offers free access to OpenAI GPT-4 for educational purposes. Students receive monthly credits for API calls and access to new models. Ideal for prototyping and research projects at university.",
        link: "https://education.github.com/pack",
        pubDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        guid: `article-github-student-${Date.now()}`,
        sourceName: "GitHub Education"
      }
    ];
  }
}

// Generate student newsletter content with language support
async function generateStudentNewsletterContent(
  weekNumber: number, 
  year: number, 
  dateRange: string, 
  articles: any[],
  language = 'de'
): Promise<string> {
  try {
    // Use Gemini AI to generate newsletter content
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    
    if (!geminiApiKey) {
      console.warn('GEMINI_API_KEY not found, using fallback content');
      return generateStudentFallbackContent(weekNumber, year, dateRange, articles, language);
    }

    // Call gemini-ai function with language parameter
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration for Gemini call");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const digest = {
      weekNumber,
      year,
      dateRange,
      items: articles
    };

    const response = await supabase.functions.invoke('gemini-ai', {
      body: {
        action: 'generate-summary',
        data: {
          digest,
          selectedArticles: articles,
          language: language
        }
      }
    });

    if (response.error) {
      throw new Error(`Gemini AI error: ${response.error}`);
    }

    const result = response.data;
    
    if (result.summary) {
      return result.summary;
    } else {
      throw new Error('No summary returned from Gemini AI');
    }

  } catch (error) {
    console.error('Error generating newsletter with AI:', error);
    console.log('Falling back to static content');
    return generateStudentFallbackContent(weekNumber, year, dateRange, articles, language);
  }
}

// Generate fallback content with language support
function generateStudentFallbackContent(
  weekNumber: number, 
  year: number, 
  dateRange: string, 
  articles: any[],
  language = 'de'
): string {
  const isGerman = language === 'de';
  const weekLabel = isGerman ? 'KW' : 'Week';
  
  const greeting = isGerman ? 'Hey Leute!' : 'Hey everyone!';
  const intro = isGerman 
    ? `Willkommen zur ${weekLabel} ${weekNumber}! Hier sind die wichtigsten KI-News für euch zusammengefasst:`
    : `Welcome to ${weekLabel} ${weekNumber}! Here are the most important AI news summarized for you:`;
  
  const articleSections = articles.map((article, index) => {
    const articleLabel = isGerman ? 'Artikel' : 'Article';
    const readMore = isGerman ? 'Mehr dazu' : 'Read more';
    
    return `## ${articleLabel} ${index + 1}: ${article.title}

${article.description}

👉 **${readMore}:** [Link zum ${articleLabel}](${article.link})`;
  }).join('\n\n');

  const closing = isGerman 
    ? `Das war's für diese Woche! Bleibt neugierig und experimentiert weiter mit KI.

Euer LINKIT Team 🚀`
    : `That's it for this week! Stay curious and keep experimenting with AI.

Your LINKIT Team 🚀`;

  return `# 📬 LINKIT WEEKLY ${weekLabel} ${weekNumber}
**${isGerman ? 'Dein Update zu KI, Data Science und Industrie 4.0' : 'Your update on AI, Data Science and Industry 4.0'}**

${weekLabel} ${weekNumber} · ${dateRange}

${greeting}

${intro}

${articleSections}

---

${closing}`;
}

// Convert markdown to HTML (basic implementation)
function convertMarkdownToHTML(markdown: string): string {
  return markdown
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\n/g, '<br>')
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
}
