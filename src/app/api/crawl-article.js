import { customLog } from '../util/custom-log';
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');
const { YoutubeTranscript, YoutubeTranscriptError } = require('youtube-transcript');
const puppeteer = require('puppeteer');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms)); // Helper function to introduce a delay

export const crawlArticle = async (url) => {
  try {
    if (url.includes('washingtonpost.com')) {
      // customLog('CANNOT CRAWL ARTICLES FROM WASHINGTONPOST.COM');
      // return { title: '================== Need Custom Crawl ==================', content: null };
      customLog('CRAWLING WASHINGTON POST ARTICLE: '+url,'magenta');
      const browser = await puppeteer.launch({
        defaultArgs: [
          '--enable-features=NetworkService',
          '--disable-extensions',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-site-isolation-trials',
          '--no-zygote',
          '--single-process',
        ],
        headless: 'new',
      });
      const page = await browser.newPage();

      // Set user agent to mimic a regular browser
      await page.setUserAgent('Mozilla/8.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.182 Safari/537.36');
      // Set viewport size to a typical browser size
      await page.setViewport({ width: 1366, height: 768 });

      // Emulate human-like behavior
      await page.goto(url, { waitUntil: 'networkidle0' });
      await new Promise((resolve) => setTimeout(resolve, 1400)); // delay
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await new Promise((resolve) => setTimeout(resolve, 1600));

      // Extract the HTML content of the page
      const htmlContent = await page.content();

      // Extract the title from the HTML content
      const title = await page.$eval('title', (element) => element.textContent);

      // Extract the content within the "grid-body" class, current only extracts non-paywalled content
      const content = await page.$eval('.grid-body', (element) => element.textContent);

      await browser.close();

      return { title: title, content: content };
    }

    if (url.includes('bloomberg.com')) {
      customLog('CRAWLING BLOOMBERG ARTICLE: '+url,'cyan');
      const browser = await puppeteer.launch({
        defaultArgs: [
          '--enable-features=NetworkService',
          '--disable-extensions',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-site-isolation-trials',
          '--no-zygote',
          '--single-process',
        ],
        headless: 'new',
      });
      const page = await browser.newPage();

      // Set user agent to mimic a regular browser
      await page.setUserAgent('Mozilla/8.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.182 Safari/537.36');
      // Set viewport size to a typical browser size
      await page.setViewport({ width: 1366, height: 768 });

      // Emulate human-like behavior
      await page.goto(url, { waitUntil: 'networkidle0' });
      await new Promise((resolve) => setTimeout(resolve, 1400)); // delay
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await new Promise((resolve) => setTimeout(resolve, 1600));

      // Extract the HTML content of the page
      const htmlContent = await page.content();

      // Extract the title from the HTML content
      const title = await page.$eval('title', (element) => element.textContent);

      // Extract the content within the "body-content" class, current only extracts non-paywalled content
      const content = await page.$eval('.body-content', (element) => element.textContent);

      await browser.close();

      return { title: ogTitle, content: content };
    }

    if (url.includes('youtube.com')) {
      customLog('CRAWLING TRANSCRIPT FROM YOUTUBE: '+url,'red');
      
      try {
        const transcript = await YoutubeTranscript.fetchTranscript(url);
        if (!transcript || transcript.length === 0) {
          console.log('TRANSCRIPT IS EMPTY FOR THIS YOUTUBE VIDEO.');
          return { title: 'No Transcript', content: null };
        }
        const content = extractContentFromTranscript(transcript);
        
        return { title: 'YouTube', content };
      } catch (error) {
        if (error instanceof YoutubeTranscriptError && error.message.includes('Transcript is disabled')) {
          console.log('TRANSCRIPT IS DISABLED FOR THIS YOUTUBE VIDEO.');
          return { title: 'No Transcript', content: null };
        } else {
          console.log('ERROR OCCURRED WHILE FETCHING YOUTUBE TRANSCRIPT:', error);
          return { title: 'No Transcript', content: null };
        }
      }
    }

    // For other websites, continue with the existing logic
    customLog('Crawling from URL: '+url,'green');

    // Add a delay of 1 second
    await delay(200);
    
    // Create a JSDOM instance and fetch the webpage content
    const dom = await JSDOM.fromURL(url);
    const doc = dom.window.document;

    // Create a Readability instance and parse the document
    const reader = new Readability(doc);
    const article = reader.parse();

    // console.log(article);

    // Extract the article title and content
    const articleTitle = article.title;
    const articleContent = article.textContent.replace(/\n/g, '').replace(/\s\s+/g, ' ').trim();

    return { title: articleTitle, content: articleContent };
  } catch (error) {
    console.error('Error:', error);
    return { title: null, content: null };
  }
};

// Helper function to extract the content from the YouTube transcript
const extractContentFromTranscript = (transcript) => {
  return transcript
    .map((item) => item.text.trim())
    .filter((text) => text !== '')
    .join(' ');
};
