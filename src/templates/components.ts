import { TemplateVariables } from '../types';

export function generateNotionRenderer(vars: TemplateVariables): string {
  return generateAppRouterRenderer(vars);
}

function generateAppRouterRenderer(vars: TemplateVariables): string {
  const imageImport = 'import Image from "next/image";';

  if (vars.hasTailwind) {
    return `"use client";

${vars.hasTypeScript ? 'import React from "react";' : 'import React from "react";'}
${imageImport}

interface NotionBlock {
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
  rows?: {
    cells: string[][];
  }[];
}

interface NotionRendererProps {
  blocks: NotionBlock[];
}

export default function NotionRenderer({ blocks }: NotionRendererProps) {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
    
    // Load Twitter widgets script if tweet embeds exist
    if (
      typeof window !== 'undefined' &&
      !(window as typeof window & { twttr?: any }).twttr
    ) {
      const script = document.createElement('script');
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      script.charset = 'utf-8';
      document.head.appendChild(script);
    }
  }, []);

  if (!blocks || blocks.length === 0) return null;

  return (
    <div className="max-w-none">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading_1":
            return (
              <h1 key={i} className="text-3xl font-bold mb-6 mt-8 border-b border-gray-200 dark:border-gray-700 pb-2">
                {block.text}
              </h1>
            );

          case "heading_2":
            return (
              <h2 key={i} className="text-2xl font-semibold mb-4 mt-6">
                {block.text}
              </h2>
            );

          case "heading_3":
            return (
              <h3 key={i} className="text-xl font-medium mb-3 mt-5">
                {block.text}
              </h3>
            );

          case "paragraph":
            return (
              <div key={i} className="leading-relaxed mb-4 text-gray-700 dark:text-gray-300">
                {block.text && (block.text.includes('tweet-embed') || block.text.includes('youtube-embed') || block.text.includes('reading-time') || block.text.includes('table-of-contents') || block.text.includes('share-section') || block.text.includes('comment-section') || block.text.includes('image-gallery')) ? (
                  isClient ? (
                    <div className="flex w-full justify-center" dangerouslySetInnerHTML={{ __html: block.text }} />
                  ) : (
                    <div className="embed-placeholder">Loading content...</div>
                  )
                ) : block.text && block.text.includes('<') ? (
                  <span dangerouslySetInnerHTML={{ __html: block.text }} />
                ) : (
                  <p>{block.text}</p>
                )}
              </div>
            );

          case "bulleted_list_item":
            return (
              <div key={i} className="flex items-start mb-2">
                <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                <span className="leading-relaxed text-gray-700 dark:text-gray-300">{block.text}</span>
              </div>
            );

          case "numbered_list_item":
            return (
              <div key={i} className="flex items-start mb-2">
                <span className="inline-block w-6 h-6 bg-blue-500 text-white text-sm rounded-full mr-3 text-center leading-6 flex-shrink-0">
                  {i + 1}
                </span>
                <span className="leading-relaxed text-gray-700 dark:text-gray-300">{block.text}</span>
              </div>
            );

          case "quote":
            return (
              <blockquote key={i} className="border-l-4 border-blue-500 pl-6 py-4 my-6 bg-blue-50 dark:bg-blue-900/20 rounded-r-lg">
                <p className="italic text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                  {block.text}
                </p>
              </blockquote>
            );

          case "code":
            return (
              <pre key={i} className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto my-4 border">
                <code className="text-sm font-mono text-gray-800 dark:text-gray-200">
                  {block.code}
                </code>
              </pre>
            );

          case "table":
            return (
              <div key={i} className="overflow-x-auto my-6">
                <table className="min-w-full border border-gray-300 dark:border-gray-600 rounded-lg">
                  <tbody>
                    {block.rows?.map((row, rowIndex) => (
                      <tr key={rowIndex} className={rowIndex === 0 && block.hasColumnHeader ? "bg-gray-50 dark:bg-gray-800 font-semibold" : ""}>
                        {row.cells.map((cell, cellIndex) => (
                          <td key={cellIndex} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">
                            {cell.join(' ')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          case "image":
            return (
              <figure key={i} className="flex flex-col justify-center items-center my-8">
                <div className="relative w-fit overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <Image
                    src={block.imageUrl || '/placeholder.jpg'}
                    alt={block.alt || 'Image'}
                    width={800}
                    height={400}
                    className="w-full h-auto object-cover"
                    unoptimized
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
  }

  // CSS Modules version
  if (vars.cssFramework === 'css-modules') {
    return `"use client";

${vars.hasTypeScript ? 'import React from "react";' : 'import React from "react";'}
${imageImport}
import styles from './NotionRenderer.module.css';

interface NotionBlock {
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
  rows?: {
    cells: string[][];
  }[];
}

interface NotionRendererProps {
  blocks: NotionBlock[];
}

export default function NotionRenderer({ blocks }: NotionRendererProps) {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
    
    // Load Twitter widgets script if tweet embeds exist
    if (
      typeof window !== 'undefined' &&
      !(window as typeof window & { twttr?: any }).twttr
    ) {
      const script = document.createElement('script');
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      script.charset = 'utf-8';
      document.head.appendChild(script);
    }
  }, []);

  if (!blocks || blocks.length === 0) return null;

  return (
    <div className={styles.container}>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading_1":
            return (
              <h1 key={i} className={styles.heading1}>
                {block.text}
              </h1>
            );

          case "heading_2":
            return (
              <h2 key={i} className={styles.heading2}>
                {block.text}
              </h2>
            );

          case "heading_3":
            return (
              <h3 key={i} className={styles.heading3}>
                {block.text}
              </h3>
            );

          case "paragraph":
            return (
              <div key={i} className={styles.paragraph}>
                {block.text && (block.text.includes('tweet-embed') || block.text.includes('youtube-embed') || block.text.includes('reading-time') || block.text.includes('table-of-contents') || block.text.includes('share-section') || block.text.includes('comment-section') || block.text.includes('image-gallery')) ? (
                  isClient ? (
                    <div className={styles.pluginContent} dangerouslySetInnerHTML={{ __html: block.text }} />
                  ) : (
                    <div className={styles.embedPlaceholder}>Loading content...</div>
                  )
                ) : block.text && block.text.includes('<') ? (
                  <span dangerouslySetInnerHTML={{ __html: block.text }} />
                ) : (
                  <p>{block.text}</p>
                )}
              </div>
            );

          case "quote":
            return (
              <blockquote key={i} className={styles.quote}>
                <p className={styles.quoteText}>
                  {block.text}
                </p>
              </blockquote>
            );

          case "code":
            return (
              <pre key={i} className={styles.codeBlock}>
                <code className={styles.code}>
                  {block.code}
                </code>
              </pre>
            );

          case "table":
            return (
              <div key={i} className={styles.tableContainer}>
                <table className={styles.table}>
                  <tbody>
                    {block.rows?.map((row, rowIndex) => (
                      <tr key={rowIndex} className={rowIndex === 0 && block.hasColumnHeader ? styles.tableHeader : ""}>
                        {row.cells.map((cell, cellIndex) => (
                          <td key={cellIndex} className={styles.tableCell}>
                            {cell.join(' ')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          case "image":
            return (
              <figure key={i}>
                <div className={styles.imageContainer}>
                  <Image
                    src={block.imageUrl || '/placeholder.jpg'}
                    alt={block.alt || 'Image'}
                    width={800}
                    height={400}
                    className={styles.image}
                  />
                  {block.caption && (
                    <figcaption className={styles.caption}>
                      {block.caption}
                    </figcaption>
                  )}
                </div>
              </figure>
            );

          default:
            return (
              <div key={i} className={styles.unsupported}>
                <p className={styles.unsupportedText}>
                  ⚠️ Unsupported block type: {block.type}
                </p>
              </div>
            );
        }
      })}
    </div>
  );
}`;
  }

  // Plain CSS/Styled Components version
  return `"use client";

${vars.hasTypeScript ? 'import React from "react";' : 'import React from "react";'}
${imageImport}

interface NotionBlock {
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
  rows?: {
    cells: string[][];
  }[];
}

interface NotionRendererProps {
  blocks: NotionBlock[];
}

export default function NotionRenderer({ blocks }: NotionRendererProps) {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
    
    // Load Twitter widgets script if tweet embeds exist
    if (
      typeof window !== 'undefined' &&
      !(window as typeof window & { twttr?: any }).twttr
    ) {
      const script = document.createElement('script');
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      script.charset = 'utf-8';
      document.head.appendChild(script);
    }
  }, []);

  if (!blocks || blocks.length === 0) return null;

  return (
    <div style={{ maxWidth: 'none' }}>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading_1":
            return (
              <h1 key={i} style={{ 
                fontSize: '1.875rem', 
                fontWeight: 'bold', 
                marginBottom: '1.5rem', 
                marginTop: '2rem',
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '0.5rem'
              }}>
                {block.text}
              </h1>
            );

          case "heading_2":
            return (
              <h2 key={i} style={{ 
                fontSize: '1.5rem', 
                fontWeight: '600', 
                marginBottom: '1rem', 
                marginTop: '1.5rem' 
              }}>
                {block.text}
              </h2>
            );

          case "heading_3":
            return (
              <h3 key={i} style={{ 
                fontSize: '1.25rem', 
                fontWeight: '500', 
                marginBottom: '0.75rem', 
                marginTop: '1.25rem' 
              }}>
                {block.text}
              </h3>
            );

          case "paragraph":
            return (
              <div key={i} style={{ 
                lineHeight: '1.625', 
                marginBottom: '1rem', 
                color: '#374151' 
              }}>
                {block.text && (block.text.includes('tweet-embed') || block.text.includes('youtube-embed') || block.text.includes('reading-time') || block.text.includes('table-of-contents') || block.text.includes('share-section') || block.text.includes('comment-section') || block.text.includes('image-gallery')) ? (
                  isClient ? (
                    <div style={{ display: 'flex', width: '100%', justifyContent: 'center' }} dangerouslySetInnerHTML={{ __html: block.text }} />
                  ) : (
                    <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>Loading content...</div>
                  )
                ) : block.text && block.text.includes('<') ? (
                  <span dangerouslySetInnerHTML={{ __html: block.text }} />
                ) : (
                  <p>{block.text}</p>
                )}
              </div>
            );

          case "quote":
            return (
              <blockquote key={i} style={{ 
                borderLeft: '4px solid #3b82f6', 
                paddingLeft: '1.5rem', 
                paddingTop: '1rem',
                paddingBottom: '1rem',
                marginTop: '1.5rem',
                marginBottom: '1.5rem',
                backgroundColor: '#eff6ff',
                borderRadius: '0 0.5rem 0.5rem 0'
              }}>
                <p style={{ 
                  fontStyle: 'italic', 
                  color: '#374151', 
                  fontSize: '1.125rem',
                  lineHeight: '1.625'
                }}>
                  {block.text}
                </p>
              </blockquote>
            );

          case "code":
            return (
              <pre key={i} style={{ 
                backgroundColor: '#f3f4f6', 
                padding: '1rem', 
                borderRadius: '0.5rem', 
                overflowX: 'auto', 
                marginTop: '1rem',
                marginBottom: '1rem',
                border: '1px solid #e5e7eb'
              }}>
                <code style={{ 
                  fontSize: '0.875rem', 
                  fontFamily: 'monospace', 
                  color: '#1f2937' 
                }}>
                  {block.code}
                </code>
              </pre>
            );

          case "table":
            return (
              <div key={i} style={{ overflowX: 'auto', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                <table style={{ 
                  minWidth: '100%', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '0.5rem',
                  borderCollapse: 'collapse'
                }}>
                  <tbody>
                    {block.rows?.map((row, rowIndex) => (
                      <tr key={rowIndex} style={rowIndex === 0 && block.hasColumnHeader ? { 
                        backgroundColor: '#f9fafb', 
                        fontWeight: '600' 
                      } : {}}>
                        {row.cells.map((cell, cellIndex) => (
                          <td key={cellIndex} style={{ 
                            border: '1px solid #d1d5db', 
                            padding: '0.5rem 1rem', 
                            fontSize: '0.875rem' 
                          }}>
                            {cell.join(' ')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          case "image":
            return (
              <figure key={i} style={{ marginTop: '2rem', marginBottom: '2rem' }}>
                <div style={{ 
                  position: 'relative', 
                  overflow: 'hidden', 
                  borderRadius: '0.5rem',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #e5e7eb'
                }}>
                  <Image
                    src={block.imageUrl || '/placeholder.jpg'}
                    alt={block.alt || 'Image'}
                    width={800}
                    height={400}
                    style={{ width: '100%', height: 'auto', objectFit: 'cover' }}
                  />
                  {block.caption && (
                    <figcaption style={{ 
                      fontSize: '0.875rem', 
                      textAlign: 'center', 
                      color: '#6b7280',
                      marginTop: '0.75rem',
                      fontStyle: 'italic'
                    }}>
                      {block.caption}
                    </figcaption>
                  )}
                </div>
              </figure>
            );

          default:
            return (
              <div key={i} style={{ 
                marginTop: '1rem', 
                marginBottom: '1rem', 
                padding: '0.75rem', 
                backgroundColor: '#fefce8', 
                border: '1px solid #fde047',
                borderRadius: '0.5rem'
              }}>
                <p style={{ 
                  fontSize: '0.875rem', 
                  color: '#a16207', 
                  fontStyle: 'italic'
                }}>
                  ⚠️ Unsupported block type: {block.type}
                </p>
              </div>
            );
        }
      })}
    </div>
  );
}`;
}

export function generateCSSModules(): string {
  return `.container {
  max-width: none;
}

.heading1 {
  font-size: 1.875rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  margin-top: 2rem;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.5rem;
}

.heading2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  margin-top: 1.5rem;
}

.heading3 {
  font-size: 1.25rem;
  font-weight: 500;
  margin-bottom: 0.75rem;
  margin-top: 1.25rem;
}

.paragraph {
  line-height: 1.625;
  margin-bottom: 1rem;
  color: #374151;
}

.quote {
  border-left: 4px solid #3b82f6;
  padding-left: 1.5rem;
  padding-top: 1rem;
  padding-bottom: 1rem;
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
  background-color: #eff6ff;
  border-radius: 0 0.5rem 0.5rem 0;
}

.quoteText {
  font-style: italic;
  color: #374151;
  font-size: 1.125rem;
  line-height: 1.625;
}

.codeBlock {
  background-color: #f3f4f6;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin-top: 1rem;
  margin-bottom: 1rem;
  border: 1px solid #e5e7eb;
}

.code {
  font-size: 0.875rem;
  font-family: monospace;
  color: #1f2937;
}

.imageContainer {
  position: relative;
  overflow: hidden;
  border-radius: 0.5rem;
  background-color: #f3f4f6;
  border: 1px solid #e5e7eb;
}

.image {
  width: 100%;
  height: auto;
  object-fit: cover;
}

.caption {
  font-size: 0.875rem;
  text-align: center;
  color: #6b7280;
  margin-top: 0.75rem;
  font-style: italic;
}

.unsupported {
  margin-top: 1rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background-color: #fefce8;
  border: 1px solid #fde047;
  border-radius: 0.5rem;
}

.unsupportedText {
  font-size: 0.875rem;
  color: #a16207;
  font-style: italic;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .paragraph, .quoteText {
    color: #d1d5db;
  }
  
  .heading1, .heading2, .heading3 {
    color: #f9fafb;
  }
  
  .quote {
    background-color: #1e3a8a20;
    border-left-color: #60a5fa;
  }
  
  .imageContainer {
    background-color: #1f2937;
    border-color: #374151;
  }
  
  .unsupported {
    background-color: #451a0380;
    border-color: #d97706;
  }
  
  .unsupportedText {
    color: #fbbf24;
  }
}`;
}