import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Key, Check, X, ExternalLink, Cloud, Shield, RefreshCw, Settings } from "lucide-react";
import { toast } from "sonner";
import { geminiService } from "@/services/GeminiService";
import { useLanguage } from "@/contexts/LanguageContext";

const GeminiKeyManager = () => {
  const { t } = useLanguage();
  const [isVerifying, setIsVerifying] = useState(false);
  const [keyStatus, setKeyStatus] = useState<'valid' | 'invalid' | 'unknown'>('unknown');
  const [isLoading, setIsLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  useEffect(() => {
    checkCurrentKeyStatus();
  }, []);

  const checkCurrentKeyStatus = async () => {
    setIsLoading(true);
    setIsVerifying(true);
    try {
      console.log("🔍 Checking current Gemini API key status...");
      
      const result = await geminiService.verifyApiKey();
      
      if (result.isValid) {
        setKeyStatus('valid');
        toast.success("API Key ist verfügbar und funktioniert!");
      } else {
        setKeyStatus('invalid');
        toast.error(result.message);
      }
      
      setLastChecked(new Date());
      
    } catch (error) {
      console.error("Error checking key status:", error);
      setKeyStatus('unknown');
      toast.error("Fehler beim Prüfen des API Key Status");
    } finally {
      setIsLoading(false);
      setIsVerifying(false);
    }
  };

  const handleRefreshStatus = async () => {
    // Clear the cached key to force a fresh check
    geminiService.clearCache();
    await checkCurrentKeyStatus();
  };

  const getStatusBadge = () => {
    switch (keyStatus) {
      case 'valid':
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            <Check className="h-3 w-3 mr-1" />
            Verfügbar & Gültig
          </Badge>
        );
      case 'invalid':
        return (
          <Badge variant="destructive">
            <X className="h-3 w-3 mr-1" />
            Nicht verfügbar
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            Unbekannt
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Gemini API Status
          </CardTitle>
          <CardDescription>Prüfe API-Verfügbarkeit...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Gemini API Status
        </CardTitle>
        <CardDescription>
          API Key wird sicher über Supabase Environment Variables verwaltet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            {getStatusBadge()}
          </div>
          <div className="flex items-center gap-2">
            <Cloud className="h-4 w-4 text-blue-500" />
            <Badge variant="outline" className="bg-blue-50 border-blue-200">
              Environment-Managed
            </Badge>
          </div>
        </div>

        {/* Last Checked Info */}
        {lastChecked && (
          <div className="text-xs text-gray-500">
            Zuletzt geprüft: {lastChecked.toLocaleString('de-DE')}
          </div>
        )}

        {/* System Architecture Info */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <strong>Hybrid-Architektur:</strong> API Key wird sicher aus Supabase Environment 
              Variables abgerufen, dann erfolgen direkte Calls an die Gemini API für optimale Performance.
            </div>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="flex gap-2">
          <Button 
            onClick={handleRefreshStatus} 
            disabled={isVerifying}
            variant="outline"
            className="flex-1"
          >
            {isVerifying ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {isVerifying ? "Prüfe..." : "Status aktualisieren"}
          </Button>
        </div>

        {/* Status Messages */}
        {keyStatus === 'valid' && (
          <Alert>
            <Check className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div>
                  ✅ Gemini API ist verfügbar und funktioniert. Alle KI-Funktionen sind aktiviert.
                </div>
                <div className="text-sm text-green-700 flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Sicher über Supabase Environment Variables verwaltet
                </div>
                <div className="text-sm text-green-700">
                  🚀 Direkte API-Aufrufe für beste Performance
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {keyStatus === 'invalid' && (
          <Alert variant="destructive">
            <X className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div>
                  ❌ Gemini API Key ist nicht verfügbar oder ungültig.
                </div>
                <div className="text-sm">
                  Der Administrator muss den GEMINI_API_KEY in den Supabase Environment Variables konfigurieren.
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {keyStatus === 'unknown' && (
          <Alert>
            <Settings className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div>
                  ⚠️ API Key Status konnte nicht ermittelt werden.
                </div>
                <div className="text-sm text-gray-600">
                  Möglicherweise ist die Supabase-Verbindung nicht verfügbar.
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Admin Information */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Für Administratoren:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li className="flex items-center gap-2">
              <Settings className="h-3 w-3 text-gray-500" />
              API Key in Supabase Environment Variables als `GEMINI_API_KEY` setzen
            </li>
            <li className="flex items-center gap-2">
              <Shield className="h-3 w-3 text-gray-500" />
              Edge Function `get-gemini-key` deployed
            </li>
            <li className="flex items-center gap-2">
              <Cloud className="h-3 w-3 text-gray-500" />
              Supabase Secrets sicher konfiguriert
            </li>
          </ul>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => window.open('https://makersuite.google.com/app/apikey', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Google AI Studio (API Key erstellen)
          </Button>
        </div>

        {/* Performance Benefits */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Performance-Features:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li className="flex items-center gap-2">
              <Check className="h-3 w-3 text-green-600" />
              Direkte Gemini API Calls (keine Edge Function Latenz)
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-3 w-3 text-green-600" />
              API Key Caching für bessere Performance
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-3 w-3 text-green-600" />
              Automatische Key-Invalidierung bei Fehlern
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-3 w-3 text-green-600" />
              Sichere Environment Variable Verwaltung
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default GeminiKeyManager; 