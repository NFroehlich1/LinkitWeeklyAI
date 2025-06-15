import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RssItem } from "@/types/newsTypes";
import { MessageSquare, Send, RefreshCw, Bot, User, TrendingUp, Lightbulb, ExternalLink, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from 'react-markdown';
import VoiceInput from './VoiceInput';
import ElevenLabsTTS from './ElevenLabsTTS';
import { useTranslation } from "@/contexts/TranslationContext";

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
}

const NewsletterAskAbout = ({ articles, newsletterContent, selectedModel = 'gemini' }: NewsletterAskAboutProps) => {
  const { t, language } = useTranslation();
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [dynamicQuestions, setDynamicQuestions] = useState<string[]>([]);
  const [autoSpeechEnabled, setAutoSpeechEnabled] = useState(false);
  const [lastReadMessageId, setLastReadMessageId] = useState<string | null>(null);

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

  const generateDynamicQuestions = () => {
    console.log("🔄 Generating new dynamic questions...");
    
    if (articles.length === 0) {
      setDynamicQuestions([
        t('whatAreMainAITrends'),
        t('whatNewTechnologies'),
        t('whichCompaniesActive'),
        t('whatRelevantForStudents')
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
      if (text.includes('startup') || text.includes('funding') || text.includes('investment') || text.includes('finanzierung')) topics.add('Startups & Investments');
      if (text.includes('ethik') || text.includes('regulation') || text.includes('gesetz') || text.includes('datenschutz')) topics.add('AI Ethics & Regulation');
      if (text.includes('job') || text.includes('karriere') || text.includes('ausbildung') || text.includes('studium')) topics.add('Career & Education');
      if (text.includes('sicherheit') || text.includes('security') || text.includes('privacy') || text.includes('cyber')) topics.add('Security');
      if (text.includes('gesundheit') || text.includes('medizin') || text.includes('health') || text.includes('medical')) topics.add('Medicine & Health');
      if (text.includes('energie') || text.includes('klima') || text.includes('nachhaltigkeit') || text.includes('environment')) topics.add('Environment & Energy');
      
      // Extract key terms
      const words = text.split(/\s+/);
      words.forEach(word => {
        if (word.length > 6 && !['artikel', 'unternehmen', 'entwicklung', 'technologie'].includes(word)) {
          keyTerms.add(word);
        }
      });
    });

    let questions: string[] = [];

    // Add newsletter-specific questions if content is available
    if (newsletterContent) {
      questions.push(t('whatMainPointsNewsletter'));
    }

    // Add company-specific questions
    const companyArray = Array.from(companies);
    if (companyArray.length > 0) {
      const randomCompany = companyArray[Math.floor(Math.random() * companyArray.length)];
      questions.push(`${t('whatReportedAbout')} ${randomCompany}?`);
    }

    // Add technology questions
    const techArray = Array.from(technologies);
    if (techArray.length > 0) {
      const randomTech = techArray[Math.floor(Math.random() * techArray.length)];
      questions.push(`${t('whatDevelopmentsIn')} ${randomTech}?`);
    }

    // Add topic questions
    const topicArray = Array.from(topics);
    if (topicArray.length > 0) {
      const randomTopic = topicArray[Math.floor(Math.random() * topicArray.length)];
      questions.push(`${t('whatReportedAbout')} ${randomTopic}?`);
    }

    // Always add some general questions
    const generalQuestions = [
      t('whatMainInsights'),
      t('whatPracticalTips'),
      t('whatTrendsVisible'),
      t('whatRelevantForStudents'),
      t('whichMostInteresting'),
      t('summarizeMainPoints')
    ];
    
    questions.push(...generalQuestions.sort(() => 0.5 - Math.random()).slice(0, 3));

    // Shuffle and limit to 6 questions
    const finalQuestions = questions.sort(() => 0.5 - Math.random()).slice(0, 6);

    console.log("✨ Generated questions:", finalQuestions);
    setDynamicQuestions(finalQuestions);
  };

  const getWeekNumber = (date: Date): number => {
    const startDate = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil(days / 7);
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) {
      toast.error("Please enter a question");
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
      let contextualPrompt = `Answer the following question based on the complete newsletter content and the related articles: "${question}"\n\n`;
      
      if (newsletterContent) {
        contextualPrompt += `NEWSLETTER-CONTENT:\n${newsletterContent}\n\n`;
        contextualPrompt += `Additionally, here are the original articles on which the newsletter is based:\n\n`;
      } else {
        contextualPrompt += `Base your answer on the following articles:\n\n`;
      }
      
      contextualPrompt += `ARTICLE-DETAILS:\n`;
      articlesContext.forEach((article, index) => {
        contextualPrompt += `Article ${index + 1}: ${article.title}\n`;
        contextualPrompt += `   Source: ${article.sourceName}\n`;
        contextualPrompt += `   Link: ${article.link}\n`;
        contextualPrompt += `   Description: ${article.description}\n`;
        if (article.content && article.content !== article.description) {
          contextualPrompt += `   Content: ${article.content.substring(0, 300)}...\n`;
        }
        contextualPrompt += `\n`;
      });
      
      contextualPrompt += `\nProvide a detailed, helpful answer in English. ${newsletterContent ? 'Take into account both the newsletter content and the original articles.' : 'Take into account the relevant articles and their contents.'} 

IMPORTANT: When you refer to specific articles, ALWAYS use the format "Article X" (e.g. "Article 1", "Article 2"), so that they become clickable links. For example: "As described in Article 3..." or "Article 1 and Article 5 show...".

Name specific articles or sections from the newsletter as sources.`;

      // Use qa-with-newsletter action for proper Q&A functionality
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
        toast.error("Error connecting to the AI service");
        return;
      }

      if (data?.error) {
        console.error(`${selectedModel} API Error:`, data.error);
        toast.error("Error generating answer: " + data.error);
        return;
      }

      let answer = '';
      if (data?.content) {
        answer = data.content;
      } else if (data?.answer) {
        answer = data.answer;
      } else {
        console.error("No content in response:", data);
        toast.error("No answer received");
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
      toast.error("Error asking question: " + (error as Error).message);
    } finally {
      setIsLoading(false);
      setQuestion("");
    }
  };

  const clearChat = () => {
    setChatHistory([]);
    toast.success("Chat history cleared");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAskQuestion();
    }
  };

  // Add voice input handler
  const handleVoiceTranscript = (transcript: string) => {
    console.log("🎤 Voice transcript received:", transcript);
    
    // Append to existing question or set as new question
    if (question.trim()) {
      setQuestion(prev => prev + " " + transcript);
      toast.success(t('voiceInputAdded'));
    } else {
      setQuestion(transcript);
      toast.success(t('questionCapturedViaVoice'));
    }
  };

  // Toggle auto-speech functionality
  const toggleAutoSpeech = () => {
    const newState = !autoSpeechEnabled;
    setAutoSpeechEnabled(newState);
    
    if (newState) {
      // When enabling, read the latest assistant message if available
      const latestAssistantMessage = [...chatHistory]
        .reverse()
        .find(msg => msg.role === 'assistant');
      
      if (latestAssistantMessage) {
        setLastReadMessageId(latestAssistantMessage.id);
        toast.success(t('autoSpeechActivatedWithLatest'));
      } else {
        toast.success(t('autoSpeechActivated'));
      }
    } else {
      setLastReadMessageId(null);
      toast.success(t('autoSpeechDeactivated'));
    }
  };

  // Function to convert article references to clickable links
  const processArticleLinks = (content: string): string => {
    // Pattern to match article references like "Article 1", "Article 2", etc.
    const articlePattern = /\b(?:Article|Article)\s+(\d+)\b/gi;
    
    return content.replace(articlePattern, (match, articleNumber) => {
      const index = parseInt(articleNumber) - 1; // Convert to 0-based index
      
      if (index >= 0 && index < articles.length) {
        const article = articles[index];
        // Create markdown link with article title and URL
        return `[${match}: "${article.title}"](${article.link})`;
      }
      
      return match; // Return original if article not found
    });
  };

  // Custom ReactMarkdown component with enhanced link handling
  const MarkdownWithLinks = ({ content }: { content: string }) => {
    const processedContent = processArticleLinks(content);
    
    return (
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0 text-gray-700">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2">{children}</ul>,
          li: ({ children }) => <li className="text-gray-700">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
          a: ({ href, children, ...props }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline decoration-blue-600/30 hover:decoration-blue-800 transition-colors"
              title={t('openInNewTab')}
              {...props}
            >
              {children}
              <ExternalLink className="h-3 w-3" />
            </a>
          )
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
                {t('questionsAboutTheNewsletter')}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {t('askQuestionsAboutArticles')} {articles.length} {t('articles')} {newsletterContent ? t('andNewsletterContent') : t('inThisNewsletter')}
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
              title={autoSpeechEnabled ? t('automaticSpeechOutputDeactivation') : t('automaticSpeechOutputActivation')}
            >
              {autoSpeechEnabled ? (
                <>
                  <Volume2 className="h-4 w-4 mr-1" />
                  {t('autoTTSON')}
                </>
              ) : (
                <>
                  <VolumeX className="h-4 w-4 mr-1" />
                  {t('autoTTSOFF')}
                </>
              )}
            </Button>
            {chatHistory.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearChat}>
                {t('clearChat')}
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
                                {t('auto')}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm">{message.content}</p>
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
              {articles.length} {t('articlesAvailable')}
            </Badge>
            {newsletterContent && (
              <Badge variant="outline" className="text-xs">
                {t('newsletterContentAvailable')}
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="question" className="text-sm font-medium text-gray-700">
              {t('yourQuestion')}
            </label>
            <Textarea
              id="question"
              placeholder={newsletterContent 
                ? t('exampleNewsletterQuestion')
                : t('exampleArticlesQuestion')
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
              {isLoading ? t('analyzing') : t('askQuestion')}
            </Button>
            
            {/* Voice Input Button */}
            <VoiceInput
              onTranscript={handleVoiceTranscript}
              isDisabled={isLoading}
              language={language === 'de' ? 'de-DE' : 'en-US'}
            />
          </div>
        </div>

        {/* Suggested Questions */}
        {chatHistory.length === 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <p className="text-sm font-medium text-gray-700">
                {t('intelligentQuestionSuggestions')}
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
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
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-blue-700 mb-2">
                  📊 {t('basedOnArticles')} {articles.length} {t('articles')} {newsletterContent ? t('andNewsletterContent') : t('thisNewsletter')}
                </p>
                <div className="flex flex-wrap gap-1">
                  {articles.slice(0, 3).map((article, index) => (
                    <span key={index} className="text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded">
                      {article.title.substring(0, 25)}...
                    </span>
                  ))}
                  {articles.length > 3 && (
                    <span className="text-xs text-blue-600">
                      +{articles.length - 3} {t('more')}
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
