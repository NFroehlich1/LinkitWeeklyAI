
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { RefreshCw, TrendingUp, GraduationCap, BookOpen, ArrowLeft } from "lucide-react";
import NewsService, { RssItem } from "@/services/NewsService";
import { getCurrentWeek, getCurrentYear } from "@/utils/dateUtils";
import Header from "@/components/Header";
import NewsCard from "@/components/NewsCard";
import { Link } from "react-router-dom";

const StudentNews = () => {
  const [newsService] = useState(new NewsService());
  const [relevantArticles, setRelevantArticles] = useState<RssItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchStudentRelevantNews();
  }, []);

  const fetchStudentRelevantNews = async () => {
    setIsLoading(true);
    try {
      console.log("=== FETCHING STUDENT RELEVANT NEWS ===");
      
      // Get all current week articles
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

      // Filter for current week
      const currentWeekItems = newsService.filterCurrentWeekNews(allItems);
      
      // Filter for student-relevant articles based on keywords and topics
      const studentRelevantItems = filterStudentRelevantArticles(currentWeekItems);
      
      // Sort by relevance and take top 10
      const topRelevantArticles = studentRelevantItems
        .sort((a, b) => calculateRelevanceScore(b) - calculateRelevanceScore(a))
        .slice(0, 10);
      
      setRelevantArticles(topRelevantArticles);
      console.log(`✅ Found ${topRelevantArticles.length} student-relevant articles`);
      
    } catch (error) {
      console.error('Error fetching student relevant news:', error);
      toast.error(`Fehler beim Laden der Studenten-relevanten Nachrichten: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const filterStudentRelevantArticles = (articles: RssItem[]): RssItem[] => {
    const studentKeywords = [
      // Technologie & KI
      'künstliche intelligenz', 'ki', 'ai', 'machine learning', 'deep learning',
      'technologie', 'innovation', 'startup', 'tech', 'digital',
      // Bildung & Karriere
      'student', 'studium', 'universität', 'hochschule', 'bildung', 'karriere',
      'praktikum', 'job', 'ausbildung', 'lernen', 'weiterbildung',
      // Programmierung & IT
      'programmierung', 'coding', 'software', 'entwicklung', 'web', 'app',
      'python', 'javascript', 'react', 'github', 'open source',
      // Zukunft & Trends
      'zukunft', 'trend', 'forschung', 'wissenschaft', 'digitalisierung',
      'nachhaltigkeit', 'fintech', 'blockchain', 'kryptowährung',
      // Wirtschaft & Business
      'wirtschaft', 'business', 'unternehmen', 'management', 'marketing',
      'e-commerce', 'online', 'social media', 'platform'
    ];

    return articles.filter(article => {
      const searchText = `${article.title} ${article.description || ''} ${(article.categories || []).join(' ')}`.toLowerCase();
      
      // Check if any student keyword is present
      const hasStudentKeyword = studentKeywords.some(keyword => 
        searchText.includes(keyword.toLowerCase())
      );
      
      // Additional filters for relevance
      const isFromTechSource = article.sourceName && [
        'TechCrunch', 'Wired', 'Ars Technica', 'The Verge', 'MIT Technology Review',
        'Golem', 'Heise', 't3n', 'Gründerszene'
      ].some(source => article.sourceName?.includes(source));
      
      return hasStudentKeyword || isFromTechSource;
    });
  };

  const calculateRelevanceScore = (article: RssItem): number => {
    let score = 0;
    const searchText = `${article.title} ${article.description || ''}`.toLowerCase();
    
    // High priority keywords
    const highPriorityKeywords = ['ki', 'ai', 'student', 'studium', 'programmierung', 'startup', 'innovation'];
    highPriorityKeywords.forEach(keyword => {
      if (searchText.includes(keyword)) score += 3;
    });
    
    // Medium priority keywords
    const mediumPriorityKeywords = ['technologie', 'digital', 'zukunft', 'karriere', 'job'];
    mediumPriorityKeywords.forEach(keyword => {
      if (searchText.includes(keyword)) score += 2;
    });
    
    // Recent articles get bonus points
    const articleDate = new Date(article.pubDate);
    const now = new Date();
    const hoursDiff = (now.getTime() - articleDate.getTime()) / (1000 * 3600);
    if (hoursDiff < 24) score += 2;
    else if (hoursDiff < 48) score += 1;
    
    // Articles with AI summary get bonus
    if (article.aiSummary) score += 1;
    
    return score;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zur Hauptseite
          </Link>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <GraduationCap className="h-8 w-8 text-blue-600" />
              <h1 className="text-4xl font-bold text-gray-900">
                Top 10 für Studenten
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Die relevantesten Tech- und KI-Nachrichten für Studierende - 
              kuratiert und nach Wichtigkeit sortiert
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <BookOpen className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-gray-500">
                KW {getCurrentWeek()}/{getCurrentYear()} • Automatisch aktualisiert
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Relevanteste Artikel</h2>
            <Badge variant="custom">{relevantArticles.length} Artikel</Badge>
          </div>
          
          <Button 
            onClick={fetchStudentRelevantNews} 
            variant="outline"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Aktualisiere...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Aktualisieren
              </>
            )}
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="overflow-hidden h-full flex flex-col">
                <CardHeader>
                  <Skeleton className="h-6 w-full mb-2" />
                  <div className="flex items-center justify-between mt-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-5 w-1/4" />
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-5/6" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : relevantArticles.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {relevantArticles.map((article, index) => (
                <div key={article.guid || article.link} className="relative">
                  <div className="absolute -top-2 -left-2 z-10">
                    <Badge variant="custom" className="text-xs">
                      #{index + 1}
                    </Badge>
                  </div>
                  <NewsCard 
                    item={article}
                    isLoading={false}
                  />
                </div>
              ))}
            </div>
            
            <Card className="bg-blue-50/50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-blue-600" />
                  Auswahlkriterien
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium mb-2">Relevanz-Filter:</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• KI & Technologie-Themen</li>
                      <li>• Programmierung & Software</li>
                      <li>• Karriere & Bildung</li>
                      <li>• Startup & Innovation</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Bewertungskriterien:</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Aktualität der Nachrichten</li>
                      <li>• Studenten-relevante Keywords</li>
                      <li>• Vertrauenswürdige Quellen</li>
                      <li>• Praktische Anwendbarkeit</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Keine studenten-relevanten Artikel gefunden
              </h3>
              <p className="text-gray-600 mb-4">
                Momentan sind keine Artikel verfügbar, die unseren Kriterien entsprechen.
              </p>
              <Button 
                onClick={fetchStudentRelevantNews} 
                variant="outline"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Erneut versuchen
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default StudentNews;
