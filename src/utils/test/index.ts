import deepmerge from 'deepmerge';
import { vi } from 'vitest';

import { type Config, createConfig } from '../../config';
import { type ILogger } from '../logger';
import { type IObsidianUtil } from '../systems/obsidian';

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export const createTestConfig = (overrides?: DeepPartial<Config>): Config => {
  const config = createConfig();

  if (!overrides) {
    return config;
  }

  return deepmerge(config, overrides as Partial<Config>) as Config;
};

export const createMockLogger = (): ILogger => {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    trace: vi.fn(),
  } as ILogger;
};

export const createMockObsidianUtil = (): IObsidianUtil => {
  return {
    startObsidian: vi.fn(),
    stopObsidian: vi.fn(),
  } as IObsidianUtil;
};
