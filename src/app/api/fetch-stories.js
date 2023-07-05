const { customLog } = require('./custom-log');
const news = require('gnews');
// const Parser = require('rss-parser');
let puppeteer, browser;


export async function fetchStories() {
  const stories = [];

  // Set correct Puppeteer for scraping
if (process.env.VERCEL_ENV == 'production') {
    puppeteer = require('puppeteer-core'); 
  } else {
    puppeteer = require('puppeteer'); 
  }

  // Set correct Puppeteer browser args for production / dev
  if (process.env.VERCEL_ENV == 'production') {
    browser = await puppeteer.launch({
      headless: 'new'
    });
  } else {
    browser = await puppeteer.launch({
      headless: 'new'
    });
  }

  // Create a new browser session
  const page = await browser.newPage();

  // Retrieve top breaking news stories on Google News (max n=38)
  const heads = await news.headlines({ 
    country: 'us',
    language: 'en', 
    n: 5
  });
  
  // WORLD, BUSINESS, TECHNOLOLGY, ENTERTAINMENT, SPORTS, SCIENCE, HEALTH
  // const heads = await news.topic('HEADLINE', {
  //   country: 'us',
  //   language: 'en', 
  //   n: 20
  // });

  // const HEADLINES_RSS = 'https://news.google.com/news/rss';
  // const TOPICS_RSS    = 'https://news.google.com/rss/topics/';
  // const GEO_RSS       = 'https://news.google.com/news/rss/headlines/section/geo/';
  // const SEARCH_RSS    = 'https://news.google.com/rss/search?q=';
  // const TOPICS = ['WORLD', 'NATION', 'BUSINESS', 'TECHNOLOGY', 'ENTERTAINMENT', 'SPORTS', 'SCIENCE', 'HEALTH'];
  
  // const fillCountryLangParams = (country, language) => `hl=${country}
  // &gl=${language}&ceid=${country}%3A${language}`;
  
  // const parser = new Parser();

  // const getRss = async (url) => await parser.parseURL(url);

  // const headlines = async ({country = 'us', language = 'en', n = 10}={}) => {
  //   const url = HEADLINES_RSS + '?' + fillCountryLangParams(country.toUpperCase(), language.toLowerCase());
  //   return (await getRss(url)).items.slice(0, Math.max(0, n));
  // };

  // const topic = async (topicName, {country = 'us', language = 'en', n = 10}={}) => {
  //   // if (!TOPICS.includes(topicName)) throw 'Invalid topic name. See list of topics for valid names.';
  //   const url = TOPICS_RSS + topicName + '?' + fillCountryLangParams(country.toUpperCase(), language.toLowerCase());
  //   return (await getRss(url)).items.slice(0, Math.max(0, n));
  // }

  // const geo = async (position, {country = 'us', language = 'en', n = 10}={}) => {
  //   const url = GEO_RSS + encodeURIComponent(position) + '?' +
  //     fillCountryLangParams(country.toUpperCase(), language.toLowerCase());
  //   return (await getRss(url)).items.slice(0, Math.max(0, n));
  // };

  // const search = async (query, {country = 'us', language = 'en', n = 10}={}) => {
  //   const url = SEARCH_RSS + encodeURIComponent(query) + '&' +
  //     fillCountryLangParams(country.toUpperCase(), language.toLowerCase());
  //   return (await getRss(url)).items.slice(0, Math.max(0, n));
  // };
  
  // const heads = await headlines({
  //   country: 'us',
  //   language: 'en', 
  //   n: 7
  // });

  // const heads = await geo('San Diego', {
  //   country: 'us',
  //   language: 'en', 
  //   n: 1
  // });

  // AP News
  // when:24h after:2020-06-01 before:2020-06-02
  // allintext, intitle, allintitle, inurl
  // const heads = await search('allinurl:apnews.com', {
  //   country: 'us',
  //   language: 'en', 
  //   n: 20
  // });

  // Topics
  // const topicHealth = 'CAAqIQgKIhtDQkFTRGdvSUwyMHZNR3QwTlRFU0FtVnVLQUFQAQ';
  // const topicTech = 'CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pWVXlnQVAB';
  // const topicBusiness = 'CAAqKggKIiRDQkFTRlFvSUwyMHZNRGx6TVdZU0JXVnVMVlZUR2dKVlV5Z0FQAQ';
  // const topicScience = 'CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp0Y1RjU0FtVnVHZ0pWVXlnQVAB';
  
  // const heads = await topic(topicUS, {
  //   country: 'us',
  //   language: 'en', 
  //   n: 5
  // });
  
  // console.log(heads)
  customLog('Length: '+heads.length,'yellow');


  for (const [i, item] of heads.entries()) {
    const contentSnippet = item.contentSnippet;
    const itemSnippets = contentSnippet.split('\n');
    const urls = extractUrls(item.content);
    const fullCoverageUrl = urls[urls.length-1];
    // console.log(stories)

    // Filter stories based on fullCoverageUrl
    // if (!fullCoverageUrl.includes('https://news.google.com/stories/')) {
    //   continue;
    // }

    try {
      if (!stories.find((story) => story.id === item.guid)) {
        const story = {};
        story.id = item.guid;
        story.title = await crawlGooglePage(page, fullCoverageUrl);
        story.dateUpdated = item.isoDate;
        story.fullCoverageUrl = fullCoverageUrl;
  
        stories.push(story);
  
        customLog(`Story: ${story.id} – ${new Date(story.dateUpdated).toLocaleString()} – ${story.title}\n${fullCoverageUrl} `,'cyan');
        customLog(`\n${JSON.stringify(story, null, 2)}`,'darkGray');
      }
      
      const resolvedSnippetsArray = await Promise.all(
        itemSnippets
          .filter((snippet) => snippet !== 'View Full Coverage on Google News')
          .map(async (snippet, index) => {
            const sanitizedSnippet = snippet.replace(/\s{2,}.*$/, '');
            const href = urls[index % urls.length];
            let source = snippet.replace(sanitizedSnippet, '');
            source = source.replace(/View Full Coverage on Google News|View Full coverage on Google News/g, '').trim();
            const resolvedHref = await resolveLink(href);
  
            // Sanitize the end of the snippet by removing everything after the dash "-"
            const sanitizedSnippetEnd = sanitizedSnippet.split(' - ')[0];
            
            if (sanitizedSnippetEnd === '' || source === '') {
              return null;
            }
            // console.log("\n")
            // console.log(`Title: ${sanitizedSnippetEnd}\nURL: ${resolvedHref}\nSource: ${source}`);
            // console.log("\n")
  
            return { snippet: sanitizedSnippetEnd, href: resolvedHref, source };
          })
      );
      
      if (fullCoverageUrl.includes('/stories/')) { // Only include stories with Google News link
        const story = stories.find((story) => story.fullCoverageUrl === fullCoverageUrl);
        story.snippets = resolvedSnippetsArray.filter((snippet) => snippet !== null);
      }
    }
    catch(error) {
      customLog(`Fetch Stories Error: `+error, 'red');
    }
  }
  
  // Close browser 
  await browser.close();

  return stories;
}

const extractUrls = (content) => {
  const regex = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/g;
  const matches = [...content.matchAll(regex)];
  return matches.map((match) => match[2]);
};

const crawlGooglePage = async (page, url) => {
  await page.goto(url);

  let title = await page.title();
  title = title.replace('Google News - ', '').replace(' - Overview', '');

  return title;
}

const resolveLink = async (googleNewsLink) => {
  try {
    const response = await fetch(googleNewsLink);
    
    if (response.status === 200) {
      // If the request is successful, parse the response body to find the actual URL
      const body = await response.text();
      const regex = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/;
      const match = body.match(regex);

      if (match) {
        const actualUrl = match[2];
        return actualUrl;
      }
    }
    
    // If no actual URL is found or the request fails, return the original Google News link
    return googleNewsLink;

  } catch (error) {
    console.error('Error resolving link: ', error);
    return googleNewsLink;
  }
};