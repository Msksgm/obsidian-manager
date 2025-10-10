import pino, { type LevelWithSilentOrString } from 'pino';
import pinoPretty from 'pino-pretty';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createLogger } from './index.ts';

vi.mock('pino');
vi.mock('pino-pretty');

describe('logger', () => {
  let mockPino: ReturnType<typeof vi.fn>;
  let mockPretty: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockPino = vi.fn((config, stream) => ({ config, stream }));
    mockPretty = vi.fn((options) => options);

    vi.mocked(pino).mockImplementation(mockPino);
    vi.mocked(pinoPretty).mockImplementation(mockPretty);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createLogger', () => {
    it('デフォルトでinforベルのロガーを作成', async () => {
      createLogger();

      expect(mockPino).toHaveBeenCalledWith({ name: 'obsidian-manager', level: 'info' }, expect.any(Object));
    });

    it('指定したレベルでロガーを作成', async () => {
      const level: LevelWithSilentOrString = 'debug';
      createLogger(level);

      expect(mockPino).toHaveBeenCalledWith({ name: 'obsidian-manager', level: 'debug' }, expect.any(Object));
    });

    it('infoレベルの場合、適切な設定でpino-prettyを呼び出す', async () => {
      createLogger('info');

      expect(mockPretty).toHaveBeenCalledWith({
        colorize: false,
        ignore: 'name,time,pid,hostname',
        singleLine: true,
        messageFormat: expect.any(Function),
      });
    });
  });
});
