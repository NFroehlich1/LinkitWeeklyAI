import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RssItem } from "@/types/newsTypes";
import { ExternalLink, Trash2, ChevronDown, ChevronUp, RefreshCw, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/dateUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

interface NewsCardProps {
  item: RssItem;
  isLoading?: boolean;
  onDelete?: (item: RssItem) => void;
  onTitleImproved?: (item: RssItem, newTitle: string) => void;
}

const NewsCard = ({ item, isLoading = false, onDelete, onTitleImproved }: NewsCardProps) => {
  const { t, language } = useLanguage();
  
  // Return loading state if item is undefined
  if (!item) {
    return (
      <Card className="overflow-hidden h-full flex flex-col">
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
    );
  }

  const { title, link, pubDate, description, categories, sourceName, aiSummary, content } = item;
  const [isOpen, setIsOpen] = useState(false);
  const [localAiSummary, setLocalAiSummary] = useState<string | null>(aiSummary || null);
  const [isGeneratingAiSummary, setIsGeneratingAiSummary] = useState(false);
  const [isImprovingTitle, setIsImprovingTitle] = useState(false);
  const [localTitle, setLocalTitle] = useState<string>(title);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const validateImageUrl = (url?: string): boolean => {
    if (!url) return false;
    // Check for common image extensions
    return /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(url);
  };
  
  const imageUrl = validateImageUrl(item.imageUrl) ? item.imageUrl : null;

  // Verbesserte Logik für die Erkennung von eigenen Artikeln
  const isCustomArticle = 
    item.sourceName === 'Eigener' || 
    item.sourceName === 'Custom' || 
    item.sourceName === 'Eigener Import' ||
    item.sourceName === 'Custom Import' ||
    (item as any).isCustom === true ||
    item.guid?.includes('custom-') ||
    false;

  // Translate sourceName to German for display
  const getDisplaySourceName = (sourceName: string) => {
    const translations: { [key: string]: string } = {
      'Custom': 'Eigener',
      'Custom Import': 'Eigener Import',
      'Manual Import': 'Manueller Import'
    };
    return translations[sourceName] || sourceName;
  };

  // Show loading skeleton when article is being generated
  if (isLoading) {
    return (
      <Card className="overflow-hidden h-full flex flex-col">
        {Math.random() > 0.5 && (
          <div className="h-48 overflow-hidden">
            <Skeleton className="h-full w-full" />
          </div>
        )}
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
        <CardFooter className="flex flex-col space-y-3 pt-2">
          <div className="flex flex-wrap gap-1">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-10 w-full" />
        </CardFooter>
      </Card>
    );
  }

  const handleDelete = async () => {
    if (!onDelete) return;
    
    setIsDeleting(true);
    try {
      // If the article has an guid that looks like a database ID, try to delete it from Supabase
      if (item.guid && item.guid.includes('-') && item.guid.length > 10) {
        const { error } = await supabase
          .from('daily_raw_articles')
          .delete()
          .eq('guid', item.guid);
        
        if (error) {
          console.error("Error deleting article from database:", error);
          toast.error(t('common.error'));
          return;
        }
        
        toast.success(t('news.removed_from_overview'));
      }
      
      // Call the parent's onDelete handler
      onDelete(item);
    } catch (error) {
      console.error("Error deleting article:", error);
      toast.error(t('common.error'));
    } finally {
      setIsDeleting(false);
    }
  };

  const getPreviewText = () => {
    if (localAiSummary) {
      return localAiSummary.length > 200
        ? `${localAiSummary.substring(0, 200)}...`
        : localAiSummary;
    } else if (description) {
      return description.length > 150
        ? `${description.substring(0, 150)}...`
        : description;
    }
    return null;
  };
  
  const generateAiSummary = async () => {
    if (isGeneratingAiSummary) return;
    
    setIsGeneratingAiSummary(true);
    try {
      console.log("Generating AI summary for article:", localTitle);
      console.log("Article data being sent:", {
        title: item.title,
        description: item.description?.substring(0, 100),
        content: item.content?.substring(0, 100),
        sourceName: item.sourceName
      });
      
      const { data, error } = await supabase.functions.invoke('gemini-ai', {
        body: { 
          action: 'generate-article-summary',
          data: { 
            article: {
              ...item,
              title: localTitle,
              content: item.content || item.description || '',
              description: item.description || ''
            },
            language: language
          }
        }
      });

      if (error) {
        console.error("Supabase function error:", error);
        toast.error(t('common.error'));
        return;
      }

      if (data.error) {
        console.error("Gemini API Error:", data.error);
        toast.error(t('common.error'));
        return;
      }

      if (data.summary) {
        setLocalAiSummary(data.summary);
        toast.success(t('news.generate_ai_summary'));
        console.log("AI summary generated successfully:", data.summary.substring(0, 100));
      } else {
        toast.error(t('common.error'));
      }
    } catch (error) {
      console.error("Error generating AI summary:", error);
      toast.error(t('common.error'));
    } finally {
      setIsGeneratingAiSummary(false);
    }
  };

  const improveTitle = async () => {
    if (isImprovingTitle) return;
    
    setIsImprovingTitle(true);
    try {
      console.log("Improving title for article:", localTitle);
      
      const { data, error } = await supabase.functions.invoke('gemini-ai', {
        body: { 
          action: 'improve-article-title',
          data: { 
            article: {
              ...item,
              title: localTitle
            }
          }
        }
      });

      if (error) {
        console.error("Supabase function error:", error);
        toast.error(t('common.error'));
        return;
      }

      if (data.error) {
        console.error("Gemini API Error:", data.error);
        toast.error(t('common.error'));
        return;
      }

      if (data.improvedTitle) {
        // Lokalen State aktualisieren
        setLocalTitle(data.improvedTitle);
        
        // Titel dauerhaft in der Datenbank speichern
        if (item.guid) {
          console.log("Saving improved title to database for article:", item.guid);
          const { error: updateError } = await supabase
            .from('daily_raw_articles')
            .update({ 
              title: data.improvedTitle,
              updated_at: new Date().toISOString()
            })
            .eq('guid', item.guid);

          if (updateError) {
            console.error("Error saving improved title to database:", updateError);
            toast.error(t('common.error'));
          } else {
            console.log("✅ Improved title saved to database successfully");
            toast.success(t('common.success'));
            
            // Parent Component über Änderung informieren
            if (onTitleImproved) {
              onTitleImproved({ ...item, title: data.improvedTitle }, data.improvedTitle);
            }
          }
        } else {
          // Fallback für Artikel ohne GUID (sollte nicht vorkommen)
          toast.success(t('common.success'));
          if (onTitleImproved) {
            onTitleImproved(item, data.improvedTitle);
          }
        }
        
        console.log("Article title improved successfully:", data.improvedTitle);
      } else {
        toast.error(t('common.error'));
      }
    } catch (error) {
      console.error("Error improving article title:", error);
      toast.error(t('common.error'));
    } finally {
      setIsImprovingTitle(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && !localAiSummary) {
      generateAiSummary();
    }
  };

  return (
    <Card className={`overflow-hidden h-full flex flex-col relative ${isCustomArticle ? 'border-blue-500 bg-blue-50/50 shadow-md' : ''}`}>
      {imageUrl && (
        <div className="h-48 overflow-hidden relative">
          <img 
            src={imageUrl} 
            alt={localTitle} 
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement!.style.display = 'none';
            }}
          />
          {isCustomArticle && (
            <div className="absolute top-3 left-3 z-10">
              <Badge variant="custom" className="shadow-lg">
                {t('main.custom_article_label')}
              </Badge>
            </div>
          )}
        </div>
      )}
      
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-3 flex items-center gap-2">
              {localTitle}
              {isImprovingTitle && (
                <div title="Titel wird mit KI verbessert...">
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-500 flex-shrink-0" />
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-blue-500 hover:bg-blue-50 flex-shrink-0"
                onClick={(e) => {
                  e.preventDefault();
                  improveTitle();
                }}
                disabled={isImprovingTitle}
                title={t('news.ai_summary')}
              >
                <Edit3 className="h-3 w-3" />
              </Button>
            </CardTitle>
            {!imageUrl && isCustomArticle && (
              <div className="mt-2">
                <Badge variant="custom" className="shadow-sm">
                  {t('main.custom_article_label')}
                </Badge>
              </div>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete();
                }}
                disabled={isDeleting}
                title={t('selection.delete_permanently')}
              >
                {isDeleting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-sm text-muted-foreground">{formatDate(pubDate)}</span>
          {sourceName && !isCustomArticle && (
            <div>
              <Badge variant="outline">{getDisplaySourceName(sourceName)}</Badge>
            </div>
          )}
        </div>
      </CardHeader>
      
      <Collapsible open={isOpen} onOpenChange={handleOpenChange} className="flex-grow">
        <CardContent className="pb-0">
          {!isOpen && localAiSummary && (
            <div>
              <h4 className="text-sm font-medium mb-2">{t('news.ai_summary')}</h4>
              <p className="text-sm line-clamp-3">{getPreviewText()}</p>
            </div>
          )}
          
          <CollapsibleTrigger asChild className="w-full">
            <Button variant="ghost" size="sm" className="w-full flex items-center justify-center text-xs mt-2">
              {isOpen ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  {t('common.show_less')}
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  {t('common.show_more')}
                </>
              )}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            {isGeneratingAiSummary ? (
              <div className="mt-4 border-t pt-4">
                <h4 className="text-sm font-medium mb-2">{t('news.ai_summary')}</h4>
                <div className="bg-muted/30 p-3 rounded flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <p className="text-sm">{t('news.generating_summary')}</p>
                </div>
              </div>
            ) : localAiSummary ? (
              <div className="mt-4 border-t pt-4">
                <h4 className="text-sm font-medium mb-2 flex justify-between">
                  <span>{t('news.ai_summary')}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-xs" 
                    onClick={(e) => {
                      e.preventDefault();
                      generateAiSummary();
                    }}
                    disabled={isGeneratingAiSummary}
                  >
                    <RefreshCw className={`h-3 w-3 mr-1 ${isGeneratingAiSummary ? 'animate-spin' : ''}`} />
                    {t('button.refresh')}
                  </Button>
                </h4>
                <div className="bg-muted/30 p-3 rounded">
                  <p className="text-sm">{localAiSummary}</p>
                </div>
              </div>
            ) : (
              <div className="mt-4 border-t pt-4">
                <h4 className="text-sm font-medium mb-2">{t('news.ai_summary')}</h4>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={generateAiSummary}
                  disabled={isGeneratingAiSummary}
                >
                  {isGeneratingAiSummary ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      {t('news.generating_summary')}
                    </>
                  ) : (
                    <>
                      {t('news.generate_ai_summary')}
                    </>
                  )}
                </Button>
              </div>
            )}
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
      
      <CardFooter className="flex flex-col space-y-3 pt-2">
        <div className="flex flex-wrap gap-1">
          {categories?.slice(0, 3).map((category, index) => (
            <Badge key={index} variant="secondary">{category}</Badge>
          ))}
        </div>
        <div className="w-full flex items-center gap-2">
          <Button 
            className="flex-1 flex items-center gap-2" 
            variant="outline"
            onClick={() => window.open(link, '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
            {t('news.read_article')}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default NewsCard;
