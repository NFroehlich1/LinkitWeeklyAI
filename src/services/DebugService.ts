import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RssFeedService } from "./RssFeedService";
import { DecoderService } from "./DecoderService";
import { GeminiPrompts } from "./GeminiPrompts";
import { RssPrompts } from "./RssPrompts";

/**
 * Debug Service for Hybrid Architecture
 * 
 * Tests all components step by step to identify issues
 */
export class DebugService {
  private rssFeedService: RssFeedService;
  private decoderService: DecoderService;

  constructor() {
    this.rssFeedService = new RssFeedService();
    this.decoderService = new DecoderService();
    console.log("🔍 DebugService initialized");
  }

  /**
   * Run Complete System Check
   */
  public async runCompleteSystemCheck(): Promise<void> {
    console.log("🚀 ===== COMPLETE SYSTEM DEBUG CHECK =====");
    
    try {
      // 1. Test Supabase Connection
      await this.testSupabaseConnection();
      
      // 2. Test Edge Functions Availability
      await this.testEdgeFunctionsAvailability();
      
      // 3. Test RSS Edge Function
      await this.testRssEdgeFunction();
      
      // 4. Test Gemini Edge Function
      await this.testGeminiEdgeFunction();
      
      // 5. Test Local Services
      await this.testLocalServices();
      
      // 6. Test Complete RSS Flow
      await this.testCompleteRssFlow();
      
      // 7. Test Complete AI Flow
      await this.testCompleteAiFlow();
      
      console.log("✅ ===== SYSTEM CHECK COMPLETE =====");
      toast.success("System Debug Check abgeschlossen - siehe Konsole für Details");
      
    } catch (error) {
      console.error("❌ System check failed:", error);
      toast.error(`System Check fehlgeschlagen: ${error}`);
    }
  }

  /**
   * 1. Test Supabase Connection
   */
  private async testSupabaseConnection(): Promise<void> {
    console.log("🔗 1. Testing Supabase Connection...");
    
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.warn("⚠️ Auth error (kann normal sein):", error.message);
      } else {
        console.log("✅ Supabase client verbunden");
      }
      
      // Test if we can reach Supabase at all
      const { data: testData, error: testError } = await supabase
        .from('daily_raw_articles')
        .select('count')
        .limit(1);
        
      if (testError) {
        console.warn("⚠️ Database test error:", testError.message);
      } else {
        console.log("✅ Supabase Database erreichbar");
      }
      
    } catch (error) {
      console.error("❌ Supabase connection failed:", error);
      throw new Error(`Supabase Verbindung fehlgeschlagen: ${error}`);
    }
  }

  /**
   * 2. Test Edge Functions Availability
   */
  private async testEdgeFunctionsAvailability(): Promise<void> {
    console.log("🔧 2. Testing Edge Functions Availability...");
    
    const functionsToTest = ['gemini-ai', 'fetch-rss'];
    
    for (const functionName of functionsToTest) {
      try {
        console.log(`📡 Testing ${functionName}...`);
        
        const { data, error } = await supabase.functions.invoke(functionName, {
          body: { test: 'ping' }
        });
        
        if (error) {
          console.error(`❌ ${functionName} Error Details:`, {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            fullError: error
          });
          
          // More specific error messages
          if (error.message?.includes('Function not found')) {
            throw new Error(`${functionName} wurde nicht deployed oder existiert nicht`);
          } else if (error.message?.includes('unauthorized')) {
            throw new Error(`${functionName} Zugriff verweigert - API Keys prüfen`);
          } else if (error.message?.includes('timeout')) {
            throw new Error(`${functionName} Timeout - Function läuft zu lange`);
          } else {
            throw new Error(`${functionName} nicht verfügbar: ${error.message}`);
          }
        } else {
          console.log(`✅ ${functionName} erreichbar`);
          console.log(`📊 ${functionName} Response:`, data);
        }
        
      } catch (error) {
        console.error(`❌ ${functionName} Test failed:`, error);
        
        // Add more context to the error
        if (error instanceof Error) {
          throw new Error(`${functionName} Test fehlgeschlagen: ${error.message}`);
        } else {
          throw new Error(`${functionName} Test fehlgeschlagen: Unbekannter Fehler`);
        }
      }
    }
    
    console.log("✅ All Edge Functions verfügbar");
  }

  /**
   * 3. Test RSS Edge Function
   */
  private async testRssEdgeFunction(): Promise<void> {
    console.log("📰 3. Testing RSS Edge Function...");
    
    try {
      const testUrl = "https://the-decoder.de/feed/";
      
      console.log(`📡 Calling fetch-rss with URL: ${testUrl}`);
      
      const { data, error } = await supabase.functions.invoke('fetch-rss', {
        body: {
          url: testUrl,
          source_name: "Debug Test",
          raw_mode: true
        }
      });
      
      if (error) {
        console.error("❌ RSS Edge Function Error:", error);
        throw new Error(`RSS Edge Function Fehler: ${error.message}`);
      }
      
      console.log("📊 RSS Edge Function Response:", {
        success: data?.success,
        articlesCount: data?.articles?.length || 0,
        feedInfo: data?.feedInfo
      });
      
      if (!data?.success) {
        throw new Error(`RSS Fetch failed: ${data?.error}`);
      }
      
      if (!data?.articles || data.articles.length === 0) {
        throw new Error("Keine RSS-Artikel erhalten");
      }
      
      console.log("✅ RSS Edge Function funktioniert");
      console.log(`📊 ${data.articles.length} Raw-Artikel erhalten`);
      
    } catch (error) {
      console.error("❌ RSS Edge Function Test failed:", error);
      throw new Error(`RSS Edge Function Test fehlgeschlagen: ${error}`);
    }
  }

  /**
   * 4. Test Gemini Edge Function
   */
  private async testGeminiEdgeFunction(): Promise<void> {
    console.log("🤖 4. Testing Gemini Edge Function...");
    
    try {
      console.log("📡 Testing Gemini API Key verification...");
      
      const { data, error } = await supabase.functions.invoke('gemini-ai', {
        body: {
          action: 'raw-call',
          prompt: 'Antworte nur mit "Test erfolgreich"',
          config: { temperature: 0.1, maxOutputTokens: 10 }
        }
      });
      
      if (error) {
        console.error("❌ Gemini Edge Function Error:", error);
        throw new Error(`Gemini Edge Function Fehler: ${error.message}`);
      }
      
      console.log("📊 Gemini Edge Function Response:", {
        success: data?.success,
        content: data?.content,
        hasError: !!data?.error
      });
      
      if (data?.error) {
        throw new Error(`Gemini API Error: ${data.error}`);
      }
      
      if (!data?.content) {
        throw new Error("Keine Antwort von Gemini erhalten");
      }
      
      console.log("✅ Gemini Edge Function funktioniert");
      console.log(`📊 Gemini Response: "${data.content}"`);
      
    } catch (error) {
      console.error("❌ Gemini Edge Function Test failed:", error);
      throw new Error(`Gemini Edge Function Test fehlgeschlagen: ${error}`);
    }
  }

  /**
   * 5. Test Local Services
   */
  private async testLocalServices(): Promise<void> {
    console.log("🏠 5. Testing Local Services...");
    
    try {
      // Test GeminiPrompts
      console.log("🧠 Testing GeminiPrompts...");
      const testPrompt = GeminiPrompts.generateArticleSummaryPrompt({
        title: "Test Artikel",
        description: "Test Beschreibung",
        link: "https://test.com",
        pubDate: new Date().toISOString(),
        content: "Test Content"
      });
      
      if (testPrompt.length < 100) {
        throw new Error("GeminiPrompts generiert zu kurze Prompts");
      }
      console.log("✅ GeminiPrompts funktioniert");
      
      // Test RssPrompts
      console.log("📰 Testing RssPrompts...");
      const testRawItem = {
        title: "Test <strong>Title</strong>",
        description: "Test &amp; Description",
        link: "https://test.com",
        pubDate: new Date().toISOString()
      };
      
      const processedItem = RssPrompts.processRssItem(testRawItem, "Test Source");
      
      if (!processedItem || processedItem.title !== "Test Title") {
        throw new Error("RssPrompts verarbeitet Items nicht korrekt");
      }
      console.log("✅ RssPrompts funktioniert");
      
      // Test Services initialization
      console.log("🔧 Testing Services...");
      if (!this.rssFeedService || !this.decoderService) {
        throw new Error("Services nicht korrekt initialisiert");
      }
      console.log("✅ Services initialisiert");
      
    } catch (error) {
      console.error("❌ Local Services Test failed:", error);
      throw new Error(`Local Services Test fehlgeschlagen: ${error}`);
    }
  }

  /**
   * 6. Test Complete RSS Flow
   */
  private async testCompleteRssFlow(): Promise<void> {
    console.log("🔄 6. Testing Complete RSS Flow...");
    
    try {
      const testSource = {
        name: "The Decoder Debug",
        url: "https://the-decoder.de/feed/",
        enabled: true
      };
      
      console.log("📡 Testing complete RSS fetch with local processing...");
      
      const articles = await this.rssFeedService.fetchRssSource(testSource);
      
      if (!articles || articles.length === 0) {
        throw new Error("Keine verarbeiteten Artikel erhalten");
      }
      
      console.log(`✅ Complete RSS Flow erfolgreich`);
      console.log(`📊 ${articles.length} verarbeitete Artikel erhalten`);
      
      // Test first article structure
      const firstArticle = articles[0];
      console.log("📊 First Article Structure:", {
        hasTitle: !!firstArticle.title,
        hasLink: !!firstArticle.link,
        hasDescription: !!firstArticle.description,
        hasDate: !!firstArticle.pubDate,
        hasSource: !!firstArticle.sourceName
      });
      
    } catch (error) {
      console.error("❌ Complete RSS Flow Test failed:", error);
      throw new Error(`Complete RSS Flow Test fehlgeschlagen: ${error}`);
    }
  }

  /**
   * 7. Test Complete AI Flow
   */
  private async testCompleteAiFlow(): Promise<void> {
    console.log("🤖 7. Testing Complete AI Flow...");
    
    try {
      const testArticle = {
        title: "KI-Revolution in der Bildung",
        description: "Neue Technologien verändern das Lernen",
        link: "https://test.com/ki-bildung",
        pubDate: new Date().toISOString(),
        content: "Künstliche Intelligenz revolutioniert die Bildung...",
        sourceName: "Test Source"
      };
      
      console.log("🧠 Testing article summary generation...");
      
      const summaryResult = await this.decoderService.generateArticleSummary(testArticle);
      
      if (!summaryResult.success || !summaryResult.content) {
        throw new Error(`AI Summary failed: ${summaryResult}`);
      }
      
      console.log("✅ Complete AI Flow erfolgreich");
      console.log(`📊 Summary Length: ${summaryResult.content.length} chars`);
      console.log(`📊 Summary Preview: "${summaryResult.content.substring(0, 100)}..."`);
      
    } catch (error) {
      console.error("❌ Complete AI Flow Test failed:", error);
      throw new Error(`Complete AI Flow Test fehlgeschlagen: ${error}`);
    }
  }

  /**
   * Quick Health Check
   */
  public async quickHealthCheck(): Promise<void> {
    console.log("⚡ Quick Health Check...");
    
    try {
      // Test Supabase
      const { error } = await supabase.auth.getSession();
      if (error) {
        console.warn("⚠️ Supabase Auth Warning:", error.message);
      } else {
        console.log("✅ Supabase OK");
      }
      
      // Test RSS function availability
      const { error: rssError } = await supabase.functions.invoke('fetch-rss', {
        body: { test: 'ping' }
      });
      
      if (rssError) {
        console.error("❌ RSS Function Error:", rssError.message);
      } else {
        console.log("✅ RSS Function OK");
      }
      
      // Test Gemini function availability
      const { error: geminiError } = await supabase.functions.invoke('gemini-ai', {
        body: { test: 'ping' }
      });
      
      if (geminiError) {
        console.error("❌ Gemini Function Error:", geminiError.message);
      } else {
        console.log("✅ Gemini Function OK");
      }
      
      toast.success("Quick Health Check abgeschlossen");
      
    } catch (error) {
      console.error("❌ Quick Health Check failed:", error);
      toast.error("Quick Health Check fehlgeschlagen");
    }
  }

  /**
   * Test Individual Components
   */
  public async testRssOnly(): Promise<void> {
    console.log("📰 Testing RSS Only...");
    await this.testRssEdgeFunction();
    await this.testCompleteRssFlow();
  }

  public async testAiOnly(): Promise<void> {
    console.log("🤖 Testing AI Only...");
    await this.testGeminiEdgeFunction();
    await this.testCompleteAiFlow();
  }

  /**
   * Check what Edge Functions are actually deployed
   */
  public async checkDeployedFunctions(): Promise<void> {
    console.log("🔍 Checking deployed Edge Functions...");
    
    const functionsToCheck = ['gemini-ai', 'fetch-rss', 'qa-archive-search', 'auto-generate-newsletter'];
    const deployedFunctions: string[] = [];
    const failedFunctions: { name: string; error: string }[] = [];
    
    for (const functionName of functionsToCheck) {
      try {
        console.log(`🔍 Checking ${functionName}...`);
        
        // Use a very simple test call
        const { data, error } = await supabase.functions.invoke(functionName, {
          body: { ping: true }
        });
        
        if (error) {
          failedFunctions.push({
            name: functionName,
            error: error.message || 'Unknown error'
          });
          console.log(`❌ ${functionName}: ${error.message}`);
        } else {
          deployedFunctions.push(functionName);
          console.log(`✅ ${functionName}: Available`);
        }
        
      } catch (error) {
        failedFunctions.push({
          name: functionName,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        console.log(`❌ ${functionName}: ${error}`);
      }
    }
    
    console.log("📊 DEPLOYMENT STATUS:");
    console.log(`✅ Deployed Functions (${deployedFunctions.length}):`, deployedFunctions);
    console.log(`❌ Failed Functions (${failedFunctions.length}):`, failedFunctions);
    
    if (deployedFunctions.length === 0) {
      console.error("🚨 CRITICAL: No Edge Functions are deployed!");
      toast.error("Keine Edge Functions verfügbar - bitte deployment prüfen");
    } else if (failedFunctions.length > 0) {
      console.warn(`⚠️ ${failedFunctions.length} Edge Functions fehlen`);
      toast.warning(`${deployedFunctions.length}/${functionsToCheck.length} Functions verfügbar`);
    } else {
      console.log("🎉 All Edge Functions are deployed and available!");
      toast.success("Alle Edge Functions verfügbar");
    }
  }

  /**
   * Quick deployment check
   */
  public async quickDeploymentCheck(): Promise<{ deployed: string[]; failed: string[] }> {
    console.log("⚡ Quick Deployment Check...");
    
    const required = ['gemini-ai', 'fetch-rss'];
    const deployed: string[] = [];
    const failed: string[] = [];
    
    for (const functionName of required) {
      try {
        const { error } = await supabase.functions.invoke(functionName, {
          body: { ping: true }
        });
        
        if (error) {
          failed.push(functionName);
        } else {
          deployed.push(functionName);
        }
      } catch {
        failed.push(functionName);
      }
    }
    
    console.log(`📊 Quick Check: ${deployed.length}/${required.length} required functions available`);
    return { deployed, failed };
  }
}

export default DebugService; 