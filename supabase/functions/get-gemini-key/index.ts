import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log("🔑 Get Gemini Key function called")

    // Get the Gemini API key from Supabase secrets
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

    if (!GEMINI_API_KEY) {
      console.error("❌ GEMINI_API_KEY not found in environment variables")
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Gemini API Key not configured in Supabase secrets',
          hasKey: false
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Verify the key is valid by making a test call
    console.log("🔍 Verifying API key...")
    
    const testResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: "Test" }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 10
          }
        }),
      }
    )

    if (!testResponse.ok) {
      console.error("❌ API key validation failed:", testResponse.status)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid Gemini API Key',
          hasKey: true,
          isValid: false
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    console.log("✅ API key is valid, returning securely")

    return new Response(
      JSON.stringify({ 
        success: true,
        apiKey: GEMINI_API_KEY,
        hasKey: true,
        isValid: true,
        message: "API key retrieved and validated successfully"
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error("❌ Error in get-gemini-key function:", error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error',
        hasKey: false
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
}) 