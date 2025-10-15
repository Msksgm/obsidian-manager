#!/usr/bin/env node

import { Command } from 'commander';

import { install } from './commands/install';
import { nextDay } from './commands/next-day';
import { start } from './commands/start';
import { status } from './commands/status';
import { stop } from './commands/stop';
import { uninstall } from './commands/uninstall';
import { createConfig } from './config';
import { createLogger } from './utils/logger';
import { ObsidianUtil } from './utils/systems/obsidian.ts';

const main = async () => {
  const program = new Command();

  // デバッグモードの確認
  const logLevel = process.argv.includes('--debug') ? 'debug' : 'info';
  const logger = createLogger(logLevel);

  const config = createConfig();
  const obsidianUtil = new ObsidianUtil();

  program
    .name('obsidian-manager')
    .description('Manage Obsidian app with sleep/wake events')
    .version('1.0.0')
    .option('--debug', 'Enable debug logging');

  program
    .command('install')
    .description('Install LaunchAgent to manage Obsidian on sleep/wake')
    .action(async () => {
      await install(logger, config);
    });

  program
    .command('uninstall')
    .description('Uninstall LaunchAgent')
    .action(async () => {
      await uninstall(logger, config);
    });

  program
    .command('status')
    .description('Check LaunchAgent status')
    .action(async () => {
      await status(logger, config);
    });

  program
    .command('start')
    .description('Manually start Obsidian')
    .action(async () => {
      await start(logger, obsidianUtil);
    });

  program
    .command('stop')
    .description('Manually stop Obsidian')
    .action(async () => {
      await stop(logger, obsidianUtil);
    });

  program
    .command('next-day')
    .description('Create next day daily note with TODOs from previous day')
    .option('-d, --date <YYYY-MM-DD>', 'Base date (required)')
    .option('-p, --path <path>', 'Obsidian Vault path (required)')
    .action(async (options) => {
      await nextDay(logger, config, options);
    });

  await program.parseAsync(process.argv);
};

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
