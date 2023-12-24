import JSZip from 'jszip';
import { Kernel, Puzzle } from './puzzle';

const BUTTON_SIZE = 50;
const MIN_PUZZLE_SIZE = 3;
const INITIAL_PUZZLE_SIZE = 5;
const MAX_PUZZLE_SIZE = 10;
const SHAKE_MILLIS = 500;
const MAX_FETCH_RETRIES = 5;
const ZIP_DOWNLOAD_PERCENT = 90;

interface ButtonCoordinates {
    row: number;
    col: number;
}

interface KeyValueObject {
    [ key: string ]: string;
}

const panels: KeyValueObject = {
    main: 'main-panel',
    puzzle: 'puzzle-panel',
    puzzleOps: 'puzzle-ops-panel',
    puzzleEdit: 'puzzle-edit-panel',
    config: 'config-panel'
};

const purpleButtonImages: HTMLImageElement[] = new Array(2);
const pinkButtonImages: HTMLImageElement[] = new Array(2);
const plusImages: HTMLImageElement[] = new Array(2);

let kernel = new Kernel();
let puzzle = new Puzzle(kernel, INITIAL_PUZZLE_SIZE, INITIAL_PUZZLE_SIZE).mix();

let hover: ButtonCoordinates | null = null;

let solution: boolean[][] | null = null;

let shaking = false;
let editing = false;

async function downloadFile(url: string) {
    const progressBar = document.getElementById('loading-progress') as HTMLProgressElement;
    for (let i = MAX_FETCH_RETRIES - 1; i >= 0; --i) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                continue;
            }
            const contentLengthStr = response.headers.get('Content-Length');
            if (!contentLengthStr) {
                continue;
            }
            const contentLength = parseInt(contentLengthStr);
            if (isNaN(contentLength) || contentLength <= 0) {
                continue;
            }
            const body = response.body;
            if (body === null) {
                continue;
            }

            const reader = body.getReader();
            const chunks = [];
            let bytesReceived = 0;
            while (true) {
                const { done, value: chunk } = await reader.read();
                if (done) {
                    break;
                }
                chunks.push(chunk);
                bytesReceived += chunk.length;
                progressBar.value = ZIP_DOWNLOAD_PERCENT * bytesReceived / contentLength;
            }

            const uint8Array = new Uint8Array(bytesReceived);
            let position = 0;
            chunks.forEach(chunk => {
                uint8Array.set(chunk, position);
                position += chunk.length;
            });

            return uint8Array;
        } catch (error) {
            if (i === 0) {
                throw error;
            }
        }
    }
    throw new Error("Failed to fetch.");
}

async function convertSvgToImage(svgContent: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = `data:image/svg+xml; charset=utf8, ${encodeURIComponent(svgContent)}`;
    });
}

async function processZip(arrayBuffer: Uint8Array) {

    const progressBar = document.getElementById('loading-progress') as HTMLProgressElement;
    const zip = new JSZip();
    const entries = Object.entries((await zip.loadAsync(arrayBuffer)).files);

    for (let i = 0; i < entries.length; ++i) {
        const [ filename, fileData ] = entries[i];
        if (fileData.dir) {
            continue;
        }
        const data = await fileData.async("string");
        if (filename.endsWith('.svg')) {
            (filename.includes('pink') ? pinkButtonImages : filename.includes('purple')
                ? purpleButtonImages : plusImages)[filename.includes('dark') ? 1 : 0] = await convertSvgToImage(data);
            continue;
        }

        Object.entries(panels).forEach(([key, value]) => {
            if (filename === `html/${value}.html`) {
                panels[key] = data;
            }
        });
        progressBar.value = ZIP_DOWNLOAD_PERCENT + (100 - ZIP_DOWNLOAD_PERCENT) * i / (entries.length - 1);
    }
}

function isTouchscreenDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints;
}

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
    editing = true;
    hover = null;
    solution = null;
    const puzzleOpsDiv = document.getElementById('puzzle-ops') as HTMLDivElement;
    puzzleOpsDiv.innerHTML = panels.puzzleEdit;
    (document.getElementById('fillButton') as HTMLButtonElement).addEventListener('click', _ => fillPressed());
    (document.getElementById('clearButton') as HTMLButtonElement).addEventListener('click', _ => clearPressed());
    (document.getElementById('doneButton') as HTMLButtonElement).addEventListener('click', _ => editDonePressed());
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
    editing = false;
    hover = null;
    solution = null;
    (document.getElementById('main-container') as HTMLDivElement).innerHTML = panels.config;
    (document.getElementById('minusButton') as HTMLButtonElement).addEventListener('click', _ => minusPressed());
    (document.getElementById('plusButton') as HTMLButtonElement).addEventListener('click', _ => plusPressed());
    (document.getElementById('resetButton') as HTMLButtonElement).addEventListener('click', _ => resetPressed());
    (document.getElementById('doneButton') as HTMLButtonElement).addEventListener('click', _ => configDonePressed());
    (document.getElementById('wrapCheckbox') as HTMLInputElement).checked = kernel.wrap;
    const sizeField = document.getElementById('sizeField') as HTMLInputElement;
    sizeField.value = puzzle.rows.toString();
    sizeField.addEventListener('blur', _ => sizeEdited());
    sizeEdited();
    const canvas = document.getElementById('kernel-canvas') as HTMLCanvasElement;
    canvas.height = BUTTON_SIZE * kernel.rows;
    canvas.width = BUTTON_SIZE * kernel.cols;
    canvas.addEventListener('click', e => kernelCanvasClicked(toButtonCoordinates(canvas, e)));
    canvas.addEventListener('blur', _ => kernelCanvasExited());
    canvas.addEventListener('mouseenter', e => kernelCanvasHovered(toButtonCoordinates(canvas, e)));
    canvas.addEventListener('mousemove', e => kernelCanvasHovered(toButtonCoordinates(canvas, e)));
    canvas.addEventListener('mouseleave', _ => kernelCanvasExited());
    renderKernel();
}

function parseSizeField(sizeField: HTMLInputElement) {
    let value = parseInt(sizeField.value);
    if (isNaN(value)) {
        value = INITIAL_PUZZLE_SIZE;
    } else {
        value = Math.min(MAX_PUZZLE_SIZE, Math.max(MIN_PUZZLE_SIZE, value));
    }
    return value;
}

function enableSizeButtons(value: number) {
    (document.getElementById('minusButton') as HTMLButtonElement).disabled = value <= MIN_PUZZLE_SIZE;
    (document.getElementById('plusButton') as HTMLButtonElement).disabled = value >= MAX_PUZZLE_SIZE;
}

function sizeEdited() {
    const sizeField = document.getElementById('sizeField') as HTMLInputElement;
    const value = parseSizeField(sizeField);
    enableSizeButtons(value);
    sizeField.value = value.toString();
}

function minusPressed() {
    const sizeField = document.getElementById('sizeField') as HTMLInputElement;
    const value = Math.max(MIN_PUZZLE_SIZE, parseSizeField(sizeField) - 1);
    enableSizeButtons(value);
    sizeField.value = value.toString();
}

function plusPressed() {
    const sizeField = document.getElementById('sizeField') as HTMLInputElement;
    const value = Math.min(MAX_PUZZLE_SIZE, parseSizeField(sizeField) + 1);
    enableSizeButtons(value);
    sizeField.value = value.toString();
}

function resetPressed() {
    (document.getElementById('sizeField') as HTMLInputElement).value = INITIAL_PUZZLE_SIZE.toString();
    enableSizeButtons(INITIAL_PUZZLE_SIZE);
    kernel = new Kernel();
    (document.getElementById('wrapCheckbox') as HTMLInputElement).checked = kernel.wrap;
    renderKernel();
}

function configDonePressed() {
    const size = parseSizeField(document.getElementById('sizeField') as HTMLInputElement);
    kernel = new Kernel((document.getElementById('wrapCheckbox') as HTMLInputElement).checked, kernel);
    puzzle = new Puzzle(kernel, size, size).mix();
    showPuzzle();
}

function kernelCanvasClicked(b: ButtonCoordinates) {
    kernel.entries[b.row][b.col] = !kernel.entries[b.row][b.col];
    renderKernel();
}

function kernelCanvasHovered(b: ButtonCoordinates) {
    hover = b;
    renderKernel();
}

function kernelCanvasExited() {
    hover = null;
    renderKernel();
}

function showPuzzle() {
    solution = null;
    (document.getElementById('main-container') as HTMLDivElement).innerHTML = panels.puzzle;
    showPuzzleOperations();
    initPuzzleCanvas();
    renderPuzzle();
}

function showPuzzleOperations() {
    editing = false;
    hover = null;
    (document.getElementById('puzzle-ops') as HTMLDivElement).innerHTML = panels.puzzleOps;
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

function puzzleCanvasClicked(b: ButtonCoordinates) {
    if (editing) {
        puzzle.entries[b.row][b.col] = !puzzle.entries[b.row][b.col];
    } else {
        puzzle.pushButton(b.row, b.col);
    }
    if (solution !== null) {
        solution[b.row][b.col] = !solution[b.row][b.col];
        provisionallyClearSolution();
    }
    renderPuzzle();
}

function puzzleCanvasHovered(b: ButtonCoordinates) {
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

function render(canvasId: string, matrix: Puzzle | Kernel) {
    const mouse = !isTouchscreenDevice();
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    ctx.fillStyle = window.getComputedStyle(document.body).backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = matrix.rows - 1; i >= 0; --i) {
        for (let j = matrix.cols - 1; j >= 0; --j) {
            const h = (mouse && hover && i == hover.row && j == hover.col) ? 1 : 0;
            ctx.drawImage(matrix.entries[i][j] ? pinkButtonImages[h] : purpleButtonImages[h],
                1 + BUTTON_SIZE * j, 1 + BUTTON_SIZE * i);
            if (solution === null || !solution[i][j]) {
                continue;
            }
            ctx.drawImage(plusImages[h], 13 + BUTTON_SIZE * j, 13 + BUTTON_SIZE * i);
        }
    }
}

function start() {
    (document.getElementById('main-content') as HTMLElement).innerHTML = panels.main;
    showPuzzle();
}

function showFatalError() {
    (document.getElementById('main-content') as HTMLElement).innerHTML = '<span id="fatal-error">&#x1F480;</span>';
}

function init() {
    downloadFile('lights-out.zip').then(processZip).then(start).catch(showFatalError);
}

document.addEventListener('DOMContentLoaded', init);