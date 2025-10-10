import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createConfig } from './index.ts';

describe('config', () => {
  const mockHomedir = '/Users/testuser';
  const mockExecPath = '/Users/testuser/work_space/PersonalDev/obsidian-script/dist/obsidian-manager';
  const originalExecPath = process.execPath;

  beforeEach(() => {
    vi.spyOn(os, 'homedir').mockReturnValue(mockHomedir);
    vi.spyOn(path, 'join').mockImplementation((...args: string[]) => args.join('/'));
    vi.spyOn(path, 'resolve').mockImplementation((...args: string[]) => args.join('/'));
    vi.spyOn(path, 'dirname').mockImplementation((p: string) => {
      const parts = p.split('/');
      parts.pop();
      return parts.join('/');
    });

    Object.defineProperty(process, 'execPath', {
      value: mockExecPath,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(process, 'execPath', {
      value: originalExecPath,
      writable: true,
      configurable: true,
    });
  });

  describe('createConfig', () => {
    it('正しい設定オブジェクトを返すこと', () => {
      const config = createConfig();

      expect(config).toEqual({
        projectRoot: '/Users/testuser/work_space/PersonalDev/obsidian-script/dist/..',
        plist: {
          label: 'com.user.obsidian-manager',
          path: '/Users/testuser/Library/LaunchAgents/com.user.obsidian-manager.plist',
        },
        sleepwatcherPath: '/usr/local/sbin/sleepwatcher',
      });
    });
  });
});
