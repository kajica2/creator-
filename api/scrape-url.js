import axios from 'axios';
import * as cheerio from 'cheerio';
import { verifySupabaseRequest } from './_supabaseAuth.js';

class UrlScraper {
  async fetchUrlContent(url) {
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
      console.error('Fetch error:', error.message);
      throw new Error(`Failed to fetch URL: ${error.message}`);
    }
  }

  extractTextContent(html) {
    try {
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

      // Extract main content
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
          if (content.length > 500) break;
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
        .substring(0, 5000);

      // Extract keywords
      const metaKeywords = $('meta[name="keywords"]').attr('content') || '';
      const keywords = this.extractKeywords(content, metaKeywords);

      // Identify personas
      const personas = this.identifyPersonas(content, title, keywords);

      return {
        title,
        description,
        content,
        keywords,
        personas
      };
    } catch (error) {
      console.error('Content extraction error:', error);
      throw new Error('Failed to extract content from page');
    }
  }

  extractKeywords(content, metaKeywords) {
    const keywords = new Set();
    
    // Add meta keywords
    if (metaKeywords) {
      metaKeywords.split(',').forEach(keyword => {
        const trimmed = keyword.trim().toLowerCase();
        if (trimmed && trimmed.length > 2) {
          keywords.add(trimmed);
        }
      });
    }

    // Extract common words from content
    const words = content.toLowerCase().split(/\s+/);
    const wordFrequency = {};
    
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

  identifyPersonas(content, title, keywords) {
    const text = (content + ' ' + title).toLowerCase();
    const personas = new Set();

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

    // If no personas detected, use generic ones
    if (personas.size === 0) {
      personas.add('Content Creator');
      personas.add('Digital Professional');
    }

    return Array.from(personas).slice(0, 3);
  }

  async scrapeUrl(url) {
    try {
      // Validate URL
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return {
          success: false,
          error: 'Invalid URL format. Must start with http:// or https://'
        };
      }

      // Fetch and parse content
      console.log('Fetching URL:', url);
      const html = await this.fetchUrlContent(url);
      console.log('Successfully fetched content, length:', html.length);
      
      const scrapedData = this.extractTextContent(html);
      console.log('Successfully extracted content, personas:', scrapedData.personas);

      return {
        success: true,
        data: scrapedData
      };
    } catch (error) {
      console.error('Scraping error:', error);
      return {
        success: false,
        error: error.message || 'Unknown scraping error occurred'
      };
    }
  }
}

const urlScraper = new UrlScraper();

export default async function handler(request, response) {
  // Set CORS headers
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
  );

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authResult = await verifySupabaseRequest(request);

    if (authResult.error) {
      return response.status(401).json({
        success: false,
        error: authResult.error,
      });
    }

    const { url } = request.body;

    if (!url) {
      return response.status(400).json({
        success: false,
        error: 'URL is required',
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return response.status(400).json({
        success: false,
        error: 'Invalid URL format',
      });
    }

    console.log('Processing URL:', url);
    const scrapingResult = await urlScraper.scrapeUrl(url);
    
    if (!scrapingResult.success) {
      console.error('Scraping failed:', scrapingResult.error);
      return response.status(400).json({
        success: false,
        error: scrapingResult.error || 'Failed to scrape URL',
      });
    }

    console.log('Scraping successful, returning data');
    return response.status(200).json({
      success: true,
      data: scrapingResult.data
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return response.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
}