import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RssItem } from "@/types/newsTypes";
import { Check, X, ArrowUp, ArrowDown, Star } from "lucide-react";
import { formatDate } from "@/utils/dateUtils";

interface ArticleRankingProps {
  articles: RssItem[];
  selectedArticles: RssItem[];
  onSelectionChange: (articles: RssItem[]) => void;
  onConfirm: (articles: RssItem[]) => void;
  onCancel: () => void;
}

const ArticleRanking = ({ 
  articles, 
  selectedArticles, 
  onSelectionChange, 
  onConfirm, 
  onCancel 
}: ArticleRankingProps) => {
  const [localSelection, setLocalSelection] = useState<RssItem[]>(selectedArticles);

  const calculateRelevanceScore = (article: RssItem): number => {
    let score = 0;
    
    const relevantKeywords = [
      'KI', 'AI', 'künstliche intelligenz', 'machine learning', 'deep learning',
      'chatgpt', 'openai', 'google', 'microsoft', 'meta', 'tesla', 'nvidia',
      'startup', 'tech', 'innovation', 'digitalisierung', 'automation',
      'robotik', 'algorithmus', 'daten', 'software', 'hardware'
    ];
    
    const titleLower = article.title.toLowerCase();
    const descLower = (article.description || '').toLowerCase();
    
    relevantKeywords.forEach(keyword => {
      if (titleLower.includes(keyword.toLowerCase())) score += 3;
      if (descLower.includes(keyword.toLowerCase())) score += 1;
    });
    
    const daysOld = Math.floor((Date.now() - new Date(article.pubDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysOld <= 1) score += 5;
    else if (daysOld <= 3) score += 3;
    else if (daysOld <= 7) score += 1;
    
    if (article.sourceName === 'Eigener') score += 2;
    
    const reliableSources = ['techcrunch', 'wired', 'ars technica', 'the verge'];
    const sourceLower = (article.sourceName || '').toLowerCase();
    if (reliableSources.some(source => sourceLower.includes(source))) score += 2;
    
    return Math.max(score, 1);
  };

  const rankedArticles = [...articles]
    .map(article => ({
      ...article,
      relevanceScore: calculateRelevanceScore(article)
    }))
    .sort((a, b) => b.relevanceScore - a.relevanceScore);

  const isSelected = (article: RssItem) => {
    return localSelection.some(selected => 
      selected.guid === article.guid || selected.link === article.link
    );
  };

  const toggleArticle = (article: RssItem) => {
    const newSelection = isSelected(article)
      ? localSelection.filter(selected => 
          selected.guid !== article.guid && selected.link !== article.link
        )
      : [...localSelection, article];
    
    setLocalSelection(newSelection);
    onSelectionChange(newSelection);
  };

  const moveArticle = (article: RssItem, direction: 'up' | 'down') => {
    const currentIndex = localSelection.findIndex(selected => 
      selected.guid === article.guid || selected.link === article.link
    );
    
    if (currentIndex === -1) return;
    
    const newSelection = [...localSelection];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (targetIndex >= 0 && targetIndex < newSelection.length) {
      [newSelection[currentIndex], newSelection[targetIndex]] = 
      [newSelection[targetIndex], newSelection[currentIndex]];
      
      setLocalSelection(newSelection);
      onSelectionChange(newSelection);
    }
  };

  const selectTop10 = () => {
    const top10 = rankedArticles.slice(0, 10);
    setLocalSelection(top10);
    onSelectionChange(top10);
  };

  const getRelevanceLabel = (score: number): { label: string; color: string } => {
    if (score >= 8) return { label: 'Sehr relevant', color: 'bg-green-500' };
    if (score >= 5) return { label: 'Relevant', color: 'bg-blue-500' };
    if (score >= 3) return { label: 'Mäßig relevant', color: 'bg-yellow-500' };
    return { label: 'Weniger relevant', color: 'bg-gray-500' };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold">Newsletter-Artikel auswählen</h3>
          <p className="text-sm text-muted-foreground">
            {localSelection.length} von {rankedArticles.length} Artikeln ausgewählt
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={selectTop10}>
            <Star className="h-4 w-4 mr-2" />
            Top 10 auswählen
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Abbrechen
          </Button>
          <Button 
            onClick={() => onConfirm(localSelection)}
            disabled={localSelection.length === 0}
          >
            Bestätigen ({localSelection.length})
          </Button>
        </div>
      </div>

      {localSelection.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ausgewählte Artikel für Newsletter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {localSelection.map((article, index) => {
              const relevance = getRelevanceLabel(calculateRelevanceScore(article));
              return (
                <div 
                  key={`selected-${article.guid || article.link}-${index}`}
                  className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div className="text-sm font-medium text-blue-700">
                    #{index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm line-clamp-2">{article.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {article.sourceName}
                      </Badge>
                      <div className={`px-2 py-1 rounded-full text-xs text-white ${relevance.color}`}>
                        {relevance.label}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => moveArticle(article, 'up')}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => moveArticle(article, 'down')}
                      disabled={index === localSelection.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600"
                      onClick={() => toggleArticle(article)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alle Artikel (nach Relevanz sortiert)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-96 overflow-y-auto">
          {rankedArticles.map((article, index) => {
            const selected = isSelected(article);
            const relevance = getRelevanceLabel(article.relevanceScore);
            
            return (
              <div 
                key={`ranked-${article.guid || article.link}-${index}`}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  selected 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'hover:bg-gray-50 border-gray-200'
                }`}
                onClick={() => toggleArticle(article)}
              >
                <div className="flex items-center justify-center w-8 h-8">
                  {selected ? (
                    <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 border-2 border-gray-300 rounded" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm line-clamp-2">{article.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(article.pubDate)}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {article.sourceName}
                    </Badge>
                    <div className={`px-2 py-1 rounded-full text-xs text-white ${relevance.color}`}>
                      Score: {article.relevanceScore}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default ArticleRanking;
