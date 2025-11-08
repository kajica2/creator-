import axios from 'axios';
import * as cheerio from 'cheerio';

interface ScrapedContent {
  title: string;
  description: string;
  content: string;
  keywords: string[];
  personas: string[];
  error?: string;
}

interface ScrapingResult {
  success: boolean;
  data?: ScrapedContent;
  error?: string;
}

class UrlScraper {
  private async fetchUrlContent(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private extractTextContent(html: string): ScrapedContent {
    const $ = cheerio.load(html);
    
    // Extract title
    const title = $('title').text() || 
                 $('meta[property="og:title"]').attr('content') || 
                 $('h1').first().text() ||
                 'Untitled Page';

    // Extract description
    const description = $('meta[name="description"]').attr('content') ||
                       $('meta[property="og:description"]').attr('content') ||
                       $('p').first().text().substring(0, 200) + '...' ||
                       'No description available';

    // Extract main content (prioritize article, main, and content areas)
    let content = '';
    const contentSelectors = [
      'article',
      'main',
      '.content',
      '.post-content',
      '.article-content',
      '.entry-content',
      '[role="main"]',
      'body'
    ];

    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text();
        if (content.length > 500) break; // Found substantial content
      }
    }

    // If no substantial content found, use body
    if (content.length < 500) {
      content = $('body').text();
    }

    // Clean up content
    content = content
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, ' ')
      .trim()
      .substring(0, 5000); // Limit content length

    // Extract keywords from meta tags and content
    const metaKeywords = $('meta[name="keywords"]').attr('content') || '';
    const keywords = this.extractKeywords(content, metaKeywords);

    // Analyze content to identify potential personas
    const personas = this.identifyPersonas(content, title, keywords);

    return {
      title,
      description,
      content,
      keywords,
      personas
    };
  }

  private extractKeywords(content: string, metaKeywords: string): string[] {
    const keywords = new Set<string>();
    
    // Add meta keywords
    if (metaKeywords) {
      metaKeywords.split(',').forEach(keyword => {
        const trimmed = keyword.trim().toLowerCase();
        if (trimmed && trimmed.length > 2) {
          keywords.add(trimmed);
        }
      });
    }

    // Extract common words from content (simple approach)
    const words = content.toLowerCase().split(/\s+/);
    const wordFrequency: { [key: string]: number } = {};
    
    words.forEach(word => {
      if (word.length > 4 && word.length < 20) {
        wordFrequency[word] = (wordFrequency[word] || 0) + 1;
      }
    });

    // Get top 10 most frequent words
    const topWords = Object.entries(wordFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);

    topWords.forEach(word => keywords.add(word));

    return Array.from(keywords).slice(0, 15);
  }

  private identifyPersonas(content: string, title: string, keywords: string[]): string[] {
    const text = (content + ' ' + title).toLowerCase();
    const personas = new Set<string>();

    // Persona patterns based on content analysis
    const personaPatterns = {
      'Content Creator': ['blog', 'content', 'write', 'article', 'post', 'publish'],
      'Digital Marketer': ['marketing', 'seo', 'social media', 'brand', 'campaign', 'audience'],
      'Graphic Designer': ['design', 'creative', 'visual', 'art', 'illustration', 'layout'],
      'Web Developer': ['code', 'develop', 'website', 'app', 'programming', 'software'],
      'Photographer': ['photo', 'camera', 'shoot', 'image', 'lens', 'photography'],
      'Video Creator': ['video', 'youtube', 'film', 'edit', 'production', 'camera'],
      'Social Media Influencer': ['instagram', 'tiktok', 'influencer', 'followers', 'engagement'],
      'Business Owner': ['business', 'entrepreneur', 'startup', 'company', 'enterprise'],
      'Educator': ['teach', 'education', 'learn', 'course', 'tutorial', 'instruction'],
      'Consultant': ['consult', 'advice', 'expert', 'strategy', 'guidance', 'professional']
    };

    // Check for persona matches
    Object.entries(personaPatterns).forEach(([persona, patterns]) => {
      const matchCount = patterns.filter(pattern => 
        text.includes(pattern) || keywords.some(keyword => keyword.includes(pattern))
      ).length;
      
      if (matchCount >= 2) {
        personas.add(persona);
      }
    });

    // If no personas detected, use generic ones based on domain patterns
    if (personas.size === 0) {
      personas.add('Content Creator');
      personas.add('Digital Professional');
    }

    return Array.from(personas).slice(0, 3);
  }

  public async scrapeUrl(url: string): Promise<ScrapingResult> {
    try {
      // Validate URL
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return {
          success: false,
          error: 'Invalid URL format. Must start with http:// or https://'
        };
      }

      // Fetch and parse content
      const html = await this.fetchUrlContent(url);
      const scrapedData = this.extractTextContent(html);

      return {
        success: true,
        data: scrapedData
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown scraping error occurred'
      };
    }
  }
}

export const urlScraper = new UrlScraper();
export type { ScrapedContent, ScrapingResult };