module.exports = {
  notionToken: process.env.NOTION_TOKEN,
  notionDatabaseId: process.env.NOTION_DATABASE_ID,
  routeBasePath: '/blog',
  theme: 'modern', // 'modern' | 'minimal' | 'dev'
  
  // Define plugins here instead of CLI prompts
  // Built-in plugins work with @@PluginName syntax in your Notion content
  plugins: [
    // Example plugin configurations:
    // '@chalknotes/syntax-highlighter', // For enhanced code highlighting
    // '@chalknotes/analytics',          // For tracking blog performance
    // '@chalknotes/seo',                // For search engine optimization
    // '@chalknotes/comments',           // For comment sections
  ],
  
  caching: {
    enabled: true,
    ttl: 3600 // 1 hour
  },
  errorBoundaries: true,
  
  customization: {
    colors: {
      primary: '#3b82f6',
      accent: '#8b5cf6'
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter',
      mono: 'JetBrains Mono'
    }
  }
};