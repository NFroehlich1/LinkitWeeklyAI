/// <reference path="../deno.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchResult {
  title: string;
  description: string;
  url: string;
}

interface BraveSearchResponse {
  web?: {
    results: SearchResult[];
  };
}

interface SearchRequest {
  queries: string[];
  maxResults?: number;
}

interface SearchResponse {
  success: boolean;
  results: {
    query: string;
    results: SearchResult[];
    error?: string;
  }[];
  totalResults: number;
  linkedAccountOwnerId: string;
  timestamp: string;
}

serve(async (req: Request) => {
  console.log('🔍 ACI Brave Search function called');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight request handled');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check for required environment variables
    const aciApiKey = Deno.env.get('ACI_API_KEY');
    const aciLinkedAccountOwnerId = Deno.env.get('ACI_LINKED_ACCOUNT_OWNER_ID');
    
    if (!aciApiKey) {
      console.error('❌ ACI_API_KEY not found in environment');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'ACI API Key nicht konfiguriert', 
          details: 'Die ACI_API_KEY Umgebungsvariable ist nicht gesetzt',
          setup_url: 'https://platform.aci.dev/'
        }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!aciLinkedAccountOwnerId) {
      console.error('❌ ACI_LINKED_ACCOUNT_OWNER_ID not found in environment');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'ACI Linked Account Owner ID nicht konfiguriert', 
          details: 'Die ACI_LINKED_ACCOUNT_OWNER_ID Umgebungsvariable ist nicht gesetzt',
          setup_url: 'https://platform.aci.dev/appconfigs/BRAVE_SEARCH',
          help: 'Verknüpfen Sie Ihr Brave Search Konto und kopieren Sie die linked_account_owner_id'
        }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    console.log('✅ ACI credentials found');
    console.log('🔑 ACI API Key length:', aciApiKey.length);
    console.log('🔗 Linked Account Owner ID:', aciLinkedAccountOwnerId);

    const requestBody = await req.json();
    const { action, data } = requestBody;
    
    console.log(`🎯 Action requested: ${action}`);

    switch (action) {
      case 'verify-setup':
        console.log('🔍 Verifying ACI.dev setup...');
        return await verifyACISetup(aciApiKey, aciLinkedAccountOwnerId);
      
      case 'search':
        console.log('🌐 Performing web search...');
        return await performWebSearch(aciApiKey, aciLinkedAccountOwnerId, data);
      
      default:
        console.error('❌ Unknown action:', action);
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Unbekannte Aktion', 
            receivedAction: action,
            availableActions: ['verify-setup', 'search']
          }), 
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }
  } catch (error) {
    console.error('💥 Error in aci-brave-search function:', error);
    console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage,
        type: error instanceof Error ? error.constructor.name : typeof error,
        timestamp: new Date().toISOString()
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function verifyACISetup(apiKey: string, linkedAccountOwnerId: string) {
  try {
    console.log('🔍 Testing ACI.dev connection...');
    
    // Test with a simple search query
    const testQuery = 'test';
    const searchResponse = await fetch('https://api.aci.dev/functions/execute', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        function_name: 'BRAVE_SEARCH__WEB_SEARCH',
        function_arguments: {
          query: { q: testQuery }
        },
        linked_account_owner_id: linkedAccountOwnerId
      }),
    });

    const responseText = await searchResponse.text();
    console.log('📡 ACI API response status:', searchResponse.status);
    console.log('📡 ACI API response:', responseText.substring(0, 200) + '...');

    if (searchResponse.ok) {
      try {
        const searchData = JSON.parse(responseText);
        console.log('✅ ACI.dev setup verification successful');
        
        return new Response(
          JSON.stringify({ 
            success: true,
            message: "ACI.dev Brave Search ist korrekt konfiguriert",
            linkedAccountOwnerId: linkedAccountOwnerId,
            testQuery: testQuery,
            resultsFound: searchData.web?.results?.length || 0
          }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (parseError) {
        console.error('❌ Failed to parse success response:', parseError);
        return new Response(
          JSON.stringify({ 
            success: false,
            message: "ACI.dev Antwort konnte nicht geparst werden",
            rawResponse: responseText.substring(0, 500)
          }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { message: responseText };
      }
      
      console.error('❌ ACI API error:', errorData);
      
      // Provide specific error messages for common issues
      let helpfulMessage = `Setup-Fehler: ${errorData.message || responseText}`;
      if (responseText.includes('Linked account not found') || searchResponse.status === 404) {
        helpfulMessage = `Brave Search Konto nicht verknüpft. Bitte gehen Sie zu https://platform.aci.dev/appconfigs/BRAVE_SEARCH und verknüpfen Sie Ihr Konto. Aktuelle linked_account_owner_id: ${linkedAccountOwnerId}`;
      } else if (searchResponse.status === 401) {
        helpfulMessage = 'Ungültiger ACI API Key. Überprüfen Sie Ihren API-Schlüssel.';
      }
      
      return new Response(
        JSON.stringify({ 
          success: false,
          message: helpfulMessage,
          status: searchResponse.status,
          linkedAccountOwnerId: linkedAccountOwnerId,
          setupUrl: 'https://platform.aci.dev/appconfigs/BRAVE_SEARCH',
          details: errorData
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('💥 ACI setup verification error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ 
        success: false,
        message: `Verbindungsfehler: ${errorMessage}`,
        errorType: error instanceof Error ? error.constructor.name : typeof error
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function performWebSearch(apiKey: string, linkedAccountOwnerId: string, data: SearchRequest): Promise<Response> {
  const { queries, maxResults = 5 } = data;

  if (!queries || !Array.isArray(queries) || queries.length === 0) {
    return new Response(
      JSON.stringify({ 
        success: false,
        error: "queries array ist erforderlich und darf nicht leer sein",
        example: { queries: ["search term 1", "search term 2"] }
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    console.log('🔍 Performing web searches for queries:', queries);
    console.log('📊 Max results per query:', maxResults);
    
    // Perform searches in parallel
    const searchPromises = queries.map(async (query: string) => {
      try {
        console.log(`🔍 Searching for: "${query}"`);
        
        const searchResponse = await fetch('https://api.aci.dev/functions/execute', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            function_name: 'BRAVE_SEARCH__WEB_SEARCH',
            function_arguments: {
              query: { q: query }
            },
            linked_account_owner_id: linkedAccountOwnerId
          }),
        });

        if (!searchResponse.ok) {
          const errorText = await searchResponse.text();
          console.error(`❌ Search API error for "${query}":`, errorText);
          
          if (errorText.includes('Linked account not found')) {
            throw new Error(`Linked account not found. Please go to https://platform.aci.dev/appconfigs/BRAVE_SEARCH and link your Brave Search account. Current linked_account_owner_id: ${linkedAccountOwnerId}`);
          }
          
          throw new Error(`Search failed: HTTP ${searchResponse.status} - ${errorText}`);
        }

        const searchData: BraveSearchResponse = await searchResponse.json();
        console.log(`✅ Search completed for "${query}"`);

        // Extract and limit results
        if (searchData.web && searchData.web.results) {
          const results = searchData.web.results.slice(0, maxResults).map(result => ({
            title: result.title || 'Kein Titel',
            description: result.description || 'Keine Beschreibung',
            url: result.url || ''
          }));
          
          return {
            query,
            results,
            count: results.length
          };
        }
        
        return { 
          query, 
          results: [], 
          count: 0 
        };
      } catch (error) {
        console.error(`❌ Error searching for "${query}":`, error);
        return { 
          query, 
          results: [], 
          count: 0,
          error: error instanceof Error ? error.message : String(error) 
        };
      }
    });

    const searchResults = await Promise.all(searchPromises);
    
    // Calculate total results
    const totalResults = searchResults.reduce((sum, result) => sum + result.count, 0);
    const successfulSearches = searchResults.filter(result => !result.error).length;
    const failedSearches = searchResults.filter(result => result.error).length;
    
    console.log(`📊 Search summary: ${successfulSearches} successful, ${failedSearches} failed, ${totalResults} total results`);

    const response: SearchResponse = {
      success: true,
      results: searchResults,
      totalResults: totalResults,
      linkedAccountOwnerId: linkedAccountOwnerId,
      timestamp: new Date().toISOString()
    };

    return new Response(
      JSON.stringify(response), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("💥 Error in web search:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: `Web-Suche Fehler: ${errorMessage}`,
        originalError: errorMessage,
        linkedAccountOwnerId: linkedAccountOwnerId,
        timestamp: new Date().toISOString()
      }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
} 