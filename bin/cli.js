#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

console.log("Initializing ChalkNotes...");

const configPath = path.join(process.cwd(), 'blog.config.js');
const pageRouter = path.join(process.cwd(), '/pages')
const appRouter = path.join(process.cwd(), '/app')


if (fs.existsSync(pageRouter)) {
    console.log("✅ Page router found");
    const slugDir = path.join(pageRouter, "blog", "[slug].js")
    const dirPath = path.dirname(slugDir);

    const pageRouterTemplate = `
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
`.trim();

    fs.mkdirSync(dirPath, { recursive: true });
    fs.writeFileSync(slugDir, pageRouterTemplate)
} else if (fs.existsSync(appRouter)) {
    console.log("✅ App router found");
    const slugDir = path.join(appRouter, 'blog', "[slug]", "page.jsx")
    const dirPath = path.dirname(slugDir);

    const appRouterTemplate = `
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
`.trim();

    fs.mkdirSync(dirPath, { recursive: true });
    fs.writeFileSync(slugDir, appRouterTemplate)
} else {
    console.log("❌ Page router and app router not found");
}

// if (!fs.existsSync(configPath)) {
//     const configTemplate = `
// module.exports = {
//   notionDatabaseId: '',
//   notionToken: process.env.NOTION_TOKEN,
//   routeBasePath: '/blog',
//   plugins: [],
// };
// `;
//     fs.writeFileSync(configPath, configTemplate.trim());
//     console.log("✅ Created blog.config.js");
// } else {
//     console.log("⚠️  blog.config.js already exists");
// }