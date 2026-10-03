import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';

const input = './creatorai_story_48fps.mp4';
if (!existsSync(input)) throw new Error(`Missing ${input}`);
mkdirSync('public/story/desktop', { recursive: true });
mkdirSync('public/story/mobile', { recursive: true });
const run = (args) => { const result = spawnSync(ffmpegPath, args, { stdio: 'inherit' }); if (result.status !== 0) throw new Error('Frame extraction failed'); };
run(['-y', '-i', input, '-vf', 'scale=1280:720', '-q:v', '80', 'public/story/desktop/f_%03d.webp']);
run(['-y', '-i', input, '-vf', 'scale=854:480', '-q:v', '78', 'public/story/mobile/f_%03d.webp']);
run(['-y', '-i', input, '-frames:v', '1', '-q:v', '80', 'public/story/poster.webp']);
writeFileSync('public/story/manifest.json', JSON.stringify({ count: 408, fps: 48, desktop: [1280, 720], mobile: [854, 480] }, null, 2));
