import Image from 'next/image';
import styles from './page.module.css';
import { fetchNews } from './fetch-news';

export default function Home() {

  const newsArticlesPromise = fetchNews();
  
  const renderNewsArticles = (articles) => {
    return articles.map((article, index) => (
        <div key={index}>
        <h4>Story {article.storyIndex}</h4>
        <h2><a href={article.url} target="_blank" rel="noopener noreferrer">{article.title}</a></h2>
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

      {newsArticlesPromise.then(renderNewsArticles)}
    </main>
  );
}
