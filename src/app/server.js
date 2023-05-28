const express = require('express');
const cron = require('node-cron');
const { crawlArticle } = require('./crawl-article');
const { fetchStories } = require('./fetch-stories');

const app = express();
const port = 3099;

// Schedule getNews to run every minute
// cron.schedule('* * * * *', async () => {
//   try {
//     await getNews();
//     console.log('getNews executed successfully');
//   } catch (error) {
//     console.error('Error:', error);
//   }
// });

app.get('/fetch-news', async (req, res) => {
  try {
    const articles = await getNews();
    res.json(articles);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

const getNews = async () => {
  const startTime = new Date(); // Record the start time

  const storyArray = await fetchStories();
  const articles = [];
  const excludeSources = ['New York Post', 'The Daily Beast', 'The Daily Mail', 'Slate']; // Optional
  // const sources = {}; // Object to store the sources and their respective favicons

  for (let storyIndex = 0; storyIndex < storyArray.length; storyIndex++) {
    const story = storyArray[storyIndex];
    const storyArticles = [];

    for (const snippet of story) {
      const article = await crawlArticle(snippet.href);
      article.url = snippet.href;
      article.source = snippet.source; // Store the source in the article object
      article.storyIndex = storyIndex + 1; // Add the story index to the article
      article.pubDate = snippet.pubDate;

      logArticle(article);

      // Exclude sources and check if the title and content are not null
      if (!excludeSources.includes(article.source) && article.title !== null && article.content !== null) {
        // Skip opinion articles
        if (
          article.title.startsWith('Opinion:') ||
          article.title.startsWith('Opinion |') ||
          article.title.startsWith('Editorial:') ||
          article.title.endsWith('| Opinion') ||
          article.title.endsWith('- Opinion')
        ) {
          continue;
        }

        // Store the source and favicon in the sources object
        // if (!sources[article.source]) {
        //   sources[article.source] = {
        //     source: article.source,
        //     favicon: article.favicon,
        //   };
        // }

        storyArticles.push(article);
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

  setTimeout(() => {
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
  console.log(`Published - ${article.pubDate}`);
  console.log('---');
};

const createSummaryConsoleLog = async (articles) => {
  const summaries = [];

  for (const story of articles) {
    const prompt = `Summarize the news coverage in a concise, unbiased bullet point list: Use journalistic AP style (inverted pyramid). Write in bullet points only. Avoid plagiarism by changing wording. Be concise and unbiased. Don't abbreviate words unless previously defined. Clarify names of all mentioned subjects. Include the most important facts in first 3 bullet points. State all facts. Each bullet point should be 140 characters or less. Provide a total of 5 bullet points in response.\n\n`;
    const titlePrompt = `Write a sentence case headline in 10 tokens.
Mention all subjects and facts.
Use the following headline format.
Headline Format:
Uvalde victim's mother perseveres through teaching, connecting with daughter's memory
In Panama, legal rights given to sea turtles, boosting the 'rights of nature' movement
Head of Russian private army Wagner says more than 20,000 of his troops died in Bakhmut battle
Provide the headline without the "Headline:"\n`;

    const storyContent = story.map((article) => `${article.content}`).join('\n\n\n');
    const storyTitleContent = story[0].title;

    const storyPrompt = `${prompt} News Coverage: """${storyContent}"""`;
    const storyTitlePrompt = `${titlePrompt}Headline: ${storyTitleContent}`;

    setTimeout(() => {
      console.log('\n\n\n', storyPrompt, '\n\n\n\n', storyTitlePrompt);
    }, 900);
  }

  return summaries;
};

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
