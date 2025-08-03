const { notion, dbId } = require('./notion');
const { slugify } = require('../utils');

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
        if (response.results.length === 0) {
            throw new Error("No posts found");
        }

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
                            content += `<p class="mb-4">${textHTML}</p>`
                            break;
                        case "heading_1":
                            const headingHTML = block.heading_1.rich_text.map(text => text.plain_text).join("");
                            content += `<h1 class="text-2xl font-bold mb-4">${headingHTML}</h1>`
                            break;
                        case "heading_2":
                            const heading2HTML = block.heading_2.rich_text.map(text => text.plain_text).join("");
                            content += `<h2 class="text-xl font-bold mb-4">${heading2HTML}</h2>`
                            break;
                        case "heading_3":
                            const heading3HTML = block.heading_3.rich_text.map(text => text.plain_text).join("");
                            content += `<h3 class="text-lg font-bold mb-4">${heading3HTML}</h3>`
                            break;
                    }
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
