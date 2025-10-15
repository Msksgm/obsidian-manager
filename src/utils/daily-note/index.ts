import fs from 'node:fs';
import path from 'node:path';

import { formatDate, getNextDay } from '../date';
import type { ILogger } from '../logger';
import { buildSection, extractSection, filterIncompleteTodos } from '../markdown';

/**
 * デイリーノートのファイルパスを生成
 * @param date 日付
 * @param baseDir ベースディレクトリ（デフォルトはカレントディレクトリ）
 */
export const getDailyNotePath = (date: Date, baseDir: string = process.cwd()): string => {
  const dateStr = formatDate(date);
  return path.join(baseDir, 'daily', `${dateStr}.md`);
};

/**
 * ファイルからTODOセクションを抽出
 * @param filePath ファイルパス
 * @returns 未完了のTODO項目を含むセクション
 */
export const extractTodoSections = (filePath: string): { shortTerm: string[]; longTerm: string[] } => {
  const content = fs.readFileSync(filePath, 'utf-8');

  // 短期TODOセクションを抽出
  const shortTermSection = extractSection(content, '## TODO（短期）');
  const shortTermTodos = filterIncompleteTodos(shortTermSection);

  // 長期TODOセクションを抽出
  const longTermSection = extractSection(content, '## TODO（長期）');
  const longTermTodos = filterIncompleteTodos(longTermSection);

  return {
    shortTerm: shortTermTodos,
    longTerm: longTermTodos,
  };
};

/**
 * 新しいデイリーノートの内容を生成
 */
export const generateDailyNoteContent = (shortTermTodos: string[], longTermTodos: string[]): string => {
  const sections: string[] = [];

  // timelineセクション（空）
  sections.push('## timeline\n\n');

  // 短期TODOセクション
  sections.push(buildSection('## TODO（短期）', shortTermTodos));

  // 長期TODOセクション
  sections.push(buildSection('## TODO（長期）', longTermTodos));

  return sections.join('\n');
};

/**
 * 次の日のデイリーノートを作成
 * @param logger ロガー
 * @param baseDate 基準日
 * @param baseDir ベースディレクトリ（デフォルトはカレントディレクトリ）
 * @returns 作成したファイルのパス
 */
export const createNextDayNote = (logger: ILogger, baseDate: Date, baseDir: string): string => {
  // 基準日のファイルパスを取得
  const baseDatePath = getDailyNotePath(baseDate, baseDir);

  // 基準日のファイルが存在するかチェック
  if (!fs.existsSync(baseDatePath)) {
    throw new Error(`Base date file not found: ${baseDatePath}`);
  }

  // 翌日の日付を計算
  const nextDate = getNextDay(baseDate);
  const nextDatePath = getDailyNotePath(nextDate, baseDir);

  // 翌日のファイルが既に存在するかチェック
  if (fs.existsSync(nextDatePath)) {
    logger.info(`Next day file already exists: ${nextDatePath}`);
    process.exit(0);
  }

  // TODO セクションを抽出
  const { shortTerm, longTerm } = extractTodoSections(baseDatePath);

  // 新しい内容を生成
  const newContent = generateDailyNoteContent(shortTerm, longTerm);

  // ディレクトリが存在しない場合は作成
  const dailyDir = path.dirname(nextDatePath);
  if (!fs.existsSync(dailyDir)) {
    throw new Error(`Daily directory not found: ${dailyDir}`);
  }

  // ファイルに書き込み
  fs.writeFileSync(nextDatePath, newContent, 'utf-8');

  return nextDatePath;
};
