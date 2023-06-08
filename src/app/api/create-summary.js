import { OpenAIApi, Configuration } from 'openai';

const OPENAI_API_KEY = process.env.OPEN_AI_API_KEY;

// Configure the OpenAI package with your API key
const configuration = new Configuration({
  apiKey: OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export const createSummary = async (articles) => {
    const summaries = [];
  
    for (const story of articles) {
      const prompt = `\n`;
  
      const storyContent = story.map((article) => `${article.content}`).join('\n\n\n');
  
      const storyPrompt = `${prompt}News Coverage: """${storyContent}"""`;
  
      try {
        // Make a request to the OpenAI API for summary generation
        const response = await openai.createCompletion({
          model: 'text-davinci-003', // Choose the language model engine
          prompt: storyPrompt,
          max_tokens: 35, // Define the maximum number of tokens in the generated summary
          temperature: 0.5, // Adjust the temperature to control the randomness of the output
          n: 5, // Generate 5 bullet points
          stop: '\n', // Set the stop sequence to terminate each bullet point
        });
  
        console.log(response.data.choices);
  
        if (response.data.choices && response.data.choices.length > 0) {
          const bulletPoints = response.data.choices.map((choice) => choice.text.trim());
          summaries.push({ storyIndex: story[0].storyIndex, bullets: bulletPoints });
        }
      } catch (error) {
        console.error('Error generating summary:', error);
      }
    }
    
    return summaries;
};