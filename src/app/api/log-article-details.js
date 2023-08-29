const { customLog } = require('./custom-log');

export const logArticleDetails = async (article) => {
    customLog('---', 'lightGray');
    // customLog(`URL - ${article.url}`, 'lightGray');
    customLog(`Title - ${article.title}`, 'lightGray');
    customLog(`Source - ${article.source}`, 'lightGray');
    customLog(`Bias - ${article.bias}`, 'lightGray');
    customLog(article.content ? `-> ${article.content.substring(0, 280).trim().replace(/[^\w\s]*$/, '')}…` : 'Article content is null.', 'lightGray');
    // customLog(`Image - ${article.image}`, 'lightGray');
    // customLog(`Favicon - ${article.favicon}`, 'lightGray');
    customLog('---', 'lightGray');
};