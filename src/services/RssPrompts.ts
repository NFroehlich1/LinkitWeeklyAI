import { RssItem } from "@/types/newsTypes";

/**
 * RSS Processing Prompts Service
 * 
 * Contains prompts and logic for RSS content processing.
 * This was previously in the fetch-rss edge function.
 */
export class RssPrompts {

  /**
   * Clean RSS Content
   * Remove HTML tags and unwanted characters from RSS text
   */
  static cleanRssText(text: string): string {
    if (!text) return '';
    
    return text
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove common HTML entities
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      // Remove multiple whitespaces
      .replace(/\s+/g, ' ')
      // Remove newlines and tabs
      .replace(/[\n\r\t]/g, ' ')
      .trim();
  }

  /**
   * Extract Date from RSS Item
   */
  static extractDate(dateString: string): string {
    if (!dateString) return new Date().toISOString();
    
    try {
      const date = new Date(dateString);
      return date.toISOString();
    } catch (error) {
      console.warn('Could not parse date:', dateString);
      return new Date().toISOString();
    }
  }

  /**
   * Process Raw RSS Item
   * Clean and normalize RSS item data
   */
  static processRssItem(rawItem: any, sourceName: string): RssItem | null {
    try {
      if (!rawItem.title && !rawItem.description) {
        return null; // Skip items without meaningful content
      }

      const processedItem: RssItem = {
        title: this.cleanRssText(rawItem.title || 'Untitled'),
        description: this.cleanRssText(rawItem.description || rawItem.content || ''),
        link: rawItem.link || rawItem.url || '',
        pubDate: this.extractDate(rawItem.pubDate || rawItem.isoDate || rawItem.date),
        creator: this.cleanRssText(rawItem.creator || rawItem.author || ''),
        sourceName: sourceName,
        content: rawItem.content ? this.cleanRssText(rawItem.content) : undefined,
        categories: rawItem.categories || [],
        guid: rawItem.guid || rawItem.id || rawItem.link || ''
      };

      // Validate required fields
      if (!processedItem.title || !processedItem.link) {
        console.warn('Skipping item with missing title or link:', rawItem);
        return null;
      }

      return processedItem;
    } catch (error) {
      console.error('Error processing RSS item:', error, rawItem);
      return null;
    }
  }

  /**
   * Sort Articles by Date
   */
  static sortArticlesByDate(articles: RssItem[]): RssItem[] {
    return articles.sort((a, b) => {
      const dateA = new Date(a.pubDate);
      const dateB = new Date(b.pubDate);
      return dateB.getTime() - dateA.getTime(); // Newest first
    });
  }

  /**
   * Filter Duplicate Articles
   * Remove duplicates based on title similarity and URL
   */
  static filterDuplicates(articles: RssItem[]): RssItem[] {
    const seen = new Set<string>();
    const filtered: RssItem[] = [];

    for (const article of articles) {
      // Create a unique key based on normalized title and link
      const normalizedTitle = article.title.toLowerCase().replace(/\s+/g, ' ').trim();
      const key = `${normalizedTitle}|${article.link}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        filtered.push(article);
      }
    }

    return filtered;
  }

  /**
   * Filter Recent Articles
   * Keep only articles from the last N days
   */
  static filterRecentArticles(articles: RssItem[], maxDaysOld: number = 7): RssItem[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxDaysOld);
    
    return articles.filter(article => {
      const articleDate = new Date(article.pubDate);
      return articleDate >= cutoffDate;
    });
  }

  /**
   * Generate RSS Validation Result
   */
  static generateValidationResult(
    articles: RssItem[], 
    sourceName: string, 
    error?: string
  ): { isValid: boolean; message: string; articles?: RssItem[] } {
    if (error) {
      return {
        isValid: false,
        message: `RSS feed validation failed: ${error}`
      };
    }

    if (articles.length === 0) {
      return {
        isValid: false,
        message: `No valid articles found in RSS feed for ${sourceName}`
      };
    }

    return {
      isValid: true,
      message: `RSS feed for ${sourceName} is valid - ${articles.length} articles found`,
      articles
    };
  }
}

export default RssPrompts; 