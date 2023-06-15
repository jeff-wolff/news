const { customLog } = require('./custom-log');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');
const { YoutubeTranscript, YoutubeTranscriptError } = require('youtube-transcript');
const puppeteer = require('puppeteer');
const sanitizeHtml = require('sanitize-html');

const maxCharacters = 11000; // Maximum allowed character count per article

export async function crawlArticle(url) { 
    // Crawl Washington Post
    if (url.includes('washingtonpost.com')) {
      customLog('NOT CRAWLING WASHINGTON POST: '+url, 'yellow');
      // return await getArticleData(url, /grid-body/);
      return { title: null, content: null };
    }
    // Crawl Bloomberg    
    if (url.includes('bloomberg.com')) {
      customLog('CRAWLING BLOOMBERG ARTICLE: ' + url, 'cyan');
      return await getArticleData(url, /(teaser-content__\w+|article-body)/);
      // customLog('NOT CRAWLING BLOOMBERG: '+url, 'yellow');
      // return { title: null, content: null };
    }
    // Crawl Axios
    if (url.includes('axios.com')) {
      customLog('CRAWLING AXIOS: ' + url, 'cyan')
      return await getArticleData(url, /DraftjsBlocks_draftjs__jDHy3/)
    }
    // Crawl WSJ    
    if (url.includes('wsj.com')) {
      customLog('CRAWLING WSJ, CANNOT BYBALL PAYWALL: ' + url, 'cyan');
      return await getArticleData(url, /ef4qpkp0/); 
    }
    // Crawl YouTube Transcriptions
    if (url.includes('youtube.com')) {
      customLog('CRAWLING YOUTUBE TRANSCRIPTION: ' + url, 'red');
      return await getYouTubeTranscription(url);
    }
    
    let articleTitle, articleContent, faviconUrl, articleImage;
    const domain = extractMainDomain(url);
    
    try {
      customLog('CRAWLING URL: ' + url, 'green');    
      // For other websites, continue with JSDOM.fromURL
      const dom = await JSDOM.fromURL(url, { referrer: 'https://www.google.com/' });
      const reader = new Readability(dom.window.document);
      const article = reader.parse();
      
      // Extract the article title and content
      articleTitle = article.title;
      articleContent = article.textContent.replace(/\n/g, '').replace(/\s\s+/g, ' ').trim();      

      // Quick sanitation.
      if (articleContent.includes('Please ensure Javascript is enabled')) {
        return { title: null, content: null };
      }

      // Remove after Copyright
      const copyrightRegex = /Copyright\s+©?\s*\d{4}/;
      const match = articleContent.match(new RegExp(`${copyrightRegex.source}`, 'i'));
      if (match) {
        articleContent = articleContent.substring(0, match.index);
      }      

      articleContent = truncateContent(articleContent, maxCharacters);

      // Fetch the favicon URL
      const faviconElement = dom.window.document.querySelector('link[rel="icon"], link[rel="shortcut icon"], link[rel="alternate icon"]');
      faviconUrl = faviconElement ? new URL(faviconElement.href, url).href : domain + '/favicon.ico';
      
      // BBC favicon hack
      if (url.includes('bbc.com')) {
        faviconUrl = 'https://static.files.bbci.co.uk/core/website/assets/static/icons/favicon/news/favicon-32.5cf4e6db028a596f5dc3.png';
      }

      // Fetch the og:image URL
      const ogImageElement = dom.window.document.querySelector('meta[property="og:image"]');
      articleImage = ogImageElement ? ogImageElement.content : null;

      // Sanitize Fox News articles to remove internal links, remove if opinion.
      if (url.includes('foxnews.com')) {
        articleContent = cleanFoxNewsArticleContent(articleContent);
        const meta = dom.window.document.querySelector('.article-meta').textContent;
        if (meta.toLowerCase().includes('opinion')) {
          return { title: null, content: null }
        }
      }

    } catch (error) {
      if (error.message.includes("Resource was not loaded. Status: 403")) {
        customLog('JSDOM Error: Resource was not loaded. Status: 403', 'yellow');
      } else  {
        console.error('JSDOM or Readability Error:', error);
      }
      // Use Puppeteeer if errored out
      try {        
        return await getArticleData(url);
      } catch (innerError) {
        console.error('Error occurred during Puppeteer operation:', innerError);
        return { title: null, content: null };
      }
    }
    // console.log(articleTitle+'\n'+articleContent+'\n'+faviconUrl+'\n'+articleImage);
    return { title: articleTitle, content: articleContent, favicon: faviconUrl, image: articleImage };
};

// Helper function to crawl articles from specific websites that don't support JSDOM
const getArticleData = async (url, selector) => {
  customLog('Trying Puppeteer to crawl..'+url, 'cyan');
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: 'new',
    });
    const page = await browser.newPage();
    // Set user agent to mimic a Googlebot
    await page.setUserAgent('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)');
    await page.setExtraHTTPHeaders({
      referer: 'https://www.google.com/',
    });
    // Set JavaScript on
    await page.setJavaScriptEnabled(true);

    // Set viewport size to a typical browser size
    await page.setViewport({ width: 1366, height: 768 });
    // Set navigation timeout to 10 seconds (10000 ms)
    await page.setDefaultNavigationTimeout(10000);
    
    // Emulate human-like behavior
    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.waitForSelector('body');
    
    await new Promise(r => setTimeout(r, 2000)); // 2000ms delay
    
    // Extract the title from the HTML content
    let title = await page.$eval('title', (element) => element.textContent);
    
    // Fetch the og:image URL
    const ogImageElement = await page.$('meta[property="og:image"]');
    const ogImageUrl = ogImageElement ? await page.evaluate(element => element.getAttribute('content'), ogImageElement) : null;
    
    // Fetch the favicon URL
    const faviconUrl = await page.$$eval('link[rel="icon"], link[rel="shortcut icon"], link[rel="alternate icon"]', (elements) => {
      const favicon = elements.find((el) => el.href);
      return favicon ? favicon.href : null;
    });    
    

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); //Scroll to bottom

    await new Promise(r => setTimeout(r, 1000)); // 1000ms delay

    // Extract the HTML content of the page
    let content = await page.content();

    // If a selector is provided, extract content using regex selector
    if (selector) {
      const dom = new JSDOM(content);
      const elements = Array.from(dom.window.document.querySelectorAll('*'));
      const regex = new RegExp(selector, 'i');
      const selectedElements = elements.filter((element) => regex.test(element.className));
      const selectedContent = selectedElements.map((element) => element.textContent).join(' ');
      customLog('Selected Content: ' + selectedContent, 'yellow');
      content = selectedContent;
    }

    // Sanitize the HTML content to remove unwanted tags and attributes
    let sanitizedContent = sanitizeHtml(content, {
      allowedTags: ['p', 'a', 'ul', 'ol', 'li', 'blockquote'],
      allowedAttributes: {
        a: ['href'],
      },
    });

    // Remove after Copyright ©
    const copyrightRegex = /Copyright\s+©?\s*\d{4}/;
    const match = sanitizedContent.match(new RegExp(`${copyrightRegex.source}`, 'i'));
    if (match) {
      sanitizedContent = sanitizedContent.substring(0, match.index);
    }

    // Remove the pre/postfixes from Washington Post articles
    if (url.includes('washingtonpost.com')) {
      sanitizedContent = cleanWAPOArticleContent(sanitizedContent);
      title = title.replace(' - The Washington Post','');
    }

    // Remove the pre/postfixes from WSJ articles
    if (url.includes('wsj.com')) {
      title = title.replace(' - WSJ','');
      const meta = await page.$eval('.css-197is4s', (element) => element.textContent).catch(() => null);
      if (meta && meta.toLowerCase().includes('opinion')) {
        return { title: null, content: null }
      }
    }

    // Convert the sanitized content back to plain text
    let textContent = new JSDOM(sanitizedContent).window.document.querySelector('body').textContent.trim();
    
    textContent = textContent.replace(/\n/g, '').replace(/\s\s+/g, ' ').trim();      

    textContent = truncateContent(textContent, maxCharacters);

    // console.log(title + '\n' + textContent);
    return { title, content: textContent, favicon: faviconUrl, image: ogImageUrl };
  } catch (error) {
    if (error.message.includes('Navigation timeout')) {
      console.error('Puppeteer Error:', error.message);
    } else {
      console.error('An error occurred:', error);
    }
    return null;
  } finally {
    await browser.close();
  }
};

// Helper function to get YouTube transcription
const getYouTubeTranscription = async (url) => {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(url);
    if (!transcript || transcript.length === 0) {
      customLog('TRANSCRIPT IS EMPTY FOR THIS YOUTUBE VIDEO', 'yellow');
      return { title: 'No Transcript', content: null };
    }
    
    let content = extractContentFromTranscript(transcript).toLowerCase();

    // Remove hidden line breaks
    content = content.replace(/\r?\n|\r/g, ' ');
    
    content = truncateContent(content, maxCharacters);


    const dom = await JSDOM.fromURL(url, { referrer: 'https://www.google.com/', resources: 'usable' });
    const titleElement = dom.window.document.querySelector('title');
    const title = titleElement ? titleElement.textContent.trim() : 'YouTube';

    const favicon = 'https://www.youtube.com/s/desktop/339bae71/img/favicon_32x32.png';

     // Fetch the og:image URL
     const ogImageElement = dom.window.document.querySelector('meta[property="og:image"]');
     const image = ogImageElement ? ogImageElement.content : null;

    // console.log(title);
    return { title, content, favicon, image };
  } catch (error) {
    if (error instanceof YoutubeTranscriptError) {
      customLog('TRANSCRIPT IS DISABLED FOR THIS YOUTUBE VIDEO: ' + error, 'yellow');
      return { title: null, content: null };
    } else {
      customLog('ERROR OCCURRED WHILE FETCHING YOUTUBE TRANSCRIPT: ' + error, 'yellow');
      return { title: null, content: null };
    }
  } 
};

// Helper function to extract the content from the YouTube transcript
const extractContentFromTranscript = (transcript) => {
  return transcript
    .map((item) => item.text.trim())
    .filter((text) => text !== '')
    .join(' ');
};

const cleanWAPOArticleContent = (content) => {
  const prefixPattern = /^(Listen\d+\s+minComment on this storyComment\d+Gift ArticleShare|Skip to end of carousel)/;
  const postfixSelector = 'GiftOutlineGift';

  // Remove the prefixes and postfixes from the content using regex replacement
  let cleanedContent = content.replace(prefixPattern, '');

  const postfixIndex = cleanedContent.indexOf(postfixSelector);
  if (postfixIndex !== -1) {
    cleanedContent = cleanedContent.substring(0, postfixIndex);
  }

  // Sanitize Washington Post paywall content
  const paywallIndex = cleanedContent.indexOf('WpGet the full experience.Choose your plan');
  console.log('pw index: '+paywallIndex)
  if (paywallIndex !== -1) {
    // cleanedContent = cleanedContent.substring(0, paywallIndex);
  }

  return cleanedContent;
};

const cleanFoxNewsArticleContent = (content) => {
  // Define the regex patterns to match the ALL CAPS INTERNAL LINKS in Fox News articles
  const regexPattern = /\b[A-Z][A-Z,\d\s-]*(?:\b\s+[A-Z]{2,}|\b(?:\d+-)?[A-Z]+(?:-[A-Z]+)?(?=\b|$))/g;

  let cleanedContent = content.replace(regexPattern, '');

  return cleanedContent;
};

const truncateContent = (content, maxCharacters) => {
  if (content.length > maxCharacters) {
    return content.slice(0, maxCharacters) + "...";
  }

  return content;
};

const extractMainDomain = (url) => {
  // Match the main domain using a regular expression
  const domainMatch = url.match(/^(https?:\/\/[^/]+)/i);

  if (domainMatch && domainMatch[1]) {
    return domainMatch[1];
  }

  return null; // Return null if no main domain is found
};
