const { Client } = require('@notionhq/client');
const dotenv = require('dotenv');
dotenv.config();

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const dbId = process.env.NOTION_DATABASE_ID;

console.log(process.env.NOTION_TOKEN)

const getPostBySlug = async (slug) => {
    try {
        const response = await notion.databases.query({
            database_id: dbId,
            filter: {
                property: "Published",
                checkbox: {
                    equals: true
                }
            }
        })

        const slugify = (title) =>
            title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');


        for (const page of response.results) {
            const titleProperty = page.properties["Name"];
            const title = titleProperty?.title?.[0]?.plain_text;
            const pageSlug = slugify(title);

            if (pageSlug === slug) {
                const response = await notion.blocks.children.list({
                    block_id: page.id,
                })
                let content = ""
                for (const block of response.results) {
                    switch (block.type) {
                        case "paragraph":
                            const textHTML = block.paragraph.rich_text.map(text => text.plain_text).join("");
                            content += `<p>${textHTML}</p>`
                            break;
                        case "heading_1":
                            const headingHTML = block.heading_1.rich_text.map(text => text.plain_text).join("");
                            content += `<h1>${headingHTML}</h1>`
                            break;
                        case "heading_2":
                            const heading2HTML = block.heading_2.rich_text.map(text => text.plain_text).join("");
                            content += `<h2>${heading2HTML}</h2>`
                            break;
                        case "heading_3":
                            const heading3HTML = block.heading_3.rich_text.map(text => text.plain_text).join("");
                            content += `<h3>${heading3HTML}</h3>`
                            break;
                    }
                    console.log(content)
                }
                return {
                    title,
                    slug: pageSlug,
                    content: content,
                    notionPageId: page.id,
                };
            }
        }

        throw new Error(`No post found with slug "${slug}"`);
    } catch (error) {
        console.error(error)
        throw new Error(`Error fetching posts from Notion: ${error.message}`);
    }
}

getPostBySlug("blog-posts")

module.exports = {
    getPostBySlug
}
// const slugify = (title) =>
//     title
//         .toLowerCase()
//         .replace(/[^a-z0-9]+/g, "-")
//         .replace(/(^-|-$)/g, "");

// for (const page of response.results) {
//     const titleProperty = page.properties["Name"];
//     const title = titleProperty?.title?.[0]?.plain_text;

//     const pageSlug = slugify(title);

//     if (pageSlug === slug) {
//         // FOUND IT
//         return {
//             title,
//             slug: pageSlug,
//             notionPageId: page.id,
//         };
//     }
// }

// throw new Error(`No post found with slug "${slug}"`);
