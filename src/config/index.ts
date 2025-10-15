import os from 'node:os';
import path from 'node:path';

export interface Config {
  projectRoot: string;
  plist: {
    label: string;
    path: string;
  };
  obsidian: {
    valutePath: string;
  };
  sleepwatcherPath: string;
}

export const createConfig = (): Config => {
  const plistLabel = 'com.user.obsidian-manager';
  const plistFilePath = path.join(os.homedir(), 'Library', 'LaunchAgents', `${plistLabel}.plist`);
  const obsidianVaultPath = process.env.OBSIDIAN_VAULT_PATH || process.cwd();
  return {
    projectRoot: path.resolve(path.dirname(process.execPath), '..'),
    plist: {
      label: plistLabel,
      path: plistFilePath,
    },
    obsidian: {
      valutePath: obsidianVaultPath,
    },
    sleepwatcherPath: '/usr/local/sbin/sleepwatcher',
  };
};
