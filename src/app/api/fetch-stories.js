import news from 'gnews';

export const fetchStories = async () => {
  const storyMap = {};

  // Retrieve top 10 breaking news stories for USA on Google News (up to 5 articles for each story)
  const heads = await news.headlines({ n: 10 });

  for (const item of heads) {
    const contentSnippet = item.contentSnippet;
    if (!storyMap[contentSnippet]) {
      storyMap[contentSnippet] = [];
    }

    const itemSnippets = contentSnippet.split('\n');
    const urls = extractUrls(item.content);


    const resolvedSnippetsArray = await Promise.all(
      itemSnippets
        .filter((snippet) => snippet !== 'View Full Coverage on Google News')
        .map(async (snippet, index) => {
          const sanitizedSnippet = snippet.replace(/\s{2,}.*$/, '');
          const href = urls[index % urls.length];
          let source = snippet.replace(sanitizedSnippet, '').trim();
          source = source.replace(/View Full Coverage on Google News/g, '').trim();
          const resolvedHref = await resolveLink(href);
          
          // Sanitize the end of the snippet by removing everything after the dash "-"
          const sanitizedSnippetEnd = sanitizedSnippet.split(' - ')[0];
          
          if (sanitizedSnippetEnd === '' || source === '') {
            return null;
          }

          // console.log("\n")
          // console.log(`Title: ${sanitizedSnippetEnd}\nURL: ${resolvedHref}\nSource: ${source}`);
          // console.log("\n")
      

          return { snippet: sanitizedSnippetEnd, href: resolvedHref, source };
        })
      );

    storyMap[contentSnippet].push(
      ...resolvedSnippetsArray.filter((snippet) => snippet !== null)
    );
  }

  const storyArray = Object.values(storyMap);
  // console.log(storyArray);
  return storyArray;
};

const resolveLink = async (googleNewsLink) => {
  try {
    const response = await fetch(googleNewsLink);
    
    if (response.status === 200) {
      // If the request is successful, parse the response body to find the actual URL
      const body = await response.text();
      const regex = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/;
      const match = body.match(regex);

      if (match) {
        const actualUrl = match[2];
        return actualUrl;
      }
    }
    
    // If no actual URL is found or the request fails, return the original Google News link
    return googleNewsLink;

  } catch (error) {
    console.error('Error resolving link: ', error);
    return googleNewsLink;
  }
};

const extractUrls = (content) => {
  const regex = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/g;
  const matches = content.matchAll(regex);
  const urls = [];
  for (const match of matches) {
    urls.push(match[2]);
  }
  return urls;
};