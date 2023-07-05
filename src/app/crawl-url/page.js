// import Image from 'next/image';
// import styles from './page.module.css';
import { crawlArticle } from '../api/crawl-article';


export default async function CrawlUrl() {
    const url = 'https://www.youtube.com/watch?v=4u_Z-9Ah2Wc';
    const newsArticle = await crawlArticle(url);

    return (
    <div>
        <a href={url}><img src={newsArticle.image} alt="Article Image" /></a>
        <h1>{newsArticle.title}</h1>
        <p><img src={newsArticle.favicon} width={16} /> {newsArticle.content}</p>
        
    </div>
    );
}
