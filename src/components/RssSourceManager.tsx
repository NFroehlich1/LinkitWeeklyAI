import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RssSource } from "@/services/NewsService";
import { Rss, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/contexts/TranslationContext";

interface RssSourceManagerProps {
  sources: RssSource[];
  onAddSource: (url: string, name: string) => boolean;
  onRemoveSource: (url: string) => boolean;
  onToggleSource: (url: string, enabled: boolean) => boolean;
  onRefresh: () => void;
}

const RssSourceManager = ({
  sources,
  onAddSource,
  onRemoveSource,
  onToggleSource,
  onRefresh,
}: RssSourceManagerProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [newSourceName, setNewSourceName] = useState("");
  
  const handleAddSource = () => {
    if (!newSourceUrl.trim()) {
      toast.error(t('rss.pleaseEnterUrl'));
      return;
    }
    
    if (onAddSource(newSourceUrl.trim(), newSourceName.trim())) {
      setNewSourceUrl("");
      setNewSourceName("");
      setOpen(false);
      onRefresh();
    }
  };
  
  const handleRemoveSource = (url: string) => {
    if (onRemoveSource(url)) {
      onRefresh();
    }
  };
  
  const handleToggleSource = (url: string, enabled: boolean) => {
    if (onToggleSource(url, enabled)) {
      onRefresh();
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Rss className="h-5 w-5 flex-shrink-0" />
          <span className="truncate">{t('rss.rssSources')}</span>
        </CardTitle>
        <CardDescription className="text-sm sm:text-base">
          {t('rss.manageAndAddSources')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        {sources.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <Rss className="h-8 w-8 sm:h-10 sm:w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm sm:text-base">
              {t('rss.noRssSourcesAddOne')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sources.map((source, index) => (
              <div key={index} className="border rounded-lg p-3 sm:p-4 space-y-3">
                {/* Source Info - Stacked on mobile */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm sm:text-base line-clamp-2">
                    {source.name}
                  </h4>
                  <p className="text-xs sm:text-sm text-muted-foreground break-all">
                    {source.url}
                  </p>
                </div>
                
                {/* Controls - Responsive layout */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Switch
                      id={`source-${index}`}
                      checked={source.enabled}
                      onCheckedChange={(checked) => handleToggleSource(source.url, checked)}
                    />
                    <Label 
                      htmlFor={`source-${index}`} 
                      className="text-sm font-medium cursor-pointer"
                    >
                      {source.enabled ? t('rss.active') : t('rss.inactive')}
                    </Label>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveSource(source.url)}
                    className="gap-2 w-full sm:w-auto"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sm:hidden">{t('rss.remove')}</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full gap-2" size="sm">
              <Plus className="h-4 w-4" />
              {t('rss.addRssSource')}
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">{t('rss.addRssSource')}</DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                {t('rss.addAnyRssSource')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="url" className="text-sm font-medium">{t('rss.rssFeedUrl')}</Label>
                <Input
                  id="url"
                  placeholder={t('rss.urlPlaceholder')}
                  value={newSourceUrl}
                  onChange={(e) => setNewSourceUrl(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">{t('rss.nameOptional')}</Label>
                <Input
                  id="name"
                  placeholder={t('rss.sourceNamePlaceholder')}
                  value={newSourceName}
                  onChange={(e) => setNewSourceName(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                onClick={() => setOpen(false)}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                {t('general.cancel')}
              </Button>
              <Button 
                onClick={handleAddSource}
                className="w-full sm:w-auto order-1 sm:order-2"
              >
                {t('rss.add')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
};

export default RssSourceManager;
