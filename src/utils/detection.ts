import * as fs from 'fs-extra';
import * as path from 'path';
import { ProjectDetection } from '../types';

export class ProjectDetector {
  private cwd: string;

  constructor(cwd: string = process.cwd()) {
    this.cwd = cwd;
  }

  async detect(): Promise<ProjectDetection> {
    const [
      isNextJs,
      isAppRouter,
      hasTailwind,
      hasStyledComponents,
      hasCSSModules,
      hasTypeScript,
      packageManager
    ] = await Promise.all([
      this.detectNextJs(),
      this.detectAppRouter(),
      this.detectTailwind(),
      this.detectStyledComponents(),
      this.detectCSSModules(),
      this.detectTypeScript(),
      this.detectPackageManager()
    ]);

    return {
      isNextJs,
      isAppRouter,
      hasTailwind,
      hasStyledComponents,
      hasCSSModules,
      hasTypeScript,
      packageManager
    };
  }

  private async detectNextJs(): Promise<boolean> {
    try {
      const packageJson = await this.readPackageJson();
      return !!(
        packageJson.dependencies?.next ||
        packageJson.devDependencies?.next
      );
    } catch {
      return false;
    }
  }

  private async detectAppRouter(): Promise<boolean> {
    try {
      const appDir = path.join(this.cwd, 'app');
      const pagesDir = path.join(this.cwd, 'pages');
      
      const [appExists, pagesExists] = await Promise.all([
        fs.pathExists(appDir),
        fs.pathExists(pagesDir)
      ]);

      // If both exist, check which has more structure (prefer app router)
      if (appExists && pagesExists) {
        const appContents = await fs.readdir(appDir).catch(() => []);
        const hasAppLayout = (appContents as string[]).includes('layout.tsx') || (appContents as string[]).includes('layout.js');
        return hasAppLayout;
      }

      return appExists;
    } catch {
      return false;
    }
  }

  private async detectTailwind(): Promise<boolean> {
    try {
      const [packageJson, tailwindConfig, hasGlobalCss] = await Promise.all([
        this.readPackageJson(),
        this.hasTailwindConfig(),
        this.hasGlobalTailwindCss()
      ]);

      const hasPackage = !!(
        packageJson.dependencies?.tailwindcss ||
        packageJson.devDependencies?.tailwindcss
      );

      return hasPackage || tailwindConfig || hasGlobalCss;
    } catch {
      return false;
    }
  }

  private async detectStyledComponents(): Promise<boolean> {
    try {
      const packageJson = await this.readPackageJson();
      return !!(
        packageJson.dependencies?.['styled-components'] ||
        packageJson.devDependencies?.['styled-components']
      );
    } catch {
      return false;
    }
  }

  private async detectCSSModules(): Promise<boolean> {
    try {
      const nextConfig = await this.readNextConfig();
      if (nextConfig?.cssModules !== undefined) {
        return nextConfig.cssModules;
      }

      // Check for .module.css files
      const cssFiles = await this.findFiles(['**/*.module.css', '**/*.module.scss']);
      return cssFiles.length > 0;
    } catch {
      return false;
    }
  }

  private async detectTypeScript(): Promise<boolean> {
    try {
      const [hasTsConfig, packageJson] = await Promise.all([
        fs.pathExists(path.join(this.cwd, 'tsconfig.json')),
        this.readPackageJson()
      ]);

      const hasTypescript = !!(
        packageJson.dependencies?.typescript ||
        packageJson.devDependencies?.typescript
      );

      return hasTsConfig || hasTypescript;
    } catch {
      return false;
    }
  }

  private async detectPackageManager(): Promise<'npm' | 'yarn' | 'pnpm' | 'bun'> {
    try {
      const [
        hasYarnLock,
        hasPnpmLock,
        hasBunLock,
        hasPackageLock
      ] = await Promise.all([
        fs.pathExists(path.join(this.cwd, 'yarn.lock')),
        fs.pathExists(path.join(this.cwd, 'pnpm-lock.yaml')),
        fs.pathExists(path.join(this.cwd, 'bun.lockb')),
        fs.pathExists(path.join(this.cwd, 'package-lock.json'))
      ]);

      if (hasBunLock) return 'bun';
      if (hasPnpmLock) return 'pnpm';
      if (hasYarnLock) return 'yarn';
      if (hasPackageLock) return 'npm';

      // Default to npm if no lock files found
      return 'npm';
    } catch {
      return 'npm';
    }
  }

  private async readPackageJson(): Promise<any> {
    const packagePath = path.join(this.cwd, 'package.json');
    const content = await fs.readFile(packagePath, 'utf-8');
    return JSON.parse(content);
  }

  private async readNextConfig(): Promise<any> {
    const configPaths = [
      'next.config.js',
      'next.config.mjs',
      'next.config.ts'
    ];

    for (const configPath of configPaths) {
      try {
        const fullPath = path.join(this.cwd, configPath);
        if (await fs.pathExists(fullPath)) {
          // Simple regex-based extraction for CSS modules config
          const content = await fs.readFile(fullPath, 'utf-8');
          const cssModulesMatch = content.match(/cssModules\s*:\s*(true|false)/);
          if (cssModulesMatch) {
            return { cssModules: cssModulesMatch[1] === 'true' };
          }
        }
      } catch {
        continue;
      }
    }

    return {};
  }

  private async hasTailwindConfig(): Promise<boolean> {
    const configPaths = [
      'tailwind.config.js',
      'tailwind.config.ts',
      'tailwind.config.mjs'
    ];

    for (const configPath of configPaths) {
      if (await fs.pathExists(path.join(this.cwd, configPath))) {
        return true;
      }
    }

    return false;
  }

  private async hasGlobalTailwindCss(): Promise<boolean> {
    const possiblePaths = [
      'app/globals.css',
      'pages/_app.css',
      'styles/globals.css',
      'src/app/globals.css',
      'src/styles/globals.css'
    ];

    for (const cssPath of possiblePaths) {
      try {
        const fullPath = path.join(this.cwd, cssPath);
        if (await fs.pathExists(fullPath)) {
          const content = await fs.readFile(fullPath, 'utf-8');
          if (content.includes('@tailwind')) {
            return true;
          }
        }
      } catch {
        continue;
      }
    }

    return false;
  }

  private async findFiles(patterns: string[]): Promise<string[]> {
    try {
      const glob = require('fast-glob');
      return await glob(patterns, { cwd: this.cwd });
    } catch {
      return [];
    }
  }
}