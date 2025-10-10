import { type ILogger } from '../utils/logger';
import { type IObsidianUtil } from '../utils/systems/obsidian.ts';

/**
 * Obsidianを起動
 */
export const start = async (logger: ILogger, obsidianUtil: IObsidianUtil): Promise<void> => {
  logger.info('Starting Obsidian...');

  try {
    obsidianUtil.startObsidian(logger);
    logger.info('✓ Obsidian started');
  } catch (error) {
    logger.error(`Failed to start Obsidian: ${error}`);
    process.exit(1);
  }
};
