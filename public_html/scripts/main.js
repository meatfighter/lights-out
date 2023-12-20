import { Kernel, Puzzle } from './lights-out.js';
let purpleButtonImage;
let pinkButtonImage;
let plusImage;
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
    pinkButtonImage = await loadImage('button-pink.svg');
    purpleButtonImage = await loadImage('button-purple.svg');
    plusImage = await loadImage('plus.svg');
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
    const puzzle = new Puzzle(new Kernel(), 5, 5);
    puzzle.mix();
    const solution = puzzle.solve();
    if (solution == null) {
        return; // WHAT?!
    }
    for (let i = 0; i < 5; ++i) {
        for (let j = 0; j < 5; ++j) {
            ctx.drawImage(puzzle.entries[i][j] ? pinkButtonImage : purpleButtonImage, 1 + 50 * i, 1 + 50 * j);
            if (solution[i][j]) {
                ctx.drawImage(plusImage, 13 + 50 * i, 13 + 50 * j);
            }
        }
    }
}
document.addEventListener('DOMContentLoaded', init);
//# sourceMappingURL=main.js.map