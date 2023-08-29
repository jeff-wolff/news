const { customLog } = require('./api/custom-log');
const { fetchStories } = require('./api/fetch-stories');
const { crawlArticle } = require('./api/crawl-article');
const { lookupBias } = require('./api/lookup-bias');
const { composePrompts } = require('./api/compose-prompts');
const { logArticleDetails } = require('./api/log-article-details');

export async function fetchNews() {
  const startTime = new Date();

  const storyArray = await fetchStories();

  const storyArticles = [];

  const excludeSources = ['Yahoo News','Yahoo Voices', 'The Weather Channel', 'New York Post', 'The Daily Beast', 'The Daily Mail', 'Daily Mail', 'Slate','The Guardian US','The Guardian','The Independent','69News WFMZ-TV'];

  try {
    for (const story of storyArray) {
      const storyId = story.id;
      const storyTitle = story.title;
  
      customLog(`Story: ${storyId} - ${storyTitle}`,'lightBlue');
  
      const snippets = story.snippets;
      
      for (const snippet of snippets) {
        // console.log(snippet);
          try {
            const article = await crawlArticle(snippet.href);
            article.storyId = story.id;
            article.url = snippet.href;
            article.source = snippet.source;
  
            // Filter articles by excluded sources, null content, opinion paths
            if (
                !excludeSources.includes(article.source) && 
                article.content !== null && 
                !article.url.includes('/opinion/') &&
                !article.url.includes('/voices/') &&
                !article.url.includes('/ideas/')
               ) 
            {
              // Filter out articles by title
              if (
                  article.title.startsWith('Opinion') || 
                  article.title.startsWith('Editorial') || 
                  article.title.startsWith('Podcast') ||
                  article.title.startsWith('AP News') ||
                  article.title.endsWith('| Editorial') || 
                  article.title.endsWith('| Opinion') || 
                  article.title.endsWith('- Opinion') || 
                  article.title.includes('Access to this page has been denied') || 
                  article.title.includes('Are you a robot?') ||
                  article.title.includes('Just a moment...') || 
                  article.title.includes('Access Denied') ||
                  article.title.includes('Attention Required! | Cloudflare')
                 ) 
              {
                continue;
              }
              // Only limit 3 articles per story
              // if (storyArticles.length > 2) {
              //   break;
              // }
              lookupBias(article); // Look up the bias for the article
              logArticleDetails(article);
              storyArticles.push(article);
            }
          } catch (error) {
            console.error('Error occurred while processing article:', error)
          }
      }
    }
  } catch (error) {
    console.error(error);
  }


  // console.log(storyArray);
  // console.log(storyArticles);

  composePrompts(storyArticles)

  // Calculate Elapsed time
  const endTime = new Date();
  const elapsedTime = endTime - startTime; // in milliseconds
  const elapsedSeconds = elapsedTime / 1000; // convert to seconds
  const elapsedSecondsFixed = elapsedSeconds.toFixed(1); // round to 1 decimal place

  const totalArticles = storyArticles.length;

  setTimeout(() => {
    const response = {
      storyArray: storyArray.map(story => ({
        id: story.id,
        title: story.title,
        dateUpdated: story.dateUpdated,
        fullCoverageUrl: story.fullCoverageUrl,
      })),
      storyArticles: storyArticles.map(article => ({
        storyId: article.storyId,
        url: article.url,
        title: article.title,
        source: article.source,
        bias: article.bias,
        content: article.content ? article.content.substring(0, 280).trim().replace(/[^\w\s]*$/, '') + '...' : 'Article content is null.',
        image: article.image,
        favicon: article.favicon,
      })),
      totalArticles: totalArticles,
      elapsedTime: elapsedSecondsFixed + ' seconds',
      currentTime: new Date().toLocaleTimeString()
    };
  
    console.log(JSON.stringify(response, null, 2));
  }, 2000);

  return storyArticles;
};

