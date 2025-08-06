import * as fs from 'fs';
import * as path from 'path';
import { ChalkNotesConfig } from '../types';

export class ConfigManager {
  private configPath: string;

  constructor(cwd: string = process.cwd()) {
    this.configPath = path.join(cwd, 'blog.config.js');
  }

  getConfigPath(): string {
    return this.configPath;
  }

  exists(): boolean {
    return fs.existsSync(this.configPath);
  }

  async load(): Promise<ChalkNotesConfig | null> {
    if (!this.exists()) {
      return null;
    }

    try {
      // Clear require cache to get fresh config
      delete require.cache[require.resolve(this.configPath)];
      return require(this.configPath);
    } catch (error) {
      throw new Error(`Failed to load config: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async save(config: ChalkNotesConfig): Promise<void> {
    const configContent = this.generateConfigContent(config);
    await fs.promises.writeFile(this.configPath, configContent, 'utf-8');
  }

  private generateConfigContent(config: ChalkNotesConfig): string {
    return `module.exports = {
  notionToken: process.env.NOTION_TOKEN,
  notionDatabaseId: process.env.NOTION_DATABASE_ID,
  routeBasePath: '${config.routeBasePath}',
  theme: '${config.theme}',
  plugins: [
    ${config.plugins.map(plugin => `'${plugin}'`).join(',\n    ')}
  ],
  caching: {
    enabled: ${config.caching?.enabled ?? true},
    ttl: ${config.caching?.ttl ?? 3600}
  },
  errorBoundaries: ${config.errorBoundaries ?? true},
  customization: ${JSON.stringify(config.customization || {}, null, 4)}
};`;
  }

  getDefaultConfig(): ChalkNotesConfig {
    return {
      notionToken: process.env.NOTION_TOKEN || '',
      notionDatabaseId: process.env.NOTION_DATABASE_ID || '',
      routeBasePath: '/blog',
      theme: 'modern',
      plugins: [],
      caching: {
        enabled: true,
        ttl: 3600
      },
      errorBoundaries: true
    };
  }
}