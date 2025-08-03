#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const readline = require("readline");
dotenv.config();

console.log("🚀 Initializing ChalkNotes...");

// Check environment variables
if (!process.env.NOTION_TOKEN) {
  console.error("❌ NOTION_TOKEN is not set in .env file");
  console.log("💡 Please create a .env file with your NOTION_TOKEN");
  process.exit(1);
}

if (!process.env.NOTION_DATABASE_ID) {
  console.error("❌ NOTION_DATABASE_ID is not set in .env file");
  console.log("💡 Please create a .env file with your NOTION_DATABASE_ID");
  process.exit(1);
}

console.log("✅ Environment variables are set");

const configPath = path.join(process.cwd(), 'blog.config.js');

// Check if blog.config.js exists
if (!fs.existsSync(configPath)) {
  console.log("\n❌ blog.config.js not found");
  console.log("This file is required to configure your blog settings.");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question("Would you like to create a default blog.config.js? (y/n): ", (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      console.log("📝 Creating blog.config.js with default configuration...");

      const configTemplate = `module.exports = {
  notionToken: process.env.NOTION_TOKEN,
  notionDatabaseId: process.env.NOTION_DATABASE_ID,
  routeBasePath: '/blog',
  theme: 'default',
  plugins: [],
};`.trim();

      fs.writeFileSync(configPath, configTemplate);
      console.log("✅ Created blog.config.js with default configuration");
      console.log("\n💡 Now you can re-run 'npx chalknotes' to scaffold your blog pages!");
    } else {
      console.log("❌ Please create a blog.config.js file and try again.");
    }
    rl.close();
  });
  return;
}

// Load configuration
let config;
try {
  config = require(configPath);
} catch (error) {
  console.error("❌ Error loading blog.config.js:", error.message);
  process.exit(1);
}

// Set defaults for missing config values
config.routeBasePath = config.routeBasePath || '/blog';
config.theme = config.theme || 'default';

console.log("✅ Configuration loaded successfully");
console.log(`📁 Route base path: ${config.routeBasePath}`);
console.log(`🎨 Theme: ${config.theme}`);

// Ask to proceed with scaffolding
console.log("\n🔨 Ready to scaffold your blog page?");
console.log("This will create a clean, responsive blog template using Tailwind CSS.");
console.log("Press Enter to continue or Ctrl+C to cancel...");

// Create blog page templates based on theme and route
const pageRouter = path.join(process.cwd(), '/pages')
const appRouter = path.join(process.cwd(), '/app')

// Generate templates based on theme
function getTemplates(theme, routeBasePath) {
  const routePath = routeBasePath.replace(/^\//, ''); // Remove leading slash

  if (theme === 'dark') {
    return {
      pageRouter: `
import { getStaticPropsForPost, getStaticPathsForPosts } from 'chalknotes';
import NotionRenderer from './NotionRenderer';

export const getStaticProps = getStaticPropsForPost;
export const getStaticPaths = getStaticPathsForPosts;

export default function BlogPost({ post }) {
  return (
    <div className="min-h-screen bg-gray-900">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <article className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-8">
          <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
            {post.title}
          </h1>
          <NotionRenderer blocks={post.blocks} />
        </article>
      </main>
    </div>
  );
}`.trim(),
      appRouter: `
import { getPostBySlug } from 'chalknotes';
import NotionRenderer from './NotionRenderer';

export default async function BlogPost({ params }) {
  const post = await getPostBySlug(params.slug);

  return (
    <div className="min-h-screen bg-gray-900">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <article className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-8">
          <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
            {post.title}
          </h1>
          <NotionRenderer blocks={post.blocks} />
        </article>
      </main>
    </div>
  );
}`.trim()
    };
  } else {
    // Default theme (light mode)
    return {
      pageRouter: `
import { getStaticPropsForPost, getStaticPathsForPosts } from 'chalknotes';
import NotionRenderer from './NotionRenderer';

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
}`.trim(),
      appRouter: `
import { getPostBySlug } from 'chalknotes';
import NotionRenderer from './NotionRenderer';

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
}`.trim()
    };
  }
}

// NotionRenderer component template
const notionRendererTemplate = `import React from "react";
import Image from "next/image";

export default function NotionRenderer({ blocks }) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div className="max-w-none">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading_1":
            return (
              <h1 key={i} className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 mt-8 first:mt-0 border-b border-gray-200 dark:border-gray-700 pb-2">
                {block.text}
              </h1>
            );

          case "heading_2":
            return (
              <h2 key={i} className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4 mt-6 first:mt-0">
                {block.text}
              </h2>
            );

          case "heading_3":
            return (
              <h3 key={i} className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-3 mt-5 first:mt-0">
                {block.text}
              </h3>
            );

          case "paragraph":
            return (
              <p key={i} className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4 last:mb-0">
                {block.text}
              </p>
            );

          case "bulleted_list_item":
            return (
              <div key={i} className="flex items-start mb-2">
                <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{block.text}</p>
              </div>
            );

          case "numbered_list_item":
            return (
              <div key={i} className="flex items-start mb-2">
                <span className="text-gray-500 dark:text-gray-400 font-medium mr-3 mt-0.5 flex-shrink-0">{(i + 1)}.</span>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{block.text}</p>
              </div>
            );

          case "quote":
            return (
              <blockquote key={i} className="border-l-4 border-blue-500 dark:border-blue-400 pl-6 py-4 my-6 bg-blue-50 dark:bg-blue-900/20 rounded-r-lg shadow-sm">
                <p className="text-gray-700 dark:text-gray-300 italic text-lg leading-relaxed">
                  {block.text}
                </p>
              </blockquote>
            );

          case "code":
            return (
              <div key={i} className="my-6">
                <pre className="bg-gray-900 dark:bg-gray-800 text-gray-100 p-4 rounded-lg shadow-md overflow-x-auto text-sm border border-gray-700 dark:border-gray-600">
                  <code className={\`language-\${block.language}\`}>{block.code}</code>
                </pre>
              </div>
            );

          case "divider":
            return (
              <hr key={i} className="my-8 border-gray-200 dark:border-gray-700 shadow-sm" />
            );

          case "image":
            return (
              <figure key={i} className="my-8">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                  <Image
                    src={block.imageUrl}
                    alt={block.alt || "Image"}
                    width={400}
                    height={300}
                    className="rounded-lg object-contain w-full h-auto shadow-sm"
                    unoptimized={true}
                  />
                  {block.caption && (
                    <figcaption className="text-sm text-center text-gray-500 dark:text-gray-400 mt-3 italic">
                      {block.caption}
                    </figcaption>
                  )}
                </div>
              </figure>
            );

          default:
            return (
              <div key={i} className="my-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-700 dark:text-yellow-300 italic">
                  ⚠️ Unsupported block type: {block.type}
                </p>
              </div>
            );
        }
      })}
    </div>
  );
}`;

// Create blog page templates
if (fs.existsSync(pageRouter)) {
  console.log("✅ Page router found");
  const routePath = config.routeBasePath.replace(/^\//, ''); // Remove leading slash
  const slugDir = path.join(pageRouter, routePath, "[slug].js")
  const dirPath = path.dirname(slugDir);

  const templates = getTemplates(config.theme, config.routeBasePath);

  // Create NotionRenderer component in the same directory as the blog page
  fs.mkdirSync(dirPath, { recursive: true });
  fs.writeFileSync(path.join(dirPath, 'NotionRenderer.jsx'), notionRendererTemplate);
  console.log(`✅ Created ${routePath}/NotionRenderer.jsx`);

  fs.writeFileSync(slugDir, templates.pageRouter);
  console.log(`✅ Created pages/${routePath}/[slug].js`);

} else if (fs.existsSync(appRouter)) {
  console.log("✅ App router found");
  const routePath = config.routeBasePath.replace(/^\//, ''); // Remove leading slash
  const slugDir = path.join(appRouter, routePath, "[slug]", "page.jsx")
  const dirPath = path.dirname(slugDir);

  const templates = getTemplates(config.theme, config.routeBasePath);

  // Create NotionRenderer component in the same directory as the blog page
  fs.mkdirSync(dirPath, { recursive: true });
  fs.writeFileSync(path.join(dirPath, 'NotionRenderer.jsx'), notionRendererTemplate);
  console.log(`✅ Created ${routePath}/[slug]/NotionRenderer.jsx`);

  fs.writeFileSync(slugDir, templates.appRouter);
  console.log(`✅ Created app/${routePath}/[slug]/page.jsx`);

} else {
  console.log("❌ Neither pages/ nor app/ directory found");
  console.log("💡 Please make sure you're running this in a Next.js project");
  process.exit(1);
}

console.log("\n🎉 Blog page scaffolded successfully!");
console.log(`\n📝 Next steps:`);
console.log("1. Add Tailwind CSS to your project if not already installed");
console.log("2. Start your development server");
console.log(`3. Visit ${config.routeBasePath}/[your-post-slug] to see your blog`);