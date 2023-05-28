import { customLog } from '../util/custom-log';
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');
const { YoutubeTranscript, YoutubeTranscriptError } = require('youtube-transcript');
const puppeteer = require('puppeteer');
const sanitizeHtml = require('sanitize-html');

const maxCharacters = 10000; // Maximum allowed character count per article

export const crawlArticle = async (url) => { 
    // Crawl Washington Post
    if (url.includes('washingtonpost.com')) {
      customLog('CRAWLING WASHINGTON POST ARTICLE: ' + url, 'magenta');
      // TODO: Add rate limit.
      customLog('NOT CRAWLING WASHINGTON POST, NEED TO RATE LIMIT', 'yellow');
      return { title: null, content: null };
      // return await getArticleData(url); //, /(grid-body|luf-content-well)/
    }
    // Crawl Bloomberg    
    if (url.includes('bloomberg.com')) {
      customLog('CRAWLING BLOOMBERG ARTICLE: ' + url, 'cyan');
      // TODO: Fix the crawling...
      // customLog('NOT CRAWLING BLOOMBERG, NEED TO RATE LIMIT', 'yellow');
      // return { title: null, content: null };
      return await getArticleData(url, '/(teaser-content__\w+|article-body)/');
    }
    // Crawl WSJ    
    if (url.includes('wsj.com')) {
      customLog('NOT CRAWLING WSJ ARTICLE, CANNOT BYBALL PAYWALL NEED AUTHENTICATION: ' + url, 'blue');
      return { title: null, content: null };
      // return await getArticleData(url, '/css-k3zb6l-Paragraph/'); 
    }
    // Crawl YouTube Transcriptions
    if (url.includes('youtube.com')) {
      customLog('CRAWLING YOUTUBE TRANSCRIPTION: ' + url, 'red');
      return await getYouTubeTranscription(url);
    }
    // For other websites, continue with JSDOM.fromURL
    customLog('CRAWLING URL: ' + url, 'green');    

    let articleTitle, articleContent;

    try {
      const dom = await JSDOM.fromURL(url, { referrer: 'https://www.google.com/' });
      const reader = new Readability(dom.window.document);
      const article = reader.parse();
      
      // Extract the article title and content
      articleTitle = article.title;
      articleContent = article.textContent.replace(/\n/g, '').replace(/\s\s+/g, ' ').trim();      

      // Sanitize Fox News articles to remove internal links
      if (url.includes('foxnews.com')) {
        articleContent = cleanFoxNewsArticleContent(articleContent);
      }

      articleContent = truncateContent(articleContent, maxCharacters);

    } catch (error) {
      console.error('JSDOM or Readability Error:', error);
      
      try {
        console.log('Trying Puppeteer to crawl..');
        return await getArticleData(url);
        
      } catch (innerError) {
        console.error('Error occurred during Puppeteer operation:', innerError);
        return { title: null, content: null };
      }
    }
    // console.log(articleTitle+'\n'+articleContent);
    return { title: articleTitle, content: articleContent };
};

// Helper function to crawl articles from specific websites
const getArticleData = async (url, selector) => {
  const browser = await puppeteer.launch({
    defaultArgs: ['--enable-features=NetworkService','--disable-extensions','--no-sandbox','--disable-setuid-sandbox','--disable-web-security','--disable-features=IsolateOrigins,site-per-process','--disable-site-isolation-trials','--no-zygote','--single-process',],
    headless: 'new',
  });
  const page = await browser.newPage();
  // Set user agent to mimic a regular browser
  await page.setUserAgent(
    'Mozilla/8.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.5672.126 Safari/537.36'
  );
  // Set viewport size to a typical browser size
  await page.setViewport({ width: 1366, height: 768 });
  // Set navigation timeout to 10 seconds (10000 ms)
  await page.setDefaultNavigationTimeout(10000);
  
  // Emulate human-like behavior
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForSelector('body');

  // Extract the HTML content of the page
  let content = await page.content();
  // Extract the title from the HTML content
  const title = await page.$eval('title', (element) => element.textContent);

  await browser.close();

  // If a selector is provided, extract content using regex selector
  if (selector) {
    const dom = new JSDOM(content);
    const elements = Array.from(dom.window.document.querySelectorAll('*'));
    const regex = new RegExp(selector, 'i');
    const selectedElements = elements.filter(element => regex.test(element.className));
    content = selectedElements.map(element => element.textContent).join(' ');
    console.log('Selected Content: ' + content);
  }


  // Sanitize the HTML content to remove unwanted tags and attributes
  let sanitizedContent = sanitizeHtml(content, {
    allowedTags: ['p', 'a', 'ul', 'ol', 'li', 'blockquote'],
    allowedAttributes: {
      a: ['href'],
    },
  });
  
  // Remove the prefixes from Washington Post articles
  if (url.includes('washingtonpost.com')) {
    sanitizedContent = cleanWAPOArticleContent(sanitizedContent);

    // Sanitize Washington Post paywall content
    const paywallIndex = sanitizedContent.indexOf('WpGet the full experience.Choose your plan');
    if (paywallIndex !== -1) {
      sanitizedContent = sanitizedContent.substring(0, paywallIndex);
    }
  }

  // Remove the postfixes from WSJ articles
  if (url.includes('wsj.com')) {

    // const copyrightIndex = sanitizedContent.indexOf('Copyright ©');
    // if (copyrightIndex !== -1) {
    //   sanitizedContent = sanitizedContent.substring(0, copyrightIndex);
    // }
  }
  

  // Convert the sanitized content back to plain text
  let textContent = new JSDOM(sanitizedContent).window.document.querySelector('body').textContent.trim();

  textContent = truncateContent(textContent, maxCharacters);


  // console.log(title + '\n' + textContent);
  return { title, content: textContent };
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


    const dom = await JSDOM.fromURL(url, { referrer: 'https://www.google.com/', resources: 'usable' });
    const titleElement = dom.window.document.querySelector('title');
    const title = titleElement ? titleElement.textContent.trim() : 'YouTube';

    content = truncateContent(content, maxCharacters);

    // console.log(title);
    return { title: title, content };
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
  // Define the regex patterns to match the prefixes and postfixes specific to Washington Post
  const prefixPattern = /^(Listen\d+\s+minComment on this storyComment\d+Gift ArticleShare|Skip to end of carousel)/;
  const postfixPattern = /Show moreChevronDown\d+\s+CommentsGiftOutlineGift Article$/;

  // Remove the prefixes and postfixes from the content using regex replacement
  let cleanedContent = content.replace(prefixPattern, '');
  cleanedContent = cleanedContent.replace(postfixPattern, '');

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
