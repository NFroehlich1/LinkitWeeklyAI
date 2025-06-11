import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RssItem } from "@/types/newsTypes";
import { MessageSquare, Send, RefreshCw, Bot, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from 'react-markdown';

interface NewsletterAskAboutProps {
  articles: RssItem[];
  newsletterContent?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const NewsletterAskAbout = ({ articles, newsletterContent }: NewsletterAskAboutProps) => {
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

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
      console.log("Articles available:", articles.length);
      console.log("Newsletter content available:", !!newsletterContent);
      
      // Prepare context from articles and newsletter
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
        contextualPrompt += `${index + 1}. ${article.title}\n`;
        contextualPrompt += `   Quelle: ${article.sourceName}\n`;
        contextualPrompt += `   Beschreibung: ${article.description}\n`;
        if (article.content && article.content !== article.description) {
          contextualPrompt += `   Inhalt: ${article.content.substring(0, 300)}...\n`;
        }
        contextualPrompt += `\n`;
      });
      
      contextualPrompt += `\nGib eine detaillierte, hilfreiche Antwort auf Deutsch. ${newsletterContent ? 'Beziehe dich sowohl auf den Newsletter-Inhalt als auch auf die ursprünglichen Artikel.' : 'Beziehe dich konkret auf die relevanten Artikel und deren Inhalte.'} Wenn möglich, nenne spezifische Artikel oder Abschnitte aus dem Newsletter als Quelle.`;

      // Use qa-with-newsletter action for proper Q&A functionality
      const { data, error } = await supabase.functions.invoke('gemini-ai', {
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
        console.error("Gemini API Error:", data.error);
        toast.error("Fehler beim Generieren der Antwort: " + data.error);
        return;
      }

      let answer = '';
      if (data?.content) {
        answer = data.content;
      } else if (data?.answer) {
        answer = data.answer;
      } else {
        console.error("No content in response:", data);
        toast.error("Keine Antwort erhalten");
        return;
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: answer,
        timestamp: new Date()
      };
      
      setChatHistory(prev => [...prev, assistantMessage]);
      console.log("Question answered successfully");

    } catch (error) {
      console.error("Error asking question:", error);
      toast.error("Fehler beim Stellen der Frage: " + (error as Error).message);
    } finally {
      setIsLoading(false);
      setQuestion("");
    }
  };

  const clearChat = () => {
    setChatHistory([]);
    toast.success("Chat-Verlauf gelöscht");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAskQuestion();
    }
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
          {chatHistory.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearChat}>
              Chat löschen
            </Button>
          )}
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
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0 text-gray-700">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2">{children}</ul>,
                            li: ({ children }) => <li className="text-gray-700">{children}</li>,
                            strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm">{message.content}</p>
                    )}
                    <div className="text-xs opacity-70 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Question Input */}
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
          </div>

          <div className="space-y-2">
            <label htmlFor="question" className="text-sm font-medium text-gray-700">
              Ihre Frage:
            </label>
            <Textarea
              id="question"
              placeholder={newsletterContent 
                ? "Z.B. 'Welche KI-Trends werden im Newsletter diskutiert?' oder 'Fasse die wichtigsten Punkte des Newsletters zusammen'"
                : "Z.B. 'Welche KI-Trends werden in den Artikeln diskutiert?' oder 'Fasse die wichtigsten Punkte zu OpenAI zusammen'"
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
          </div>
        </div>

        {/* Suggested Questions */}
        {chatHistory.length === 0 && (
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Beispiel-Fragen:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {newsletterContent ? [
                "Was sind die Kernaussagen des Newsletters?",
                "Welche Artikel werden im Newsletter hervorgehoben?",
                "Welche KI-Trends werden im Newsletter diskutiert?",
                "Gibt es praktische Tipps für Studierende im Newsletter?"
              ] : [
                "Was sind die wichtigsten KI-Trends diese Woche?",
                "Welche Unternehmen werden am häufigsten erwähnt?",
                "Gibt es neue Entwicklungen bei ChatGPT oder OpenAI?",
                "Welche Artikel behandeln Startups und Innovation?"
              ].map((suggestion, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="text-left text-xs p-2 h-auto whitespace-normal justify-start"
                  onClick={() => setQuestion(suggestion)}
                  disabled={isLoading}
                >
                  "{suggestion}"
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NewsletterAskAbout;
