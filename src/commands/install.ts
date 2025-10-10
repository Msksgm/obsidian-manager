import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import type { Config } from '../config';
import { type ILogger } from '../utils/logger';
import { generatePlist } from '../utils/plist';

/**
 * LaunchAgentをインストール
 */
export const install = async (logger: ILogger, config: Config): Promise<void> => {
  const { sleepwatcherPath, projectRoot } = config;
  logger.info('Installing Obsidian Manager LaunchAgent...');

  // sleepwatcherがインストールされているか確認
  try {
    execSync(`which ${sleepwatcherPath}`, { stdio: 'pipe' });
  } catch {
    logger.error('sleepwatcher is not installed. Please install it first:');
    logger.info('  brew install sleepwatcher');
    process.exit(1);
  }

  // CLIバイナリのパスを取得
  const cliPath = path.join(projectRoot, 'dist', 'obsidian-manager');

  // ラッパースクリプトを生成
  const sleepScript = `${cliPath} stop`;
  const wakeScript = `${cliPath} start`;

  // plistを生成
  const plistContent = generatePlist({
    config,
    sleepScript,
    wakeScript,
  });

  const plistPath = config.plist.path;
  // LaunchAgentsディレクトリが存在しない場合は作成
  const launchAgentsDir = path.dirname(plistPath);
  if (!fs.existsSync(launchAgentsDir)) {
    fs.mkdirSync(launchAgentsDir, { recursive: true });
    logger.debug(`Created directory: ${launchAgentsDir}`);
  }

  // 既に同じラベルのplistが存在する場合は先にアンロード
  if (fs.existsSync(plistPath)) {
    logger.warn(`LaunchAgent already exists. Unloading first...`);
    try {
      execSync(`launchctl unload "${plistPath}"`, { stdio: 'pipe' });
    } catch {
      // unloadに失敗しても続行
    }
  }

  // plistファイルを書き込み
  try {
    fs.writeFileSync(plistPath, plistContent, 'utf-8');
    logger.debug(`Created plist file: ${plistPath}`);
  } catch (error) {
    logger.error(`Failed to write plist file: ${error}`);
    process.exit(1);
  }

  // LaunchAgentをロード
  try {
    execSync(`launchctl load "${plistPath}"`, { stdio: 'pipe' });
    logger.info('✓ LaunchAgent loaded successfully');
  } catch (error) {
    logger.error(`Failed to load LaunchAgent: ${error}`);
    process.exit(1);
  }

  logger.info('Installation complete!');
  logger.info(`- CLI binary: ${cliPath}`);
  logger.info(`- Sleep script: ${sleepScript}`);
  logger.info(`- Wake script: ${wakeScript}`);
  logger.info(`- Plist: ${plistPath}`);
};
