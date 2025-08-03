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
                    content += processBlock(block);
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

/**
 * Process individual Notion blocks and convert to HTML
 * @param {Object} block - Notion block object
 * @returns {string} HTML string
 */
function processBlock(block) {
    switch (block.type) {
        case "paragraph":
            return processRichText(block.paragraph.rich_text, "p", "mb-6 leading-7 text-gray-700 text-lg");
            
        case "heading_1":
            return processRichText(block.heading_1.rich_text, "h1", "text-4xl font-bold mb-8 mt-12 text-gray-900 border-b-2 border-gray-200 pb-4");
            
        case "heading_2":
            return processRichText(block.heading_2.rich_text, "h2", "text-3xl font-semibold mb-6 mt-10 text-gray-900");
            
        case "heading_3":
            return processRichText(block.heading_3.rich_text, "h3", "text-2xl font-medium mb-4 mt-8 text-gray-900");
            
        case "bulleted_list_item":
            return processRichText(block.bulleted_list_item.rich_text, "li", "mb-3 ml-6 leading-7 text-gray-700");
            
        case "numbered_list_item":
            return processRichText(block.numbered_list_item.rich_text, "li", "mb-3 ml-6 leading-7 text-gray-700");
            
        case "quote":
            return processRichText(block.quote.rich_text, "blockquote", "border-l-4 border-blue-500 pl-8 italic text-gray-600 mb-8 bg-blue-50 py-6 rounded-r-lg text-lg leading-7");
            
        case "code":
            const codeContent = block.code.rich_text.map(text => text.plain_text).join("");
            const language = block.code.language || 'text';
            return `<pre class="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto mb-8 text-sm leading-6 shadow-lg"><code class="language-${language}">${escapeHtml(codeContent)}</code></pre>`;
            
        case "image":
            return processImage(block.image);
            
        case "divider":
            return '<hr class="my-12 border-gray-300" />';
            
        case "callout":
            return processCallout(block.callout);
            
        case "toggle":
            return processToggle(block.toggle);
            
        case "table_of_contents":
            return '<div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 shadow-sm"><p class="text-blue-800 font-medium text-lg">📋 Table of Contents</p><p class="text-blue-600 text-sm mt-1">(Generated automatically)</p></div>';
            
        case "bookmark":
            return processBookmark(block.bookmark);
            
        case "equation":
            return `<div class="bg-gray-50 p-6 rounded-lg mb-8 text-center border border-gray-200 shadow-sm"><p class="text-gray-600 mb-3 font-medium">📐 Mathematical equation</p><p class="font-mono text-sm bg-white p-4 rounded border shadow-sm">${block.equation.expression}</p></div>`;
            
        default:
            // For unsupported blocks, try to extract plain text
            if (block[block.type]?.rich_text) {
                return processRichText(block[block.type].rich_text, "p", "mb-6 text-gray-500 italic text-lg");
            }
            return "";
    }
}

/**
 * Process image block with size, alignment, and alt text
 * @param {Object} image - Notion image block
 * @returns {string} HTML string
 */
function processImage(image) {
    const imageUrl = image.type === 'external' ? image.external.url : image.file.url;
    const caption = image.caption?.map(text => text.plain_text).join("") || "";
    const altText = caption || "Image";
    
    // Check for Notion's size property in the block itself
    let maxWidthClass = "max-w-full";
    let alignmentClass = "text-center";
    
    // Try to get size from block properties (Notion API structure)
    if (image.size) {
        switch (image.size) {
            case 'small':
                maxWidthClass = "max-w-sm";
                break;
            case 'medium':
                maxWidthClass = "max-w-lg";
                break;
            case 'large':
                maxWidthClass = "max-w-2xl";
                break;
            default:
                maxWidthClass = "max-w-full";
        }
    }
    
    // Check for alignment in block properties
    if (image.alignment) {
        switch (image.alignment) {
            case 'left':
                alignmentClass = "text-left";
                break;
            case 'center':
                alignmentClass = "text-center";
                break;
            case 'right':
                alignmentClass = "text-right";
                break;
            default:
                alignmentClass = "text-center";
        }
    }
    
    const responsiveClasses = `w-full ${maxWidthClass} h-auto rounded-lg shadow-sm`;
    
    return `
        <figure class="my-8 ${alignmentClass}">
            <img 
                src="${imageUrl}" 
                alt="${escapeHtml(altText)}" 
                class="${responsiveClasses}"
                loading="lazy"
            />
            ${caption ? `<figcaption class="text-gray-500 mt-3 text-sm italic">${escapeHtml(caption)}</figcaption>` : ''}
        </figure>
    `.trim();
}

/**
 * Process callout block
 * @param {Object} callout - Notion callout block
 * @returns {string} HTML string
 */
function processCallout(callout) {
    const content = processRichText(callout.rich_text, "div", "");
    const icon = callout.icon?.emoji || "💡";
    const bgColor = callout.color || "blue";
    
    const colorClasses = {
        blue: "bg-blue-50 border-blue-200 text-blue-800",
        gray: "bg-gray-50 border-gray-200 text-gray-800",
        yellow: "bg-yellow-50 border-yellow-200 text-yellow-800",
        red: "bg-red-50 border-red-200 text-red-800",
        green: "bg-green-50 border-green-200 text-green-800",
        purple: "bg-purple-50 border-purple-200 text-purple-800",
        pink: "bg-pink-50 border-pink-200 text-pink-800"
    };
    
    const colorClass = colorClasses[bgColor] || colorClasses.blue;
    
    return `
        <div class="${colorClass} border-l-4 p-6 my-8 rounded-r-lg shadow-sm">
            <div class="flex items-start">
                <span class="mr-4 text-2xl flex-shrink-0">${icon}</span>
                <div class="flex-1 leading-7 text-lg">${content}</div>
            </div>
        </div>
    `.trim();
}

/**
 * Process bookmark block
 * @param {Object} bookmark - Notion bookmark block
 * @returns {string} HTML string
 */
function processBookmark(bookmark) {
    const url = bookmark.url;
    const title = bookmark.caption?.[0]?.plain_text || "Bookmark";
    
    return `
        <div class="my-8">
            <a href="${url}" target="_blank" rel="noopener noreferrer" class="block border border-gray-200 rounded-lg p-6 hover:border-gray-300 hover:shadow-lg transition-all duration-200 bg-white">
                <div class="flex items-center">
                    <div class="flex-1 min-w-0">
                        <p class="font-semibold text-gray-900 truncate text-lg">${escapeHtml(title)}</p>
                        <p class="text-sm text-gray-500 truncate mt-1">${url}</p>
                    </div>
                    <svg class="w-6 h-6 text-gray-400 ml-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                    </svg>
                </div>
            </a>
        </div>
    `.trim();
}

/**
 * Process toggle block
 * @param {Object} toggle - Notion toggle block
 * @returns {string} HTML string
 */
function processToggle(toggle) {
    const content = processRichText(toggle.rich_text, "div", "");
    return `
        <details class="my-6">
            <summary class="cursor-pointer font-semibold text-gray-700 hover:text-gray-900 text-lg leading-7">
                ${content}
            </summary>
            <div class="mt-4 pl-6 border-l-2 border-gray-200">
                <!-- Toggle content would go here if Notion API provided it -->
                <p class="text-gray-600 text-base italic">Toggle content not available in current API</p>
            </div>
        </details>
    `.trim();
}

/**
 * Process rich text and apply formatting
 * @param {Array} richText - Array of rich text objects
 * @param {string} tag - HTML tag to wrap content
 * @param {string} className - CSS classes
 * @returns {string} HTML string
 */
function processRichText(richText, tag, className) {
    if (!richText || richText.length === 0) return "";
    
    const content = richText.map(text => {
        let result = text.plain_text;
        
        // Apply annotations
        if (text.annotations.bold) result = `<strong class="font-bold">${result}</strong>`;
        if (text.annotations.italic) result = `<em class="italic">${result}</em>`;
        if (text.annotations.strikethrough) result = `<del class="line-through">${result}</del>`;
        if (text.annotations.code) result = `<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">${result}</code>`;
        
        // Apply links
        if (text.href) result = `<a href="${text.href}" class="text-blue-600 hover:text-blue-800 underline font-medium" target="_blank" rel="noopener noreferrer">${result}</a>`;
        
        return result;
    }).join("");
    
    return `<${tag} class="${className}">${content}</${tag}>`;
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

module.exports = {
    getPostBySlug
}
