import { TemplateVariables } from '../types';

export function generateBlogPage(vars: TemplateVariables): string {
  const ext = vars.hasTypeScript ? 'tsx' : 'jsx';
  
  if (vars.isAppRouter) {
    return generateAppRouterPage(vars);
  } else {
    return generatePagesRouterPage(vars);
  }
}

function generateAppRouterPage(vars: TemplateVariables): string {
  const routePath = vars.routeBasePath.replace(/^\//, '');
  
  return `import { getPostBySlug } from 'chalknotes';
import NotionRenderer from './NotionRenderer';
import { notFound } from 'next/navigation';

interface PageProps {
  params: { slug: string };
}

export default async function BlogPost({ params }: PageProps) {
  const post = await getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="${getThemeClasses(vars.theme, vars.hasTailwind).container}">
      <main className="${getThemeClasses(vars.theme, vars.hasTailwind).main}">
        <article className="${getThemeClasses(vars.theme, vars.hasTailwind).article}">
          <header className="${getThemeClasses(vars.theme, vars.hasTailwind).header}">
            <h1 className="${getThemeClasses(vars.theme, vars.hasTailwind).title}">
              {post.title}
            </h1>
            {post.publishedAt && (
              <time className="${getThemeClasses(vars.theme, vars.hasTailwind).date}">
                {new Date(post.publishedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </time>
            )}
            {post.tags && post.tags.length > 0 && (
              <div className="${getThemeClasses(vars.theme, vars.hasTailwind).tags}">
                {post.tags.map((tag) => (
                  <span key={tag} className="${getThemeClasses(vars.theme, vars.hasTailwind).tag}">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>
          
          <div className="${getThemeClasses(vars.theme, vars.hasTailwind).content}">
            <NotionRenderer blocks={post.blocks} />
          </div>
        </article>
      </main>
    </div>
  );
}

export async function generateStaticParams() {
  // This will be populated at build time with your posts
  return [];
}`;
}

function generatePagesRouterPage(vars: TemplateVariables): string {
  return `import { getStaticPropsForPost, getStaticPathsForPosts } from 'chalknotes';
import NotionRenderer from './NotionRenderer';

export const getStaticProps = getStaticPropsForPost;
export const getStaticPaths = getStaticPathsForPosts;

export default function BlogPost({ post }) {
  if (!post) {
    return <div>Post not found</div>;
  }

  return (
    <div className="${getThemeClasses(vars.theme, vars.hasTailwind).container}">
      <main className="${getThemeClasses(vars.theme, vars.hasTailwind).main}">
        <article className="${getThemeClasses(vars.theme, vars.hasTailwind).article}">
          <header className="${getThemeClasses(vars.theme, vars.hasTailwind).header}">
            <h1 className="${getThemeClasses(vars.theme, vars.hasTailwind).title}">
              {post.title}
            </h1>
            {post.publishedAt && (
              <time className="${getThemeClasses(vars.theme, vars.hasTailwind).date}">
                {new Date(post.publishedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </time>
            )}
            {post.tags && post.tags.length > 0 && (
              <div className="${getThemeClasses(vars.theme, vars.hasTailwind).tags}">
                {post.tags.map((tag) => (
                  <span key={tag} className="${getThemeClasses(vars.theme, vars.hasTailwind).tag}">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>
          
          <div className="${getThemeClasses(vars.theme, vars.hasTailwind).content}">
            <NotionRenderer blocks={post.blocks} />
          </div>
        </article>
      </main>
    </div>
  );
}`;
}

function getThemeClasses(theme: string, hasTailwind: boolean) {
  if (!hasTailwind) {
    return {
      container: '',
      main: '',
      article: '',
      header: '',
      title: '',
      date: '',
      tags: '',
      tag: '',
      content: ''
    };
  }

  const baseClasses = {
    container: 'min-h-screen bg-background text-foreground',
    main: 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12',
    article: 'bg-card text-card-foreground rounded-lg border shadow-sm p-8',
    header: 'mb-8 border-b border-border pb-6',
    title: 'text-4xl font-bold mb-4 leading-tight',
    date: 'text-sm text-muted-foreground mb-4 block',
    tags: 'flex flex-wrap gap-2',
    tag: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary',
    content: 'prose prose-lg dark:prose-invert max-w-none'
  };

  switch (theme) {
    case 'minimal':
      return {
        ...baseClasses,
        container: 'min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100',
        main: 'max-w-3xl mx-auto px-6 py-16',
        article: 'bg-white dark:bg-gray-950',
        header: 'mb-12 border-b border-gray-200 dark:border-gray-800 pb-8',
        title: 'text-3xl font-light mb-6 leading-tight tracking-tight',
        date: 'text-sm text-gray-500 dark:text-gray-400 mb-6 block font-mono',
        tag: 'inline-flex items-center px-3 py-1 rounded-md text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
      };

    case 'dev':
      return {
        ...baseClasses,
        container: 'min-h-screen bg-gray-900 text-green-400 font-mono',
        main: 'max-w-5xl mx-auto px-6 py-8',
        article: 'bg-gray-800 border border-green-500/20 rounded-none p-6',
        header: 'mb-8 border-b border-green-500/30 pb-6',
        title: 'text-2xl font-bold mb-4 text-green-300 tracking-wide',
        date: 'text-xs text-green-600 mb-4 block',
        tag: 'inline-flex items-center px-2 py-1 text-xs bg-green-900/50 text-green-300 border border-green-500/30',
        content: 'prose prose-green dark:prose-invert max-w-none prose-code:text-green-300 prose-pre:bg-black prose-pre:border prose-pre:border-green-500/30'
      };

    default: // modern
      return baseClasses;
  }
}

export function generateIndexPage(vars: TemplateVariables): string {
  const routePath = vars.routeBasePath.replace(/^\//, '');
  
  if (vars.isAppRouter) {
    return `import { getAllPosts } from 'chalknotes';
import Link from 'next/link';

export default async function BlogIndex() {
  const posts = await getAllPosts();

  return (
    <div className="${getThemeClasses(vars.theme, vars.hasTailwind).container}">
      <main className="${getThemeClasses(vars.theme, vars.hasTailwind).main}">
        <header className="mb-12">
          <h1 className="${getThemeClasses(vars.theme, vars.hasTailwind).title}">
            Blog
          </h1>
          <p className="text-lg text-muted-foreground mt-4">
            Thoughts, ideas, and tutorials from our team.
          </p>
        </header>

        <div className="space-y-8">
          {posts.map((post) => (
            <article key={post.slug} className="${getThemeClasses(vars.theme, vars.hasTailwind).article}">
              <Link href={\`${vars.routeBasePath}/\${post.slug}\`} className="block">
                <h2 className="text-2xl font-semibold mb-3 hover:text-primary transition-colors">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="text-muted-foreground mb-4 line-clamp-2">
                    {post.excerpt}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  {post.publishedAt && (
                    <time>
                      {new Date(post.publishedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </time>
                  )}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex gap-2">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="${getThemeClasses(vars.theme, vars.hasTailwind).tag}">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            </article>
          ))}
        </div>

        {posts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No blog posts found. Make sure your Notion database has published posts.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}`;
  } else {
    return `import { getAllPosts } from 'chalknotes';
import Link from 'next/link';

export async function getStaticProps() {
  const posts = await getAllPosts();
  return {
    props: { posts }
  };
}

export default function BlogIndex({ posts }) {
  return (
    <div className="${getThemeClasses(vars.theme, vars.hasTailwind).container}">
      <main className="${getThemeClasses(vars.theme, vars.hasTailwind).main}">
        <header className="mb-12">
          <h1 className="${getThemeClasses(vars.theme, vars.hasTailwind).title}">
            Blog
          </h1>
          <p className="text-lg text-muted-foreground mt-4">
            Thoughts, ideas, and tutorials from our team.
          </p>
        </header>

        <div className="space-y-8">
          {posts.map((post) => (
            <article key={post.slug} className="${getThemeClasses(vars.theme, vars.hasTailwind).article}">
              <Link href={\`${vars.routeBasePath}/\${post.slug}\`}>
                <a className="block">
                  <h2 className="text-2xl font-semibold mb-3 hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-muted-foreground mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    {post.publishedAt && (
                      <time>
                        {new Date(post.publishedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </time>
                    )}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex gap-2">
                        {post.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="${getThemeClasses(vars.theme, vars.hasTailwind).tag}">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </a>
              </Link>
            </article>
          ))}
        </div>

        {posts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No blog posts found. Make sure your Notion database has published posts.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}`;
  }
}