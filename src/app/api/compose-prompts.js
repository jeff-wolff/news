export const composePrompts = async (story) => {
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
  