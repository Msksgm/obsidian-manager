import { execSync } from 'node:child_process';
import fs from 'node:fs';

import type { Config } from '../config';
import { type ILogger } from '../utils/logger';

/**
 * LaunchAgentのステータスを確認
 */
export const status = async (logger: ILogger, config: Config): Promise<void> => {
  const { label, path } = config.plist;

  logger.info('Checking Obsidian Manager LaunchAgent status...');
  logger.info('');

  // plistファイルの存在確認
  const plistExists = fs.existsSync(path);
  logger.info(`Plist file: ${plistExists ? '✓ Installed' : '✗ Not installed'}`);
  logger.info(`  Path: ${path}`);
  logger.info('');

  if (!plistExists) {
    logger.info('Run "install" command to set up LaunchAgent');
    return;
  }

  // LaunchAgentの実行状態を確認
  try {
    const output = execSync(`launchctl list | grep ${label}`, {
      encoding: 'utf-8',
      stdio: 'pipe',
    });

    if (output.trim()) {
      logger.info('LaunchAgent: ✓ Running');
      logger.info('');
      logger.info('Details:');
      logger.info(output.trim());
    }
  } catch {
    logger.info('LaunchAgent: ✗ Not running');
    logger.info('');
    logger.info('The LaunchAgent is installed but not currently running.');
    logger.info('Try reloading it with: launchctl load ' + path);
  }
};
