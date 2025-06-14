// Edge function for newsletter sending with Supabase
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Language-specific default values
const getLanguageDefaults = (language = 'de') => {
  const isGerman = language === 'de';
  
  return {
    defaultSubject: isGerman 
      ? `KI-Newsletter vom ${new Date().toLocaleDateString('de-DE')}` 
      : `AI Newsletter from ${new Date().toLocaleDateString('en-US')}`,
    defaultSenderName: isGerman ? "KI-Newsletter" : "AI Newsletter",
    welcomeMessage: isGerman 
      ? "Willkommen zu unserem wöchentlichen KI-Newsletter." 
      : "Welcome to our weekly AI newsletter.",
    newsIntro: isGerman 
      ? "Hier sind die wichtigsten Neuigkeiten aus der Welt der Künstlichen Intelligenz:" 
      : "Here are the most important news from the world of Artificial Intelligence:",
    unsubscribeText: isGerman 
      ? "Sie erhalten diesen Newsletter, weil Sie sich dafür angemeldet haben." 
      : "You are receiving this newsletter because you subscribed to it.",
    unsubscribeLink: isGerman ? "Hier abmelden" : "Unsubscribe here",
    mockNews: isGerman ? [
      "GPT-5 soll in den nächsten Monaten erscheinen",
      "Google stellt neue KI-Funktionen für Workspace vor", 
      "EU einigt sich auf KI-Regulierung"
    ] : [
      "GPT-5 expected to be released in the coming months",
      "Google introduces new AI features for Workspace",
      "EU agrees on AI regulation"
    ]
  };
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    let newsletterConfig = {};
    try {
      newsletterConfig = await req.json();
    } catch (e) {
      // Default empty object if no body
    }

    const {
      subject,
      customContent = null,
      senderName,
      senderEmail = "froehlich.nico@outlook.de",
      language = 'de'
    } = newsletterConfig;

    const langDefaults = getLanguageDefaults(language);
    const finalSubject = subject || langDefaults.defaultSubject;
    const finalSenderName = senderName || langDefaults.defaultSenderName;

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://aggkhetcdjmggqjzelgd.supabase.co";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseServiceKey) {
      const errorMsg = language === 'de' ? "Server Konfigurationsfehler" : "Server configuration error";
      return new Response(
        JSON.stringify({ error: errorMsg }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get confirmed subscribers
    const { data: subscribers, error: subscribersError } = await supabase
      .from("newsletter_subscribers")
      .select("email")
      .eq("confirmed", true);

    if (subscribersError) {
      console.error("Error fetching subscribers:", subscribersError);
      const errorMsg = language === 'de' ? "Fehler beim Laden der Abonnenten" : "Failed to fetch subscribers";
      return new Response(
        JSON.stringify({ error: errorMsg }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!subscribers || subscribers.length === 0) {
      const message = language === 'de' ? "Keine bestätigten Abonnenten gefunden" : "No confirmed subscribers found";
      return new Response(
        JSON.stringify({ message }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Default HTML content for the newsletter
    let htmlContent = customContent;
    
    // If no custom content is provided, use language-specific default template
    if (!htmlContent) {
      const mockNewsList = langDefaults.mockNews.map(item => `<li>${item}</li>`).join('\n            ');
      
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">${finalSenderName}</h1>
          <p>${langDefaults.welcomeMessage}</p>
          <p>${langDefaults.newsIntro}</p>
          <ul>
            ${mockNewsList}
          </ul>
          <p style="margin-top: 30px; font-size: 14px; color: #777;">
            ${langDefaults.unsubscribeText}
            <a href="{{{unsubscribe}}}" style="color: #777;">${langDefaults.unsubscribeLink}</a>
          </p>
        </div>
      `;
    }

    // Store email sending attempts for tracking and debugging
    const successfulSends = [];
    const failedSends = [];
    
    // Send emails to all subscribers
    for (const subscriber of subscribers) {
      try {
        const unsubscribeUrl = `${supabaseUrl}/functions/v1/newsletter-unsubscribe?email=${encodeURIComponent(subscriber.email)}`;
        
        // Replace {{{unsubscribe}}} placeholder with actual unsubscribe URL
        const personalizedContent = htmlContent.replace("{{{unsubscribe}}}", unsubscribeUrl);
        
        // Log the email sending attempt for debugging
        console.log(`Sending newsletter to: ${subscriber.email}`);
        console.log(`Subject: ${finalSubject}`);
        console.log(`From: ${finalSenderName} <${senderEmail}>`);
        
        // Call the newsletter-send-email function to send email
        const emailResponse = await supabase.functions.invoke('newsletter-send-email', {
          body: {
            to: subscriber.email,
            subject: finalSubject,
            html: personalizedContent,
            senderName: finalSenderName,
            senderEmail: senderEmail,
            language: language
          }
        });
        
        if (emailResponse.error) {
          throw new Error(emailResponse.error);
        }
        
        const emailData = emailResponse.data;
        
        if (emailData.success) {
          successfulSends.push(subscriber.email);
          console.log(`Email sent successfully to ${subscriber.email}`);
        } else {
          throw new Error(emailData.message || "Unknown error");
        }
      } catch (error) {
        console.error(`Error sending to ${subscriber.email}:`, error);
        failedSends.push({ email: subscriber.email, error: error.message });
      }
    }
    
    // Store the newsletter in the database
    try {
      const { error: insertError } = await supabase
        .from('newsletters')
        .insert({
          subject: finalSubject,
          content: htmlContent,
          sender_name: finalSenderName,
          sender_email: senderEmail,
          sent_at: new Date().toISOString(),
          recipients_count: subscribers.length,
          language: language
        });
        
      if (insertError) {
        console.error("Error storing newsletter:", insertError);
      }
    } catch (error) {
      console.error("Error storing newsletter:", error);
    }

    const responseMessage = language === 'de' 
      ? `Newsletter an ${successfulSends.length} Abonnenten gesendet`
      : `Newsletter sent to ${successfulSends.length} subscribers`;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: responseMessage,
        emailsSent: successfulSends.length,
        totalSubscribers: subscribers.length,
        successfulSends,
        failedSends,
        language
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Server error:", error);
    const errorMsg = language === 'de' ? "Interner Serverfehler" : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMsg, details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
