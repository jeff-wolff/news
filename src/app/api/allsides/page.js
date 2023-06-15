const puppeteer = require('puppeteer');

export default async function scrapeAllsides() {
  try {
    const url = 'https://www.allsides.com/media-bias/ratings?field_featured_bias_rating_value=All&field_news_source_type_tid%5B%5D=2&field_news_bias_nid_1%5B1%5D=1&field_news_bias_nid_1%5B2%5D=2&field_news_bias_nid_1%5B3%5D=3&title=';

    const browser = await puppeteer.launch({
      defaultArgs: [
        '--enable-features=NetworkService',
        '--disable-extensions',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-site-isolation-trials',
        '--no-zygote',
        '--single-process',
      ],
      headless: 'new',
    });

    const page = await browser.newPage();

    // Set user agent to mimic a regular browser
    // await page.setUserAgent(
    //   'Mozilla/8.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.5672.126 Safari/537.36'
    // );

    // Set viewport size to a typical browser size
    await page.setViewport({ width: 1366, height: 768 });

    // Set navigation timeout to 60 seconds (60000 ms)
    await page.setDefaultNavigationTimeout(60000);

    // Emulate human-like behavior
    await page.goto(url, { waitUntil: 'networkidle0' });

    await page.waitForSelector('.views-table');

    // Scroll to the bottom of the page until no more content is loaded
    let previousHeight = 0;
    while (true) {
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      await page.waitForTimeout(1000); // Adjust the delay as needed

      const currentHeight = await page.evaluate(() => {
        return document.body.scrollHeight;
      });

      if (currentHeight === previousHeight) {
        break;
      }

      previousHeight = currentHeight;
    }

    // Extract the newsSource and biasRating
    const sourcesAndRatings = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.views-table tbody tr'));

      return rows.map((row) => {
        const newsSourceElement = row.querySelector('.views-field-title a');
        const biasRatingElement = row.querySelector('.views-field-field-bias-image img');

        const newsSource = newsSourceElement.textContent;
        const biasRating = biasRatingElement.getAttribute('alt');

        return { newsSource, biasRating };
      });
    });

    await browser.close();

    return JSON.stringify(sourcesAndRatings);
  } catch (error) {
    if (error.message.includes('Navigation timeout')) {
      console.error('Puppeteer Error:', error.message);
    } else {
      console.error('An error occurred:', error);
    }

    return null;
  }
}
