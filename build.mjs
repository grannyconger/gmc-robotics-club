import { mkdir, copyFile, rm } from 'node:fs/promises';
const publicFiles = ['index.html', 'faq.html', 'calendar.html', 'styles.css', 'config.js', 'script.js', 'favicon.svg'];
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
for (const file of publicFiles) await copyFile(file, `dist/${file}`);
console.log(`Built ${publicFiles.length} public files in dist/`);
