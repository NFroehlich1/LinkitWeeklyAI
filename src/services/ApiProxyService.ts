import { supabase } from "@/integrations/supabase/client";

export interface GeminiRequest {
  action: 'verify-key' | 'generate-summary' | 'generate-article-summary' | 'improve-article-title' | 'qa-with-newsletter';
  data?: any;
}

export interface RssRequest {
  url: string;
  source_name?: string;
}

export interface QARequest {
  action: 'search' | 'qa';
  query: string;
  yearFilter?: number;
  weekFilter?: number;
  limit?: number;
}

/**
 * API Proxy Service
 * 
 * This service acts as a bridge between the client and external APIs.
 * Instead of calling Supabase Edge Functions, we'll create a simple backend API
 * that uses Supabase secrets securely.
 * 
 * The backend will be a simple Express.js server or similar that:
 * 1. Receives requests from the client
 * 2. Fetches API keys from Supabase secrets/environment
 * 3. Makes the actual API calls
 * 4. Returns responses to the client
 */
class ApiProxyService {
  private backendUrl: string;

  constructor() {
    // This will be your backend API URL - can be hosted on Vercel, Railway, etc.
    this.backendUrl = import.meta.env.VITE_API_BACKEND_URL || 'http://localhost:8000';
  }

  /**
   * Make Gemini API calls through backend proxy
   */
  async callGemini(request: GeminiRequest): Promise<any> {
    try {
      const response = await fetch(`${this.backendUrl}/api/gemini`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Gemini API proxy error:', error);
      throw error;
    }
  }

  /**
   * Fetch RSS through backend proxy
   */
  async fetchRss(request: RssRequest): Promise<any> {
    try {
      const response = await fetch(`${this.backendUrl}/api/rss`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('RSS API proxy error:', error);
      throw error;
    }
  }

  /**
   * QA Archive search through backend proxy
   */
  async qaArchiveSearch(request: QARequest): Promise<any> {
    try {
      const response = await fetch(`${this.backendUrl}/api/qa-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('QA Archive API proxy error:', error);
      throw error;
    }
  }

  /**
   * Newsletter operations through backend proxy
   */
  async newsletterOperation(operation: string, data: any): Promise<any> {
    try {
      const response = await fetch(`${this.backendUrl}/api/newsletter/${operation}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Newsletter API proxy error:', error);
      throw error;
    }
  }
}

export const apiProxyService = new ApiProxyService(); 