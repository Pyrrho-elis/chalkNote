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
            return processRichText(block.paragraph.rich_text, "p", "mb-6 leading-relaxed text-gray-700");
            
        case "heading_1":
            return processRichText(block.heading_1.rich_text, "h1", "text-3xl font-bold mb-6 mt-8 text-gray-900 border-b border-gray-200 pb-2");
            
        case "heading_2":
            return processRichText(block.heading_2.rich_text, "h2", "text-2xl font-semibold mb-4 mt-6 text-gray-900");
            
        case "heading_3":
            return processRichText(block.heading_3.rich_text, "h3", "text-xl font-medium mb-3 mt-5 text-gray-900");
            
        case "bulleted_list_item":
            return processRichText(block.bulleted_list_item.rich_text, "li", "mb-2 ml-4");
            
        case "numbered_list_item":
            return processRichText(block.numbered_list_item.rich_text, "li", "mb-2 ml-4");
            
        case "quote":
            return processRichText(block.quote.rich_text, "blockquote", "border-l-4 border-blue-500 pl-6 italic text-gray-600 mb-6 bg-blue-50 py-4 rounded-r-lg");
            
        case "code":
            const codeContent = block.code.rich_text.map(text => text.plain_text).join("");
            const language = block.code.language || 'text';
            return `<pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-6 text-sm"><code class="language-${language}">${escapeHtml(codeContent)}</code></pre>`;
            
        case "image":
            return processImage(block.image);
            
        case "divider":
            return '<hr class="my-8 border-gray-200" />';
            
        case "callout":
            return processCallout(block.callout);
            
        case "toggle":
            return processToggle(block.toggle);
            
        case "table_of_contents":
            return '<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"><p class="text-blue-800 font-medium">📋 Table of Contents</p><p class="text-blue-600 text-sm">(Generated automatically)</p></div>';
            
        case "bookmark":
            return processBookmark(block.bookmark);
            
        case "equation":
            return `<div class="bg-gray-50 p-4 rounded-lg mb-6 text-center border border-gray-200"><p class="text-gray-600 mb-2">📐 Mathematical equation</p><p class="font-mono text-sm bg-white p-2 rounded border">${block.equation.expression}</p></div>`;
            
        default:
            // For unsupported blocks, try to extract plain text
            if (block[block.type]?.rich_text) {
                return processRichText(block[block.type].rich_text, "p", "mb-4 text-gray-500 italic");
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
    
    // Get image size from Notion properties
    let sizeClass = "w-full"; // Default full width
    let maxWidthClass = "max-w-full";
    
    // Check if image has size information
    if (image.width && image.height) {
        // Calculate aspect ratio and apply appropriate sizing
        const aspectRatio = image.width / image.height;
        
        if (aspectRatio > 2) {
            // Wide images
            sizeClass = "w-full";
            maxWidthClass = "max-w-4xl";
        } else if (aspectRatio < 0.5) {
            // Tall images
            sizeClass = "w-full";
            maxWidthClass = "max-w-2xl";
        } else {
            // Square-ish images
            sizeClass = "w-full";
            maxWidthClass = "max-w-3xl";
        }
    }
    
    // Check for Notion's size property (if available)
    if (image.size) {
        switch (image.size) {
            case 'small':
                maxWidthClass = "max-w-md";
                break;
            case 'medium':
                maxWidthClass = "max-w-2xl";
                break;
            case 'large':
                maxWidthClass = "max-w-4xl";
                break;
            default:
                maxWidthClass = "max-w-full";
        }
    }
    
    const responsiveClasses = `${sizeClass} ${maxWidthClass} h-auto rounded-lg shadow-sm`;
    
    return `
        <figure class="my-6 text-center">
            <img 
                src="${imageUrl}" 
                alt="${escapeHtml(altText)}" 
                class="${responsiveClasses}"
                loading="lazy"
            />
            ${caption ? `<figcaption class="text-center text-gray-500 mt-3 text-sm italic">${escapeHtml(caption)}</figcaption>` : ''}
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
        <div class="${colorClass} border-l-4 p-4 my-6 rounded-r-lg shadow-sm">
            <div class="flex items-start">
                <span class="mr-3 text-xl flex-shrink-0">${icon}</span>
                <div class="flex-1 leading-relaxed">${content}</div>
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
        <div class="my-6">
            <a href="${url}" target="_blank" rel="noopener noreferrer" class="block border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-md transition-all duration-200">
                <div class="flex items-center">
                    <div class="flex-1 min-w-0">
                        <p class="font-medium text-gray-900 truncate">${escapeHtml(title)}</p>
                        <p class="text-sm text-gray-500 truncate">${url}</p>
                    </div>
                    <svg class="w-5 h-5 text-gray-400 ml-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <details class="my-4">
            <summary class="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                ${content}
            </summary>
            <div class="mt-2 pl-4 border-l-2 border-gray-200">
                <!-- Toggle content would go here if Notion API provided it -->
                <p class="text-gray-600 text-sm">Toggle content not available in current API</p>
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
        if (text.annotations.bold) result = `<strong>${result}</strong>`;
        if (text.annotations.italic) result = `<em>${result}</em>`;
        if (text.annotations.strikethrough) result = `<del>${result}</del>`;
        if (text.annotations.code) result = `<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">${result}</code>`;
        
        // Apply links
        if (text.href) result = `<a href="${text.href}" class="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">${result}</a>`;
        
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
