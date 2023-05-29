const { crawlArticle } = require('./api/crawl-article');
const { fetchStories } = require('./api/fetch-stories');

export async function fetchNews() {
  const startTime = new Date(); // Record the start time

  const storyArray = await fetchStories();
  const articles = [];
  const excludeSources = ['New York Post', 'The Daily Beast', 'The Daily Mail', 'Slate', 'The Weather Channel'];

  for (let storyIndex = 0; storyIndex < storyArray.length; storyIndex++) {
    const story = storyArray[storyIndex];
    const storyArticles = [];

    for (const snippet of story) {
      try {
        const article = await crawlArticle(snippet.href);
        article.url = snippet.href;
        article.source = snippet.source; // Store the source in the article object
        article.storyIndex = storyIndex + 1; // Add the story index to the article
        article.pubDate = snippet.pubDate;

        logArticle(article);

        // Exclude articles from excluded sources and null content
        if (!excludeSources.includes(article.source) && article.content !== null) {
          // Skip opinion articles and blocked pages
          if (article.title.startsWith('Opinion:') || article.title.startsWith('Opinion |') || article.title.startsWith('Editorial:') || article.title.endsWith('| Opinion') || article.title.endsWith('- Opinion') || article.title.includes('Access to this page has been denied') || article.title.includes('Are you a robot?')) {
            continue;
          }
          storyArticles.push(article);
        }
      } catch (error) {
        console.error('Error occurred while processing article:', error)
      }
    }

    articles.push(storyArticles);
  }

  createSummaryConsoleLog(articles);

  const flattenedArticles = articles.flat(); // Flatten the nested array

  const endTime = new Date(); // Record the end time
  const elapsedTime = endTime - startTime; // Calculate the elapsed time in milliseconds

  const elapsedSeconds = elapsedTime / 1000; // Convert to seconds
  const elapsedSecondsFixed = elapsedSeconds.toFixed(1); // Round to 1 decimal place

  const totalArticles = articles.reduce((count, story) => count + story.length, 0);

  
  setTimeout(() => {
    
    console.log('\n\nTotal Stories: ' + articles.length);
    articles.forEach((story, index) => {
      console.log('# of Articles in Story ' + (index + 1) + ': ' + story.length);
    });
    console.log('Total Articles: ' + totalArticles);
        
    console.log('\n\nElapsed Time:', elapsedSecondsFixed, 'seconds');
    console.log('Current Time:', new Date().toLocaleTimeString());
    
  }, 1000);

  return flattenedArticles;
};

const logArticle = (article) => {
  console.log('---');
  console.log(`Story ${article.storyIndex}:`);
  console.log(`Title - ${article.title}`);
  console.log(`Source - ${article.source}`);
  // console.log(`Favicon - ${article.favicon}`);
  console.log(article.content ? `-> ${article.content.substring(0, 280).trim().replace(/[^\w\s]*$/, '')}…` : 'Article content is null.');
  // console.log(`Published - ${article.pubDate}`);
  console.log('---');
};

const createSummaryConsoleLog = async (articles) => {
  const summaries = [];
  for (const story of articles) {
    const prompt = `Summarize the news coverage in a concise, unbiased bullet point list: Use journalistic AP style (inverted pyramid). Write in bullet points only. Avoid plagiarism by changing wording. Be concise and unbiased. Don't abbreviate words unless previously defined. Clarify names of all mentioned subjects. Include the most important facts in first 3 bullet points. State all facts. Each bullet point should be 140 characters or less. Provide a total of 5 bullet points in response.\n\n`;
    const storyContent = story.map((article) => `${article.content}`).join('\n\n\n');
    const storyPrompt = `${prompt} News Coverage: """${storyContent}"""`;

    setTimeout(() => {
      console.log('\n\n\n', storyPrompt);
    }, 900);
  }

  return summaries;
};
