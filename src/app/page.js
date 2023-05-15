import Image from 'next/image';
import styles from './page.module.css';
import crawlArticle from './api/crawl-article';


export default function Home() {
  const news = require('gnews');

  const extractUrls = (content) => {
    const regex = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/g;
    const matches = content.matchAll(regex);
    const urls = [];
    for (const match of matches) {
      urls.push(match[2]);
    }
    return urls;
  };

  const main = async () => {
    let storyArray = [];
    console.log('------------------ start ------------------');

    // Retrieve top 10 breaking news stories for USA on Google News (5 articles for each story)
    const heads = await news.headlines({ n: 10 });

    for (const item of heads) {
      const itemSnippets = item.contentSnippet.split('\n');
      const urls = extractUrls(item.content);

      const snippetsArray = itemSnippets
        .filter((snippet) => snippet !== 'View Full Coverage on Google News')
        .map((snippet, index) => {
          const sanitizedSnippet = snippet.replace(/\s{2,}.*$/, '');
          const href = urls[index % urls.length];
          const source = snippet.replace(sanitizedSnippet, '').trim();
          return { snippet: sanitizedSnippet, href, source };
        });

      const stories = [];
      for (let i = 0; i < snippetsArray.length; i += 5) {
        const story = snippetsArray.slice(i, i + 5);
        stories.push(story);
      }

      storyArray.push(...stories);
    }

    console.log(storyArray);

    const fetchNews = async () => {
      try {
        const urls = ['https://abcnews.go.com/US/7-injured-shooting-yuma-arizona-gathering-police/story?id=99313241',
        'https://www.foxnews.com/us/arizona-border-city-sees-7-people-shot-suspect-large-report',
        'https://www.cnn.com/2023/05/14/us/2-dead-5-injured-yuma-arizona-shooting/index.html']; 
        const articles = [];

        for (const url of urls) {
          const article = await crawlArticle(url);
          articles.push(article);
        }
        console.log(articles);
      } catch (error) {
        console.error('Error:', error);
      }
    };
    fetchNews();

    
    
    console.log('------------------ end ------------------');
    return storyArray;
  };

  return (
    <main className={styles.main}>
      <Image
        src="/next.svg"
        alt="News App Logo"
        className={styles.logo}
        width={100}
        height={24}
        priority
      />
      <h1>News App</h1>

      <div>
        {main().then((storyArray) => (
          storyArray.map((story, index) => (
            <div key={index}>
              <h2>Story {index + 1}</h2>
              <ul>
                {story.map((snippet, i) => (
                  <li key={i}>
                    <a href={snippet.href} target="_blank" rel="noopener noreferrer">
                      {snippet.snippet}
                    </a>
                    <span>{snippet.source}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        ))}
      </div>
    </main>
  );
}
