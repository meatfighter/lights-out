

// TODO TESTING
async function loadImage(imageUrl: string): Promise<HTMLImageElement> {
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
    const canvas = document.getElementById('lights-out-canvas') as HTMLCanvasElement | null;
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