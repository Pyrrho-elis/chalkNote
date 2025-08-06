#!/usr/bin/env node

const { program } = require('commander');
const { init } = require('../dist/commands/init');
const { scaffold } = require('../dist/commands/scaffold');
const { version } = require('../package.json');

program
  .name('chalknotes')
  .description('Transform your Notion pages into beautiful developer blogs')
  .version(version);

program
  .command('init')
  .description('Initialize ChalkNotes in your Next.js project')
  .option('-f, --force', 'Force initialization even if config exists')
  .action(init);

program
  .command('scaffold')
  .description('Scaffold blog pages and components')
  .option('-t, --theme <theme>', 'Theme to use (modern, minimal, dev)', 'modern')
  .action(scaffold);

// Default command - run init if no command specified
program
  .action(() => {
    init();
  });

program.parse();