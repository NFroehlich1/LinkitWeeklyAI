
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Plus, RefreshCw, Link, FileText } from "lucide-react";
import { toast } from "sonner";
import { RssItem } from "@/types/newsTypes";
import NewsService from "@/services/NewsService";

interface CustomArticleImporterProps {
  onArticleAdded: (article: RssItem) => void;
  newsService?: NewsService;
}

const CustomArticleImporter = ({ onArticleAdded, newsService }: CustomArticleImporterProps) => {
  const [url, setUrl] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [useCustomData, setUseCustomData] = useState(false);

  const handleImportFromUrl = async () => {
    if (!url.trim()) {
      toast.error("Bitte geben Sie eine URL ein");
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      toast.error("Ungültige URL");
      return;
    }

    setIsLoading(true);
    
    try {
      const serviceToUse = newsService || new NewsService();
      
      // Fetch metadata from URL
      const metadata = await serviceToUse.fetchArticleMetadata(url);
      
      // Prepare title and description with proper Markdown formatting
      const title = useCustomData && customTitle ? customTitle : (metadata.title || "Custom Article");
      const description = useCustomData && customDescription ? customDescription : (metadata.description || "Manually imported article from " + url);
      
      // Format content with proper Markdown headers
      let formattedContent = `# ${title}\n\n`;
      
      if (description) {
        formattedContent += `${description}\n\n`;
      }
      
      if (metadata.content && metadata.content !== description) {
        formattedContent += `${metadata.content}\n\n`;
      }
      
      formattedContent += `**Quelle:** [${new URL(url).hostname}](${url})`;
      
      // Create custom article object
      const customArticle: RssItem = {
        title: title,
        description: description,
        link: url,
        pubDate: new Date().toISOString(),
        guid: url, // Use URL as GUID for custom articles
        categories: ["Manuell hinzugefügt"],
        sourceName: "Custom Import",
        creator: "Manual Import",
        content: formattedContent, // Use the formatted content with proper Markdown
        imageUrl: metadata.imageUrl
      };

      onArticleAdded(customArticle);
      
      // Reset form
      setUrl("");
      setCustomTitle("");
      setCustomDescription("");
      setUseCustomData(false);
      
      toast.success("Artikel erfolgreich hinzugefügt");
    } catch (error) {
      console.error("Error importing article:", error);
      toast.error("Fehler beim Importieren des Artikels");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Eigenen Artikel hinzufügen
        </CardTitle>
        <CardDescription>
          Artikel über URL importieren oder manuell erstellen
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="article-url">Artikel-URL</Label>
          <div className="relative">
            <Link className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="article-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/artikel"
              className="pl-9"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="use-custom-data"
            checked={useCustomData}
            onChange={(e) => setUseCustomData(e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="use-custom-data" className="text-sm">
            Eigene Titel und Beschreibung verwenden
          </Label>
        </div>

        {useCustomData && (
          <div className="space-y-4 border-t pt-4">
            <div className="space-y-2">
              <Label htmlFor="custom-title">Titel (optional)</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="custom-title"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Eigener Artikel-Titel"
                  className="pl-9"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-description">Beschreibung (optional)</Label>
              <Textarea
                id="custom-description"
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="Eigene Artikel-Beschreibung"
                rows={3}
                disabled={isLoading}
              />
            </div>
          </div>
        )}

        <Button
          onClick={handleImportFromUrl}
          disabled={isLoading || !url.trim()}
          className="w-full"
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Importiere Artikel...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Artikel hinzufügen
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CustomArticleImporter;
