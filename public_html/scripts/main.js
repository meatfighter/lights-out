import { Kernel, Puzzle } from './lights-out.js';
const BUTTON_SIZE = 50;
let kernel = new Kernel();
let puzzle = new Puzzle(kernel, 10, 10).mix();
let purpleButtonImages = new Array(2);
let pinkButtonImages = new Array(2);
let plusImages = new Array(2);
let hoverRow = -1;
let hoverCol = -1;
function addLightsOutCanvasListeners() {
    const canvas = document.getElementById('lights-out-canvas');
    if (canvas === null) {
        return; // TODO HANDLE ERROR
    }
    canvas.addEventListener('click', e => {
        const rect = canvas.getBoundingClientRect();
        handleLightsOutCanvasClick((e.clientX - rect.left) * canvas.width / rect.width, (e.clientY - rect.top) * canvas.height / rect.height);
    });
    canvas.addEventListener('mouseenter', e => {
        const rect = canvas.getBoundingClientRect();
        handleLightsOutCanvasMove((e.clientX - rect.left) * canvas.width / rect.width, (e.clientY - rect.top) * canvas.height / rect.height);
    });
    canvas.addEventListener('mousemove', e => {
        const rect = canvas.getBoundingClientRect();
        handleLightsOutCanvasMove((e.clientX - rect.left) * canvas.width / rect.width, (e.clientY - rect.top) * canvas.height / rect.height);
    });
    canvas.addEventListener('mouseleave', e => handleLightsOutCanvasExit());
}
function handleLightsOutCanvasClick(x, y) {
    puzzle.pushButton(Math.floor(y / BUTTON_SIZE), Math.floor(x / BUTTON_SIZE));
    renderPuzzle();
}
function handleLightsOutCanvasMove(x, y) {
    hoverRow = Math.floor(y / BUTTON_SIZE);
    hoverCol = Math.floor(x / BUTTON_SIZE);
    renderPuzzle();
}
function handleLightsOutCanvasExit() {
    hoverRow = -1;
    hoverCol = -1;
    renderPuzzle();
}
function renderPuzzle() {
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
    for (let i = puzzle.rows - 1; i >= 0; --i) {
        for (let j = puzzle.cols - 1; j >= 0; --j) {
            const hover = (i == hoverRow && j == hoverCol) ? 1 : 0;
            ctx.drawImage(puzzle.entries[i][j] ? pinkButtonImages[hover] : purpleButtonImages[hover], 1 + BUTTON_SIZE * j, 1 + BUTTON_SIZE * i);
        }
    }
}
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
    pinkButtonImages[0] = await loadImage('button-pink.svg');
    pinkButtonImages[1] = await loadImage('button-dark-pink.svg');
    purpleButtonImages[0] = await loadImage('button-purple.svg');
    purpleButtonImages[1] = await loadImage('button-dark-purple.svg');
    plusImages[0] = await loadImage('plus.svg');
    plusImages[1] = await loadImage('dark-plus.svg');
    addLightsOutCanvasListeners();
    renderPuzzle();
}
document.addEventListener('DOMContentLoaded', init);
//# sourceMappingURL=main.js.map