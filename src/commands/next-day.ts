import type { Config } from '../config';
import { createNextDayNote } from '../utils/daily-note';
import { formatDate, parseDate } from '../utils/date';
import type { ILogger } from '../utils/logger';

interface NextDayOptions {
  date?: string;
  path?: string;
}

/**
 * 次の日のデイリーノートを作成するコマンド
 */
export const nextDay = async (logger: ILogger, config: Config, options: NextDayOptions): Promise<void> => {
  // date オプションが未定義の場合はバリデーションエラー
  if (!options.date) {
    logger.error('Date option is required');
    logger.info('Usage: obsidian-manager next-day --date YYYY-MM-DD');
    logger.info('Example: obsidian-manager next-day --date 2025-10-12');
    process.exit(1);
    return;
  }

  // obsidianVaultPath オプションが未定義の場合はバリデーションエラー
  if (!options.path) {
    logger.error('Obsidian vault path option is required');
    logger.info('Usage: obsidian-manager next-day --obsidianVaultPath /path/to/vault');
    logger.info('Example: obsidian-manager next-day --obsidianVaultPath ~/Documents/Obsidian/Vault');
    process.exit(1);
    return;
  }

  // 引数で指定された日付をパース
  let baseDate: Date;
  try {
    baseDate = parseDate(options.date);
    logger.debug(`Using specified base date: ${options.date}`);
  } catch {
    logger.error(`Invalid date format: ${options.date}`);
    logger.info('Expected format: YYYY-MM-DD (e.g., 2025-10-12)');
    process.exit(1);
    return;
  }

  try {
    logger.info(`Creating next day note based on ${formatDate(baseDate)}...`);

    // デイリーノートを作成
    const createdFilePath = createNextDayNote(logger, baseDate, options.path);

    logger.info(`✓ Successfully created: ${createdFilePath}`);
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Failed to create next day note: ${error.message}`);
    } else {
      logger.error(`Failed to create next day note: ${String(error)}`);
    }
    process.exit(1);
    return;
  }
};
