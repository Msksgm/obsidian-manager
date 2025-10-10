import { execSync } from 'node:child_process';
import fs from 'node:fs';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type ILogger } from '../utils/logger';
import { createMockLogger, createTestConfig } from '../utils/test';
import { status } from './status';

vi.mock('node:child_process');
vi.mock('node:fs');

describe('status', () => {
  let mockLogger: ILogger;
  let mockExecSync: ReturnType<typeof vi.fn>;
  let mockExistsSync: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockLogger = createMockLogger();
    mockExecSync = vi.fn();
    mockExistsSync = vi.fn();

    vi.mocked(execSync).mockImplementation(mockExecSync);
    vi.mocked(fs.existsSync).mockImplementation(mockExistsSync);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('plistファイルが存在せず、LaunchAgentがインストールされていない場合', async () => {
    const config = createTestConfig({
      plist: {
        label: 'com.test.obsidian',
        path: '/path/to/plist',
      },
    });

    mockExistsSync.mockReturnValue(false);

    await status(mockLogger, config);

    expect(mockLogger.info).toHaveBeenCalledWith('Checking Obsidian Manager LaunchAgent status...');
    expect(mockLogger.info).toHaveBeenCalledWith('Plist file: ✗ Not installed');
    expect(mockLogger.info).toHaveBeenCalledWith('  Path: /path/to/plist');
    expect(mockLogger.info).toHaveBeenCalledWith('Run "install" command to set up LaunchAgent');
    expect(mockExecSync).not.toHaveBeenCalled();
  });

  it('plistファイルが存在し、LaunchAgentが実行中の場合', async () => {
    const config = createTestConfig({
      plist: {
        label: 'com.test.obsidian',
        path: '/path/to/plist',
      },
    });

    mockExistsSync.mockReturnValue(true);
    mockExecSync.mockReturnValue('12345\t0\tcom.test.obsidian\n');

    await status(mockLogger, config);

    expect(mockLogger.info).toHaveBeenCalledWith('Checking Obsidian Manager LaunchAgent status...');
    expect(mockLogger.info).toHaveBeenCalledWith('Plist file: ✓ Installed');
    expect(mockLogger.info).toHaveBeenCalledWith('  Path: /path/to/plist');
    expect(mockLogger.info).toHaveBeenCalledWith('LaunchAgent: ✓ Running');
    expect(mockLogger.info).toHaveBeenCalledWith('Details:');
    expect(mockLogger.info).toHaveBeenCalledWith('12345\t0\tcom.test.obsidian');
    expect(mockExecSync).toHaveBeenCalledWith('launchctl list | grep com.test.obsidian', {
      encoding: 'utf-8',
      stdio: 'pipe',
    });
  });

  it('plistファイルが存在するが、LaunchAgentが実行されていない場合', async () => {
    const config = createTestConfig({
      plist: {
        label: 'com.test.obsidian',
        path: '/path/to/plist',
      },
    });

    mockExistsSync.mockReturnValue(true);
    mockExecSync.mockImplementation(() => {
      throw new Error('No such process');
    });

    await status(mockLogger, config);

    expect(mockLogger.info).toHaveBeenCalledWith('Checking Obsidian Manager LaunchAgent status...');
    expect(mockLogger.info).toHaveBeenCalledWith('Plist file: ✓ Installed');
    expect(mockLogger.info).toHaveBeenCalledWith('  Path: /path/to/plist');
    expect(mockLogger.info).toHaveBeenCalledWith('LaunchAgent: ✗ Not running');
    expect(mockLogger.info).toHaveBeenCalledWith('The LaunchAgent is installed but not currently running.');
    expect(mockLogger.info).toHaveBeenCalledWith('Try reloading it with: launchctl load /path/to/plist');
  });
});
