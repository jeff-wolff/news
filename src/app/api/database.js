const { createClient, sql } = require('@vercel/postgres');

const client = createClient();

const connect = async () => {
  await client.connect();
};

const disconnect = async () => {
  await client.end();
};

const insertStory = async (story) => {
  const query = sql`
    INSERT INTO stories (id, title, url, dateupdated, datecreated)
    VALUES (${story.id}, ${story.title}, ${story.url}, ${story.dateupdated}, ${story.datecreated})
  `;

  try {
    await client.query(query);
    console.log('Story inserted successfully!');
  } catch (error) {
    console.error('Error inserting story:', error);
  }
};

const insertArticle = async (article) => {
    const query = sql`
        INSERT INTO articles (id, title, url, source, bias, content, image, favicon, storyid)
        VALUES (
        ${article.id},
        ${article.title},
        ${article.url},
        ${article.source},
        ${article.bias},
        ${article.content},
        ${article.image},
        ${article.favicon},
        ${article.storyid}
        )
    `;

    try {
        await client.query(query);
        console.log('Article inserted successfully!');
    } catch (error) {
        console.error('Error inserting article:', error);
    }
};

const insertContent = async (content) => {
    const query = sql`
      INSERT INTO content (id, datecreated, headline, summary, storyid)
      VALUES (
        ${content.id},
        ${content.datecreated},
        ${content.headline},
        ${content.summary},
        ${content.storyid}
      )
    `;
  
    try {
      await client.query(query);
      console.log('Content inserted successfully!');
    } catch (error) {
      console.error('Error inserting content:', error);
    }
};
  
module.exports = {
    connect,
    disconnect,
    insertStory,
    insertArticle,
    insertContent,
};
