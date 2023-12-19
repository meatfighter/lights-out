const DEFAULT_KERNEL = [
    [ false, true, false ],
    [ true, true, true ],
    [ false, true, false ],
];

// TODO REMOVE
function printArray(array: boolean[][]) {
    for (let i = 0; i < array.length; ++i) {
        let str = '';
        for (let j = 0; j < array[i].length; ++j) {
            str += array[i][j] ? '1' : '0';
        }
        console.log(str);
    }
}

// TODO REMOVE
function toArray(puzzle: string, rows: number, columns: number): boolean[][] {
    const array: boolean[][] = Array.from({ length: rows }, () => new Array(columns));
    let i = 0;
    let j = 0;
    for (const c of puzzle) {
        if (/\s/.test(c)) {
            continue;
        }
        array[i][j] = c !== '0';
        if (++j === columns) {
            j = 0;
            ++i;
        }
    }
    return array;
}

class Button {

    readonly buttonRow: number;
    readonly buttonCol: number;

    constructor(buttonRow: number, buttonCol: number) {
        this.buttonRow = buttonRow;
        this.buttonCol = buttonCol;
    }
}

function pushButton(buttonRow : number,
                    buttonCol : number,
                    puzzle: boolean[][],
                    puzzleRows: number,
                    puzzleCols: number,
                    kernel = DEFAULT_KERNEL,
                    kernelRows = DEFAULT_KERNEL.length,
                    kernelCols = DEFAULT_KERNEL[0].length,
                    kernelCenterRow = Math.floor(DEFAULT_KERNEL.length / 2),
                    kernelCenterCol = Math.floor(DEFAULT_KERNEL[0].length / 2),
                    wrap = false) {

    for (let ki = 0; ki < kernelRows; ++ki) {
        let i = buttonRow + ki - kernelCenterRow;
        if (i < 0) {
            if (wrap) {
                i += puzzleRows;
            } else {
                continue;
            }
        } else if (i >= puzzleRows) {
            if (wrap) {
                i -= puzzleRows;
            } else {
                continue;
            }
        }
        for (let kj = 0; kj < kernelCols; ++kj) {
            let j = buttonCol + kj - kernelCenterCol;
            if (j < 0) {
                if (wrap) {
                    j += puzzleCols;
                } else {
                    continue;
                }
            } else if (j >= puzzleCols) {
                if (wrap) {
                    j -= puzzleCols;
                } else {
                    continue;
                }
            }
            puzzle[i][j] = puzzle[i][j] !== kernel[ki][kj];
        }
    }
}

function createMatrix(puzzle: boolean[][], kernel = DEFAULT_KERNEL, wrap = false) {
    const puzzleRows = puzzle.length;
    const puzzleCols = puzzle[0].length;
    const puzzleCells = puzzleRows * puzzleCols;
    const matrix: boolean[][] = Array.from({ length: puzzleCells }, () => new Array(puzzleCells + 1));

    const kernelRows = kernel.length;
    const kernelCols = kernel[0].length;
    const kernelCenterRow = Math.floor(kernelRows / 2);
    const kernelCenterCol = Math.floor(kernelCols / 2);

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

function swapRows(matrix: boolean[][], i0: number, i1: number) {
    const tempRow = matrix[i0];
    matrix[i0] = matrix[i1];
    matrix[i1] = tempRow;
}

function xorRow(matrix: boolean[][], source: number, target: number) {
    const sourceRow = matrix[source];
    const targetRow = matrix[target];
    for (let i = sourceRow.length - 1; i >= 0; --i) {
        targetRow[i] = targetRow[i] !== sourceRow[i];
    }
}

function solve(puzzle: boolean[][], kernel = DEFAULT_KERNEL, wrap = false): Button[] {

    const matrix = createMatrix(puzzle, kernel, wrap);
    const matrixRows = matrix.length;
    const matrixCols = matrix[0].length;
    const buttonCols = matrixCols - 1;

    for (let j = 0; j < buttonCols; ++j) {
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

    
}

solve(toArray(`
00001
01101
10111
10010
01101
`, 5, 5));

// const puzzle = toArray(`
// 00000
// 00000
// 00000
// 00000
// 00000
// `, 5, 5);
// applyKernel(puzzle, 5, 5, 1, 1);
// const matrixRow: boolean[] = new Array(25);
// for (let i = 0, k = 0; i < 5; ++i) {
//     for (let j = 0; j < 5; ++j, ++k) {
//         matrixRow[k] = puzzle[i][j];
//     }
// }
// applyKernel(puzzle, 5, 5, 1, 1);
// let str = '';
// for (let j = 0; j < matrixRow.length; ++j) {
//     str += matrixRow[j] ? '1' : '0';
// }
// console.log(str);