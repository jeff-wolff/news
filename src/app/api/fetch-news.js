import { crawlArticle } from './crawl-article';
import { fetchStories } from './fetch-stories';

const createSummary = async (articles) => {
  const summaries = [];

  for (const story of articles) {
    const prompt = `Create a bullet abstractive summary based on this news coverage.\n
    Make sure the third bullet main point has the most important information in this story.\n
    Write in a concise style, but don't abbreviate or leave out too much detail.\n
    Cover the entire story based on the articles, and be as unbiased as possible.\n
    Make sure you include the end of the story.\n
    Capture the essential information without excessive copying.\n
    Use abstractive summarization techniques.\n\n
    DO NOT EXCEED 1 SENTENCE AND 25 WORDS PER BULLET POINT!\n
    WRITE IN THE STYLE OF ASSOCIATED PRESS\n\n`;
      
    const storyContent = story.map((article) => `${article.title}\n\n${article.content}`).join('\n\n\n');

    const storyPrompt = `${prompt}${storyContent}`;

    setTimeout(() => {
      console.log('\n\n\n\n', storyPrompt);
    }, 900);
    
    // TODO: Import OpenAI get OpenAI API key for summary generation
    // try {
    //   // Make a request to OpenAI API for summary generation
    //   const response = await openai.complete({
    //     engine: 'text-davinci-003', // Choose the language model engine
    //     prompt: storyPrompt,
    //     maxTokens: 100, // Define the maximum number of tokens in the generated summary
    //     temperature: 0.5, // Adjust the temperature to control the randomness of the output
    //     n: 6, // Limit the number of bullet points to 6
    //     stop: ['\n'], // Set the stop sequence to terminate each bullet point
    //   });

    //   if (response.choices && response.choices.length > 0) {
    //     const bulletPoints = response.choices[0].text.trim().split('\n');
    //     summaries.push({ storyIndex: story[0].storyIndex, bullets: bulletPoints });
    //   }
    // } catch (error) {
    //   console.error('Error generating summary:', error);
    // }
  }

  return summaries;
};

export const fetchNews = async () => {
  try {
    const startTime = new Date(); // Record the start time

    const storyArray = await fetchStories();
    const articles = [];

    for (let storyIndex = 0; storyIndex < storyArray.length; storyIndex++) {
      const story = storyArray[storyIndex];
      const storyArticles = [];

      for (const snippet of story) {
        const article = await crawlArticle(snippet.href);
        article.source = snippet.source; // Store the source in the article object
        article.storyIndex = storyIndex + 1; // Add the story index to the article
        storyArticles.push(article);
      }

      articles.push(storyArticles);
    }

    const summaries = await createSummary(articles);

    const combinedSummaries = {}; // Object to store combined summaries for each storyIndex

    for (const summary of summaries) {
      const { storyIndex, bullets } = summary;
      const existingSummary = combinedSummaries[storyIndex] || [];
      combinedSummaries[storyIndex] = existingSummary.concat(bullets);
    }

    // Print the combined summaries for each storyIndex
    for (const storyIndex in combinedSummaries) {
      console.log(`Story Index: ${storyIndex}`);
      console.log(`Bullets: ${combinedSummaries[storyIndex].join('\n')}`);
      console.log('---');
    }

    const flattenedArticles = articles.flat(); // Flatten the nested array

    const endTime = new Date(); // Record the end time
    const elapsedTime = endTime - startTime; // Calculate the elapsed time in milliseconds

    const elapsedSeconds = elapsedTime / 1000; // Convert to seconds
    const elapsedSecondsFixed = elapsedSeconds.toFixed(1); // Round to 1 decimal place

    setTimeout(() => {
      console.log('\n\nElapsed Time:', elapsedSecondsFixed, 'seconds');
    }, 1000);

    return flattenedArticles;
  } catch (error) {
    console.error('Error:', error);
    return []; // Return an empty array in case of error
  }
};
