# ✏️ ChalkNotes

**Turn your Notion database into a blog with zero config. Works with Next.js Page Router and App Router.**

---

## 🚀 Features

- 📄 Fetch blog posts from Notion
- 🪄 Auto-generate routes for App Router or Page Router
- ⚙️ Helpers for `getStaticProps` / `getStaticPaths`
- 🧠 Minimal setup – just run `chalknotes`

---

## 📦 Installation

```bash
pnpm add chalknotes
# or
npm install chalknotes
```

---

## 🧙‍♂️ Quick Start

```bash
npx chalknotes
```

- Automatically detects if you're using **App Router** or **Page Router**
- Generates blog routes at `/blog/[slug]`
- You’re done ✅

---

## 🔧 Setup

Make sure your `.env` file contains:

```env
NOTION_TOKEN=secret_...
NOTION_DATABASE_ID=xxxxxxxxxxxxxxxxxxxxxx
```

Your Notion database should have:
- A **"Name"** title property
- A **"Published"** checkbox property

---

## 📚 Usage in Next.js

### Page Router

Creates:

```js
// pages/blog/[slug].js
import { getStaticPropsForPost, getStaticPathsForPosts } from 'chalknotes';

export const getStaticProps = getStaticPropsForPost;
export const getStaticPaths = getStaticPathsForPosts;

export default function BlogPost({ post }) {
  return (
    <article>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}
```

---

### App Router

Creates:

```jsx
// app/blog/[slug]/page.jsx
import { getPostBySlug } from 'chalknotes';

export default async function BlogPost({ params }) {
  const post = await getPostBySlug(params.slug);

  return (
    <article>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}
```

---

## 🧩 API

### `getPostBySlug(slug: string)`
Fetches a post and renders Notion blocks as HTML.

```js
const post = await getPostBySlug('my-post-title');
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

## 📅 Roadmap

- [ ] Rich block support (images, lists, toggles, etc)
- [ ] RSS feed support
- [ ] MDX or Markdown output option
- [ ] Custom blog.config.js support

---

## 💡 Inspiration

Built to scratch an itch while exploring the simplicity of tools like [feather.so](https://feather.so/) and [Notion Blog](https://github.com/ijjk/notion-blog).

---

## 🧑‍💻 Author

[NepTune](https://github.com/yourhandle) • MIT License
