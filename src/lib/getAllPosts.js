const { notion, dbId } = require('./notion');
const { slugify } = require('../utils');


const getAllPosts = async () => {
    const response = await notion.databases.query({
        database_id: dbId,
        filter: {
            property: "Published",
            checkbox: {
                equals: true
            }
        }
    })

    const posts = []
    console.log(response.results.length)
    for (const page of response.results) {
        const titleProperty = page.properties["Name"];
        const title = titleProperty?.title?.[0]?.plain_text;
        const pageSlug = slugify(title);

        console.log(title, pageSlug, page.id)
        posts.push({
            title,
            slug: pageSlug,
            notionPageId: page.id,
        })
    }
    return posts
}

module.exports = {
    getAllPosts
}