import { Plugin, PluginContext } from '../types';

export class PluginParser {
  private plugins: Map<string, Plugin> = new Map();

  registerPlugin(plugin: Plugin): void {
    this.plugins.set(plugin.name, plugin);
  }

  parseContent(content: string, context: PluginContext): string {
    let parsedContent = content;

    // Find all plugin syntax in the content - using {{PluginName[params]}} syntax
    const pluginRegex = /\{\{(\w+)(?:\[([^\]]*)\])?\}\}/g;
    let match;

    while ((match = pluginRegex.exec(content)) !== null) {
      const [fullMatch, pluginName, parameters] = match;
      const plugin = this.plugins.get(pluginName);

      if (plugin) {
        try {
          // Create a match array compatible with plugin.render
          // match[1] should be the parameter (not the plugin name)
          const matchArray = [fullMatch, parameters || ''] as RegExpMatchArray;
          matchArray.index = match.index;
          matchArray.input = content;
          
          // Debug logging
          console.log(`Processing plugin: ${pluginName} with parameters: "${parameters}"`);
          
          const replacement = plugin.render(matchArray, context);
          parsedContent = parsedContent.replace(fullMatch, replacement);
        } catch (error) {
          console.warn(`Plugin ${pluginName} failed to render:`, error);
          // Keep the original syntax if plugin fails
        }
      } else {
        console.warn(`Unknown plugin: ${pluginName}`);
        // Replace with a warning message
        parsedContent = parsedContent.replace(
          fullMatch, 
          `<div class="plugin-warning">⚠️ Unknown plugin: ${pluginName}</div>`
        );
      }
    }

    return parsedContent;
  }

  getAvailablePlugins(): string[] {
    return Array.from(this.plugins.keys());
  }
}

// Built-in plugins
export const builtInPlugins: Plugin[] = [
  {
    name: 'CodePen',
    syntax: /\{\{CodePen\[([^\]]+)\]\}\}/g,
    render: (match, context) => {
      const penId = match[1];
      return `<iframe height="300" style="width: 100%;" scrolling="no" title="CodePen Embed" src="https://codepen.io/embed/${penId}?height=300&theme-id=dark&default-tab=result" frameborder="no" loading="lazy" allowtransparency="true" allowfullscreen="true"></iframe>`;
    }
  },
  
  {
    name: 'Tweet',
    syntax: /\{\{Tweet\[([^\]]+)\]\}\}/g,
    render: (match, context) => {
      const tweetId = match[1];
      return `<div class="tweet-embed" data-tweet-id="${tweetId}">
        <blockquote class="twitter-tweet">
          <a href="https://twitter.com/twitter/status/${tweetId}"></a>
        </blockquote>
      </div>`;
    }
  },

  {
    name: 'YouTube',
    syntax: /\{\{YouTube\[([^\]]+)\]\}\}/g,
    render: (match, context) => {
      const videoId = match[1];
      return `<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; background: #000;"><iframe src="https://www.youtube.com/embed/${videoId}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" frameborder="0" allowfullscreen></iframe></div>`;
    }
  },

  {
    name: 'Gallery',
    syntax: /\{\{Gallery\[([^\]]+)\]\}\}/g,
    render: (match, context) => {
      const folder = match[1];
      // This would need to be implemented based on your image storage solution
      return `<div class="image-gallery" data-folder="${folder}">
        <p>📷 Image Gallery: ${folder}</p>
        <p class="text-sm text-gray-500">Gallery implementation needed based on your image storage solution</p>
      </div>`;
    }
  },

  {
    name: 'CommentSection',
    syntax: /\{\{CommentSection(?:\[([^\]]*)\])?\}\}/g,
    render: (match, context) => {
      const config = match[1] || '';
      return `<div class="comment-section" data-config="${config}">
        <h3>Comments</h3>
        <div id="comments-container">
          <!-- Comments will be loaded here -->
          <p class="text-gray-500">Comments system integration needed</p>
        </div>
      </div>`;
    }
  },

  {
    name: 'TableOfContents',
    syntax: /\{\{TableOfContents(?:\[([^\]]*)\])?\}\}/g,
    render: (match, context) => {
      // Generate TOC from post headings
      const headings = context.post.blocks
        .filter(block => ['heading_1', 'heading_2', 'heading_3'].includes(block.type))
        .map((block, index) => ({
          id: `heading-${index}`,
          text: block.text || '',
          level: parseInt(block.type.split('_')[1])
        }));

      if (headings.length === 0) {
        return '<div class="toc-empty">No headings found for table of contents</div>';
      }

      const tocItems = headings.map(heading => 
        `<li class="toc-level-${heading.level}">
          <a href="#${heading.id}">${heading.text}</a>
        </li>`
      ).join('');

      return `<div class="table-of-contents">
        <h4>Table of Contents</h4>
        <ul class="toc-list">
          ${tocItems}
        </ul>
      </div>`;
    }
  },

  {
    name: 'ReadingTime',
    syntax: /\{\{ReadingTime(?:\[([^\]]*)\])?\}\}/g,
    render: (match, context) => {
      const wordsPerMinute = 200;
      const textContent = context.post.blocks
        .filter(block => block.text)
        .map(block => block.text)
        .join(' ');
      
      const wordCount = textContent.split(/\s+/).length;
      const readingTime = Math.ceil(wordCount / wordsPerMinute);

      return `<div class="reading-time">
        <span class="reading-time-icon">📖</span>
        <span>${readingTime} min read</span>
      </div>`;
    }
  },

  {
    name: 'Share',
    syntax: /\{\{Share(?:\[([^\]]*)\])?\}\}/g,
    render: (match, context) => {
      const platforms = match[1] ? match[1].split(',') : ['twitter', 'linkedin', 'facebook'];
      const title = encodeURIComponent(context.post.title);
      const url = encodeURIComponent(`/blog/${context.post.slug}`);

      const shareButtons = platforms.map(platform => {
        switch (platform.trim()) {
          case 'twitter':
            return `<a href="https://twitter.com/intent/tweet?text=${title}&url=${url}" target="_blank" class="share-button twitter">Twitter</a>`;
          case 'linkedin':
            return `<a href="https://www.linkedin.com/sharing/share-offsite/?url=${url}" target="_blank" class="share-button linkedin">LinkedIn</a>`;
          case 'facebook':
            return `<a href="https://www.facebook.com/sharer/sharer.php?u=${url}" target="_blank" class="share-button facebook">Facebook</a>`;
          default:
            return '';
        }
      }).join('');

      return `<div class="share-section">
        <h4>Share this post</h4>
        <div class="share-buttons">
          ${shareButtons}
        </div>
      </div>`;
    }
  }
];

// Default plugin styles (can be overridden by themes)
export const defaultPluginStyles = `
.plugin-warning {
  background-color: #fef3cd;
  border: 1px solid #fbbf24;
  border-radius: 0.375rem;
  padding: 0.75rem;
  margin: 1rem 0;
  color: #92400e;
  font-size: 0.875rem;
}

.comment-section {
  margin: 2rem 0;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background-color: #f9fafb;
}

.table-of-contents {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin: 1.5rem 0;
}

.toc-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.toc-level-1 {
  font-weight: 600;
  margin: 0.5rem 0;
}

.toc-level-2 {
  margin-left: 1rem;
  margin: 0.25rem 0;
}

.toc-level-3 {
  margin-left: 2rem;
  margin: 0.25rem 0;
  font-size: 0.875rem;
}

.reading-time {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #f3f4f6;
  padding: 0.5rem 1rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  color: #374151;
  margin: 1rem 0;
}

.share-section {
  margin: 2rem 0;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.share-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.share-button {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.875rem;
  transition: background-color 0.2s;
}

.share-button.twitter {
  background-color: #1da1f2;
  color: white;
}

.share-button.linkedin {
  background-color: #0077b5;
  color: white;
}

.share-button.facebook {
  background-color: #1877f2;
  color: white;
}

.share-button:hover {
  opacity: 0.8;
}

.image-gallery {
  margin: 2rem 0;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background-color: #f9fafb;
}

@media (prefers-color-scheme: dark) {
  .comment-section,
  .image-gallery {
    background-color: #1f2937;
    border-color: #374151;
    color: #f9fafb;
  }
  
  .table-of-contents {
    background-color: #1f2937;
    border-color: #374151;
    color: #f9fafb;
  }
  
  .reading-time {
    background-color: #374151;
    color: #f9fafb;
  }
  
  .plugin-warning {
    background-color: #451a03;
    border-color: #d97706;
    color: #fbbf24;
  }
}
`;