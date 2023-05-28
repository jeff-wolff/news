import { OpenAIApi, Configuration } from 'openai';

// Set your OpenAI API key
const OPENAI_API_KEY = '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';

// Configure the OpenAI package with your API key
const configuration = new Configuration({
  apiKey: OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export const createSummary = async (articles) => {
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
      
      Respond only with the bullet point list.\n`;
  
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