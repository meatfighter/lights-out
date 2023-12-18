const DEFAULT_KERNEL = [
    [ false, true, false ],
    [ true, true, true ],
    [ false, true, false ],
];

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

function applyKernel(puzzle: boolean[][],
                     puzzleRows: number,
                     puzzleCols: number,
                     cellRow : number,
                     cellCol : number,
                     kernel = DEFAULT_KERNEL,
                     kernelRows = DEFAULT_KERNEL.length,
                     kernelCols = DEFAULT_KERNEL[0].length,
                     kernelCenterRow = Math.floor(DEFAULT_KERNEL.length / 2),
                     kernelCenterCol = Math.floor(DEFAULT_KERNEL[0].length / 2),
                     wrap = false) {

    for (let ki = 0; ki < kernelRows; ++ki) {
        let i = cellRow + ki - kernelCenterRow;
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
            let j = cellCol + kj - kernelCenterCol;
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

function solve(puzzle: boolean[][], kernel = DEFAULT_KERNEL, wrap = false) {

    const puzzleRows = puzzle.length;
    const puzzleCols = puzzle[0].length;
    const puzzleCells = puzzleRows * puzzleCols;
    const matrix: boolean[][] = Array.from({ length: puzzleCells }, () => new Array(puzzleCells + 1));

    const kernelRows = kernel.length;
    const kernelCols = kernel[0].length;
    const kernelCenterRow = Math.floor(kernelRows / 2);
    const kernelCenterCol = Math.floor(kernelCols / 2);

    const tempPuzzle: boolean[][] = Array.from({ length: puzzleRows }, () => new Array(puzzleCols));
    for (let cellRow = 0, matrixRowIndex = 0; cellRow < puzzleRows; ++cellRow) {
        for (let cellCol = 0; cellCol < puzzleCols; ++cellCol, ++matrixRowIndex) {
            const matrixRow = matrix[matrixRowIndex];
            matrixRow[matrixRow.length - 1] = puzzle[cellRow][cellCol];
            applyKernel(tempPuzzle, puzzleRows, puzzleCols, cellRow, cellCol, kernel, kernelRows, kernelCols,
                kernelCenterRow, kernelCenterCol, wrap);
            for (let i = 0, k = 0; i < puzzleRows; ++i) {
                for (let j = 0; j < puzzleCols; ++j, ++k) {
                    matrixRow[k] = tempPuzzle[i][j];
                }
            }
            applyKernel(tempPuzzle, puzzleRows, puzzleCols, cellRow, cellCol, kernel, kernelRows, kernelCols,
                kernelCenterRow, kernelCenterCol, wrap);
        }
    }
}

solve(toArray(`
11101
01100
10011
00101
01010
`, 5, 5));