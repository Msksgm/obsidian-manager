import os from 'node:os';

import type { Config } from '../../config';

export interface PlistConfig {
  config: Config;
  sleepScript: string;
  wakeScript: string;
}

/**
 * LaunchAgent用のplistファイルを生成
 * sleepwatcherを使用してスリープ/ウェイクイベントを監視
 */
export const generatePlist = (plistConfig: PlistConfig): string => {
  const { config, sleepScript, wakeScript } = plistConfig;

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${config.plist.label}</string>
    <key>ProgramArguments</key>
    <array>
        <string>${config.sleepwatcherPath}</string>
        <string>-V</string>
        <string>-s</string>
        <string>${sleepScript}</string>
        <string>-w</string>
        <string>${wakeScript}</string>
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
    <string>${os.homedir()}/Library/Logs/${config.plist.label}.stdout.log</string>
    <key>StandardErrorPath</key>
    <string>${os.homedir()}/Library/Logs/${config.plist.label}.stderr.log</string>
</dict>
</plist>`;
};
