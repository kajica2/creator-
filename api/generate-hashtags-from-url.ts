// Client-side URL hashtag generator utility
// This uses server-side web scraping to extract content and generate relevant hashtags

interface ScrapedContent {
  title: string;
  description: string;
  content: string;
  keywords: string[];
  personas: string[];
}

interface GeneratedSet {
  personaName: string;
  description: string;
  primarySet: string[];
  secondarySet: string[];
  nicheSet: string[];
}

interface UrlHashtagResponse {
  success: boolean;
  sets: GeneratedSet[];
  scrapedData?: ScrapedContent;
  error?: string;
}

export async function generateHashtagsFromUrl(url: string, accessToken?: string): Promise<UrlHashtagResponse> {
  try {
    // Validate URL format
    try {
      new URL(url);
    } catch {
      return {
        success: false,
        error: 'Invalid URL format',
        sets: []
      };
    }

    // Use server-side API for web scraping to avoid CORS issues
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const scrapingResult = await fetch('/api/scrape-url', {
      method: 'POST',
      headers,
      body: JSON.stringify({ url }),
    });

    if (!scrapingResult.ok) {
      const errorData = await scrapingResult.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || 'Failed to scrape URL',
        sets: []
      };
    }

    const { data: scrapedData } = await scrapingResult.json();

    if (!scrapedData) {
      return {
        success: false,
        error: 'No content found on the page',
        sets: []
      };
    }

    // Generate hashtag sets based on actual scraped content
    const generatedSets = await generateHashtagSetsFromContent(scrapedData, url);

    return {
      success: true,
      sets: generatedSets,
      scrapedData
    };

  } catch (error) {
    console.error('Error generating hashtags from URL:', error);
    return {
      success: false,
      error: 'Failed to generate hashtag sets',
      sets: []
    };
  }
}

async function generateHashtagSetsFromContent(scrapedData: ScrapedContent, url: string): Promise<GeneratedSet[]> {
  const { title, description, content, keywords, personas } = scrapedData;
  
  // Generate sets for each identified persona
  const generatedSets: GeneratedSet[] = [];
  
  for (const persona of personas.slice(0, 3)) { // Limit to 3 personas
    const set = generatePersonaHashtagSet(persona, scrapedData);
    if (set) {
      generatedSets.push(set);
    }
  }

  // If no personas were generated, create a generic set
  if (generatedSets.length === 0) {
    generatedSets.push(generateGenericHashtagSet(scrapedData));
  }

  return generatedSets;
}

function generatePersonaHashtagSet(persona: string, data: ScrapedContent): GeneratedSet | null {
  const personaConfigs: Record<string, { description: string; primary: string[]; secondary: string[]; niche: string[] }> = {
    'Content Creator': {
      description: 'Professional creating and sharing digital content',
      primary: ['#contentcreator', '#digitalcontent', '#content', '#creator', '#contentcreation'],
      secondary: ['#contentstrategy', '#contentmarketing', '#digitalcreator', '#contentwriter', '#blogger'],
      niche: ['#contentcreators', '#contentcreatorlife', '#digitalcontent', '#contentcommunity', '#creativelife']
    },
    'Digital Marketer': {
      description: 'Marketing professional focused on digital strategies',
      primary: ['#digitalmarketing', '#marketing', '#socialmedia', '#seo', '#brand'],
      secondary: ['#digitalstrategy', '#marketingtips', '#onlinemarketing', '#marketingagency', '#growth'],
      niche: ['#marketingexpert', '#digitalmarketingagency', '#marketingstrategy', '#socialmediamarketing', '#contentmarketing']
    },
    'Graphic Designer': {
      description: 'Creative professional designing visual content',
      primary: ['#graphicdesign', '#design', '#creative', '#art', '#designer'],
      secondary: ['#graphicdesigner', '#visualdesign', '#creativedesign', '#designinspiration', '#artwork'],
      niche: ['#designcommunity', '#graphicart', '#digitaldesign', '#designstudio', '#creativeprocess']
    },
    'Web Developer': {
      description: 'Programmer building websites and applications',
      primary: ['#webdeveloper', '#webdevelopment', '#coding', '#developer', '#programming'],
      secondary: ['#webdev', '#frontend', '#backend', '#fullstack', '#code'],
      niche: ['#webdeveloperlife', '#webdevelopmenttips', '#codinglife', '#devcommunity', '#programminglife']
    },
    'Photographer': {
      description: 'Professional capturing and editing photographs',
      primary: ['#photographer', '#photography', '#photo', '#camera', '#photos'],
      secondary: ['#photoshoot', '#photographytips', '#photographylove', '#cameragear', '#photographyworkshop'],
      niche: ['#photographerlife', '#photographycommunity', '#photographylovers', '#photographyskills', '#photographyart']
    },
    'Video Creator': {
      description: 'Content creator producing video content',
      primary: ['#videocreator', '#video', '#contentcreator', '#youtube', '#filmmaker'],
      secondary: ['#videoproduction', '#videography', '#videoediting', '#contentcreation', '#youtuber'],
      niche: ['#videomaker', '#videocontent', '#creativevideo', '#videographer', '#youtubecreator']
    },
    'Social Media Influencer': {
      description: 'Content creator building personal brand on social platforms',
      primary: ['#influencer', '#socialmedia', '#contentcreator', '#instagram', '#tiktok'],
      secondary: ['#influencermarketing', '#socialmediainfluencer', '#contentcreation', '#creator', '#socialmedia'],
      niche: ['#influencerlife', '#socialmediatips', '#contentcreatorlife', '#instagrammer', '#tiktokcreator']
    },
    'Business Owner': {
      description: 'Entrepreneur running a business or startup',
      primary: ['#entrepreneur', '#business', '#startup', '#businessowner', '#entrepreneurship'],
      secondary: ['#smallbusiness', '#businessgrowth', '#startuplife', '#entrepreneurmindset', '#businessstrategy'],
      niche: ['#entrepreneurlife', '#businesssuccess', '#startupfounder', '#businessdevelopment', '#entrepreneurjourney']
    },
    'Educator': {
      description: 'Professional teaching and sharing knowledge',
      primary: ['#educator', '#teacher', '#education', '#learning', '#teach'],
      secondary: ['#teaching', '#educationmatters', '#learninganddevelopment', '#edtech', '#onlineeducation'],
      niche: ['#educatorlife', '#teachingtips', '#educationcommunity', '#learningjourney', '#educationforall']
    },
    'Consultant': {
      description: 'Expert providing professional advice and guidance',
      primary: ['#consultant', '#consulting', '#expert', '#advisor', '#professional'],
      secondary: ['#businessconsultant', '#consultingfirm', '#expertadvice', '#strategicconsulting', '#consultancy'],
      niche: ['#consultantlife', '#consultingbusiness', '#expertconsultant', '#consultingtips', '#professionaladvisor']
    }
  };

  const config = personaConfigs[persona];
  if (!config) return null;

  // Enhance with keywords from scraped content
  const enhancedPrimary = [...config.primary, ...data.keywords.slice(0, 2).map(k => `#${k.replace(/\s+/g, '')}`)];
  const enhancedSecondary = [...config.secondary, ...data.keywords.slice(2, 5).map(k => `#${k.replace(/\s+/g, '')}`)];
  const enhancedNiche = [...config.niche, ...data.keywords.slice(5, 8).map(k => `#${k.replace(/\s+/g, '')}`)];

  return {
    personaName: persona,
    description: config.description,
    primarySet: enhancedPrimary.slice(0, 5),
    secondarySet: enhancedSecondary.slice(0, 5),
    nicheSet: enhancedNiche.slice(0, 5)
  };
}

function generateGenericHashtagSet(data: ScrapedContent): GeneratedSet {
  // Create a generic set based on scraped content
  const keywords = data.keywords.slice(0, 8).map(k => `#${k.replace(/\s+/g, '')}`);
  
  return {
    personaName: 'Content Professional',
    description: 'Digital professional based on content analysis',
    primarySet: ['#digital', '#content', '#professional', '#creative', '#online', ...keywords.slice(0, 2)].slice(0, 5),
    secondarySet: ['#digitalprofessional', '#contentcreator', '#creativelife', '#onlinelife', '#digitalcontent', ...keywords.slice(2, 4)].slice(0, 5),
    nicheSet: ['#contentcommunity', '#digitalstrategy', '#creativework', '#professionalgrowth', '#contentgrowth', ...keywords.slice(4, 6)].slice(0, 5)
  };
}

function generateBlogContentHashtags(url: string): GeneratedSet[] {
  return [
    {
      personaName: 'Content Writer',
      description: 'Professional writer creating blog posts and articles',
      primarySet: ['#contentwriter', '#blogger', '#writing', '#content', '#blog'],
      secondarySet: ['#contentcreation', '#copywriting', '#blogging', '#article', '#writer'],
      nicheSet: ['#contentstrategist', '#freelancewriter', '#blogpost', '#writingcommunity', '#contentmarketing']
    },
    {
      personaName: 'Digital Marketer',
      description: 'Marketing professional focused on content strategy',
      primarySet: ['#digitalmarketing', '#marketing', '#seo', '#contentmarketing', '#socialmedia'],
      secondarySet: ['#digitalstrategy', '#contentstrategy', '#marketingtips', '#onlinemarketing', '#brand'],
      nicheSet: ['#marketingagency', '#contentcreator', '#marketingexpert', '#digitalagency', '#growthhacking']
    }
  ];
}

function generateDesignContentHashtags(url: string): GeneratedSet[] {
  return [
    {
      personaName: 'Graphic Designer',
      description: 'Creative professional designing visual content',
      primarySet: ['#graphicdesign', '#design', '#creative', '#art', '#designer'],
      secondarySet: ['#graphicdesigner', '#visualdesign', '#creativedesign', '#designinspiration', '#artwork'],
      nicheSet: ['#designcommunity', '#graphicart', '#digitaldesign', '#designstudio', '#creativeprocess']
    },
    {
      personaName: 'UI/UX Designer',
      description: 'User interface and experience design specialist',
      primarySet: ['#uiux', '#uxdesign', '#uidesign', '#userexperience', '#userinterface'],
      secondarySet: ['#uxui', '#designsystem', '#productdesign', '#interactiondesign', '#webdesign'],
      nicheSet: ['#uxresearch', '#uiinspiration', '#designthinking', '#prototyping', '#designsprint']
    }
  ];
}

function generateTechContentHashtags(url: string): GeneratedSet[] {
  return [
    {
      personaName: 'Software Developer',
      description: 'Programmer and software engineer',
      primarySet: ['#softwaredeveloper', '#programming', '#coding', '#developer', '#tech'],
      secondarySet: ['#softwareengineer', '#webdevelopment', '#programmer', '#code', '#javascript'],
      nicheSet: ['#fullstack', '#webdeveloper', '#codinglife', '#devcommunity', '#softwaredevelopment']
    },
    {
      personaName: 'Tech Enthusiast',
      description: 'Technology lover and early adopter',
      primarySet: ['#technology', '#tech', '#innovation', '#futuretech', '#digital'],
      secondarySet: ['#techenthusiast', '#gadgets', '#technews', '#ai', '#emergingtech'],
      nicheSet: ['#techcommunity', '#techtalk', '#techlover', '#innovationlab', '#digitaltransformation']
    }
  ];
}

function generateSocialMediaHashtags(url: string): GeneratedSet[] {
  return [
    {
      personaName: 'Social Media Influencer',
      description: 'Content creator building personal brand on social platforms',
      primarySet: ['#influencer', '#socialmedia', '#contentcreator', '#instagram', '#tiktok'],
      secondarySet: ['#influencermarketing', '#socialmediainfluencer', '#contentcreation', '#creator', '#socialmedia'],
      nicheSet: ['#influencerlife', '#socialmediatips', '#contentcreatorlife', '#instagrammer', '#tiktokcreator']
    },
    {
      personaName: 'Social Media Manager',
      description: 'Professional managing social media accounts and strategy',
      primarySet: ['#socialmediamanager', '#socialmedia', '#marketing', '#digitalmarketing', '#content'],
      secondarySet: ['#socialmediamarketing', '#smm', '#socialmediaexpert', '#contentstrategy', '#communitymanager'],
      nicheSet: ['#socialmediastrategy', '#socialmediamanagement', '#socialmediatips', '#socialmediaexpert', '#digitalstrategy']
    }
  ];
}

function generateVideoContentHashtags(url: string): GeneratedSet[] {
  return [
    {
      personaName: 'Video Creator',
      description: 'Content creator producing video content',
      primarySet: ['#videocreator', '#video', '#contentcreator', '#youtube', '#filmmaker'],
      secondarySet: ['#videoproduction', '#videography', '#videoediting', '#contentcreation', '#youtuber'],
      nicheSet: ['#videomaker', '#videocontent', '#creativevideo', '#videographer', '#youtubecreator']
    },
    {
      personaName: 'Video Editor',
      description: 'Professional editing and post-production specialist',
      primarySet: ['#videoeditor', '#editing', '#postproduction', '#video', '#editor'],
      secondarySet: ['#videoediting', '#postproduction', '#edit', '#videoproduction', '#creativeediting'],
      nicheSet: ['#editingsoftware', '#videoedit', '#postproductionwork', '#editinglife', '#videopost']
    }
  ];
}

function generateGenericContentHashtags(url: string): GeneratedSet[] {
  return [
    {
      personaName: 'Content Creator',
      description: 'Multi-platform content creator and digital strategist',
      primarySet: ['#contentcreator', '#digital', '#creative', '#content', '#socialmedia'],
      secondarySet: ['#contentcreation', '#digitalcreator', '#creativelife', '#contentstrategy', '#digitalcontent'],
      nicheSet: ['#creatorcommunity', '#contentcreators', '#digitalstrategy', '#creativecontent', '#contentmarketing']
    },
    {
      personaName: 'Digital Entrepreneur',
      description: 'Business owner in the digital space',
      primarySet: ['#entrepreneur', '#business', '#digital', '#startup', '#entrepreneurship'],
      secondarySet: ['#digitalentrepreneur', '#businessowner', '#startuplife', '#entrepreneurmindset', '#digitalbusiness'],
      nicheSet: ['#entrepreneurlife', '#businessgrowth', '#digitaltransformation', '#startupfounder', '#businessstrategy']
    }
  ];
}