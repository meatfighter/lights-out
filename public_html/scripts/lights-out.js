"use strict";
class Matrix {
    entries;
    rows;
    cols;
    constructor(entries, rows, cols) {
        if (entries instanceof Matrix) {
            this.entries = entries.entries.map(row => row.slice());
            this.rows = entries.rows;
            this.cols = entries.cols;
        }
        else if (typeof entries === 'string') {
            if (rows === undefined) {
                throw new TypeError('Rows not specified.');
            }
            if (cols == undefined) {
                throw new TypeError('Cols not specified.');
            }
            this.entries = this.toBooleans(entries, rows, cols);
            this.rows = rows;
            this.cols = cols;
        }
        else {
            this.entries = entries;
            this.rows = rows !== undefined ? rows : entries.length;
            this.cols = cols !== undefined ? cols : entries[0].length;
        }
    }
    toBooleans(entries, rows, cols) {
        const array = Array.from({ length: rows }, () => new Array(cols));
        let i = 0;
        let j = 0;
        for (const entry of entries) {
            if (/\s/.test(entry)) {
                continue;
            }
            array[i][j] = entry !== '0';
            if (++j === cols) {
                j = 0;
                ++i;
            }
        }
        return array;
    }
    swapRows(i0, i1) {
        const tempRow = this.entries[i0];
        this.entries[i0] = this.entries[i1];
        this.entries[i1] = tempRow;
    }
    xorRow(source, target) {
        const sourceRow = this.entries[source];
        const targetRow = this.entries[target];
        for (let i = this.cols - 1; i >= 0; --i) {
            targetRow[i] = targetRow[i] !== sourceRow[i];
        }
    }
    reduce() {
        for (let j = 0; j < this.rows; ++j) {
            inner: {
                for (let i = j; i < this.rows; ++i) {
                    if (this.entries[i][j]) {
                        this.swapRows(i, j);
                        break inner;
                    }
                }
                continue;
            }
            for (let i = 0; i < this.rows; ++i) {
                if (i == j) {
                    continue;
                }
                if (this.entries[i][j]) {
                    this.xorRow(j, i);
                }
            }
        }
    }
    toString() {
        let str = '';
        for (let i = 0; i < this.rows; ++i) {
            for (let j = 0; j < this.cols; ++j) {
                str += this.entries[i][j] ? '1' : '0';
            }
            str += '\n';
        }
        return str;
    }
}
class Kernel extends Matrix {
    static DEFAULT_MATRIX = [
        [false, true, false],
        [true, true, true],
        [false, true, false],
    ];
    wrap;
    centerRow;
    centerCol;
    constructor(wrap, entries = Kernel.DEFAULT_MATRIX, rows, cols) {
        super(entries, rows, cols);
        this.wrap = wrap;
        this.centerRow = Math.floor(this.rows / 2);
        this.centerCol = Math.floor(this.cols / 2);
    }
}
class Puzzle extends Matrix {
    kernel;
    constructor(kernel, entries, rows, cols) {
        super(entries, rows, cols);
        this.kernel = kernel;
    }
    pushButton(row, col) {
        const rowOffset = row - this.kernel.centerRow;
        const colOffset = col - this.kernel.centerCol;
        for (let ki = this.kernel.rows - 1; ki >= 0; --ki) {
            let i = rowOffset + ki;
            if (i < 0) {
                if (this.kernel.wrap) {
                    i += this.rows;
                }
                else {
                    continue;
                }
            }
            else if (i >= this.rows) {
                if (this.kernel.wrap) {
                    i -= this.rows;
                }
                else {
                    continue;
                }
            }
            for (let kj = this.kernel.cols - 1; kj >= 0; --kj) {
                let j = colOffset + kj;
                if (j < 0) {
                    if (this.kernel.wrap) {
                        j += this.cols;
                    }
                    else {
                        continue;
                    }
                }
                else if (j >= this.cols) {
                    if (this.kernel.wrap) {
                        j -= this.cols;
                    }
                    else {
                        continue;
                    }
                }
                this.entries[i][j] = this.entries[i][j] !== this.kernel.entries[ki][kj];
            }
        }
    }
}
/*


function createMatrix(puzzle: boolean[][], puzzleRows: number, puzzleCols: number, kernel: boolean[][],
                      kernelRows: number, kernelCols: number, kernelCenterRow: number, kernelCenterCol: number,
                      wrap: boolean) {

    const buttons = puzzleRows * puzzleCols;
    const matrix: boolean[][] = Array.from({ length: buttons }, () => new Array(buttons + 1));

    const tempPuzzle: boolean[][] = Array.from({ length: puzzleRows }, () => new Array(puzzleCols).fill(false));
    for (let buttonRow = 0, matrixRowIndex = 0; buttonRow < puzzleRows; ++buttonRow) {
        for (let buttonCol = 0; buttonCol < puzzleCols; ++buttonCol, ++matrixRowIndex) {
            const matrixRow = matrix[matrixRowIndex];
            matrixRow[matrixRow.length - 1] = puzzle[buttonRow][buttonCol];
            pushButton(buttonRow, buttonCol, tempPuzzle, puzzleRows, puzzleCols, kernel, kernelRows, kernelCols,
                kernelCenterRow, kernelCenterCol, wrap);
            for (let i = 0, k = 0; i < puzzleRows; ++i) {
                for (let j = 0; j < puzzleCols; ++j, ++k) {
                    matrixRow[k] = tempPuzzle[i][j];
                }
            }
            pushButton(buttonRow, buttonCol, tempPuzzle, puzzleRows, puzzleCols, kernel, kernelRows, kernelCols,
                kernelCenterRow, kernelCenterCol, wrap);
        }
    }

    return matrix;
}



function verifySolution(solution: boolean[][], puzzle: boolean[][], puzzleRows: number, puzzleCols: number,
                        kernel: boolean[][], kernelRows: number, kernelCols: number, kernelCenterRow: number,
                        kernelCenterCol: number, wrap: boolean) {

    const tempPuzzle = puzzle.map(row => row.slice());
    for (let i = 0; i < puzzleRows; ++i) {
        for (let j = 0; j < puzzleCols; ++j) {
            if (solution[i][j]) {
                pushButton(i, j, tempPuzzle, puzzleRows, puzzleCols, kernel, kernelRows, kernelCols, kernelCenterRow,
                    kernelCenterCol, wrap);
            }
        }
    }
    for (let i = 0; i < puzzleRows; ++i) {
        for (let j = 0; j < puzzleCols; ++j) {
            if (tempPuzzle[i][j]) {
                return false;
            }
        }
    }
    return true;
}

function solve(puzzle: boolean[][], kernel = DEFAULT_KERNEL, wrap = false): boolean[][] | null {

    const puzzleRows = puzzle.length;
    const puzzleCols = puzzle[0].length;

    const kernelRows = kernel.length;
    const kernelCols = kernel[0].length;
    const kernelCenterRow = Math.floor(kernelRows / 2);
    const kernelCenterCol = Math.floor(kernelCols / 2);

    const matrix = createMatrix(puzzle, puzzleRows, puzzleCols, kernel, kernelRows, kernelCols, kernelCenterRow,
        kernelCenterCol, wrap);
    const matrixRows = matrix.length;

    for (let j = 0; j < matrixRows; ++j) {
        outer: {
            for (let i = j; i < matrixRows; ++i) {
                if (matrix[i][j]) {
                    swapRows(matrix, i, j);
                    break outer;
                }
            }
            break;
        }
        for (let i = 0; i < matrixRows; ++i) {
            if (i == j) {
                continue;
            }
            if (matrix[i][j]) {
                xorRow(matrix, j, i);
            }
        }
    }

    const solution: boolean[][] = Array.from({ length: puzzleRows }, () => new Array(puzzleCols).fill(false));
    for (let i = 0, row = 0, col = 0; i < matrixRows; ++i) {
        if (!matrix[i][i]) {
            break;
        }
        solution[row][col] = matrix[i][matrixRows];
        if (++col == puzzleCols) {
            col = 0;
            ++row;
        }
    }

    if (!verifySolution(solution, puzzle, puzzleRows, puzzleCols, kernel, kernelRows, kernelCols, kernelCenterRow,
        kernelCenterCol, wrap)) {
        return null;
    }

    return solution;
}*/ 
//# sourceMappingURL=lights-out.js.map