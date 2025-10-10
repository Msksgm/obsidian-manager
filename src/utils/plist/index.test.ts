import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createTestConfig } from '../test';
import { generatePlist } from './index';

vi.mock('node:os');
vi.mock('node:path');

describe('plist', () => {
  let mockHomedir: ReturnType<typeof vi.fn>;
  let mockPathJoin: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockHomedir = vi.fn(() => '/Users/testuser');
    mockPathJoin = vi.fn((...args) => args.join('/'));

    vi.mocked(os.homedir).mockImplementation(mockHomedir);
    vi.mocked(path.join).mockImplementation(mockPathJoin);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generatePlist', () => {
    it('引数をもとに正しいXMLを生成', () => {
      const config = createTestConfig({
        sleepwatcherPath: '/opt/homebrew/bin/sleepwatcher',
        plist: {
          label: 'com.test.obsidian',
        },
      });

      const result = generatePlist({
        config,
        sleepScript: '/path/to/sleep.sh',
        wakeScript: '/path/to/wake.sh',
      });

      const expected = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.test.obsidian</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/sleepwatcher</string>
        <string>-V</string>
        <string>-s</string>
        <string>/path/to/sleep.sh</string>
        <string>-w</string>
        <string>/path/to/wake.sh</string>
    </array>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Users/testuser/Library/Logs/com.test.obsidian.stdout.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/testuser/Library/Logs/com.test.obsidian.stderr.log</string>
</dict>
</plist>`;

      expect(result).toBe(expected);
    });
  });
});
