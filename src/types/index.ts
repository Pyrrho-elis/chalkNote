export interface ChalkNotesConfig {
  notionToken: string;
  notionDatabaseId: string;
  routeBasePath: string;
  theme: 'modern' | 'minimal' | 'dev';
  plugins: string[];
  caching?: {
    enabled: boolean;
    ttl: number;
  };
  errorBoundaries?: boolean;
  customization?: {
    colors?: Record<string, string>;
    fonts?: Record<string, string>;
  };
}

export interface ProjectDetection {
  isNextJs: boolean;
  isAppRouter: boolean;
  hasTailwind: boolean;
  hasStyledComponents: boolean;
  hasCSSModules: boolean;
  hasTypeScript: boolean;
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun';
}

export interface NotionBlock {
  type: string;
  text?: string;
  richText?: any[];
  imageUrl?: string;
  caption?: string;
  alt?: string;
  code?: string;
  language?: string;
  unsupported?: boolean;
  // Table properties
  tableWidth?: number;
  hasColumnHeader?: boolean;
  hasRowHeader?: boolean;
  rows?: TableRow[];
}

export interface TableRow {
  cells: string[][];
}

export interface BlogPost {
  title: string;
  slug: string;
  notionPageId: string;
  blocks: NotionBlock[];
  publishedAt?: string;
  tags?: string[];
  excerpt?: string;
}

export interface PluginContext {
  content: string;
  config: ChalkNotesConfig;
  post: BlogPost;
}

export interface Plugin {
  name: string;
  syntax: RegExp;
  render: (match: RegExpMatchArray, context: PluginContext) => string;
}

export interface TemplateVariables {
  routeBasePath: string;
  theme: string;
  hasTypeScript: boolean;
  hasTailwind: boolean;
  isAppRouter: boolean;
  cssFramework: 'tailwind' | 'styled-components' | 'css-modules' | 'none';
}