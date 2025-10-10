import { type ILogger } from '../utils/logger';
import { type IObsidianUtil } from '../utils/systems/obsidian.ts';

/**
 * Obsidianを終了
 */
export const stop = async (logger: ILogger, obsidianUtils: IObsidianUtil): Promise<void> => {
  logger.info('Stopping Obsidian...');

  obsidianUtils.stopObsidian(logger);
  logger.info('✓ Obsidian stopped');
};
