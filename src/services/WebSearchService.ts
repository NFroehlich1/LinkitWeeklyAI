import { supabase } from "@/integrations/supabase/client";

export interface SearchResult {
  title: string;
  description: string;
  url: string;
}

export interface SearchResponse {
  success: boolean;
  results: {
    query: string;
    results: SearchResult[];
    error?: string;
    count: number;
  }[];
  totalResults: number;
  linkedAccountOwnerId: string;
  timestamp: string;
}

export interface SearchAnalysis {
  needsSearch: boolean;
  queries: string[];
  reasoning: string;
}

export class WebSearchService {
  private aiModel: 'gemini' | 'mistral';

  constructor(aiModel: 'gemini' | 'mistral' = 'mistral') {
    this.aiModel = aiModel;
  }

  /**
   * Verify that ACI.dev Brave Search is properly configured
   */
  async verifySetup(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      console.log('🔍 Verifying ACI.dev Brave Search setup...');
      
      const { data, error } = await supabase.functions.invoke('aci-brave-search', {
        body: {
          action: 'verify-setup'
        }
      });

      if (error) {
        console.error('❌ Setup verification failed:', error);
        return {
          success: false,
          message: 'Fehler bei der Verbindung zum ACI.dev Service',
          details: error
        };
      }

      if (data.success) {
        console.log('✅ ACI.dev Brave Search setup verified');
        return {
          success: true,
          message: data.message,
          details: data
        };
      } else {
        console.error('❌ Setup verification failed:', data);
        return {
          success: false,
          message: data.message || 'Setup-Verifikation fehlgeschlagen',
          details: data
        };
      }
    } catch (error) {
      console.error('💥 Error verifying setup:', error);
      return {
        success: false,
        message: 'Fehler bei der Setup-Verifikation',
        details: error
      };
    }
  }

  /**
   * Analyze a question to determine if web search is needed and extract search queries
   */
  async analyzeQuestion(question: string, context?: string): Promise<SearchAnalysis> {
    try {
      console.log('🤔 Analyzing question for search needs:', question);
      
      const analysisPrompt = `Analyze this question and determine if web search would help provide a better answer. If yes, extract 1-3 search queries.

Question: "${question}"

Context available: ${context ? 'Yes - newsletter/article content available' : 'No additional context'}

Instructions:
1. If the question can be fully answered with the provided context, respond with: NO_SEARCH_NEEDED
2. If web search would help get current information, respond with: SEARCH_NEEDED followed by ONE search query starting with "QUERY:"

Examples:
- "What are the latest AI developments?" → SEARCH_NEEDED\nQUERY: latest AI developments 2024
- "What does this newsletter say about OpenAI?" → NO_SEARCH_NEEDED (if context available)
- "What's happening with ChatGPT today?" → SEARCH_NEEDED\nQUERY: ChatGPT news today

Note: Only provide ONE search query to avoid rate limiting issues with the search API.

Response:`;

      const functionName = this.aiModel === 'gemini' ? 'gemini-ai' : 'mistral-ai';
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {
          action: 'qa-with-newsletter',
          data: {
            question: analysisPrompt,
            newsletter: context || 'No additional context provided.'
          }
        }
      });

      if (error || !data?.content) {
        console.error('❌ Question analysis failed:', error);
        // Fallback: assume search is needed for questions about current events
        const currentKeywords = ['latest', 'today', 'current', 'recent', 'new', 'aktuell', 'neueste', 'heute'];
        const needsSearch = currentKeywords.some(keyword => 
          question.toLowerCase().includes(keyword)
        );
        
        return {
          needsSearch,
          queries: needsSearch ? [question] : [],
          reasoning: 'Fallback analysis due to AI service error'
        };
      }

      const analysisContent = data.content;
      console.log('🧠 Analysis result:', analysisContent);

      if (analysisContent.includes('SEARCH_NEEDED')) {
        const queries = analysisContent
          .split('\n')
          .filter((line: string) => line.startsWith('QUERY:'))
          .map((line: string) => line.replace('QUERY:', '').trim())
          .slice(0, 1); // Only take the first query to avoid rate limiting

        return {
          needsSearch: true,
          queries,
          reasoning: 'AI determined web search would be helpful'
        };
      } else {
        return {
          needsSearch: false,
          queries: [],
          reasoning: 'AI determined existing context is sufficient'
        };
      }
    } catch (error) {
      console.error('💥 Error analyzing question:', error);
      return {
        needsSearch: false,
        queries: [],
        reasoning: 'Error during analysis'
      };
    }
  }

  /**
   * Perform web search using ACI.dev Brave Search
   */
  async performSearch(queries: string[], maxResults: number = 5): Promise<SearchResponse | null> {
    try {
      // To avoid rate limiting, only use the first query
      const limitedQueries = queries.slice(0, 1);
      if (queries.length > 1) {
        console.log(`⚠️ Rate limiting protection: Using only first query of ${queries.length} provided`);
        console.log('🔍 Ignored queries:', queries.slice(1));
      }
      console.log('🔍 Performing web search for queries:', limitedQueries);
      
      const { data, error } = await supabase.functions.invoke('aci-brave-search', {
        body: {
          action: 'search',
          data: {
            queries: limitedQueries,
            maxResults
          }
        }
      });

      if (error) {
        console.error('❌ Web search failed:', error);
        
        // Check if it's a function not found error (external Supabase)
        if (error.message?.includes('Failed to send a request') || 
            error.message?.includes('CORS') ||
            error.message?.includes('net::ERR_FAILED')) {
          console.warn('🚨 aci-brave-search function not deployed to external Supabase');
          throw new Error('Web search service not available. Please deploy the aci-brave-search function to your Supabase project.');
        }
        
        throw new Error(`Web search failed: ${error.message}`);
      }

      if (!data.success) {
        console.error('❌ Search returned error:', data);
        throw new Error(data.error || 'Search failed');
      }

      console.log('✅ Web search completed successfully');
      console.log('📊 Search results:', data.totalResults, 'total results');
      
      return data as SearchResponse;
    } catch (error) {
      console.error('💥 Error in web search:', error);
      throw error; // Re-throw to handle in calling function
    }
  }

  /**
   * Generate a comprehensive answer using both context and web search results
   */
  async generateAnswerWithSearch(
    question: string, 
    context: string, 
    searchResults?: SearchResponse
  ): Promise<{ content: string; searchPerformed: boolean; searchQueries: string[] }> {
    try {
      console.log('📝 Generating answer with search integration...');
      
      let prompt = `Answer the following question in German. Be comprehensive and helpful.

Question: "${question}"

Context: ${context}`;

      if (searchResults && searchResults.totalResults > 0) {
        prompt += `\n\nWeb Search Results:\n`;
        
        searchResults.results.forEach((result, index) => {
          if (result.results.length > 0) {
            prompt += `\nSearch: "${result.query}"\n`;
            result.results.forEach((searchResult, resultIndex) => {
              prompt += `${resultIndex + 1}. ${searchResult.title}\n   ${searchResult.description}\n   URL: ${searchResult.url}\n`;
            });
          }
        });
        
        prompt += `\nIMPORTANT: When referencing web search results, include the URLs and make it clear which information comes from web search vs. provided context.`;
      }

      prompt += `\n\nProvide a detailed, helpful answer in German. ${searchResults ? 'Combine information from both the provided context and web search results where relevant.' : 'Base your answer on the provided context.'}`;

      const functionName = this.aiModel === 'gemini' ? 'gemini-ai' : 'mistral-ai';
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {
          action: 'qa-with-newsletter',
          data: {
            question: prompt,
            newsletter: context || 'No additional context provided.'
          }
        }
      });

      if (error || !data?.content) {
        console.error('❌ Answer generation failed:', error);
        throw new Error('Failed to generate answer');
      }

      const searchQueries = searchResults ? 
        searchResults.results.map(r => r.query).filter(q => q) : 
        [];

      console.log('✅ Answer generated successfully');
      
      return {
        content: data.content,
        searchPerformed: !!searchResults && searchResults.totalResults > 0,
        searchQueries
      };
    } catch (error) {
      console.error('💥 Error generating answer:', error);
      throw error;
    }
  }

  /**
   * Complete workflow: analyze question, search if needed, generate answer
   */
  async askWithSearch(
    question: string, 
    context: string = ''
  ): Promise<{ 
    content: string; 
    searchPerformed: boolean; 
    searchQueries: string[];
    searchResults?: SearchResponse 
  }> {
    try {
      console.log('🚀 Starting complete Q&A with search workflow...');
      
      // Step 1: Analyze if search is needed
      const analysis = await this.analyzeQuestion(question, context);
      console.log('📊 Analysis result:', analysis);
      
      let searchResults: SearchResponse | null = null;
      
      // Step 2: Perform search if needed
      if (analysis.needsSearch && analysis.queries.length > 0) {
        try {
          searchResults = await this.performSearch(analysis.queries);
        } catch (searchError) {
          // If web search fails due to deployment issues, continue without search
          if (searchError.message?.includes('Web search service not available')) {
            console.warn('🚨 Web search not available, continuing with context-only answer');
            searchResults = null;
          } else {
            throw searchError; // Re-throw other errors
          }
        }
      }
      
      // Step 3: Generate comprehensive answer
      const answer = await this.generateAnswerWithSearch(question, context, searchResults || undefined);
      
      return {
        ...answer,
        searchResults: searchResults || undefined
      };
    } catch (error) {
      console.error('💥 Error in complete Q&A workflow:', error);
      throw error;
    }
  }
} 