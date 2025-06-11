import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Search, MessageSquare, Archive, Bot, User, Calendar, Hash, RefreshCw, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Newsletter {
  id: string;
  title: string;
  content: string;
  date_range: string;
  week_number: number;
  year: number;
  article_count: number;
  created_at: string;
}

interface SearchResult {
  newsletters: Newsletter[];
  count: number;
  query: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  relatedNewsletters?: Newsletter[];
}

const NewsletterArchiveQA = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [qaQuery, setQaQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [activeTab, setActiveTab] = useState('search');

  // Generate year options (current year and previous years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 3 }, (_, i) => currentYear - i);
  
  // Generate week options (1-52)
  const weekOptions = Array.from({ length: 52 }, (_, i) => i + 1);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen Suchbegriff ein",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    try {
      // Direct database search for newsletters
      let dbQuery = supabase
        .from('newsletter_archive')
        .select('*')
        .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
        .order('created_at', { ascending: false })
        .limit(20);

      // Apply filters
      if (selectedYear) {
        dbQuery = dbQuery.eq('year', parseInt(selectedYear));
      }
      if (selectedWeek) {
        dbQuery = dbQuery.eq('week_number', parseInt(selectedWeek));
      }

      const { data: newsletters, error } = await dbQuery;

      if (error) {
        throw new Error(`Search failed: ${error.message}`);
      }

      const searchData = {
        newsletters: newsletters || [],
        count: newsletters?.length || 0,
        query: searchQuery
      };

      setSearchResults(searchData);
      
      if (searchData.count === 0) {
        toast({
          title: "Keine Ergebnisse",
          description: "Keine Newsletter gefunden, die Ihrer Suche entsprechen"
        });
      } else {
        toast({
          title: "Suche erfolgreich",
          description: `${searchData.count} Newsletter gefunden`
        });
      }

    } catch (error) {
      console.error('Search failed:', error);
      toast({
        title: "Fehler",
        description: "Suche fehlgeschlagen: " + (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleQA = async () => {
    if (!qaQuery.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte stellen Sie eine Frage",
        variant: "destructive"
      });
      return;
    }

    setIsAsking(true);
    
    // Add user message to chat
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: qaQuery,
      timestamp: new Date()
    };
    setChatHistory(prev => [...prev, userMessage]);

    try {
      // First get relevant newsletters
      let searchQuery = supabase
        .from('newsletter_archive')
        .select('*')
        .or(`title.ilike.%${qaQuery}%,content.ilike.%${qaQuery}%`)
        .order('created_at', { ascending: false })
        .limit(15);

      // Apply filters if set
      if (selectedYear) {
        searchQuery = searchQuery.eq('year', parseInt(selectedYear));
      }
      if (selectedWeek) {
        searchQuery = searchQuery.eq('week_number', parseInt(selectedWeek));
      }

      const { data: newsletters, error: searchError } = await searchQuery;

      if (searchError) {
        throw new Error(`Search failed: ${searchError.message}`);
      }

      const newsletterList = newsletters || [];
      
      // Combine newsletter content for context
      const newsletterContent = newsletterList.map(nl => 
        `Newsletter ${nl.year}/KW${nl.week_number}: ${nl.title}\n${nl.content.substring(0, 2000)}`
      ).join('\n\n---\n\n');

      // Call gemini-ai with qa-with-newsletter action
      const { data, error } = await supabase.functions.invoke('gemini-ai', {
        body: {
          action: 'qa-with-newsletter',
          data: {
            question: qaQuery,
            newsletter: newsletterContent || `Newsletter-Archive durchsucht. ${newsletterList.length} relevante Newsletter gefunden.`
          }
        }
      });

      if (error) {
        console.error('Q&A error:', error);
        toast({
          title: "Fehler",
          description: "Fehler beim Beantworten der Frage: " + error.message,
          variant: "destructive"
        });
        return;
      }

      // Add assistant message to chat
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.content || data.answer || 'Keine Antwort erhalten',
        timestamp: new Date(),
        relatedNewsletters: newsletterList.slice(0, 5)
      };
      setChatHistory(prev => [...prev, assistantMessage]);

      toast({
        title: "Antwort generiert",
        description: `Antwort basierend auf ${newsletterList.length} Newsletter(n) generiert`
      });

    } catch (error) {
      console.error('Q&A failed:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Beantworten: " + (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsAsking(false);
      setQaQuery('');
    }
  };

  const clearChat = () => {
    setChatHistory([]);
    toast({
      title: "Chat gelöscht",
      description: "Chat-Verlauf gelöscht"
    });
  };

  const clearFilters = () => {
    setSelectedYear('');
    setSelectedWeek('');
    toast({
      title: "Filter zurückgesetzt",
      description: "Filter zurückgesetzt"
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: 'search' | 'qa') => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (action === 'search') {
        handleSearch();
      } else {
        handleQA();
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/80">
        <CardHeader className="border-b bg-white/70 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Archive className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">
                Newsletter-Archiv Q&A System
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Durchsuchen Sie alle Newsletter-Archive und stellen Sie Fragen zu vergangenen Inhalten
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Filter Section */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Jahr filtern:
                </label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle Jahre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Alle Jahre</SelectItem>
                    {yearOptions.map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Kalenderwoche filtern:
                </label>
                <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle Wochen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Alle Wochen</SelectItem>
                    {weekOptions.map(week => (
                      <SelectItem key={week} value={week.toString()}>
                        KW {week}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button variant="outline" onClick={clearFilters}>
                Filter zurücksetzen
              </Button>
            </div>

            {(selectedYear || selectedWeek) && (
              <div className="mt-3 flex gap-2">
                {selectedYear && (
                  <Badge variant="secondary">
                    <Calendar className="h-3 w-3 mr-1" />
                    Jahr: {selectedYear}
                  </Badge>
                )}
                {selectedWeek && (
                  <Badge variant="secondary">
                    <Hash className="h-3 w-3 mr-1" />
                    KW {selectedWeek}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Tabs for Search and Q&A */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="search" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Suche
              </TabsTrigger>
              <TabsTrigger value="qa" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Q&A Chat
              </TabsTrigger>
            </TabsList>

            {/* Search Tab */}
            <TabsContent value="search" className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Durchsuchen Sie Newsletter-Archive (z.B. 'OpenAI', 'KI-Trends', 'Machine Learning')..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, 'search')}
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  {isSearching ? 'Suche...' : 'Suchen'}
                </Button>
              </div>

              {/* Search Results */}
              {searchResults && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      Suchergebnisse ({searchResults.count})
                    </h3>
                    <Badge variant="outline">
                      Suche: "{searchResults.query}"
                    </Badge>
                  </div>

                  <div className="grid gap-4">
                    {searchResults.newsletters.map((newsletter) => (
                      <Card key={newsletter.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-base font-semibold">
                              {newsletter.title}
                            </CardTitle>
                            <div className="flex gap-1">
                              <Badge variant="secondary" className="text-xs">
                                {newsletter.year}/KW{newsletter.week_number}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {newsletter.article_count} Artikel
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600 mb-2">
                            {newsletter.date_range}
                          </p>
                          <p className="text-sm text-gray-800 line-clamp-3">
                            {newsletter.content.substring(0, 300)}...
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Q&A Tab */}
            <TabsContent value="qa" className="space-y-4">
              {/* Chat History */}
              {chatHistory.length > 0 && (
                <div className="space-y-4 max-h-96 overflow-y-auto border rounded-lg p-4 bg-gray-50/50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Chat-Verlauf</h3>
                    <Button variant="outline" size="sm" onClick={clearChat}>
                      Chat löschen
                    </Button>
                  </div>

                  {chatHistory.map((message) => (
                    <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          message.role === 'user' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </div>
                        <div className={`rounded-lg p-3 ${
                          message.role === 'user' ? 'bg-primary text-white' : 'bg-white border border-gray-200'
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
                              
                              {/* Show related newsletters */}
                              {message.relatedNewsletters && message.relatedNewsletters.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <p className="text-xs font-medium text-gray-600 mb-2">
                                    Referenzierte Newsletter:
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {message.relatedNewsletters.map((nl) => (
                                      <Badge key={nl.id} variant="outline" className="text-xs">
                                        {nl.year}/KW{nl.week_number}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
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

              {/* Q&A Input */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">
                  Stellen Sie eine Frage zu den Newsletter-Archiven:
                </label>
                <Textarea
                  placeholder="Z.B. 'Welche KI-Trends wurden in den letzten Monaten diskutiert?' oder 'Was wurde über OpenAI GPT-4 berichtet?'"
                  value={qaQuery}
                  onChange={(e) => setQaQuery(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, 'qa')}
                  disabled={isAsking}
                  rows={3}
                  className="resize-none"
                />

                <div className="flex gap-2">
                  <Button 
                    onClick={handleQA} 
                    disabled={isAsking || !qaQuery.trim()}
                    className="flex-1 gap-2"
                  >
                    {isAsking ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {isAsking ? 'Analysiere Archive...' : 'Frage stellen'}
                  </Button>
                </div>

                {chatHistory.length === 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800 font-medium mb-2">Beispiel-Fragen:</p>
                    <div className="space-y-1">
                      {[
                        "Welche wichtigen KI-Entwicklungen wurden 2024 berichtet?",
                        "Was wurde über ChatGPT und OpenAI geschrieben?",
                        "Welche neuen Machine Learning Tools wurden vorgestellt?",
                        "Gab es Berichte über ethische KI-Themen?"
                      ].map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => setQaQuery(suggestion)}
                          className="block text-xs text-blue-700 hover:text-blue-900 hover:underline text-left"
                        >
                          "{suggestion}"
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewsletterArchiveQA; 