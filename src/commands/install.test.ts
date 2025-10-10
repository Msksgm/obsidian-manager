import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type ILogger } from '../utils/logger';
import * as plistModule from '../utils/plist';
import { createMockLogger, createTestConfig } from '../utils/test';
import { install } from './install';

vi.mock('node:child_process');
vi.mock('node:fs');
vi.mock('node:path');
vi.mock('../utils/plist');

describe('install', () => {
  let mockLogger: ILogger;
  let mockExecSync: ReturnType<typeof vi.fn>;
  let mockExistsSync: ReturnType<typeof vi.fn>;
  let mockMkdirSync: ReturnType<typeof vi.fn>;
  let mockWriteFileSync: ReturnType<typeof vi.fn>;
  let mockPathJoin: ReturnType<typeof vi.fn>;
  let mockPathDirname: ReturnType<typeof vi.fn>;
  let mockGeneratePlist: ReturnType<typeof vi.fn>;
  let mockProcessExit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockLogger = createMockLogger();
    mockExecSync = vi.fn();
    mockExistsSync = vi.fn();
    mockMkdirSync = vi.fn();
    mockWriteFileSync = vi.fn();
    mockPathJoin = vi.fn((...args) => args.join('/'));
    mockPathDirname = vi.fn((p) => p.split('/').slice(0, -1).join('/'));
    mockGeneratePlist = vi.fn(() => '<plist>mock content</plist>');

    vi.mocked(execSync).mockImplementation(mockExecSync);
    vi.mocked(fs.existsSync).mockImplementation(mockExistsSync);
    vi.mocked(fs.mkdirSync).mockImplementation(mockMkdirSync);
    vi.mocked(fs.writeFileSync).mockImplementation(mockWriteFileSync);
    vi.mocked(path.join).mockImplementation(mockPathJoin);
    vi.mocked(path.dirname).mockImplementation(mockPathDirname);
    vi.mocked(plistModule.generatePlist).mockImplementation(mockGeneratePlist);

    mockProcessExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never) as ReturnType<
      typeof vi.fn
    >;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sleepwatcherがインストールされていない場合、エラーを表示してプロセスを終了', async () => {
    const config = createTestConfig({
      sleepwatcherPath: '/usr/local/sbin/sleepwatcher',
      projectRoot: '/path/to/project',
      plist: {
        label: 'com.test.obsidian',
        path: '/path/to/plist',
      },
    });

    mockExecSync.mockImplementation(() => {
      throw new Error('Command not found');
    });

    await install(mockLogger, config);

    expect(mockLogger.info).toHaveBeenCalledWith('Installing Obsidian Manager LaunchAgent...');
    expect(mockExecSync).toHaveBeenCalledWith('which /usr/local/sbin/sleepwatcher', { stdio: 'pipe' });
    expect(mockLogger.error).toHaveBeenCalledWith('sleepwatcher is not installed. Please install it first:');
    expect(mockLogger.info).toHaveBeenCalledWith('  brew install sleepwatcher');
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });

  it('LaunchAgentを正常にインストール（LaunchAgentsディレクトリが存在しない場合）', async () => {
    const config = createTestConfig({
      sleepwatcherPath: '/usr/local/sbin/sleepwatcher',
      projectRoot: '/path/to/project',
      plist: {
        label: 'com.test.obsidian',
        path: '/path/to/LaunchAgents/com.test.obsidian.plist',
      },
    });

    // sleepwatcherが存在する
    mockExecSync.mockReturnValueOnce('');
    // LaunchAgentsディレクトリが存在しない
    mockExistsSync.mockReturnValueOnce(false);
    // plistファイルが存在しない
    mockExistsSync.mockReturnValueOnce(false);
    // launchctl loadが成功
    mockExecSync.mockReturnValueOnce('');

    await install(mockLogger, config);

    expect(mockLogger.info).toHaveBeenCalledWith('Installing Obsidian Manager LaunchAgent...');
    expect(mockMkdirSync).toHaveBeenCalledWith('/path/to/LaunchAgents', { recursive: true });
    expect(mockLogger.debug).toHaveBeenCalledWith('Created directory: /path/to/LaunchAgents');
    expect(mockGeneratePlist).toHaveBeenCalledWith({
      config,
      sleepScript: '/path/to/project/dist/obsidian-manager stop',
      wakeScript: '/path/to/project/dist/obsidian-manager start',
    });
    expect(mockWriteFileSync).toHaveBeenCalledWith(
      '/path/to/LaunchAgents/com.test.obsidian.plist',
      '<plist>mock content</plist>',
      'utf-8',
    );
    expect(mockLogger.debug).toHaveBeenCalledWith('Created plist file: /path/to/LaunchAgents/com.test.obsidian.plist');
    expect(mockExecSync).toHaveBeenCalledWith('launchctl load "/path/to/LaunchAgents/com.test.obsidian.plist"', {
      stdio: 'pipe',
    });
    expect(mockLogger.info).toHaveBeenCalledWith('✓ LaunchAgent loaded successfully');
    expect(mockLogger.info).toHaveBeenCalledWith('Installation complete!');
    expect(mockProcessExit).not.toHaveBeenCalled();
  });

  it('既存のLaunchAgentが存在する場合、先にアンロードしてから再インストール', async () => {
    const config = createTestConfig({
      sleepwatcherPath: '/usr/local/sbin/sleepwatcher',
      projectRoot: '/path/to/project',
      plist: {
        label: 'com.test.obsidian',
        path: '/path/to/LaunchAgents/com.test.obsidian.plist',
      },
    });

    // sleepwatcherが存在する
    mockExecSync.mockReturnValueOnce('');
    // LaunchAgentsディレクトリが存在する
    mockExistsSync.mockReturnValueOnce(true);
    // plistファイルが既に存在する
    mockExistsSync.mockReturnValueOnce(true);
    // launchctl unloadが成功
    mockExecSync.mockReturnValueOnce('');
    // launchctl loadが成功
    mockExecSync.mockReturnValueOnce('');

    await install(mockLogger, config);

    expect(mockLogger.warn).toHaveBeenCalledWith('LaunchAgent already exists. Unloading first...');
    expect(mockExecSync).toHaveBeenCalledWith('launchctl unload "/path/to/LaunchAgents/com.test.obsidian.plist"', {
      stdio: 'pipe',
    });
    expect(mockWriteFileSync).toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalledWith('✓ LaunchAgent loaded successfully');
  });

  it('既存のLaunchAgentのアンロードに失敗しても続行', async () => {
    const config = createTestConfig({
      sleepwatcherPath: '/usr/local/sbin/sleepwatcher',
      projectRoot: '/path/to/project',
      plist: {
        label: 'com.test.obsidian',
        path: '/path/to/LaunchAgents/com.test.obsidian.plist',
      },
    });

    // sleepwatcherが存在する
    mockExecSync.mockReturnValueOnce('');
    // LaunchAgentsディレクトリが存在する
    mockExistsSync.mockReturnValueOnce(true);
    // plistファイルが既に存在する
    mockExistsSync.mockReturnValueOnce(true);
    // launchctl unloadが失敗
    mockExecSync.mockImplementationOnce(() => {
      throw new Error('Failed to unload');
    });
    // launchctl loadが成功
    mockExecSync.mockReturnValueOnce('');

    await install(mockLogger, config);

    expect(mockLogger.warn).toHaveBeenCalledWith('LaunchAgent already exists. Unloading first...');
    expect(mockWriteFileSync).toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalledWith('✓ LaunchAgent loaded successfully');
  });

  it('plistファイルの書き込みに失敗した場合、エラーを表示してプロセスを終了', async () => {
    const config = createTestConfig({
      sleepwatcherPath: '/usr/local/sbin/sleepwatcher',
      projectRoot: '/path/to/project',
      plist: {
        label: 'com.test.obsidian',
        path: '/path/to/LaunchAgents/com.test.obsidian.plist',
      },
    });

    // sleepwatcherが存在する
    mockExecSync.mockReturnValueOnce('');
    // LaunchAgentsディレクトリが存在する
    mockExistsSync.mockReturnValueOnce(true);
    // plistファイルが存在しない
    mockExistsSync.mockReturnValueOnce(false);
    // writeFileSyncが失敗
    mockWriteFileSync.mockImplementation(() => {
      throw new Error('Permission denied');
    });

    await install(mockLogger, config);

    expect(mockLogger.error).toHaveBeenCalledWith('Failed to write plist file: Error: Permission denied');
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });

  it('LaunchAgentのロードに失敗した場合、エラーを表示してプロセスを終了', async () => {
    const config = createTestConfig({
      sleepwatcherPath: '/usr/local/sbin/sleepwatcher',
      projectRoot: '/path/to/project',
      plist: {
        label: 'com.test.obsidian',
        path: '/path/to/LaunchAgents/com.test.obsidian.plist',
      },
    });

    // sleepwatcherが存在する
    mockExecSync.mockReturnValueOnce('');
    // LaunchAgentsディレクトリが存在する
    mockExistsSync.mockReturnValueOnce(true);
    // plistファイルが存在しない
    mockExistsSync.mockReturnValueOnce(false);
    // launchctl loadが失敗
    mockExecSync.mockImplementationOnce(() => {
      throw new Error('Load failed');
    });

    await install(mockLogger, config);

    expect(mockWriteFileSync).toHaveBeenCalled();
    expect(mockLogger.error).toHaveBeenCalledWith('Failed to load LaunchAgent: Error: Load failed');
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });
});
