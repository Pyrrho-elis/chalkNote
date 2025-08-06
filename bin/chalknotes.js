#!/usr/bin/env node

const { Command } = require('commander');
const path = require('path');

const program = new Command();

program
  .name('chalknotes')
  .description('Transform your Notion pages into beautiful developer blogs')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize ChalkNotes in your Next.js project')
  .option('-f, --force', 'overwrite existing configuration')
  .action(async (options) => {
    const { init } = require('../dist/commands/init.js');
    await init(options);
  });

program
  .command('scaffold')
  .description('Generate blog pages and components')
  .option('-t, --theme <theme>', 'specify theme to use')
  .action(async (options) => {
    const { scaffold } = require('../dist/commands/scaffold.js');
    await scaffold(options);
  });

program.parse();