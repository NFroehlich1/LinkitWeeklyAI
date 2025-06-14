import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RssItem } from "@/types/newsTypes";
import { MessageSquare, Send, RefreshCw, Bot, User, TrendingUp, Lightbulb, ExternalLink, Volume2, VolumeX, Globe, Search, Zap, Brain } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from 'react-markdown';
import VoiceInput from './VoiceInput';
import ElevenLabsTTS from './ElevenLabsTTS';
import { WebSearchService } from '@/services/WebSearchService';

interface NewsletterAskAboutProps {
  articles: RssItem[];
  newsletterContent?: string;
  selectedModel?: 'gemini' | 'mistral';
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  searchQueries?: string[];
  searchPerformed?: boolean;
}

type WebSearchMode = 'force_on' | 'auto' | 'force_off';

const NewsletterAskAbout = ({ articles, newsletterContent, selectedModel = 'gemini' }: NewsletterAskAboutProps) => {
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [dynamicQuestions, setDynamicQuestions] = useState<string[]>([]);
  const [autoSpeechEnabled, setAutoSpeechEnabled] = useState(false);
  const [lastReadMessageId, setLastReadMessageId] = useState<string | null>(null);
  const [webSearchMode, setWebSearchMode] = useState<WebSearchMode>('auto');
  const [webSearchService, setWebSearchService] = useState<WebSearchService | null>(null);

  useEffect(() => {
    generateDynamicQuestions();
  }, [articles, newsletterContent]);

  // Auto-speech effect - reads new assistant messages when auto-speech is enabled
  useEffect(() => {
    if (!autoSpeechEnabled || chatHistory.length === 0) return;

    // Find the latest assistant message
    const latestAssistantMessage = [...chatHistory]
      .reverse()
      .find(msg => msg.role === 'assistant');

    if (latestAssistantMessage && latestAssistantMessage.id !== lastReadMessageId) {
      console.log("🔊 Auto-reading new assistant message:", latestAssistantMessage.id);
      setLastReadMessageId(latestAssistantMessage.id);
      // The ElevenLabsTTS component will handle the actual speech
    }
  }, [chatHistory, autoSpeechEnabled, lastReadMessageId]);

  // Initialize WebSearchService when model changes
  useEffect(() => {
    if (selectedModel) {
      setWebSearchService(new WebSearchService(selectedModel));
    }
  }, [selectedModel]);

  const generateDynamicQuestions = () => {
    console.log("🔄 Generating new dynamic questions...");
    
    if (articles.length === 0) {
      setDynamicQuestions([
        "Was sind die wichtigsten KI-Trends diese Woche?",
        "Welche neuen Technologien werden diskutiert?",
        "Welche Unternehmen sind besonders aktiv?",
        "Welche Entwicklungen sind für Studierende relevant?"
      ]);
      return;
    }

    const companies = new Set<string>();
    const technologies = new Set<string>();
    const topics = new Set<string>();
    const keyTerms = new Set<string>();

    // Enhanced detection
    articles.forEach(article => {
      const text = `${article.title} ${article.description || ''}`.toLowerCase();
      
      // Company detection (expanded)
      ['openai', 'google', 'microsoft', 'meta', 'tesla', 'nvidia', 'apple', 'amazon', 'anthropic', 'midjourney', 'stability ai', 'deepmind', 'xai', 'mistral', 'cohere'].forEach(company => {
        if (text.includes(company.toLowerCase())) companies.add(company);
      });
      
      // Technology detection (expanded)
      ['ki', 'ai', 'artificial intelligence', 'machine learning', 'deep learning', 'llm', 'gpt', 'transformer', 'neural', 'robotik', 'automation', 'chatbot', 'computer vision', 'nlp', 'generative ai', 'agi'].forEach(tech => {
        if (text.includes(tech.toLowerCase())) technologies.add(tech.toUpperCase());
      });
      
      // Topics detection (expanded)
      if (text.includes('startup') || text.includes('funding') || text.includes('investment') || text.includes('finanzierung')) topics.add('Startups & Investitionen');
      if (text.includes('ethik') || text.includes('regulation') || text.includes('gesetz') || text.includes('datenschutz')) topics.add('KI-Ethik & Regulierung');
      if (text.includes('job') || text.includes('karriere') || text.includes('ausbildung') || text.includes('studium')) topics.add('Karriere & Bildung');
      if (text.includes('sicherheit') || text.includes('security') || text.includes('privacy') || text.includes('cyber')) topics.add('Sicherheit');
      if (text.includes('gesundheit') || text.includes('medizin') || text.includes('health') || text.includes('medical')) topics.add('Medizin & Gesundheit');
      if (text.includes('energie') || text.includes('klima') || text.includes('nachhaltigkeit') || text.includes('environment')) topics.add('Umwelt & Energie');
      
      // Extract key terms
      const words = text.split(/\s+/);
      words.forEach(word => {
        if (word.length > 6 && !['artikel', 'unternehmen', 'entwicklung', 'technologie'].includes(word)) {
          keyTerms.add(word);
        }
      });
    });

    // Question templates for variation
    const questionTemplates = {
      company: [
        "Was wird über {company} berichtet?",
        "Welche Entwicklungen zeigt {company}?",
        "Wie positioniert sich {company} im Markt?",
        "Was sind die neuesten Nachrichten zu {company}?",
        "Welche Strategie verfolgt {company}?"
      ],
      comparison: [
        "Wie unterscheiden sich die Ansätze von {comp1} und {comp2}?",
        "Was sind die Gemeinsamkeiten zwischen {comp1} und {comp2}?",
        "Wer ist führend: {comp1} oder {comp2}?",
        "Welche Konkurrenz besteht zwischen {comp1} und {comp2}?"
      ],
      technology: [
        "Welche Entwicklungen gibt es bei {tech}?",
        "Wie wird {tech} eingesetzt?",
        "Was sind die Vorteile von {tech}?",
        "Welche Herausforderungen gibt es bei {tech}?",
        "Wie verändert {tech} die Branche?"
      ],
      topic: [
        "Was wird zu {topic} berichtet?",
        "Welche Trends zeigen sich bei {topic}?",
        "Wie entwickelt sich {topic}?",
        "Welche Auswirkungen hat {topic}?",
        "Was sollte man über {topic} wissen?"
      ],
      general: [
        "Was sind die wichtigsten Erkenntnisse aus den Artikeln?",
        "Welche praktischen Tipps kann ich ableiten?",
        "Welche Trends lassen sich erkennen?",
        "Was ist besonders relevant für Studierende?",
        "Welche Artikel sind am interessantesten?",
        "Fasse die wichtigsten Punkte zusammen",
        "Welche Entwicklungen sind überraschend?",
        "Was sollte ich als Nächstes lesen?",
        "Welche langfristigen Auswirkungen sind zu erwarten?",
        "Wie beeinflussen diese Entwicklungen den Arbeitsmarkt?",
        "Welche Geschäftsmodelle entstehen?",
        "Was bedeuten diese Trends für die Zukunft?"
      ],
      webSearch: [
        "Was sind die neuesten KI-Entwicklungen heute?",
        "Welche aktuellen Tech-News sollte ich kennen?",
        "Was passiert gerade in der KI-Welt?",
        "Gibt es neue Durchbrüche in der KI-Forschung?",
        "Welche KI-Startups sind gerade im Trend?",
        "Was sind die aktuellsten Machine Learning Trends?",
        "Welche neuen AI-Tools wurden kürzlich veröffentlicht?",
        "Was berichten Tech-Medien heute über KI?"
      ],
      newsletter: [
        "Was sind die Kernaussagen dieses Newsletters?",
        "Welche Artikel werden besonders hervorgehoben?",
        "Wie hängen die verschiedenen Artikel zusammen?",
        "Was ist das übergreifende Thema?",
        "Welche Schlüsselerkenntnisse vermittelt der Newsletter?"
      ]
    };

    let questions: string[] = [];

    // Add newsletter-specific questions if content is available
    if (newsletterContent) {
      const newsletterQuestions = questionTemplates.newsletter;
      questions.push(newsletterQuestions[Math.floor(Math.random() * newsletterQuestions.length)]);
    }

    // Add company-specific questions
    const companyArray = Array.from(companies);
    if (companyArray.length > 0) {
      const randomCompany = companyArray[Math.floor(Math.random() * companyArray.length)];
      const template = questionTemplates.company[Math.floor(Math.random() * questionTemplates.company.length)];
      questions.push(template.replace('{company}', randomCompany));

      // Add comparison question if multiple companies
      if (companyArray.length > 1) {
        const shuffled = [...companyArray].sort(() => 0.5 - Math.random());
        const template = questionTemplates.comparison[Math.floor(Math.random() * questionTemplates.comparison.length)];
        questions.push(template.replace('{comp1}', shuffled[0]).replace('{comp2}', shuffled[1]));
      }
    }

    // Add technology questions
    const techArray = Array.from(technologies);
    if (techArray.length > 0) {
      const randomTech = techArray[Math.floor(Math.random() * techArray.length)];
      const template = questionTemplates.technology[Math.floor(Math.random() * questionTemplates.technology.length)];
      questions.push(template.replace('{tech}', randomTech));
    }

    // Add topic questions
    const topicArray = Array.from(topics);
    if (topicArray.length > 0) {
      const randomTopic = topicArray[Math.floor(Math.random() * topicArray.length)];
      const template = questionTemplates.topic[Math.floor(Math.random() * questionTemplates.topic.length)];
      questions.push(template.replace('{topic}', randomTopic));
    }

    // Always add some general questions (randomly selected)
    const generalQuestions = [...questionTemplates.general].sort(() => 0.5 - Math.random()).slice(0, 2);
    questions.push(...generalQuestions);

    // Add web search questions if mode supports it
    if (webSearchMode !== 'force_off') {
      const webSearchQuestions = [...questionTemplates.webSearch].sort(() => 0.5 - Math.random()).slice(0, 2);
      questions.push(...webSearchQuestions);
    }

    // Shuffle and limit to 6 questions
    const finalQuestions = questions.sort(() => 0.5 - Math.random()).slice(0, 6);

    console.log("✨ Generated dynamic questions:", finalQuestions);
    console.log("🏢 Detected companies:", Array.from(companies));
    console.log("🔬 Detected technologies:", Array.from(technologies));
    console.log("📊 Detected topics:", Array.from(topics));
    
    setDynamicQuestions(finalQuestions);
    toast.success("Neue Fragevorschläge generiert!");
  };

  const getWeekNumber = (date: Date): number => {
    const startDate = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil(days / 7);
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) {
      toast.error("Bitte geben Sie eine Frage ein");
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question,
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      console.log("Asking question about newsletter articles:", question);
      console.log("Using AI provider:", selectedModel);
      console.log("Web search mode:", webSearchMode);
      console.log("Articles available:", articles.length);
      console.log("Newsletter content available:", !!newsletterContent);
      
      let answer = '';
      let searchQueries: string[] = [];
      let searchPerformed = false;
      
      // Determine if we should use web search based on mode
      const shouldUseWebSearch = webSearchMode === 'force_on' || 
                                (webSearchMode === 'auto' && webSearchService);
      
      if (shouldUseWebSearch && webSearchService) {
        // Use the new WebSearchService for web search integration
        console.log("🌐 Using WebSearchService for enhanced Q&A...");
        
        // Prepare context from articles and newsletter
        const articlesContext = articles.map(article => ({
          title: article.title,
          description: article.description || '',
          sourceName: article.sourceName,
          pubDate: article.pubDate,
          link: article.link,
          content: article.content || article.description || ''
        }));

        let contextualPrompt = '';
        if (newsletterContent) {
          contextualPrompt += `NEWSLETTER-INHALT:\n${newsletterContent}\n\n`;
          contextualPrompt += `Zusätzlich sind hier die ursprünglichen Artikel, auf denen der Newsletter basiert:\n\n`;
        } else {
          contextualPrompt += `Basiere deine Antwort auf den folgenden Artikeln:\n\n`;
        }
        
        contextualPrompt += `ARTIKEL-DETAILS:\n`;
        articlesContext.forEach((article, index) => {
          contextualPrompt += `Artikel ${index + 1}: ${article.title}\n`;
          contextualPrompt += `   Quelle: ${article.sourceName}\n`;
          contextualPrompt += `   Link: ${article.link}\n`;
          contextualPrompt += `   Beschreibung: ${article.description}\n`;
          if (article.content && article.content !== article.description) {
            contextualPrompt += `   Inhalt: ${article.content.substring(0, 300)}...\n`;
          }
          contextualPrompt += `\n`;
        });

        if (webSearchMode === 'force_on') {
          // Force web search - modify the WebSearchService to always search
          console.log("🔥 Forcing web search...");
          const analysis = await webSearchService.analyzeQuestion(question, contextualPrompt);
          const queries = analysis.queries.length > 0 ? analysis.queries : [question];
          
          try {
            const searchResults = await webSearchService.performSearch(queries);
            const result = await webSearchService.generateAnswerWithSearch(question, contextualPrompt, searchResults || undefined);
            
            answer = result.content;
            searchQueries = queries;
            searchPerformed = true;
            
            toast.success("Web-Suche wurde erzwungen und durchgeführt!");
          } catch (searchError) {
            console.error("🚨 Web search failed:", searchError);
            
            // Check if it's a deployment issue
            if (searchError.message?.includes('Web search service not available')) {
              toast.error("Web-Suche nicht verfügbar: ACI Brave Search Funktion muss in Supabase deployed werden");
              
              // Fall back to regular Q&A without web search using the standard action
              console.log("📝 Falling back to regular Q&A without web search...");
              
              // Use qa-with-newsletter action for standard Q&A functionality
              const functionName = selectedModel === 'gemini' ? 'gemini-ai' : 'mistral-ai';
              const { data, error } = await supabase.functions.invoke(functionName, {
                body: { 
                  action: 'qa-with-newsletter',
                  data: { 
                    question: question,
                    newsletter: contextualPrompt
                  }
                }
              });

              if (error || !data?.content) {
                throw new Error("Fehler beim Generieren der Antwort: " + (error?.message || 'Keine Antwort erhalten'));
              }

              answer = data.content;
              searchQueries = [];
              searchPerformed = false;
              
              toast.info("Antwort ohne Web-Suche generiert");
            } else {
              throw searchError; // Re-throw other errors
            }
          }
        } else {
          // Auto mode - let AI decide
          try {
            const result = await webSearchService.askWithSearch(question, contextualPrompt);
            answer = result.content;
            searchQueries = result.searchQueries;
            searchPerformed = result.searchPerformed;
            
            if (result.searchPerformed) {
              console.log("✅ AI decided web search was helpful");
              toast.success("KI hat Web-Suche als hilfreich eingestuft!");
            } else {
              console.log("ℹ️ AI decided existing context was sufficient");
              toast.info("KI hat entschieden: Vorhandener Kontext ist ausreichend");
            }
                     } catch (searchError) {
             console.error("🚨 Auto web search failed:", searchError);
             
             // Check if it's a deployment issue
             if (searchError.message?.includes('Web search service not available')) {
               toast.warning("Web-Suche nicht verfügbar - verwende nur Newsletter-Kontext");
               
               // Fall back to regular Q&A without web search using the standard action
               console.log("📝 Falling back to regular Q&A without web search...");
               
               // Use qa-with-newsletter action for standard Q&A functionality
               const functionName = selectedModel === 'gemini' ? 'gemini-ai' : 'mistral-ai';
               const { data, error } = await supabase.functions.invoke(functionName, {
                 body: { 
                   action: 'qa-with-newsletter',
                   data: { 
                     question: question,
                     newsletter: contextualPrompt
                   }
                 }
               });

               if (error || !data?.content) {
                 throw new Error("Fehler beim Generieren der Antwort: " + (error?.message || 'Keine Antwort erhalten'));
               }

               answer = data.content;
               searchQueries = [];
               searchPerformed = false;
             } else {
               throw searchError; // Re-throw other errors
             }
           }
        }
      } else if (webSearchMode === 'force_off') {
        // Force no web search
        console.log("🚫 Web search disabled - using standard Q&A...");
        toast.info("Web-Suche deaktiviert - verwende nur vorhandenen Kontext");
        
        // Use existing Q&A without web search
        const articlesContext = articles.map(article => ({
          title: article.title,
          description: article.description || '',
          sourceName: article.sourceName,
          pubDate: article.pubDate,
          link: article.link,
          content: article.content || article.description || ''
        }));

        console.log("Prepared articles context:", articlesContext.length);

        // Create enhanced prompt that includes newsletter content
        let contextualPrompt = `Beantworte die folgende Frage basierend auf dem kompletten Newsletter-Inhalt und den zugehörigen Artikeln: "${question}"\n\n`;
        
        if (newsletterContent) {
          contextualPrompt += `NEWSLETTER-INHALT:\n${newsletterContent}\n\n`;
          contextualPrompt += `Zusätzlich sind hier die ursprünglichen Artikel, auf denen der Newsletter basiert:\n\n`;
        } else {
          contextualPrompt += `Basiere deine Antwort auf den folgenden Artikeln:\n\n`;
        }
        
        contextualPrompt += `ARTIKEL-DETAILS:\n`;
        articlesContext.forEach((article, index) => {
          contextualPrompt += `Artikel ${index + 1}: ${article.title}\n`;
          contextualPrompt += `   Quelle: ${article.sourceName}\n`;
          contextualPrompt += `   Link: ${article.link}\n`;
          contextualPrompt += `   Beschreibung: ${article.description}\n`;
          if (article.content && article.content !== article.description) {
            contextualPrompt += `   Inhalt: ${article.content.substring(0, 300)}...\n`;
          }
          contextualPrompt += `\n`;
        });
        
        contextualPrompt += `\nGib eine detaillierte, hilfreiche Antwort auf Deutsch. ${newsletterContent ? 'Beziehe dich sowohl auf den Newsletter-Inhalt als auch auf die ursprünglichen Artikel.' : 'Beziehe dich konkret auf die relevanten Artikel und deren Inhalte.'} 

WICHTIG: Wenn du auf spezifische Artikel verweist, verwende IMMER das Format "Artikel X" (z.B. "Artikel 1", "Artikel 2"), damit diese automatisch zu klickbaren Links werden. Beispiel: "Wie in Artikel 3 beschrieben..." oder "Artikel 1 und Artikel 5 zeigen...".

Nenne spezifische Artikel oder Abschnitte aus dem Newsletter als Quelle.`;

        // Use qa-with-newsletter action for standard Q&A functionality
        const functionName = selectedModel === 'gemini' ? 'gemini-ai' : 'mistral-ai';
        const { data, error } = await supabase.functions.invoke(functionName, {
          body: { 
            action: 'qa-with-newsletter',
            data: { 
              question: question,
              newsletter: newsletterContent || contextualPrompt
            }
          }
        });

        console.log("Supabase function response:", { data, error });

        if (error) {
          console.error("Supabase function error:", error);
          toast.error("Fehler bei der Verbindung zum KI-Service");
          return;
        }

        if (data?.error) {
          console.error(`${selectedModel} API Error:`, data.error);
          toast.error("Fehler beim Generieren der Antwort: " + data.error);
          return;
        }

        if (data?.content) {
          answer = data.content;
        } else if (data?.answer) {
          answer = data.answer;
        } else {
          console.error("No content in response:", data);
          toast.error("Keine Antwort erhalten");
          return;
        }
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: answer,
        timestamp: new Date(),
        searchQueries: searchQueries.length > 0 ? searchQueries : undefined,
        searchPerformed: searchPerformed
      };

      setChatHistory(prev => [...prev, assistantMessage]);
      setQuestion("");

    } catch (error) {
      console.error("Error asking question:", error);
      toast.error("Fehler beim Stellen der Frage: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setChatHistory([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAskQuestion();
    }
  };

  const handleVoiceTranscript = (transcript: string) => {
    console.log("Voice transcript received:", transcript);
    setQuestion(transcript);
    toast.success("Spracheingabe erfasst!");
  };

  const toggleAutoSpeech = () => {
    setAutoSpeechEnabled(!autoSpeechEnabled);
    toast.success(autoSpeechEnabled ? "Auto-Sprachausgabe deaktiviert" : "Auto-Sprachausgabe aktiviert");
  };

  const cycleWebSearchMode = () => {
    const modes: WebSearchMode[] = ['force_off', 'auto', 'force_on'];
    const currentIndex = modes.indexOf(webSearchMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    const nextMode = modes[nextIndex];
    
    setWebSearchMode(nextMode);
    
    const modeMessages = {
      'force_off': "Web-Suche deaktiviert",
      'auto': "Automatische Web-Suche (KI entscheidet)",
      'force_on': "Web-Suche immer aktiviert"
    };
    
    toast.success(modeMessages[nextMode]);
    
    // Regenerate questions based on new mode
    generateDynamicQuestions();
  };

  const getWebSearchModeDisplay = () => {
    switch (webSearchMode) {
      case 'force_off':
        return {
          icon: <Globe className="h-3 w-3 mr-1 opacity-50" />,
          text: "Web-Suche AUS",
          variant: "outline" as const,
          className: "text-gray-500 border-gray-300"
        };
      case 'auto':
        return {
          icon: <Brain className="h-3 w-3 mr-1" />,
          text: "KI entscheidet",
          variant: "secondary" as const,
          className: "text-blue-700 bg-blue-100 border-blue-200"
        };
      case 'force_on':
        return {
          icon: <Zap className="h-3 w-3 mr-1" />,
          text: "Web-Suche AN",
          variant: "default" as const,
          className: "bg-green-600 text-white"
        };
    }
  };

  const processArticleLinks = (content: string): string => {
    // Convert "Artikel X" references to clickable links
    return content.replace(
      /Artikel (\d+)/g,
      (match, articleNumber) => {
        const index = parseInt(articleNumber) - 1;
        if (index >= 0 && index < articles.length) {
          const article = articles[index];
          return `[Artikel ${articleNumber}](${article.link})`;
        }
        return match;
      }
    );
  };

  const MarkdownWithLinks = ({ content }: { content: string }) => {
    const processedContent = processArticleLinks(content);
    
    return (
      <ReactMarkdown
        components={{
          a: ({ href, children }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
            >
              {children}
              <ExternalLink className="h-3 w-3" />
            </a>
          ),
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
          li: ({ children }) => <li className="mb-1">{children}</li>,
          h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          code: ({ children }) => (
            <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-gray-300 pl-2 italic text-gray-600 mb-2">
              {children}
            </blockquote>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    );
  };

  return (
    <Card className="mt-6 shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/80">
      <CardHeader className="border-b bg-white/70 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-gray-900">
                Fragen zum Newsletter
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Stellen Sie Fragen zu den {articles.length} Artikeln {newsletterContent ? 'und dem Newsletter-Inhalt' : 'in diesem Newsletter'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Auto-Speech Toggle Button */}
            <Button 
              variant={autoSpeechEnabled ? "default" : "outline"} 
              size="sm" 
              onClick={toggleAutoSpeech}
              className={autoSpeechEnabled ? "bg-green-600 hover:bg-green-700" : ""}
              title={autoSpeechEnabled ? "Automatische Sprachausgabe deaktivieren" : "Automatische Sprachausgabe aktivieren"}
            >
              {autoSpeechEnabled ? (
                <>
                  <Volume2 className="h-4 w-4 mr-1" />
                  Auto-TTS AN
                </>
              ) : (
                <>
                  <VolumeX className="h-4 w-4 mr-1" />
                  Auto-TTS AUS
                </>
              )}
            </Button>
            {chatHistory.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearChat}>
                Chat löschen
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-4">
        {/* Chat History */}
        {chatHistory.length > 0 && (
          <div className="space-y-4 max-h-96 overflow-y-auto border rounded-lg p-4 bg-gray-50/50">
            {chatHistory.map((message) => (
              <div 
                key={message.id} 
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'user' 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div className={`rounded-lg p-3 ${
                    message.role === 'user' 
                      ? 'bg-primary text-white' 
                      : 'bg-white border border-gray-200'
                  }`}>
                    {message.role === 'assistant' ? (
                      <div className="space-y-2">
                        <div className="prose prose-sm max-w-none">
                          <MarkdownWithLinks content={message.content} />
                        </div>
                        
                        {/* Web Search Status Indicator */}
                        {message.searchPerformed && (
                          <div className="p-2 bg-green-50 rounded border-l-2 border-green-400">
                            <div className="flex items-center gap-1 mb-1">
                              <Search className="h-3 w-3 text-green-600" />
                              <span className="text-xs text-green-700 font-medium">
                                ✅ Web-Suche durchgeführt
                              </span>
                            </div>
                            {message.searchQueries && message.searchQueries.length > 0 && (
                              <div className="space-y-1">
                                <span className="text-xs text-green-600">Suchbegriffe:</span>
                                {message.searchQueries.map((query, index) => (
                                  <div key={index} className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
                                    "{query}"
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* No Web Search Indicator */}
                        {message.searchPerformed === false && webSearchMode === 'auto' && (
                          <div className="p-2 bg-blue-50 rounded border-l-2 border-blue-400">
                            <div className="flex items-center gap-1">
                              <Brain className="h-3 w-3 text-blue-600" />
                              <span className="text-xs text-blue-700 font-medium">
                                🧠 KI-Entscheidung: Nur Newsletter-Kontext verwendet
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {/* Force Mode Indicators */}
                        {webSearchMode === 'force_off' && (
                          <div className="p-1 bg-gray-100 rounded">
                            <span className="text-xs text-gray-600">
                              🚫 Web-Suche deaktiviert
                            </span>
                          </div>
                        )}
                        
                        {/* TTS Controls for Assistant Messages */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <div className="text-xs opacity-70">
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                          <div className="flex items-center gap-2">
                            {/* TTS Button with Auto-play */}
                            <ElevenLabsTTS 
                              text={message.content}
                              className="text-xs"
                              isDisabled={isLoading}
                              autoPlay={autoSpeechEnabled && message.id === lastReadMessageId}
                              onAutoPlayComplete={() => {
                                console.log(`✅ Auto-play completed for message: ${message.id}`);
                              }}
                            />
                            {/* Auto-TTS Indicator */}
                            {autoSpeechEnabled && message.id === lastReadMessageId && (
                              <div className="text-xs text-green-600 flex items-center gap-1">
                                <Volume2 className="h-3 w-3" />
                                Auto
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-sm">
                          <MarkdownWithLinks content={message.content} />
                        </div>
                        <div className="text-xs opacity-70 mt-2">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Question Input with Voice Support */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline" className="text-xs">
              {articles.length} Artikel verfügbar
            </Badge>
            {newsletterContent && (
              <Badge variant="outline" className="text-xs">
                Newsletter-Inhalt verfügbar
              </Badge>
            )}
            <Badge 
              variant={getWebSearchModeDisplay().variant} 
              className={`text-xs cursor-pointer transition-colors ${getWebSearchModeDisplay().className}`}
              onClick={cycleWebSearchMode}
              title="Klicken um Web-Suche Modus zu ändern"
            >
              {getWebSearchModeDisplay().icon}
              {getWebSearchModeDisplay().text}
            </Badge>
          </div>

          <div className="space-y-2">
            <label htmlFor="question" className="text-sm font-medium text-gray-700">
              Ihre Frage:
            </label>
            <Textarea
              id="question"
              placeholder={newsletterContent 
                ? "Z.B. 'Welche KI-Trends werden im Newsletter diskutiert?' oder nutzen Sie die Spracheingabe..."
                : "Z.B. 'Welche KI-Trends werden in den Artikeln diskutiert?' oder nutzen Sie die Spracheingabe..."
              }
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleAskQuestion} 
              disabled={isLoading || !question.trim()}
              className="flex-1 gap-2"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {isLoading ? "Analysiere..." : "Frage stellen"}
            </Button>
            
            {/* Voice Input Button */}
            <VoiceInput
              onTranscript={handleVoiceTranscript}
              isDisabled={isLoading}
              language="de-DE"
            />
          </div>
        </div>

        {/* Suggested Questions */}
        {chatHistory.length === 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <p className="text-sm font-medium text-gray-700">
                Intelligente Fragevorschläge:
              </p>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={generateDynamicQuestions}
                className="h-6 px-2 text-xs ml-auto"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="space-y-2">
              {dynamicQuestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="text-left text-xs p-2 h-auto whitespace-normal justify-start hover:bg-blue-50 border border-transparent hover:border-blue-200"
                  onClick={() => setQuestion(suggestion)}
                  disabled={isLoading}
                >
                  <Lightbulb className="h-3 w-3 mr-1 flex-shrink-0 text-blue-500" />
                  "{suggestion}"
                </Button>
              ))}
            </div>

            {/* Article context info */}
            {articles.length > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg mt-3">
                <p className="text-xs text-blue-700 mb-2">
                  📊 Basierend auf {articles.length} Artikeln {newsletterContent ? 'und Newsletter-Inhalt' : 'dieses Newsletters'}
                </p>
                <div className="flex flex-wrap gap-1">
                  {articles.slice(0, 3).map((article, index) => (
                    <span key={index} className="text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded">
                      {article.title.substring(0, 25)}...
                    </span>
                  ))}
                  {articles.length > 3 && (
                    <span className="text-xs text-blue-600">
                      +{articles.length - 3} weitere
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NewsletterAskAbout;
