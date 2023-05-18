import { crawlArticle } from './crawl-article';
import { fetchStories } from './fetch-stories';
// import { openai } from 'openai';

// Set your OpenAI API key
const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY';

// Configure the OpenAI package with your API key
// openai.configure({
//   apiKey: OPENAI_API_KEY,
// });

export const fetchNews = async () => {
  try {
    const startTime = new Date(); // Record the start time

    const storyArray = await fetchStories();
    const articles = [];
    const excludeSources = ['New York Post','The Daily Beast','Slate']; // Optional

    for (let storyIndex = 0; storyIndex < storyArray.length; storyIndex++) {
      const story = storyArray[storyIndex];
      const storyArticles = [];

      for (const snippet of story) {
        const article = await crawlArticle(snippet.href);
        article.source = snippet.source; // Store the source in the article object
        console.log(article.source)
        article.storyIndex = storyIndex + 1; // Add the story index to the article
        // console.log(article)
        // Exclude sources
        if (!excludeSources.includes(article.source)) {
          storyArticles.push(article);
        }
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

    // Remove articles with null title or content
    const filteredArticles = flattenedArticles.filter(
      (article) => article.title !== null && article.content !== null
    );
    

    const endTime = new Date(); // Record the end time
    const elapsedTime = endTime - startTime; // Calculate the elapsed time in milliseconds

    const elapsedSeconds = elapsedTime / 1000; // Convert to seconds
    const elapsedSecondsFixed = elapsedSeconds.toFixed(1); // Round to 1 decimal place

    setTimeout(() => {
      console.log('\n\nElapsed Time:', elapsedSecondsFixed, 'seconds');
    }, 1000);
    console.log(articles);
    return flattenedArticles;
  } catch (error) {
    console.error('Error:', error);
    return []; // Return an empty array in case of error
  }
};


const createSummary = async (articles) => {
  const summaries = [];

  for (const story of articles) {
    const prompt = `Create a concise bullet summary of the news stories from various sources.

    Tips:
    Clarify the names of all subjects mentioned.
    Comment on all facts
    Be concise and unbiased.

    Writing Format:
    Write in bullet points ONLY.
    Write in a journalistic AP style (inverted pyramid).
    Start with all the main details and subjects.
    Continue with the most important facts.
    Make sure you include all the facts.
    Finally, tell the rest of the story in the remaining bullets.
    Don't abbreviate words unless you've already stated what it means.
    In total, write 5 bullet points (250 tokens or less).

    Respond only with the bullet point list.
    \n`;
      
    const storyContent = story.map((article) => `${article.title}\n\n${article.content}`).join('\n\n\n');

    const storyPrompt = `${prompt} News Coverage: """${storyContent}"""`;

    setTimeout(() => {
      console.log('\n\n\n\n', storyPrompt);
    }, 900);
    
    // TODO: Import OpenAI get OpenAI API key for summary generation
    // try {
    //   // Make a request to OpenAI API for summary generation
    //   const response = await openai.complete({
    //     engine: 'text-davinci-003', // Choose the language model engine
    //     prompt: storyPrompt,
    //     maxTokens: 250, // Define the maximum number of tokens in the generated summary
    //     temperature: 0, // Adjust the temperature to control the randomness of the output
    //     n: 1, 
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
