const { notion, dbId } = require("./notion")
const { slugify } = require("../utils")

const getPostBySlug = async (slug) => {
    try {
        const response = await notion.databases.query({
            database_id: dbId,
            filter: {
                property: "Published",
                checkbox: {
                    equals: true,
                },
            },
        })

        if (response.results.length === 0) {
            throw new Error("No posts found")
        }

        for (const page of response.results) {
            const titleProperty = page.properties["Name"]
            const title = titleProperty?.title?.[0]?.plain_text
            const pageSlug = slugify(title)

            if (pageSlug === slug) {
                const response = await notion.blocks.children.list({
                    block_id: page.id,
                })

                let content = []
                for (const block of response.results) {
                    content.push(convertBlockToStructuredJSON(block))
                }

                return {
                    title,
                    slug: pageSlug,
                    blocks: content,
                    notionPageId: page.id,
                }
            }
        }

        throw new Error(`No post found with slug "${slug}"`)
    } catch (error) {
        console.error(error)
        throw new Error(`Error fetching posts from Notion: ${error.message}`)
    }
}

function convertBlockToStructuredJSON(block) {
    const base = { type: block.type };

    switch (block.type) {
        case "paragraph":
            return {
                ...base,
                text: extractPlainText(block.paragraph.rich_text),
                richText: block.paragraph.rich_text,
            };

        case "heading_1":
        case "heading_2":
        case "heading_3":
            return {
                ...base,
                text: extractPlainText(block[block.type].rich_text),
                richText: block[block.type].rich_text,
            };

        case "bulleted_list_item":
        case "numbered_list_item":
            return {
                ...base,
                text: extractPlainText(block[block.type].rich_text),
                richText: block[block.type].rich_text,
            };

        case "image": {
            const image = block.image;
            const url = image.type === "external" ? image.external.url : image.file.url;
            const caption = extractPlainText(image.caption);
            return {
                ...base,
                imageUrl: url,
                caption,
                alt: caption || "Blog image from Notion",
            };
        }

        case "quote":
            return {
                ...base,
                text: extractPlainText(block.quote.rich_text),
                richText: block.quote.rich_text,
            };

        case "code":
            return {
                ...base,
                code: extractPlainText(block.code.rich_text),
                language: block.code.language || "text",
            };

        case "divider":
            return { ...base };

        default:
            return {
                ...base,
                unsupported: true,
            };
    }
}

function extractPlainText(richText = []) {
    return richText.map(t => t.plain_text).join("");
}


/**
 * Process individual Notion blocks and convert to HTML
 * @param {Object} block - Notion block object
 * @returns {string} HTML string
 */
function processBlock(block) {
    switch (block.type) {
        case "paragraph":
            return processRichText(block.paragraph.rich_text, "p", "mb-6 leading-relaxed text-slate-700 text-base")

        case "heading_1":
            return processRichText(
                block.heading_1.rich_text,
                "h1",
                "text-4xl font-extrabold mb-8 mt-12 text-slate-900 border-b border-slate-200 pb-6",
            )

        case "heading_2":
            return processRichText(block.heading_2.rich_text, "h2", "text-3xl font-bold mb-6 mt-10 text-slate-900")

        case "heading_3":
            return processRichText(block.heading_3.rich_text, "h3", "text-2xl font-semibold mb-4 mt-8 text-slate-900")

        case "bulleted_list_item":
            return processRichText(
                block.bulleted_list_item.rich_text,
                "li",
                "mb-2 ml-6 leading-relaxed text-slate-700 list-disc",
            )

        case "numbered_list_item":
            return processRichText(
                block.numbered_list_item.rich_text,
                "li",
                "mb-2 ml-6 leading-relaxed text-slate-700 list-decimal",
            )

        case "quote":
            return processRichText(
                block.quote.rich_text,
                "blockquote",
                "border-l-4 border-indigo-400 pl-6 italic text-slate-600 mb-8 bg-slate-50 py-6 rounded-r-xl text-lg leading-relaxed font-medium",
            )

        case "code":
            const codeContent = block.code.rich_text.map((text) => text.plain_text).join("")
            const language = block.code.language || "text"
            return `<pre class="bg-slate-900 text-slate-100 p-6 rounded-xl overflow-x-auto mb-8 text-sm leading-6 shadow-xl border border-slate-800"><code class="language-${language}">${escapeHtml(codeContent)}</code></pre>`

        case "image":
            return processImage(block.image)

        case "divider":
            return '<hr class="my-12 border-slate-200" />'

        case "callout":
            return processCallout(block.callout)

        case "toggle":
            return processToggle(block.toggle)

        case "table_of_contents":
            return '<div class="bg-indigo-50 border border-indigo-200 rounded-xl p-6 mb-8 shadow-sm"><p class="text-indigo-900 font-semibold text-lg">📋 Table of Contents</p><p class="text-indigo-600 text-sm mt-1">(Generated automatically)</p></div>'

        case "bookmark":
            return processBookmark(block.bookmark)

        case "equation":
            return `<div class="bg-slate-50 p-6 rounded-xl mb-8 text-center border border-slate-200 shadow-sm"><p class="text-slate-600 mb-3 font-semibold">📐 Mathematical equation</p><p class="font-mono text-sm bg-white p-4 rounded-lg border shadow-sm">${block.equation.expression}</p></div>`

        default:
            // For unsupported blocks, try to extract plain text
            if (block[block.type]?.rich_text) {
                return processRichText(block[block.type].rich_text, "p", "mb-6 text-slate-500 italic text-base")
            }
            return ""
    }
}

/**
 * Process image block with size, alignment, and alt text
 * @param {Object} image - Notion image block
 * @returns {string} HTML string
 */
function processImage(image) {
    const imageUrl = image.type === "external" ? image.external.url : image.file.url;
    const caption = image.caption?.map((text) => text.plain_text).join("") || "";
    const altText = caption || "Blog image from Notion";

    // Strict size constraints for blog layout
    const containerClasses = "max-w-[400px] mx-auto px-4 my-4";
    const figureClasses = "relative w-full max-w-[300px] sm:max-w-[400px] h-[300px]";

    // Log image URL for debugging
    console.log("Image URL:", imageUrl);

    return `
    <div className="${containerClasses}">
        <figure className="${figureClasses}">
            <Image 
                src="${imageUrl}" 
                alt="${escapeHtml(altText)}" 
                fill
                className="rounded-xl object-contain"
                sizes="(max-width: 640px) 300px, 400px"
                priority={false}
            />
            ${caption ? `<figcaption className="text-slate-600 mt-2 text-sm text-center font-medium italic">${escapeHtml(caption)}</figcaption>` : ""}
        </figure>
    </div>
    `.trim();
}


/**
 * Process callout block
 * @param {Object} callout - Notion callout block
 * @returns {string} HTML string
 */
function processCallout(callout) {
    const content = processRichText(callout.rich_text, "div", "")
    const icon = callout.icon?.emoji || "💡"
    const bgColor = callout.color || "blue"

    const colorClasses = {
        blue: "bg-blue-50 border-blue-200 text-blue-900",
        gray: "bg-slate-50 border-slate-200 text-slate-900",
        yellow: "bg-amber-50 border-amber-200 text-amber-900",
        red: "bg-red-50 border-red-200 text-red-900",
        green: "bg-emerald-50 border-emerald-200 text-emerald-900",
        purple: "bg-purple-50 border-purple-200 text-purple-900",
        pink: "bg-pink-50 border-pink-200 text-pink-900",
    }

    const colorClass = colorClasses[bgColor] || colorClasses.blue

    return `
        <div class="${colorClass} border-l-4 p-6 my-8 rounded-r-xl shadow-sm">
            <div class="flex items-start">
                <span class="mr-4 text-2xl flex-shrink-0">${icon}</span>
                <div class="flex-1 leading-relaxed text-base font-medium">${content}</div>
            </div>
        </div>
    `.trim()
}

/**
 * Process bookmark block
 * @param {Object} bookmark - Notion bookmark block
 * @returns {string} HTML string
 */
function processBookmark(bookmark) {
    const url = bookmark.url
    const title = bookmark.caption?.[0]?.plain_text || "Bookmark"

    return `
        <div class="my-8">
            <a href="${url}" target="_blank" rel="noopener noreferrer" class="block border border-slate-200 rounded-xl p-6 hover:border-slate-300 hover:shadow-lg transition-all duration-300 bg-white hover:bg-slate-50">
                <div class="flex items-center">
                    <div class="flex-1 min-w-0">
                        <p class="font-semibold text-slate-900 truncate text-lg">${escapeHtml(title)}</p>
                        <p class="text-sm text-slate-500 truncate mt-2">${url}</p>
                    </div>
                    <svg class="w-6 h-6 text-slate-400 ml-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                    </svg>
                </div>
            </a>
        </div>
    `.trim()
}

/**
 * Process toggle block
 * @param {Object} toggle - Notion toggle block
 * @returns {string} HTML string
 */
function processToggle(toggle) {
    const content = processRichText(toggle.rich_text, "div", "")
    return `
        <details class="my-6">
            <summary class="cursor-pointer font-semibold text-slate-700 hover:text-slate-900 text-lg leading-relaxed transition-colors duration-200">
                ${content}
            </summary>
            <div class="mt-4 pl-6 border-l-2 border-slate-200">
                <!-- Toggle content would go here if Notion API provided it -->
                <p class="text-slate-600 text-base italic">Toggle content not available in current API</p>
            </div>
        </details>
    `.trim()
}

/**
 * Process rich text and apply formatting
 * @param {Array} richText - Array of rich text objects
 * @param {string} tag - HTML tag to wrap content
 * @param {string} className - CSS classes
 * @returns {string} HTML string
 */
function processRichText(richText, tag, className) {
    if (!richText || richText.length === 0) return ""

    const content = richText
        .map((text) => {
            let result = text.plain_text

            // Apply annotations
            if (text.annotations.bold) result = `<strong class="font-bold">${result}</strong>`
            if (text.annotations.italic) result = `<em class="italic">${result}</em>`
            if (text.annotations.strikethrough) result = `<del class="line-through">${result}</del>`
            if (text.annotations.code)
                result = `<code class="bg-slate-100 px-2 py-1 rounded-md text-sm font-mono text-slate-800 border border-slate-200">${result}</code>`

            // Apply links
            if (text.href)
                result = `<a href="${text.href}" class="text-indigo-600 hover:text-indigo-800 underline font-medium transition-colors duration-200" target="_blank" rel="noopener noreferrer">${result}</a>`

            return result
        })
        .join("")

    return `<${tag} class="${className}">${content}</${tag}>`
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
    }
    return text.replace(/[&<>"']/g, (m) => map[m])
}

module.exports = {
    getPostBySlug,
}
