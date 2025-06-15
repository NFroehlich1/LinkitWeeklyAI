import NewsService from '@/services/NewsService';
import DebugService from '@/services/DebugService';
import { RssFeedService } from '@/services/RssFeedService';
import { DecoderService } from '@/services/DecoderService';

/**
 * Debug Helper Functions
 * 
 * These functions can be called from the browser console for debugging
 * To use: Open F12 → Console → Type: window.debugHelpers.testRss()
 */

// Create service instances
const newsService = new NewsService();
const debugService = new DebugService();
const rssFeedService = new RssFeedService();
const decoderService = new DecoderService();

export const debugHelpers = {
  // Quick tests
  async testRss() {
    console.log("🧪 Quick RSS Test");
    try {
      await debugService.testRssOnly();
      console.log("✅ RSS Test completed");
    } catch (error) {
      console.error("❌ RSS Test failed:", error);
    }
  },

  async testAi() {
    console.log("🧪 Quick AI Test");
    try {
      await debugService.testAiOnly();
      console.log("✅ AI Test completed");
    } catch (error) {
      console.error("❌ AI Test failed:", error);
    }
  },

  async fullSystemCheck() {
    console.log("🧪 Full System Check");
    try {
      await debugService.runCompleteSystemCheck();
      console.log("✅ System Check completed");
    } catch (error) {
      console.error("❌ System Check failed:", error);
    }
  },

  async checkDeployment() {
    console.log("🧪 Edge Functions Deployment Check");
    try {
      await debugService.checkDeployedFunctions();
      console.log("✅ Deployment Check completed");
    } catch (error) {
      console.error("❌ Deployment Check failed:", error);
    }
  },

  async quickDeploymentCheck() {
    console.log("🧪 Quick Deployment Check");
    try {
      const result = await debugService.quickDeploymentCheck();
      console.log(`📊 Result: ${result.deployed.length} deployed, ${result.failed.length} failed`);
      return result;
    } catch (error) {
      console.error("❌ Quick Deployment Check failed:", error);
      throw error;
    }
  },

  async testNewsService() {
    console.log("🧪 NewsService Test");
    try {
      const articles = await newsService.fetchNews();
      console.log(`✅ NewsService returned ${articles.length} articles`);
      return articles;
    } catch (error) {
      console.error("❌ NewsService Test failed:", error);
      throw error;
    }
  },

  async testSingleRssSource(url: string = "https://the-decoder.de/feed/") {
    console.log(`🧪 Testing single RSS source: ${url}`);
    try {
      const articles = await rssFeedService.fetchRssSource({
        name: "Debug Test",
        url: url,
        enabled: true
      });
      console.log(`✅ Got ${articles.length} articles from ${url}`);
      return articles;
    } catch (error) {
      console.error(`❌ RSS source test failed for ${url}:`, error);
      throw error;
    }
  },

  async testGeminiPrompt(prompt: string = "Sage Hallo!") {
    console.log(`🧪 Testing Gemini with prompt: "${prompt}"`);
    try {
      const result = await decoderService.improveArticleTitle(prompt, 'de');
      if (result.success) {
        console.log(`✅ Gemini Response: "${result.content}"`);
        return result.content;
      } else {
        console.error("❌ Gemini call failed:", result);
        throw new Error("Gemini call failed");
      }
    } catch (error) {
      console.error("❌ Gemini test failed:", error);
      throw error;
    }
  },

  // Inspection helpers
  getRssSources() {
    const sources = newsService.getRssSources();
    console.log("📊 Available RSS Sources:", sources);
    return sources;
  },

  getEnabledRssSources() {
    const enabled = newsService.getEnabledRssSources();
    console.log("📊 Enabled RSS Sources:", enabled);
    return enabled;
  },

  async getStoredArticles(limit: number = 10) {
    console.log(`📊 Getting stored articles (limit: ${limit})...`);
    try {
      const articles = await newsService.getAllStoredArticles(limit);
      console.log(`✅ Found ${articles.length} stored articles`);
      console.table(articles.map(a => ({
        title: a.title.substring(0, 50) + '...',
        source: a.sourceName,
        date: a.pubDate
      })));
      return articles;
    } catch (error) {
      console.error("❌ Error getting stored articles:", error);
      throw error;
    }
  },

  async getArticleStats() {
    console.log("📊 Getting article statistics...");
    try {
      const stats = await newsService.getArticleStats();
      console.log("✅ Article Stats:", stats);
      return stats;
    } catch (error) {
      console.error("❌ Error getting article stats:", error);
      throw error;
    }
  },

  // Service instances (for advanced debugging)
  services: {
    newsService,
    debugService,
    rssFeedService,
    decoderService
  },

  // Help function
  help() {
    console.log(`
🔧 Debug Helper Functions

Basic Tests:
• debugHelpers.testRss() - Test RSS functionality
• debugHelpers.testAi() - Test AI functionality  
• debugHelpers.fullSystemCheck() - Complete system test
• debugHelpers.testNewsService() - Test main news service

Deployment Checks:
• debugHelpers.checkDeployment() - Check all Edge Functions deployment
• debugHelpers.quickDeploymentCheck() - Quick check of required functions

Single Component Tests:
• debugHelpers.testSingleRssSource(url?) - Test specific RSS feed
• debugHelpers.testGeminiPrompt(prompt?) - Test AI with custom prompt

Information:
• debugHelpers.getRssSources() - Show all RSS sources
• debugHelpers.getEnabledRssSources() - Show enabled sources
• debugHelpers.getStoredArticles(limit?) - Show stored articles
• debugHelpers.getArticleStats() - Show article statistics

Advanced:
• debugHelpers.services - Access to service instances
• debugHelpers.help() - Show this help

Example usage:
debugHelpers.checkDeployment()
debugHelpers.testRss()
debugHelpers.testGeminiPrompt("Erkläre KI in einem Satz")
debugHelpers.getStoredArticles(5)
    `);
  }
};

// Make it available globally for console access
if (typeof window !== 'undefined') {
  (window as any).debugHelpers = debugHelpers;
  console.log("🔧 Debug helpers loaded! Type 'debugHelpers.help()' for available commands");
} 