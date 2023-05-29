import { OpenAIApi, Configuration } from 'openai';

// Set your OpenAI API key
const OPENAI_API_KEY = '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';

// Configure the OpenAI package with your API key
const configuration = new Configuration({
  apiKey: OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export const createTitle = async (articles) => {
  const titles = [];

  for (const story of articles) {
    const titlePrompt = `\nCreate an unbiased headline based on this news summary. Write in the style of AP News. 10 tokens max.\n\n`;  
    const storyTitleContent = story.map((article) => `${article.title}`).join('\n'); // TODO: get the summary content from create-summary in here.
    const storyTitlePrompt = `${titlePrompt} Headlines: """${storyTitleContent}"""`;

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

