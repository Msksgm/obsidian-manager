import { execSync } from 'node:child_process';

import { type ILogger } from '../logger';

export interface IObsidianUtil {
  stopObsidian: (logger: ILogger) => void;
  startObsidian: (logger: ILogger) => void;
}

export class ObsidianUtil implements IObsidianUtil {
  startObsidian(logger: ILogger): void {
    try {
      execSync('open /Applications/Obsidian.app', { stdio: 'inherit' });
      logger.debug('Executed: open /Applications/Obsidian.app');
    } catch (error) {
      throw new Error(`Failed to open Obsidian: ${error}`);
    }
  }

  stopObsidian(logger: ILogger): void {
    try {
      execSync('pkill -x Obsidian', { stdio: 'inherit' });
      logger.debug('Executed: pkill -x Obsidian');
    } catch {
      // pkillは対象プロセスが存在しない場合もエラーを返すため、
      // エラーを無視するか、必要に応じてログを出力
      logger.debug(`pkill command completed (exit code may indicate no process found)`);
    }
  }
}
