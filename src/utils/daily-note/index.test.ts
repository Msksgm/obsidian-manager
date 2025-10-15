import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ILogger } from '../logger';
import { createMockLogger } from '../test';
import { createNextDayNote, extractTodoSections, generateDailyNoteContent, getDailyNotePath } from './index';

describe('daily-note utils', () => {
  describe('getDailyNotePath', () => {
    it('デイリーノートのファイルパスを生成する', () => {
      const date = new Date('2025-10-12');
      const baseDir = '/path/to/vault';
      const filePath = getDailyNotePath(date, baseDir);
      expect(filePath).toBe('/path/to/vault/daily/2025-10-12.md');
    });

    it('baseDirを指定しない場合はカレントディレクトリを使用する', () => {
      const date = new Date('2025-10-12');
      const filePath = getDailyNotePath(date);
      expect(filePath).toBe(path.join(process.cwd(), 'daily', '2025-10-12.md'));
    });
  });

  describe('extractTodoSections', () => {
    let tempDir: string;
    let testFilePath: string;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'obsidian-test-'));
      testFilePath = path.join(tempDir, 'test.md');
    });

    afterEach(() => {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true });
      }
    });

    it('TODOセクションを抽出する', () => {
      const content = `## timeline

## TODO（短期）

- [ ] タスク1
- [x] タスク2
- [ ] タスク3

## TODO（長期）
- [ ] タスク4
- [X] タスク5`;

      fs.writeFileSync(testFilePath, content);

      const result = extractTodoSections(testFilePath);
      expect(result.shortTerm).toEqual(['- [ ] タスク1', '- [ ] タスク3']);
      expect(result.longTerm).toEqual(['- [ ] タスク4']);
    });

    it('完了済みのTODOは除外する', () => {
      const content = `## TODO（短期）

- [x] タスク1
- [X] タスク2

## TODO（長期）
- [v] タスク3`;

      fs.writeFileSync(testFilePath, content);

      const result = extractTodoSections(testFilePath);
      expect(result.shortTerm).toEqual([]);
      expect(result.longTerm).toEqual([]);
    });
  });

  describe('generateDailyNoteContent', () => {
    it('デイリーノートの内容を生成する', () => {
      const shortTerm = ['- [ ] タスク1', '- [ ] タスク2'];
      const longTerm = ['- [ ] タスク3'];

      const content = generateDailyNoteContent(shortTerm, longTerm);

      expect(content).toContain('## timeline');
      expect(content).toContain('## TODO（短期）');
      expect(content).toContain('- [ ] タスク1');
      expect(content).toContain('- [ ] タスク2');
      expect(content).toContain('## TODO（長期）');
      expect(content).toContain('- [ ] タスク3');
    });

    it('TODOがない場合はセクションのみを生成する', () => {
      const content = generateDailyNoteContent([], []);

      expect(content).toContain('## timeline');
      expect(content).toContain('## TODO（短期）');
      expect(content).toContain('## TODO（長期）');
    });
  });

  describe('createNextDayNote', () => {
    let tempDir: string;
    let dailyDir: string;
    let mockLogger: ILogger;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'obsidian-test-'));
      dailyDir = path.join(tempDir, 'daily');
      fs.mkdirSync(dailyDir);

      mockLogger = createMockLogger();
    });

    afterEach(() => {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true });
      }
    });

    it('次の日のデイリーノートを作成する', () => {
      const baseDate = new Date('2025-10-12');
      const baseFilePath = path.join(dailyDir, '2025-10-12.md');
      const nextFilePath = path.join(dailyDir, '2025-10-13.md');

      const baseContent = `## timeline

## TODO（短期）

- [ ] タスク1
- [x] タスク2

## TODO（長期）
- [ ] タスク3`;

      fs.writeFileSync(baseFilePath, baseContent);

      const createdPath = createNextDayNote(mockLogger, baseDate, tempDir);

      expect(createdPath).toBe(nextFilePath);
      expect(fs.existsSync(nextFilePath)).toBe(true);

      const nextContent = fs.readFileSync(nextFilePath, 'utf-8');
      expect(nextContent).toContain('## timeline');
      expect(nextContent).toContain('- [ ] タスク1');
      expect(nextContent).not.toContain('- [x] タスク2');
      expect(nextContent).toContain('- [ ] タスク3');
    });

    it('基準日のファイルが存在しない場合はエラーをスローする', () => {
      const baseDate = new Date('2025-10-12');

      expect(() => createNextDayNote(mockLogger, baseDate, tempDir)).toThrow('Base date file not found');
    });

    it('翌日のファイルが既に存在する場合はprocess.exit(0)を呼ぶ', () => {
      const baseDate = new Date('2025-10-12');
      const baseFilePath = path.join(dailyDir, '2025-10-12.md');
      const nextFilePath = path.join(dailyDir, '2025-10-13.md');

      fs.writeFileSync(baseFilePath, '## TODO（短期）\n\n- [ ] タスク1');
      fs.writeFileSync(nextFilePath, 'existing content');

      const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {
        throw new Error('process.exit called with 0');
      }) as any);

      expect(() => createNextDayNote(mockLogger, baseDate, tempDir)).toThrow('process.exit called with 0');
      expect(mockExit).toHaveBeenCalledWith(0);
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Next day file already exists'));

      mockExit.mockRestore();
    });
  });
});
