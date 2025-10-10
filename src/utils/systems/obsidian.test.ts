import { execSync } from 'node:child_process';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type ILogger } from '../logger';
import { ObsidianUtil } from './obsidian';

vi.mock('node:child_process');

describe('ObsidianUtil', () => {
  let obsidianUtil: ObsidianUtil;
  let mockLogger: ILogger;
  let mockExecSync: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    obsidianUtil = new ObsidianUtil();
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      fatal: vi.fn(),
      trace: vi.fn(),
    } as ILogger;

    mockExecSync = vi.fn();
    vi.mocked(execSync).mockImplementation(mockExecSync);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('startObsidian', () => {
    it('Obsidianを起動するコマンドを実行', () => {
      obsidianUtil.startObsidian(mockLogger);

      expect(mockExecSync).toHaveBeenCalledWith('open /Applications/Obsidian.app', { stdio: 'inherit' });
      expect(mockLogger.debug).toHaveBeenCalledWith('Executed: open /Applications/Obsidian.app');
    });

    it('コマンド実行に失敗した場合、エラーをスロー', () => {
      const error = new Error('Command failed');
      mockExecSync.mockImplementation(() => {
        throw error;
      });

      expect(() => obsidianUtil.startObsidian(mockLogger)).toThrow('Failed to open Obsidian: Error: Command failed');
    });
  });

  describe('stopObsidian', () => {
    it('Obsidianを停止するコマンドを実行', () => {
      obsidianUtil.stopObsidian(mockLogger);

      expect(mockExecSync).toHaveBeenCalledWith('pkill -x Obsidian', { stdio: 'inherit' });
      expect(mockLogger.debug).toHaveBeenCalledWith('Executed: pkill -x Obsidian');
    });

    it('pkillがエラーを返した場合、エラーをキャッチして適切にログ出力', () => {
      const error = new Error('No such process');
      mockExecSync.mockImplementation(() => {
        throw error;
      });

      expect(() => obsidianUtil.stopObsidian(mockLogger)).not.toThrow();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'pkill command completed (exit code may indicate no process found)',
      );
    });
  });
});
