import { describe, expect, it } from 'vitest';

import { buildSection, extractSection, filterIncompleteTodos, isTodoCompleted, isTodoLine } from './index';

describe('markdown utils', () => {
  describe('isTodoCompleted', () => {
    it('未完了のTODOを正しく判定する', () => {
      expect(isTodoCompleted('- [ ] 未完了のタスク')).toBe(false);
      expect(isTodoCompleted('  - [ ] インデントされた未完了のタスク')).toBe(false);
    });

    it('完了済みのTODOを正しく判定する', () => {
      expect(isTodoCompleted('- [x] 完了したタスク')).toBe(true);
      expect(isTodoCompleted('- [X] 完了したタスク')).toBe(true);
      expect(isTodoCompleted('- [v] 完了したタスク')).toBe(true);
      expect(isTodoCompleted('  - [x] インデントされた完了タスク')).toBe(true);
    });

    it('TODO項目でない行はfalseを返す', () => {
      expect(isTodoCompleted('通常のテキスト')).toBe(false);
      expect(isTodoCompleted('## セクション')).toBe(false);
    });
  });

  describe('isTodoLine', () => {
    it('TODO行を正しく判定する', () => {
      expect(isTodoLine('- [ ] タスク')).toBe(true);
      expect(isTodoLine('- [x] タスク')).toBe(true);
      expect(isTodoLine('  - [ ] インデントされたタスク')).toBe(true);
    });

    it('TODO行でない行はfalseを返す', () => {
      expect(isTodoLine('通常のテキスト')).toBe(false);
      expect(isTodoLine('## セクション')).toBe(false);
      expect(isTodoLine('- リスト項目')).toBe(false);
    });
  });

  describe('extractSection', () => {
    it('指定されたセクションを抽出する', () => {
      const content = `## セクション1

内容1

## セクション2

内容2
内容3

## セクション3

内容4`;

      const result = extractSection(content, '## セクション2');
      expect(result).toEqual(['', '内容2', '内容3', '']);
    });

    it('セクションが存在しない場合は空配列を返す', () => {
      const content = `## セクション1

内容1`;

      const result = extractSection(content, '## セクション2');
      expect(result).toEqual([]);
    });

    it('セクションが最後の場合も正しく抽出する', () => {
      const content = `## セクション1

内容1

## セクション2

内容2
内容3`;

      const result = extractSection(content, '## セクション2');
      expect(result).toEqual(['', '内容2', '内容3']);
    });
  });

  describe('filterIncompleteTodos', () => {
    it('未完了のTODO項目のみをフィルタリングする', () => {
      const lines = [
        '- [ ] タスク1',
        '- [x] タスク2',
        '- [ ] タスク3',
        '- [X] タスク4',
        '- [ ] タスク5',
        '',
        '通常のテキスト',
      ];

      const result = filterIncompleteTodos(lines);
      expect(result).toEqual(['- [ ] タスク1', '- [ ] タスク3', '- [ ] タスク5']);
    });

    it('TODO項目がない場合は空配列を返す', () => {
      const lines = ['', '通常のテキスト', '## セクション'];

      const result = filterIncompleteTodos(lines);
      expect(result).toEqual([]);
    });

    it('すべて完了している場合は空配列を返す', () => {
      const lines = ['- [x] タスク1', '- [X] タスク2', '- [v] タスク3'];

      const result = filterIncompleteTodos(lines);
      expect(result).toEqual([]);
    });
  });

  describe('buildSection', () => {
    it('タイトルと内容を結合する', () => {
      const result = buildSection('## TODO', ['- [ ] タスク1', '- [ ] タスク2']);
      expect(result).toBe('## TODO\n\n- [ ] タスク1\n- [ ] タスク2');
    });

    it('内容が空の場合はタイトルのみを返す', () => {
      const result = buildSection('## TODO', []);
      expect(result).toBe('## TODO\n');
    });
  });
});
