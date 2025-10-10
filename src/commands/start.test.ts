import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type ILogger } from '../utils/logger';
import { type IObsidianUtil } from '../utils/systems/obsidian';
import { createMockLogger, createMockObsidianUtil } from '../utils/test';
import { start } from './start';

describe('start', () => {
  let mockLogger: ILogger;
  let mockObsidianUtil: IObsidianUtil;
  let mockProcessExit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockLogger = createMockLogger();
    mockObsidianUtil = createMockObsidianUtil();
    mockProcessExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never) as ReturnType<
      typeof vi.fn
    >;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Obsidianを正常に起動', async () => {
    await start(mockLogger, mockObsidianUtil);

    expect(mockLogger.info).toHaveBeenCalledWith('Starting Obsidian...');
    expect(mockObsidianUtil.startObsidian).toHaveBeenCalledWith(mockLogger);
    expect(mockLogger.info).toHaveBeenCalledWith('✓ Obsidian started');
    expect(mockProcessExit).not.toHaveBeenCalled();
  });

  it('Obsidianの起動に失敗した場合、エラーログを出力してプロセスを終了', async () => {
    const error = new Error('Failed to open Obsidian');
    vi.mocked(mockObsidianUtil.startObsidian).mockImplementation(() => {
      throw error;
    });

    await start(mockLogger, mockObsidianUtil);

    expect(mockLogger.info).toHaveBeenCalledWith('Starting Obsidian...');
    expect(mockObsidianUtil.startObsidian).toHaveBeenCalledWith(mockLogger);
    expect(mockLogger.error).toHaveBeenCalledWith('Failed to start Obsidian: Error: Failed to open Obsidian');
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });
});
