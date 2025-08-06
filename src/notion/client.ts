import { Client } from '@notionhq/client';
import { BlogPost, NotionBlock } from '../types';

export class NotionClient {
  private client: Client;
  private databaseId: string;

  constructor(token: string, databaseId: string) {
    this.client = new Client({ auth: token });
    this.databaseId = databaseId;
  }

  async getAllPosts(): Promise<BlogPost[]> {
    try {
      const response = await this.client.databases.query({
        database_id: this.databaseId,
        filter: {
          property: 'Published',
          checkbox: {
            equals: true
          }
        },
        sorts: [
          {
            property: 'Created',
            direction: 'descending'
          }
        ]
      });

      const posts: BlogPost[] = [];

      for (const page of response.results) {
        const post = await this.extractPostMetadata(page);
        if (post) {
          posts.push(post);
        }
      }

      return posts;
    } catch (error) {
      throw new Error(`Failed to fetch posts from Notion: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPostBySlug(slug: string): Promise<BlogPost | null> {
    try {
      const posts = await this.getAllPosts();
      const post = posts.find(p => p.slug === slug);
      
      if (!post) {
        return null;
      }

      // Fetch the full content
      const blocks = await this.getPageBlocks(post.notionPageId);
      
      return {
        ...post,
        blocks
      };
    } catch (error) {
      throw new Error(`Failed to fetch post "${slug}": ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async extractPostMetadata(page: any): Promise<BlogPost | null> {
    try {
      const titleProperty = page.properties['Name'] || page.properties['Title'];
      const title = titleProperty?.title?.[0]?.plain_text;
      
      if (!title) {
        return null;
      }

      const slug = this.slugify(title);
      
      // Extract additional metadata
      const publishedAtProperty = page.properties['Published Date'] || page.properties['Date'];
      const publishedAt = publishedAtProperty?.date?.start;
      
      const tagsProperty = page.properties['Tags'];
      const tags = tagsProperty?.multi_select?.map((tag: any) => tag.name) || [];

      return {
        title,
        slug,
        notionPageId: page.id,
        blocks: [], // Will be populated when full content is fetched
        publishedAt,
        tags
      };
    } catch (error) {
      console.warn(`Failed to extract metadata for page: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  private async getPageBlocks(pageId: string): Promise<NotionBlock[]> {
    try {
      const response = await this.client.blocks.children.list({
        block_id: pageId,
        page_size: 100
      });

      const blocks: NotionBlock[] = [];

      for (const block of response.results) {
        const convertedBlock = await this.convertBlockToStructuredJSON(block);
        if (convertedBlock) {
          blocks.push(convertedBlock);
        }
      }

      return blocks;
    } catch (error) {
      throw new Error(`Failed to fetch blocks for page ${pageId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getTableRows(tableId: string): Promise<any[]> {
    try {
      const response = await this.client.blocks.children.list({
        block_id: tableId,
        page_size: 100
      });

      const rows = [];
      for (const row of response.results) {
        if ((row as any).type === 'table_row') {
          const cells = (row as any).table_row.cells.map((cell: any[]) => 
            cell.map((text: any) => text.plain_text)
          );
          rows.push({ cells });
        }
      }

      return rows;
    } catch (error) {
      console.warn(`Failed to fetch table rows for ${tableId}:`, error);
      return [];
    }
  }

  private async convertBlockToStructuredJSON(block: any): Promise<NotionBlock | null> {
    const base = { type: block.type };

    try {
      switch (block.type) {
        case 'paragraph':
          return {
            ...base,
            text: this.extractPlainText(block.paragraph.rich_text),
            richText: block.paragraph.rich_text
          };

        case 'heading_1':
        case 'heading_2':
        case 'heading_3':
          return {
            ...base,
            text: this.extractPlainText(block[block.type].rich_text),
            richText: block[block.type].rich_text
          };

        case 'bulleted_list_item':
        case 'numbered_list_item':
          return {
            ...base,
            text: this.extractPlainText(block[block.type].rich_text),
            richText: block[block.type].rich_text
          };

        case 'image': {
          const image = block.image;
          const url = image.type === 'external' ? image.external.url : image.file.url;
          const caption = this.extractPlainText(image.caption);
          return {
            ...base,
            imageUrl: url,
            caption,
            alt: caption || 'Blog image from Notion'
          };
        }

        case 'quote':
          return {
            ...base,
            text: this.extractPlainText(block.quote.rich_text),
            richText: block.quote.rich_text
          };

        case 'code':
          return {
            ...base,
            code: this.extractPlainText(block.code.rich_text),
            language: block.code.language || 'text'
          };

        case 'divider':
          return { ...base };

        case 'callout':
          return {
            ...base,
            text: this.extractPlainText(block.callout.rich_text),
            richText: block.callout.rich_text
          };

        case 'table_of_contents':
        case 'bookmark':
        case 'equation':
          return { ...base };
          
        case 'table': {
          const table = block.table;
          const tableWidth = table.table_width;
          const hasColumnHeader = table.has_column_header;
          const hasRowHeader = table.has_row_header;
          
          // Get table rows
          const rows = await this.getTableRows(block.id);
          
          return {
            ...base,
            tableWidth,
            hasColumnHeader,
            hasRowHeader,
            rows
          };
        }

        default:
          return {
            ...base,
            unsupported: true
          };
      }
    } catch (error) {
      console.warn(`Failed to convert block of type ${block.type}:`, error);
      return {
        type: block.type,
        unsupported: true
      };
    }
  }

  private extractPlainText(richText: any[] = []): string {
    return richText.map(t => t.plain_text).join('');
  }

  private slugify(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}