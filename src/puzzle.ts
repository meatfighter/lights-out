class Matrix {

    readonly entries: boolean[][];
    readonly rows: number;
    readonly cols: number;

    constructor(entries: Matrix | boolean[][] | string | number, rows?: number, cols?: number) {
        if (entries instanceof Matrix) {
            this.entries = entries.entries.map(row => row.slice());
            this.rows = rows !== undefined ? rows : entries.entries.length;
            this.cols = cols !== undefined ? cols : entries.entries[0].length;
        } else if (typeof entries === 'string') {
            if (rows === undefined) {
                throw new TypeError('Rows not specified.');
            }
            if (cols == undefined) {
                throw new TypeError('Cols not specified.');
            }
            this.rows = rows;
            this.cols = cols;
            this.entries = this.toBooleans(entries, rows, cols);
        } else if (typeof entries === 'number') {
            if (rows === undefined) {
                throw new TypeError('Cols not specified.');
            }
            this.entries = Array.from({ length: entries }, () => new Array(rows).fill(false));
            this.rows = entries;
            this.cols = rows;
        } else {
            this.entries = entries;
            this.rows = rows !== undefined ? rows : entries.length;
            this.cols = cols !== undefined ? cols : entries[0].length;
        }
    }

    private toBooleans(entries: string, rows: number, cols: number) {
        const array: boolean[][] = Array.from({ length: rows }, () => new Array(cols));
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

    swapRows(i0: number, i1: number) {
        const tempRow = this.entries[i0];
        this.entries[i0] = this.entries[i1];
        this.entries[i1] = tempRow;
        return this;
    }

    xorRow(source: number, target: number) {
        const sourceRow = this.entries[source];
        const targetRow = this.entries[target];
        for (let i = this.cols - 1; i >= 0; --i) {
            targetRow[i] = targetRow[i] !== sourceRow[i];
        }
        return this;
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
        return this;
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

export class Kernel extends Matrix {

    private static readonly DEFAULT_MATRIX = [
        [ false, true, false ],
        [ true, true, true ],
        [ false, true, false ],
    ];

    readonly wrap: boolean;
    readonly centerRow: number;
    readonly centerCol: number;

    public constructor(wrap: boolean = false, entries: Kernel | boolean[][] | string | number = Kernel.DEFAULT_MATRIX,
                       rows?: number, cols?: number) {
        super(entries, rows, cols);
        this.wrap = wrap;
        this.centerRow = Math.floor(this.rows / 2);
        this.centerCol = Math.floor(this.cols / 2);
    }
}

export class Puzzle extends Matrix {

    readonly kernel: Kernel;

    constructor(kernel: Kernel, entries: Puzzle | boolean[][] | string | number, rows?: number, cols?: number) {
        super(entries, rows, cols);
        this.kernel = kernel;
    }

    pushButton(row: number, col: number) {
        const rowOffset = row - this.kernel.centerRow;
        const colOffset = col - this.kernel.centerCol;
        for (let ki = this.kernel.rows - 1; ki >= 0; --ki) {
            let i = rowOffset + ki;
            if (i < 0) {
                if (this.kernel.wrap) {
                    i += this.rows;
                } else {
                    continue;
                }
            } else if (i >= this.rows) {
                if (this.kernel.wrap) {
                    i -= this.rows;
                } else {
                    continue;
                }
            }
            for (let kj = this.kernel.cols - 1; kj >= 0; --kj) {
                let j = colOffset + kj;
                if (j < 0) {
                    if (this.kernel.wrap) {
                        j += this.cols;
                    } else {
                        continue;
                    }
                } else if (j >= this.cols) {
                    if (this.kernel.wrap) {
                        j -= this.cols;
                    } else {
                        continue;
                    }
                }
                this.entries[i][j] = this.entries[i][j] !== this.kernel.entries[ki][kj];
            }
        }
    }

    private verifySolution(solution: boolean[][]) {

        const puzzle = new Puzzle(this.kernel, this);

        for (let i = this.rows - 1; i >= 0; --i) {
            for (let j = this.cols - 1; j >= 0; --j) {
                if (solution[i][j]) {
                    puzzle.pushButton(i, j);
                }
            }
        }

        for (let i = this.rows - 1; i >= 0; --i) {
            for (let j = this.cols - 1; j >= 0; --j) {
                if (puzzle.entries[i][j]) {
                    return false;
                }
            }
        }

        return true;
    }

    private createAugmentedMatrix() {

        const buttons = this.rows * this.cols;
        const matrix = new Matrix(buttons, buttons + 1);
        const puzzle = new Puzzle(this.kernel, this.rows, this.cols);

        for (let buttonRow = 0, matrixIndex = 0; buttonRow < this.rows; ++buttonRow) {
            for (let buttonCol = 0; buttonCol < this.cols; ++buttonCol, ++matrixIndex) {
                matrix.entries[matrixIndex][buttons] = this.entries[buttonRow][buttonCol];
                puzzle.pushButton(buttonRow, buttonCol);
                for (let i = 0, k = 0; i < this.rows; ++i) {
                    for (let j = 0; j < this.cols; ++j, ++k) {
                        matrix.entries[k][matrixIndex] = puzzle.entries[i][j];
                    }
                }
                puzzle.pushButton(buttonRow, buttonCol);
            }
        }

        return matrix;
    }

    solve(): boolean[][] | null {

        const matrix = this.createAugmentedMatrix().reduce();
        const solution: boolean[][] = Array.from({ length: this.rows }, () => new Array(this.cols).fill(false));
        for (let i = 0, row = 0, col = 0; i < matrix.rows; ++i) {
            if (!matrix.entries[i][i]) {
                break;
            }
            solution[row][col] = matrix.entries[i][matrix.rows];
            if (++col == this.cols) {
                col = 0;
                ++row;
            }
        }

        if (!this.verifySolution(solution)) {
            return null;
        }

        return solution;
    }

    mix() {
        for (let i = this.rows - 1; i >= 0; --i) {
            this.entries[i].fill(false);
        }
        for (let i = this.rows - 1; i >= 0; --i) {
            for (let j = this.cols - 1; j >= 0; --j) {
                if (Math.random() < 0.5) {
                    this.pushButton(i, j);
                }
            }
        }
        return this;
    }
}