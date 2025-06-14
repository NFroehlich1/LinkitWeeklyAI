# 🌐 ACI.dev Brave Search Integration Setup Guide

## Overview

This guide helps you integrate **ACI.dev's Brave Search tool** with **any AI model** (Mistral, Gemini, etc.) to enable web search capabilities in your newsletter Q&A system.

## 🏗️ **New Architecture**

This integration uses a **separate, reusable edge function** approach:

- **`aci-brave-search`** - Standalone edge function for web search
- **`WebSearchService`** - Frontend service that works with any AI model
- **Model-agnostic** - Works with Mistral, Gemini, or future AI providers
- **Reusable** - Can be integrated in external Supabase projects

## 🔧 Prerequisites

1. **ACI.dev Account** - Sign up at [https://platform.aci.dev/](https://platform.aci.dev/)
2. **Brave Search Account** - Required for web search functionality
3. **AI Model** - Mistral or Gemini (or any future model you add)

## 📋 Step-by-Step Setup

### Step 1: Get Your ACI.dev API Key

1. Go to [https://platform.aci.dev/](https://platform.aci.dev/)
2. Sign up or log in
3. Navigate to **API Keys**
4. Create a new API key
5. Copy and save it securely

### Step 2: Link Your Brave Search Account ⚠️ **CRITICAL**

This is the most important step - **the integration will not work without this**:

1. Go to [https://platform.aci.dev/appconfigs/BRAVE_SEARCH](https://platform.aci.dev/appconfigs/BRAVE_SEARCH)
2. Click **"Link Account"**
3. Follow the OAuth flow to connect your Brave Search account
4. **Copy the `linked_account_owner_id`** that's created (looks like: `user_abc123xyz`)
5. **Save this ID** - you'll need it for the environment variables

### Step 3: Deploy the ACI Brave Search Edge Function

#### Option A: Supabase Dashboard (Recommended)
1. Go to **Edge Functions** in your Supabase dashboard
2. Click **"Create a new function"**
3. Function name: `aci-brave-search`
4. Copy and paste the code from `supabase/functions/aci-brave-search/index.ts`
5. Click **Deploy**

#### Option B: CLI
```bash
supabase functions deploy aci-brave-search
```

### Step 4: Configure Environment Variables

In your **Supabase Dashboard**:

1. Go to **Settings** → **Environment Variables**
2. Add these two variables:

```bash
# Your ACI.dev API key  
ACI_API_KEY=your_aci_api_key_here

# Your linked account owner ID from Step 2
ACI_LINKED_ACCOUNT_OWNER_ID=user_abc123xyz
```

⚠️ **Important Notes:**
- The `ACI_LINKED_ACCOUNT_OWNER_ID` must be the exact ID from your Brave Search account link
- Set both environment variables scope to **"Edge Functions"**
- **No Mistral API key needed** - the search function is model-agnostic

### Step 5: Test the Integration

1. **Open your app**
2. **Navigate to the Questions section**
3. **Select any AI model** (Mistral or Gemini)
4. **Click the "Web-Suche verfügbar" badge** to enable web search
5. **Ask a question that requires current information**, like:
   - "Was sind die neuesten KI-Entwicklungen heute?"
   - "Welche aktuellen Tech-News sollte ich kennen?"

## 🔍 How It Works

### 🧠 **Smart Decision Making**
1. **Question Analysis**: Any AI model analyzes if web search would be helpful
2. **Query Extraction**: Generates 1-3 optimized search queries
3. **Web Search**: Separate edge function executes searches via ACI.dev
4. **Content Integration**: Combines search results with existing content
5. **Response Generation**: AI creates comprehensive answer with sources

### 🔄 **Model-Agnostic Workflow**
```
User Question → AI Analysis → ACI Search → AI Response
     ↑              ↑           ↑            ↑
  Any Model    Any Model   Standalone   Any Model
```

## 🚨 Troubleshooting

### "Linked account not found" Error
**This is the most common issue.**

**Solution:**
1. Go to [https://platform.aci.dev/appconfigs/BRAVE_SEARCH](https://platform.aci.dev/appconfigs/BRAVE_SEARCH)
2. Verify your Brave Search account is linked
3. Copy the correct `linked_account_owner_id`
4. Update the `ACI_LINKED_ACCOUNT_OWNER_ID` environment variable
5. Redeploy the `aci-brave-search` function

### "ACI.dev API credentials not configured"
**Missing environment variables.**

**Solution:**
1. Verify both environment variables are set
2. Check spelling and values
3. Ensure scope is set to "Edge Functions"
4. Redeploy the function

### Web Search Toggle Not Visible
**Check model selection.**

**Solution:**
1. Web search is available for any AI model
2. The toggle should appear regardless of model selection
3. If not visible, check console for errors

### Edge Function Not Found
**The aci-brave-search function wasn't deployed.**

**Solution:**
1. Deploy the function via dashboard or CLI
2. Verify it appears in your edge functions list
3. Check deployment logs for errors

## 🎯 Usage Tips

### Best Questions for Web Search
- "What are the latest developments in [topic]?"
- "What's happening today in AI?"
- "Current news about [company/technology]"
- "Recent breakthroughs in [field]"

### Questions That Don't Need Web Search
- "What does this newsletter say about [topic]?"
- "Summarize the articles"
- "Explain [concept from articles]"

## 🔧 **API Reference**

### ACI Brave Search Edge Function

#### Verify Setup
```javascript
const { data, error } = await supabase.functions.invoke('aci-brave-search', {
  body: { action: 'verify-setup' }
});
```

#### Perform Search
```javascript
const { data, error } = await supabase.functions.invoke('aci-brave-search', {
  body: {
    action: 'search',
    data: {
      queries: ['search query 1', 'search query 2'],
      maxResults: 5
    }
  }
});
```

### WebSearchService

```typescript
import { WebSearchService } from '@/services/WebSearchService';

const searchService = new WebSearchService('mistral'); // or 'gemini'

// Complete workflow
const result = await searchService.askWithSearch(question, context);

// Individual steps
const analysis = await searchService.analyzeQuestion(question, context);
const searchResults = await searchService.performSearch(queries);
const answer = await searchService.generateAnswerWithSearch(question, context, searchResults);
```

## 🔒 Security Notes

1. **Never hardcode API keys** in your code
2. **Use environment variables** for all credentials
3. **Regularly rotate API keys**
4. **Monitor API usage** to prevent unexpected charges

## 💰 Cost Considerations

- **ACI.dev**: Charges per function execution
- **Brave Search**: Free tier available, paid plans for higher usage
- **AI Models**: Standard usage rates apply (Mistral, Gemini, etc.)

Monitor your usage in both platforms' dashboards.

## 🆘 Support

If you encounter issues:

1. **Check the browser console** for error messages
2. **Review Supabase Edge Function logs** for both functions
3. **Verify all environment variables** are correctly set
4. **Test the search function independently** using the verify-setup action

## ✅ Success Checklist

- [ ] ACI.dev API key obtained and configured
- [ ] Brave Search account linked at ACI.dev
- [ ] `linked_account_owner_id` copied correctly
- [ ] `aci-brave-search` edge function deployed
- [ ] Environment variables set in Supabase
- [ ] Web search toggle appears in Q&A section
- [ ] Questions with web search work and show search queries used
- [ ] Works with both Mistral and Gemini models

## 🚀 **Advantages of New Architecture**

✅ **Model-Agnostic** - Works with any AI provider
✅ **Reusable** - Can be used in multiple projects
✅ **Maintainable** - Separate concerns, easier to debug
✅ **Scalable** - Independent scaling of search vs. AI functionality
✅ **Testable** - Each component can be tested independently

Once all items are checked, your ACI.dev Brave Search integration is ready for any AI model! 🎉

## 📦 **For External Integration**

To use this in external Supabase projects:

1. **Copy the edge function**: `supabase/functions/aci-brave-search/index.ts`
2. **Copy the service**: `src/services/WebSearchService.ts`
3. **Set environment variables**: `ACI_API_KEY`, `ACI_LINKED_ACCOUNT_OWNER_ID`
4. **Deploy and use** with any AI model you have

## 🚨 **IMPORTANT: External Supabase Deployment Required**

If you're seeing CORS errors or "Web search service not available" messages, it means the `aci-brave-search` edge function needs to be deployed to your external Supabase project.

## 📋 **Quick Fix for Current Errors**

The errors you're seeing indicate:
1. **CORS Error**: `aci-brave-search` function not deployed to your Supabase project
2. **Graceful Fallback**: The system will automatically fall back to newsletter-only answers

## 🚀 **Deployment Steps for External Supabase**

### 1. **Copy Edge Function to Your Supabase Project**

Copy these files to your external Supabase project:

```bash
# Copy the edge function
cp -r supabase/functions/aci-brave-search /path/to/your/supabase/project/supabase/functions/

# Copy the config update
# Add this to your supabase/config.toml:
```

```toml
[functions.aci-brave-search]
verify_jwt = false
```

### 2. **Deploy the Function**

In your external Supabase project directory:

```bash
# Deploy the function
supabase functions deploy aci-brave-search

# Verify deployment
supabase functions list
```

### 3. **Set Environment Variables**

In your Supabase Dashboard → Project Settings → Edge Functions:

```bash
ACI_API_KEY=your_aci_api_key_here
ACI_LINKED_ACCOUNT_OWNER_ID=your_linked_account_owner_id_here
```

### 4. **Test the Deployment**

```bash
# Test the function
curl -X POST 'https://your-project.supabase.co/functions/v1/aci-brave-search' \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "verify-setup"
  }'
```

## 🔧 **Current Behavior (Before Deployment)**

✅ **What Works Now:**
- Web search mode toggle (3 states)
- Visual indicators for search status
- Automatic fallback to newsletter-only answers
- Error handling with user-friendly messages

⚠️ **What Needs Deployment:**
- Actual web search functionality
- ACI.dev Brave Search integration

## 🎯 **User Experience**

### **Force ON Mode**
- Attempts web search
- Shows error: "Web-Suche nicht verfügbar: ACI Brave Search Funktion muss in Supabase deployed werden"
- Falls back to newsletter-only answer
- Shows "Antwort ohne Web-Suche generiert"

### **AUTO Mode**
- AI analyzes question
- If web search would help: Shows "Web-Suche nicht verfügbar - verwende nur Newsletter-Kontext"
- Falls back to newsletter-only answer
- Shows appropriate indicators

### **Force OFF Mode**
- Works perfectly (no web search attempted)
- Shows "🚫 Web-Suche deaktiviert" indicator

## 📁 **Files to Deploy**

Copy these files to your external Supabase project:

1. **`supabase/functions/aci-brave-search/index.ts`** - Main edge function
2. **Update `supabase/config.toml`** - Add function configuration

## 🔍 **Verification After Deployment**

1. **Check Function List:**
   ```bash
   supabase functions list
   # Should show: aci-brave-search
   ```

2. **Test Setup:**
   - Go to your app
   - Set web search to "Force ON"
   - Ask: "What are the latest AI developments?"
   - Should see: "✅ Web-Suche durchgeführt" with search terms

3. **Check Logs:**
   ```bash
   supabase functions logs aci-brave-search
   ```

## 🛠️ **Troubleshooting**

### **Still Getting CORS Errors?**
- Verify function is deployed: `supabase functions list`
- Check environment variables in Supabase Dashboard
- Ensure ACI.dev account is properly linked

### **"Linked account not found" Error?**
- Go to https://platform.aci.dev/appconfigs/BRAVE_SEARCH
- Copy the exact `linked_account_owner_id`
- Update environment variable in Supabase

### **Function Not Found?**
- Redeploy: `supabase functions deploy aci-brave-search`
- Check config.toml has the function entry
- Verify you're in the correct Supabase project

## 🎉 **After Successful Deployment**

You'll see:
- ✅ **Web-Suche durchgeführt** indicators
- 🧠 **KI-Entscheidung** indicators  
- ⚡ **Web-Suche AN** mode working
- Search terms displayed in green pills
- Combined newsletter + web search answers

## 📞 **Need Help?**

The system is designed to work gracefully even without web search deployed. All core functionality works, and users get clear feedback about what's happening.

---

**Current Status**: ✅ UI Complete, ⚠️ Backend Deployment Needed 