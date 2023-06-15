const { customLog } = require('./api/custom-log');
const { fetchStories } = require('./api/fetch-stories');
const { crawlArticle } = require('./api/crawl-article');
const { lookupBias } = require('./api/lookup-bias');

export async function fetchNews() {
  const startTime = new Date();

  const storyArray = await fetchStories();

  const storyArticles = [];

  const excludeSources = ['Yahoo News','Yahoo Voices', 'The Weather Channel', 'New York Post', 'The Daily Beast', 'The Daily Mail', 'Daily Mail', 'Slate','The Guardian US','The Guardian','The Independent','69News WFMZ-TV'];

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
            logArticle(article);
            storyArticles.push(article);
          }
        } catch (error) {
          console.error('Error occurred while processing article:', error)
        }
    }
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

const logArticle = async (article) => {
  customLog('---', 'lightGray');
  // customLog(`URL - ${article.url}`, 'lightGray');
  customLog(`Title - ${article.title}`, 'lightGray');
  customLog(`Source - ${article.source}`, 'lightGray');
  customLog(`Bias - ${article.bias}`, 'lightGray');
  customLog(article.content ? `-> ${article.content.substring(0, 280).trim().replace(/[^\w\s]*$/, '')}…` : 'Article content is null.', 'lightGray');
  // customLog(`Image - ${article.image}`, 'lightGray');
  // customLog(`Favicon - ${article.favicon}`, 'lightGray');
  customLog('---', 'lightGray');
};

const composePrompts = async (story) => {
  const summaries = [];

  // Group articles by storyId
  const groupedArticles = story.reduce((acc, article) => {
    const { storyId } = article;
    if (acc[storyId]) {
      acc[storyId].push(article);
    } else {
      acc[storyId] = [article];
    }
    return acc;
  }, {});

  // Iterate over grouped articles
  for (const [storyId, articles] of Object.entries(groupedArticles)) {
    const prompt = `Summarize the news coverage in a concise, unbiased, politically neutral, bullet point list, and include all the subjects and facts of the story. Use journalistic AP style (inverted pyramid). Write in bullet points only. Clarify names of all mentioned subjects. Address both sides of the debate. Describe all the important facts. Each bullet point should be 140 characters or less. Provide a total of 6-8 bullet points in response.`;
    const storyContent = articles.map((article) => `${article.content}`).join('\n\n');
    const storyPrompt = `${prompt}\nNews Coverage: """\n${storyContent}"""`;

    // const tldrPrompt = `TLDR: """${storyContent}"""`;

    const headlinePrompt = `Write a news headline in 9 words or less.`;
    const headlineTitles = articles.map((article) => `${article.title}`).join('\n');
    const fullHeadlinePrompt = `${headlinePrompt}\nTLDR: """${headlineTitles}"""`;

    //   console.log('\n---\n\n'+storyPrompt);
    //   console.log('\n---\n\n'+fullHeadlinePrompt);
    //   // console.log('\n---\n\n'+tldrPrompt);
    // }, 2000);

    // Simulate asynchronous summarization process
    await new Promise((resolve) => {
        console.log('\n---\n\n' + storyPrompt);
        console.log('\n---\n\n'+fullHeadlinePrompt);
        summaries.push(storyPrompt);
        resolve();
    });
    
  }

  // console.log(JSON.stringify(summaries));

  return summaries;
};
