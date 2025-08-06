import * as fs from 'fs';
import * as path from 'path';
import { ProjectDetector } from '../utils/detection';
import { ConfigManager } from '../utils/config';
import { Logger } from '../utils/logger';
import { ChalkNotesConfig } from '../types';

const inquirer = require('inquirer');

interface InitOptions {
  force?: boolean;
}

export async function init(options: InitOptions = {}): Promise<void> {
  Logger.title('ChalkNotes Setup');

  try {
    // Step 1: Project Detection
    Logger.step(1, 4, 'Detecting project configuration...');
    const detector = new ProjectDetector();
    const detection = await detector.detect();

    if (!detection.isNextJs) {
      Logger.error('ChalkNotes requires a Next.js project. Please run this command in a Next.js project directory.');
      process.exit(1);
    }

    Logger.success(`Next.js project detected (${detection.isAppRouter ? 'App Router' : 'Pages Router'})`);
    Logger.info(`CSS Framework: ${getCSSFramework(detection)}`);
    Logger.info(`TypeScript: ${detection.hasTypeScript ? 'Yes' : 'No'}`);
    Logger.info(`Package Manager: ${detection.packageManager}`);

    // Step 2: Check existing configuration
    Logger.step(2, 4, 'Checking existing configuration...');
    const configManager = new ConfigManager();
    
    if (configManager.exists() && !options.force) {
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: 'Configuration file already exists. Do you want to overwrite it?',
          default: false
        }
      ]);

      if (!overwrite) {
        Logger.info('Configuration kept unchanged. Run with --force to overwrite.');
        return;
      }
    }

    // Step 3: Environment setup
    Logger.step(3, 4, 'Setting up environment variables...');
    await setupEnvironment();

    // Step 4: Create configuration
    Logger.step(4, 4, 'Creating configuration...');
    const config = await createConfiguration(detection);
    await configManager.save(config);

    Logger.success('ChalkNotes initialized successfully!');
    Logger.section('Next steps:');
    Logger.info('1. Add your Notion credentials to .env file');
    Logger.info('2. Configure plugins in blog.config.js (optional)');
    Logger.info('3. Run "chalknotes scaffold" to generate your blog pages');
    Logger.info('4. Start your development server to see your blog');
    
    Logger.section('Built-in plugins available:');
    Logger.info('Use %%CommentSection, %%TableOfContents, %%Share, %%ReadingTime in your Notion content');

  } catch (error) {
    Logger.error(`Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

function getCSSFramework(detection: any): string {
  if (detection.hasTailwind) return 'Tailwind CSS';
  if (detection.hasStyledComponents) return 'Styled Components';
  if (detection.hasCSSModules) return 'CSS Modules';
  return 'None detected';
}

async function setupEnvironment(): Promise<void> {
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');

  // Check if .env exists
  if (!fs.existsSync(envPath)) {
    const envContent = `# ChalkNotes Configuration
NOTION_TOKEN=
NOTION_DATABASE_ID=
`;
    await fs.promises.writeFile(envPath, envContent);
    Logger.success('Created .env file with ChalkNotes variables');
  } else {
    // Check if ChalkNotes variables exist
    const envContent = await fs.promises.readFile(envPath, 'utf-8');
    
    let needsUpdate = false;
    let updatedContent = envContent;

    if (!envContent.includes('NOTION_TOKEN=')) {
      updatedContent += '\n# ChalkNotes Configuration\nNOTION_TOKEN=\n';
      needsUpdate = true;
    }

    if (!envContent.includes('NOTION_DATABASE_ID=')) {
      updatedContent += 'NOTION_DATABASE_ID=\n';
      needsUpdate = true;
    }

    if (needsUpdate) {
      await fs.promises.writeFile(envPath, updatedContent);
      Logger.success('Added ChalkNotes variables to existing .env file');
    }
  }

  // Create .env.example if it doesn't exist
  if (!fs.existsSync(envExamplePath)) {
    const exampleContent = `# ChalkNotes Configuration
NOTION_TOKEN=secret_...
NOTION_DATABASE_ID=...
`;
    await fs.promises.writeFile(envExamplePath, exampleContent);
  }
}

async function createConfiguration(detection: any): Promise<ChalkNotesConfig> {
  const questions = [
    {
      type: 'input',
      name: 'routeBasePath',
      message: 'What should be the base path for your blog?',
      default: '/blog',
      validate: (input: string) => {
        if (!input.startsWith('/')) {
          return 'Base path must start with /';
        }
        return true;
      }
    },
    {
      type: 'list',
      name: 'theme',
      message: 'Choose a theme:',
      choices: [
        { name: 'Modern - Clean and contemporary design', value: 'modern' },
        { name: 'Minimal - Simple and focused layout', value: 'minimal' },
        { name: 'Dev - Developer-focused with code highlighting', value: 'dev' }
      ],
      default: 'modern'
    },

    {
      type: 'confirm',
      name: 'enableCaching',
      message: 'Enable intelligent caching for better performance?',
      default: true
    },
    {
      type: 'confirm',
      name: 'enableErrorBoundaries',
      message: 'Enable error boundaries for better reliability?',
      default: true
    }
  ];

  const answers = await inquirer.prompt(questions);

  return {
    notionToken: process.env.NOTION_TOKEN || '',
    notionDatabaseId: process.env.NOTION_DATABASE_ID || '',
    routeBasePath: answers.routeBasePath,
    theme: answers.theme,
    plugins: [], // Empty by default, user can add in config file
    caching: {
      enabled: answers.enableCaching,
      ttl: 3600
    },
    errorBoundaries: answers.enableErrorBoundaries
  };
}