import pino, { type LevelWithSilentOrString } from 'pino';
import pretty from 'pino-pretty';

export interface ILogger {
  trace(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  fatal(message: string, ...args: any[]): void;
}

export const createLogger = (level: LevelWithSilentOrString = 'info'): ILogger => {
  const ignore = level === 'info' ? 'name,time,pid,hostname' : 'hostname';
  const gray = '\x1b[90m';
  const reset = '\x1b[0m';

  const stream = pretty({
    colorize: false,
    ignore: ignore,
    singleLine: true,
    messageFormat: (log, messageKey) => {
      return `${gray}(${log['name']})${reset} ${log[messageKey]}`;
    },
  });

  const pinoLogger = pino(
    {
      name: 'claude-code-config-manager',
      level,
    },
    stream,
  );

  return {
    trace: (message: string, ...args: any[]) => pinoLogger.trace(message, ...args),
    debug: (message: string, ...args: any[]) => pinoLogger.debug(message, ...args),
    info: (message: string, ...args: any[]) => pinoLogger.info(message, ...args),
    warn: (message: string, ...args: any[]) => pinoLogger.warn(message, ...args),
    error: (message: string, ...args: any[]) => pinoLogger.error(message, ...args),
    fatal: (message: string, ...args: any[]) => pinoLogger.fatal(message, ...args),
  };
};
