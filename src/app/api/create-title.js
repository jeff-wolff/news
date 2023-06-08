import { OpenAIApi, Configuration } from 'openai';

const OPENAI_API_KEY = process.env.OPEN_AI_API_KEY;

// Configure the OpenAI package with your API key
const configuration = new Configuration({
  apiKey: OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export const createTitle = async (articles) => {
  const titles = [];

  for (const story of articles) {
    const titlePrompt = `\nCreate a short, concise, unbiased, catchy, elusive headline. Write in the style of AP News. Don't use all the facts.\n\n`;  
    const storyTitleContent = story.map((article) => `${article.title}`).join('\n'); // TODO: get headlines.
    const storyTitlePrompt = `${titlePrompt} News Summary: """${storyTitleContent}"""`;

    try {
      // Make a request to the OpenAI API for title generation
      const response = await openai.createCompletion({
        model: 'text-davinci-003', // Choose the language model engine
        prompt: storyTitlePrompt,
        max_tokens: 10, // Define the maximum number of tokens in the generated title
        temperature: 0.5, // Adjust the temperature to control the randomness of the output
        n: 1, // Generate 1 title
        stop: '', // Set the stop sequence to terminate the title
      });

      
      if (response.choices && response.choices.length > 0) {
        const generatedTitles = response.choices.map((choice) => choice.text.trim());
        titles.push({ storyIndex: story[0].storyIndex, title: generatedTitles });
      }
      
    } catch (error) {
      console.error('Error generating title:', error);
    }
  }
  
  return titles;
};

