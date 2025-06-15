import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, XCircle, Copy, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DeploymentStatus {
  name: string;
  deployed: boolean;
  error?: string;
  lastChecked?: Date;
}

export const EdgeFunctionsTroubleshoot = () => {
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [showCommands, setShowCommands] = useState(false);

  const checkAllFunctions = async () => {
    setIsChecking(true);
    const functions = ['gemini-ai', 'fetch-rss', 'qa-archive-search', 'auto-generate-newsletter'];
    const results: DeploymentStatus[] = [];

    for (const functionName of functions) {
      try {
        console.log(`🔍 Checking ${functionName}...`);
        
        const { data, error } = await supabase.functions.invoke(functionName, {
          body: { ping: true }
        });

        if (error) {
          results.push({
            name: functionName,
            deployed: false,
            error: error.message,
            lastChecked: new Date()
          });
          console.log(`❌ ${functionName}: ${error.message}`);
        } else {
          results.push({
            name: functionName,
            deployed: true,
            lastChecked: new Date()
          });
          console.log(`✅ ${functionName}: Deployed`);
        }
      } catch (error) {
        results.push({
          name: functionName,
          deployed: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          lastChecked: new Date()
        });
        console.log(`❌ ${functionName}: ${error}`);
      }
    }

    setDeploymentStatus(results);
    setIsChecking(false);

    const deployedCount = results.filter(r => r.deployed).length;
    const failedCount = results.filter(r => !r.deployed).length;

    if (failedCount === 0) {
      toast.success(`Alle ${deployedCount} Edge Functions sind deployed!`);
    } else {
      toast.error(`${failedCount} Edge Functions fehlen, ${deployedCount} sind verfügbar`);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Command kopiert!");
    });
  };

  const getStatusIcon = (deployed: boolean) => {
    return deployed ? 
      <CheckCircle2 className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (deployed: boolean) => {
    return deployed ? 
      <Badge variant="secondary" className="bg-green-100 text-green-700">Deployed</Badge> :
      <Badge variant="destructive">Missing</Badge>;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <CardTitle>Edge Functions Troubleshooting</CardTitle>
        </div>
        <CardDescription>
          Diagnose und behebe Probleme mit Supabase Edge Functions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Check Functions */}
        <div className="flex gap-3">
          <Button 
            onClick={checkAllFunctions}
            disabled={isChecking}
            className="flex items-center gap-2"
          >
            {isChecking ? "Prüfe..." : "Functions prüfen"}
          </Button>
          
          <Button 
            onClick={() => setShowCommands(!showCommands)}
            variant="outline"
            className="flex items-center gap-2"
          >
            {showCommands ? "Commands ausblenden" : "Deployment Commands zeigen"}
          </Button>
        </div>

        {/* Deployment Status */}
        {deploymentStatus.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Deployment Status</h3>
            
            <div className="space-y-2">
              {deploymentStatus.map((status, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg bg-white"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(status.deployed)}
                    <span className="font-medium">{status.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {status.error && (
                      <span className="text-sm text-red-600 max-w-md truncate">
                        {status.error}
                      </span>
                    )}
                    {getStatusBadge(status.deployed)}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-sm text-gray-500">
              Letzter Check: {deploymentStatus[0]?.lastChecked?.toLocaleTimeString()}
            </div>

            {/* Permission vs Deployment Issue Detection */}
            {deploymentStatus.filter(s => s.deployed).length === 0 && (
              <div className="space-y-4">
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    <div className="font-semibold mb-2">🤔 Ursache identifizieren:</div>
                    <div className="space-y-2 text-sm">
                      <div><strong>Häufige Fehlermeldungen bedeuten:</strong></div>
                      <div>• "Non-2xx status code" = Functions nicht deployed ODER keine Permission</div>
                      <div>• "Failed to send request" = Network/Permission Problem</div>
                      <div>• "Function not found" = Definitiv nicht deployed</div>
                    </div>
                  </AlertDescription>
                </Alert>

                <Alert className="border-blue-200 bg-blue-50">
                  <AlertTriangle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <div className="font-semibold mb-2">❓ Bist du der Supabase Project Owner?</div>
                    <div className="space-y-2 text-sm">
                      <div><strong>Falls NEIN (Teamwork):</strong></div>
                      <div>→ <strong>Option 1:</strong> Freund gibt dir Admin-Zugriff (empfohlen für Teams)</div>
                      <div>→ <strong>Option 2:</strong> Eigenes Dev-Projekt für separate Entwicklung</div>
                      <div>→ Siehe TEAM_SETUP.md für Team-Workflow</div>
                      <br/>
                      <div><strong>Falls JA (du bist Owner):</strong></div>
                      <div>→ Functions sind nicht deployed</div>
                      <div>→ Siehe DEPLOYMENT_FIX.md für Anleitung</div>
                    </div>
                  </AlertDescription>
                </Alert>

                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <div className="font-semibold mb-2">🚨 KRITISCH: Alle Edge Functions fehlen!</div>
                    <div className="space-y-2 text-sm">
                      <div><strong>Quick Fix (falls du Owner bist):</strong></div>
                      <div className="bg-red-100 p-2 rounded font-mono text-xs">
                        <div>1. cd LinkitWeeklyAI</div>
                        <div>2. supabase functions deploy</div>
                        <div>3. supabase secrets set GEMINI_API_KEY=your_key</div>
                      </div>
                      <div className="font-medium">Die App funktioniert NICHT ohne Edge Functions!</div>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
        )}

        {/* Deployment Commands */}
        {showCommands && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Deployment Commands</h3>
            
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Falls Edge Functions fehlen, verwende diese Commands zum Deployment:
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400"># Deploy alle Edge Functions</span>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => copyToClipboard("supabase functions deploy")}
                    className="text-green-400 hover:text-green-300"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div>supabase functions deploy</div>
              </div>

              <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400"># Deploy spezifische Function</span>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => copyToClipboard("supabase functions deploy gemini-ai")}
                    className="text-green-400 hover:text-green-300"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div>supabase functions deploy gemini-ai</div>
              </div>

              <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400"># Liste aller Functions</span>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => copyToClipboard("supabase functions list")}
                    className="text-green-400 hover:text-green-300"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div>supabase functions list</div>
              </div>
            </div>
          </div>
        )}

        {/* Troubleshooting Guide */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-3">🔧 Troubleshooting Guide</h4>
          <div className="space-y-2 text-sm">
            <div><strong>1. Function nicht deployed:</strong> Verwende "supabase functions deploy [function-name]"</div>
            <div><strong>2. API Keys fehlen:</strong> Prüfe Supabase Secrets (GEMINI_API_KEY)</div>
            <div><strong>3. Timeout Errors:</strong> Function Code könnte Fehler haben</div>
            <div><strong>4. Unauthorized:</strong> Supabase Projekt/Keys prüfen</div>
          </div>
        </div>

        {/* Links */}
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open('https://supabase.com/dashboard/project/_/functions', '_blank')}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-3 w-3" />
            Supabase Dashboard
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open('https://supabase.com/docs/guides/functions', '_blank')}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-3 w-3" />
            Functions Docs
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}; 