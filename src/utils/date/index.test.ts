import { describe, expect, it } from 'vitest';

import { formatDate, getNextDay, getPreviousDay, parseDate } from './index';

describe('daily-note utils', () => {
  describe('parseDate', () => {
    it('YYYY-MM-DD形式の文字列をDateオブジェクトに変換する', () => {
      const date = parseDate('2025-10-12');
      expect(date).toBeInstanceOf(Date);
    });

    it('不正な形式の場合はエラーをスローする', () => {
      expect(() => parseDate('invalid')).toThrow('Invalid date format');
    });
  });
  describe('formatDate', () => {
    it('日付をYYYY-MM-DD形式にフォーマットする', () => {
      const date = new Date('2025-10-12');
      expect(formatDate(date)).toBe('2025-10-12');
    });

    it('1桁の月と日を0埋めする', () => {
      const date = new Date('2025-01-05');
      expect(formatDate(date)).toBe('2025-01-05');
    });
  });

  describe('getNextDay', () => {
    it('翌日の日付を取得する', () => {
      const date = new Date('2025-10-12');
      const nextDay = getNextDay(date);
      expect(formatDate(nextDay)).toBe('2025-10-13');
    });

    it('月をまたぐ場合も正しく計算する', () => {
      const date = new Date('2025-10-31');
      const nextDay = getNextDay(date);
      expect(formatDate(nextDay)).toBe('2025-11-01');
    });
  });

  describe('getPreviousDay', () => {
    it('前日の日付を取得する', () => {
      const date = new Date('2025-10-12');
      const previousDay = getPreviousDay(date);
      expect(formatDate(previousDay)).toBe('2025-10-11');
    });

    it('月をまたぐ場合も正しく計算する', () => {
      const date = new Date('2025-11-01');
      const previousDay = getPreviousDay(date);
      expect(formatDate(previousDay)).toBe('2025-10-31');
    });
  });
});
