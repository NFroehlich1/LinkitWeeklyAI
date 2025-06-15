import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import { parseString } from 'xml2js';

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Supabase client with service role key to access secrets
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Function to get secrets from Supabase
async function getSecret(secretName) {
  try {
    // Method 1: Try environment variable first
    if (process.env[secretName]) {
      return process.env[secretName];
    }

    // Method 2: Try Supabase Vault (if configured)
    try {
      const { data, error } = await supabase.rpc('vault.read_secret', {
        secret_name: secretName
      });
      
      if (!error && data) {
        return data;
      }
    } catch (vaultError) {
      console.log(`Vault access failed for ${secretName}, trying direct env`);
    }

    // Method 3: Fallback to direct environment variable
    return process.env[secretName] || null;
  } catch (error) {
    console.error(`Error getting secret ${secretName}:`, error);
    return null;
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Gemini API Proxy
app.post('/api/gemini', async (req, res) => {
  try {
    console.log('🔥 Gemini API proxy called');
    
    const geminiApiKey = await getSecret('GEMINI_API_KEY');
    
    if (!geminiApiKey) {
      return res.status(500).json({ error: 'Gemini API Key not configured' });
    }

    const { action, data } = req.body;

    switch (action) {
      case 'verify-key':
        const verifyResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
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

        if (verifyResponse.ok) {
          res.json({ isValid: true, message: "Gemini API key is valid" });
        } else {
          const errorData = await verifyResponse.json().catch(() => null);
          const errorMessage = errorData?.error?.message || `HTTP ${verifyResponse.status}`;
          res.json({ isValid: false, message: `API key invalid: ${errorMessage}` });
        }
        break;

      case 'generate-summary':
      case 'generate-article-summary':
      case 'improve-article-title':
      case 'qa-with-newsletter':
        // Forward the actual Gemini API call
        const prompt = buildPromptForAction(action, data);
        
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 4096
            }
          })
        });

        if (!geminiResponse.ok) {
          const errorData = await geminiResponse.json().catch(() => null);
          throw new Error(`Gemini API Error: ${geminiResponse.status} - ${errorData?.error?.message || geminiResponse.statusText}`);
        }

        const geminiData = await geminiResponse.json();
        const content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
        
        res.json({ content, success: true });
        break;

      default:
        res.status(400).json({ error: 'Unknown action' });
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// RSS Fetch Proxy
app.post('/api/rss', async (req, res) => {
  try {
    console.log('📡 RSS fetch proxy called');
    
    const { url, source_name } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Determine the correct RSS feed URL
    let rssUrl = url;
    if (url === "https://the-decoder.de/" || url === "https://the-decoder.de") {
      rssUrl = "https://the-decoder.de/feed/";
    }

    // Fetch RSS feed
    const rssResponse = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RSS Reader)',
        'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml',
      },
    });

    if (!rssResponse.ok) {
      throw new Error(`RSS fetch failed: ${rssResponse.status} ${rssResponse.statusText}`);
    }

    const rssText = await rssResponse.text();
    
    // Parse XML to JSON
    const parsedData = await new Promise((resolve, reject) => {
      parseString(rssText, { 
        explicitArray: false,
        ignoreAttrs: false,
        trim: true,
        sanitize: true,
        normalize: true
      }, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });

    // Extract articles from parsed data
    const articles = extractArticles(parsedData, rssUrl);
    
    res.json({ 
      success: true,
      articles,
      source_url: rssUrl,
      source_name: source_name || getSourceName(rssUrl)
    });

  } catch (error) {
    console.error('RSS fetch error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      articles: []
    });
  }
});

// QA Archive Search Proxy
app.post('/api/qa-search', async (req, res) => {
  try {
    console.log('🔍 QA Archive search proxy called');
    
    const { action, query, yearFilter, weekFilter, limit = 10 } = req.body;

    if (!action || !query) {
      return res.status(400).json({ error: 'Action and query are required' });
    }

    // Build search query
    let dbQuery = supabase
      .from('newsletter_archive')
      .select('*')
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Apply filters
    if (yearFilter) {
      dbQuery = dbQuery.eq('year', yearFilter);
    }
    if (weekFilter) {
      dbQuery = dbQuery.eq('week_number', weekFilter);
    }

    const { data: newsletters, error: searchError } = await dbQuery;

    if (searchError) {
      throw new Error(`Search failed: ${searchError.message}`);
    }

    if (action === 'search') {
      res.json({ 
        newsletters,
        count: newsletters?.length || 0,
        query: query 
      });
      return;
    }

    if (action === 'qa') {
      const geminiApiKey = await getSecret('GEMINI_API_KEY');
      
      if (!geminiApiKey) {
        return res.status(500).json({ error: 'Gemini API Key not configured' });
      }

      // Combine relevant newsletters for Q&A
      const context = newsletters?.map(nl => 
        `Newsletter ${nl.year}/KW${nl.week_number}: ${nl.title}\n${nl.content.substring(0, 2000)}`
      ).join('\n\n---\n\n') || '';

      if (!context) {
        res.json({ 
          answer: 'Entschuldigung, ich konnte keine relevanten Newsletter zu Ihrer Frage finden.',
          newsletters: []
        });
        return;
      }

      const prompt = `Du bist ein hilfsbereiter deutschsprachiger KI-Assistent für Studierende.

AUFGABE: Beantworte die folgende Frage basierend auf den bereitgestellten Newsletter-Archiven.

NUTZER-FRAGE: "${query}"

NEWSLETTER-ARCHIVE ZUR REFERENZ:
${context}

ANWEISUNGEN:
1. Beantworte die Frage präzise und hilfreich auf Deutsch
2. Verwende nur Informationen aus den bereitgestellten Newsletter-Archiven
3. Zitiere relevante Newsletter mit Jahr/Woche (z.B. "Laut Newsletter 2024/KW15...")
4. Falls die Information nicht in den Archiven vorhanden ist, sage das ehrlich
5. Strukturiere deine Antwort klar und verständlich
6. Füge am Ende eine kurze Liste der referenzierten Newsletter hinzu

Stil: Akademisch aber zugänglich, hilfreich und faktenbezogen.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048
            }
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(`Gemini API Error: ${response.status} - ${errorData?.error?.message || response.statusText}`);
      }

      const geminiData = await response.json();
      const answer = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Keine Antwort generiert';

      res.json({ 
        answer,
        newsletters: newsletters?.slice(0, 5),
        totalFound: newsletters?.length || 0
      });
    }

  } catch (error) {
    console.error('QA Archive search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Newsletter Operations Proxy
app.post('/api/newsletter/:operation', async (req, res) => {
  try {
    console.log('📧 Newsletter operation proxy called:', req.params.operation);
    
    const { operation } = req.params;
    
    // Handle different newsletter operations
    switch (operation) {
      case 'send':
      case 'send-email':
      case 'confirm':
      case 'unsubscribe':
        // These would integrate with email service (Brevo/SendGrid)
        // Implementation depends on your specific needs
        res.json({ 
          success: true,
          message: `Newsletter ${operation} operation completed`,
          operation 
        });
        break;
        
      default:
        res.status(400).json({ error: 'Unknown newsletter operation' });
    }
    
  } catch (error) {
    console.error('Newsletter operation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
function buildPromptForAction(action, data) {
  // Implementation would include the same prompts from your edge functions
  // This is a simplified version
  switch (action) {
    case 'generate-summary':
      return `Generate a newsletter summary for: ${JSON.stringify(data)}`;
    case 'generate-article-summary':
      return `Generate an article summary for: ${JSON.stringify(data)}`;
    case 'improve-article-title':
      return `Improve this article title: ${data.title}`;
    case 'qa-with-newsletter':
      return `Answer this question about newsletters: ${data.question}`;
    default:
      return 'Invalid action';
  }
}

function extractArticles(data, sourceUrl) {
  // Same logic as in your fetch-rss edge function
  const articles = [];
  
  try {
    let items = [];
    
    if (data.rss && data.rss.channel && data.rss.channel.item) {
      items = Array.isArray(data.rss.channel.item) ? data.rss.channel.item : [data.rss.channel.item];
    } else if (data.feed && data.feed.entry) {
      items = Array.isArray(data.feed.entry) ? data.feed.entry : [data.feed.entry];
    } else if (data.channel && data.channel.item) {
      items = Array.isArray(data.channel.item) ? data.channel.item : [data.channel.item];
    }

    for (const item of items) {
      try {
        const article = {
          title: extractText(item.title) || 'Ohne Titel',
          link: extractText(item.link) || extractText(item.guid) || '#',
          description: extractText(item.description) || extractText(item.summary) || '',
          pubDate: extractDate(item.pubDate || item.published || item.date) || new Date().toISOString(),
          guid: extractText(item.guid) || extractText(item.id) || `article-${Date.now()}-${Math.random()}`,
          creator: extractText(item.author) || extractText(item.creator) || 'Unbekannter Autor',
          content: extractText(item.content) || extractText(item.description) || '',
          sourceName: getSourceName(sourceUrl)
        };

        if (article.title !== 'Ohne Titel' || article.description.length > 0) {
          articles.push(article);
        }
      } catch (itemError) {
        console.error('Error processing individual item:', itemError);
      }
    }
  } catch (error) {
    console.error('Error extracting articles:', error);
  }

  return articles;
}

function extractText(value) {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'object') {
    if (value._) return value._.trim();
    if (value.$t) return value.$t.trim();
    if (value.content) return value.content.trim();
  }
  return String(value).trim();
}

function extractDate(value) {
  if (!value) return new Date().toISOString();
  try {
    return new Date(value).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function getSourceName(url) {
  const urlObj = new URL(url);
  return urlObj.hostname.replace('www.', '');
}

// Start server
app.listen(port, () => {
  console.log(`🚀 LinkIt Weekly Backend API running on port ${port}`);
  console.log(`📍 Health check: http://localhost:${port}/health`);
});

export default app; 