import * as fs from 'fs';
import * as path from 'path';
import { ProjectDetector } from '../utils/detection';
import { ConfigManager } from '../utils/config';
import { Logger } from '../utils/logger';
import { generateNotionRenderer, generateCSSModules } from '../templates/components';
import { generateBlogPage, generateIndexPage } from '../templates/pages';
import { TemplateVariables } from '../types';

interface ScaffoldOptions {
  theme?: string;
}

export async function scaffold(options: ScaffoldOptions = {}): Promise<void> {
  Logger.title('Scaffolding ChalkNotes Blog');

  try {
    // Step 1: Load configuration
    Logger.step(1, 6, 'Loading configuration...');
    const configManager = new ConfigManager();
    
    if (!configManager.exists()) {
      Logger.error('Configuration file not found. Please run "chalknotes init" first.');
      process.exit(1);
    }

    const config = await configManager.load();
    if (!config) {
      Logger.error('Failed to load configuration.');
      process.exit(1);
    }

    // Override theme if provided
    if (options.theme) {
      config.theme = options.theme as any;
    }

    // Step 2: Detect project structure
    Logger.step(2, 6, 'Detecting project structure...');
    const detector = new ProjectDetector();
    const detection = await detector.detect();

    if (!detection.isNextJs) {
      Logger.error('Next.js project not detected. ChalkNotes requires Next.js.');
      process.exit(1);
    }

    Logger.success(`Project structure detected: ${detection.isAppRouter ? 'App Router' : 'Pages Router'}`);

    // Step 3: Prepare template variables
    Logger.step(3, 6, 'Preparing templates...');
    const templateVars: TemplateVariables = {
      routeBasePath: config.routeBasePath,
      theme: config.theme,
      hasTypeScript: detection.hasTypeScript,
      hasTailwind: detection.hasTailwind,
      isAppRouter: detection.isAppRouter,
      cssFramework: getCSSFramework(detection)
    };

    // Step 4: Create directory structure
    Logger.step(4, 6, 'Creating directory structure...');
    const blogDir = await createDirectoryStructure(config.routeBasePath, detection.isAppRouter);

    // Step 5: Generate components and pages
    Logger.step(5, 6, 'Generating components and pages...');
    await generateFiles(blogDir, templateVars, detection);

    // Step 6: Install dependencies if needed
    Logger.step(6, 6, 'Checking dependencies...');
    await checkAndInstallDependencies(detection);

    Logger.success('Blog scaffolding completed successfully!');
    Logger.section('Generated files:');
    
    if (detection.isAppRouter) {
      Logger.info(`✓ app${config.routeBasePath}/page.${detection.hasTypeScript ? 'tsx' : 'jsx'} (Blog index)`);
      Logger.info(`✓ app${config.routeBasePath}/[slug]/page.${detection.hasTypeScript ? 'tsx' : 'jsx'} (Blog post)`);
      Logger.info(`✓ app${config.routeBasePath}/[slug]/NotionRenderer.${detection.hasTypeScript ? 'tsx' : 'jsx'}`);
    } else {
      Logger.info(`✓ pages${config.routeBasePath}/index.${detection.hasTypeScript ? 'tsx' : 'jsx'} (Blog index)`);
      Logger.info(`✓ pages${config.routeBasePath}/[slug].${detection.hasTypeScript ? 'tsx' : 'jsx'} (Blog post)`);
      Logger.info(`✓ pages${config.routeBasePath}/NotionRenderer.${detection.hasTypeScript ? 'tsx' : 'jsx'}`);
    }

    if (templateVars.cssFramework === 'css-modules') {
      Logger.info(`✓ NotionRenderer.module.css`);
    }

    Logger.section('Next steps:');
    Logger.info('1. Add your Notion credentials to .env file');
    Logger.info('2. Start your development server');
    Logger.info(`3. Visit ${config.routeBasePath} to see your blog`);

  } catch (error) {
    Logger.error(`Scaffolding failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

function getCSSFramework(detection: any): 'tailwind' | 'styled-components' | 'css-modules' | 'none' {
  if (detection.hasTailwind) return 'tailwind';
  if (detection.hasStyledComponents) return 'styled-components';
  if (detection.hasCSSModules) return 'css-modules';
  return 'none';
}

async function createDirectoryStructure(routeBasePath: string, isAppRouter: boolean): Promise<string> {
  const routePath = routeBasePath.replace(/^\//, '');
  const baseDir = isAppRouter ? 'app' : 'pages';
  const blogDir = path.join(process.cwd(), baseDir, routePath);

  // Create the main blog directory
  await fs.promises.mkdir(blogDir, { recursive: true });

  if (isAppRouter) {
    // Create [slug] directory for App Router
    const slugDir = path.join(blogDir, '[slug]');
    await fs.promises.mkdir(slugDir, { recursive: true });
    return slugDir;
  }

  return blogDir;
}

async function generateFiles(
  blogDir: string, 
  templateVars: TemplateVariables, 
  detection: any
): Promise<void> {
  const ext = templateVars.hasTypeScript ? 'tsx' : 'jsx';
  const isAppRouter = templateVars.isAppRouter;

  // Generate NotionRenderer component
  const rendererContent = generateNotionRenderer(templateVars);
  const rendererPath = path.join(blogDir, `NotionRenderer.${ext}`);
  await fs.promises.writeFile(rendererPath, rendererContent);

  // Generate CSS Modules file if needed
  if (templateVars.cssFramework === 'css-modules') {
    const cssContent = generateCSSModules();
    const cssPath = path.join(blogDir, 'NotionRenderer.module.css');
    await fs.promises.writeFile(cssPath, cssContent);
  }

  if (isAppRouter) {
    // App Router structure
    const parentDir = path.dirname(blogDir);
    
    // Generate blog index page
    const indexContent = generateIndexPage(templateVars);
    const indexPath = path.join(parentDir, `page.${ext}`);
    await fs.promises.writeFile(indexPath, indexContent);

    // Generate individual blog post page
    const postContent = generateBlogPage(templateVars);
    const postPath = path.join(blogDir, `page.${ext}`);
    await fs.promises.writeFile(postPath, postContent);

  } else {
    // Pages Router structure
    // Generate blog index page
    const indexContent = generateIndexPage(templateVars);
    const indexPath = path.join(blogDir, `index.${ext}`);
    await fs.promises.writeFile(indexPath, indexContent);

    // Generate individual blog post page
    const postContent = generateBlogPage(templateVars);
    const postPath = path.join(blogDir, `[slug].${ext}`);
    await fs.promises.writeFile(postPath, postContent);
  }
}

async function checkAndInstallDependencies(detection: any): Promise<void> {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  try {
    const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf-8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

    const requiredDeps = ['chalknotes'];
    const missingDeps = requiredDeps.filter(dep => !dependencies[dep]);

    if (missingDeps.length > 0) {
      Logger.warn(`Missing dependencies: ${missingDeps.join(', ')}`);
      Logger.info(`Please install them with: ${detection.packageManager} install ${missingDeps.join(' ')}`);
    }

    // Check for optional but recommended dependencies
    if (!dependencies['@types/node'] && detection.hasTypeScript) {
      Logger.info(`Recommendation: Install @types/node for better TypeScript support`);
    }

  } catch (error) {
    Logger.warn('Could not check dependencies. Please ensure chalknotes is installed.');
  }
}