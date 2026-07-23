import { promises as fs } from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';

const outputPath = path.resolve('public_html', 'lights-out.zip');
const sourceDirs = ['html', 'images'];

async function addPath(zip, absolutePath, zipPath) {
    const stats = await fs.stat(absolutePath);

    if (stats.isDirectory()) {
        const entries = await fs.readdir(absolutePath);
        if (entries.length === 0) {
            zip.folder(zipPath);
            return;
        }

        for (const entry of entries) {
            await addPath(zip, path.join(absolutePath, entry), path.posix.join(zipPath, entry));
        }
        return;
    }

    if (stats.isFile()) {
        zip.file(zipPath, await fs.readFile(absolutePath));
    }
}

const zip = new JSZip();

for (const sourceDir of sourceDirs) {
    await addPath(zip, path.resolve(sourceDir), sourceDir);
}

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
}));
