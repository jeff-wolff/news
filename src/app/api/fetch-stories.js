const news = require('gnews');
let puppeteer;

if (process.env.VERCEL_ENV == 'production') {
  puppeteer = require('puppeteer-core'); 
} else {
  puppeteer = require('puppeteer'); 
}

export async function fetchStories() {
  const stories = [];

  // Retrieve top breaking news stories on Google News (max n=38)
  const heads = await news.headlines({ 
    country: 'us',
    language: 'en', 
    n: 5
  });
  
  // const heads = await news.topic('HEALTH', {n : 3});

  const browser = await puppeteer.launch({
    headless: 'new'
  });
  const page = await browser.newPage();

  for (const [i, item] of heads.entries()) {
    const contentSnippet = item.contentSnippet;
    const itemSnippets = contentSnippet.split('\n');
    const urls = extractUrls(item.content);
    const fullCoverageUrl = urls[urls.length-1];
    // console.log(item)

    if (!stories.find((story) => story.id === item.guid)) {
      const story = {};
      story.id = item.guid;
      story.title = await crawlGooglePage(page, fullCoverageUrl);
      story.dateUpdated = item.isoDate;
      story.fullCoverageUrl = fullCoverageUrl;

      stories.push(story);

      console.log(`[${new Date(story.dateUpdated).toLocaleString()}] - Story ${story.id} - ${story.title}`);
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

  // await browser.close();

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