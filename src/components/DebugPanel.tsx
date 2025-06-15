import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import DebugService from "@/services/DebugService";
import { Bug, Play, CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error' | 'warning';
  message?: string;
  duration?: number;
}

export const DebugPanel = () => {
  const [debugService] = useState(() => new DebugService());
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  const resetResults = () => {
    setTestResults([]);
  };

  const addResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result]);
  };

  const updateResult = (name: string, updates: Partial<TestResult>) => {
    setTestResults(prev => 
      prev.map(result => 
        result.name === name ? { ...result, ...updates } : result
      )
    );
  };

  const runCompleteSystemCheck = async () => {
    setIsRunning(true);
    resetResults();
    setShowLogs(true);

    const testSteps = [
      'Supabase Verbindung',
      'Edge Functions Verfügbarkeit',
      'RSS Edge Function',
      'Gemini Edge Function',
      'Lokale Services',
      'Kompletter RSS Flow',
      'Kompletter AI Flow'
    ];

    // Initialize all test results as pending
    testSteps.forEach(step => {
      addResult({ name: step, status: 'pending' });
    });

    try {
      // Track timing
      const startTime = Date.now();

      console.log("🚀 ===== DEBUG PANEL: COMPLETE SYSTEM CHECK =====");
      
      // 1. Supabase Connection
      updateResult('Supabase Verbindung', { status: 'running' });
      try {
        await debugService['testSupabaseConnection']();
        updateResult('Supabase Verbindung', { 
          status: 'success', 
          message: 'Verbindung erfolgreich' 
        });
      } catch (error) {
        updateResult('Supabase Verbindung', { 
          status: 'error', 
          message: `${error}` 
        });
        throw error;
      }

      // 2. Edge Functions Availability
      updateResult('Edge Functions Verfügbarkeit', { status: 'running' });
      try {
        await debugService['testEdgeFunctionsAvailability']();
        updateResult('Edge Functions Verfügbarkeit', { 
          status: 'success', 
          message: 'Alle Functions erreichbar' 
        });
      } catch (error) {
        updateResult('Edge Functions Verfügbarkeit', { 
          status: 'error', 
          message: `${error}` 
        });
        throw error;
      }

      // 3. RSS Edge Function
      updateResult('RSS Edge Function', { status: 'running' });
      try {
        await debugService['testRssEdgeFunction']();
        updateResult('RSS Edge Function', { 
          status: 'success', 
          message: 'RSS Fetch funktioniert' 
        });
      } catch (error) {
        updateResult('RSS Edge Function', { 
          status: 'error', 
          message: `${error}` 
        });
        throw error;
      }

      // 4. Gemini Edge Function
      updateResult('Gemini Edge Function', { status: 'running' });
      try {
        await debugService['testGeminiEdgeFunction']();
        updateResult('Gemini Edge Function', { 
          status: 'success', 
          message: 'Gemini API funktioniert' 
        });
      } catch (error) {
        updateResult('Gemini Edge Function', { 
          status: 'error', 
          message: `${error}` 
        });
        throw error;
      }

      // 5. Local Services
      updateResult('Lokale Services', { status: 'running' });
      try {
        await debugService['testLocalServices']();
        updateResult('Lokale Services', { 
          status: 'success', 
          message: 'Alle lokalen Services OK' 
        });
      } catch (error) {
        updateResult('Lokale Services', { 
          status: 'error', 
          message: `${error}` 
        });
        throw error;
      }

      // 6. Complete RSS Flow
      updateResult('Kompletter RSS Flow', { status: 'running' });
      try {
        await debugService['testCompleteRssFlow']();
        updateResult('Kompletter RSS Flow', { 
          status: 'success', 
          message: 'RSS Pipeline funktioniert' 
        });
      } catch (error) {
        updateResult('Kompletter RSS Flow', { 
          status: 'error', 
          message: `${error}` 
        });
        throw error;
      }

      // 7. Complete AI Flow
      updateResult('Kompletter AI Flow', { status: 'running' });
      try {
        await debugService['testCompleteAiFlow']();
        updateResult('Kompletter AI Flow', { 
          status: 'success', 
          message: 'AI Pipeline funktioniert' 
        });
      } catch (error) {
        updateResult('Kompletter AI Flow', { 
          status: 'error', 
          message: `${error}` 
        });
        throw error;
      }

      const duration = Date.now() - startTime;
      console.log(`✅ ===== SYSTEM CHECK COMPLETE (${duration}ms) =====`);
      toast.success(`System Check erfolgreich abgeschlossen (${(duration/1000).toFixed(1)}s)`);
      
    } catch (error) {
      console.error("❌ System check failed:", error);
      toast.error("System Check fehlgeschlagen - siehe Details unten");
    } finally {
      setIsRunning(false);
    }
  };

  const runQuickHealthCheck = async () => {
    setIsRunning(true);
    resetResults();
    
    try {
      await debugService.quickHealthCheck();
      toast.success("Quick Health Check abgeschlossen");
    } catch (error) {
      toast.error("Quick Health Check fehlgeschlagen");
    } finally {
      setIsRunning(false);
    }
  };

  const runRssTest = async () => {
    setIsRunning(true);
    try {
      await debugService.testRssOnly();
      toast.success("RSS Test abgeschlossen");
    } catch (error) {
      toast.error("RSS Test fehlgeschlagen");
    } finally {
      setIsRunning(false);
    }
  };

  const runAiTest = async () => {
    setIsRunning(true);
    try {
      await debugService.testAiOnly();
      toast.success("AI Test abgeschlossen");
    } catch (error) {
      toast.error("AI Test fehlgeschlagen");
    } finally {
      setIsRunning(false);
    }
  };

  const checkDeployment = async () => {
    setIsRunning(true);
    try {
      await debugService.checkDeployedFunctions();
      toast.success("Deployment Check abgeschlossen");
    } catch (error) {
      toast.error("Deployment Check fehlgeschlagen");
    } finally {
      setIsRunning(false);
    }
  };

  const quickDeploymentCheck = async () => {
    setIsRunning(true);
    try {
      const result = await debugService.quickDeploymentCheck();
      if (result.failed.length === 0) {
        toast.success(`Alle ${result.deployed.length} Functions verfügbar`);
      } else {
        toast.warning(`${result.deployed.length} verfügbar, ${result.failed.length} fehlen`);
      }
    } catch (error) {
      toast.error("Quick Check fehlgeschlagen");
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'running':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Läuft</Badge>;
      case 'success':
        return <Badge variant="secondary" className="bg-green-100 text-green-700">Erfolg</Badge>;
      case 'error':
        return <Badge variant="destructive">Fehler</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">Warnung</Badge>;
      default:
        return <Badge variant="outline">Warten</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          <CardTitle>System Debug Panel</CardTitle>
        </div>
        <CardDescription>
          Teste die Hybrid-Architektur: Edge Functions + Lokale Services
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button 
            onClick={runCompleteSystemCheck}
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            Volltest
          </Button>
          
          <Button 
            onClick={runQuickHealthCheck}
            disabled={isRunning}
            variant="outline"
            className="flex items-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Health Check
          </Button>
          
          <Button 
            onClick={runRssTest}
            disabled={isRunning}
            variant="outline"
            className="flex items-center gap-2"
          >
            📰 RSS Test
          </Button>
          
          <Button 
            onClick={runAiTest}
            disabled={isRunning}
            variant="outline"
            className="flex items-center gap-2"
          >
            🤖 AI Test
          </Button>
        </div>

        {/* Deployment Check Section */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-semibold text-red-800 mb-3">🚨 Deployment Check</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <Button 
              onClick={checkDeployment}
              disabled={isRunning}
              variant="outline"
              className="flex items-center gap-2 border-red-300 text-red-700 hover:bg-red-100"
            >
              🔍 Check Functions
            </Button>
            
            <Button 
              onClick={quickDeploymentCheck}
              disabled={isRunning}
              variant="outline"
              className="flex items-center gap-2 border-red-300 text-red-700 hover:bg-red-100"
            >
              ⚡ Quick Check
            </Button>
          </div>
          <p className="text-sm text-red-600">
            Diese Tests prüfen, ob die Edge Functions korrekt deployed sind.
          </p>
        </div>

        <Separator />

        {/* Test Results */}
        {showLogs && testResults.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Test Ergebnisse</h3>
            
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div 
                  key={`${result.name}-${index}`}
                  className="flex items-center justify-between p-3 border rounded-lg bg-white"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <span className="font-medium">{result.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {result.message && (
                      <span className="text-sm text-gray-600 max-w-md truncate">
                        {result.message}
                      </span>
                    )}
                    {getStatusBadge(result.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Debug Hinweise:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <strong>Volltest:</strong> Testet alle Komponenten der Hybrid-Architektur</li>
            <li>• <strong>Health Check:</strong> Schnelle Überprüfung der Grundfunktionen</li>
            <li>• <strong>RSS Test:</strong> Testet nur RSS Edge Function + lokale Verarbeitung</li>
            <li>• <strong>AI Test:</strong> Testet nur Gemini Edge Function + lokale Prompts</li>
            <li>• Detaillierte Logs sind in der Browser-Konsole (F12)</li>
          </ul>
        </div>

        {/* Console Helper */}
        <div className="bg-black text-green-400 p-3 rounded-lg font-mono text-sm">
          <div>Console Commands:</div>
          <div className="text-gray-400 mt-1">
            Press F12 → Console tab für detaillierte Debug-Ausgaben
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 