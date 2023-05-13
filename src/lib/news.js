import news from 'gnews';

export async function fetchNews() {
  const headlines = await news.headlines({ n: 10 });
  // Process the headlines data as per your requirements
  return headlines;
}
