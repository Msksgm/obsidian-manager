import os from 'node:os';
import path from 'node:path';

export interface Config {
  projectRoot: string;
  plist: {
    label: string;
    path: string;
  };
  sleepwatcherPath: string;
}

export const createConfig = (): Config => {
  const plistLabel = 'com.user.obsidian-manager';
  const plistFilePath = path.join(os.homedir(), 'Library', 'LaunchAgents', `${plistLabel}.plist`);
  return {
    projectRoot: path.resolve(path.dirname(process.execPath), '..'),
    plist: {
      label: plistLabel,
      path: plistFilePath,
    },
    sleepwatcherPath: '/usr/local/sbin/sleepwatcher',
  };
};
