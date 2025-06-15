import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Rss, Plus, Trash2, Filter, Eye, EyeOff, RefreshCw, Settings, ArrowLeft, Home } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import NewsService from "@/services/NewsService";
import { RssSource } from "@/types/newsTypes";
import Header from "@/components/Header";
import { useTranslation } from "@/contexts/TranslationContext";

const RssFeedManager = () => {
  const { t } = useTranslation();
  const [newsService] = useState(() => new NewsService());
  const [sources, setSources] = useState<RssSource[]>([]);
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [newSourceName, setNewSourceName] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = () => {
    const allSources = newsService.getRssSources();
    setSources(allSources);
  };

  const filteredSources = showOnlyActive 
    ? sources.filter(source => source.enabled)
    : sources;

  const handleAddSource = () => {
    if (!newSourceUrl.trim()) {
      toast.error(t('rss.pleaseEnterUrl'));
      return;
    }
    
    if (newsService.addRssSource(newSourceUrl.trim(), newSourceName.trim())) {
      setNewSourceUrl("");
      setNewSourceName("");
      setAddDialogOpen(false);
      loadSources();
      toast.success(t('rss.sourceAddedSuccessfully'));
    }
  };

  const handleRemoveSource = (url: string, name: string) => {
    if (newsService.removeRssSource(url)) {
      loadSources();
      toast.success(`"${name}" ${t('rss.wasRemoved')}`);
    }
  };

  const handleToggleSource = (url: string, enabled: boolean) => {
    if (newsService.toggleRssSource(url, enabled)) {
      loadSources();
    }
  };

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      toast.info(t('rss.testingAllSources'));
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success(t('rss.allSourcesTested'));
    } catch (error) {
      toast.error(t('rss.errorTestingSources'));
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleResetToDefaults = () => {
    newsService.resetRssSourcesToDefaults();
    loadSources();
  };

  const getStatusBadge = (source: RssSource) => {
    if (source.enabled) {
      return <Badge variant="default" className="bg-green-100 text-green-800">{t('rss.active')}</Badge>;
    } else {
      return <Badge variant="secondary">{t('rss.inactive')}</Badge>;
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto p-6 space-y-6">
          {/* Back Navigation & Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link to="/">
                  <Button variant="outline" size="sm" className="gap-2 hover:bg-blue-50 hover:border-blue-300">
                    <ArrowLeft className="h-4 w-4" />
                    {t('rss.backToMain')}
                  </Button>
                </Link>
                <Link to="/">
                  <Button variant="ghost" size="sm" className="gap-2 hover:bg-blue-50">
                    <Home className="h-4 w-4" />
                    {t('nav.home')}
                  </Button>
                </Link>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                <Settings className="h-6 w-6 sm:h-8 sm:w-8" />
                {t('rss.title')}
              </h1>
              <p className="text-muted-foreground mt-1">
                {t('rss.subtitle')}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setShowOnlyActive(!showOnlyActive)}
                className="gap-2"
              >
                {showOnlyActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                {showOnlyActive ? t('rss.showAll') : t('rss.showOnlyActive')}
              </Button>
              
              <Button
                variant="outline"
                onClick={handleRefreshAll}
                disabled={isRefreshing}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {t('rss.testAll')}
              </Button>
              
              <Button
                variant="outline"
                onClick={handleResetToDefaults}
                className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <Settings className="h-4 w-4" />
                {t('rss.loadDefaultSources')}
              </Button>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{sources.length}</div>
                  <div className="text-sm text-muted-foreground">{t('rss.totalSources')}</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {sources.filter(s => s.enabled).length}
                  </div>
                  <div className="text-sm text-muted-foreground">{t('rss.activeSources')}</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {sources.filter(s => !s.enabled).length}
                  </div>
                  <div className="text-sm text-muted-foreground">{t('rss.inactiveSources')}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter Info */}
          {showOnlyActive && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Filter className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-700 font-medium">
                {t('rss.onlyActiveShown')} ({filteredSources.length} {t('rss.of')} {sources.length})
              </span>
            </div>
          )}

          {/* RSS Sources List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Rss className="h-5 w-5" />
                  {t('rss.myRssSources')} ({filteredSources.length})
                </CardTitle>
                <CardDescription>
                  {t('rss.allConfiguredFeeds')}
                </CardDescription>
              </div>
              
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    {t('rss.newSource')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-md mx-auto">
                  <DialogHeader>
                    <DialogTitle>{t('rss.addRssSource')}</DialogTitle>
                    <DialogDescription>
                      {t('rss.addSourceDescription')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="url">{t('rss.rssFeedUrl')}</Label>
                      <Input
                        id="url"
                        placeholder={t('rss.urlPlaceholder')}
                        value={newSourceUrl}
                        onChange={(e) => setNewSourceUrl(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">{t('rss.nameOptional')}</Label>
                      <Input
                        id="name"
                        placeholder={t('rss.sourceNamePlaceholder')}
                        value={newSourceName}
                        onChange={(e) => setNewSourceName(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setAddDialogOpen(false)}
                    >
                      {t('general.cancel')}
                    </Button>
                    <Button onClick={handleAddSource}>
                      {t('rss.add')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            
            <CardContent>
              {filteredSources.length === 0 ? (
                <div className="text-center py-8">
                  <Rss className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-lg font-medium mb-2">
                    {showOnlyActive ? t('rss.noActiveRssSources') : t('rss.noRssSourcesAvailable')}
                  </p>
                  <p className="text-muted-foreground mb-4">
                    {showOnlyActive 
                      ? t('rss.activateAtLeastOne')
                      : t('rss.addYourFirstSource')
                    }
                  </p>
                  {showOnlyActive && (
                    <Button 
                      variant="outline" 
                      onClick={() => setShowOnlyActive(false)}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      {t('rss.showAllRssSources')}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSources.map((source, index) => (
                    <div 
                      key={index} 
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        {/* Source Info */}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-base line-clamp-1">
                                {source.name}
                              </h3>
                              <p className="text-sm text-muted-foreground break-all">
                                {source.url}
                              </p>
                            </div>
                            {getStatusBadge(source)}
                          </div>
                          
                          {source.lastFetched && (
                            <p className="text-xs text-muted-foreground">
                              {t('rss.lastFetched')}: {new Date(source.lastFetched).toLocaleString()}
                            </p>
                          )}
                        </div>
                        
                        {/* Controls */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`source-${index}`}
                              checked={source.enabled}
                              onCheckedChange={(checked) => handleToggleSource(source.url, checked)}
                            />
                            <Label 
                              htmlFor={`source-${index}`} 
                              className="text-sm cursor-pointer"
                            >
                              {source.enabled ? t('rss.active') : t('rss.inactive')}
                            </Label>
                          </div>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="hidden sm:inline">{t('rss.remove')}</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t('rss.removeRssSource')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t('rss.removeConfirmation')} "{source.name}" {t('rss.removeConfirmationEnd')}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t('general.cancel')}</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemoveSource(source.url, source.name)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  {t('rss.remove')}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default RssFeedManager; 