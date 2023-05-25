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
    const excludeSources = ['New York Post','The Daily Beast','The Daily Mail','Slate']; // Optional

    for (let storyIndex = 0; storyIndex < storyArray.length; storyIndex++) {
      const story = storyArray[storyIndex];
      const storyArticles = [];

      for (const snippet of story) {
        const article = await crawlArticle(snippet.href);
        article.source = snippet.source; // Store the source in the article object
        article.storyIndex = storyIndex + 1; // Add the story index to the article
        console.log('---');
        console.log(`Story ${article.storyIndex}:`);
        console.log(`Title - ${article.title}`);
        console.log(`Source - ${article.source}`)
        console.log(article.content ? `-> ${article.content.substring(0, 280).trim().replace(/[^\w\s]*$/, '')}…` : 'Article content is null.');
        console.log('---');
        // console.log(article)
        // Exclude sources and check if the title and content are not null
        if (!excludeSources.includes(article.source) && article.title !== null && article.content !== null) {
          // Skip opinion articles 
          if (article.title.startsWith('Opinion:') || article.title.startsWith('Opinion |') || article.title.endsWith('| Opinion')) {
            continue;
          }
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


    const endTime = new Date(); // Record the end time
    const elapsedTime = endTime - startTime; // Calculate the elapsed time in milliseconds

    const elapsedSeconds = elapsedTime / 1000; // Convert to seconds
    const elapsedSecondsFixed = elapsedSeconds.toFixed(1); // Round to 1 decimal place

    setTimeout(() => {
      console.log('\n\nElapsed Time:', elapsedSecondsFixed, 'seconds');
    }, 1000);
    // console.log(articles);
    return flattenedArticles;
  } catch (error) {
    console.error('Error:', error);
    return []; // Return an empty array in case of error
  }
};


const createSummary = async (articles) => {
  const summaries = [];

  for (const story of articles) {
    const prompt = `Write a bullet point list summary of the following news coverage. News coverage is gathered from various sources.

    Writing Format & Style:
    Write in a journalistic AP style (inverted pyramid).
    Write in bullet points ONLY.
    Change wording to not plagiarize from the news coverage.
    Be concise and unbiased. 
    Don't abbreviate words unless you've already stated what it means.
    Clarify the names of all subjects mentioned.
    Mention all the most important facts.
    Include the most important facts in the first 5 bullet points.
    140 characters or less per bullet point.
    In total, write 5 bullet points.

    Respond only with the bullet point list.
    \n`;

const titlePrompt = `Write a 10 token news headline based off the provided news headlines and headline format. Using mostly lowercase words. Capitalize pronouns. Capitalize first word. Name important subjects.\n\n
Headline Format: "Uvalde victim's mother perseveres through teaching, connecting with daughter's memory", "In Panama, legal rights given to sea turtles, boosting the 'rights of nature' movement", "Head of Russian private army Wagner says more than 20,000 of his troops died in Bakhmut battle"
    \n\n`;  
    
    const storyContent = story.map((article) => `${article.content}`).join('\n\n\n'); 
    const storyTitleContent = story.map((article) => `${article.title}`).join('\n'); 

    const storyPrompt = `${prompt} News Coverage: """${storyContent}"""\n\n\n\n`;
    const storyTitlePrompt = `${titlePrompt} Headlines: """${storyTitleContent}"""`;

    setTimeout(() => {
      console.log('\n\n\n\n', storyPrompt, '\n\n', storyTitlePrompt);
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

