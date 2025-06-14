import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { RefreshCw, TrendingUp, Plus, ExternalLink, ChevronDown, ChevronUp, Edit3, GraduationCap, Database } from "lucide-react";
import NewsService, { WeeklyDigest, RssItem } from "@/services/NewsService";
import { getCurrentWeek, getCurrentYear, getWeekDateRange } from "@/utils/dateUtils";
import WeeklyDigestComponent from "@/components/WeeklyDigest";
import Header from "@/components/Header";
import CustomArticleImporter from "@/components/CustomArticleImporter";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from '@supabase/supabase-js';
import { Link } from "react-router-dom";

const Index = () => {
  const [newsService] = useState(new NewsService());
  const [digest, setDigest] = useState<WeeklyDigest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [customArticles, setCustomArticles] = useState<RssItem[]>([]);
  const [showImporter, setShowImporter] = useState(false);
  const [articleSummaries, setArticleSummaries] = useState<Record<string, string>>({});
  const [generatingSummaries, setGeneratingSummaries] = useState<Set<string>>(new Set());
  const [improvingTitles, setImprovingTitles] = useState<Set<string>>(new Set());
  const [debugLoading, setDebugLoading] = useState(false);
  const [geminiTestLoading, setGeminiTestLoading] = useState(false);
  const [elevenLabsTestLoading, setElevenLabsTestLoading] = useState(false);

  useEffect(() => {
    fetchNews();
  }, []);

  const testGeminiAPI = async () => {
    setGeminiTestLoading(true);
    try {
      console.log("=== DEBUG: TESTING GEMINI API ===");
      toast.info("Teste Gemini API...");
      
      const { data, error } = await supabase.functions.invoke('gemini-ai', {
        body: { 
          action: 'verify-key'
        }
      });

      if (error) {
        console.error("Supabase function error:", error);
        toast.error(`Gemini API Fehler: ${error.message}`);
        return;
      }

      if (data.isValid) {
        toast.success(`✅ Gemini API funktioniert: ${data.message}`);
      } else {
        toast.error(`❌ Gemini API Problem: ${data.message}`);
      }
    } catch (error) {
      console.error("Gemini API test error:", error);
      toast.error(`Gemini Test Fehler: ${(error as Error).message}`);
    } finally {
      setGeminiTestLoading(false);
    }
  };

  const testElevenLabsAPI = async () => {
    setElevenLabsTestLoading(true);
    try {
      console.log("=== DEBUG: TESTING ELEVEN LABS API ===");
      toast.info("Teste Eleven Labs API...");
      
      const { data, error } = await supabase.functions.invoke('rapid-processor', {
        body: { 
          action: 'verify-key'
        }
      });

      if (error) {
        console.error("Supabase function error:", error);
        
        // Enhanced error handling based on GitHub issue #45
        if (error instanceof FunctionsHttpError) {
          try {
            const errorMessage = await error.context.json();
            console.error('Function returned an error:', errorMessage);
            toast.error(`Edge Function Fehler: ${errorMessage.error || JSON.stringify(errorMessage)}`);
          } catch (jsonError) {
            try {
              const errorText = await error.context.text();
              console.error('Function returned text error:', errorText);
              toast.error(`Edge Function Fehler: ${errorText}`);
            } catch (textError) {
              console.error('Could not parse error response:', textError);
              toast.error(`Edge Function Fehler: HTTP ${error.context.status || 'unknown status'}`);
            }
          }
        } else if (error instanceof FunctionsRelayError) {
          console.error('Relay error:', error.message);
          toast.error(`Relay Fehler: ${error.message}`);
        } else if (error instanceof FunctionsFetchError) {
          console.error('Fetch error:', error.message);
          toast.error(`Netzwerk Fehler: ${error.message}`);
        } else {
          toast.error(`Unbekannter Fehler: ${error.message}`);
        }
        return;
      }

      if (data.isValid) {
        toast.success(`✅ Eleven Labs API funktioniert: ${data.message}`);
      } else {
        toast.error(`❌ Eleven Labs API Problem: ${data.message}`);
      }
    } catch (error) {
      console.error("Eleven Labs API test error:", error);
      toast.error(`Eleven Labs Test Fehler: ${(error as Error).message}`);
    } finally {
      setElevenLabsTestLoading(false);
    }
  };

  const testRssLoading = async () => {
    setDebugLoading(true);
    try {
      console.log("=== DEBUG: TESTING RSS LOADING ===");
      toast.info("Teste RSS-Loading...");
      
      // Force fresh fetch from RSS feeds
      const freshItems = await newsService.fetchNews();
      console.log("Fresh items fetched:", freshItems.length);
      
      if (freshItems.length > 0) {
        toast.success(`✅ ${freshItems.length} neue Artikel gefunden!`);
        // Refresh the display
        fetchNews();
      } else {
        toast.warning("Keine neuen Artikel gefunden");
      }
    } catch (error) {
      console.error("Debug RSS loading error:", error);
      toast.error(`RSS-Test Fehler: ${(error as Error).message}`);
    } finally {
      setDebugLoading(false);
    }
  };

  const fetchNews = async () => {
    setIsLoading(true);
    try {
      console.log("=== FETCHING NEWS ===");
      
      // Try to get stored articles first, fallback to fetching fresh ones
      let allItems: RssItem[] = [];
      try {
        allItems = await newsService.getStoredArticlesForCurrentWeek();
        if (allItems.length === 0) {
          console.log("No stored articles found, fetching fresh ones...");
          allItems = await newsService.fetchNews();
        }
      } catch (error) {
        console.warn("Error getting stored articles, fetching fresh ones:", error);
        allItems = await newsService.fetchNews();
      }

      // Mark custom articles as such and combine with regular articles
      const markedCustomArticles = customArticles.map(article => ({
        ...article,
        sourceName: 'Eigener',
        isCustom: true
      }));
      
      const combinedItems = [...allItems, ...markedCustomArticles];
      
      // Filter for current week and create digest
      const currentWeekItems = newsService.filterCurrentWeekNews(combinedItems);
      const weekDigests = newsService.groupNewsByWeek(currentWeekItems);
      
      const currentWeek = getCurrentWeek();
      const currentYear = getCurrentYear();
      const weekKey = `${currentYear}-W${currentWeek.toString().padStart(2, '0')}`;
      
      if (weekDigests[weekKey]) {
        setDigest(weekDigests[weekKey]);
        console.log(`✅ Found ${weekDigests[weekKey].items.length} articles for current week`);
      } else {
        // Create empty digest for current week with all required properties
        const emptyDigest: WeeklyDigest = {
          id: `${currentYear}-W${currentWeek.toString().padStart(2, '0')}-${Date.now()}`,
          weekNumber: currentWeek,
          year: currentYear,
          dateRange: getWeekDateRange(currentWeek, currentYear),
          title: `KW ${currentWeek}/${currentYear}`,
          summary: "Noch keine Zusammenfassung erstellt",
          items: combinedItems,
          generatedContent: null,
          createdAt: new Date()
        };
        setDigest(emptyDigest);
        console.log(`📅 Created digest for week ${currentWeek}/${currentYear} with ${combinedItems.length} articles`);
      }
      
    } catch (error) {
      console.error('Error fetching news:', error);
      toast.error(`Fehler beim Laden der Nachrichten: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomArticleAdded = async (article: RssItem) => {
    // Check if article with same URL/GUID already exists in the local list
    const isDuplicate = customArticles.some(existingArticle => 
      existingArticle.guid === article.guid || 
      existingArticle.link === article.link
    );

    if (isDuplicate) {
      toast.warning("⚠️ Ein Artikel mit dieser URL ist bereits in der lokalen Liste vorhanden");
      return;
    }

    try {
      // Save custom article to database
      console.log("💾 Saving custom article to database:", article.title);
      await newsService.saveCustomArticle(article);
      
      setCustomArticles(prev => [...prev, article]);
      setShowImporter(false);
      
      toast.success("✅ Artikel erfolgreich hinzugefügt und gespeichert");
      
      // Refresh the digest with the new article
      setTimeout(() => {
        fetchNews();
      }, 100);
    } catch (error) {
      console.error("Error saving custom article:", error);
      toast.error("❌ Fehler beim Speichern des Artikels in der Datenbank");
    }
  };

  const improveArticleTitle = async (articleGuid: string) => {
    const article = customArticles.find(a => a.guid === articleGuid);
    if (!article) return;

    setImprovingTitles(prev => new Set(prev).add(articleGuid));
    
    try {
      console.log("Improving title for custom article:", article.title);
      
      const { data, error } = await supabase.functions.invoke('gemini-ai', {
        body: { 
          action: 'improve-article-title',
          data: { article }
        }
      });

      if (error) {
        console.error("Supabase function error:", error);
        toast.error("Fehler bei der Titel-Verbesserung");
        return;
      }

      if (data.error) {
        console.error("Gemini API Error:", data.error);
        toast.error("Fehler bei der Titel-Verbesserung");
        return;
      }

      if (data.improvedTitle) {
        // Update the article title in the customArticles state
        setCustomArticles(prev => prev.map(a => 
          a.guid === articleGuid 
            ? { ...a, title: data.improvedTitle }
            : a
        ));
        toast.success("Titel erfolgreich verbessert");
        console.log("Article title improved successfully");
      } else {
        toast.error("Kein verbesserter Titel erhalten");
      }
    } catch (error) {
      console.error("Error improving article title:", error);
      toast.error("Fehler bei der Titel-Verbesserung");
    } finally {
      setImprovingTitles(prev => {
        const newSet = new Set(prev);
        newSet.delete(articleGuid);
        return newSet;
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🤖 KI News Digest
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
            Automatische KI- und Tech-News Aggregation mit intelligenter Zusammenfassung 
            für studentenfreundliche Newsletter
          </p>
          
          {/* Navigation Buttons */}
          <div className="flex flex-wrap gap-3 justify-center mb-6">
            <Link to="/student-news">
              <Button variant="outline" className="bg-blue-50 border-blue-200 hover:bg-blue-100">
                <GraduationCap className="h-4 w-4 mr-2" />
                Top 10 für Studenten anzeigen
              </Button>
            </Link>
            
            <Link to="/interactive-database">
              <Button variant="outline" className="bg-purple-50 border-purple-200 hover:bg-purple-100">
                <Database className="h-4 w-4 mr-2" />
                KI-News Datenbank durchsuchen
              </Button>
            </Link>
          </div>
          
          {/* Debug Buttons */}
          <div className="flex flex-wrap gap-3 justify-center">
            <Button 
              onClick={testRssLoading}
              disabled={debugLoading}
              variant="outline" 
              className="bg-orange-50 border-orange-200 hover:bg-orange-100"
            >
              {debugLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {debugLoading ? "Teste..." : "RSS Debug Test"}
            </Button>
            
            <Button 
              onClick={testGeminiAPI}
              disabled={geminiTestLoading}
              variant="outline" 
              className="bg-red-50 border-red-200 hover:bg-red-100"
            >
              {geminiTestLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {geminiTestLoading ? "Teste..." : "Gemini API Test"}
            </Button>
            
            <Button 
              onClick={testElevenLabsAPI}
              disabled={elevenLabsTestLoading}
              variant="outline" 
              className="bg-green-50 border-green-200 hover:bg-green-100"
            >
              {elevenLabsTestLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {elevenLabsTestLoading ? "Teste..." : "Eleven Labs Test"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-3">
            {isLoading ? (
              <Card className="mb-8">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded" />
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                </CardContent>
              </Card>
            ) : digest ? (
              <WeeklyDigestComponent 
                digest={digest} 
                apiKey={newsService.getGeminiApiKey()}
                newsService={newsService}
              />
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Keine Nachrichten für diese Woche gefunden</p>
                  <Button 
                    onClick={fetchNews} 
                    variant="outline" 
                    className="mt-4"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Erneut versuchen
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
          
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Artikel hinzufügen</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowImporter(!showImporter)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </CardTitle>
                <CardDescription>
                  {customArticles.length} eigene Artikel in der Übersicht
                </CardDescription>
              </CardHeader>
              <CardContent>
                {showImporter && (
                  <div className="mb-4">
                    <CustomArticleImporter 
                      onArticleAdded={handleCustomArticleAdded}
                      newsService={newsService}
                    />
                  </div>
                )}
                
                {customArticles.length === 0 ? (
                  <div className="text-center py-4">
                    <TrendingUp className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 text-sm">Noch keine eigenen Artikel</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Klicken Sie auf das + um Artikel hinzuzufügen
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Ihre eigenen Artikel werden direkt in der Hauptübersicht mit einem 
                      <Badge variant="custom" className="mx-1 text-xs">Eigener Artikel</Badge>
                      Label angezeigt.
                    </p>
                    <div className="text-xs text-gray-500">
                      {customArticles.length} Artikel hinzugefügt
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
