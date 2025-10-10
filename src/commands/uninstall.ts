import { execSync } from 'node:child_process';
import fs from 'node:fs';

import type { Config } from '../config';
import { type ILogger } from '../utils/logger';

/**
 * LaunchAgentをアンインストール
 */
export const uninstall = async (logger: ILogger, config: Config): Promise<void> => {
  logger.info('Uninstalling Obsidian Manager LaunchAgent...');

  const plistPath = config.plist.path;

  // plistファイルが存在するか確認
  if (!fs.existsSync(plistPath)) {
    logger.warn(`LaunchAgent not found: ${plistPath}`);
    logger.info('Nothing to uninstall.');
    return;
  }

  // LaunchAgentをアンロード
  try {
    execSync(`launchctl unload "${plistPath}"`, { stdio: 'pipe' });
    logger.debug('LaunchAgent unloaded');
  } catch (error) {
    logger.warn(`Failed to unload LaunchAgent (it may not be running): ${error}`);
    // 続行
  }

  // plistファイルを削除
  try {
    fs.unlinkSync(plistPath);
    logger.info('✓ LaunchAgent removed successfully');
  } catch (error) {
    logger.error(`Failed to remove plist file: ${error}`);
    process.exit(1);
  }

  logger.info('Uninstallation complete!');
};
