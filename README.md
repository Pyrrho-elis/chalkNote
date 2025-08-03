# ✏️ ChalkNotes

**Turn your Notion database into a blog with zero config. Works with Next.js Page Router and App Router.**

---

## 🚀 Features

- 📄 Fetch blog posts from Notion
- 🪄 Auto-generate routes for App Router or Page Router
- ⚙️ Helpers for `getStaticProps` / `getStaticPaths`
- 🎨 Clean, responsive themes (light & dark mode)
- 🔧 Interactive configuration setup
- 📁 Customizable route paths
- 🧠 Minimal setup – just run `chalknotes`
- 🖼️ **Rich content support** - Images, code blocks, lists, quotes, and more
- 🔒 **Secure rendering** - React-based component instead of raw HTML

---

## 📦 Installation

```bash
pnpm add chalknotes
# or
npm install chalknotes
```

---

## 🧙‍♂️ Quick Start

1. **Set up environment variables**
   ```bash
   # Create .env file
   NOTION_TOKEN=secret_...
   NOTION_DATABASE_ID=xxxxxxxxxxxxxxxxxxxxxx
   ```

2. **Run the CLI**
   ```bash
   npx chalknotes
   ```

3. **That's it!** ✅
   - Automatically detects if you're using **App Router** or **Page Router**
   - Creates `blog.config.js` with default configuration (if needed)
   - Generates blog routes with clean, responsive templates
   - Supports light and dark themes
   - **Renders rich Notion content** with images, code blocks, and more

---

## 🔧 Configuration

The CLI creates a `blog.config.js` file in your project root. Customize it to match your needs:

```javascript
module.exports = {
  // Notion Configuration
  notionToken: process.env.NOTION_TOKEN,
  notionDatabaseId: process.env.NOTION_DATABASE_ID,
  
  // Blog Configuration
  routeBasePath: '/blog',  // Default: '/blog'
  theme: 'default',        // Options: 'default' (light) or 'dark'
  plugins: [],
};
```

### Configuration Options

- **`routeBasePath`**: Customize your blog route (e.g., `/posts`, `/articles`)
- **`theme`**: Choose between `'default'` (light mode) or `'dark'` (dark mode)
- **`plugins`**: Array for future plugin support

---

## 🎨 Themes

### Default Theme (Light Mode)
- Clean white cards with subtle shadows
- Light gray background
- Dark text for optimal readability
- Responsive design with Tailwind CSS

### Dark Theme
- Dark background with gray cards
- White text with proper contrast
- Inverted typography for dark mode
- Same responsive layout

---

## 📚 Usage in Next.js

### Page Router

Creates:

```js
// pages/blog/[slug].js (or custom route)
import { getStaticPropsForPost, getStaticPathsForPosts, NotionRenderer } from 'chalknotes';

export const getStaticProps = getStaticPropsForPost;
export const getStaticPaths = getStaticPathsForPosts;

export default function BlogPost({ post }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <article className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
            {post.title}
          </h1>
          <NotionRenderer blocks={post.blocks} />
        </article>
      </main>
    </div>
  );
}
```

---

### App Router

Creates:

```jsx
// app/blog/[slug]/page.jsx (or custom route)
import { getPostBySlug, NotionRenderer } from 'chalknotes';

export default async function BlogPost({ params }) {
  const post = await getPostBySlug(params.slug);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <article className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
            {post.title}
          </h1>
          <NotionRenderer blocks={post.blocks} />
        </article>
      </main>
    </div>
  );
}
```

---

## 🧩 API

### `getPostBySlug(slug: string)`
Fetches a post and returns structured data for rendering.

```js
const post = await getPostBySlug('my-post-title');
// Returns: { title, slug, blocks, notionPageId }
```

---

### `getAllPosts()`
Returns all published posts with metadata:

```js
[
  {
    title: "My First Post",
    slug: "my-first-post",
    notionPageId: "xxxxxxxx"
  },
  ...
]
```

---

### `getStaticPropsForPost()`
For use with `getStaticProps` in Page Router.

---

### `getStaticPathsForPosts()`
For use with `getStaticPaths` in Page Router.

---

### `NotionRenderer`
React component for rendering Notion blocks:

```jsx
import { NotionRenderer } from 'chalknotes';

<NotionRenderer blocks={post.blocks} />
```

---

## 🖼️ Supported Content Types

The `NotionRenderer` component supports all major Notion block types:

- **Text blocks**: Paragraphs, headings (H1, H2, H3)
- **Lists**: Bulleted and numbered lists
- **Code blocks**: With syntax highlighting support
- **Images**: With captions and Next.js optimization
- **Quotes**: Styled blockquotes
- **Dividers**: Horizontal rules
- **Rich text**: Bold, italic, strikethrough, code, links

---

## 🎨 Styling

The generated templates use Tailwind CSS with:
- Clean, minimal design
- Responsive layout
- Typography optimized for readability
- Proper spacing and hierarchy
- Light and dark mode support
- **Rich content styling** for all Notion block types

Make sure you have Tailwind CSS installed in your project:

```bash
npm install -D tailwindcss @tailwindcss/typography
```

---

## 📅 Roadmap

- [ ] Plugin system for custom components
- [ ] More Notion block support (callouts, bookmarks, toggles)
- [ ] RSS feed support
- [ ] MDX or Markdown output option
- [ ] Custom theme templates
- [ ] Search functionality
- [ ] Categories and tags support

---

## 💡 Inspiration

Built to scratch an itch while exploring the simplicity of tools like [feather.so](https://feather.so/) and [Notion Blog](https://github.com/ijjk/notion-blog).

---

## 🧑‍💻 Author

[NepTune](https://github.com/yourhandle) • MIT License
