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
          <div 
            className="prose prose-lg prose-invert max-w-none text-gray-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: post.content }} 
          />
        </article>
      </main>
    </div>
  );
}`.trim(),
            appRouter: `
import { getPostBySlug } from 'chalknotes';

export default async function BlogPost({ params }) {
  const post = await getPostBySlug(params.slug);

  return (
    <div className="min-h-screen bg-gray-900">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <article className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-8">
          <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
            {post.title}
          </h1>
          <div 
            className="prose prose-lg prose-invert max-w-none text-gray-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: post.content }} 
          />
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
          <div 
            className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: post.content }} 
          />
        </article>
      </main>
    </div>
  );
}`.trim(),
            appRouter: `
import { getPostBySlug } from 'chalknotes';

export default async function BlogPost({ params }) {
  const post = await getPostBySlug(params.slug);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <article className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
            {post.title}
          </h1>
          <div 
            className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: post.content }} 
          />
        </article>
      </main>
    </div>
  );
}`.trim()
        };
    }
}

// Create blog page templates
if (fs.existsSync(pageRouter)) {
    console.log("✅ Page router found");
    const routePath = config.routeBasePath.replace(/^\//, ''); // Remove leading slash
    const slugDir = path.join(pageRouter, routePath, "[slug].js")
    const dirPath = path.dirname(slugDir);

    const templates = getTemplates(config.theme, config.routeBasePath);
    
    fs.mkdirSync(dirPath, { recursive: true });
    fs.writeFileSync(slugDir, templates.pageRouter);
    console.log(`✅ Created pages/${routePath}/[slug].js`);
    
} else if (fs.existsSync(appRouter)) {
    console.log("✅ App router found");
    const routePath = config.routeBasePath.replace(/^\//, ''); // Remove leading slash
    const slugDir = path.join(appRouter, routePath, "[slug]", "page.jsx")
    const dirPath = path.dirname(slugDir);

    const templates = getTemplates(config.theme, config.routeBasePath);
    
    fs.mkdirSync(dirPath, { recursive: true });
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