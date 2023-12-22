import { Kernel, Puzzle } from './puzzle.js';
const BUTTON_SIZE = 50;
const MIN_PUZZLE_SIZE = 3;
const INITIAL_PUZZLE_SIZE = 5;
const MAX_PUZZLE_SIZE = 10;
const SHAKE_MILLIS = 500;
var State;
(function (State) {
    State[State["PLAYING"] = 0] = "PLAYING";
    State[State["EDITING"] = 1] = "EDITING";
    State[State["CONFIGURING"] = 2] = "CONFIGURING";
})(State || (State = {}));
const panels = {
    puzzle: 'puzzle-panel',
    puzzleOps: 'puzzle-ops-panel',
    puzzleEdit: 'puzzle-edit-panel',
    config: 'config-panel'
};
const purpleButtonImages = new Array(2);
const pinkButtonImages = new Array(2);
const plusImages = new Array(2);
let kernel = new Kernel();
let puzzle = new Puzzle(kernel, INITIAL_PUZZLE_SIZE, INITIAL_PUZZLE_SIZE).mix();
let hover = null;
let solution = null;
let shaking = false;
let state = State.PLAYING;
function shakeSolveButton() {
    if (shaking) {
        return;
    }
    const button = document.getElementById('solveButton');
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
    document.getElementById('solveButton').style.transform = '';
}
function showEdit() {
    state = State.EDITING;
    hover = null;
    solution = null;
    const puzzleOpsDiv = document.getElementById('puzzle-ops');
    puzzleOpsDiv.innerHTML = panels.puzzleEdit;
    document.getElementById('fillButton').addEventListener('click', _ => fillPressed());
    document.getElementById('clearButton').addEventListener('click', _ => clearPressed());
    document.getElementById('doneButton').addEventListener('click', _ => editDonePressed());
}
function fillPressed() {
    puzzle.fill(true);
    renderPuzzle();
}
function clearPressed() {
    puzzle.fill(false);
    renderPuzzle();
}
function editDonePressed() {
    showPuzzleOperations();
}
function showConfig() {
    state = State.CONFIGURING;
    hover = null;
    solution = null;
    document.getElementById('main-container').innerHTML = panels.config;
    document.getElementById('minusButton').addEventListener('click', _ => minusPressed());
    document.getElementById('plusButton').addEventListener('click', _ => plusPressed());
    document.getElementById('resetButton').addEventListener('click', _ => resetPressed());
    document.getElementById('doneButton').addEventListener('click', _ => configDonePressed());
    document.getElementById('wrapCheckbox').checked = kernel.wrap;
    const sizeField = document.getElementById('sizeField');
    sizeField.value = puzzle.rows.toString();
    sizeField.addEventListener('blur', _ => sizeEdited());
    sizeEdited();
    const canvas = document.getElementById('kernel-canvas');
    canvas.height = BUTTON_SIZE * kernel.rows;
    canvas.width = BUTTON_SIZE * kernel.cols;
    canvas.addEventListener('click', e => kernelCanvasClicked(toButtonCoordinates(canvas, e)));
    canvas.addEventListener('blur', _ => kernelCanvasExited());
    canvas.addEventListener('mouseenter', e => kernelCanvasHovered(toButtonCoordinates(canvas, e)));
    canvas.addEventListener('mousemove', e => kernelCanvasHovered(toButtonCoordinates(canvas, e)));
    canvas.addEventListener('mouseleave', _ => kernelCanvasExited());
    renderKernel();
}
function parseSizeField(sizeField) {
    let value = parseInt(sizeField.value);
    if (isNaN(value)) {
        value = INITIAL_PUZZLE_SIZE;
    }
    else {
        value = Math.min(MAX_PUZZLE_SIZE, Math.max(MIN_PUZZLE_SIZE, value));
    }
    return value;
}
function enableSizeButtons(value) {
    document.getElementById('minusButton').disabled = value <= MIN_PUZZLE_SIZE;
    document.getElementById('plusButton').disabled = value >= MAX_PUZZLE_SIZE;
}
function sizeEdited() {
    const sizeField = document.getElementById('sizeField');
    const value = parseSizeField(sizeField);
    enableSizeButtons(value);
    sizeField.value = value.toString();
}
function minusPressed() {
    const sizeField = document.getElementById('sizeField');
    const value = Math.max(MIN_PUZZLE_SIZE, parseSizeField(sizeField) - 1);
    enableSizeButtons(value);
    sizeField.value = value.toString();
}
function plusPressed() {
    const sizeField = document.getElementById('sizeField');
    const value = Math.min(MAX_PUZZLE_SIZE, parseSizeField(sizeField) + 1);
    enableSizeButtons(value);
    sizeField.value = value.toString();
}
function resetPressed() {
    document.getElementById('sizeField').value = INITIAL_PUZZLE_SIZE.toString();
    enableSizeButtons(INITIAL_PUZZLE_SIZE);
    kernel = new Kernel();
    document.getElementById('wrapCheckbox').checked = kernel.wrap;
    renderKernel();
}
function configDonePressed() {
    const size = parseSizeField(document.getElementById('sizeField'));
    kernel = new Kernel(document.getElementById('wrapCheckbox').checked, kernel);
    puzzle = new Puzzle(kernel, size, size).mix();
    showPuzzle();
}
function kernelCanvasClicked(b) {
    kernel.entries[b.row][b.col] = !kernel.entries[b.row][b.col];
    renderKernel();
}
function kernelCanvasHovered(b) {
    hover = b;
    renderKernel();
}
function kernelCanvasExited() {
    hover = null;
    renderKernel();
}
function showPuzzle() {
    solution = null;
    document.getElementById('main-container').innerHTML = panels.puzzle;
    showPuzzleOperations();
    initPuzzleCanvas();
    renderPuzzle();
}
function showPuzzleOperations() {
    state = State.PLAYING;
    hover = null;
    document.getElementById('puzzle-ops').innerHTML = panels.puzzleOps;
    document.getElementById('mixButton').addEventListener('click', _ => mixPressed());
    document.getElementById('solveButton').addEventListener('click', _ => solvePressed());
    document.getElementById('editButton').addEventListener('click', _ => editPressed());
    document.getElementById('configButton').addEventListener('click', _ => configPressed());
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
    }
    else {
        provisionallyClearSolution();
    }
    renderPuzzle();
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
    showConfig();
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
    canvas.height = BUTTON_SIZE * puzzle.rows;
    canvas.width = BUTTON_SIZE * puzzle.cols;
    canvas.addEventListener('click', e => puzzleCanvasClicked(toButtonCoordinates(canvas, e)));
    canvas.addEventListener('blur', _ => puzzleCanvasExited());
    canvas.addEventListener('mouseenter', e => puzzleCanvasHovered(toButtonCoordinates(canvas, e)));
    canvas.addEventListener('mousemove', e => puzzleCanvasHovered(toButtonCoordinates(canvas, e)));
    canvas.addEventListener('mouseleave', _ => puzzleCanvasExited());
}
function provisionallyClearSolution() {
    if (solution === null) {
        return;
    }
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
function puzzleCanvasClicked(b) {
    if (state == State.PLAYING) {
        puzzle.pushButton(b.row, b.col);
    }
    else {
        puzzle.entries[b.row][b.col] = !puzzle.entries[b.row][b.col];
    }
    if (solution !== null) {
        solution[b.row][b.col] = !solution[b.row][b.col];
        provisionallyClearSolution();
    }
    renderPuzzle();
}
function puzzleCanvasHovered(b) {
    hover = b;
    renderPuzzle();
}
function puzzleCanvasExited() {
    hover = null;
    renderPuzzle();
}
function renderPuzzle() {
    render('puzzle-canvas', puzzle);
}
function renderKernel() {
    render('kernel-canvas', kernel);
}
function render(canvasId, matrix) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = window.getComputedStyle(document.body).backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = matrix.rows - 1; i >= 0; --i) {
        for (let j = matrix.cols - 1; j >= 0; --j) {
            const h = (hover && i == hover.row && j == hover.col) ? 1 : 0;
            ctx.drawImage(matrix.entries[i][j] ? pinkButtonImages[h] : purpleButtonImages[h], 1 + BUTTON_SIZE * j, 1 + BUTTON_SIZE * i);
            if (solution === null || !solution[i][j]) {
                continue;
            }
            ctx.drawImage(plusImages[h], 13 + BUTTON_SIZE * j, 13 + BUTTON_SIZE * i);
        }
    }
}
async function loadPanels() {
    await Promise.all(Object.keys(panels).map(async (key) => {
        const response = await fetch(`${panels[key]}.html`);
        if (response.ok) {
            panels[key] = await response.text();
        }
    }));
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
    await loadPanels();
    pinkButtonImages[0] = await loadImage('button-pink.svg');
    pinkButtonImages[1] = await loadImage('button-dark-pink.svg');
    purpleButtonImages[0] = await loadImage('button-purple.svg');
    purpleButtonImages[1] = await loadImage('button-dark-purple.svg');
    plusImages[0] = await loadImage('plus.svg');
    plusImages[1] = await loadImage('dark-plus.svg');
    showPuzzle();
}
document.addEventListener('DOMContentLoaded', init);
//# sourceMappingURL=main.js.map