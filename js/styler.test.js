/**
 * Tests for styler.js
 */

const runStylerTests = () => {
  const { setTestFile, test, expect } =
    typeof window !== 'undefined' ? window : require('../tests/testharness.js');

  const resolveSymbol = (symbolName) => {
    if (
      typeof window !== 'undefined' &&
      typeof window[symbolName] !== 'undefined'
    ) {
      return window[symbolName];
    }
    if (typeof globalThis[symbolName] !== 'undefined') {
      return globalThis[symbolName];
    }
    try {
      return Function(
        `return typeof ${symbolName} !== "undefined" ? ${symbolName} : undefined;`,
      )();
    } catch (_error) {
      return undefined;
    }
  };

  let getCellsWithSameNumber = resolveSymbol('getCellsWithSameNumber');
  let styleCell = resolveSymbol('styleCell');
  let styleRow = resolveSymbol('styleRow');
  let styleCol = resolveSymbol('styleCol');
  let styleBlock = resolveSymbol('styleBlock');
  let styleSameValueRows = resolveSymbol('styleSameValueRows');
  let styleSameValueCols = resolveSymbol('styleSameValueCols');
  let styleSameValueBlocks = resolveSymbol('styleSameValueBlocks');
  let styleSameValueCells = resolveSymbol('styleSameValueCells');
  let styleSelectedRow = resolveSymbol('styleSelectedRow');
  let styleSelectedCol = resolveSymbol('styleSelectedCol');
  let styleSelectedBlock = resolveSymbol('styleSelectedBlock');
  let styleSelectedCell = resolveSymbol('styleSelectedCell');
  let buildStyles = resolveSymbol('buildStyles');
  let TOTAL_CELLS = resolveSymbol('TOTAL_CELLS');

  setTestFile('styler.js');

  test('getCellsWithSameNumber returns cells with matching number', () => {
    const board = '1'.repeat(10).concat('0'.repeat(71)).split('').map(Number);
    const result = getCellsWithSameNumber(board, 0);
    return expect(result.size).toBe(10);
  });

  test('getCellsWithSameNumber returns empty set for cell with 0', () => {
    const board = '0'.repeat(81).split('').map(Number);
    const result = getCellsWithSameNumber(board, 0);
    return expect(result.size).toBe(0);
  });

  test('getCellsWithSameNumber returns empty set for invalid index', () => {
    const board = '0'.repeat(81).split('').map(Number);
    const result = getCellsWithSameNumber(board, -1);
    return expect(result.size).toBe(0);
  });

  test('styleCell applies style to a single cell', () => {
    const styles = new Array(TOTAL_CELLS).fill(null);
    styleCell(styles, 0, 'selected');
    return expect(styles[0]).toBe('selected');
  });

  test('styleCell overwrites previous style', () => {
    const styles = new Array(TOTAL_CELLS).fill(null);
    styleCell(styles, 5, 'related-line');
    styleCell(styles, 5, 'same-num');
    return expect(styles[5]).toBe('same-num');
  });

  test('styleRow applies style to all cells in a row', () => {
    const styles = new Array(TOTAL_CELLS).fill(null);
    styleRow(styles, 0, 'related-line');
    let allMatch = true;
    for (let col = 0; col < 9; col++) {
      if (styles[col] !== 'related-line') {
        allMatch = false;
        break;
      }
    }
    return expect(allMatch).toBe(true);
  });

  test('styleCol applies style to all cells in a column', () => {
    const styles = new Array(TOTAL_CELLS).fill(null);
    styleCol(styles, 0, 'related-line');
    let allMatch = true;
    for (let row = 0; row < 9; row++) {
      if (styles[row * 9] !== 'related-line') {
        allMatch = false;
        break;
      }
    }
    return expect(allMatch).toBe(true);
  });

  test('styleBlock applies style to all cells in a 3x3 block', () => {
    const styles = new Array(TOTAL_CELLS).fill(null);
    styleBlock(styles, 0, 'related-line-subtle');
    let count = 0;
    for (let i = 0; i < TOTAL_CELLS; i++) {
      if (styles[i] === 'related-line-subtle') {
        count++;
      }
    }
    return expect(count).toBe(9);
  });

  test('styleSameValueRows marks rows of cells with same value', () => {
    // Two 5s: at index 0 (row 0) and index 10 (row 1)
    const board = '5' + '0'.repeat(9) + '5' + '0'.repeat(70);
    const boardArr = board.split('').map(Number);
    const styles = new Array(TOTAL_CELLS).fill(null);

    styleSameValueRows(styles, boardArr, 0);

    // Row 0 and row 1 should be highlighted with 'related-line-subtle'
    let row0Count = 0;
    let row1Count = 0;
    for (let col = 0; col < 9; col++) {
      if (styles[col] === 'related-line-subtle') row0Count++;
      if (styles[9 + col] === 'related-line-subtle') row1Count++;
    }
    return expect(row0Count + row1Count).toBe(18);
  });

  test('styleSameValueCols marks columns of cells with same value', () => {
    const board = '5' + '0'.repeat(80);
    const boardArr = board.split('').map(Number);
    // Another 5 at index 9 (row 1, col 0) - different row, same column
    boardArr[9] = 5;
    const styles = new Array(TOTAL_CELLS).fill(null);

    styleSameValueCols(styles, boardArr, 0);

    // Column 0 should be highlighted
    let colCount = 0;
    for (let row = 0; row < 9; row++) {
      if (styles[row * 9] === 'related-line-subtle') colCount++;
    }
    return expect(colCount).toBe(9);
  });

  test('styleSameValueBlocks marks blocks of cells with same value', () => {
    const board = '1' + '0'.repeat(80);
    const boardArr = board.split('').map(Number);
    const styles = new Array(TOTAL_CELLS).fill(null);

    styleSameValueBlocks(styles, boardArr, 0);

    // Block 0 (cells 0-2, 9-11, 18-20) should be highlighted
    let blockCount = 0;
    for (let i = 0; i < TOTAL_CELLS; i++) {
      if (styles[i] === 'related-line-subtle') blockCount++;
    }
    return expect(blockCount).toBe(9);
  });

  test('styleSameValueCells marks all cells with same value', () => {
    const board = '5' + '0'.repeat(8) + '0' + '5' + '0'.repeat(70);
    const boardArr = board.split('').map(Number);
    const styles = new Array(TOTAL_CELLS).fill(null);

    styleSameValueCells(styles, boardArr, 0);

    // Cells 0 and 10 should be 'same-num'
    return (
      expect(styles[0]).toBe('same-num') && expect(styles[10]).toBe('same-num')
    );
  });

  test('styleSelectedRow marks selected cell row', () => {
    const board = '0'.repeat(81).split('').map(Number);
    const styles = new Array(TOTAL_CELLS).fill(null);

    styleSelectedRow(styles, board, 5);

    // Row 0 should be highlighted with 'related-line'
    let rowCount = 0;
    for (let col = 0; col < 9; col++) {
      if (styles[col] === 'related-line') rowCount++;
    }
    return expect(rowCount).toBe(9);
  });

  test('styleSelectedCol marks selected cell column', () => {
    const board = '0'.repeat(81).split('').map(Number);
    const styles = new Array(TOTAL_CELLS).fill(null);

    styleSelectedCol(styles, board, 5);

    // Column 5 should be highlighted with 'related-line'
    let colCount = 0;
    for (let row = 0; row < 9; row++) {
      if (styles[row * 9 + 5] === 'related-line') colCount++;
    }
    return expect(colCount).toBe(9);
  });

  test('styleSelectedBlock marks selected cell block', () => {
    const board = '0'.repeat(81).split('').map(Number);
    const styles = new Array(TOTAL_CELLS).fill(null);

    styleSelectedBlock(styles, board, 0);

    // Block 0 should be highlighted with 'related-line-subtle'
    let blockCount = 0;
    for (let i = 0; i < TOTAL_CELLS; i++) {
      if (styles[i] === 'related-line-subtle') blockCount++;
    }
    return expect(blockCount).toBe(9);
  });

  test('styleSelectedCell marks selected cell', () => {
    const board = '0'.repeat(81).split('').map(Number);
    const styles = new Array(TOTAL_CELLS).fill(null);

    styleSelectedCell(styles, board, 42);

    return expect(styles[42]).toBe('selected');
  });

  test('buildStyles returns array of correct length', () => {
    const board = '0'.repeat(81).split('').map(Number);
    const styles = buildStyles(board, 0, [
      'selected block',
      'selected row',
      'selected col',
      'same value',
    ]);
    return expect(styles.length).toBe(TOTAL_CELLS);
  });

  test("buildStyles marks selected cell as 'selected'", () => {
    const board = '0'.repeat(81).split('').map(Number);
    const styles = buildStyles(board, 0, []);
    return expect(styles[0]).toBe('selected');
  });

  test("buildStyles marks selected cell as 'selected' in 'none' mode", () => {
    const board = '0'.repeat(81).split('').map(Number);
    const styles = buildStyles(board, 0, []);
    return expect(styles[0]).toBe('selected');
  });

  test('buildStyles returns empty styles when selected is -1', () => {
    const board = '0'.repeat(81).split('').map(Number);
    const styles = buildStyles(board, -1, [
      'selected block',
      'selected row',
      'selected col',
      'same value',
    ]);
    return expect(styles.every((s) => s === '')).toBe(true);
  });

  test("buildStyles highlights same numbers in 'same' mode", () => {
    const board = '1'.repeat(10).concat('0'.repeat(71)).split('').map(Number);
    const styles = buildStyles(board, 0, ['same value']);
    let sameCount = 0;
    let selectedCount = 0;
    for (let i = 0; i < TOTAL_CELLS; i++) {
      if (styles[i] === 'same-num') sameCount++;
      if (styles[i] === 'selected') selectedCount++;
    }
    return expect(sameCount + selectedCount).toBe(10);
  });

  test("buildStyles highlights row and column in 'minimal' mode", () => {
    const board = '0'.repeat(81).split('').map(Number);
    const styles = buildStyles(board, 0, ['selected row', 'selected col']);
    let lineCount = 0;
    let selectedCount = 0;
    for (let i = 0; i < 81; i++) {
      if (styles[i] === 'related-line') lineCount++;
      if (styles[i] === 'selected') selectedCount++;
    }
    return expect(lineCount + selectedCount).toBe(17);
  });

  test("buildStyles applies row/col over block in 'related-all' mode", () => {
    const board = '0'.repeat(81).split('').map(Number);
    const styles = buildStyles(board, 0, [
      'same value rows',
      'same value cols',
      'same value blocks',
      'selected row',
      'selected col',
      'same value',
    ]);

    // Cell 4 is in same row as 0 (row 0, col 4) but NOT in same box (box 1)
    // Should get 'related-line' from row, not 'related-line-subtle' from box
    const rowCellStyle = styles[4];
    return expect(rowCellStyle).toBe('related-line');
  });

  test("buildStyles applies same-num over row/col in 'related-all' mode", () => {
    const board = '1'.repeat(10).concat('0'.repeat(71)).split('').map(Number);
    // Cell 0 selected (row 0, col 0), value 1
    // Cell 9 has value 1 (row 1, col 0) - in selected column
    // same-num is applied last, should overwrite the subtle styling
    const styles = buildStyles(board, 0, [
      'same value rows',
      'same value cols',
      'same value blocks',
      'selected row',
      'selected col',
      'same value',
    ]);

    const cellStyle = styles[9];
    return expect(cellStyle).toBe('same-num');
  });

  test('buildStyles highlights comprehensive board state correctly', () => {
    // Board with 5 at position 0, and several other 5s at various positions
    const boardStr =
      '5' +
      '0'.repeat(8) +
      '0' +
      '5' +
      '0'.repeat(6) +
      '5' +
      '0'.repeat(30) +
      '5' +
      '0'.repeat(14);
    const board = boardStr.split('').map(Number);

    // Selected cell is at index 0 (row 0, col 0, box 0), contains 5
    const selectedIndex = 0;

    // Other 5s are at: 10 (row 1, col 1, box 0), 17 (row 1, col 8, box 2), 45 (row 5, col 0, box 3)
    const other5Positions = [10, 17, 45];

    // Test 'none' mode - nothing highlighted except selected
    const noneStyles = buildStyles(board, selectedIndex, []);
    return expect(noneStyles[0]).toBe('selected');
  });

  test("comprehensive 'same' mode styling", () => {
    const boardStr =
      '5' +
      '0'.repeat(8) +
      '0' +
      '5' +
      '0'.repeat(6) +
      '5' +
      '0'.repeat(30) +
      '5' +
      '0'.repeat(14);
    const board = boardStr.split('').map(Number);
    const selectedIndex = 0;

    const styles = buildStyles(board, selectedIndex, ['same value']);

    // All 5s should be highlighted as 'same-num'
    let sameCount = 0;
    for (let i = 0; i < 81; i++) {
      if (board[i] === 5) {
        if (styles[i] === 'same-num' || styles[i] === 'selected') {
          sameCount++;
        }
      }
    }

    return expect(sameCount).toBe(4);
  });

  test("comprehensive 'minimal' mode styling", () => {
    const board = '5' + '0'.repeat(80);
    const boardArr = board.split('').map(Number);
    const selectedIndex = 0;

    const styles = buildStyles(boardArr, selectedIndex, [
      'selected row',
      'selected col',
    ]);

    // Row 0 and col 0 should be highlighted as 'related-line'
    // But cell 0 is 'selected' not 'related-line'
    let rowLineCount = 0;
    let colLineCount = 0;
    for (let i = 0; i < 81; i++) {
      const row = Math.floor(i / 9);
      const col = i % 9;
      if (row === 0 && styles[i] === 'related-line') rowLineCount++;
      if (col === 0 && styles[i] === 'related-line') colLineCount++;
    }

    // 8 in row (0-8 minus 0) + 8 in col (0,9,18...72 minus 0) = 16
    return expect(rowLineCount + colLineCount).toBe(16);
  });

  test("comprehensive 'related-box' mode styling", () => {
    const board = '5' + '0'.repeat(80);
    const boardArr = board.split('').map(Number);
    const selectedIndex = 0;

    const styles = buildStyles(boardArr, selectedIndex, [
      'selected block',
      'selected row',
      'selected col',
      'same value',
    ]);

    // Box 0 cells should be subtle, row/col should be darker, selected should be blue
    let boxSubtleCount = 0;
    let rowLineCount = 0;
    let selectedCount = 0;

    for (let i = 0; i < 81; i++) {
      const row = Math.floor(i / 9);
      const col = i % 9;
      const inBox0 = row < 3 && col < 3;

      if (inBox0 && styles[i] === 'related-line-subtle') boxSubtleCount++;
      if ((row === 0 || col === 0) && styles[i] === 'related-line')
        rowLineCount++;
      if (i === 0 && styles[i] === 'selected') selectedCount++;
    }

    return expect(
      boxSubtleCount > 0 && rowLineCount > 0 && selectedCount === 1,
    ).toBe(true);
  });

  test("comprehensive 'related-all' mode highlighting respects precedence", () => {
    // Board with 5s spread across different rows/cols/boxes
    const boardStr =
      '5' + '0'.repeat(8) + '0' + '5' + '0'.repeat(6) + '5' + '0'.repeat(62);
    const board = boardStr.split('').map(Number);
    const selectedIndex = 0; // Cell 0 selected, value 5

    const styles = buildStyles(board, selectedIndex, [
      'same value rows',
      'same value cols',
      'same value blocks',
      'selected row',
      'selected col',
      'same value',
    ]);

    // Cell 0: selected - should be 'selected'
    let cell0Ok = styles[0] === 'selected';

    // Cell 4: same row as 0, not in box 0 - should be 'related-line' (row wins over box)
    let cell4Ok = styles[4] === 'related-line';

    // Cell 10: different row/col, has value 5 - should be 'same-num' (wins over subtle)
    let cell10Ok = styles[10] === 'same-num';

    return expect(cell0Ok && cell4Ok && cell10Ok).toBe(true);
  });

  test("buildStyles does not encode 'given' in style output", () => {
    const board = '5' + '0'.repeat(80);
    const boardArr = board.split('').map(Number);

    // Cell 0 is given
    const given = new Array(81).fill(false);
    given[0] = true;

    // Select cell 56 (row 6, col 2) - different row, col, and box from 0
    // This cell shares nothing with cell 0
    const styles = buildStyles(
      boardArr,
      56,
      ['selected block', 'selected row', 'selected col', 'same value'],
      given,
    );

    // Cell 0 is given but given is now an additive render class, not a style output
    const cell0Style = styles[0];

    // Cell 56 is selected - should be 'selected'
    const cell56Style = styles[56];

    return expect(cell0Style === '' && cell56Style === 'selected').toBe(true);
  });

  test('buildStyles keeps row and column styling when cell is given', () => {
    const board = '5' + '0'.repeat(80);
    const boardArr = board.split('').map(Number);

    // Cells 0-8 are given (row 0)
    const given = new Array(81).fill(false);
    for (let i = 0; i < 9; i++) {
      given[i] = true;
    }

    // Select cell 0
    const styles = buildStyles(
      boardArr,
      0,
      ['selected block', 'selected row', 'selected col', 'same value'],
      given,
    );

    // Cell 0 selected should get 'selected' (selection is highest priority)
    // Cell 1 should remain related-line in style output; given is added by render
    const cell0Ok = styles[0] === 'selected';
    const cell1Ok = styles[1] === 'related-line';

    return expect(cell0Ok && cell1Ok).toBe(true);
  });

  test("buildStyles matches exact expected styles in 'related-all' precedence order", () => {
    const board = new Array(81).fill(0);
    board[0] = 5;
    board[10] = 5;
    board[45] = 5;

    const given = new Array(81).fill(false);
    given[1] = true;
    given[10] = true;
    given[20] = true;

    const styles = buildStyles(
      board,
      0,
      [
        'same value rows',
        'same value cols',
        'same value blocks',
        'selected row',
        'selected col',
        'same value',
      ],
      given,
    );

    const expected = new Array(81).fill('');

    // 1) Similar rows (rows 0, 1, 5)
    for (let col = 0; col < 9; col++) {
      expected[col] = 'related-line-subtle';
      expected[9 + col] = 'related-line-subtle';
      expected[45 + col] = 'related-line-subtle';
    }

    // 2) Similar cols (cols 0, 1)
    for (let row = 0; row < 9; row++) {
      expected[row * 9] = 'related-line-subtle';
      expected[row * 9 + 1] = 'related-line-subtle';
    }

    // 3) Similar boxes (box 0 and box 3)
    const box0 = [0, 1, 2, 9, 10, 11, 18, 19, 20];
    const box3 = [27, 28, 29, 36, 37, 38, 45, 46, 47];
    for (const index of box0.concat(box3)) {
      expected[index] = 'related-line-subtle';
    }

    // 4) Direct row (row 0)
    for (let col = 0; col < 9; col++) {
      expected[col] = 'related-line';
    }

    // 5) Direct col (col 0)
    for (let row = 0; row < 9; row++) {
      expected[row * 9] = 'related-line';
    }

    // 6) Same number cells
    expected[0] = 'same-num';
    expected[10] = 'same-num';
    expected[45] = 'same-num';

    // 7) Selection
    expected[0] = 'selected';

    return expect(styles).toEqual(expected);
  });
};

runStylerTests();
