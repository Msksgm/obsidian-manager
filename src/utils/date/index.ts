/**
 * YYYY-MM-DD形式の文字列をDateオブジェクトに変換
 */
export const parseDate = (dateStr: string): Date => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date format: ${dateStr}. Expected YYYY-MM-DD format.`);
  }
  return date;
};

/**
 * 日付をYYYY-MM-DD形式にフォーマット
 */
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 翌日の日付を取得
 */
export const getNextDay = (date: Date): Date => {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  return nextDay;
};

/**
 * 前日の日付を取得
 */
export const getPreviousDay = (date: Date): Date => {
  const previousDay = new Date(date);
  previousDay.setDate(previousDay.getDate() - 1);
  return previousDay;
};
