import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const targets = [join(root, 'index.html')];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (/\.(?:[cm]?[jt]sx?|css|html)$/.test(entry.name)) targets.push(path);
  }
}
await walk(join(root, 'src'));
const forbidden = [
  { label: 'em dash', test: /—/u },
  { label: 'emoji', test: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u },
  { label: 'hype wording', test: /\b(seamlessly|supercharge|revolutionize|elevate|unlock|game-changer|cutting-edge|next-level|in today's fast-paced world)\b/i },
  { label: 'purple or violet', test: /\b(purple|violet)\b/i },
  { label: 'rounded-full', test: /rounded-full/ },
];
const failures = [];
for (const file of targets) {
  const lines = (await readFile(file, 'utf8')).split('\n');
  lines.forEach((line, index) => {
    forbidden.forEach(({ label, test }) => { if (test.test(line)) failures.push(`${file}:${index + 1} ${label}`); });
    if (/(?:linear|radial|conic)-gradient/.test(line) && !line.includes('ban-ok')) failures.push(`${file}:${index + 1} unapproved gradient`);
  });
}
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
