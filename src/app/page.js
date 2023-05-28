import Image from 'next/image';
import styles from './page.module.css';
import { fetchStories } from './api/fetch-stories';
import { fetchNews } from './api/fetch-news';

export default function Home() {

  
  // const newsArticlesPromise = fetchNews();
  
  const renderNewsArticles = (articles) => {
    return articles.map((article, index) => (
        <div key={index}>
        <h4>Story {article.storyIndex}</h4>
        <h2>{article.title}</h2>
        <p>{article.favicon ? <Image src={article.favicon} alt={`${article.source} favicon`} width={16} height={16} /> : '' } 
        &nbsp;{article.source}</p>
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
        {/* {fetchStories().then((storyArray) =>
          storyArray.map((story, index) => (
            <div key={index}>
              <h3>Story {index + 1}</h3>
              <ul>
                {story.map((snippet, i) => (
                  <li key={i}>
                    <a href={snippet.href} target="_blank" rel="noopener noreferrer">                      
                      {snippet.snippet}
                    </a>
                    <p>{snippet.favicon ? <Image src={snippet.favicon} alt={`${snippet.source} favicon`} width={16} height={16} /> : '' } 
                    &nbsp;{snippet.source}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )} */}
      </div>
      
      {/* {newsArticlesPromise.then(renderNewsArticles)} */}
    </main>
  );
}
