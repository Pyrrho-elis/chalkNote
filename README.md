# ChalkNotes

Transform your Notion pages into beautiful developer blogs with intelligent framework detection and plugin architecture.

## ✨ Features

- 🚀 **Zero Configuration** - Intelligent detection of Next.js setup, CSS frameworks, and project structure
- 🎨 **Smart Theming** - Multiple themes with automatic CSS framework detection (Tailwind, Styled Components, CSS Modules)
- 🧩 **Plugin Architecture** - Extensible plugin system with inline syntax parsing (`@@PluginName`)
- 📱 **Responsive Design** - Mobile-first approach with dark mode support
- ⚡ **Performance Optimized** - Built-in caching, error boundaries, and retry mechanisms
- 🔧 **TypeScript Support** - Full TypeScript integration with comprehensive type definitions
- 📦 **Framework Agnostic** - Works with both App Router and Pages Router in Next.js

## 🚀 Quick Start

### 1. Installation

```bash
npm install chalknotes
# or
yarn add chalknotes
# or
pnpm add chalknotes
```

### 2. Environment Setup

Create a `.env` file in your project root:

```env
NOTION_TOKEN=secret_...
NOTION_DATABASE_ID=...
```

### 3. Initialize ChalkNotes

```bash
npx chalknotes init
```

This will:
- Detect your Next.js setup (App Router vs Pages Router)
- Identify your CSS framework (Tailwind, Styled Components, etc.)
- Create a `blog.config.js` with intelligent defaults
- Set up environment variables

### 4. Scaffold Your Blog

```bash
npx chalknotes scaffold
```

This generates:
- Blog pages optimized for your framework
- NotionRenderer component with your CSS framework
- Proper TypeScript definitions (if detected)

### 5. Start Blogging

Visit `/blog` in your Next.js app to see your Notion content transformed into a beautiful blog!

## 🔧 Configuration

The `blog.config.js` file provides extensive customization options:

```javascript
module.exports = {
  notionToken: process.env.NOTION_TOKEN,
  notionDatabaseId: process.env.NOTION_DATABASE_ID,
  routeBasePath: '/blog',
  theme: 'modern', // 'modern' | 'minimal' | 'dev'
  plugins: [
    '@chalknotes/syntax-highlighter',
    '@chalknotes/analytics',
    '@chalknotes/seo'
  ],
  caching: {
    enabled: true,
    ttl: 3600
  },
  errorBoundaries: true,
  customization: {
    colors: {
      primary: '#3b82f6',
      accent: '#8b5cf6'
    }
  }
};
```

## 🧩 Plugin System

ChalkNotes features a powerful plugin architecture with inline syntax parsing. Simply add plugin syntax anywhere in your Notion content using the `%%PluginName[params]` format:

### Built-in Plugins

```markdown
%%CommentSection - Add a comment section
%%TableOfContents - Generate table of contents
%%ReadingTime - Show estimated reading time
%%Share[twitter,linkedin] - Add share buttons
%%CodePen[pen-id] - Embed CodePen
%%Tweet[tweet-id] - Embed Twitter tweets
%%YouTube[video-id] - Embed YouTube videos
```

### Custom Plugins

Create custom plugins by registering them in your blog:

```javascript
import { registerPlugin } from 'chalknotes';

registerPlugin({
  name: 'CustomWidget',
  syntax: /%%CustomWidget\[([^\]]+)\]/g,
  render: (match, context) => {
    const config = match[1];
    return `<div class="custom-widget">${config}</div>`;
  }
});
```

## 🎨 Themes

### Modern (Default)
Clean, contemporary design with excellent readability and modern styling.

### Minimal
Simple, focused layout that puts content first with minimal distractions.

### Dev
Developer-focused theme with enhanced code highlighting and terminal-like aesthetics.

## 📚 API Reference

### Core Functions

```typescript
import { getAllPosts, getPostBySlug } from 'chalknotes';

// Get all published posts
const posts = await getAllPosts();

// Get specific post by slug
const post = await getPostBySlug('my-post-slug');
```

### Next.js Helpers

```typescript
// For Pages Router
import { getStaticPropsForPost, getStaticPathsForPosts } from 'chalknotes';

export const getStaticProps = getStaticPropsForPost;
export const getStaticPaths = getStaticPathsForPosts;

// For App Router
import { getPostBySlug } from 'chalknotes';

export default async function BlogPost({ params }) {
  const post = await getPostBySlug(params.slug);
  return <YourBlogComponent post={post} />;
}
```

## 🛠 Advanced Usage

### Custom CSS Framework Integration

ChalkNotes automatically detects your CSS framework and generates appropriate styles:

- **Tailwind CSS**: Uses utility classes with dark mode support
- **Styled Components**: Generates styled-components with theme integration
- **CSS Modules**: Creates modular CSS with scoped styles
- **Plain CSS**: Falls back to inline styles for maximum compatibility

### Error Handling & Caching

Built-in error boundaries and intelligent caching ensure your blog stays online even when the Notion API is unavailable:

```javascript
// Automatic retry with exponential backoff
// Intelligent caching with configurable TTL
// Graceful degradation when API fails
```

### TypeScript Support

Full TypeScript integration with comprehensive type definitions:

```typescript
import type { BlogPost, NotionBlock, ChalkNotesConfig } from 'chalknotes';
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Documentation](https://chalknotes.dev/docs)
- [Examples](https://chalknotes.dev/examples)
- [Plugin Gallery](https://chalknotes.dev/plugins)
- [GitHub](https://github.com/chalknotes/chalknotes)

---

Made with ❤️ for the developer community