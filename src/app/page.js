import Image from 'next/image';
import styles from './page.module.css';
import { fetchStories } from './api/fetch-stories';
import { fetchNews } from './api/fetch-news';

export default function Home() {

  
  const newsArticlesPromise = fetchNews();
  
  const renderNewsArticles = (articles) => {
    return articles.map((article, index) => (
        <div key={index}>
        {/* <h4>Story {article.storyIndex}</h4> Add the story index */}
        <h2>{article.title} - {article.source}</h2>
        {article.content && <p>{article.content}</p>}
        </div>
    ));
    };
  return (
    <main className={styles.main}>
      <Image src="/next.svg" alt="News App Logo" className={styles.logo} width={100} height={24} priority />
      <h1>News App</h1>

      <h1>Fetch Top 10 Google News USA Headlines, Links, Sources</h1>
      <div className={styles.stories}>
        {fetchStories().then((storyArray) =>
          storyArray.map((story, index) => (
            <div key={index}>
              <h3>Story {index + 1}</h3>
              <ul>
                {story.map((snippet, i) => (
                  <li key={i}>
                    <a href={snippet.href} target="_blank" rel="noopener noreferrer">
                      {snippet.snippet} - {snippet.source}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
      
      {newsArticlesPromise.then(renderNewsArticles)}
    </main>
  );
}
