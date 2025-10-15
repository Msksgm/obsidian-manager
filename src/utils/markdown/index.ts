/**
 * TODO項目が完了しているかチェック
 * - [ ] -> false (未完了)
 * - [x] -> true (完了)
 * - [X] -> true (完了)
 * - [v] -> true (完了)
 * など、空白以外が入っている場合は完了とみなす
 */
export const isTodoCompleted = (line: string): boolean => {
  const match = line.match(/^(\s*)-\s+\[(.)\]/);
  if (!match) {
    return false; // TODO項目ではない
  }
  const checkboxContent = match[2];
  return checkboxContent !== ' '; // 空白以外は完了とみなす
};

/**
 * TODO行かどうかをチェック
 */
export const isTodoLine = (line: string): boolean => {
  return /^(\s*)-\s+\[.\]/.test(line);
};

/**
 * マークダウンから特定のセクションを抽出
 * @param content マークダウンの内容
 * @param sectionTitle セクションのタイトル（例: "## TODO（短期）"）
 * @returns セクションの内容（セクションタイトルを含まない）
 */
export const extractSection = (content: string, sectionTitle: string): string[] => {
  const lines = content.split('\n');
  const sectionLines: string[] = [];
  let inSection = false;

  for (const line of lines) {
    // セクション開始をチェック
    if (line.trim() === sectionTitle.trim()) {
      inSection = true;
      continue;
    }

    // 次のセクション（##で始まる行）が来たら終了
    if (inSection && line.trim().startsWith('##')) {
      break;
    }

    // セクション内の行を収集
    if (inSection) {
      sectionLines.push(line);
    }
  }

  return sectionLines;
};

/**
 * セクション内の未完了TODO項目のみをフィルタリング
 * @param sectionLines セクションの行
 * @returns 未完了のTODO項目のみを含む行
 */
export const filterIncompleteTodos = (sectionLines: string[]): string[] => {
  return sectionLines.filter((line) => {
    // TODO項目でない行はスキップ（空行など）
    if (!isTodoLine(line)) {
      return false;
    }
    // 未完了のTODO項目のみを残す
    return !isTodoCompleted(line);
  });
};

/**
 * セクションのタイトルと内容を結合
 */
export const buildSection = (title: string, lines: string[]): string => {
  if (lines.length === 0) {
    return `${title}\n`;
  }
  return `${title}\n\n${lines.join('\n')}`;
};
