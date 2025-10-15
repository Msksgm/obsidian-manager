import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Config } from '../config';
import * as dailyNoteModule from '../utils/daily-note';
import * as dateModule from '../utils/date';
import type { ILogger } from '../utils/logger';
import { createMockLogger, createTestConfig } from '../utils/test';
import { nextDay } from './next-day';

vi.mock('../utils/daily-note');
vi.mock('../utils/date');

describe('nextDay', () => {
  let mockLogger: ILogger;
  let mockConfig: Config;
  let mockProcessExit: ReturnType<typeof vi.fn>;
  let mockCreateNextDayNote: ReturnType<typeof vi.fn>;
  let mockParseDate: ReturnType<typeof vi.fn>;
  let mockFormatDate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockLogger = createMockLogger();
    mockConfig = createTestConfig({
      obsidian: {
        valutePath: '/path/to/vault',
      },
    });

    mockCreateNextDayNote = vi.fn();
    mockParseDate = vi.fn();
    mockFormatDate = vi.fn();

    vi.mocked(dailyNoteModule.createNextDayNote).mockImplementation(mockCreateNextDayNote);
    vi.mocked(dateModule.parseDate).mockImplementation(mockParseDate);
    vi.mocked(dateModule.formatDate).mockImplementation(mockFormatDate);

    mockProcessExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never) as ReturnType<
      typeof vi.fn
    >;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('バリデーションエラー', () => {
    it('dateオプションが未定義の場合、エラーを表示してプロセスを終了', async () => {
      const options = {
        path: '/path/to/vault',
      };

      await nextDay(mockLogger, mockConfig, options);

      expect(mockLogger.error).toHaveBeenCalledWith('Date option is required');
      expect(mockLogger.info).toHaveBeenCalledWith('Usage: obsidian-manager next-day --date YYYY-MM-DD');
      expect(mockLogger.info).toHaveBeenCalledWith('Example: obsidian-manager next-day --date 2025-10-12');
      expect(mockProcessExit).toHaveBeenCalledWith(1);
      expect(mockCreateNextDayNote).not.toHaveBeenCalled();
    });

    it('pathオプションが未定義の場合、エラーを表示してプロセスを終了', async () => {
      const options = {
        date: '2025-10-12',
      };

      await nextDay(mockLogger, mockConfig, options);

      expect(mockLogger.error).toHaveBeenCalledWith('Obsidian vault path option is required');
      expect(mockLogger.info).toHaveBeenCalledWith('Usage: obsidian-manager next-day --obsidianVaultPath /path/to/vault');
      expect(mockLogger.info).toHaveBeenCalledWith('Example: obsidian-manager next-day --obsidianVaultPath ~/Documents/Obsidian/Vault');
      expect(mockProcessExit).toHaveBeenCalledWith(1);
      expect(mockCreateNextDayNote).not.toHaveBeenCalled();
    });

    it('日付フォーマットが無効な場合、エラーを表示してプロセスを終了', async () => {
      const options = {
        date: 'invalid-date',
        path: '/path/to/vault',
      };

      mockParseDate.mockImplementation(() => {
        throw new Error('Invalid date format');
      });

      await nextDay(mockLogger, mockConfig, options);

      expect(mockParseDate).toHaveBeenCalledWith('invalid-date');
      expect(mockLogger.error).toHaveBeenCalledWith('Invalid date format: invalid-date');
      expect(mockLogger.info).toHaveBeenCalledWith('Expected format: YYYY-MM-DD (e.g., 2025-10-12)');
      expect(mockProcessExit).toHaveBeenCalledWith(1);
      expect(mockCreateNextDayNote).not.toHaveBeenCalled();
    });
  });

  describe('正常系', () => {
    it('次の日のデイリーノートを正常に作成', async () => {
      const options = {
        date: '2025-10-12',
        path: '/path/to/vault',
      };

      const mockDate = new Date('2025-10-12');
      mockParseDate.mockReturnValue(mockDate);
      mockFormatDate.mockReturnValue('2025-10-12');
      mockCreateNextDayNote.mockReturnValue('/path/to/vault/daily/2025-10-13.md');

      await nextDay(mockLogger, mockConfig, options);

      expect(mockParseDate).toHaveBeenCalledWith('2025-10-12');
      expect(mockLogger.debug).toHaveBeenCalledWith('Using specified base date: 2025-10-12');
      expect(mockLogger.info).toHaveBeenCalledWith('Creating next day note based on 2025-10-12...');
      expect(mockCreateNextDayNote).toHaveBeenCalledWith(mockLogger, mockDate, '/path/to/vault');
      expect(mockLogger.info).toHaveBeenCalledWith('✓ Successfully created: /path/to/vault/daily/2025-10-13.md');
      expect(mockProcessExit).not.toHaveBeenCalled();
    });
  });

  describe('エラーハンドリング', () => {
    it('createNextDayNoteがErrorを投げた場合、エラーメッセージを表示してプロセスを終了', async () => {
      const options = {
        date: '2025-10-12',
        path: '/path/to/vault',
      };

      const mockDate = new Date('2025-10-12');
      mockParseDate.mockReturnValue(mockDate);
      mockFormatDate.mockReturnValue('2025-10-12');
      mockCreateNextDayNote.mockImplementation(() => {
        throw new Error('Base date file not found');
      });

      await nextDay(mockLogger, mockConfig, options);

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to create next day note: Base date file not found');
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    it('createNextDayNoteがError以外を投げた場合、文字列に変換してエラーメッセージを表示', async () => {
      const options = {
        date: '2025-10-12',
        path: '/path/to/vault',
      };

      const mockDate = new Date('2025-10-12');
      mockParseDate.mockReturnValue(mockDate);
      mockFormatDate.mockReturnValue('2025-10-12');
      mockCreateNextDayNote.mockImplementation(() => {
        throw 'Unexpected error string';
      });

      await nextDay(mockLogger, mockConfig, options);

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to create next day note: Unexpected error string');
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    it('createNextDayNoteがオブジェクトを投げた場合、文字列に変換してエラーメッセージを表示', async () => {
      const options = {
        date: '2025-10-12',
        path: '/path/to/vault',
      };

      const mockDate = new Date('2025-10-12');
      mockParseDate.mockReturnValue(mockDate);
      mockFormatDate.mockReturnValue('2025-10-12');
      const errorObj = { code: 'ENOENT', message: 'File not found' };
      mockCreateNextDayNote.mockImplementation(() => {
        throw errorObj;
      });

      await nextDay(mockLogger, mockConfig, options);

      expect(mockLogger.error).toHaveBeenCalledWith(`Failed to create next day note: ${String(errorObj)}`);
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });
  });
});