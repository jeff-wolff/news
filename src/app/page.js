import Image from 'next/image';
import styles from './page.module.css';
import { fetchNews } from './fetch-news';

export default function Home() {
  const newsArticlesPromise = fetchNews();

  const renderNewsArticles = (articles) => {
    // Group articles by storyId
    const articlesByStory = {};
    articles.forEach((article) => {
      if (!articlesByStory.hasOwnProperty(article.storyId)) {
        articlesByStory[article.storyId] = [];
      }
      articlesByStory[article.storyId].push(article);
    });

    return Object.entries(articlesByStory).map(([storyId, articles], index) => (
      <div key={storyId}>
        <h4>Story {index+1}:</h4>
        <div className={styles.stories}>
          {articles.map((article, index) => (
            <div key={index}>
              <p>
                {article.image ? (
                   <a href={article.url} target="_blank" rel="noopener noreferrer">
                      <img src={article.image} alt={``} width={'100%'} height={'auto'} loading="lazy" className={styles.image} />
                   </a>
                ) : (
                  ''
                )}
              </p>
              <h2>
                <a href={article.url} target="_blank" rel="noopener noreferrer">
                  {article.title}
                </a>
              </h2>
              <p>
                {article.favicon ? (
                  <img src={article.favicon} alt={`${article.source} favicon`} width={16} height={16} loading="lazy" />
                ) : (
                  ''
                )}
                &nbsp;{article.source} {article.bias ? `- ${article.bias}` : '' }
              </p>
              {article.content && <p style={{'maxHeight': '300px', 'marginBottom': '30px','overflow': 'scroll'}}>{article.content}</p>}
            </div>
          ))}
        </div>
      </div>
    ));
  };

  return (
    <main className={styles.main}>
      <Image src="/next.svg" alt="News App Logo" className={styles.logo} width={100} height={24} priority />
      <h1>News App</h1>

      <h1>Fetch Top News Stories from Google News, Then Crawl Individual Articles</h1>

      <div>
        {newsArticlesPromise.then(renderNewsArticles)}
      </div>
    </main>
  );
}
