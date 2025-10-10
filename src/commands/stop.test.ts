import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type ILogger } from '../utils/logger';
import { type IObsidianUtil } from '../utils/systems/obsidian';
import { createMockLogger, createMockObsidianUtil } from '../utils/test';
import { stop } from './stop';

describe('stop', () => {
  let mockLogger: ILogger;
  let mockObsidianUtil: IObsidianUtil;

  beforeEach(() => {
    mockLogger = createMockLogger();
    mockObsidianUtil = createMockObsidianUtil();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Obsidianを正常に停止', async () => {
    await stop(mockLogger, mockObsidianUtil);

    expect(mockLogger.info).toHaveBeenCalledWith('Stopping Obsidian...');
    expect(mockObsidianUtil.stopObsidian).toHaveBeenCalledWith(mockLogger);
    expect(mockLogger.info).toHaveBeenCalledWith('✓ Obsidian stopped');
  });
});
