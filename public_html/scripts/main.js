import { Kernel, Puzzle } from './puzzle.js';
const BUTTON_SIZE = 50;
const INITIAL_PUZZLE_SIZE = 5;
const SHAKE_MILLIS = 500;
var State;
(function (State) {
    State[State["PLAYING"] = 0] = "PLAYING";
    State[State["EDITING"] = 1] = "EDITING";
    State[State["CONFIGURING"] = 2] = "CONFIGURING";
})(State || (State = {}));
let state = State.PLAYING;
let kernel = new Kernel();
let puzzle = new Puzzle(kernel, INITIAL_PUZZLE_SIZE, INITIAL_PUZZLE_SIZE).mix();
let purpleButtonImages = new Array(2);
let pinkButtonImages = new Array(2);
let plusImages = new Array(2);
let hoverRow = -1;
let hoverCol = -1;
let solution = null;
let shaking = false;
function shakeSolveButton() {
    const button = document.getElementById('solveButton');
    if (button === null || shaking) {
        return;
    }
    shaking = true;
    let shakingStartTime = -1;
    const shake = (timeStamp) => {
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
    const button = document.getElementById('solveButton');
    if (button === null) {
        return;
    }
    button.style.transform = '';
}
function initPuzzleOperations() {
    document.getElementById('mixButton')?.addEventListener('click', _ => mixButtonPressed());
    document.getElementById('solveButton')?.addEventListener('click', _ => solveButtonPressed());
    document.getElementById('editButton')?.addEventListener('click', _ => editButtonPressed());
    document.getElementById('ConfigButton')?.addEventListener('click', _ => configButtonPressed());
}
function mixButtonPressed() {
    solution = null;
    stopShakingSolveButton();
    puzzle.mix();
    renderPuzzle();
}
function solveButtonPressed() {
    solution = puzzle.solve();
    if (solution === null) {
        shakeSolveButton();
    }
    else {
        renderPuzzle();
    }
}
function editButtonPressed() {
    stopShakingSolveButton();
    solution = null;
    renderPuzzle();
}
function configButtonPressed() {
    stopShakingSolveButton();
    solution = null;
}
function toButtonCoordinates(canvas, e) {
    const rect = canvas.getBoundingClientRect();
    return {
        row: Math.floor((e.clientY - rect.top) * canvas.height / (BUTTON_SIZE * rect.height)),
        col: Math.floor((e.clientX - rect.left) * canvas.width / (BUTTON_SIZE * rect.width))
    };
}
function initPuzzleCanvas() {
    const canvas = document.getElementById('puzzle-canvas');
    if (canvas === null) {
        return; // TODO HANDLE ERROR
    }
    canvas.height = BUTTON_SIZE * puzzle.rows;
    canvas.width = BUTTON_SIZE * puzzle.cols;
    canvas.addEventListener('click', e => puzzleCanvasClicked(toButtonCoordinates(canvas, e)));
    canvas.addEventListener('blur', _ => puzzleCanvasExited());
    canvas.addEventListener('mouseenter', e => puzzleCanvasHovered(toButtonCoordinates(canvas, e)));
    canvas.addEventListener('mousemove', e => puzzleCanvasHovered(toButtonCoordinates(canvas, e)));
    canvas.addEventListener('mouseleave', _ => puzzleCanvasExited());
}
function puzzleCanvasClicked(b) {
    puzzle.pushButton(b.row, b.col);
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
function puzzleCanvasHovered(b) {
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
    const canvas = document.getElementById('puzzle-canvas');
    if (canvas === null) {
        return; // TODO HANDLE ERROR
    }
    const ctx = canvas.getContext('2d');
    if (ctx === null) {
        return; // TODO HANDLE ERROR
    }
    ctx.fillStyle = window.getComputedStyle(document.body).backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = puzzle.rows - 1; i >= 0; --i) {
        for (let j = puzzle.cols - 1; j >= 0; --j) {
            const hover = (i == hoverRow && j == hoverCol) ? 1 : 0;
            ctx.drawImage(puzzle.entries[i][j] ? pinkButtonImages[hover] : purpleButtonImages[hover], 1 + BUTTON_SIZE * j, 1 + BUTTON_SIZE * i);
            if (solution === null || !solution[i][j]) {
                continue;
            }
            ctx.drawImage(plusImages[hover], 13 + BUTTON_SIZE * j, 13 + BUTTON_SIZE * i);
        }
    }
}
async function loadImage(imageUrl) {
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
    pinkButtonImages[0] = await loadImage('button-pink.svg');
    pinkButtonImages[1] = await loadImage('button-dark-pink.svg');
    purpleButtonImages[0] = await loadImage('button-purple.svg');
    purpleButtonImages[1] = await loadImage('button-dark-purple.svg');
    plusImages[0] = await loadImage('plus.svg');
    plusImages[1] = await loadImage('dark-plus.svg');
    initPuzzleCanvas();
    initPuzzleOperations();
    renderPuzzle();
}
document.addEventListener('DOMContentLoaded', init);
//# sourceMappingURL=main.js.map