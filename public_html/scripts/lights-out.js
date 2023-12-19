"use strict";
const DEFAULT_KERNEL = [
    [false, true, false],
    [true, true, true],
    [false, true, false],
];
// TODO REMOVE
function printArray(array) {
    for (let i = 0; i < array.length; ++i) {
        let str = '';
        for (let j = 0; j < array[i].length; ++j) {
            str += array[i][j] ? '1' : '0';
        }
        console.log(str);
    }
}
// TODO REMOVE
function toArray(puzzle, rows, columns) {
    const array = Array.from({ length: rows }, () => new Array(columns));
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
function pushButton(buttonRow, buttonCol, puzzle, puzzleRows, puzzleCols, kernel, kernelRows, kernelCols, kernelCenterRow, kernelCenterCol, wrap) {
    for (let ki = 0; ki < kernelRows; ++ki) {
        let i = buttonRow + ki - kernelCenterRow;
        if (i < 0) {
            if (wrap) {
                i += puzzleRows;
            }
            else {
                continue;
            }
        }
        else if (i >= puzzleRows) {
            if (wrap) {
                i -= puzzleRows;
            }
            else {
                continue;
            }
        }
        for (let kj = 0; kj < kernelCols; ++kj) {
            let j = buttonCol + kj - kernelCenterCol;
            if (j < 0) {
                if (wrap) {
                    j += puzzleCols;
                }
                else {
                    continue;
                }
            }
            else if (j >= puzzleCols) {
                if (wrap) {
                    j -= puzzleCols;
                }
                else {
                    continue;
                }
            }
            puzzle[i][j] = puzzle[i][j] !== kernel[ki][kj];
        }
    }
}
function createMatrix(puzzle, puzzleRows, puzzleCols, kernel, kernelRows, kernelCols, kernelCenterRow, kernelCenterCol, wrap) {
    const buttons = puzzleRows * puzzleCols;
    const matrix = Array.from({ length: buttons }, () => new Array(buttons + 1));
    const tempPuzzle = Array.from({ length: puzzleRows }, () => new Array(puzzleCols).fill(false));
    for (let buttonRow = 0, matrixRowIndex = 0; buttonRow < puzzleRows; ++buttonRow) {
        for (let buttonCol = 0; buttonCol < puzzleCols; ++buttonCol, ++matrixRowIndex) {
            const matrixRow = matrix[matrixRowIndex];
            matrixRow[matrixRow.length - 1] = puzzle[buttonRow][buttonCol];
            pushButton(buttonRow, buttonCol, tempPuzzle, puzzleRows, puzzleCols, kernel, kernelRows, kernelCols, kernelCenterRow, kernelCenterCol, wrap);
            for (let i = 0, k = 0; i < puzzleRows; ++i) {
                for (let j = 0; j < puzzleCols; ++j, ++k) {
                    matrixRow[k] = tempPuzzle[i][j];
                }
            }
            pushButton(buttonRow, buttonCol, tempPuzzle, puzzleRows, puzzleCols, kernel, kernelRows, kernelCols, kernelCenterRow, kernelCenterCol, wrap);
        }
    }
    return matrix;
}
function swapRows(matrix, i0, i1) {
    const tempRow = matrix[i0];
    matrix[i0] = matrix[i1];
    matrix[i1] = tempRow;
}
function xorRow(matrix, source, target) {
    const sourceRow = matrix[source];
    const targetRow = matrix[target];
    for (let i = sourceRow.length - 1; i >= 0; --i) {
        targetRow[i] = targetRow[i] !== sourceRow[i];
    }
}
function verifySolution(solution, puzzle, puzzleRows, puzzleCols, kernel, kernelRows, kernelCols, kernelCenterRow, kernelCenterCol, wrap) {
    const tempPuzzle = puzzle.map(row => row.slice());
    for (let i = 0; i < puzzleRows; ++i) {
        for (let j = 0; j < puzzleCols; ++j) {
            if (solution[i][j]) {
                pushButton(i, j, tempPuzzle, puzzleRows, puzzleCols, kernel, kernelRows, kernelCols, kernelCenterRow, kernelCenterCol, wrap);
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
function solve(puzzle, kernel = DEFAULT_KERNEL, wrap = false) {
    const puzzleRows = puzzle.length;
    const puzzleCols = puzzle[0].length;
    const kernelRows = kernel.length;
    const kernelCols = kernel[0].length;
    const kernelCenterRow = Math.floor(kernelRows / 2);
    const kernelCenterCol = Math.floor(kernelCols / 2);
    const matrix = createMatrix(puzzle, puzzleRows, puzzleCols, kernel, kernelRows, kernelCols, kernelCenterRow, kernelCenterCol, wrap);
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
    const solution = Array.from({ length: puzzleRows }, () => new Array(puzzleCols).fill(false));
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
    if (!verifySolution(solution, puzzle, puzzleRows, puzzleCols, kernel, kernelRows, kernelCols, kernelCenterRow, kernelCenterCol, wrap)) {
        return null;
    }
    return solution;
}
// TODO TESTING
async function loadImage(imageUrl) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = e => reject(new Error('Failed to load image.'));
        image.src = imageUrl;
        // fetch(imageUrl)
        //     .then(response => response.blob())
        //     .then(blob => image.src = URL.createObjectURL(blob))
        //     .catch(e => reject(e));
    });
}
// TODO TESTING
async function init() {
    const image = await loadImage('button-pink.svg');
    console.log(image);
    const canvas = document.getElementById('lights-out-canvas');
    if (canvas === null) {
        return; // TODO HANDLE ERROR
    }
    const ctx = canvas.getContext('2d');
    if (ctx === null) {
        return; // TODO HANDLE ERROR
    }
    ctx.fillStyle = window.getComputedStyle(document.body).backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 5; ++i) {
        for (let j = 0; j < 5; ++j) {
            ctx.drawImage(image, 42 * i, 42 * j);
        }
    }
}
document.addEventListener('DOMContentLoaded', init);
//# sourceMappingURL=lights-out.js.map