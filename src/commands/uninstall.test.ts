import { execSync } from 'node:child_process';
import fs from 'node:fs';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type ILogger } from '../utils/logger';
import { createMockLogger, createTestConfig } from '../utils/test';
import { uninstall } from './uninstall';

vi.mock('node:child_process');
vi.mock('node:fs');

describe('uninstall', () => {
  let mockLogger: ILogger;
  let mockExecSync: ReturnType<typeof vi.fn>;
  let mockExistsSync: ReturnType<typeof vi.fn>;
  let mockUnlinkSync: ReturnType<typeof vi.fn>;
  let mockProcessExit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockLogger = createMockLogger();
    mockExecSync = vi.fn();
    mockExistsSync = vi.fn();
    mockUnlinkSync = vi.fn();

    vi.mocked(execSync).mockImplementation(mockExecSync);
    vi.mocked(fs.existsSync).mockImplementation(mockExistsSync);
    vi.mocked(fs.unlinkSync).mockImplementation(mockUnlinkSync);

    mockProcessExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never) as ReturnType<
      typeof vi.fn
    >;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('plistファイルが存在しない場合、警告を表示して終了', async () => {
    const config = createTestConfig({
      plist: {
        label: 'com.test.obsidian',
        path: '/path/to/plist',
      },
    });

    mockExistsSync.mockReturnValue(false);

    await uninstall(mockLogger, config);

    expect(mockLogger.info).toHaveBeenCalledWith('Uninstalling Obsidian Manager LaunchAgent...');
    expect(mockLogger.warn).toHaveBeenCalledWith('LaunchAgent not found: /path/to/plist');
    expect(mockLogger.info).toHaveBeenCalledWith('Nothing to uninstall.');
    expect(mockExecSync).not.toHaveBeenCalled();
    expect(mockUnlinkSync).not.toHaveBeenCalled();
  });

  it('LaunchAgentを正常にアンインストール', async () => {
    const config = createTestConfig({
      plist: {
        label: 'com.test.obsidian',
        path: '/path/to/plist',
      },
    });

    mockExistsSync.mockReturnValue(true);

    await uninstall(mockLogger, config);

    expect(mockLogger.info).toHaveBeenCalledWith('Uninstalling Obsidian Manager LaunchAgent...');
    expect(mockExecSync).toHaveBeenCalledWith('launchctl unload "/path/to/plist"', { stdio: 'pipe' });
    expect(mockLogger.debug).toHaveBeenCalledWith('LaunchAgent unloaded');
    expect(mockUnlinkSync).toHaveBeenCalledWith('/path/to/plist');
    expect(mockLogger.info).toHaveBeenCalledWith('✓ LaunchAgent removed successfully');
    expect(mockLogger.info).toHaveBeenCalledWith('Uninstallation complete!');
    expect(mockProcessExit).not.toHaveBeenCalled();
  });

  it('LaunchAgentのアンロードに失敗しても続行し、plistファイルを削除', async () => {
    const config = createTestConfig({
      plist: {
        label: 'com.test.obsidian',
        path: '/path/to/plist',
      },
    });

    mockExistsSync.mockReturnValue(true);
    const unloadError = new Error('Failed to unload');
    mockExecSync.mockImplementation(() => {
      throw unloadError;
    });

    await uninstall(mockLogger, config);

    expect(mockLogger.info).toHaveBeenCalledWith('Uninstalling Obsidian Manager LaunchAgent...');
    expect(mockExecSync).toHaveBeenCalledWith('launchctl unload "/path/to/plist"', { stdio: 'pipe' });
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'Failed to unload LaunchAgent (it may not be running): Error: Failed to unload',
    );
    expect(mockUnlinkSync).toHaveBeenCalledWith('/path/to/plist');
    expect(mockLogger.info).toHaveBeenCalledWith('✓ LaunchAgent removed successfully');
    expect(mockLogger.info).toHaveBeenCalledWith('Uninstallation complete!');
  });

  it('plistファイルの削除に失敗した場合、エラーログを出力してプロセスを終了', async () => {
    const config = createTestConfig({
      plist: {
        label: 'com.test.obsidian',
        path: '/path/to/plist',
      },
    });

    mockExistsSync.mockReturnValue(true);
    const unlinkError = new Error('Permission denied');
    mockUnlinkSync.mockImplementation(() => {
      throw unlinkError;
    });

    await uninstall(mockLogger, config);

    expect(mockLogger.info).toHaveBeenCalledWith('Uninstalling Obsidian Manager LaunchAgent...');
    expect(mockUnlinkSync).toHaveBeenCalledWith('/path/to/plist');
    expect(mockLogger.error).toHaveBeenCalledWith('Failed to remove plist file: Error: Permission denied');
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });
});
