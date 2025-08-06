// Core API exports
export { NotionClient } from './notion/client';

// Types
export type { 
  ChalkNotesConfig, 
  BlogPost, 
  NotionBlock, 
  Plugin, 
  PluginContext 
} from './types';

// Plugin system
export { PluginParser, builtInPlugins, defaultPluginStyles } from './plugins/parser';

// Utilities
export { ProjectDetector } from './utils/detection';
export { ConfigManager } from './utils/config';
export { Logger } from './utils/logger';

// Main API functions for Next.js integration
import { NotionClient } from './notion/client';
import { PluginParser, builtInPlugins } from './plugins/parser';
import type { Plugin } from './types';

let notionClient: NotionClient | null = null;
let pluginParser: PluginParser | null = null;

function getNotionClient(): NotionClient {
  if (!notionClient) {
    // Get credentials from environment variables directly
    const notionToken = process.env.NOTION_TOKEN;
    const notionDatabaseId = process.env.NOTION_DATABASE_ID;
    
    if (!notionToken || !notionDatabaseId) {
      throw new Error('NOTION_TOKEN and NOTION_DATABASE_ID environment variables are required. Please check your .env file.');
    }

    notionClient = new NotionClient(notionToken, notionDatabaseId);
  }
  
  return notionClient;
}

function getPluginParser(): PluginParser {
  if (!pluginParser) {
    pluginParser = new PluginParser();
    
    // Register built-in plugins
    builtInPlugins.forEach(plugin => {
      pluginParser!.registerPlugin(plugin);
    });
  }
  
  return pluginParser;
}

/**
 * Get all published blog posts from Notion
 */
export async function getAllPosts() {
  try {
    const client = getNotionClient();
    return await client.getAllPosts();
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
}

/**
 * Get a specific blog post by slug
 */
export async function getPostBySlug(slug: string) {
  try {
    const client = getNotionClient();
    const post = await client.getPostBySlug(slug);
    
    if (!post) {
      return null;
    }

    // Process plugins in post content
    const parser = getPluginParser();
    
    // Create a basic context for plugins (avoiding dynamic config loading)
    const basicConfig = {
      notionToken: process.env.NOTION_TOKEN || '',
      notionDatabaseId: process.env.NOTION_DATABASE_ID || '',
      routeBasePath: process.env.CHALKNOTES_ROUTE_BASE_PATH || '/blog',
      theme: (process.env.CHALKNOTES_THEME as any) || 'modern',
      plugins: [],
      caching: { enabled: true, ttl: 3600 },
      errorBoundaries: true
    };
    
    // Process each text block for plugin syntax
    post.blocks = post.blocks.map(block => {
      if (block.text) {
        const context = { content: block.text, config: basicConfig, post };
        block.text = parser.parseContent(block.text, context);
      }
      return block;
    });
    
    return post;
  } catch (error) {
    console.error('Error fetching post:', error);
    throw error;
  }
}

/**
 * Next.js Pages Router helper for getStaticProps
 */
export async function getStaticPropsForPost({ params }: { params: { slug: string } }) {
  try {
    const post = await getPostBySlug(params.slug);
    
    if (!post) {
      return {
        notFound: true
      };
    }

    return {
      props: {
        post
      },
      revalidate: 3600 // Revalidate every hour
    };
  } catch (error) {
    console.error('Error in getStaticProps:', error);
    return {
      notFound: true
    };
  }
}

/**
 * Next.js Pages Router helper for getStaticPaths
 */
export async function getStaticPathsForPosts() {
  try {
    const posts = await getAllPosts();
    
    const paths = posts.map((post) => ({
      params: { slug: post.slug }
    }));

    return {
      paths,
      fallback: 'blocking'
    };
  } catch (error) {
    console.error('Error in getStaticPaths:', error);
    return {
      paths: [],
      fallback: 'blocking'
    };
  }
}

/**
 * Register a custom plugin
 */
export function registerPlugin(plugin: Plugin) {
  const parser = getPluginParser();
  parser.registerPlugin(plugin);
}

/**
 * Get list of available plugins
 */
export function getAvailablePlugins(): string[] {
  const parser = getPluginParser();
  return parser.getAvailablePlugins();
}