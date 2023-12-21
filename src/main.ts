import { Kernel, Puzzle } from './puzzle.js';

const BUTTON_SIZE = 50;
const INITIAL_PUZZLE_SIZE = 5;
const SHAKE_MILLIS = 500;

enum State {
    PLAYING,
    EDITING,
    CONFIGURING
}

interface ButtonCoordinates {
    row: number;
    col: number;
}

interface KeyValueObject {
    [ key: string ]: string;
}

const panels: KeyValueObject = {
    puzzleOps: 'puzzle-ops-panel',
    puzzleEdit: 'puzzle-edit-panel'
};

let kernel = new Kernel();
let puzzle = new Puzzle(kernel, INITIAL_PUZZLE_SIZE, INITIAL_PUZZLE_SIZE).mix();

let purpleButtonImages: HTMLImageElement[] = new Array(2);
let pinkButtonImages: HTMLImageElement[] = new Array(2);
let plusImages: HTMLImageElement[] = new Array(2);

let hoverRow = -1;
let hoverCol = -1;

let solution: boolean[][] | null = null;

let shaking = false;

let state = State.PLAYING;

function shakeSolveButton() {
    if (shaking) {
        return;
    }
    const button = document.getElementById('solveButton') as HTMLButtonElement;
    shaking = true;
    let shakingStartTime = -1;
    const shake = (timeStamp: number) => {
        if (!shaking) {
            return;
        }
        if (shakingStartTime < 0) {
            shakingStartTime = timeStamp;
        }
        const duration = timeStamp - shakingStartTime;
        if (duration > SHAKE_MILLIS) {
            stopShakingSolveButton();
            return;
        }
        button.style.transform = `translateX(${5 * Math.sin(15 * Math.PI * duration / SHAKE_MILLIS)}px)`;
        requestAnimationFrame(shake);
    };
    requestAnimationFrame(shake);
}

function stopShakingSolveButton() {
    shaking = false;
    (document.getElementById('solveButton') as HTMLButtonElement).style.transform = '';
}

function showEdit() {
    state = State.EDITING;

    const puzzleOpsDiv = document.getElementById('puzzle-ops') as HTMLDivElement;
    puzzleOpsDiv.innerHTML = panels.puzzleEdit;
    (document.getElementById('fillButton') as HTMLButtonElement).addEventListener('click', _ => fillPressed());
    (document.getElementById('clearButton') as HTMLButtonElement).addEventListener('click', _ => clearPressed());
    (document.getElementById('doneButton') as HTMLButtonElement).addEventListener('click', _ => editDonePressed());
}

function fillPressed() {
    // TODO puzzle.fill(); in Matrix
}

function clearPressed() {
    // TODO puzzle.clear(); in Matrix
}

function editDonePressed() {
    showPuzzleOperations();
}

function showPuzzleOperations() {
    state = State.PLAYING;

    const puzzleOpsDiv = document.getElementById('puzzle-ops') as HTMLDivElement;
    puzzleOpsDiv.innerHTML = panels.puzzleOps;

    (document.getElementById('mixButton') as HTMLButtonElement).addEventListener('click', _ => mixPressed());
    (document.getElementById('solveButton') as HTMLButtonElement).addEventListener('click', _ => solvePressed());
    (document.getElementById('editButton') as HTMLButtonElement).addEventListener('click', _ => editPressed());
    (document.getElementById('configButton') as HTMLButtonElement).addEventListener('click', _ => configPressed());
}

function mixPressed() {
    solution = null;
    stopShakingSolveButton();
    puzzle.mix();
    renderPuzzle();
}

function solvePressed() {
    solution = puzzle.solve();
    if (solution === null) {
        shakeSolveButton();
    } else {
        renderPuzzle();
    }
}

function editPressed() {
    stopShakingSolveButton();
    showEdit();
    solution = null;
    renderPuzzle();
}

function configPressed() {
    stopShakingSolveButton();
    solution = null;
}

function toButtonCoordinates(canvas: HTMLCanvasElement, e: MouseEvent): ButtonCoordinates {
    const rect = canvas.getBoundingClientRect();
    return {
        row: Math.floor((e.clientY - rect.top) * canvas.height / (BUTTON_SIZE * rect.height)),
        col: Math.floor((e.clientX - rect.left) * canvas.width / (BUTTON_SIZE * rect.width))
    };
}

function initPuzzleCanvas() {
    const canvas = document.getElementById('puzzle-canvas') as HTMLCanvasElement;
    canvas.height = BUTTON_SIZE * puzzle.rows;
    canvas.width = BUTTON_SIZE * puzzle.cols;
    canvas.addEventListener('click', e => puzzleCanvasClicked(toButtonCoordinates(canvas, e)));
    canvas.addEventListener('blur', _ => puzzleCanvasExited());
    canvas.addEventListener('mouseenter', e => puzzleCanvasHovered(toButtonCoordinates(canvas, e)));
    canvas.addEventListener('mousemove', e => puzzleCanvasHovered(toButtonCoordinates(canvas, e)));
    canvas.addEventListener('mouseleave', _ => puzzleCanvasExited());
}

function puzzleCanvasClicked(b: ButtonCoordinates) {
    if (state == State.PLAYING) {
        puzzle.pushButton(b.row, b.col);
    } else {
        puzzle.entries[b.row][b.col] = !puzzle.entries[b.row][b.col];
    }
    if (solution !== null) {
        solution[b.row][b.col] = !solution[b.row][b.col];
        outer: {
            for (let i = puzzle.rows - 1; i >= 0; --i) {
                for (let j = puzzle.cols - 1; j >= 0; --j) {
                    if (solution[i][j]) {
                        break outer;
                    }
                }
            }
            solution = null;
        }
    }
    renderPuzzle();
}

function puzzleCanvasHovered(b: ButtonCoordinates) {
    hoverRow = b.row;
    hoverCol = b.col;
    renderPuzzle();
}

function puzzleCanvasExited() {
    hoverRow = -1;
    hoverCol = -1;
    renderPuzzle();
}

function renderPuzzle() {
    const canvas = document.getElementById('puzzle-canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    if (ctx === null) {
        return; // TODO HANDLE ERROR
    }
    ctx.fillStyle = window.getComputedStyle(document.body).backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = puzzle.rows - 1; i >= 0; --i) {
        for (let j = puzzle.cols - 1; j >= 0; --j) {
            const hover = (i == hoverRow && j == hoverCol) ? 1 : 0;
            ctx.drawImage(puzzle.entries[i][j] ? pinkButtonImages[hover] : purpleButtonImages[hover],
                1 + BUTTON_SIZE * j, 1 + BUTTON_SIZE * i);
            if (solution === null || !solution[i][j]) {
                continue;
            }
            ctx.drawImage(plusImages[hover], 13 + BUTTON_SIZE * j, 13 + BUTTON_SIZE * i);
        }
    }
}

async function loadPanels() {
    await Promise.all(Object.keys(panels).map(async key => {
        const response = await fetch(`${panels[key]}.html`);
        if (response.ok) {
            panels[key] = await response.text();
        }
    }));
}

async function loadImage(imageUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = _ => reject(new Error('Failed to load image.'));
        image.src = imageUrl;
        // fetch(imageUrl)
        //     .then(response => response.blob())
        //     .then(blob => image.src = URL.createObjectURL(blob))
        //     .catch(e => reject(e));
    });
}

// TODO TESTING
async function init() {

    await loadPanels();

    console.log(panels[panels.puzzleOps]);

    showPuzzleOperations();

    pinkButtonImages[0] = await loadImage('button-pink.svg');
    pinkButtonImages[1] = await loadImage('button-dark-pink.svg');
    purpleButtonImages[0] = await loadImage('button-purple.svg');
    purpleButtonImages[1] = await loadImage('button-dark-purple.svg');
    plusImages[0] = await loadImage('plus.svg');
    plusImages[1] = await loadImage('dark-plus.svg');

    initPuzzleCanvas();
    renderPuzzle();
}

document.addEventListener('DOMContentLoaded', init);